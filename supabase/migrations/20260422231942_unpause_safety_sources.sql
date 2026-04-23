-- Unpause the safety report sources so syncs can run.
-- Both were paused during initial development.

update public.sources
set is_paused = false
where slug in ('facebook-safety-pages', 'facebook-safety-search');
