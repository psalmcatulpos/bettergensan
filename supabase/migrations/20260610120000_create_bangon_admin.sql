-- BangonGensan admin schema — separate from the existing BetterGenSan
-- admin (`profiles.is_admin`). Adds:
--   * profiles.is_bangon_admin, .display_name, .avatar_url
--   * is_bangon_admin() helper
--   * bangon_admin_audit_log (immutable)
--   * bangon_admin_chat (realtime)
--   * bangon-admin-avatars storage bucket
--
-- First admin is bootstrapped manually after they sign up:
--   update profiles set is_bangon_admin = true where email = '...';

-- ── profiles columns ────────────────────────────────────────────────
alter table public.profiles
  add column if not exists is_bangon_admin boolean not null default false,
  add column if not exists display_name text,
  add column if not exists avatar_url text;

-- ── is_bangon_admin() helper ────────────────────────────────────────
create or replace function public.is_bangon_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_bangon_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ── bangon_admin_audit_log (immutable) ──────────────────────────────
create table if not exists public.bangon_admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete set null,
  admin_name text not null check (char_length(admin_name) between 1 and 100),
  action text not null check (char_length(action) between 1 and 50),
  record_table text not null check (char_length(record_table) between 1 and 80),
  record_id uuid not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_bangon_audit_created on public.bangon_admin_audit_log (created_at desc);
create index if not exists idx_bangon_audit_admin on public.bangon_admin_audit_log (admin_id, created_at desc);
create index if not exists idx_bangon_audit_record on public.bangon_admin_audit_log (record_table, record_id);

alter table public.bangon_admin_audit_log enable row level security;

drop policy if exists "Admins insert audit"  on public.bangon_admin_audit_log;
drop policy if exists "Admins read audit"    on public.bangon_admin_audit_log;
create policy "Admins insert audit" on public.bangon_admin_audit_log
  for insert with check (public.is_bangon_admin() and admin_id = auth.uid());
create policy "Admins read audit" on public.bangon_admin_audit_log
  for select using (public.is_bangon_admin());
-- No UPDATE / DELETE policies → immutable.

-- ── bangon_admin_chat ───────────────────────────────────────────────
create table if not exists public.bangon_admin_chat (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete set null,
  sender_name text not null check (char_length(sender_name) between 1 and 100),
  message text not null check (char_length(message) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists idx_bangon_admin_chat_created on public.bangon_admin_chat (created_at);

alter table public.bangon_admin_chat enable row level security;

drop policy if exists "Admins send chat"  on public.bangon_admin_chat;
drop policy if exists "Admins read chat"  on public.bangon_admin_chat;
create policy "Admins send chat" on public.bangon_admin_chat
  for insert with check (public.is_bangon_admin() and sender_id = auth.uid());
create policy "Admins read chat" on public.bangon_admin_chat
  for select using (public.is_bangon_admin());

-- Wire into realtime publication so the admin chat updates without polling.
do $$
begin
  perform 1 from pg_publication where pubname = 'supabase_realtime';
  if found then
    -- Add table only if not already in the publication.
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'bangon_admin_chat'
    ) then
      alter publication supabase_realtime add table public.bangon_admin_chat;
    end if;
  end if;
end$$;

-- ── Fundraiser admin SELECT policy (pending rows) ───────────────────
-- The public read policy only exposes status='approved'. Admins need to
-- see everything (pending + rejected) to review.
drop policy if exists "Admins read all bangon_fundraisers" on public.bangon_fundraisers;
create policy "Admins read all bangon_fundraisers"
  on public.bangon_fundraisers for select
  using (public.is_bangon_admin());

-- ── Storage bucket for admin avatars ────────────────────────────────
insert into storage.buckets (id, name, public)
values ('bangon-admin-avatars', 'bangon-admin-avatars', true)
on conflict (id) do nothing;

drop policy if exists "Admins upload avatar" on storage.objects;
drop policy if exists "Anyone reads admin avatar" on storage.objects;
create policy "Admins upload avatar" on storage.objects
  for insert with check (bucket_id = 'bangon-admin-avatars' and public.is_bangon_admin());
create policy "Anyone reads admin avatar" on storage.objects
  for select using (bucket_id = 'bangon-admin-avatars');
