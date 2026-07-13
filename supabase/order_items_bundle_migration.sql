-- LovieNGlow: order_items now records exactly one line per cart entry —
-- including bundles ("sets"), which are no longer exploded into their real
-- component products (alcohol pads, syringes, etc. no longer leak into the
-- customer- or admin-facing order summary). A bundle line has product_id
-- NULL and product_set_id set instead, so Phase 2 fulfillment can still look
-- up the real components to deduct via product_set_items when needed.
-- Paste into the Supabase SQL editor and run once. Safe to re-run.

alter table order_items alter column product_id drop not null;
alter table order_items add column if not exists product_set_id uuid references product_sets(id) on delete set null;

create index if not exists idx_order_items_product_set_id on order_items (product_set_id);
