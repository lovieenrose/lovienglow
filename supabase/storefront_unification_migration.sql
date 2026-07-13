-- LovieNGlow Phase 1: unify the public storefront with the real inventory
-- system. Adds storefront display metadata to products/product_sets, adds
-- promo/discount fields to orders, extends promos with the fields the new
-- Promotions module needs, and repoints order_items at real product UUIDs.
--
-- This wipes existing `orders` rows (test data only — the app's own
-- npm run test:reset already does this) because order_items.product_id is
-- changing type from integer (legacy static catalog id) to uuid (real
-- products.id). Paste into the Supabase SQL editor and run once.

delete from orders where true;

alter table order_items drop constraint if exists order_items_product_id_fkey;
alter table order_items alter column product_id type uuid using null;
alter table order_items add constraint order_items_product_id_fkey
  foreign key (product_id) references products(id) on delete set null;

alter table orders add column if not exists discount numeric(12,2) not null default 0;
alter table orders add column if not exists promo_code text;

-- ── Storefront display metadata ──────────────────────────────────────────
-- Null = not sold on the public site. Non-null makes the row visible in the
-- public catalog with these extra marketing/display fields (the real
-- name/description/cost_price/selling_price/stock_quantity stay on the base
-- products/product_sets columns as the single source of truth).
alter table products add column if not exists storefront_meta jsonb;
alter table product_sets add column if not exists storefront_meta jsonb;

create index if not exists idx_products_storefront_meta on products (owner_id) where storefront_meta is not null;
create index if not exists idx_product_sets_storefront_meta on product_sets (owner_id) where storefront_meta is not null;

-- ── Promotions: extend the existing promos table ─────────────────────────
alter table promos add column if not exists start_date date;
alter table promos add column if not exists end_date date;
alter table promos add column if not exists min_purchase_amount numeric(12,2);
alter table promos add column if not exists max_discount_amount numeric(12,2);
alter table promos add column if not exists max_uses integer;
alter table promos add column if not exists single_use_per_customer boolean not null default false;
alter table promos add column if not exists first_time_customer_only boolean not null default false;
alter table promos add column if not exists times_used integer not null default 0;

-- ── Promo redemptions: tracks who used a code, enforcing single-use-per-customer ──
create table if not exists promo_redemptions (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  promo_id   uuid not null references promos(id) on delete cascade,
  order_id   uuid references orders(id) on delete set null,
  customer_email text,
  created_at timestamptz not null default now()
);

create index if not exists idx_promo_redemptions_owner on promo_redemptions (owner_id);
create index if not exists idx_promo_redemptions_promo_id on promo_redemptions (promo_id);
create index if not exists idx_promo_redemptions_email on promo_redemptions (promo_id, customer_email);

alter table promo_redemptions enable row level security;
drop policy if exists owner_can_access on promo_redemptions;
create policy owner_can_access on promo_redemptions for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
