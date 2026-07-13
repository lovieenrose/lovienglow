-- LovieNGlow order status simplification: single order_status field,
-- auto-generated tracking_code, and backfill for existing rows.
-- Paste this entire file into the Supabase SQL editor and run it AFTER
-- migration.sql. Safe to re-run.

alter table orders add column if not exists order_status text not null default 'pending_payment';
alter table orders drop constraint if exists orders_order_status_check;
alter table orders add constraint orders_order_status_check
  check (order_status in ('pending_payment', 'processing', 'shipped', 'delivered', 'cancelled'));

alter table orders add column if not exists tracking_code text;
create unique index if not exists uq_orders_tracking_code on orders (tracking_code) where tracking_code is not null;
create index if not exists idx_orders_order_status on orders (order_status);

create sequence if not exists tracking_code_seq start 1;

create or replace function next_tracking_code()
returns text
language sql
as $$
  select 'LNG-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('tracking_code_seq')::text, 6, '0');
$$;

-- Backfill existing rows: derive order_status from the legacy two-column
-- model, and assign a tracking_code to every row that doesn't have one yet.
update orders
set order_status = case
  when payment_status in ('rejected', 'refunded') or fulfillment_status = 'cancelled' then 'cancelled'
  when fulfillment_status in ('delivered', 'completed') then 'delivered'
  when fulfillment_status = 'shipped' then 'shipped'
  when payment_status = 'confirmed' then 'processing'
  else 'pending_payment'
end
where true;

update orders set tracking_code = next_tracking_code() where tracking_code is null;

alter table orders alter column tracking_code set not null;
