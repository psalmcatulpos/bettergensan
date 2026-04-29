// Caching contract: refreshAndReadJobs() / readJobsFromTable() are called once
// per page mount. Callers hold the result in component state and run all
// filter/sort operations in memory. Refresh is the scraper's job (jobs-refresh
// and linkedin-refresh edge functions write to public.jobs on a schedule); the
// frontend fires a background refresh on mount but does not refetch on filter,
// tab, or sort changes.
//
// Shared helper for reading merged Indeed + LinkedIn jobs from Supabase.
// The two edge functions (jobs-refresh, linkedin-refresh) are invoked in
// parallel to trigger their 24h cache gates, then we do a single select on
// public.jobs which holds rows from both sources.

import { supabase } from './supabase';

export interface JobRow {
  id: string;
  source: string;
  title: string;
  company_name: string | null;
  company_image: string | null;
  location: string | null;
  apply_url: string | null;
  date_published: string | null;
}

// Fire refreshes in the background; the cache table is the source of truth
// for the UI. Awaiting the edge function invocations on every page load makes
// users wait for cold-start latency, which is the wrong tradeoff because the
// pg_cron jobs already keep the cache warm.
function fireBackgroundRefresh() {
  void supabase.functions.invoke('jobs-refresh').catch(() => {
    /* swallow — refresh is best-effort */
  });
  void supabase.functions.invoke('linkedin-refresh').catch(() => {
    /* swallow — refresh is best-effort */
  });
}

export async function refreshAndReadJobs(
  limit = 50,
  signal?: AbortSignal
): Promise<JobRow[]> {
  fireBackgroundRefresh();
  return readJobsFromTable(limit, signal);
}

// Hard timeout matches gensanCache.safe() — if the underlying fetch hangs
// or the caller's AbortSignal fires, Promise.race forcibly resolves so the
// UI flips out of loading immediately.
const JOBS_TIMEOUT_MS = 12000;

// In-flight dedup + 60s result cache so navigating away and back doesn't
// re-fetch from scratch. Same pattern as gensanCache.memo().
const JOBS_CACHE_TTL_MS = 60_000;
interface JobsCacheEntry {
  value: JobRow[] | null;
  storedAt: number | null;
  promise: Promise<JobRow[]>;
}
const JOBS_CACHE = new Map<string, JobsCacheEntry>();

function jobsCacheKey(limit: number): string {
  return `readJobsFromTable::${limit}`;
}

export async function readJobsFromTable(
  limit = 50,
  signal?: AbortSignal
): Promise<JobRow[]> {
  if (signal?.aborted) return [];

  const key = jobsCacheKey(limit);
  const now = Date.now();
  const existing = JOBS_CACHE.get(key);
  // Only reuse fresh, fully-resolved cache entries. In-flight promise sharing
  // was REMOVED on purpose: the closure below captures the caller's
  // AbortSignal, so sharing one in-flight promise across callers with
  // different signals causes a poisoning bug — caller A's abort resolves the
  // shared promise with [], and caller B (whose signal is still alive)
  // commits empty rows. Same root cause as the gensanCache.memo() fix.
  if (
    existing &&
    existing.storedAt !== null &&
    now - existing.storedAt < JOBS_CACHE_TTL_MS
  ) {
    return existing.promise;
  }

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<JobRow[]>(resolve => {
    timeoutHandle = setTimeout(() => {
      console.warn(
        `[jobsSource] readJobsFromTable timed out after ${JOBS_TIMEOUT_MS}ms`
      );
      resolve([]);
    }, JOBS_TIMEOUT_MS);
  });
  const abortPromise = new Promise<JobRow[]>(resolve => {
    if (!signal) return;
    signal.addEventListener('abort', () => resolve([]), { once: true });
  });
  const queryPromise = (async (): Promise<JobRow[]> => {
    let q = supabase
      .from('jobs')
      .select(
        'id, source, title, company_name, company_image, location, apply_url, date_published'
      )
      .in('source', ['indeed', 'linkedin'])
      .order('date_published', { ascending: false, nullsFirst: false })
      .limit(limit);
    if (signal) q = q.abortSignal(signal) as typeof q;
    const { data, error } = await q;
    if (error) {
      console.warn('[jobsSource] readJobsFromTable failed', error.message);
      return [];
    }
    return (data ?? []) as JobRow[];
  })();
  const cachingPromise = (async (): Promise<JobRow[]> => {
    try {
      const result = await Promise.race([
        queryPromise,
        timeoutPromise,
        abortPromise,
      ]);
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
      return result;
    } catch (e) {
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
      if (
        e instanceof Error &&
        (e.name === 'AbortError' || /aborted/i.test(e.message))
      ) {
        return [];
      }
      console.warn(
        '[jobsSource] readJobsFromTable threw',
        e instanceof Error ? e.message : e
      );
      return [];
    }
  })().then(value => {
    if (value.length === 0) {
      // Don't cache empty fallback — almost always means an aborted fetch.
      JOBS_CACHE.delete(key);
    } else {
      JOBS_CACHE.set(key, {
        value,
        storedAt: Date.now(),
        promise: cachingPromise,
      });
    }
    return value;
  });
  return cachingPromise;
}

export function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return 'today';
  const days = Math.floor(diff / day);
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

export function cleanLocation(loc: string | null): string {
  if (!loc) return '';
  return loc.replace(', Soccsksargen, Philippines', '').replace(', Philippines', '');
}
