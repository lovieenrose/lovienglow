-- LovieNGlow admin order management schema
-- Paste this entire file into the Supabase SQL editor (SQL Editor -> New query) and run it.
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE throughout.

create extension if not exists "pgcrypto";

-- ── Orders ──────────────────────────────────────────────────────────────
create table if not exists orders (
  id                  uuid primary key default gen_random_uuid(),
  reference           text unique not null,
  placed_at           timestamptz not null,
  full_name           text not null,
  contact_number      text not null,
  email               text,
  social_handle       text,
  address             text not null,
  courier             text not null,
  region              text,
  payment_method      text not null,
  receipt_url         text,
  receipt_filename    text,
  subtotal            numeric(10,2) not null,
  shipping_fee        numeric(10,2) not null default 0,
  total               numeric(10,2) not null,
  payment_status      text not null default 'pending',
  fulfillment_status  text not null default 'pending',
  tracking_number     text,
  internal_notes      text default '',
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ── Order line items ────────────────────────────────────────────────────
create table if not exists order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid references orders(id) on delete cascade,
  product_id    integer not null,
  product_name  text not null,
  unit_price    numeric(10,2) not null,
  quantity      integer not null,
  line_total    numeric(10,2) not null
);

-- ── Status change history ───────────────────────────────────────────────
create table if not exists order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid references orders(id) on delete cascade,
  field       text not null,
  old_value   text,
  new_value   text not null,
  note        text,
  changed_at  timestamptz default now()
);

-- ── Email log ────────────────────────────────────────────────────────────
create table if not exists email_log (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid references orders(id) on delete cascade,
  email_type  text not null,
  sent_to     text not null,
  subject     text,
  success     boolean default true,
  sent_at     timestamptz default now()
);

-- ── Product inventory ────────────────────────────────────────────────────
create table if not exists product_inventory (
  product_id           integer primary key,
  stock                integer not null default 0,
  low_stock_threshold  integer not null default 5,
  updated_at           timestamptz default now()
);

create index if not exists idx_orders_reference on orders(reference);
create index if not exists idx_orders_created_at on orders(created_at desc);
create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_order_status_history_order_id on order_status_history(order_id);
create index if not exists idx_email_log_order_id on email_log(order_id);

-- ── Order reference generator (LNG-000001, LNG-000002, ...) ─────────────
create sequence if not exists order_reference_seq start 1;

create or replace function next_order_reference()
returns text
language sql
as $$
  select 'LNG-' || lpad(nextval('order_reference_seq')::text, 6, '0');
$$;

-- ── Inventory seed ───────────────────────────────────────────────────────
-- Seeded from the stock values currently in src/data/products.ts.
-- Re-running this is safe: existing rows are left untouched.
insert into product_inventory (product_id, stock, low_stock_threshold) values
  (1, 24, 5), (2, 18, 5), (3, 20, 5), (4, 12, 5), (5, 24, 5),
  (6, 20, 5), (7, 18, 5), (8, 11, 5), (9, 30, 5), (10, 28, 5),
  (11, 28, 5), (12, 22, 5), (13, 32, 5), (14, 26, 5), (15, 24, 5),
  (16, 22, 5), (17, 16, 5), (18, 34, 5), (19, 34, 5), (20, 34, 5),
  (21, 34, 5), (22, 34, 5), (23, 18, 5), (24, 20, 5), (25, 18, 5),
  (26, 19, 5), (27, 200, 20), (28, 200, 20), (29, 80, 10), (30, 90, 10),
  (31, 88, 10), (32, 86, 10), (33, 70, 10), (34, 70, 10), (35, 100, 10),
  (36, 76, 10), (37, 64, 10), (38, 120, 10)
on conflict (product_id) do nothing;

-- ── Storage ──────────────────────────────────────────────────────────────
-- The app also needs a public Storage bucket named "receipts" for uploaded
-- payment receipts. It's created automatically on first checkout submission
-- if missing, but you can create it manually instead:
-- Supabase Dashboard -> Storage -> New bucket -> name: receipts -> Public bucket: ON
