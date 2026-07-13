-- LovieNGlow Incoming Stock: deleting a purchase order now reverses any
-- stock it already added to inventory before removing the record.
-- Paste this entire file into the Supabase SQL editor and run it AFTER
-- inventory_migration.sql and pos_upgrade_migration.sql. Safe to re-run.

create or replace function delete_purchase_order(p_purchase_order_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  v_owner_id uuid := auth.uid();
  v_po       purchase_orders;
  v_item     purchase_order_items;
  v_new_qty  integer;
begin
  if v_owner_id is null then
    raise exception 'not authenticated';
  end if;

  select * into v_po from purchase_orders where id = p_purchase_order_id and owner_id = v_owner_id for update;
  if not found then
    raise exception 'purchase order not found';
  end if;

  for v_item in
    select * from purchase_order_items where purchase_order_id = p_purchase_order_id and owner_id = v_owner_id
  loop
    if v_item.quantity_received <= 0 then
      continue;
    end if;

    select greatest(0, stock_quantity - v_item.quantity_received) into v_new_qty
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
      v_owner_id, v_item.product_id, -v_item.quantity_received, v_new_qty,
      'purchase order deleted', 'purchase_order', p_purchase_order_id
    );
  end loop;

  delete from purchase_orders where id = p_purchase_order_id and owner_id = v_owner_id;
end;
$$;
