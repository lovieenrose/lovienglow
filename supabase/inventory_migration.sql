-- LovieNGlow multi-tenant inventory & sales management schema
-- Paste this entire file into the Supabase SQL editor (SQL Editor -> New query) and run it.
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS throughout.
--
-- This schema is independent of the existing single-tenant e-commerce tables
-- (orders, order_items, product_inventory, etc. in migration.sql). It powers a
-- separate multi-tenant admin module where every business (auth.users row)
-- only ever sees its own data, enforced by Postgres Row-Level Security.

create extension if not exists "pgcrypto";

-- ── Shared: updated_at trigger ───────────────────────────────────────────
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── business_profiles ────────────────────────────────────────────────────
create table if not exists business_profiles (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null unique references auth.users(id) on delete cascade,
  business_name text not null,
  full_name     text not null,
  currency      text not null default 'PHP',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_business_profiles_owner_created
  on business_profiles (owner_id, created_at desc);

drop trigger if exists trg_business_profiles_updated_at on business_profiles;
create trigger trg_business_profiles_updated_at
  before update on business_profiles
  for each row execute function set_updated_at();

-- ── categories ────────────────────────────────────────────────────────────
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (owner_id, name)
);

create index if not exists idx_categories_owner_created
  on categories (owner_id, created_at desc);

drop trigger if exists trg_categories_updated_at on categories;
create trigger trg_categories_updated_at
  before update on categories
  for each row execute function set_updated_at();

