// Read-only client for the gensan-* cache tables.
//
// HARD RULE: nothing in this file calls Regiment. The frontend reads only from
// public.executive_orders_cache, public.procurement_cache, and the
// public.source_health view. Cron + edge functions are the only writers.
//
// Status thresholds (per user spec):
//   healthy:  age < expected_ttl_minutes  (30 for EO, 15 for procurement)
//   degraded: age < 120 minutes
//   offline:  age >= 120 minutes  OR  no successful sync ever

import { supabase } from './supabase';
import type { FreshnessTone } from '../components/ui/FreshnessBadge';

// ---------- Types ----------

export type ArchiveStatus = 'active' | 'missing_from_source';

export interface ExecutiveOrderRow {
  id: string;
  title: string;
  order_number: string | null;
  date_issued: string | null;
  year: number | null;
  summary: string | null;
  source_url: string;
  download_url: string | null;
  has_download: boolean;
  drive_file_id: string | null;
  status: ArchiveStatus;
  source_removed_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
  last_synced_at: string;
}

export interface ProcurementRow {
  id: string;
  endpoint: string;
  external_id: string | null;
  reference_number: string | null;
  title: string;
  description: string | null;
  category: string | null;
  procurement_mode: string | null;
  amount: number | null;
  amount_currency: string | null;
  date_posted: string | null;
  date_raw: string | null;
  /**
   * Archive flag — 'active' or 'missing_from_source'.
   * NOTE: this column also stores the upstream `status` field on initial
   * insert (e.g. 'awarded'), but the missing-sweep + upsert logic uses it as
   * the archive flag. Upstream status values are preserved in the raw jsonb.
   */
  status: ArchiveStatus;
  source_removed_at: string | null;
  supplier: string | null;
  source_url: string;
  detail_url: string | null;
  first_seen_at: string;
  last_seen_at: string;
  last_synced_at: string;
}

export interface SourceHealthRow {
  slug: string;
  name: string;
  expected_ttl_minutes: number;
  is_paused: boolean;
  last_success_at: string | null;
  last_failure_at: string | null;
  last_failure_message: string | null;
  freshness_status: string | null;
  open_alerts: number;
}

// ---------- Upstream source health ----------
//
// Tracks the actual reachability of each .gov source the scrapers depend
// on. Populated by the gensan-source-health-check edge function (pg_cron
// every 15 min). Frontend reads via readUpstreamHealth — never probes
// upstream URLs from the browser.

export type UpstreamStatus = 'live' | 'degraded' | 'down' | 'unknown';

export interface UpstreamHealthRow {
  source_key: string;
  source_name: string;
  source_url: string;
  status: UpstreamStatus;
  http_status: number | null;
  response_time_ms: number | null;
  is_cloudflare_error: boolean;
  content_ok: boolean;
  status_reason: string | null;
  error_message: string | null;
  checked_at: string | null;
}

export interface FreshnessInfo {
  tone: FreshnessTone;
  ageText: string;
  ageMs: number | null;
  lastSuccessAt: string | null;
  lastSuccessLabel: string; // human-friendly absolute timestamp
}

// ---------- Procurement endpoint registry ----------

export interface ProcEndpoint {
  endpoint: string; // bidresults | indicative-items | ...
  slug: string; // gensan-procurement-bidresults | ...
  label: string; // Tab label (kept verbatim per user spec)
  subtitle: string; // Tight one-line helper text under the tab label (lowercase)
  headline: string; // Sentence-case headline for the detail page section header
}

export const PROCUREMENT_ENDPOINTS: ProcEndpoint[] = [
  {
    endpoint: 'ongoing-competitive-bids',
    slug: 'gensan-procurement-ongoing-competitive-bids',
    label: 'Ongoing Bids',
    subtitle: 'currently open projects',
    headline: 'Currently open projects you can bid on',
  },
  {
    endpoint: 'ongoing-alter-bids',
    slug: 'gensan-procurement-ongoing-alter-bids',
    label: 'Alternative Mode',
    subtitle: 'negotiated procurement',
    headline: 'Negotiated or special-case procurement',
  },
  {
    endpoint: 'ongoing-alternative-bids',
    slug: 'gensan-procurement-ongoing-alternative-bids',
    label: 'Alternative (Master)',
    subtitle: 'full alternative records',
    headline: 'Full list of alternative procurement records',
  },
  {
    endpoint: 'bidresults',
    slug: 'gensan-procurement-bidresults',
    label: 'Bid Results',
    subtitle: 'awarded projects',
    headline: 'Projects already awarded to suppliers',
  },
  {
    endpoint: 'infra-publications',
    slug: 'gensan-procurement-infra-publications',
    label: 'Infra Publications',
    subtitle: 'infrastructure notices',
    headline: 'Infrastructure project announcements',
  },
  {
    endpoint: 'indicative-items',
    slug: 'gensan-procurement-indicative-items',
    label: 'Indicative Items',
    subtitle: 'planned procurements',
    headline: 'Planned future procurements',
  },
  {
    endpoint: 'price-catalogue',
    slug: 'gensan-procurement-price-catalogue',
    label: 'Price Catalogue',
    subtitle: 'supplier price reference',
    headline: 'Approved supplier price references',
  },
];

export const EO_SOURCE_SLUG = 'gensan-executive-orders';

// ---------- SPLIS (Sangguniang Panglungsod) ----------

export const SPLIS_ORDINANCES_SLUG = 'gensan-splis-ordinances';
export const SPLIS_RESOLUTIONS_SLUG = 'gensan-splis-resolutions';
export const SPLIS_SLUGS = [
  SPLIS_ORDINANCES_SLUG,
  SPLIS_RESOLUTIONS_SLUG,
] as const;

export type SplisRecordType = 'Ordinance' | 'Resolution';

