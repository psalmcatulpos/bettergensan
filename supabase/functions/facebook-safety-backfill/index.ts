// facebook-safety-backfill -- Search-based backfill for GenSan safety reports.
// Uses 150+ targeted search queries across all incident categories.
// Same pipeline as facebook-safety-sync: cheap pre-filter → OpenAI → is_gensan gate → bounded geocoding → bbox check.
//
// Params:
//   ?pages=2      -- cursor pages per query (default 2, ~10 posts each)
//   ?category=all -- filter to one category (fire, theft, assault, etc.)
//   ?force=1      -- always required
//
// Deploy: supabase functions deploy facebook-safety-backfill --no-verify-jwt

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const REGIMENT_BASE = 'https://regiment.me/api/v1/facebook';
const OPENAI_API = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';
const BATCH_SIZE = 5;

// GenSan bounding box (matches gensanBoundary.ts)
const GENSAN_BBOX = { latMin: 5.95, latMax: 6.31, lngMin: 124.99, lngMax: 125.28 };

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors } });

function isInsideBbox(lat: number, lng: number): boolean {
  return lat >= GENSAN_BBOX.latMin && lat <= GENSAN_BBOX.latMax &&
    lng >= GENSAN_BBOX.lngMin && lng <= GENSAN_BBOX.lngMax;
}

// Full query list organized by category
const QUERIES: Record<string, string[]> = {
  theft: [
    'nakaw Gensan', 'ninakaw Gensan', 'robbery General Santos', 'holdap Gensan',
    'snatching Gensan', 'motor nakaw Gensan', 'nanakawan Gensan', 'nanakaw sa Gensan',
    'General Santos nakaw', 'General Santos holdap', 'Gensan nakaw', 'Gensan holdap',
    'kawatan Gensan', 'snatcher Gensan', 'carnap Gensan', 'giilogan Gensan',
  ],
  assault: [
    'sinuntok Gensan', 'nasaksak Gensan', 'stabbed Gensan', 'assault Gensan',
    'away Gensan', 'binugbog Gensan', 'naay away Gensan', 'violent incident Gensan',
    'nasaktan Gensan', 'General Santos barilan', 'Gensan barilan', 'may binaril sa Gensan',
    'saksak Gensan', 'gipatay Gensan', 'gi-atake Gensan', 'binaril Gensan',
  ],
  'drug-related': [
    'drug bust Gensan', 'buy bust Gensan', 'shabu Gensan', 'drug suspect Gensan',
    'drug raid Gensan', 'illegal drugs Gensan', 'PNP drug operation Gensan',
    'drug den Gensan', 'General Santos droga', 'Gensan droga',
    'buy-bust General Santos', 'PDEA Gensan',
  ],
  vehicular: [
    'aksidente Gensan', 'banggaan Gensan', 'vehicular accident Gensan',
    'car crash Gensan', 'motor accident Gensan', 'nabangga Gensan',
    'hit and run Gensan', 'disgrasya Gensan', 'collision Gensan',
    'General Santos aksidente', 'Gensan aksidente', 'General Santos banggaan',
    'Gensan banggaan', 'aksidente sa Gensan', 'banggaan sa Gensan',
    'naay aksidente Gensan', 'may aksidente sa Gensan', 'may banggaan sa Gensan',
    'nasagasaan Gensan', 'naligsan Gensan', 'nabangga General Santos',
  ],
  fire: [
    'sunog Gensan', 'nasunog Gensan', 'fire Gensan', 'sunog bahay Gensan',
    'fire incident Gensan', 'bfp Gensan sunog', 'General Santos sunog',
    'Gensan sunog', 'sunog sa Gensan', 'naay sunog Gensan', 'may sunog sa Gensan',
    'kalayo Gensan', 'nagdilaab Gensan', 'nasunog bahay Gensan',
  ],
  disturbance: [
    'gulo Gensan', 'riot Gensan', 'commotion Gensan', 'public disturbance Gensan',
    'nagkagulo Gensan', 'nag away Gensan', 'nag rambol Gensan',
  ],
  missing: [
    'missing Gensan', 'missing person Gensan', 'nawawala Gensan',
    'lost child Gensan', 'nawala Gensan', 'General Santos missing',
  ],
  disaster: [
    'baha Gensan', 'flood Gensan', 'landslide Gensan', 'bagyo Gensan',
    'flash flood Gensan', 'lindol Gensan', 'General Santos baha', 'Gensan baha',
  ],
  health: [
    'food poisoning Gensan', 'outbreak Gensan', 'dengue Gensan', 'rabies Gensan',
    'public health Gensan',
  ],
  advisory: [
    'road closure Gensan', 'traffic advisory Gensan', 'evacuation Gensan',
    'power interruption Gensan', 'water interruption Gensan', 'General Santos traffic', 'Gensan traffic',
  ],
  other: [
    'incident Gensan', 'emergency Gensan', 'rescue Gensan', '911 Gensan',
    'PNP Gensan', 'General Santos patay', 'Gensan patay', 'naay patay Gensan',
    'may patay sa Gensan', 'General Santos City incident', 'General Santos City police',
    'GenSan krimen', 'GenSan insidente', 'GenSan news today', 'GenSan balita',
  ],
};

