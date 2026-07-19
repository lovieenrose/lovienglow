-- Invory: a downloadable Official Receipt (OR), separate from the Invoice.
-- Paste this entire file into the Supabase SQL editor and run it. Safe to
-- re-run.
--
-- The Invoice ("Order Form / Invoice") is the pre-payment document showing
-- what's owed. The Official Receipt is proof of payment received, issued
-- only once a sale is actually marked paid, with its own sequential
-- "OR-000001" numbering — separate from the SO-000001 order number, since
-- an order number is assigned at checkout regardless of payment, while an
-- OR number should only ever be assigned to sales that were actually paid.
--
-- receipt_number and paid_at are both only assigned/stamped the FIRST time
-- a sale reaches 'paid' — mark_sale_paid is also called every time a
-- payment-proof photo is (re-)uploaded (see uploadPaymentProofFn), and
-- without this guard each re-upload would silently reassign a new OR
-- number and shift the paid date.

alter table sales_orders add column if not exists receipt_number text;

create table if not exists receipt_number_counters (
  owner_id     uuid primary key references auth.users(id) on delete cascade,
  next_number  integer not null default 1
);

alter table receipt_number_counters enable row level security;
drop policy if exists owner_can_access on receipt_number_counters;
create policy owner_can_access on receipt_number_counters
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create or replace function mark_sale_paid(
  p_sales_order_id uuid,
  p_receipt_url    text default null
)
returns sales_orders
language plpgsql
security invoker
as $$
declare
  v_owner_id       uuid := auth.uid();
  v_order          sales_orders;
  v_receipt_number text;
  v_next_number    integer;
begin
  if v_owner_id is null then
    raise exception 'not authenticated';
  end if;

  select * into v_order from sales_orders where id = p_sales_order_id and owner_id = v_owner_id for update;
  if not found then
    raise exception 'sales order not found';
  end if;
  if v_order.status = 'reversed' then
    raise exception 'cannot mark a reversed sale as paid';
  end if;

  if v_order.receipt_number is null then
    insert into receipt_number_counters (owner_id, next_number)
    values (v_owner_id, 1)
    on conflict (owner_id) do nothing;

    update receipt_number_counters
    set next_number = next_number + 1
    where owner_id = v_owner_id
    returning next_number - 1 into v_next_number;

    v_receipt_number := 'OR-' || lpad(v_next_number::text, 6, '0');
  else
    v_receipt_number := v_order.receipt_number;
  end if;

  update sales_orders
  set
    status = 'paid',
    paid_at = coalesce(paid_at, now()),
    receipt_url = coalesce(p_receipt_url, receipt_url),
    receipt_number = v_receipt_number
  where id = p_sales_order_id and owner_id = v_owner_id
  returning * into v_order;

  return v_order;
end;
$$;
