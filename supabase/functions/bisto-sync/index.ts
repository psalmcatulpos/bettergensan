// bisto-sync — Fetches infrastructure projects from Bisto.ph / BetterGov
// multi-search API (Meilisearch), scopes to Region XII / General Santos,
// and upserts into public.infrastructure_projects.
//
// Upstream: POST https://search2.bettergov.ph/multi-search
// Index: dpwh (Department of Public Works and Highways)
//
// Deploy after merging the feature branch:
//   supabase functions deploy bisto-sync --no-verify-jwt

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const SOURCE_SLUG = 'bisto-infrastructure';
const SEARCH_URL = 'https://search2.bettergov.ph/multi-search';
const SEARCH_TOKEN =
  '307c9f43a066a443cc37d62b45fa47fde2b39f765139dd964ea151daed65f55c';
const INDEX_UID = 'dpwh';

// Meilisearch caps offset+limit at 1000 by default. We paginate to get more.
const PAGE_LIMIT = 1000;
const MAX_PAGES = 10; // safety cap: 10k records max

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

// --- Upstream fetch ---

async function fetchBistoPage(offset: number): Promise<{
  // deno-lint-ignore no-explicit-any
  hits: any[];
  estimatedTotalHits: number;
  http_status: number;
  bytes: number;
  duration_ms: number;
}> {
  const t0 = Date.now();

  const requestBody = {
    queries: [
      {
        indexUid: INDEX_UID,
        q: '',
        limit: PAGE_LIMIT,
        offset,
      },
    ],
  };

  const res = await fetch(SEARCH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SEARCH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  const text = await res.text();
  const duration_ms = Date.now() - t0;

  if (!res.ok) {
    const err = new Error(`Bisto ${res.status}: ${text.slice(0, 200)}`);
    (err as unknown as { http_status: number }).http_status = res.status;
    (err as unknown as { duration_ms: number }).duration_ms = duration_ms;
    (err as unknown as { bytes: number }).bytes = text.length;
    throw err;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Bisto returned non-JSON: ${text.slice(0, 120)}`);
  }

  // Meilisearch multi-search returns { results: [{ hits, estimatedTotalHits, ... }] }
  // deno-lint-ignore no-explicit-any
  const root = parsed as any;
  const result = root?.results?.[0];
  if (!result || !Array.isArray(result.hits)) {
    throw new Error(
      `Unexpected Meilisearch shape: ${JSON.stringify(parsed).slice(0, 200)}`,
    );
  }

  return {
    hits: result.hits,
    estimatedTotalHits: result.estimatedTotalHits ?? result.hits.length,
    http_status: res.status,
    bytes: text.length,
    duration_ms,
  };
}

async function fetchAllBistoProjects(): Promise<{
  // deno-lint-ignore no-explicit-any
  allHits: any[];
  totalEstimated: number;
  totalBytes: number;
  totalDurationMs: number;
  pagesFetched: number;
  http_status: number;
}> {
  // deno-lint-ignore no-explicit-any
  const allHits: any[] = [];
  let totalBytes = 0;
  let totalDurationMs = 0;
  let totalEstimated = 0;
  let pagesFetched = 0;
  let http_status = 200;

  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * PAGE_LIMIT;
    const result = await fetchBistoPage(offset);
    allHits.push(...result.hits);
    totalBytes += result.bytes;
    totalDurationMs += result.duration_ms;
    totalEstimated = result.estimatedTotalHits;
    http_status = result.http_status;
    pagesFetched++;

    // Stop if we've fetched all or this page returned fewer than limit
    if (result.hits.length < PAGE_LIMIT || allHits.length >= totalEstimated) {
      break;
    }
  }

  return {
    allHits,
    totalEstimated,
    totalBytes,
    totalDurationMs,
    pagesFetched,
    http_status,
  };
}

// --- Geographic scoping: GenSan only ---
//
// Uses ray-casting point-in-polygon against the simplified GenSan city
// boundary (150 pts, Douglas-Peucker from OSM Nominatim). Only projects
// whose coordinates fall inside the polygon are kept.

// Simplified GenSan boundary — [lng, lat] pairs per GeoJSON convention.
const GENSAN_RING: [number, number][] = [
  [124.990414,6.141487],[124.990865,6.096684],[124.994727,6.073857],
  [125.005204,6.062115],[125.00543,6.039243],[125.056707,6.039981],
  [125.055916,5.961729],[125.062345,5.965569],[125.067681,5.965032],
  [125.072678,5.96116],[125.082004,5.965128],[125.086856,5.963752],
  [125.091593,5.958687],[125.100004,5.959301],[125.104947,5.954326],
  [125.163007,5.924104],[125.184402,5.948979],[125.194339,5.963583],
  [125.20586,5.99068],[125.210838,6.016928],[125.215001,6.073176],
  [125.219464,6.07962],[125.235,6.083674],[125.236373,6.086192],
  [125.236713,6.094178],[125.239812,6.099442],[125.238122,6.104616],
  [125.240943,6.116889],[125.238417,6.119353],[125.237188,6.123498],
  [125.239184,6.125343],[125.239205,6.128506],[125.235558,6.131589],
  [125.237789,6.134885],[125.236013,6.137013],[125.236158,6.141819],
  [125.234469,6.145691],[125.236035,6.148726],[125.235777,6.152929],
  [125.237237,6.155009],[125.237907,6.162065],[125.240005,6.163713],
  [125.2403,6.166305],[125.238787,6.174465],[125.235354,6.177046],
  [125.236641,6.179297],[125.235461,6.183297],[125.24001,6.19079],
  [125.24398,6.190342],[125.241587,6.198448],[125.245954,6.200587],
  [125.246882,6.204565],[125.250621,6.204896],[125.250578,6.212213],
  [125.253276,6.213562],[125.253325,6.21761],[125.255765,6.219993],
  [125.254725,6.224649],[125.259585,6.224692],[125.260695,6.225769],
  [125.260379,6.228504],[125.256205,6.229283],[125.255974,6.230312],
  [125.267798,6.238903],[125.269991,6.245674],[125.262887,6.246451],
  [125.261037,6.24877],[125.253022,6.249876],[125.253894,6.251014],
  [125.252573,6.252899],[125.253047,6.256377],[125.250677,6.255286],
  [125.251159,6.258575],[125.248138,6.258659],[125.24678,6.263567],
  [125.218296,6.269889],[125.218218,6.272538],[125.216358,6.272783],
  [125.215267,6.276252],[125.212268,6.276732],[125.210475,6.279371],
  [125.207166,6.2804],[125.208305,6.280832],[125.206974,6.281827],
  [125.207501,6.283541],[125.203931,6.282661],[125.20063,6.285249],
  [125.201347,6.286434],[125.199399,6.287354],[125.198036,6.286634],
  [125.19525,6.291696],[125.191736,6.292832],[125.19198,6.294325],
  [125.189984,6.296597],[125.167133,6.291698],[125.152927,6.291995],
  [125.151563,6.288802],[125.14639,6.288395],[125.142567,6.281291],
  [125.13842,6.281351],[125.137342,6.27933],[125.136616,6.274488],
  [125.134607,6.27224],[125.133601,6.268376],[125.135116,6.264613],
  [125.133854,6.260404],[125.135792,6.25967],[125.13434,6.254785],
  [125.134331,6.25176],[125.135576,6.250694],[125.134202,6.247878],
  [125.134846,6.245809],[125.132481,6.238572],[125.127515,6.236557],
  [125.124451,6.232528],[125.126588,6.214325],[125.133497,6.202421],
  [125.133306,6.199486],[125.137349,6.193547],[125.140339,6.183681],
  [125.138697,6.175018],[125.14079,6.169913],[125.139912,6.165424],
  [125.132275,6.15801],[125.130542,6.156515],[125.127656,6.157674],
  [125.124623,6.154847],[125.120303,6.159134],[125.115169,6.154212],
  [125.111701,6.153677],[125.111843,6.152536],[125.107762,6.155907],
  [125.108027,6.157462],[125.106809,6.155594],[125.103372,6.157809],
  [125.101129,6.156374],[125.096726,6.156526],[125.096737,6.155018],
  [125.092726,6.158224],[125.092298,6.157049],[125.090922,6.157673],
  [125.088511,6.156129],[125.085217,6.157145],[125.079142,6.155254],
  [125.076562,6.156582],[125.069542,6.152817],[125.051314,6.152555],
  [125.049164,6.15077],[125.003482,6.14183],[124.990414,6.141487],
];

/** Ray-casting point-in-polygon. Coords are [lng, lat]. */
function isInsideGensan(lat: number, lng: number): boolean {
  let inside = false;
  for (let i = 0, j = GENSAN_RING.length - 1; i < GENSAN_RING.length; j = i++) {
    const xi = GENSAN_RING[i][0], yi = GENSAN_RING[i][1];
    const xj = GENSAN_RING[j][0], yj = GENSAN_RING[j][1];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// --- Record mapping ---

// deno-lint-ignore no-explicit-any
function mapRecords(hits: any[]): any[] {
  const now = new Date().toISOString();
  return hits
    // deno-lint-ignore no-explicit-any
    .map((r: any) => {
      // Bisto uses contractId as the primary identifier
      const externalId = String(
        r.contractId ?? r.id ?? r.external_id ?? r._id ?? r.project_id ?? '',
      );
      if (!externalId) return null;

      // Resolve nested location object
      const loc = r.location && typeof r.location === 'object'
        ? r.location
        : {};

      // Build a human-readable location string from the description
      // (Bisto descriptions often encode the full location)
      const locationText = r.description ?? r.location_text ?? null;

      return {
        external_id: externalId,
        source: 'bisto',
        title: String(
          r.description ?? r.title ?? r.project_title ?? r.name ?? 'Untitled',
        ),
        description: r.description ?? r.project_description ?? null,
        agency: r.programName ?? r.agency ?? r.implementing_agency ?? null,
        contractor: r.contractor ?? null,
        location_text: locationText,
        region: loc.region ?? r.region ?? null,
        province: loc.province ?? r.province ?? null,
        city_municipality:
          r.city_municipality ?? r.city ?? r.municipality ?? null,
        barangay: r.barangay ?? null,
        latitude: r.latitude != null ? Number(r.latitude) : null,
        longitude: r.longitude != null ? Number(r.longitude) : null,
        budget_amount:
          r.budget ?? r.budget_amount ?? r.cost ?? r.amount ??
          r.contract_amount ?? null,
        status: r.status ?? r.project_status ?? null,
        start_date: r.startDate ?? r.start_date ?? r.date_started ?? null,
        end_date:
          r.completionDate ?? r.end_date ?? r.completion_date ??
          r.target_completion ?? null,
        category:
          r.category ?? r.componentCategories ?? r.sector ??
          r.project_type ?? null,
        raw_payload: r,
        geographic_scope_match: 'gensan',
        archive_status: 'active',
        source_removed_at: null,
        first_seen_at: now,
        last_seen_at: now,
        last_synced_at: now,
      };
    })
    .filter(Boolean);
}

// --- Alert helper (same pattern as jobs-refresh) ---

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
    return json({
      refreshed: false,
      paused: true,
      message: 'Source is paused',
    });
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
    return json(
      { error: `Failed to open scrape_run: ${runErr?.message}` },
      500,
    );
  }
  const run_id = runRow.id as number;
  const runStart = Date.now();

  try {
    const fetchResult = await fetchAllBistoProjects();

    // Log page_fetch
    await supabase.from('page_fetches').insert({
      run_id,
      url: SEARCH_URL,
      method: 'POST',
      http_status: fetchResult.http_status,
      content_type: 'application/json',
      bytes: fetchResult.totalBytes,
      duration_ms: fetchResult.totalDurationMs,
    });

    // Store snapshot (sample only to keep inline payload small)
    const snapshotSample = fetchResult.allHits.slice(0, 5);
    await supabase.from('snapshots').insert({
      run_id,
      source_id: source.id,
      url: SEARCH_URL,
      kind: 'json',
      bytes: fetchResult.totalBytes,
      inline: {
        sample_hits: snapshotSample,
        total_hits: fetchResult.allHits.length,
        estimated_total: fetchResult.totalEstimated,
        pages_fetched: fetchResult.pagesFetched,
      },
    });

    // Map all hits then keep only those inside GenSan polygon
    const allRows = mapRecords(fetchResult.allHits);
    const scopedRows = allRows.filter(
      (r) => r.latitude != null && r.longitude != null &&
        isInsideGensan(Number(r.latitude), Number(r.longitude)),
    );
    const discarded = allRows.length - scopedRows.length;

    // Upsert only scoped rows
    let inserted = 0;
    const CHUNK = 500;
    for (let i = 0; i < scopedRows.length; i += CHUNK) {
      const slice = scopedRows.slice(i, i + CHUNK);
      const { error } = await supabase
        .from('infrastructure_projects')
        .upsert(slice, { onConflict: 'external_id,source' });
      if (error) throw new Error(`Upsert failed: ${error.message}`);
      inserted += slice.length;
    }

    // Zero-row alert
    if (scopedRows.length === 0) {
      await upsertAlert(
        supabase,
        source.id,
        run_id,
        'zero_rows',
        'high',
        `Bisto returned ${fetchResult.allHits.length} total hits but 0 fell inside GenSan boundary`,
      );
    }

    // Close scrape_run
    await supabase
      .from('scrape_runs')
      .update({
        status: 'success',
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - runStart,
        records_total: fetchResult.allHits.length,
        records_inserted: inserted,
        http_status: fetchResult.http_status,
        metadata: {
          estimated_total: fetchResult.totalEstimated,
          pages_fetched: fetchResult.pagesFetched,
          gensan_inside: scopedRows.length,
          discarded_outside: discarded,
        },
      })
      .eq('id', run_id);

    return json({
      refreshed: true,
      total_upstream: fetchResult.allHits.length,
      estimated_total: fetchResult.totalEstimated,
      pages_fetched: fetchResult.pagesFetched,
      gensan_inserted: inserted,
      discarded_outside: discarded,
      run_id,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const http_status =
      (e as unknown as { http_status?: number }).http_status ?? null;

    await supabase.from('page_fetches').insert({
      run_id,
      url: SEARCH_URL,
      method: 'POST',
      http_status,
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
        http_status,
      })
      .eq('id', run_id);

    let kind = 'other';
    let severity = 'high';
    if (http_status && http_status >= 500) {
      kind = 'http_error';
      severity = 'critical';
    } else if (http_status === 403 || http_status === 401) {
      kind = 'blocked';
      severity = 'high';
    } else if (http_status && http_status >= 400) {
      kind = 'http_error';
      severity = 'high';
    } else if (
      msg.includes('Unexpected Meilisearch shape') ||
      msg.includes('non-JSON')
    ) {
      kind = 'selector_missing';
      severity = 'high';
    }

    await upsertAlert(supabase, source.id, run_id, kind, severity, msg);

    return json({ refreshed: false, error: msg, run_id }, 502);
  }
});