export interface SplisRow {
  id: string;
  source_slug: string;
  record_type: SplisRecordType;
  record_no: string;
  record_year: number | null;
  title: string;
  category: string | null;
  internal_id: string | null;
  pdf_url: string | null;
  pdf_filename: string | null;
  view_count: number | null;
  status: ArchiveStatus;
  source_removed_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
  last_synced_at: string;
}

// ---------- Reads (Supabase only — no Regiment) ----------
//
// IMPORTANT: supabase-js v2 returns `{ data, error }` for *logical* errors
// (RLS denials, missing rows, etc.) but it can THROW (TypeError: Failed to
// fetch, AbortError, etc.) on transient network issues, browser tab throttling,
// in-flight request aborts during navigation, and a few other edge cases.
//
// If a reader's `await` throws, the rejection bubbles up through the caller's
// `Promise.all`, the caller's async function exits early, and `setLoading(false)`
// + `setRows(...)` are never reached. The component is stuck on its initial
// loading state until the user manually refreshes. THIS IS THE ROOT CAUSE of
// the "data sometimes does not show until refresh" bug.
//
// Fix: every reader wraps its supabase call in a `safe()` helper that catches
// the throw path AND the destructured-error path, returning the empty default
// in both cases. The catch is logged via console.warn so the underlying issue
// is still visible.

// =============================================================================
// Tiny in-module memoization layer
// =============================================================================
//
// PROBLEM this solves: when a user navigates /eo → /splis → /eo, every page
// mount fires fresh Supabase queries. With React StrictMode in dev, every
// useEffect runs twice on mount. Combined, navigating back and forth fires
// 4–10× more requests than needed, the user sees "Loading…" on every
// navigation, and the slowest request blocks everything visually. The bug is
// not network or supabase-js — the bug is "no cache between mounts".
//
// FIX: a tiny in-module Map that:
//   1. Deduplicates IN-FLIGHT requests — if the same key is already running,
//      a new caller awaits the existing promise instead of starting a new
//      fetch. This kills the StrictMode double-fire problem instantly.
//   2. Caches successful results for CACHE_TTL_MS so subsequent navigations
//      to a page you just left feel instant.
//
// Cache keys are derived from the reader name + a JSON-serialized arg list,
// so each (reader, year, page, q) tuple is its own slot. AbortSignal is NOT
// part of the key — two callers asking for the same data with different
// signals share the same in-flight promise; whichever signal is still alive
// when the promise resolves consumes the result.

const CACHE_TTL_MS = 60_000; // 60 s — long enough for nav-back, short enough
//                             to feel live, gets blown away on hard refresh.

interface CacheEntry<T> {
  // resolved value, or null if still in flight
  value: T | null;
  // when the value was stored — null if still in flight
  storedAt: number | null;
  // promise for in-flight requests so concurrent callers share it
  promise: Promise<T>;
}

const REQUEST_CACHE = new Map<string, CacheEntry<unknown>>();

function cacheKey(label: string, args: readonly unknown[]): string {
  // We strip AbortSignal from args before stringifying — signals are not
  // serializable and shouldn't affect identity.
  const cleanArgs = args.filter(a => !(a instanceof AbortSignal));
  return `${label}::${JSON.stringify(cleanArgs)}`;
}

/**
 * Heuristic: is this value the empty fallback that safe() returns on
 * timeout / abort / error? We DO NOT want to cache empty results because
 * they would poison every subsequent navigation with bogus "no records"
 * for the entire CACHE_TTL_MS window.
 *
 * Recognised empty shapes:
 *   - null (single-row readers like readExecutiveOrderById)
 *   - 0 (count readers like readExecutiveOrderCount)
 *   - [] (list readers like readExecutiveOrders)
 *   - {} (readSourceHealth fallback)
 *   - { rows: [], total: 0 } (paginated readers)
 *   - { total: 0, perType/perEndpoint } with all-zero counts
 */
function isEmptyFallback(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'number') return value === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    // {} or { rows: [], total: 0 }
    if ('rows' in obj && Array.isArray(obj.rows)) {
      return obj.rows.length === 0;
    }
    // { total: 0, perType: {...} } or { total: 0, perEndpoint: {...} }
    if ('total' in obj && obj.total === 0) {
      return true;
    }
    // empty plain object (e.g. readSourceHealth fallback)
    return Object.keys(obj).length === 0;
  }
  return false;
}

/**
 * Memoize a reader function. If the same key is in flight, returns the
 * existing promise. If a fresh result is cached (within CACHE_TTL_MS),
 * returns it instantly. Otherwise runs the fetcher, caches the result,
 * and returns it.
 *
 * CRITICAL: only successful non-empty results are cached. The empty
 * fallback returned by safe() on timeout / abort / error is intentionally
 * NOT cached, otherwise an aborted in-flight fetch would poison the cache
 * with a fake "no records" response for the entire CACHE_TTL_MS window.
 * Aborted fetches re-run on the next call instead of returning poison.
 */
async function memo<T>(
  label: string,
  args: readonly unknown[],
  fetcher: () => Promise<T>
): Promise<T> {
  const key = cacheKey(label, args);
  const now = Date.now();
  const existing = REQUEST_CACHE.get(key) as CacheEntry<T> | undefined;

  // Cached fresh non-empty result: return it.
  if (
    existing &&
    existing.storedAt !== null &&
    now - existing.storedAt < CACHE_TTL_MS
  ) {
    return existing.promise;
  }

  // NOTE: in-flight promise sharing was REMOVED on purpose. The fetcher
  // closure captures the caller's AbortSignal, so sharing one in-flight
  // promise across callers with different signals causes a poisoning bug:
  // when caller A's signal aborts, the shared promise resolves with the
  // empty fallback, and caller B (whose signal is still alive) commits
  // those empty rows to state. This was the root cause of "Loading…" or
  // "No cached records yet" appearing on the homepage in dev StrictMode
  // and after navigating between pages. Each caller now starts its own
  // fetch; only successful, non-empty results are cached and reused.

  const promise = fetcher().then(
    value => {
      if (!isEmptyFallback(value)) {
        REQUEST_CACHE.set(key, { value, storedAt: Date.now(), promise });
      }
      return value;
    },
    err => {
      throw err;
    }
  );
  return promise;
}

