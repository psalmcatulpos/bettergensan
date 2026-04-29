// hrmdo-refresh — Scrapes government job vacancies from the GenSan HRMDO
// careers page and upserts into public.gov_jobs_cache.
//
// Upstream: https://hrmdo.gensantos.gov.ph/index.php/Careers
// Strategy: server-rendered HTML table, all fields in data-* attributes
// on .view-btn elements. No pagination (DataTables with paging: false).
//
// Deploy:
//   supabase functions deploy hrmdo-refresh --no-verify-jwt

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const SOURCE_SLUG = 'gensan-hrmdo';
const CAREERS_URL = 'https://hrmdo.gensantos.gov.ph/index.php/Careers';
const APPLY_URL = 'https://hrmdo.gensantos.gov.ph/index.php/Careers/Apply';

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

// --- HTML parsing ---

interface RawVacancy {
  id: string;
  position: string;
  plantilla_item_no: string;
  salary_grade: number;
  monthly_salary: number;
  place_of_assignment: string;
  evaluator_email: string | null;
  education: string;
  training: string;
  experience: string;
  eligibility: string;
  competency: string;
  posting_date: string | null;
  closing_date: string | null;
}

function parseVacancies(html: string): RawVacancy[] {
  const vacancies: RawVacancy[] = [];

  // Match all elements with class="view-btn" and extract data-* attributes.
  // The HRMDO page uses: data-id, data-positiontitle, data-plantillaitemno,
  // data-salarygrade, data-monthlysalary, data-qseducation, data-qstraining,
  // data-qsexperience, data-qselgibility (sic), data-qscompetency,
  // data-qsplaceofassignment, data-postingdate, data-closingdate,
  // data-evaluatorsemail
  const btnRegex =
    /<[^>]+class="[^"]*view-btn[^"]*"[^>]*>/gi;

  let match: RegExpExecArray | null;
  while ((match = btnRegex.exec(html)) !== null) {
    const tag = match[0];

    const attr = (name: string): string => {
      const re = new RegExp(`data-${name}="([^"]*)"`, 'i');
      const m = tag.match(re);
      return m ? decodeHtmlEntities(m[1]).trim() : '';
    };

    const id = attr('id');
    const position = attr('positiontitle');
    if (!id || !position) continue;

    const sg = parseInt(attr('salarygrade'), 10);
    const salary = parseFloat(attr('monthlysalary'));
    const rawPostingDate = attr('postingdate');
    const rawClosingDate = attr('closingdate');

    // HRMDO uses 0000-00-00 for blank dates — treat as null
    const postingDate =
      rawPostingDate && !rawPostingDate.startsWith('0000')
        ? rawPostingDate
        : null;
    const closingDate =
      rawClosingDate && !rawClosingDate.startsWith('0000')
        ? rawClosingDate
        : null;

    vacancies.push({
      id,
      position,
      plantilla_item_no: attr('plantillaitemno'),
      salary_grade: isNaN(sg) ? 0 : sg,
      monthly_salary: isNaN(salary) ? 0 : salary,
      place_of_assignment: attr('qsplaceofassignment'),
      evaluator_email: attr('evaluatorsemail') || null,
      education: attr('qseducation'),
      training: attr('qstraining'),
      experience: attr('qsexperience'),
      eligibility: attr('qselgibility'), // sic — HRMDO typo
      competency: attr('qscompetency'),
      posting_date: postingDate,
      closing_date: closingDate,
    });
  }

  return vacancies;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'");
}

// --- Hash for dedup ---

