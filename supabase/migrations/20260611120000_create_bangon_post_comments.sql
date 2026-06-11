-- BangonGensan: Facebook post comments raw cache.
--
-- Backs the bangon-fetch-comments edge function (which paginates Regiment's
-- /facebook/posts/{pfbid}/comments endpoint) when we need to mine comment
-- threads for community-sourced data. One row per unique comment_id; threads
-- flow via parent_comment_id.
--
-- Admin-surface only (RLS): comments contain unmoderated user-generated text
-- so reads are gated by is_bangon_admin(). The edge function writes via the
-- service role and bypasses RLS.

create table if not exists public.bangon_post_comments (
  comment_id            text primary key,
  legacy_comment_id     text,
  post_url              text not null,
  post_pfbid            text not null,
  parent_comment_id     text,
  depth                 integer not null default 0,
  created_time          timestamptz,
  message               text,
  author_id             text,
  author_name           text,
  author_profile_image  text,
  replies_count         integer not null default 0,
  reactions_count       integer not null default 0,
  raw                   jsonb not null,
  first_seen_at         timestamptz not null default now(),
  last_seen_at          timestamptz not null default now(),
  scraped_at            timestamptz not null default now()
);

create index if not exists idx_bangon_post_comments_post     on public.bangon_post_comments (post_pfbid, created_time desc);
create index if not exists idx_bangon_post_comments_parent   on public.bangon_post_comments (parent_comment_id);
create index if not exists idx_bangon_post_comments_scraped  on public.bangon_post_comments (scraped_at desc);

alter table public.bangon_post_comments enable row level security;

create policy "Bangon admins read comments"
  on public.bangon_post_comments for select
  using (public.is_bangon_admin());
