// csc-refresh — Scrapes CSC (Civil Service Commission) job vacancies from
// csc.gov.ph/career/ DataTables server-side JSON endpoint and upserts
// GenSan-scoped records into public.csc_jobs_cache.
//
// Upstream: GET https://csc.gov.ph/career/inc/server_processing.php
// Strategy: DataTables server-side processing, paginated JSON.
// No Regiment dependency — direct fetch.
//
// Deploy:
//   supabase functions deploy csc-refresh --no-verify-jwt

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const SOURCE_SLUG = 'csc-gensan';
const CSC_URL = 'https://csc.gov.ph/career/inc/server_processing.php';
const PAGE_SIZE = 1000;
const PAGE_DELAY_MS = 600;
const MAX_RECORDS_SANITY = 20000;
const MAX_RETRIES = 3;

const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 BetterGensan-CSC-mirror/1.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- DataTables fetch with retry ---

interface DataTablesResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: unknown[][];
}

async function fetchPage(
  draw: number,
  start: number,
): Promise<{
  parsed: DataTablesResponse;
  http_status: number;
  bytes: number;
  duration_ms: number;
}> {
  const params = new URLSearchParams({
    draw: String(draw),
    start: String(start),
    length: String(PAGE_SIZE),
    'search[value]': '',
    'order[0][column]': '4',
    'order[0][dir]': 'desc',
  });

  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoff = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await sleep(backoff);
    }

    const t0 = Date.now();
    try {
      const res = await fetch(`${CSC_URL}?${params}`, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          Referer: 'https://csc.gov.ph/career/',
        },
      });
      const text = await res.text();
      const duration_ms = Date.now() - t0;

      if (!res.ok) {
        lastErr = Object.assign(
          new Error(`CSC ${res.status}: ${text.slice(0, 200)}`),
          { http_status: res.status, duration_ms, bytes: text.length },
        );
        continue;
      }

      const parsed = JSON.parse(text) as DataTablesResponse;
      return { parsed, http_status: res.status, bytes: text.length, duration_ms };
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr ?? new Error('fetchPage failed after retries');
}

// --- Alert helper (mirrors hrmdo-refresh) ---