async function hashId(
  hrmdoId: string,
  plantillaItemNo: string,
  postingDate: string | null,
): Promise<string> {
  const raw = `${hrmdoId}|${plantillaItemNo}|${postingDate ?? ''}`;
  const buf = await crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(raw),
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// --- Map to upsert rows ---

async function mapToRows(
  vacancies: RawVacancy[],
): Promise<Record<string, unknown>[]> {
  const now = new Date().toISOString();
  const rows: Record<string, unknown>[] = [];

  for (const v of vacancies) {
    const id = await hashId(v.id, v.plantilla_item_no, v.posting_date);
    rows.push({
      id,
      position: v.position,
      plantilla_item_no: v.plantilla_item_no,
      salary_grade: v.salary_grade,
      monthly_salary: v.monthly_salary,
      place_of_assignment: v.place_of_assignment,
      evaluator_email: v.evaluator_email,
      education: v.education,
      training: v.training,
      experience: v.experience,
      eligibility: v.eligibility,
      competency: v.competency,
      posting_date: v.posting_date,
      closing_date: v.closing_date,
      source_url: CAREERS_URL,
      apply_url: APPLY_URL,
      last_seen_at: now,
      missing_from_source: false,
    });
  }

  return rows;
}

// --- Alert helper ---

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
    // Fetch the careers page
    const t0 = Date.now();
    const res = await fetch(CAREERS_URL, {
      headers: {
        'User-Agent': 'BetterGensan/1.0 (civic-data-cache)',
        Accept: 'text/html',
      },
    });
    const html = await res.text();
    const fetchDuration = Date.now() - t0;

    // Log page_fetch
    await supabase.from('page_fetches').insert({
      run_id,
      url: CAREERS_URL,
      method: 'GET',
      http_status: res.status,
      content_type: res.headers.get('content-type') ?? 'text/html',
      bytes: html.length,
      duration_ms: fetchDuration,
    });

    if (!res.ok) {
      throw Object.assign(
        new Error(`HRMDO ${res.status}: ${html.slice(0, 200)}`),
        { http_status: res.status, duration_ms: fetchDuration, bytes: html.length },
      );
    }

    // Parse vacancies from HTML
    const vacancies = parseVacancies(html);

    // Store snapshot
    await supabase.from('snapshots').insert({
      run_id,
      source_id: source.id,
      url: CAREERS_URL,
      kind: 'html',
      bytes: html.length,
      inline: {
        total_parsed: vacancies.length,
        sample: vacancies.slice(0, 5),
      },
    });

    // Map and upsert
    const rows = await mapToRows(vacancies);
    let inserted = 0;
    const CHUNK = 200;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const slice = rows.slice(i, i + CHUNK);
      const { error } = await supabase
        .from('gov_jobs_cache')
        .upsert(slice, { onConflict: 'id' });
      if (error) throw new Error(`Upsert failed: ${error.message}`);
      inserted += slice.length;
    }

    // Mark missing: any row in gov_jobs_cache whose last_seen_at < runStart
    // was not in this scrape's results — it's been removed from the HRMDO page.
    const { error: missingErr } = await supabase
      .from('gov_jobs_cache')
      .update({ missing_from_source: true })
      .lt('last_seen_at', startedAt)
      .eq('missing_from_source', false);
    if (missingErr) {
      // Non-fatal — log but don't fail the run
      await upsertAlert(
        supabase,
        source.id,
        run_id,
        'other',
        'low',
        `Missing-from-source sweep failed: ${missingErr.message}`,
      );
    }

    // Zero-row alert
    if (vacancies.length === 0) {
      await upsertAlert(
        supabase,
        source.id,
        run_id,
        'zero_rows',
        'high',
        'HRMDO careers page returned 0 parseable vacancies',
      );
    }

    // Close scrape_run
    await supabase
      .from('scrape_runs')
      .update({
        status: 'success',
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - runStart,
        records_total: vacancies.length,
        records_inserted: inserted,
        http_status: res.status,
        metadata: {
          html_bytes: html.length,
          vacancies_parsed: vacancies.length,
          rows_upserted: inserted,
        },
      })
      .eq('id', run_id);

    return json({
      refreshed: true,
      vacancies_parsed: vacancies.length,
      rows_upserted: inserted,
      run_id,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const http_status =
      (e as unknown as { http_status?: number }).http_status ?? null;

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
    } else if (msg.includes('0 parseable')) {
      kind = 'selector_missing';
      severity = 'high';
    }

    await upsertAlert(supabase, source.id, run_id, kind, severity, msg);

    return json({ refreshed: false, error: msg, run_id }, 502);
  }
});
