-- BangonGensan: multi-tag system on business submissions.
--
-- Some businesses fit more than one category (e.g. Brigada Pharmacy sells
-- both Pharmacy and Grocery items). The submission form now writes a
-- categories text[] array; the legacy single-tag `category` column stays
-- nullable for back-compat (the home sector and admin page prefer
-- categories[] when present).

alter table public.bangon_business_submissions
  add column if not exists categories text[] not null default '{}';

update public.bangon_business_submissions
  set categories = array[category]
  where (categories is null or array_length(categories, 1) is null)
    and category is not null;

alter table public.bangon_business_submissions
  alter column category drop not null;