-- ── suppliers ─────────────────────────────────────────────────────────────
create table if not exists suppliers (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  contact_person text,
  email          text,
  phone          text,
  address        text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_suppliers_owner_created
  on suppliers (owner_id, created_at desc);

drop trigger if exists trg_suppliers_updated_at on suppliers;
create trigger trg_suppliers_updated_at
  before update on suppliers
  for each row execute function set_updated_at();

-- ── products (inventory core) ───────────────────────────────────────────
create table if not exists products (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  sku             text,
  barcode         text,
  category_id     uuid references categories(id) on delete set null,
  supplier_id     uuid references suppliers(id) on delete set null,
  cost_price      numeric(12,2) not null default 0,
  selling_price   numeric(12,2) not null default 0,
  stock_quantity  integer not null default 0,
  reorder_level   integer not null default 0,
  unit            text not null default 'pc',
  image_url       text,
  description     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index if not exists uq_products_owner_sku
  on products (owner_id, sku) where sku is not null and sku <> '';

create index if not exists idx_products_owner_created
  on products (owner_id, created_at desc);
create index if not exists idx_products_category_id on products (category_id);
create index if not exists idx_products_supplier_id on products (supplier_id);
create index if not exists idx_products_owner_stock
  on products (owner_id, stock_quantity, reorder_level);

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
  before update on products
  for each row execute function set_updated_at();

-- ── product_sets / product_set_items (POS bundles) ──────────────────────
create table if not exists product_sets (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  icon       text,
  color      text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_sets_owner_created
  on product_sets (owner_id, created_at desc);
create index if not exists idx_product_sets_owner_sort
  on product_sets (owner_id, sort_order);

drop trigger if exists trg_product_sets_updated_at on product_sets;
create trigger trg_product_sets_updated_at
  before update on product_sets
  for each row execute function set_updated_at();

create table if not exists product_set_items (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references auth.users(id) on delete cascade,
  product_set_id uuid not null references product_sets(id) on delete cascade,
  product_id     uuid not null references products(id) on delete cascade,
  quantity       integer not null default 1,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (product_set_id, product_id)
);

create index if not exists idx_product_set_items_owner_created
  on product_set_items (owner_id, created_at desc);
create index if not exists idx_product_set_items_set_id on product_set_items (product_set_id);
create index if not exists idx_product_set_items_product_id on product_set_items (product_id);

drop trigger if exists trg_product_set_items_updated_at on product_set_items;
create trigger trg_product_set_items_updated_at
  before update on product_set_items
  for each row execute function set_updated_at();

-- ── stock_adjustments (audit log, append-only) ───────────────────────────
create table if not exists stock_adjustments (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  product_id    uuid not null references products(id) on delete cascade,
  change        integer not null,
  resulting_qty integer not null,
  reason        text not null,
  source        text not null check (source in ('manual', 'purchase_order', 'sale_order')),
  source_id     uuid,
  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_stock_adjustments_owner_created
  on stock_adjustments (owner_id, created_at desc);
create index if not exists idx_stock_adjustments_product_id on stock_adjustments (product_id);
create index if not exists idx_stock_adjustments_source on stock_adjustments (source, source_id);

-- ── purchase_orders / purchase_order_items (incoming stock) ─────────────
create table if not exists purchase_orders (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references auth.users(id) on delete cascade,
  supplier_id    uuid references suppliers(id) on delete set null,
  status         text not null default 'pending'
                 check (status in ('pending', 'in_transit', 'received', 'cancelled')),
  total_cost     numeric(12,2) not null default 0,
  handling_fee   numeric(12,2) not null default 0,
  shipping_fee   numeric(12,2) not null default 0,
  expected_date  date,
  received_at    timestamptz,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_purchase_orders_owner_created
  on purchase_orders (owner_id, created_at desc);
create index if not exists idx_purchase_orders_supplier_id on purchase_orders (supplier_id);
create index if not exists idx_purchase_orders_owner_status
  on purchase_orders (owner_id, status);
create index if not exists idx_purchase_orders_owner_expected
  on purchase_orders (owner_id, expected_date);

drop trigger if exists trg_purchase_orders_updated_at on purchase_orders;
create trigger trg_purchase_orders_updated_at
  before update on purchase_orders
  for each row execute function set_updated_at();

create table if not exists purchase_order_items (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references auth.users(id) on delete cascade,
  purchase_order_id  uuid not null references purchase_orders(id) on delete cascade,
  product_id         uuid not null references products(id) on delete restrict,
  quantity_ordered   integer not null,
  quantity_received  integer not null default 0,
  unit_cost          numeric(12,2) not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_po_items_owner_created
  on purchase_order_items (owner_id, created_at desc);
create index if not exists idx_po_items_po_id on purchase_order_items (purchase_order_id);
create index if not exists idx_po_items_product_id on purchase_order_items (product_id);

drop trigger if exists trg_po_items_updated_at on purchase_order_items;
create trigger trg_po_items_updated_at
  before update on purchase_order_items
  for each row execute function set_updated_at();

-- ── sales_orders / sales_order_items (POS) ───────────────────────────────
create table if not exists sales_orders (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references auth.users(id) on delete cascade,
  order_number     text not null,
  customer_name    text,
  customer_contact text,
  subtotal         numeric(12,2) not null default 0,
  discount         numeric(12,2) not null default 0,
  total            numeric(12,2) not null default 0,
  total_cost       numeric(12,2) not null default 0,
  gross_profit     numeric(12,2) not null default 0,
  margin_pct       numeric(5,2) not null default 0,
  payment_method   text not null default 'cash',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (owner_id, order_number)
);

create index if not exists idx_sales_orders_owner_created
  on sales_orders (owner_id, created_at desc);

drop trigger if exists trg_sales_orders_updated_at on sales_orders;
create trigger trg_sales_orders_updated_at
  before update on sales_orders
  for each row execute function set_updated_at();

create table if not exists sales_order_items (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references auth.users(id) on delete cascade,
  sales_order_id uuid not null references sales_orders(id) on delete cascade,
  product_id     uuid references products(id) on delete set null,
  product_name   text not null,
  sku            text,
  quantity       integer not null,
  unit_cost      numeric(12,2) not null default 0,
  unit_price     numeric(12,2) not null default 0,
  line_cost      numeric(12,2) not null default 0,
  line_revenue   numeric(12,2) not null default 0,
  line_profit    numeric(12,2) not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_so_items_owner_created
  on sales_order_items (owner_id, created_at desc);
create index if not exists idx_so_items_order_id on sales_order_items (sales_order_id);
create index if not exists idx_so_items_product_id on sales_order_items (product_id);

drop trigger if exists trg_so_items_updated_at on sales_order_items;
create trigger trg_so_items_updated_at
  before update on sales_order_items
  for each row execute function set_updated_at();

-- ── expenses (financials) ─────────────────────────────────────────────────
create table if not exists expenses (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references auth.users(id) on delete cascade,
  category           text not null,
  description        text,
  amount             numeric(12,2) not null default 0,
  expense_date       date not null default current_date,
  purchase_order_id  uuid references purchase_orders(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_expenses_owner_created
  on expenses (owner_id, created_at desc);
create index if not exists idx_expenses_owner_date on expenses (owner_id, expense_date);
create index if not exists idx_expenses_owner_category on expenses (owner_id, category);
create index if not exists idx_expenses_po_id on expenses (purchase_order_id);

-- ── order_number_counters (per-owner atomic order numbering) ────────────
create table if not exists order_number_counters (
  owner_id     uuid primary key references auth.users(id) on delete cascade,
  next_number  integer not null default 1
);

-- ═══════════════════════════════════════════════════════════════════════
-- Row-Level Security
-- ═══════════════════════════════════════════════════════════════════════

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'business_profiles', 'categories', 'suppliers', 'products',
      'product_sets', 'product_set_items', 'stock_adjustments',
      'purchase_orders', 'purchase_order_items', 'sales_orders',
      'sales_order_items', 'expenses', 'order_number_counters'
    ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists owner_can_access on %I', t);
    execute format(
      'create policy owner_can_access on %I for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())',
      t
    );
  end loop;
end $$;

-- ═══════════════════════════════════════════════════════════════════════
-- Business logic: atomic RPC functions (SECURITY INVOKER, respect RLS)
-- ═══════════════════════════════════════════════════════════════════════

-- ── complete_sale: atomically records a POS sale ─────────────────────────
-- p_items: jsonb array of {product_id, quantity, unit_price}
create or replace function complete_sale(
  p_customer_name    text,
  p_customer_contact text,
  p_discount         numeric,
  p_payment_method   text,
  p_items            jsonb
)
returns sales_orders
language plpgsql
security invoker
as $$
declare
  v_owner_id      uuid := auth.uid();
  v_order_number  text;
  v_next_number   integer;
  v_order         sales_orders;
  v_item          jsonb;
  v_product       products;
  v_quantity      integer;
  v_unit_price    numeric(12,2);
  v_line_revenue  numeric(12,2);
  v_line_cost     numeric(12,2);
  v_line_profit   numeric(12,2);
  v_subtotal      numeric(12,2) := 0;
  v_total_cost    numeric(12,2) := 0;
  v_new_qty       integer;
begin
  if v_owner_id is null then
    raise exception 'not authenticated';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'sale must contain at least one item';
  end if;

  insert into order_number_counters (owner_id, next_number)
  values (v_owner_id, 1)
  on conflict (owner_id) do nothing;

  update order_number_counters
  set next_number = next_number + 1
  where owner_id = v_owner_id
  returning next_number - 1 into v_next_number;

  v_order_number := 'SO-' || lpad(v_next_number::text, 6, '0');

  insert into sales_orders (
    owner_id, order_number, customer_name, customer_contact,
    subtotal, discount, total, total_cost, gross_profit, margin_pct, payment_method
  ) values (
    v_owner_id, v_order_number, p_customer_name, p_customer_contact,
    0, coalesce(p_discount, 0), 0, 0, 0, 0, coalesce(p_payment_method, 'cash')
  )
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product
    from products
    where id = (v_item->>'product_id')::uuid and owner_id = v_owner_id
    for update;

    if not found then
      raise exception 'product % not found', v_item->>'product_id';
    end if;

    v_quantity := (v_item->>'quantity')::integer;
    v_unit_price := coalesce((v_item->>'unit_price')::numeric(12,2), v_product.selling_price);

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'invalid quantity for product %', v_product.name;
    end if;
    if v_product.stock_quantity < v_quantity then
      raise exception 'insufficient stock for %: have %, need %',
        v_product.name, v_product.stock_quantity, v_quantity;
    end if;

    v_line_revenue := v_unit_price * v_quantity;
    v_line_cost := v_product.cost_price * v_quantity;
    v_line_profit := v_line_revenue - v_line_cost;

    v_subtotal := v_subtotal + v_line_revenue;
    v_total_cost := v_total_cost + v_line_cost;

    insert into sales_order_items (
      owner_id, sales_order_id, product_id, product_name, sku,
      quantity, unit_cost, unit_price, line_cost, line_revenue, line_profit
    ) values (
      v_owner_id, v_order.id, v_product.id, v_product.name, v_product.sku,
      v_quantity, v_product.cost_price, v_unit_price, v_line_cost, v_line_revenue, v_line_profit
    );

    v_new_qty := v_product.stock_quantity - v_quantity;

    update products
    set stock_quantity = v_new_qty
    where id = v_product.id and owner_id = v_owner_id;

    insert into stock_adjustments (
      owner_id, product_id, change, resulting_qty, reason, source, source_id
    ) values (
      v_owner_id, v_product.id, -v_quantity, v_new_qty, 'sale', 'sale_order', v_order.id
    );
  end loop;

  update sales_orders
  set
    subtotal = v_subtotal,
    total_cost = v_total_cost,
    total = greatest(v_subtotal - coalesce(p_discount, 0), 0),
    gross_profit = greatest(v_subtotal - coalesce(p_discount, 0), 0) - v_total_cost,
    margin_pct = case
      when greatest(v_subtotal - coalesce(p_discount, 0), 0) = 0 then 0
      else round(
        ((greatest(v_subtotal - coalesce(p_discount, 0), 0) - v_total_cost)
          / greatest(v_subtotal - coalesce(p_discount, 0), 0)) * 100, 2
      )
    end
  where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

-- ── receive_purchase_order: atomically applies received quantities ──────
-- p_items: jsonb array of {purchase_order_item_id, quantity_received_now}
create or replace function receive_purchase_order(
  p_purchase_order_id uuid,
  p_items             jsonb
)
returns purchase_orders
language plpgsql
security invoker
as $$
declare
  v_owner_id       uuid := auth.uid();
  v_po             purchase_orders;
  v_item           jsonb;
  v_po_item        purchase_order_items;
  v_qty_now        integer;
  v_new_received   integer;
  v_new_stock      integer;
  v_all_received   boolean;
begin
  if v_owner_id is null then
    raise exception 'not authenticated';
  end if;

  select * into v_po
  from purchase_orders
  where id = p_purchase_order_id and owner_id = v_owner_id
  for update;

  if not found then
    raise exception 'purchase order not found';
  end if;
  if v_po.status = 'cancelled' then
    raise exception 'cannot receive a cancelled purchase order';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_po_item
    from purchase_order_items
    where id = (v_item->>'purchase_order_item_id')::uuid
      and purchase_order_id = p_purchase_order_id
      and owner_id = v_owner_id
    for update;

    if not found then
      raise exception 'purchase order item % not found', v_item->>'purchase_order_item_id';
    end if;

    v_qty_now := (v_item->>'quantity_received_now')::integer;
    if v_qty_now is null or v_qty_now <= 0 then
      continue;
    end if;

    v_new_received := v_po_item.quantity_received + v_qty_now;
    if v_new_received > v_po_item.quantity_ordered then
      raise exception 'cannot receive more than ordered for item %', v_po_item.id;
    end if;

    update purchase_order_items
    set quantity_received = v_new_received
    where id = v_po_item.id;

    select stock_quantity + v_qty_now into v_new_stock
    from products
    where id = v_po_item.product_id and owner_id = v_owner_id
    for update;

    update products
    set stock_quantity = v_new_stock
    where id = v_po_item.product_id and owner_id = v_owner_id;

    insert into stock_adjustments (
      owner_id, product_id, change, resulting_qty, reason, source, source_id
    ) values (
      v_owner_id, v_po_item.product_id, v_qty_now, v_new_stock,
      'purchase_received', 'purchase_order', p_purchase_order_id
    );
  end loop;

  select bool_and(quantity_received >= quantity_ordered) into v_all_received
  from purchase_order_items
  where purchase_order_id = p_purchase_order_id;

  update purchase_orders
  set
    status = case when v_all_received then 'received' else 'in_transit' end,
    received_at = case when v_all_received then now() else received_at end
  where id = p_purchase_order_id and owner_id = v_owner_id
  returning * into v_po;

  return v_po;
end;
$$;
