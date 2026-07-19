-- LovieNGlow: permanently remove the "Packing Materials" category and its
-- 11 associated products (courier pouches, bubble mailers, corrugated boxes,
-- policy/sealing stickers) from every business (owner) that has them.
-- Paste this entire file into the Supabase SQL editor and run it.
-- Safe to re-run: every statement is a no-op once the rows are gone.
--
-- Foreign key handling:
--   * purchase_order_items.product_id is ON DELETE RESTRICT, so incoming-
--     stock line items referencing these products are deleted explicitly
--     below (otherwise the product delete would fail outright).
--   * stock_adjustments.product_id and product_set_items.product_id are
--     ON DELETE CASCADE, so their rows (stock/audit log entries, POS bundle
--     memberships) are removed automatically when the product is deleted.
--   * sales_order_items.product_id is ON DELETE SET NULL, so past sales
--     transaction history is preserved intact (product_name/sku are already
--     denormalized onto the row) and just loses its product_id link.

begin;

do $$
declare
  v_product_ids        uuid[];
  v_po_items_deleted    integer;
  v_products_deleted    integer;
  v_categories_deleted  integer;
begin
  -- Match by SKU (authoritative — these 11 SKUs are the packing/shipping
  -- supply items) OR by belonging to a category literally named
  -- "Packing Materials" (case-insensitive), so this still works even if a
  -- product's category link was already nulled out.
  select array_agg(id) into v_product_ids
  from products
  where sku in (
    'PCH-COU-BLK-L-PC', 'BBL-MLR-PNK-L-PC', 'STK-TY-PNK-PC',
    'PCH-COU-BLK-M-PC', 'PCH-COU-BLK-S-PC', 'BBL-MLR-PNK-M-PC',
    'BBL-MLR-PNK-S-PC', 'STK-NVD-RR-PC', 'STK-FRG-PNK-PC',
    'PCH-PNK-8513-PC', 'BOX-CRG-T1-6415-PC'
  )
  or category_id in (select id from categories where lower(name) = 'packing materials');

  if v_product_ids is null then
    v_product_ids := array[]::uuid[];
  end if;

  delete from purchase_order_items where product_id = any(v_product_ids);
  get diagnostics v_po_items_deleted = row_count;

  delete from products where id = any(v_product_ids);
  get diagnostics v_products_deleted = row_count;

  delete from categories where lower(name) = 'packing materials';
  get diagnostics v_categories_deleted = row_count;

  raise notice 'Removed % purchase-order line item(s), % product(s), and % "Packing Materials" categor(y/ies).',
    v_po_items_deleted, v_products_deleted, v_categories_deleted;
end $$;

commit;