/** Manually invalidate a cache entry by label prefix (e.g. when a write
 *  happens). Currently unused — included for future write-side hooks. */
export function invalidateCache(labelPrefix: string): void {
  for (const key of REQUEST_CACHE.keys()) {
    if (key.startsWith(`${labelPrefix}::`)) {
      REQUEST_CACHE.delete(key);
    }
  }
}

// Default per-call timeout. After this elapses, safe() resolves with the
// fallback even if the underlying supabase query is still in flight.
//
// WHY THIS EXISTS: supabase-js's underlying fetch can hang indefinitely on
// stale connections, idle keep-alive timeouts, or browser tab throttling.
// AND — more commonly — when a user navigates between pages rapidly, the
// React useEffect cleanup fires but the in-flight fetch is NOT aborted, just
// ignored. Those orphaned fetches sit in the browser's HTTPS connection pool
// (Chrome caps at 6 per origin) and block new requests behind them. The fix
// is two-pronged:
//   1. Every reader accepts an optional AbortSignal and passes it to
//      supabase's .abortSignal() so the underlying fetch is REALLY cancelled
//      when the React component unmounts. This frees the socket immediately.
//   2. safe() races the fetch against (a) a setTimeout fallback and (b) the
//      AbortSignal itself, so the promise always settles even if both the
//      fetch AND the timeout misbehave.
const DEFAULT_TIMEOUT_MS = 12000;

async function safe<T>(
  label: string,
  fn: () => Promise<T>,
  fallback: T,
  signal?: AbortSignal,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  // Already aborted before we even start — bail.
  if (signal?.aborted) return fallback;

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>(resolve => {
    timeoutHandle = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.warn(
        `[gensanCache] ${label} timed out after ${timeoutMs}ms — returning fallback`
      );
      resolve(fallback);
    }, timeoutMs);
  });

  // If the caller's signal aborts mid-flight, resolve with the fallback so
  // the React component flips out of loading immediately.
  const abortPromise = new Promise<T>(resolve => {
    if (!signal) return;
    const onAbort = () => resolve(fallback);
    signal.addEventListener('abort', onAbort, { once: true });
  });

  try {
    const result = await Promise.race([fn(), timeoutPromise, abortPromise]);
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
    return result;
  } catch (e) {
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
    // AbortError from supabase-js when the caller aborts — silent.
    if (e instanceof Error && (e.name === 'AbortError' || /aborted/i.test(e.message))) {
      return fallback;
    }
    // eslint-disable-next-line no-console
    console.warn(
      `[gensanCache] ${label} threw`,
      e instanceof Error ? e.message : e
    );
    return fallback;
  }
}

const EO_COLUMNS =
  'id, title, order_number, date_issued, year, summary, source_url, download_url, has_download, drive_file_id, status, source_removed_at, first_seen_at, last_seen_at, last_synced_at';

const PROC_COLUMNS =
  'id, endpoint, external_id, reference_number, title, description, category, procurement_mode, amount, amount_currency, date_posted, date_raw, status, source_removed_at, supplier, source_url, detail_url, first_seen_at, last_seen_at, last_synced_at';

export async function readExecutiveOrders(
  limit = 8,
  signal?: AbortSignal
): Promise<ExecutiveOrderRow[]> {
  return memo('readExecutiveOrders', [limit], () =>
    safe(
      'readExecutiveOrders',
      async () => {
        let q = supabase
          // Cast: cache tables are not in the generated Database types yet.
          .from('executive_orders_cache' as never)
          .select(EO_COLUMNS)
          .order('date_issued', { ascending: false, nullsFirst: false })
          .limit(limit);
        if (signal) q = q.abortSignal(signal) as typeof q;
        const { data, error } = await q;
        if (error) {
          console.warn(
            '[gensanCache] readExecutiveOrders failed',
            error.message
          );
          return [];
        }
        return (data ?? []) as unknown as ExecutiveOrderRow[];
      },
      [],
      signal
    )
  );
}

/** Paginated EO reader for the full /eo archive page.
 *  Returns the requested page of rows plus the total count for pagination.
 *  Optional `year` filter narrows to a single year. */
export async function readExecutiveOrdersPage(
  page: number,
  pageSize: number,
  year?: number | null,
  search?: string | null,
  signal?: AbortSignal
): Promise<{ rows: ExecutiveOrderRow[]; total: number }> {
  return memo(
    'readExecutiveOrdersPage',
    [page, pageSize, year, search],
    () => safe(
    'readExecutiveOrdersPage',
    async () => {
      const from = Math.max(0, (page - 1) * pageSize);
      const to = from + pageSize - 1;
      let q = supabase
        .from('executive_orders_cache' as never)
        .select(EO_COLUMNS, { count: 'exact' })
        .order('date_issued', { ascending: false, nullsFirst: false })
        .range(from, to);
      if (year != null) {
        q = q.eq('year', year);
      }
      const trimmed = (search ?? '').trim();
      if (trimmed) {
        // ILIKE on title + order_number. Escape % and _ in user input so they
        // are matched literally rather than as wildcards.
        const escaped = trimmed.replace(/[%_\\]/g, ch => `\\${ch}`);
        const pattern = `%${escaped}%`;
        q = q.or(`title.ilike.${pattern},order_number.ilike.${pattern}`);
      }
      if (signal) q = q.abortSignal(signal) as typeof q;
      const { data, error, count } = await q;
      if (error) {
        // eslint-disable-next-line no-console
        console.warn(
          '[gensanCache] readExecutiveOrdersPage failed',
          error.message
        );
        return { rows: [], total: 0 };
      }
      return {
        rows: (data ?? []) as unknown as ExecutiveOrderRow[],
        total: count ?? 0,
      };
    },
    { rows: [], total: 0 },
    signal
  )
  );
}