// ── Cheap Pre-filter ────────────────────────────────────────────────

const NON_GENSAN_CITIES = [
  'davao', 'koronadal', 'polomolok', 'tupi', 'tacurong', 'kidapawan',
  'cotabato city', 'sarangani', 'manila', 'quezon city', 'cebu',
  'cagayan de oro', 'zamboanga', 'iloilo', 'bacolod', 'baguio',
  'marilog', 'toril', 'tagum', 'digos', 'marbel',
];

const GENSAN_MARKERS = [
  'general santos', 'gensan', 'gensantos', 'gen. santos', 'gen santos',
  'apopong', 'labangal', 'lagao', 'calumpang', 'dadiangas', 'fatima',
  'bula', 'san isidro', 'mabuhay', 'tambler', 'sinawal', 'katangawan',
  'city heights', 'baluan', 'buayan', 'conel', 'ligaya', 'olympog',
  'batomelong', 'tinagacan', 'upper labay', 'bawing',
];

function cheapGensanCheck(message: string): 'pass' | 'non_gensan_keyword' {
  const lower = message.toLowerCase();
  const hasGensan = GENSAN_MARKERS.some(m => lower.includes(m));
  if (hasGensan) return 'pass';
  const hasOtherCity = NON_GENSAN_CITIES.some(c => lower.includes(c));
  if (hasOtherCity) return 'non_gensan_keyword';
  return 'pass';
}

// ── Barangay + Landmark lookups ─────────────────────────────────────

const BARANGAY_CENTROIDS: Record<string, [number, number]> = {
  apopong: [6.131357, 125.130319], baluan: [6.124821, 125.217462],
  batomelong: [6.239089, 125.259239], bawing: [5.982146, 125.112922],
  buayan: [6.111068, 125.230727], bula: [6.103762, 125.193464],
  calumpang: [6.072893, 125.140472], 'city heights': [6.130026, 125.169186],
  conel: [6.201512, 125.187808], 'dadiangas east': [6.116274, 125.176018],
  'dadiangas north': [6.116494, 125.162532], 'dadiangas south': [6.107125, 125.176891],
  'dadiangas west': [6.111056, 125.171022], fatima: [6.074153, 125.114077],
  katangawan: [6.17302, 125.219625], labangal: [6.094374, 125.15206],
  lagao: [6.128079, 125.190378], ligaya: [6.156505, 125.233225],
  mabuhay: [6.184951, 125.141579], olympog: [6.222805, 125.193554],
  'san isidro': [6.143747, 125.179168], 'san jose': [6.070216, 125.023728],
  sinawal: [6.133019, 125.107487], tambler: [6.057907, 125.140455],
  tinagacan: [6.211143, 125.23826], 'upper labay': [6.259783, 125.227484],
};

