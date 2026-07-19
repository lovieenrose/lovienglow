-- LovieNGlow: drop the legacy public-storefront schema now that the
-- customer-facing site, cart, checkout, and order tracking have been
-- removed from the codebase (see the b2b-saas-refactor branch).
--
-- ⚠️  DESTRUCTIVE — this permanently deletes all rows in `orders`,
-- `order_items`, `order_status_history`, `email_log`, and `product_inventory`
-- (historical customer order data), plus the `storefront_meta` column on
-- `products`/`product_sets`. Take a Supabase backup/export first if you want
-- to keep a record of past storefront orders. This is NOT auto-applied —
-- paste it into the Supabase SQL editor yourself once you're ready.
--
-- Run this AFTER deploying the code that no longer references any of the
-- above (this branch). Nothing in the POS/Inventory/Incoming
-- Stock/Expenses/Customers modules touches these tables/columns.

-- `promo_redemptions.order_id` references `orders(id)` — cascade drops just
-- that FK constraint, not the promo_redemptions table itself (POS promos
-- keep working; only the storefront-redemption link column becomes orphaned
-- of its target and stays null going forward).
drop table if exists email_log cascade;
drop table if exists order_status_history cascade;
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists product_inventory cascade;

drop sequence if exists order_reference_seq;
drop sequence if exists tracking_code_seq;

alter table products drop column if exists storefront_meta;
alter table product_sets drop column if exists storefront_meta;
