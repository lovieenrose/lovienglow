-- LovieNGlow: one-time setup for repeatable test-data resets.
-- Paste this into the Supabase SQL editor and run it once. Safe to re-run.
-- After this exists, `npm run test:reset` (scripts/reset-test-data.mjs) can
-- wipe POS/incoming-stock test data any time.
--
-- Storefront order clearing was removed here along with the rest of the
-- public storefront (see b2b_saas_cleanup_migration.sql) — this app no
-- longer has a public checkout, so there's nothing in `orders` to reset.

create or replace function reset_test_data(p_owner_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- POS / Incoming Stock test data for this business
  delete from sales_order_items where owner_id = p_owner_id;
  delete from sales_orders where owner_id = p_owner_id;
  delete from purchase_order_items where owner_id = p_owner_id;
  delete from purchase_orders where owner_id = p_owner_id;
  delete from stock_adjustments where owner_id = p_owner_id;
  delete from order_number_counters where owner_id = p_owner_id;
end;
$$;