/** All distinct years present in the EO cache, descending. */
export async function readExecutiveOrderYears(
  signal?: AbortSignal
): Promise<number[]> {
  return memo('readExecutiveOrderYears', [], () =>
  safe(
    'readExecutiveOrderYears',
    async () => {
      let q = supabase
        .from('executive_orders_cache' as never)
        .select('year')
        .not('year', 'is', null);
      if (signal) q = q.abortSignal(signal) as typeof q;
      const { data, error } = await q;
      if (error) {
        console.warn(
          '[gensanCache] readExecutiveOrderYears failed',
          error.message
        );
        return [];
      }
      const set = new Set<number>();
      for (const r of (data ?? []) as unknown as { year: number | null }[]) {
        if (r.year != null) set.add(r.year);
      }
      return Array.from(set).sort((a, b) => b - a);
    },
    [],
    signal
  )
  );
}

/** Single EO by UUID — used by the /government/executive-orders/:id detail page. */
export async function readExecutiveOrderById(
  id: string,
  signal?: AbortSignal
): Promise<ExecutiveOrderRow | null> {
  return memo('readExecutiveOrderById', [id], () =>
  safe(
    'readExecutiveOrderById',
    async () => {
      let q = supabase
        .from('executive_orders_cache' as never)
        .select(EO_COLUMNS)
        .eq('id', id);
      if (signal) q = q.abortSignal(signal) as typeof q;
      const { data, error } = await q.maybeSingle();
      if (error) {
        console.warn(
          '[gensanCache] readExecutiveOrderById failed',
          error.message
        );
        return null;
      }
      return (data ?? null) as unknown as ExecutiveOrderRow | null;
    },
    null,
    signal
  )
  );
}

// ---------- SPLIS readers ----------

const SPLIS_COLUMNS =
  'id, source_slug, record_type, record_no, record_year, title, category, internal_id, pdf_url, pdf_filename, view_count, status, source_removed_at, first_seen_at, last_seen_at, last_synced_at';

/** Latest N SPLIS records across BOTH types, sorted by year desc + numeric
 *  record_no desc. The cache table stores record_no as text, so we sort
 *  client-side after fetching a slightly larger window. */
export async function readSplisLatest(
  limit = 5,
  signal?: AbortSignal
): Promise<SplisRow[]> {
  return memo('readSplisLatest', [limit], () =>
  safe(
    'readSplisLatest',
    async () => {
      let q = supabase
        .from('splis_cache' as never)
        .select(SPLIS_COLUMNS)
        .order('record_year', { ascending: false, nullsFirst: false })
        .order('first_seen_at', { ascending: false })
        .limit(limit * 6);
      if (signal) q = q.abortSignal(signal) as typeof q;
      const { data, error } = await q;
      if (error) {
        console.warn('[gensanCache] readSplisLatest failed', error.message);
        return [];
      }
      const rows = (data ?? []) as unknown as SplisRow[];
      rows.sort((a, b) => {
        if ((b.record_year ?? 0) !== (a.record_year ?? 0)) {
          return (b.record_year ?? 0) - (a.record_year ?? 0);
        }
        const an = Number(a.record_no);
        const bn = Number(b.record_no);
        if (Number.isFinite(an) && Number.isFinite(bn)) return bn - an;
        return (b.record_no || '').localeCompare(a.record_no || '');
      });
      return rows.slice(0, limit);
    },
    [],
    signal
  )
  );
}

/** Per-type paginated read for the future SPLIS archive page. */
export async function readSplisPage(
  recordType: SplisRecordType | 'All',
  page: number,
  pageSize: number,
  year?: number | null,
  search?: string | null,
  signal?: AbortSignal
): Promise<{ rows: SplisRow[]; total: number }> {
  return memo(
    'readSplisPage',
    [recordType, page, pageSize, year, search],
    () => safe(
    'readSplisPage',
    async () => {
      const safePageNum = Math.max(1, Math.floor(page));
      const safeSize = Math.max(1, Math.min(100, Math.floor(pageSize)));
      const from = (safePageNum - 1) * safeSize;
      const to = from + safeSize - 1;

      let q = supabase
        .from('splis_cache' as never)
        .select(SPLIS_COLUMNS, { count: 'exact' })
        .order('record_year', { ascending: false, nullsFirst: false })
        .order('first_seen_at', { ascending: false })
        .range(from, to);
      if (recordType !== 'All') q = q.eq('record_type', recordType);
      if (year != null) q = q.eq('record_year', year);

      const trimmed = (search ?? '').trim();
      if (trimmed) {
        const escaped = trimmed.replace(/[%_\\]/g, ch => `\\${ch}`);
        const pattern = `%${escaped}%`;
        q = q.or(
          `title.ilike.${pattern},record_no.ilike.${pattern},category.ilike.${pattern}`
        );
      }
      if (signal) q = q.abortSignal(signal) as typeof q;

      const { data, error, count } = await q;
      if (error) {
        console.warn('[gensanCache] readSplisPage failed', error.message);
        return { rows: [], total: 0 };
      }
      return {
        rows: (data ?? []) as unknown as SplisRow[],
        total: count ?? 0,
      };
    },
    { rows: [], total: 0 },
    signal
  )
  );
}

