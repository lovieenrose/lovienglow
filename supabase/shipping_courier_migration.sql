-- Invory: courier selection + who-pays-for-shipping on POS sales, and a fix
-- for a regression from product_batch_costing_migration.sql, which
-- accidentally dropped the `p_shipping_fee` parameter from complete_sale
-- entirely (the frontend still sends it — checkout would fail with that
-- migration applied on its own).
-- Paste this entire file into the Supabase SQL editor and run it AFTER
-- product_batch_costing_migration.sql. Safe to re-run.
--
-- Design: shipping_fee is recorded on the order for reference (which
-- courier, how much) but is NEVER added into subtotal/total — regardless of
-- who pays it:
--   * 'customer' — they pay the rider/courier directly (e.g. COD); it never
--     passes through this business's hands, so it isn't revenue.
--   * 'business' — free shipping for the customer; checkout also logs it as
--     an Expense (category "Shipping") so it correctly reduces Net Profit,
--     instead of just vanishing from the books.

alter table sales_orders add column if not exists courier text;
alter table sales_orders add column if not exists shipping_paid_by text not null default 'customer';
alter table sales_orders drop constraint if exists sales_orders_shipping_paid_by_check;
alter table sales_orders add constraint sales_orders_shipping_paid_by_check
  check (shipping_paid_by in ('customer', 'business'));

create or replace function complete_sale(
  p_customer_name      text,
  p_customer_contact   text,
  p_discount           numeric,
  p_payment_method     text,
  p_items              jsonb,
  p_shipping_fee       numeric default 0,
  p_courier            text default null,
  p_shipping_paid_by   text default 'customer'
)
returns sales_orders
language plpgsql
security invoker
as $$
declare
  v_owner_id       uuid := auth.uid();
  v_order_number   text;
  v_next_number    integer;
  v_order          sales_orders;
  v_item           jsonb;
  v_product        products;
  v_quantity       integer;
  v_unit_price     numeric(12,2);
  v_unit_cost_used numeric(12,2);
  v_line_revenue   numeric(12,2);
  v_line_cost      numeric(12,2);
  v_line_profit    numeric(12,2);
  v_subtotal       numeric(12,2) := 0;
  v_total_cost     numeric(12,2) := 0;
  v_new_qty        integer;
  v_batch_count    integer;
  v_remaining      integer;
  v_take           integer;
  v_batch          record;
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
    shipping_fee, courier, shipping_paid_by
  ) values (
    v_owner_id, v_order_number, p_customer_name, p_customer_contact,
    0, coalesce(p_discount, 0), 0, 0, 0, 0, coalesce(p_payment_method, 'cash'),
    coalesce(p_shipping_fee, 0), p_courier, coalesce(p_shipping_paid_by, 'customer')
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

    select count(*) into v_batch_count
    from product_batches
    where product_id = v_product.id and owner_id = v_owner_id;

    if v_batch_count > 0 then
      -- FIFO: deduct from the oldest batches first, accumulating the exact
      -- cost of whatever's actually taken from each one (so a sale that
      -- spans two batches at two different costs still gets a correct,
      -- weighted-average unit cost and total COGS for the line).
      v_remaining := v_quantity;
      v_line_cost := 0;
      for v_batch in
        select id, quantity, cost_price
        from product_batches
        where product_id = v_product.id and owner_id = v_owner_id and quantity > 0
        order by created_at asc
        for update
      loop
        exit when v_remaining <= 0;
        v_take := least(v_batch.quantity, v_remaining);
        v_line_cost := v_line_cost + v_take * v_batch.cost_price;
        update product_batches set quantity = quantity - v_take where id = v_batch.id;
        v_remaining := v_remaining - v_take;
      end loop;

      if v_remaining > 0 then
        raise exception 'insufficient batch stock for %: short by %', v_product.name, v_remaining;
      end if;

      v_unit_cost_used := round(v_line_cost / v_quantity, 2);

      -- The product_batches sync trigger already recomputed products.stock_quantity.
      select stock_quantity into v_new_qty from products where id = v_product.id and owner_id = v_owner_id;
    else
      v_unit_cost_used := v_product.cost_price;
      v_line_cost := v_product.cost_price * v_quantity;
      v_new_qty := v_product.stock_quantity - v_quantity;

      update products
      set stock_quantity = v_new_qty
      where id = v_product.id and owner_id = v_owner_id;
    end if;

    v_line_revenue := v_unit_price * v_quantity;
    v_line_profit := v_line_revenue - v_line_cost;

    v_subtotal := v_subtotal + v_line_revenue;
    v_total_cost := v_total_cost + v_line_cost;

    insert into sales_order_items (
      owner_id, sales_order_id, product_id, product_name, sku,
      quantity, unit_cost, unit_price, line_cost, line_revenue, line_profit
    ) values (
      v_owner_id, v_order.id, v_product.id, v_product.name, v_product.sku,
      v_quantity, v_unit_cost_used, v_unit_price, v_line_cost, v_line_revenue, v_line_profit
    );

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
