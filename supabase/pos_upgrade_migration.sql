-- LovieNGlow Sales/POS upgrade: awaiting-payment workflow, promo codes,
-- shipping fee, and sale reversal.
-- Paste this entire file into the Supabase SQL editor and run it AFTER
-- inventory_migration.sql. Safe to re-run.

-- ── sales_orders: status / receipt / shipping fee ────────────────────────
alter table sales_orders add column if not exists status text not null default 'awaiting_payment';
alter table sales_orders drop constraint if exists sales_orders_status_check;
alter table sales_orders add constraint sales_orders_status_check
  check (status in ('awaiting_payment', 'paid', 'reversed'));
alter table sales_orders add column if not exists receipt_url text;
alter table sales_orders add column if not exists paid_at timestamptz;
alter table sales_orders add column if not exists shipping_fee numeric(12,2) not null default 0;

create index if not exists idx_sales_orders_owner_status on sales_orders (owner_id, status);

-- ── business_profiles: invoice branding ──────────────────────────────────
alter table business_profiles add column if not exists invoice_banner_url text;

-- ── promos ────────────────────────────────────────────────────────────────
create table if not exists promos (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  code         text not null,
  reward_type  text not null check (reward_type in ('fixed_discount', 'percent_discount', 'free_item')),
  reward_value numeric(12,2) not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (owner_id, code)
);

create index if not exists idx_promos_owner_created on promos (owner_id, created_at desc);
create index if not exists idx_promos_owner_active on promos (owner_id, active);

drop trigger if exists trg_promos_updated_at on promos;
create trigger trg_promos_updated_at
  before update on promos
  for each row execute function set_updated_at();

create table if not exists promo_trigger_products (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  promo_id   uuid not null references promos(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (promo_id, product_id)
);

create index if not exists idx_promo_trigger_owner on promo_trigger_products (owner_id);
create index if not exists idx_promo_trigger_promo_id on promo_trigger_products (promo_id);
create index if not exists idx_promo_trigger_product_id on promo_trigger_products (product_id);

create table if not exists promo_reward_products (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  promo_id   uuid not null references promos(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (promo_id, product_id)
);

create index if not exists idx_promo_reward_owner on promo_reward_products (owner_id);
create index if not exists idx_promo_reward_promo_id on promo_reward_products (promo_id);
create index if not exists idx_promo_reward_product_id on promo_reward_products (product_id);

do $$
declare
  t text;
begin
  for t in select unnest(array['promos', 'promo_trigger_products', 'promo_reward_products'])
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists owner_can_access on %I', t);
    execute format(
      'create policy owner_can_access on %I for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())',
      t
    );
  end loop;
end $$;

-- ═══════════════════════════════════════════════════════════════════════
-- complete_sale: add shipping fee, start every sale as awaiting_payment
-- ═══════════════════════════════════════════════════════════════════════

drop function if exists complete_sale(text, text, numeric, text, jsonb);

create or replace function complete_sale(
  p_customer_name    text,
  p_customer_contact text,
  p_discount         numeric,
  p_payment_method   text,
  p_items            jsonb,
  p_shipping_fee     numeric default 0
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
  v_total         numeric(12,2);
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
    subtotal, discount, total, total_cost, gross_profit, margin_pct, payment_method,
    status, shipping_fee
  ) values (
    v_owner_id, v_order_number, p_customer_name, p_customer_contact,
    0, coalesce(p_discount, 0), 0, 0, 0, 0, coalesce(p_payment_method, 'cash'),
    'awaiting_payment', coalesce(p_shipping_fee, 0)
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

    v_new_qty := v_product.stock_quantity - v_quantity;

    update products
    set stock_quantity = v_new_qty
    where id = v_product.id and owner_id = v_owner_id;

    insert into stock_adjustments (
      owner_id, product_id, change, resulting_qty, reason, source, source_id
    ) values (
      v_owner_id, v_product.id, -v_quantity, v_new_qty, 'sale', 'sale_order', v_order.id
    );
  end loop;

  v_total := greatest(v_subtotal - coalesce(p_discount, 0), 0) + coalesce(p_shipping_fee, 0);

  update sales_orders
  set
    subtotal = v_subtotal,
    total_cost = v_total_cost,
    total = v_total,
    gross_profit = v_total - v_total_cost,
    margin_pct = case
      when v_total = 0 then 0
      else round(((v_total - v_total_cost) / v_total) * 100, 2)
    end
  where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- mark_sale_paid / reverse_sale
-- ═══════════════════════════════════════════════════════════════════════

create or replace function mark_sale_paid(
  p_sales_order_id uuid,
  p_receipt_url    text default null
)
returns sales_orders
language plpgsql
security invoker
as $$
declare
  v_owner_id uuid := auth.uid();
  v_order    sales_orders;
begin
  if v_owner_id is null then
    raise exception 'not authenticated';
  end if;

  select * into v_order from sales_orders where id = p_sales_order_id and owner_id = v_owner_id for update;
  if not found then
    raise exception 'sales order not found';
  end if;
  if v_order.status = 'reversed' then
    raise exception 'cannot mark a reversed sale as paid';
  end if;

  update sales_orders
  set status = 'paid', paid_at = now(), receipt_url = coalesce(p_receipt_url, receipt_url)
  where id = p_sales_order_id and owner_id = v_owner_id
  returning * into v_order;

  return v_order;
end;
$$;

create or replace function reverse_sale(p_sales_order_id uuid)
returns sales_orders
language plpgsql
security invoker
as $$
declare
  v_owner_id uuid := auth.uid();
  v_order    sales_orders;
  v_item     sales_order_items;
  v_new_qty  integer;
begin
  if v_owner_id is null then
    raise exception 'not authenticated';
  end if;

  select * into v_order from sales_orders where id = p_sales_order_id and owner_id = v_owner_id for update;
  if not found then
    raise exception 'sales order not found';
  end if;
  if v_order.status = 'reversed' then
    raise exception 'sale is already reversed';
  end if;

  for v_item in
    select * from sales_order_items where sales_order_id = p_sales_order_id and owner_id = v_owner_id
  loop
    if v_item.product_id is null then
      continue;
    end if;

    select stock_quantity + v_item.quantity into v_new_qty
    from products
    where id = v_item.product_id and owner_id = v_owner_id
    for update;

    if not found then
      continue;
    end if;

    update products set stock_quantity = v_new_qty where id = v_item.product_id and owner_id = v_owner_id;

    insert into stock_adjustments (
      owner_id, product_id, change, resulting_qty, reason, source, source_id
    ) values (
      v_owner_id, v_item.product_id, v_item.quantity, v_new_qty, 'sale reversed', 'sale_order', p_sales_order_id
    );
  end loop;

  update sales_orders set status = 'reversed' where id = p_sales_order_id and owner_id = v_owner_id
  returning * into v_order;

  return v_order;
end;
$$;