export async function readSplisYears(signal?: AbortSignal): Promise<number[]> {
  return memo('readSplisYears', [], () =>
  safe(
    'readSplisYears',
    async () => {
      let q = supabase
        .from('splis_cache' as never)
        .select('record_year')
        .not('record_year', 'is', null);
      if (signal) q = q.abortSignal(signal) as typeof q;
      const { data, error } = await q;
      if (error) {
        console.warn('[gensanCache] readSplisYears failed', error.message);
        return [];
      }
      const set = new Set<number>();
      for (const r of (data ?? []) as unknown as {
        record_year: number | null;
      }[]) {
        if (r.record_year != null) set.add(r.record_year);
      }
      return Array.from(set).sort((a, b) => b - a);
    },
    [],
    signal
  )
  );
}

/** Total + per-record_type counts for the SPLIS cache. */
export async function readSplisCounts(signal?: AbortSignal): Promise<{
  total: number;
  perType: Record<SplisRecordType, number>;
}> {
  return memo('readSplisCounts', [], () =>
  safe(
    'readSplisCounts',
    async () => {
      const out: Record<SplisRecordType, number> = {
        Ordinance: 0,
        Resolution: 0,
      };
      await Promise.all(
        (['Ordinance', 'Resolution'] as SplisRecordType[]).map(async t => {
          try {
            let q = supabase
              .from('splis_cache' as never)
              .select('id', { count: 'exact', head: true })
              .eq('record_type', t);
            if (signal) q = q.abortSignal(signal) as typeof q;
            const { count, error } = await q;
            if (error) {
              console.warn(`[gensanCache] count(${t}) failed`, error.message);
            } else {
              out[t] = count ?? 0;
            }
          } catch (e) {
            console.warn(
              `[gensanCache] count(${t}) threw`,
              e instanceof Error ? e.message : e
            );
          }
        })
      );
      return { total: out.Ordinance + out.Resolution, perType: out };
    },
    { total: 0, perType: { Ordinance: 0, Resolution: 0 } },
    signal
  )
  );
}

/** Total cached EO count. */
export async function readExecutiveOrderCount(
  signal?: AbortSignal
): Promise<number> {
  return memo('readExecutiveOrderCount', [], () =>
  safe(
    'readExecutiveOrderCount',
    async () => {
      let q = supabase
        .from('executive_orders_cache' as never)
        .select('id', { count: 'exact', head: true });
      if (signal) q = q.abortSignal(signal) as typeof q;
      const { count, error } = await q;
      if (error) {
        console.warn(
          '[gensanCache] readExecutiveOrderCount failed',
          error.message
        );
        return 0;
      }
      return count ?? 0;
    },
    0,
    signal
  )
  );
}

export async function readSplisById(
  id: string,
  signal?: AbortSignal
): Promise<SplisRow | null> {
  return memo('readSplisById', [id], () =>
  safe(
    'readSplisById',
    async () => {
      let q = supabase
        .from('splis_cache' as never)
        .select(SPLIS_COLUMNS)
        .eq('id', id);
      if (signal) q = q.abortSignal(signal) as typeof q;
      const { data, error } = await q.maybeSingle();
      if (error) {
        console.warn('[gensanCache] readSplisById failed', error.message);
        return null;
      }
      return (data ?? null) as unknown as SplisRow | null;
    },
    null,
    signal
  )
  );
}

// ---------- UI-only title normalizer ----------
//
// Government/civic source data is often stored in ALL CAPS — pleasant for
// audit logs, terrible for citizen UIs. normalizeTitle() converts ALL-CAPS
// strings into readable Title Case at render time only. The DB value is
// never modified — this is purely a presentation helper.
//
// Behavior:
//   1. If the title is NOT mostly uppercase (< 70% upper letters), return as-is
//   2. Otherwise: lowercase everything, then re-case word by word:
//      - Acronyms in the ACRONYMS set stay all-caps
//      - Minor words (of, the, in, and, …) stay lowercase unless first
//      - All other words get a leading capital
//   3. Hyphenated compounds are recursed so "ANTI-DRUG" → "Anti-Drug"
//   4. Whitespace is collapsed and trimmed

const ACRONYMS = new Set([
  // Core gov / civic
  'EO',
  'RA',
  'LGU',
  'HUC',
  'IRR',
  'MOA',
  'MOU',
  'PWD',
  'GAD',
  'CCT',
  'OFW',
  // Departments / national agencies
  'DOH',
  'DPWH',
  'DENR',
  'DSWD',
  'DTI',
  'DOLE',
  'DEPED',
  'DICT',
  'DOTR',
  'DBM',
  'COA',
  'BIR',
  'PSA',
  'NEDA',
  'NGA',
  'OSCA',
  // Agencies / orgs
  'BAC',
  'CDC',
  'CSO',
  'PNP',
  'AFP',
  'BJMP',
  'BFP',
  'GSIS',
  'SSS',
  'PHIVOLCS',
  // GenSan / Mindanao specific
  'GSC',
  'GSCEPA',
  'GSCDRRMC',
  'DRRMC',
  'BPLO',
  'CSWDO',
  'SOCCSKSARGEN',
  'GES',
  // Common civic acronyms seen in real GenSan EO titles
  'CDP',
  'LDIP',
  'ELA',
  'TWG',
  'PPP',
  'PMC',
  'HRDC',
  'CART',
  'CGLMC',
  'CNA',
  'JLPC',
  'PLEB',
  'SDEC',
  'LSB',
  'LZRC',
  'DCC',
  'CZBA',
  'BISIG',
  'VAWC',
  'ADO',
  'PPPB',
  'CTRC',
  // General tech / docs
  'IT',
  'AI',
  'API',
  'URL',
  'PDF',
  'COVID',
  'CCTV',
]);

const MINOR_WORDS = new Set([
  'of',
  'the',
  'in',
  'and',
  'for',
  'to',
  'with',
  'by',
  'on',
  'at',
  'a',
  'an',
  'or',
  'as',
  'from',
  'into',
  'per',
  'via',
]);

