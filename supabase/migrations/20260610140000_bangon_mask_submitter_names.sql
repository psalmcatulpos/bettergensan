-- Privacy: only BangonGensan admins may see full submitter names.
-- Non-admins (anon and any non-admin session) read masked views that the
-- database serves, so full names never leave the server for them — not even
-- via DevTools / the raw REST endpoint.
--
-- Applied to the live project via MCP apply_migration on 2026-06-10; this
-- file mirrors it for version control.

-- 1. SQL mirror of the frontend maskName(): "Juan Dela Cruz" -> "J****z".
create or replace function public.bangon_mask_name(name text)
returns text
language sql
immutable
as $$
  select case
    when name is null or btrim(name) = '' then 'Anonymous'
    when length(btrim(name)) = 1 then left(btrim(name), 1) || '*'
    else left(btrim(name), 1) || '****' || right(btrim(name), 1)
  end;
$$;

-- 2. Masked public views. These are SECURITY DEFINER (the default for views):
--    they run as the owner and bypass the base-table RLS, while
--    is_bangon_admin() still evaluates the *caller's* JWT — so an admin
--    request gets full names and everyone else gets the masked form.
create or replace view public.bangon_requests_public as
select
  id,
  need_type,
  barangay,
  landmark,
  case when public.is_bangon_admin()
       then full_name
       else public.bangon_mask_name(full_name)
  end as full_name,
  contact_number,
  status,
  verified,
  created_at,
  updated_at
from public.bangon_requests;

create or replace view public.bangon_offers_public as
select
  id,
  offer_description,
  offer_tags,
  barangay,
  case when public.is_bangon_admin()
       then contact_name
       else public.bangon_mask_name(contact_name)
  end as contact_name,
  contact_number,
  created_at
from public.bangon_offers;

grant select on public.bangon_requests_public to anon, authenticated;
grant select on public.bangon_offers_public to anon, authenticated;

-- 3. Lock the base tables: replace the public "anyone can read" SELECT policy
--    with an admin-only one. A direct anon query now returns zero rows, so the
--    raw full_name / contact_name columns are never sent to non-admins.
--    Inserts (public submissions) and admin update/delete policies are
--    untouched.
drop policy if exists "Anyone can read bangon_requests" on public.bangon_requests;
create policy "Admins read bangon_requests"
  on public.bangon_requests for select
  using (public.is_bangon_admin());

drop policy if exists "Anyone can read bangon_offers" on public.bangon_offers;
create policy "Admins read bangon_offers"
  on public.bangon_offers for select
  using (public.is_bangon_admin());