function lookupBarangay(name: string): { lat: number; lng: number } | null {
  const key = name.toLowerCase().trim();
  const coords = BARANGAY_CENTROIDS[key];
  if (coords) return { lat: coords[0], lng: coords[1] };
  for (const [k, v] of Object.entries(BARANGAY_CENTROIDS)) {
    if (key.includes(k) || k.includes(key)) return { lat: v[0], lng: v[1] };
  }
  return null;
}

const LANDMARKS: Record<string, [number, number]> = {
  'kcc mall': [6.1128, 125.1718], 'kcc': [6.1128, 125.1718],
  'sm gensan': [6.1105, 125.1722], 'sm city gensan': [6.1105, 125.1722], 'sm city': [6.1105, 125.1722],
  'robinsons gensan': [6.1127, 125.1735], 'robinsons place': [6.1127, 125.1735],
  'gaisano mall': [6.1115, 125.1700], 'gaisano grand': [6.1115, 125.1700], 'gaisano': [6.1115, 125.1700],
  'fitmart': [6.1138, 125.1725], 'unitop': [6.1115, 125.1695],
  'public market': [6.1115, 125.1685],
  'city hall': [6.1120, 125.1715], 'gensan city hall': [6.1120, 125.1715],
  'oval plaza': [6.1118, 125.1710], 'plaza heneral santos': [6.1118, 125.1710],
  'queen tuna park': [6.1120, 125.1712],
  'fish port': [6.0790, 125.1520], 'gensan fish port': [6.0790, 125.1520],
  'makar wharf': [6.0770, 125.1490],
  'pioneer avenue': [6.1115, 125.1700], 'santiago boulevard': [6.1095, 125.1690],
  'gensan doctors hospital': [6.1130, 125.1730], 'gensan doctors': [6.1130, 125.1730],
  'st. elizabeth hospital': [6.1140, 125.1700], 'st elizabeth hospital': [6.1140, 125.1700],
  'mindanao medical center': [6.1095, 125.1735],
  'notre dame of dadiangas': [6.1127, 125.1715], 'nddu': [6.1127, 125.1715],
  'mindanao state university': [6.1275, 125.1890], 'msu gensan': [6.1275, 125.1890],
  'ramon magsaysay memorial colleges': [6.1105, 125.1690], 'rmmc': [6.1105, 125.1690],
  'bulaong terminal': [6.1100, 125.1680], 'gensan bus terminal': [6.1100, 125.1680],
  'gensan airport': [6.0590, 125.0960], 'general santos airport': [6.0590, 125.0960],
  'veranza mall': [6.1100, 125.1750], 'veranza': [6.1100, 125.1750],
};

function lookupLandmark(text: string): { lat: number; lng: number } | null {
  const lower = text.toLowerCase();
  for (const [name, coords] of Object.entries(LANDMARKS)) {
    if (lower.includes(name)) return { lat: coords[0], lng: coords[1] };
  }
  return null;
}

// ── Geocoding ───────────────────────────────────────────────────────

