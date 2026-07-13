-- LovieNGlow: one-time setup for repeatable test-data resets.
-- Paste this into the Supabase SQL editor and run it once. Safe to re-run.
-- After this exists, `npm run test:reset` (scripts/reset-test-data.mjs) can
-- wipe all storefront orders and POS/incoming-stock test data, and restart
-- the order reference / tracking code sequences from 1, any time.

create or replace function reset_test_data(p_owner_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Storefront orders (order_items, order_status_history, email_log cascade)
  delete from orders where true;
  alter sequence order_reference_seq restart with 1;
  alter sequence tracking_code_seq restart with 1;

  -- POS / Incoming Stock test data for this business
  delete from sales_order_items where owner_id = p_owner_id;
  delete from sales_orders where owner_id = p_owner_id;
  delete from purchase_order_items where owner_id = p_owner_id;
  delete from purchase_orders where owner_id = p_owner_id;
  delete from stock_adjustments where owner_id = p_owner_id;
  delete from order_number_counters where owner_id = p_owner_id;
end;
$$;
