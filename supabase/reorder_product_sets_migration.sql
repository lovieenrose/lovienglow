-- LovieNGlow: atomic bulk reorder for product sets (POS "Manage Product Sets"
-- panel). Replaces the old pairwise swap_product_set_order approach with a
-- single RPC that assigns sort_order = position-in-array for every id passed
-- in, so a full reorder is one all-or-nothing database transaction instead
-- of N separate round trips.
-- Paste this entire file into the Supabase SQL editor and run it AFTER
-- inventory_migration.sql. Safe to re-run.

create or replace function reorder_product_sets(p_ids uuid[])
returns void
language plpgsql
security invoker
as $$
declare
  v_owner_id uuid := auth.uid();
  v_id       uuid;
  v_index    integer := 0;
begin
  if v_owner_id is null then
    raise exception 'not authenticated';
  end if;

  foreach v_id in array coalesce(p_ids, array[]::uuid[])
  loop
    update product_sets
    set sort_order = v_index
    where id = v_id and owner_id = v_owner_id;

    if not found then
      raise exception 'product set % not found', v_id;
    end if;

    v_index := v_index + 1;
  end loop;
end;
$$;