async function geocode(locationText: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(`${locationText}, General Santos City, Philippines`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=ph&viewbox=124.99,6.31,125.28,5.95&bounded=1`,
      { headers: { 'User-Agent': 'BetterGenSan/1.0 (civic-tech)' } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      if (!isInsideBbox(lat, lng)) return null;
      return { lat, lng };
    }
  } catch { /* best-effort */ }
  return null;
}

// deno-lint-ignore no-explicit-any
async function fetchSearchWithCursor(query: string, regimentKey: string, cursor?: string): Promise<{ posts: any[]; nextCursor: string | null; hasMore: boolean }> {
  let url = `${REGIMENT_BASE}/search/posts?query=${encodeURIComponent(query)}`;
  if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
  const res = await fetch(url, { headers: { 'X-API-Key': regimentKey, Accept: 'application/json' } });
  const data = await res.json();
  return {
    posts: data.success ? (data.data ?? []) : [],
    nextCursor: data.meta?.page_cursor ?? null,
    hasMore: data.meta?.has_more ?? false,
  };
}

const SYSTEM_PROMPT = `You are a LOCAL news classifier for General Santos City (GenSan), Philippines.

REJECT (is_news: false):
- Non-news: promos, greetings, contests, ads, music, quotes, branding
- NATIONAL news NOT about GenSan/South Cotabato/SOCCSKSARGEN/Region XII
- News from other cities unless it directly involves GenSan
- Government advisories national in scope unless they mention GenSan

ACCEPT (is_news: true) - extract ALL fields:
- is_gensan: boolean — true ONLY if incident occurred in General Santos City (all 26 barangays). false for Davao, Koronadal, Polomolok, Tupi, Tacurong, Kidapawan, Cotabato City, Sarangani towns, Manila, Cebu, etc. When ambiguous, false.
- city: the city where this occurred (e.g. "General Santos City", "Davao City")
- category: Fire, Vehicular, Theft, Assault, Drug-related, Missing Person, Disturbance, Natural Disaster, Public Health, Government Advisory, Other
- severity: low/medium/high
- headline: English, 1 sentence
- summary: English, 2-3 sentences
- barangay: GenSan barangay if mentioned
- landmark: nearest well-known landmark if mentioned (e.g. "KCC Mall", "SM GenSan", "Oval Plaza", "Fish Port"). null if none.
- location_text: most specific location for geocoding (append "General Santos City")
- location_confidence: 0.0-1.0
- date_of_incident: YYYY-MM-DD if mentioned
- tags: keywords

Posts are in Cebuano/Bisaya/Filipino. Translate to English.
Return JSON: { "results": [...] } with post_id, is_news, and (if is_news=true) is_gensan and city.`;

// deno-lint-ignore no-explicit-any
async function classifyBatch(posts: { post_id: string; message: string }[], openaiKey: string): Promise<any[]> {
  const userContent = posts.map((p, i) => `POST ${i + 1} [id: ${p.post_id}]:\n${p.message.slice(0, 1500)}`).join('\n\n---\n\n');
  const res = await fetch(OPENAI_API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OPENAI_MODEL, response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Classify these ${posts.length} posts. Return JSON: { "results": [...] }\n\n${userContent}` },
      ],
      temperature: 0.1, max_tokens: 3000,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  try { return JSON.parse(data.choices?.[0]?.message?.content ?? '{}').results ?? []; }
  catch { return []; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const regimentKey = Deno.env.get('REGIMENT_API_KEY') ??
    (await supabase.rpc('get_vault_secret', { secret_name: 'REGIMENT_API_KEY' })).data;
  const openaiKey = Deno.env.get('OPENAI_API_KEY') ??
    (await supabase.rpc('get_vault_secret', { secret_name: 'OPENAI_API_KEY' })).data;
  if (!regimentKey || !openaiKey) return json({ error: 'API keys not set' }, 500);

  const url = new URL(req.url);
  const maxCursorPages = parseInt(url.searchParams.get('pages') ?? '2');
  const categoryFilter = url.searchParams.get('category') ?? 'all';

  // Build query list
  let queriesToRun: string[] = [];
  if (categoryFilter === 'all') {
    for (const qs of Object.values(QUERIES)) queriesToRun.push(...qs);
  } else {
    queriesToRun = QUERIES[categoryFilter] ?? [];
  }
  if (queriesToRun.length === 0) return json({ error: `No queries for category '${categoryFilter}'` }, 404);

  let totalFetched = 0, totalNew = 0, totalNews = 0, totalInserted = 0, openaiCalls = 0;
  let prefilterSkipped = 0, cityMismatchCount = 0, outOfBboxCount = 0;
  // deno-lint-ignore no-explicit-any
  const results: any[] = [];

  for (const query of queriesToRun) {
    // deno-lint-ignore no-explicit-any
    const allPosts: any[] = [];
    let cursor: string | null = null;

    for (let cp = 0; cp < maxCursorPages; cp++) {
      const result = await fetchSearchWithCursor(query, regimentKey, cursor ?? undefined);
      // deno-lint-ignore no-explicit-any
      for (const p of result.posts) { (p as any)._query = query; }
      allPosts.push(...result.posts);
      cursor = result.nextCursor;
      if (!result.hasMore || !cursor) break;
    }

    const textPosts = allPosts.filter(p => p.message && p.message.trim().length > 10);
    totalFetched += textPosts.length;

    // Dedupe against safety_reports + sync_rejections
    const postIds = textPosts.map(p => p.post_id);
    // deno-lint-ignore no-explicit-any
    const { data: existing } = await (supabase as any).from('safety_reports')
      .select('external_id').in('external_id', postIds);
    const existingIds = new Set((existing ?? []).map((r: { external_id: string }) => r.external_id));
    // deno-lint-ignore no-explicit-any
    const { data: existingRejects } = await (supabase as any).from('sync_rejections')
      .select('external_id').in('external_id', postIds);
    const rejectIds = new Set((existingRejects ?? []).map((r: { external_id: string }) => r.external_id));
    const newPosts = textPosts.filter(p => !existingIds.has(p.post_id) && !rejectIds.has(p.post_id));
    totalNew += newPosts.length;

    if (newPosts.length === 0) {
      results.push({ query, fetched: textPosts.length, new: 0, news: 0 });
      continue;
    }

    // Cheap pre-filter
    // deno-lint-ignore no-explicit-any
    const passedPrefilter: any[] = [];
    for (const post of newPosts) {
      if (cheapGensanCheck(post.message ?? '') === 'non_gensan_keyword') {
        prefilterSkipped++;
        await supabase.from('sync_rejections').insert({
          external_id: post.post_id, source: 'facebook-search',
          source_query: query, reason: 'non_gensan_keyword',
          post_preview: (post.message ?? '').slice(0, 200),
        }).then(() => {}, () => {});
        continue;
      }
      passedPrefilter.push(post);
    }

    if (passedPrefilter.length === 0) {
      results.push({ query, fetched: textPosts.length, new: newPosts.length, news: 0, prefilter_skipped: newPosts.length });
      continue;
    }

    // Classify
    // deno-lint-ignore no-explicit-any
    const classifiedMap = new Map<string, any>();
    for (let i = 0; i < passedPrefilter.length; i += BATCH_SIZE) {
      const batch = passedPrefilter.slice(i, i + BATCH_SIZE).map(p => ({ post_id: p.post_id, message: p.message ?? '' }));
      const classified = await classifyBatch(batch, openaiKey);
      openaiCalls++;
      for (const r of classified) classifiedMap.set(r.post_id, r);
    }

    const nowIso = new Date().toISOString();
    // deno-lint-ignore no-explicit-any
    const rows: any[] = [];
    let qNews = 0;

    for (const post of passedPrefilter) {
      const c = classifiedMap.get(post.post_id);
      const isNews = c?.is_news ?? false;
      const isGensan = c?.is_gensan ?? true;

      if (!isNews) {
        await supabase.from('sync_rejections').insert({
          external_id: post.post_id, source: 'facebook-search',
          source_query: query, reason: 'not_news',
          extracted_city: c?.city ?? null,
          post_preview: (post.message ?? '').slice(0, 200),
        }).then(() => {}, () => {});
      }

      if (isNews && !isGensan) {
        cityMismatchCount++;
        await supabase.from('sync_rejections').insert({
          external_id: post.post_id, source: 'facebook-search',
          source_query: query, reason: 'city_mismatch',
          extracted_city: c?.city ?? null,
          extracted_location: c?.location_text ?? null,
          post_preview: (post.message ?? '').slice(0, 200),
        }).then(() => {}, () => {});
      }

      const isIncident = isNews && isGensan;
      if (isIncident) qNews++;

      // Geocode only incidents
      let lat: number | null = null, lng: number | null = null, locConf = 'none', geoSrc = 'unresolved';

      if (isIncident) {
        const barangay = c?.barangay ?? null;
        const locText = c?.location_text ?? null;
        const landmarkText = c?.landmark ?? null;
        const llmConf = c?.location_confidence ?? 0;

        // Tier 1: Nominatim (bounded)
        if (llmConf >= 0.5 && locText) {
          const geo = await geocode(locText);
          if (geo) { lat = geo.lat; lng = geo.lng; locConf = llmConf >= 0.8 ? 'high' : 'medium'; geoSrc = 'nominatim'; }
        }
        // Tier 2: Landmark
        if (!lat) {
          const lmSearch = landmarkText || locText || '';
          if (lmSearch) {
            const lm = lookupLandmark(lmSearch);
            if (lm) { lat = lm.lat; lng = lm.lng; locConf = 'medium'; geoSrc = 'landmark'; }
          }
        }
        // Tier 3: Barangay centroid
        if (!lat && barangay) {
          const coords = lookupBarangay(barangay);
          if (coords) { lat = coords.lat; lng = coords.lng; locConf = 'low'; geoSrc = 'barangay_centroid'; }
        }
        // Post-geocode bbox check
        if (lat !== null && lng !== null && !isInsideBbox(lat, lng)) {
          outOfBboxCount++;
          await supabase.from('sync_rejections').insert({
            external_id: post.post_id, source: 'facebook-search',
            source_query: query, reason: 'out_of_bbox',
            extracted_city: c?.city ?? null, extracted_location: locText,
            latitude: lat, longitude: lng,
            post_preview: (post.message ?? '').slice(0, 200),
          }).then(() => {}, () => {});
          lat = null; lng = null; locConf = 'none'; geoSrc = 'out_of_bbox';
        }
      }

      rows.push({
        external_id: post.post_id, source: 'facebook-search',
        source_page_id: null, source_page_name: null,
        source_query: query, verified: false, is_incident: isIncident,
        category: c?.category ?? null, severity: c?.severity ?? 'low',
        summary: c?.headline ? `${c.headline}${c.summary ? ' — ' + c.summary : ''}` : null,
        location_extracted: c?.location_text ?? null,
        message: (post.message ?? '').slice(0, 4000),
        message_url: post.url ?? null,
        author_name: post.author?.name ?? null, author_url: post.author?.url ?? null,
        image_url: post.image ?? null, video_url: post.video ?? null,
        reactions_count: post.reactions_count ?? 0, comments_count: post.comments_count ?? 0,
        shares_count: post.reshare_count ?? 0,
        barangay: c?.barangay ?? null, latitude: lat, longitude: lng,
        location_confidence: locConf, geocode_source: geoSrc,
        extracted_city: c?.city ?? null, landmark: c?.landmark ?? null,
        posted_at: new Date(post.timestamp * 1000).toISOString(),
        archive_status: 'active',
        first_seen_at: nowIso, last_seen_at: nowIso, last_synced_at: nowIso,
        raw_payload: post,
      });
    }

    if (rows.length > 0) {
      // deno-lint-ignore no-explicit-any
      const { error } = await (supabase as any).from('safety_reports').upsert(rows, { onConflict: 'external_id,source' });
      if (error) console.warn(`Upsert failed for "${query}": ${error.message}`);
      else totalInserted += rows.length;
    }

    totalNews += qNews;
    results.push({ query, fetched: textPosts.length, new: newPosts.length, news: qNews });
  }

  // Dedup pass
  try { await supabase.rpc('dedup_safety_reports'); } catch { /* ok */ }

  return json({
    backfill: true, category: categoryFilter,
    queries_run: queriesToRun.length, cursor_pages: maxCursorPages,
    total_fetched: totalFetched, total_new: totalNew,
    prefilter_skipped: prefilterSkipped,
    total_news: totalNews, city_mismatch: cityMismatchCount,
    out_of_bbox: outOfBboxCount,
    total_inserted: totalInserted,
    openai_calls: openaiCalls, results,
  });
});
