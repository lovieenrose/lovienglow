-- LovieNGlow: Batch/Lot Tracking for products.
-- Paste this entire file into the Supabase SQL editor and run it AFTER
-- inventory_migration.sql and pos_upgrade_migration.sql. Safe to re-run.
--
-- Design:
--   * A product with zero product_batches rows keeps today's behavior:
--     products.stock_quantity is the single source of truth, managed by
--     "Adjust Stock", purchase-order receiving, and POS sales, exactly as
--     before.
--   * The moment a product gets its first batch row, it becomes
--     "batch-tracked": a trigger recomputes products.stock_quantity as
--     sum(product_batches.quantity) for that product on every batch
--     insert/update/delete, so the global stock column is always in sync
--     and every other part of the app (inventory value, low-stock alerts,
--     POS cart limits, dashboard metrics) keeps working unmodified.
--   * POS sales (complete_sale) deduct FIFO — oldest batch (by created_at)
--     first — for batch-tracked products, and fall back to the legacy
--     direct decrement for products with no batches.
--   * Receiving a purchase order for a batch-tracked product creates a new
--     "Received <date>" batch instead of bumping stock_quantity directly,
--     so the trigger-derived total never gets silently overwritten.

create table if not exists product_batches (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references auth.users(id) on delete cascade,
  product_id       uuid not null references products(id) on delete cascade,
  batch_name       text not null,
  quantity         integer not null default 0 check (quantity >= 0),
  expiration_date  date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_product_batches_owner_created
  on product_batches (owner_id, created_at desc);
create index if not exists idx_product_batches_product_id
  on product_batches (product_id, created_at asc);

drop trigger if exists trg_product_batches_updated_at on product_batches;
create trigger trg_product_batches_updated_at
  before update on product_batches
  for each row execute function set_updated_at();

alter table product_batches enable row level security;
drop policy if exists owner_can_access on product_batches;
create policy owner_can_access on product_batches
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ── Keep products.stock_quantity synced to sum(batch quantities) ─────────
create or replace function sync_product_stock_from_batches()
returns trigger
language plpgsql
security invoker
as $$
declare
  v_product_id uuid := coalesce(new.product_id, old.product_id);
  v_owner_id   uuid := coalesce(new.owner_id, old.owner_id);
  v_total      integer;
begin
  select coalesce(sum(quantity), 0) into v_total
  from product_batches
  where product_id = v_product_id and owner_id = v_owner_id;

  update products
  set stock_quantity = v_total
  where id = v_product_id and owner_id = v_owner_id;

  return null;
end;
$$;

drop trigger if exists trg_sync_product_stock_from_batches on product_batches;
create trigger trg_sync_product_stock_from_batches
  after insert or update or delete on product_batches
  for each row execute function sync_product_stock_from_batches();

-- ── stock_adjustments: allow a 'batch' source for the audit trail ────────
alter table stock_adjustments drop constraint if exists stock_adjustments_source_check;
alter table stock_adjustments add constraint stock_adjustments_source_check
  check (source in ('manual', 'purchase_order', 'sale_order', 'batch'));

-- ── complete_sale: FIFO batch deduction when a product is batch-tracked ──
create or replace function complete_sale(
  p_customer_name    text,
  p_customer_contact text,
  p_discount         numeric,
  p_payment_method   text,
  p_items            jsonb
)
returns sales_orders
language plpgsql
security invoker
as $$
declare
  v_owner_id      uuid := auth.uid();
  v_order_number  text;
  v_next_number   integer;
  v_order         sales_orders;
  v_item          jsonb;
  v_product       products;
  v_quantity      integer;
  v_unit_price    numeric(12,2);
  v_line_revenue  numeric(12,2);
  v_line_cost     numeric(12,2);
  v_line_profit   numeric(12,2);
  v_subtotal      numeric(12,2) := 0;
  v_total_cost    numeric(12,2) := 0;
  v_new_qty       integer;
  v_batch_count   integer;
  v_remaining     integer;
  v_take          integer;
  v_batch         record;
begin
  if v_owner_id is null then
    raise exception 'not authenticated';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'sale must contain at least one item';
  end if;

  insert into order_number_counters (owner_id, next_number)
  values (v_owner_id, 1)
  on conflict (owner_id) do nothing;

  update order_number_counters
  set next_number = next_number + 1
  where owner_id = v_owner_id
  returning next_number - 1 into v_next_number;

  v_order_number := 'SO-' || lpad(v_next_number::text, 6, '0');

  insert into sales_orders (
    owner_id, order_number, customer_name, customer_contact,
    subtotal, discount, total, total_cost, gross_profit, margin_pct, payment_method
  ) values (
    v_owner_id, v_order_number, p_customer_name, p_customer_contact,
    0, coalesce(p_discount, 0), 0, 0, 0, 0, coalesce(p_payment_method, 'cash')
  )
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product
    from products
    where id = (v_item->>'product_id')::uuid and owner_id = v_owner_id
    for update;

    if not found then
      raise exception 'product % not found', v_item->>'product_id';
    end if;

    v_quantity := (v_item->>'quantity')::integer;
    v_unit_price := coalesce((v_item->>'unit_price')::numeric(12,2), v_product.selling_price);

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'invalid quantity for product %', v_product.name;
    end if;
    if v_product.stock_quantity < v_quantity then
      raise exception 'insufficient stock for %: have %, need %',
        v_product.name, v_product.stock_quantity, v_quantity;
    end if;

    v_line_revenue := v_unit_price * v_quantity;
    v_line_cost := v_product.cost_price * v_quantity;
    v_line_profit := v_line_revenue - v_line_cost;

    v_subtotal := v_subtotal + v_line_revenue;
    v_total_cost := v_total_cost + v_line_cost;

    insert into sales_order_items (
      owner_id, sales_order_id, product_id, product_name, sku,
      quantity, unit_cost, unit_price, line_cost, line_revenue, line_profit
    ) values (
      v_owner_id, v_order.id, v_product.id, v_product.name, v_product.sku,
      v_quantity, v_product.cost_price, v_unit_price, v_line_cost, v_line_revenue, v_line_profit
    );

    select count(*) into v_batch_count
    from product_batches
    where product_id = v_product.id and owner_id = v_owner_id;

    if v_batch_count > 0 then
      -- FIFO: deduct from the oldest batches first.
      v_remaining := v_quantity;
      for v_batch in
        select id, quantity
        from product_batches
        where product_id = v_product.id and owner_id = v_owner_id and quantity > 0
        order by created_at asc
        for update
      loop
        exit when v_remaining <= 0;
        v_take := least(v_batch.quantity, v_remaining);
        update product_batches set quantity = quantity - v_take where id = v_batch.id;
        v_remaining := v_remaining - v_take;
      end loop;

      if v_remaining > 0 then
        raise exception 'insufficient batch stock for %: short by %', v_product.name, v_remaining;
      end if;

      -- The sync trigger above already recomputed products.stock_quantity.
      select stock_quantity into v_new_qty from products where id = v_product.id and owner_id = v_owner_id;
    else
      v_new_qty := v_product.stock_quantity - v_quantity;

      update products
      set stock_quantity = v_new_qty
      where id = v_product.id and owner_id = v_owner_id;
    end if;

    insert into stock_adjustments (
      owner_id, product_id, change, resulting_qty, reason, source, source_id
    ) values (
      v_owner_id, v_product.id, -v_quantity, v_new_qty, 'sale', 'sale_order', v_order.id
    );
  end loop;

  update sales_orders
  set
    subtotal = v_subtotal,
    total_cost = v_total_cost,
    total = greatest(v_subtotal - coalesce(p_discount, 0), 0),
    gross_profit = greatest(v_subtotal - coalesce(p_discount, 0), 0) - v_total_cost,
    margin_pct = case
      when greatest(v_subtotal - coalesce(p_discount, 0), 0) = 0 then 0
      else round(
        ((greatest(v_subtotal - coalesce(p_discount, 0), 0) - v_total_cost)
          / greatest(v_subtotal - coalesce(p_discount, 0), 0)) * 100, 2
      )
    end
  where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

-- ── receive_purchase_order: land received qty into a batch when tracked ──
create or replace function receive_purchase_order(
  p_purchase_order_id uuid,
  p_items             jsonb
)
returns purchase_orders
language plpgsql
security invoker
as $$
declare
  v_owner_id       uuid := auth.uid();
  v_po             purchase_orders;
  v_item           jsonb;
  v_po_item        purchase_order_items;
  v_qty_now        integer;
  v_new_received   integer;
  v_new_stock      integer;
  v_all_received   boolean;
  v_batch_count    integer;
begin
  if v_owner_id is null then
    raise exception 'not authenticated';
  end if;

  select * into v_po
  from purchase_orders
  where id = p_purchase_order_id and owner_id = v_owner_id
  for update;

  if not found then
    raise exception 'purchase order not found';
  end if;
  if v_po.status = 'cancelled' then
    raise exception 'cannot receive a cancelled purchase order';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_po_item
    from purchase_order_items
    where id = (v_item->>'purchase_order_item_id')::uuid
      and purchase_order_id = p_purchase_order_id
      and owner_id = v_owner_id
    for update;

    if not found then
      raise exception 'purchase order item % not found', v_item->>'purchase_order_item_id';
    end if;

    v_qty_now := (v_item->>'quantity_received_now')::integer;
    if v_qty_now is null or v_qty_now <= 0 then
      continue;
    end if;

    v_new_received := v_po_item.quantity_received + v_qty_now;
    if v_new_received > v_po_item.quantity_ordered then
      raise exception 'cannot receive more than ordered for item %', v_po_item.id;
    end if;

    update purchase_order_items
    set quantity_received = v_new_received
    where id = v_po_item.id;

    select count(*) into v_batch_count
    from product_batches
    where product_id = v_po_item.product_id and owner_id = v_owner_id;

    if v_batch_count > 0 then
      insert into product_batches (owner_id, product_id, batch_name, quantity)
      values (v_owner_id, v_po_item.product_id, 'Received ' || to_char(now(), 'Mon DD, YYYY'), v_qty_now);

      -- The sync trigger already recomputed products.stock_quantity.
      select stock_quantity into v_new_stock from products where id = v_po_item.product_id and owner_id = v_owner_id;
    else
      select stock_quantity + v_qty_now into v_new_stock
      from products
      where id = v_po_item.product_id and owner_id = v_owner_id
      for update;

      update products
      set stock_quantity = v_new_stock
      where id = v_po_item.product_id and owner_id = v_owner_id;
    end if;

    insert into stock_adjustments (
      owner_id, product_id, change, resulting_qty, reason, source, source_id
    ) values (
      v_owner_id, v_po_item.product_id, v_qty_now, v_new_stock,
      'purchase_received', 'purchase_order', p_purchase_order_id
    );
  end loop;

  select bool_and(quantity_received >= quantity_ordered) into v_all_received
  from purchase_order_items
  where purchase_order_id = p_purchase_order_id;

  update purchase_orders
  set
    status = case when v_all_received then 'received' else 'in_transit' end,
    received_at = case when v_all_received then now() else received_at end
  where id = p_purchase_order_id and owner_id = v_owner_id
  returning * into v_po;

  return v_po;
end;
$$;
