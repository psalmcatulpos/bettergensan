-- BangonGensan: community-submitted businesses for the "Open Today" list.
--
-- Anon writes go in as status='pending'. Admins review at
-- /bangon-gensan/admin/businesses and flip status to approved/rejected, which
-- audits via logAuditEntry. The home sector pulls approved rows live and
-- merges them with the static src/data/bangonOpenBusinesses.json.
--
-- Submitter contact info is captured for verification but never published.

create table if not exists public.bangon_business_submissions (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  category           text,                  -- legacy single tag (kept for back-compat)
  sells              text,
  address            text,
  opens              text,
  closes             text,
  contact            text,
  submitter_name     text not null,
  submitter_contact  text,
  status             text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by        uuid references public.profiles(id),
  reviewed_at        timestamptz,
  reject_reason      text,
  created_at         timestamptz not null default now()
);

create index if not exists idx_bbs_status on public.bangon_business_submissions (status, created_at desc);

alter table public.bangon_business_submissions enable row level security;

create policy "Anyone can submit a business"
  on public.bangon_business_submissions for insert
  with check (true);

create policy "Public reads approved businesses"
  on public.bangon_business_submissions for select
  using (status = 'approved');

create policy "Bangon admins read all submissions"
  on public.bangon_business_submissions for select
  using (public.is_bangon_admin());

create policy "Bangon admins update submissions"
  on public.bangon_business_submissions for update
  using (public.is_bangon_admin())
  with check (public.is_bangon_admin());