function titleCaseToken(token: string, isFirst: boolean): string {
  if (!token) return token;
  // Pure punctuation/number — leave alone
  const letters = token.replace(/[^a-zA-Z]/g, '');
  if (!letters) return token;
  // Acronym check (case-insensitive)
  if (ACRONYMS.has(letters.toUpperCase())) return token.toUpperCase();
  // Hyphenated compound → recurse so "ANTI-DRUG" → "Anti-Drug"
  if (token.includes('-')) {
    return token
      .split('-')
      .map((p, i) => titleCaseToken(p, isFirst && i === 0))
      .join('-');
  }
  const lower = token.toLowerCase();
  // Minor words (only when not the first token in the title)
  const lowerLetters = lower.replace(/[^a-z]/g, '');
  if (!isFirst && MINOR_WORDS.has(lowerLetters)) return lower;
  // Standard title case
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * UI-only title normalizer. Returns a display string with sensible casing.
 * Source data is NEVER modified — call this at render time only.
 */
export function normalizeTitle(raw: string | null | undefined): string {
  if (!raw) return '';
  const trimmed = raw.replace(/\s+/g, ' ').trim();
  if (!trimmed) return trimmed;

  const totalLetters = (trimmed.match(/[a-zA-Z]/g) || []).length;
  if (totalLetters === 0) return trimmed;
  const upperLetters = (trimmed.match(/[A-Z]/g) || []).length;
  // Only normalize when the title is overwhelmingly upper-case (>= 70%).
  // Already-cased titles are returned untouched.
  if (upperLetters / totalLetters < 0.7) return trimmed;

  return trimmed
    .split(' ')
    .map((token, i) => titleCaseToken(token, i === 0))
    .join(' ');
}

/**
 * Strips the boilerplate "AN EXECUTIVE ORDER" preamble (and common typos seen
 * in real data) and clamps to a word count. Used by EO cards in the homepage
 * subsection so the title fits in 2 lines instead of looking like a legal blob.
 */
export function shortenEoTitle(title: string, maxWords = 12): string {
  if (!title) return '';
  // Strip preamble variants (with case-insensitive match).
  const stripped = title.replace(
    /^\s*an\s+(?:executive\s+order|executive\s+number|exeutive\s+order|executve\s+order)\s*/i,
    ''
  );
  const cleaned = stripped.trim();
  if (!cleaned) return title; // safety fallback
  const words = cleaned.split(/\s+/);
  if (words.length <= maxWords) return cleaned;
  return words.slice(0, maxWords).join(' ') + '…';
}

export async function readProcurement(
  endpoint: string,
  limit = 8,
  signal?: AbortSignal
): Promise<ProcurementRow[]> {
  return memo('readProcurement', [endpoint, limit], () =>
  safe(
    'readProcurement',
    async () => {
      let q = supabase
        .from('procurement_cache' as never)
        .select(PROC_COLUMNS)
        .eq('endpoint', endpoint)
        .order('date_posted', { ascending: false, nullsFirst: false })
        .limit(limit);
      if (signal) q = q.abortSignal(signal) as typeof q;
      const { data, error } = await q;
      if (error) {
        console.warn('[gensanCache] readProcurement failed', error.message);
        return [];
      }
      return (data ?? []) as unknown as ProcurementRow[];
    },
    [],
    signal
  )
  );
}

/**
 * Paginated read for the full /procurement detail page.
 * Returns rows for the requested page plus the total count for the endpoint
 * so the UI can render "Page X of Y · N total records".
 */
export async function readProcurementPage(
  endpoint: string,
  page: number,
  pageSize: number,
  search?: string | null,
  signal?: AbortSignal
): Promise<{ rows: ProcurementRow[]; total: number }> {
  return memo(
    'readProcurementPage',
    [endpoint, page, pageSize, search],
    () => safe(
    'readProcurementPage',
    async () => {
      const safePageNum = Math.max(1, Math.floor(page));
      const safeSize = Math.max(1, Math.min(100, Math.floor(pageSize)));
      const from = (safePageNum - 1) * safeSize;
      const to = from + safeSize - 1;

      let q = supabase
        .from('procurement_cache' as never)
        .select(PROC_COLUMNS, { count: 'exact' })
        .eq('endpoint', endpoint)
        .order('date_posted', { ascending: false, nullsFirst: false })
        .order('first_seen_at', { ascending: false })
        .range(from, to);

      const trimmed = (search ?? '').trim();
      if (trimmed) {
        const escaped = trimmed.replace(/[%_\\]/g, ch => `\\${ch}`);
        const pattern = `%${escaped}%`;
        q = q.or(
          `title.ilike.${pattern},supplier.ilike.${pattern},reference_number.ilike.${pattern},category.ilike.${pattern}`
        );
      }
      if (signal) q = q.abortSignal(signal) as typeof q;

      const { data, error, count } = await q;

      if (error) {
        console.warn(
          '[gensanCache] readProcurementPage failed',
          error.message
        );
        return { rows: [], total: 0 };
      }
      return {
        rows: (data ?? []) as unknown as ProcurementRow[],
        total: count ?? 0,
      };
    },
    { rows: [], total: 0 },
    signal
  )
  );
}

/**
 * Returns total cached row counts per endpoint (and the grand total).
 * Used by the procurement section header to show "21,386 records · 7 datasets".
 */
export async function readProcurementCounts(signal?: AbortSignal): Promise<{
  total: number;
  perEndpoint: Record<string, number>;
}> {
  return memo('readProcurementCounts', [], () =>
  safe(
    'readProcurementCounts',
    async () => {
      const out: Record<string, number> = {};
      await Promise.all(
        PROCUREMENT_ENDPOINTS.map(async e => {
          try {
            let q = supabase
              .from('procurement_cache' as never)
              .select('id', { count: 'exact', head: true })
              .eq('endpoint', e.endpoint);
            if (signal) q = q.abortSignal(signal) as typeof q;
            const { count, error } = await q;
            if (error) {
              console.warn(
                `[gensanCache] count(${e.endpoint}) failed`,
                error.message
              );
              out[e.endpoint] = 0;
            } else {
              out[e.endpoint] = count ?? 0;
            }
          } catch (err) {
            console.warn(
              `[gensanCache] count(${e.endpoint}) threw`,
              err instanceof Error ? err.message : err
            );
            out[e.endpoint] = 0;
          }
        })
      );
      const total = Object.values(out).reduce((a, b) => a + b, 0);
      return { total, perEndpoint: out };
    },
    { total: 0, perEndpoint: {} },
    signal
  )
  );
}

/**
 * Read upstream source health for one or more source keys.
 * Returns a Record keyed by source_key. Missing keys are simply absent
 * from the result. Memoized so navigating doesn't refetch every mount.
 */
export async function readUpstreamHealth(
  sourceKeys: string[],
  signal?: AbortSignal
): Promise<Record<string, UpstreamHealthRow>> {
  if (sourceKeys.length === 0) return {};
  return memo(
    'readUpstreamHealth',
    [sourceKeys.slice().sort()],
    () =>
      safe(
        'readUpstreamHealth',
        async () => {
          let q = supabase
            .from('source_upstream_health' as never)
            .select(
              'source_key, source_name, source_url, status, http_status, response_time_ms, is_cloudflare_error, content_ok, status_reason, error_message, checked_at'
            )
            .in('source_key', sourceKeys);
          if (signal) q = q.abortSignal(signal) as typeof q;
          const { data, error } = await q;
          if (error) {
            console.warn(
              '[gensanCache] readUpstreamHealth failed',
              error.message
            );
            return {};
          }
          const out: Record<string, UpstreamHealthRow> = {};
          for (const r of (data ?? []) as unknown as UpstreamHealthRow[]) {
            out[r.source_key] = r;
          }
          return out;
        },
        {},
        signal
      )
  );
}

export async function readSourceHealth(
  slugs: string[],
  signal?: AbortSignal
): Promise<Record<string, SourceHealthRow>> {
  if (slugs.length === 0) return {};
  return memo('readSourceHealth', [slugs.slice().sort()], () =>
  safe(
    'readSourceHealth',
    async () => {
      let q = supabase
        .from('source_health' as never)
        .select(
          'slug, name, expected_ttl_minutes, is_paused, last_success_at, last_failure_at, last_failure_message, freshness_status, open_alerts'
        )
        .in('slug', slugs);
      if (signal) q = q.abortSignal(signal) as typeof q;
      const { data, error } = await q;
      if (error) {
        console.warn('[gensanCache] readSourceHealth failed', error.message);
        return {};
      }
      const out: Record<string, SourceHealthRow> = {};
      for (const r of (data ?? []) as unknown as SourceHealthRow[]) {
        out[r.slug] = r;
      }
      return out;
    },
    {},
    signal
  )
  );
}

// ---------- Freshness derivation ----------
//
// Status ladder is computed relative to each source's `expected_ttl_minutes`,
// NOT a fixed wall-clock window — that way the same logic works for sources
// running every 15 minutes and sources running once a day. The cadence is
// configured per source in `public.sources.expected_ttl_minutes`.
//
//   age < expected_ttl       → healthy (next refresh hasn't happened yet, but
//                               that's normal)
//   expected_ttl ≤ age < 2×  → degraded (one refresh window missed, give it
//                               some grace before alarming)
//   age ≥ 2× expected_ttl    → offline (multiple refreshes missed)
//
// For daily refresh (expected_ttl_minutes=1440):
//   < 24h → healthy · 24-48h → degraded · > 48h → offline
// For 30-min refresh (expected_ttl_minutes=30):
//   < 30m → healthy · 30-60m → degraded · > 1h → offline

export function freshnessFromHealth(
  health: SourceHealthRow | undefined
): FreshnessInfo {
  if (!health || !health.last_success_at) {
    return {
      tone: 'unknown',
      ageText: 'never',
      ageMs: null,
      lastSuccessAt: null,
      lastSuccessLabel: 'Never synced',
    };
  }
  const lastMs = new Date(health.last_success_at).getTime();
  const ageMs = Date.now() - lastMs;
  const healthyLimitMs = (health.expected_ttl_minutes ?? 1440) * 60 * 1000;
  const degradedLimitMs = healthyLimitMs * 2;

  let tone: FreshnessTone;
  if (ageMs < healthyLimitMs) tone = 'healthy';
  else if (ageMs < degradedLimitMs) tone = 'degraded';
  else tone = 'offline';

  return {
    tone,
    ageText: humanAge(ageMs),
    ageMs,
    lastSuccessAt: health.last_success_at,
    lastSuccessLabel: humanTimestamp(health.last_success_at),
  };
}

/**
 * Aggregate multiple FreshnessInfo values into one section-level badge.
 * Picks the worst tone (offline > degraded > healthy > unknown) and the
 * OLDEST lastSuccessAt across the inputs. Used by sections that surface
 * multiple data sources behind a single freshness badge (e.g. CivicDecisions).
 */
export function aggregateFreshness(infos: FreshnessInfo[]): FreshnessInfo {
  if (infos.length === 0) {
    return {
      tone: 'unknown',
      ageText: 'never',
      ageMs: null,
      lastSuccessAt: null,
      lastSuccessLabel: 'Never synced',
    };
  }
  const order: Record<FreshnessTone, number> = {
    offline: 3,
    degraded: 2,
    healthy: 1,
    unknown: 0,
  };
  let worst: FreshnessInfo = infos[0];
  for (const f of infos) {
    if (order[f.tone] > order[worst.tone]) worst = f;
  }
  // Use the oldest lastSuccessAt for the displayed age (most pessimistic).
  let oldest: string | null = null;
  for (const f of infos) {
    if (!f.lastSuccessAt) continue;
    if (oldest === null || f.lastSuccessAt < oldest) oldest = f.lastSuccessAt;
  }
  if (!oldest) return worst;
  const ageMs = Date.now() - new Date(oldest).getTime();
  return {
    tone: worst.tone,
    ageText: humanAge(ageMs),
    ageMs,
    lastSuccessAt: oldest,
    lastSuccessLabel: humanTimestamp(oldest),
  };
}

// ---------- Infrastructure Projects (Bisto.ph) ----------

export const BISTO_SOURCE_SLUG = 'bisto-infrastructure';

export interface InfrastructureProjectRow {
  id: string;
  external_id: string;
  source: string;
  title: string;
  description: string | null;
  agency: string | null;
  contractor: string | null;
  location_text: string | null;
  region: string | null;
  province: string | null;
  city_municipality: string | null;
  barangay: string | null;
  latitude: number | null;
  longitude: number | null;
  budget_amount: number | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  category: string | null;
  geographic_scope_match: string;
  first_seen_at: string;
  last_seen_at: string;
  last_synced_at: string;
  /** Only populated by readInfrastructureProjectById (detail view). */
  raw_payload?: BistoRawPayload | null;
}

/** Shape of the raw upstream Bisto/DPWH record stored in raw_payload. */
export interface BistoRawPayload {
  contractId?: string;
  infraYear?: string;
  progress?: number;
  sourceOfFunds?: string;
  programName?: string;
  amountPaid?: number;
  reportCount?: number;
  isLive?: boolean;
  hasSatelliteImage?: boolean;
  componentCategories?: string;
  livestreamUrl?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

const INFRA_COLUMNS =
  'id, external_id, source, title, description, agency, contractor, location_text, region, province, city_municipality, barangay, latitude, longitude, budget_amount, status, start_date, end_date, category, geographic_scope_match, first_seen_at, last_seen_at, last_synced_at';

/**
 * Fetches infrastructure projects with valid coordinates within GenSan or
 * Region XII. Used by the CityMap infrastructure layer.
 */
export async function readInfrastructureProjects(
  signal?: AbortSignal,
): Promise<InfrastructureProjectRow[]> {
  return memo('readInfrastructureProjects', [], () =>
    safe(
      'readInfrastructureProjects',
      async () => {
        let q = supabase
          .from('infrastructure_projects')
          .select(INFRA_COLUMNS)
          .eq('geographic_scope_match', 'gensan')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .eq('archive_status', 'active')
          .order('last_seen_at', { ascending: false })
          .limit(500);
        if (signal) q = q.abortSignal(signal) as typeof q;
        const { data, error } = await q;
        if (error) {
          console.warn(
            '[gensanCache] readInfrastructureProjects failed',
            error.message,
          );
          return [];
        }
        return (data ?? []) as unknown as InfrastructureProjectRow[];
      },
      [],
      signal,
    ),
  );
}

/**
 * Fetches ALL active infrastructure projects (including those without
 * coordinates). Used by the infrastructure listing page's table tab.
 */
export async function readAllInfrastructureProjects(
  signal?: AbortSignal,
): Promise<InfrastructureProjectRow[]> {
  return memo('readAllInfrastructureProjects', [], () =>
    safe(
      'readAllInfrastructureProjects',
      async () => {
        let q = supabase
          .from('infrastructure_projects')
          .select(INFRA_COLUMNS)
          .eq('geographic_scope_match', 'gensan')
          .eq('archive_status', 'active')
          .order('last_seen_at', { ascending: false })
          .limit(1000);
        if (signal) q = q.abortSignal(signal) as typeof q;
        const { data, error } = await q;
        if (error) {
          console.warn(
            '[gensanCache] readAllInfrastructureProjects failed',
            error.message,
          );
          return [];
        }
        return (data ?? []) as unknown as InfrastructureProjectRow[];
      },
      [],
      signal,
    ),
  );
}

const INFRA_DETAIL_COLUMNS = INFRA_COLUMNS + ', raw_payload';

/**
 * Fetches a single infrastructure project by ID (includes raw_payload).
 */
export async function readInfrastructureProjectById(
  id: string,
  signal?: AbortSignal,
): Promise<InfrastructureProjectRow | null> {
  return memo('readInfrastructureProjectById', [id], () =>
    safe(
      'readInfrastructureProjectById',
      async () => {
        let q = supabase
          .from('infrastructure_projects')
          .select(INFRA_DETAIL_COLUMNS)
          .eq('id', id);
        if (signal) q = q.abortSignal(signal) as typeof q;
        const { data, error } = await q.single();
        if (error) {
          console.warn(
            '[gensanCache] readInfrastructureProjectById failed',
            error.message,
          );
          return null;
        }
        return (data ?? null) as unknown as InfrastructureProjectRow | null;
      },
      null,
      signal,
    ),
  );
}

// ---------- Formatting helpers ----------

export function humanAge(ms: number): string {
  if (ms < 0) return 'just now';
  const min = Math.round(ms / 60000);
  if (min < 1) return 'less than a minute ago';
  if (min === 1) return '1 minute ago';
  if (min < 60) return `${min} minutes ago`;
  const hr = Math.round(min / 60);
  if (hr === 1) return '1 hour ago';
  if (hr < 24) return `${hr} hours ago`;
  const d = Math.round(hr / 24);
  if (d === 1) return '1 day ago';
  return `${d} days ago`;
}

export function humanTimestamp(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function humanDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatPhp(amount: number | null): string | null {
  if (amount == null || isNaN(amount)) return null;
  try {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `\u20B1${amount.toLocaleString()}`;
  }
}
