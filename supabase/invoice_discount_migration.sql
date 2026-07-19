-- Invory: optional, editable discount line on the printed invoice, separate
-- from the real transaction discount used at checkout ("Make Order").
-- Paste this entire file into the Supabase SQL editor and run it. Safe to
-- re-run.
--
-- sales_orders.discount (set by promo codes at checkout) stays exactly as
-- the real, company-data discount — it's what actually reduced the amount
-- collected and feeds gross_profit/margin_pct. It is no longer shown on the
-- invoice at all.
--
-- invoice_discount is a separate, optional, editable-per-order override:
-- null means "no discount line on the invoice" (the default); set it to
-- show whatever discount amount you want printed, independent of the real
-- transaction discount.

alter table sales_orders add column if not exists invoice_discount numeric(12,2);
