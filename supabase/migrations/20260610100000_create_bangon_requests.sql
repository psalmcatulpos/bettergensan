-- bangon_requests — Resident relief / rescue requests submitted from the
-- BangonGensan emergency response surface (/bangon-gensan).
--
-- MVP policy: anyone can submit, read, and advance status. Admins (when
-- we add a real admin role) will get destructive privileges (delete /
-- override). No volunteer login required.

create table if not exists public.bangon_requests (
  id uuid primary key default gen_random_uuid(),
  need_type text not null check (need_type in ('food', 'water', 'medicine', 'shelter', 'rescue')),
  barangay text not null check (char_length(barangay) between 1 and 80),
  landmark text check (landmark is null or char_length(landmark) <= 120),
  full_name text not null check (char_length(full_name) between 1 and 80),
  contact_number text not null check (contact_number ~ '^\+639\d{9}$'),
  status text not null default 'pending' check (status in ('pending', 'acknowledged', 'fulfilled')),
  verified boolean not null default false,         -- admin must verify before the row surfaces on the public Requests panel
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bangon_requests_created on public.bangon_requests (created_at desc);
create index if not exists idx_bangon_requests_status on public.bangon_requests (status);
create index if not exists idx_bangon_requests_need_type on public.bangon_requests (need_type);
create index if not exists idx_bangon_requests_barangay on public.bangon_requests (barangay);
create index if not exists idx_bangon_requests_verified on public.bangon_requests (verified);

-- Bump updated_at on every UPDATE.
create or replace function public.set_bangon_requests_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_bangon_requests_updated_at on public.bangon_requests;
create trigger trg_bangon_requests_updated_at
  before update on public.bangon_requests
  for each row execute function public.set_bangon_requests_updated_at();

alter table public.bangon_requests enable row level security;

create policy "Anyone can submit bangon_requests"
  on public.bangon_requests for insert
  with check (true);

create policy "Anyone can read bangon_requests"
  on public.bangon_requests for select
  using (true);

create policy "Anyone can update bangon_requests"
  on public.bangon_requests for update
  using (true) with check (true);
