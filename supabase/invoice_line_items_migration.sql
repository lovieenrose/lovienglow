-- Invory: let the printed/downloaded invoice show custom line items that
-- differ from the real, fully-itemized sale — e.g. collapsing a bundle's
-- per-item rows (Tirzepatide, Bac Water, alcohol pads, ...) into a single
-- "TR15 Complete Set" line for display, without touching the underlying
-- sales_order_items rows that COGS/profit/dashboard metrics are computed
-- from.
-- Paste this entire file into the Supabase SQL editor and run it. Safe to
-- re-run.

alter table sales_orders add column if not exists invoice_items jsonb;