async function upsertAlert(
  supabase: SupabaseClient,
  source_id: string,
  run_id: number,
  kind: string,
  severity: string,
  message: string,
  details: Record<string, unknown> = {},
) {
  const { data: existing } = await supabase
    .from('scrape_alerts')
    .select('id, seen_count')
    .eq('source_id', source_id)
    .eq('kind', kind)
    .is('resolved_at', null)
    .order('last_seen_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('scrape_alerts')
      .update({
        last_seen_at: new Date().toISOString(),
        seen_count: (existing.seen_count as number) + 1,
        severity,
        message,
        details,
        run_id,
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('scrape_alerts').insert({
      source_id,
      run_id,
      kind,
      severity,
      message,
      details,
    });
  }
}

// --- Main handler ---

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const url = new URL(req.url);
  const force = url.searchParams.get('force') === '1';
  const trigger = url.searchParams.get('trigger') ?? 'schedule';

  // Look up source row
  const { data: source, error: sourceErr } = await supabase
    .from('sources')
    .select('id, slug, is_active, is_paused')
    .eq('slug', SOURCE_SLUG)
    .maybeSingle();

  if (sourceErr) return json({ error: sourceErr.message }, 500);
  if (!source)
    return json({ error: `Source ${SOURCE_SLUG} not registered` }, 404);

  if (source.is_paused) {
    return json({ refreshed: false, paused: true, message: 'Source is paused' });
  }

  // Cache gate
  const { data: lastSuccess } = await supabase
    .from('scrape_runs')
    .select('started_at')
    .eq('source_id', source.id)
    .eq('status', 'success')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const now = Date.now();
  const lastAt = lastSuccess
    ? new Date(lastSuccess.started_at as string).getTime()
    : 0;
  const age = lastAt ? now - lastAt : null;
  const stale = force || !lastSuccess || (age !== null && age >= CACHE_TTL_MS);

  if (!stale) {
    return json({
      refreshed: false,
      cached_age_ms: age,
      last_success_at: lastSuccess?.started_at ?? null,
    });
  }

  // Open scrape_run
  const startedAt = new Date().toISOString();
  const { data: runRow, error: runErr } = await supabase
    .from('scrape_runs')
    .insert({
      source_id: source.id,
      status: 'running',
      trigger,
      started_at: startedAt,
    })
    .select('id')
    .single();

  if (runErr || !runRow) {
    return json({ error: `Failed to open scrape_run: ${runErr?.message}` }, 500);
  }
  const run_id = runRow.id as number;
  const runStart = Date.now();

  try {
    // Paginate through all records
    const allRows: unknown[][] = [];
    let draw = 1;
    let start = 0;
    let recordsTotal = 0;
    let totalBytes = 0;
    let totalDurationMs = 0;
    let pagesFetched = 0;
    let httpStatus = 200;

    while (true) {
      const result = await fetchPage(draw, start);
      httpStatus = result.http_status;
      totalBytes += result.bytes;
      totalDurationMs += result.duration_ms;
      pagesFetched++;

      if (draw === 1) {
        recordsTotal = result.parsed.recordsTotal;

        // Sanity check
        if (recordsTotal > MAX_RECORDS_SANITY) {
          throw new Error(
            `recordsTotal ${recordsTotal} exceeds sanity limit ${MAX_RECORDS_SANITY}`,
          );
        }

        // Log first row structure for column mapping
        if (result.parsed.data.length > 0) {
          console.info(
            `[csc-refresh] First row (${result.parsed.data[0].length} columns):`,
            JSON.stringify(result.parsed.data[0]),
          );
        }

        // Store snapshot of first page
        await supabase.from('snapshots').insert({
          run_id,
          source_id: source.id,
          url: CSC_URL,
          kind: 'json',
          bytes: result.bytes,
          inline: {
            recordsTotal: result.parsed.recordsTotal,
            recordsFiltered: result.parsed.recordsFiltered,
            columns_in_first_row: result.parsed.data[0]?.length ?? 0,
            sample: result.parsed.data.slice(0, 5),
          },
        });
      }

      // Log page_fetch
      await supabase.from('page_fetches').insert({
        run_id,
        url: `${CSC_URL}?draw=${draw}&start=${start}&length=${PAGE_SIZE}`,
        method: 'GET',
        http_status: result.http_status,
        content_type: 'application/json',
        bytes: result.bytes,
        duration_ms: result.duration_ms,
      });

      allRows.push(...result.parsed.data);

      // Check if we've fetched everything
      if (allRows.length >= recordsTotal || result.parsed.data.length < PAGE_SIZE) {
        break;
      }

      draw++;
      start += PAGE_SIZE;
      await sleep(PAGE_DELAY_MS);
    }

    // Column count check
    if (allRows.length > 0 && (allRows[0] as unknown[]).length < 6) {
      await upsertAlert(
        supabase,
        source.id,
        run_id,
        'selector_missing',
        'high',
        `CSC row has only ${(allRows[0] as unknown[]).length} columns, expected ≥6`,
      );
    }

    // Zero-row alert
    if (allRows.length === 0) {
      await upsertAlert(
        supabase,
        source.id,
        run_id,
        'zero_rows',
        'high',
        'CSC DataTables returned 0 rows',
      );
    }

    // Close scrape_run — shell only, no upsert yet
    await supabase
      .from('scrape_runs')
      .update({
        status: 'success',
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - runStart,
        records_total: allRows.length,
        records_inserted: 0, // shell — no upsert yet
        http_status: httpStatus,
        metadata: {
          records_total_at_source: recordsTotal,
          pages_fetched: pagesFetched,
          total_bytes: totalBytes,
          total_duration_ms: totalDurationMs,
          columns_in_first_row: allRows[0]
            ? (allRows[0] as unknown[]).length
            : 0,
        },
      })
      .eq('id', run_id);

    return json({
      refreshed: true,
      records_total_at_source: recordsTotal,
      rows_fetched: allRows.length,
      pages_fetched: pagesFetched,
      columns_in_first_row: allRows[0] ? (allRows[0] as unknown[]).length : 0,
      run_id,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const httpStatus =
      (e as unknown as { http_status?: number }).http_status ?? null;

    await supabase.from('page_fetches').insert({
      run_id,
      url: CSC_URL,
      method: 'GET',
      http_status: httpStatus,
      duration_ms:
        (e as unknown as { duration_ms?: number }).duration_ms ?? null,
      bytes: (e as unknown as { bytes?: number }).bytes ?? null,
      error: msg,
    });

    await supabase
      .from('scrape_runs')
      .update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - runStart,
        error_message: msg,
        http_status: httpStatus,
      })
      .eq('id', run_id);

    let kind = 'other';
    let severity = 'high';
    if (httpStatus && httpStatus >= 500) {
      kind = 'http_error';
      severity = 'critical';
    } else if (httpStatus === 403 || httpStatus === 401) {
      kind = 'blocked';
      severity = 'high';
    } else if (httpStatus && httpStatus >= 400) {
      kind = 'http_error';
      severity = 'high';
    } else if (msg.includes('sanity limit')) {
      kind = 'other';
      severity = 'critical';
    }

    await upsertAlert(supabase, source.id, run_id, kind, severity, msg);

    return json({ refreshed: false, error: msg, run_id }, 502);
  }
});
