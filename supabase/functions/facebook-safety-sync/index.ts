// facebook-safety-sync — Scrapes Facebook pages and search results via Regiment,
// classifies each post through OpenAI (news gate + JSON structuring), and upserts
// into public.safety_reports.
//
// Pipeline order (cheap filters first):
//   1. Fetch from Regiment (pages or search)
//   2. Dedupe against existing external_ids
//   3. Cheap keyword pre-filter (regex — skip posts about other cities)
//   4. OpenAI classification (is_news, is_gensan, category, severity, etc.)
//   5. is_gensan gate (reject non-GenSan incidents)
//   6. Geocoding: bounded Nominatim → landmark dict → barangay centroid → null
//   7. Post-geocode bbox check
//   8. Upsert to safety_reports
//
// Every rejection is logged to public.sync_rejections for observability.
//
// Modes:
//   ?mode=pages  — fetch from curated GenSan news/safety pages (verified)
//   ?mode=search — keyword search for GenSan incidents (unverified)
//   ?force=1     — bypass 12h cache gate
//
// Deploy: supabase functions deploy facebook-safety-sync --no-verify-jwt

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';

// ── Constants ────────────────────────────────────────────────────────

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const REGIMENT_BASE = 'https://regiment.me/api/v1/facebook';
const OPENAI_API = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';
const BATCH_SIZE = 5; // posts per OpenAI call

// GenSan bounding box (matches gensanBoundary.ts)
const GENSAN_BBOX = { latMin: 5.95, latMax: 6.31, lngMin: 124.99, lngMax: 125.28 };

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

function isInsideBbox(lat: number, lng: number): boolean {
  return (
    lat >= GENSAN_BBOX.latMin && lat <= GENSAN_BBOX.latMax &&
    lng >= GENSAN_BBOX.lngMin && lng <= GENSAN_BBOX.lngMax
  );
}

// ── Curated Pages ────────────────────────────────────────────────────

const CURATED_PAGES = [
  { id: '100069225159424', name: 'PNP GenSan (GSCPO PRO12)' },
  { id: '61584668843126', name: 'Gensan Fire Station' },
  { id: '61564288935761', name: 'XFM 95.9 General Santos City' },
  { id: '61562942500688', name: 'Juander Radyo General Santos 87.9 FM' },
  { id: '61560607289848', name: 'IFM Gensan Digital' },
  { id: '100063983052470', name: 'Barangay FM 102.3 Gensan' },
  { id: '100063803273208', name: '99.1 Wild FM Gensan' },
  { id: '100064582754042', name: 'Brigada News GenSan' },
  { id: '100063560241777', name: '96.7 GO Infinite Radio Gensan' },
  { id: '100094598426625', name: 'DZRH News FM Gensan' },
];

const SEARCH_QUERIES = [
  // Original queries
  'General Santos sunog', 'Gensan sunog',
  'General Santos aksidente', 'Gensan aksidente',
  'General Santos banggaan', 'Gensan banggaan',
  'General Santos nakaw', 'Gensan nakaw',
  'General Santos holdap', 'Gensan holdap',
  'General Santos barilan', 'Gensan barilan',
  'General Santos patay', 'Gensan patay',
  'General Santos baha', 'Gensan baha',
  'General Santos traffic', 'Gensan traffic',
  'sunog sa Gensan', 'aksidente sa Gensan',
  'banggaan sa Gensan', 'naay sunog Gensan',
  'naay aksidente Gensan', 'naay barilan Gensan',
  'naay patay Gensan', 'naay nakaw Gensan',
  'disgrasya Gensan', 'may sunog sa Gensan',
  'may aksidente sa Gensan', 'may banggaan sa Gensan',
  'may binaril sa Gensan', 'may patay sa Gensan',
  // Expanded — high-yield queries from Phase 1 analysis + new variants
  'GenSan krimen', 'GenSan insidente',
  'GenSan droga', 'GenSan missing',
  'General Santos missing', 'General Santos droga',
  'General Santos krimen', 'General Santos insidente',
  // Bisaya/Cebuano fire variants
  'kalayo Gensan', 'nagdilaab Gensan', 'nasunog bahay Gensan',
  // Bisaya/Cebuano vehicular variants
  'nasagasaan Gensan', 'naligsan Gensan', 'nabangga General Santos',
  // Bisaya/Cebuano assault/crime variants
  'saksak Gensan', 'gipatay Gensan', 'gi-atake Gensan',
  // Theft variants
  'kawatan Gensan', 'snatcher Gensan', 'carnap Gensan',
  // Drug variants
  'buy-bust General Santos', 'PDEA Gensan',
  // General
  'GenSan news today', 'GenSan balita',
];

// ── Cheap Pre-filter ────────────────────────────────────────────────
// Skip posts that mention other cities but NOT GenSan — saves OpenAI calls.

const NON_GENSAN_CITIES = [
  'davao', 'koronadal', 'polomolok', 'tupi', 'tacurong', 'kidapawan',
  'cotabato city', 'sarangani', 'manila', 'quezon city', 'cebu',
  'cagayan de oro', 'zamboanga', 'iloilo', 'bacolod', 'baguio',
  'marilog', 'toril', 'tagum', 'digos', 'marbel',
];

const GENSAN_MARKERS = [
  'general santos', 'gensan', 'gensantos', 'gen. santos', 'gen santos',
  // Barangay names that uniquely identify GenSan
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
  return 'pass'; // no city mentioned either way — let OpenAI decide
}

// ── Barangay centroid lookup ─────────────────────────────────────────

// OSM Nominatim-verified centroids (2026-04-11)
const BARANGAY_CENTROIDS: Record<string, [number, number]> = {
  apopong: [6.131357, 125.130319],
  baluan: [6.124821, 125.217462],
  batomelong: [6.239089, 125.259239],
  bawing: [5.982146, 125.112922],
  buayan: [6.111068, 125.230727],
  bula: [6.103762, 125.193464],
  calumpang: [6.072893, 125.140472],
  'city heights': [6.130026, 125.169186],
  conel: [6.201512, 125.187808],
  'dadiangas east': [6.116274, 125.176018],
  'dadiangas north': [6.116494, 125.162532],
  'dadiangas south': [6.107125, 125.176891],
  'dadiangas west': [6.111056, 125.171022],
  fatima: [6.074153, 125.114077],
  katangawan: [6.17302, 125.219625],
  labangal: [6.094374, 125.15206],
  lagao: [6.128079, 125.190378],
  ligaya: [6.156505, 125.233225],
  mabuhay: [6.184951, 125.141579],
  olympog: [6.222805, 125.193554],
  'san isidro': [6.143747, 125.179168],
  'san jose': [6.070216, 125.023728],
  sinawal: [6.133019, 125.107487],
  tambler: [6.057907, 125.140455],
  tinagacan: [6.211143, 125.23826],
  'upper labay': [6.259783, 125.227484],
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

// ── Landmark dictionary ─────────────────────────────────────────────
// Tier 2 geocoding: known GenSan landmarks with OSM-verified coordinates.
// Checked BEFORE barangay centroid — gives medium confidence.

const LANDMARKS: Record<string, [number, number]> = {
  // Malls & Commercial
  'kcc mall': [6.1128, 125.1718],
  'kcc': [6.1128, 125.1718],
  'sm gensan': [6.1105, 125.1722],
  'sm city gensan': [6.1105, 125.1722],
  'sm city': [6.1105, 125.1722],
  'robinsons gensan': [6.1127, 125.1735],
  'robinsons place': [6.1127, 125.1735],
  'gaisano mall': [6.1115, 125.1700],
  'gaisano grand': [6.1115, 125.1700],
  'gaisano': [6.1115, 125.1700],
  'fitmart': [6.1138, 125.1725],
  'unitop': [6.1115, 125.1695],
  'public market': [6.1115, 125.1685],
  // Government
  'city hall': [6.1120, 125.1715],
  'gensan city hall': [6.1120, 125.1715],
  'oval plaza': [6.1118, 125.1710],
  'plaza heneral santos': [6.1118, 125.1710],
  'queen tuna park': [6.1120, 125.1712],
  'fish port': [6.0790, 125.1520],
  'gensan fish port': [6.0790, 125.1520],
  'general santos fish port': [6.0790, 125.1520],
  'makar wharf': [6.0770, 125.1490],
  'pioneer avenue': [6.1115, 125.1700],
  'santiago boulevard': [6.1095, 125.1690],
  'national highway': [6.1120, 125.1720],
  // Hospitals
  'gensan doctors hospital': [6.1130, 125.1730],
  'gensan doctors': [6.1130, 125.1730],
  'st. elizabeth hospital': [6.1140, 125.1700],
  'st elizabeth hospital': [6.1140, 125.1700],
  'mindanao medical center': [6.1095, 125.1735],
  'soccsksargen regional hospital': [6.1095, 125.1735],
  // Universities
  'notre dame of dadiangas': [6.1127, 125.1715],
  'nddu': [6.1127, 125.1715],
  'mindanao state university': [6.1275, 125.1890],
  'msu gensan': [6.1275, 125.1890],
  'ramon magsaysay memorial colleges': [6.1105, 125.1690],
  'rmmc': [6.1105, 125.1690],
  // Transport
  'bulaong terminal': [6.1100, 125.1680],
  'gensan bus terminal': [6.1100, 125.1680],
  'gensan airport': [6.0590, 125.0960],
  'general santos airport': [6.0590, 125.0960],
  // Recreation / Landmarks
  'veranza mall': [6.1100, 125.1750],
  'veranza': [6.1100, 125.1750],
  'ace hardware': [6.1105, 125.1735],
  'jollibee pioneer': [6.1115, 125.1700],
};

function lookupLandmark(text: string): { lat: number; lng: number } | null {
  const lower = text.toLowerCase();
  for (const [name, coords] of Object.entries(LANDMARKS)) {
    if (lower.includes(name)) return { lat: coords[0], lng: coords[1] };
  }
  return null;
}

// ── Geocoding (Nominatim — bounded to GenSan) ───────────────────────

async function geocode(
  locationText: string,
): Promise<{ lat: number; lng: number; source: string } | null> {
  try {
    const q = encodeURIComponent(`${locationText}, General Santos City, Philippines`);
    // Bounded viewbox constrains results to GenSan area — prevents
    // "General Santos St., Quezon City" false positives.
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=ph&viewbox=124.99,6.31,125.28,5.95&bounded=1`,
      { headers: { 'User-Agent': 'BetterGenSan/1.0 (civic-tech)' } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      // Double-check: reject if Nominatim returned something outside bbox
      if (!isInsideBbox(lat, lng)) return null;
      return { lat, lng, source: 'nominatim' };
    }
  } catch {
    // Geocoding is best-effort
  }
  return null;
}

// Resolve location with fallback hierarchy:
// 1. Nominatim (bounded to GenSan viewbox) → high/medium
// 2. Landmark dictionary → medium
// 3. Barangay centroid → low
// 4. null (if confidence < 0.2)
async function resolveLocation(
  locationText: string | null,
  barangay: string | null,
  landmarkText: string | null,
  confidence: number,
): Promise<{
  lat: number | null;
  lng: number | null;
  confidence: string;
  source: string;
}> {
  // Don't map very low confidence (lowered from 0.3 to 0.2)
  if (confidence < 0.2) {
    return { lat: null, lng: null, confidence: 'none', source: 'skipped' };
  }

  // Tier 1: Nominatim (bounded)
  if (locationText && confidence >= 0.5) {
    const geo = await geocode(locationText);
    if (geo) {
      return {
        lat: geo.lat,
        lng: geo.lng,
        confidence: confidence >= 0.8 ? 'high' : 'medium',
        source: 'nominatim',
      };
    }
  }

  // Tier 2: Landmark dictionary
  const landmarkSearch = landmarkText || locationText || '';
  if (landmarkSearch) {
    const lm = lookupLandmark(landmarkSearch);
    if (lm) {
      return {
        lat: lm.lat,
        lng: lm.lng,
        confidence: 'medium',
        source: 'landmark',
      };
    }
  }

  // Tier 3: Barangay centroid
  if (barangay) {
    const coords = lookupBarangay(barangay);
    if (coords) {
      return {
        lat: coords.lat,
        lng: coords.lng,
        confidence: 'low',
        source: 'barangay_centroid',
      };
    }
  }

  return { lat: null, lng: null, confidence: 'none', source: 'unresolved' };
}

// ── Regiment API ─────────────────────────────────────────────────────

interface FBPost {
  post_id: string;
  message: string | null;
  message_rich?: string | null;
  timestamp: number;
  url: string;
  reactions_count: number;
  comments_count: number;
  reshare_count: number;
  author: { id: string; name: string; url: string };
  image: string | null;
  video: string | null;
}

async function fetchPagePosts(
  pageId: string,
  regimentKey: string,
): Promise<{ posts: FBPost[]; duration_ms: number }> {
  const t0 = Date.now();
  const res = await fetch(`${REGIMENT_BASE}/pages/${pageId}/posts`, {
    headers: {
      'X-API-Key': regimentKey,
      Accept: 'application/json',
    },
  });
  const data = await res.json();
  return {
    posts: data.success ? (data.data ?? []) : [],
    duration_ms: Date.now() - t0,
  };
}

async function fetchSearchPosts(
  query: string,
  regimentKey: string,
): Promise<{ posts: FBPost[]; duration_ms: number }> {
  const t0 = Date.now();
  const qs = encodeURIComponent(query);
  const res = await fetch(`${REGIMENT_BASE}/search/posts?query=${qs}`, {
    headers: {
      'X-API-Key': regimentKey,
      Accept: 'application/json',
    },
  });
  const data = await res.json();
  return {
    posts: data.success ? (data.data ?? []) : [],
    duration_ms: Date.now() - t0,
  };
}

// ── OpenAI Classification ────────────────────────────────────────────

interface ClassifiedPost {
  post_id: string;
  is_news: boolean;
  is_gensan?: boolean;
  reject_reason?: string;
  category?: string;
  severity?: string;
  headline?: string;
  summary?: string;
  barangay?: string;
  city?: string;
  landmark?: string;
  location_text?: string;
  location_confidence?: number;
  date_of_incident?: string;
  tags?: string[];
}

const SYSTEM_PROMPT = `You are a LOCAL news classifier for General Santos City (GenSan), Philippines.
You analyze Facebook posts from local news pages, radio stations, and search results.

For each post, determine:
1. Is it actual news/incident content? (is_news)
2. Did it happen in General Santos City? (is_gensan)

REJECT (is_news: false):
- Station/radio promos, frequency announcements, DJ intros
- Birthday/holiday greetings, good morning messages
- Contest announcements, giveaways, ad reads
- Marketing, branding, internal network updates
- Music/playlist posts, tune-in reminders
- Generic motivational quotes
- Posts with no meaningful news content
- NATIONAL NEWS not about GenSan/South Cotabato/Region XII
- Government advisories national in scope unless they mention GenSan

For posts that ARE news (is_news: true), extract ALL of these fields:
- is_gensan: boolean — true ONLY if the incident occurred within General Santos City (including all 26 barangays). false if it happened in Davao, Koronadal, Polomolok, Tupi, Tacurong, Kidapawan, Cotabato City, Sarangani province towns, Manila, Cebu, or anywhere else. When ambiguous, false.
- city: the city where this incident occurred (e.g. "General Santos City", "Davao City", "Koronadal"). Required for every news post.
- category: one of Fire, Vehicular, Theft, Assault, Drug-related, Missing Person, Disturbance, Natural Disaster, Public Health, Government Advisory, Other
- severity: low (advisory/minor), medium (active incident/property damage), high (casualties/major emergency)
- headline: concise English headline (1 sentence)
- summary: English summary of key facts (2-3 sentences)
- barangay: GenSan barangay name if mentioned (Lagao, Calumpang, Labangal, Apopong, Dadiangas South, Dadiangas North, Dadiangas East, Dadiangas West, City Heights, Fatima, San Isidro, Bula, Tambler, Sinawal, Mabuhay, Katangawan, Ligaya, Conel, Olympog, Tinagacan, Batomelong, Upper Labay, Baluan, Buayan, San Jose, Bawing)
- landmark: the nearest well-known landmark if mentioned (e.g. "KCC Mall", "SM GenSan", "Oval Plaza", "City Hall", "Robinsons GenSan", "Fish Port", "Makar Wharf", "Pioneer Avenue", "NDDU", "MSU GenSan"). null if none.
- location_text: the MOST SPECIFIC location for geocoding. Prioritize:
  1. Exact street/road + barangay (e.g. "NLSA Road, Barangay Lagao, General Santos City")
  2. Landmark + barangay (e.g. "near KCC Mall, Lagao, General Santos City")
  3. Zone/Purok + barangay (e.g. "Zone 1, Prk. KPS, Brgy. Labangal, General Santos City")
  4. Barangay only (e.g. "Barangay Calumpang, General Santos City")
  Always append "General Santos City" to help the geocoder.
- location_confidence: float 0.0 to 1.0. 0.9+ = exact address. 0.7-0.89 = landmark or specific area. 0.5-0.69 = barangay only. 0.3-0.49 = city/region only. <0.3 = no location info.
- date_of_incident: ISO date if mentioned (YYYY-MM-DD)
- tags: relevant keywords

Posts are often in Cebuano (Bisaya), Filipino, or mixed languages. Translate to English for headline and summary.

Respond with JSON: { "results": [...] }. Each object MUST have post_id, is_news, and (if is_news=true) is_gensan and city.`;

async function classifyBatch(
  posts: { post_id: string; message: string }[],
  openaiKey: string,
): Promise<ClassifiedPost[]> {
  const userContent = posts
    .map(
      (p, i) =>
        `POST ${i + 1} [id: ${p.post_id}]:\n${p.message.slice(0, 1500)}`,
    )
    .join('\n\n---\n\n');

  const res = await fetch(OPENAI_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Classify these ${posts.length} posts. Return JSON: { "results": [...] }\n\n${userContent}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 3000,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '{}';
  try {
    const parsed = JSON.parse(content);
    return parsed.results ?? [];
  } catch {
    console.warn('OpenAI returned non-JSON:', content.slice(0, 200));
    return [];
  }
}

// ── Rejection logging ───────────────────────────────────────────────

// deno-lint-ignore no-explicit-any
async function logRejection(
  supabase: SupabaseClient,
  post: { post_id: string; message?: string; _page_name?: string; _query?: string },
  reason: string,
  extra?: { city?: string; location?: string; lat?: number; lng?: number },
) {
  await supabase.from('sync_rejections').insert({
    external_id: post.post_id,
    source: post._page_name ? 'facebook-page' : 'facebook-search',
    source_page_name: post._page_name ?? null,
    source_query: post._query ?? null,
    reason,
    extracted_city: extra?.city ?? null,
    extracted_location: extra?.location ?? null,
    latitude: extra?.lat ?? null,
    longitude: extra?.lng ?? null,
    post_preview: (post.message ?? '').slice(0, 200),
  }).then(() => {}, () => {}); // fire-and-forget, don't block pipeline
}

// ── Alert helper ─────────────────────────────────────────────────────

async function upsertAlert(
  supabase: SupabaseClient,
  source_id: string,
  run_id: number,
  kind: string,
  severity: string,
  message: string,
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
        run_id,
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('scrape_alerts')
      .insert({ source_id, run_id, kind, severity, message });
  }
}

// ── Main handler ─────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS')
    return new Response(null, { headers: cors });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Resolve API keys
  const regimentKey =
    Deno.env.get('REGIMENT_API_KEY') ??
    (
      await supabase.rpc('get_vault_secret', {
        secret_name: 'REGIMENT_API_KEY',
      })
    ).data;
  const openaiKey =
    Deno.env.get('OPENAI_API_KEY') ??
    (
      await supabase.rpc('get_vault_secret', {
        secret_name: 'OPENAI_API_KEY',
      })
    ).data;

  if (!regimentKey) return json({ error: 'REGIMENT_API_KEY not set' }, 500);
  if (!openaiKey) return json({ error: 'OPENAI_API_KEY not set' }, 500);

  const url = new URL(req.url);
  const mode = url.searchParams.get('mode') ?? 'pages';
  const force = url.searchParams.get('force') === '1';

  const sourceSlug =
    mode === 'pages'
      ? 'facebook-safety-pages'
      : 'facebook-safety-search';

  // Look up source
  const { data: source, error: sourceErr } = await supabase
    .from('sources')
    .select('id, slug, is_paused')
    .eq('slug', sourceSlug)
    .maybeSingle();
  if (sourceErr) return json({ error: sourceErr.message }, 500);
  if (!source)
    return json({ error: `Source ${sourceSlug} not registered` }, 404);
  if (source.is_paused)
    return json({ refreshed: false, paused: true });

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
  if (!force && lastSuccess && age !== null && age < CACHE_TTL_MS) {
    return json({
      refreshed: false,
      cached_age_ms: age,
      last_success_at: lastSuccess.started_at,
    });
  }

  // Open scrape run
  const { data: runRow, error: runErr } = await supabase
    .from('scrape_runs')
    .insert({
      source_id: source.id,
      status: 'running',
      trigger: url.searchParams.get('trigger') ?? 'schedule',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (runErr || !runRow)
    return json(
      { error: `Failed to open run: ${runErr?.message}` },
      500,
    );
  const run_id = runRow.id as number;
  const runStart = Date.now();

  // Counters for metadata
  let prefilterSkipped = 0;
  let cityMismatch = 0;
  let outOfBbox = 0;

  try {
    // ── Step 1: Fetch posts from Regiment ──
    // deno-lint-ignore no-explicit-any
    let allPosts: any[] = [];
    let totalDurationMs = 0;

    if (mode === 'pages') {
      for (const page of CURATED_PAGES) {
        const { posts, duration_ms } = await fetchPagePosts(
          page.id,
          regimentKey,
        );
        for (const p of posts) {
          // deno-lint-ignore no-explicit-any
          (p as any)._page_id = page.id;
          // deno-lint-ignore no-explicit-any
          (p as any)._page_name = page.name;
        }
        allPosts.push(...posts);
        totalDurationMs += duration_ms;
      }
    } else {
      for (const query of SEARCH_QUERIES) {
        const { posts, duration_ms } = await fetchSearchPosts(
          query,
          regimentKey,
        );
        for (const p of posts) {
          // deno-lint-ignore no-explicit-any
          (p as any)._query = query;
        }
        allPosts.push(...posts);
        totalDurationMs += duration_ms;
      }
    }

    // Log page fetch
    await supabase.from('page_fetches').insert({
      run_id,
      url: REGIMENT_BASE,
      method: 'GET',
      http_status: 200,
      content_type: 'application/json',
      duration_ms: totalDurationMs,
    });

    // Filter posts with actual text content
    allPosts = allPosts.filter(
      (p) => p.message && p.message.trim().length > 10,
    );

    // ── Step 2: Dedupe against existing external_ids ──
    const postIds = allPosts.map((p) => p.post_id);
    const { data: existing } = await supabase
      .from('safety_reports')
      .select('external_id')
      .in('external_id', postIds);
    const existingIds = new Set(
      (existing ?? []).map((r) => r.external_id),
    );
    // Also check sync_rejections to avoid re-processing known rejects
    const { data: existingRejects } = await supabase
      .from('sync_rejections')
      .select('external_id')
      .in('external_id', postIds);
    const rejectIds = new Set(
      (existingRejects ?? []).map((r: { external_id: string }) => r.external_id),
    );
    const newPosts = allPosts.filter(
      (p) => !existingIds.has(p.post_id) && !rejectIds.has(p.post_id),
    );

    // ── Step 3: Cheap keyword pre-filter ──
    // deno-lint-ignore no-explicit-any
    const passedPrefilter: any[] = [];
    for (const post of newPosts) {
      const check = cheapGensanCheck(post.message ?? '');
      if (check === 'non_gensan_keyword') {
        prefilterSkipped++;
        await logRejection(supabase, post, 'non_gensan_keyword');
        continue;
      }
      passedPrefilter.push(post);
    }

    // ── Step 4: Classify via OpenAI ──
    // deno-lint-ignore no-explicit-any
    const classifiedMap = new Map<string, any>();
    let openaiCalls = 0;

    for (let i = 0; i < passedPrefilter.length; i += BATCH_SIZE) {
      const batch = passedPrefilter.slice(i, i + BATCH_SIZE).map((p) => ({
        post_id: p.post_id,
        message: p.message ?? '',
      }));
      const results = await classifyBatch(batch, openaiKey);
      openaiCalls++;
      for (const r of results) {
        classifiedMap.set(r.post_id, r);
      }
    }

    // ── Step 5: Build rows — apply is_gensan gate + geocoding + bbox check ──
    const nowIso = new Date().toISOString();
    // deno-lint-ignore no-explicit-any
    const rows: any[] = [];

    for (const post of passedPrefilter) {
      const classified = classifiedMap.get(post.post_id);
      const isNews = classified?.is_news ?? false;
      const isGensan = classified?.is_gensan ?? true; // default true for backwards compat
      const isVerified = mode === 'pages';

      // Log non-news rejections
      if (!isNews) {
        await logRejection(supabase, post, 'not_news', {
          city: classified?.city,
        });
      }

      // is_gensan gate: reject incidents from other cities
      if (isNews && !isGensan) {
        cityMismatch++;
        await logRejection(supabase, post, 'city_mismatch', {
          city: classified?.city,
          location: classified?.location_text,
        });
        // Still insert the row but mark as not an incident
        // so it won't show on the map but we keep the record
      }

      const isIncident = isNews && isGensan;

      // Geocoding (only for incidents — saves Nominatim calls)
      let lat: number | null = null;
      let lng: number | null = null;
      let locConfidence = 'none';
      let geocodeSource = 'unresolved';

      if (isIncident) {
        const barangay = classified?.barangay ?? null;
        const locationText = classified?.location_text ?? null;
        const landmarkText = classified?.landmark ?? null;
        const llmConfidence = classified?.location_confidence ?? 0;
        const loc = await resolveLocation(locationText, barangay, landmarkText, llmConfidence);
        lat = loc.lat;
        lng = loc.lng;
        locConfidence = loc.confidence;
        geocodeSource = loc.source;

        // Post-geocode bbox check
        if (lat !== null && lng !== null && !isInsideBbox(lat, lng)) {
          outOfBbox++;
          await logRejection(supabase, post, 'out_of_bbox', {
            city: classified?.city,
            location: classified?.location_text,
            lat,
            lng,
          });
          lat = null;
          lng = null;
          locConfidence = 'none';
          geocodeSource = 'out_of_bbox';
        }

        // Log geocode failures for incidents
        if (lat === null && locConfidence === 'none' && geocodeSource === 'unresolved') {
          await logRejection(supabase, post, 'geocode_failed', {
            location: classified?.location_text,
          });
        }
      }

      rows.push({
        external_id: post.post_id,
        source: isVerified ? 'facebook-page' : 'facebook-search',
        source_page_id: post._page_id ?? null,
        source_page_name: post._page_name ?? null,
        source_query: post._query ?? null,
        verified: isVerified,
        is_incident: isIncident,
        category: classified?.category ?? null,
        severity: classified?.severity ?? 'low',
        summary: classified?.headline
          ? `${classified.headline}${classified.summary ? ' — ' + classified.summary : ''}`
          : null,
        location_extracted: classified?.location_text ?? null,
        message: (post.message ?? '').slice(0, 4000),
        message_url: post.url ?? null,
        author_name: post.author?.name ?? null,
        author_url: post.author?.url ?? null,
        image_url: post.image ?? null,
        video_url: post.video ?? null,
        reactions_count: post.reactions_count ?? 0,
        comments_count: post.comments_count ?? 0,
        shares_count: post.reshare_count ?? 0,
        barangay: classified?.barangay ?? null,
        latitude: lat,
        longitude: lng,
        location_confidence: locConfidence,
        geocode_source: geocodeSource,
        extracted_city: classified?.city ?? null,
        landmark: classified?.landmark ?? null,
        posted_at: new Date(post.timestamp * 1000).toISOString(),
        archive_status: 'active',
        first_seen_at: nowIso,
        last_seen_at: nowIso,
        last_synced_at: nowIso,
        raw_payload: post,
      });
    }

    let inserted = 0;
    const newsCount = rows.filter((r) => r.is_incident).length;
    const rejectedCount = rows.filter((r) => !r.is_incident).length;

    if (rows.length > 0) {
      const { error } = await supabase
        .from('safety_reports')
        .upsert(rows, { onConflict: 'external_id,source' });
      if (error) throw new Error(`Upsert failed: ${error.message}`);
      inserted = rows.length;
    }

    // Store snapshot
    await supabase.from('snapshots').insert({
      run_id,
      source_id: source.id,
      url: REGIMENT_BASE,
      kind: 'json',
      inline: {
        total_fetched: allPosts.length,
        new_posts: newPosts.length,
        prefilter_skipped: prefilterSkipped,
        sent_to_openai: passedPrefilter.length,
        news_classified: newsCount,
        city_mismatch: cityMismatch,
        out_of_bbox: outOfBbox,
        rejected: rejectedCount,
        openai_calls: openaiCalls,
      },
    });

    // Close run
    await supabase
      .from('scrape_runs')
      .update({
        status: 'success',
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - runStart,
        records_total: allPosts.length,
        records_inserted: inserted,
        http_status: 200,
        metadata: {
          mode,
          total_fetched: allPosts.length,
          duplicates_skipped: existingIds.size,
          rejects_skipped: rejectIds.size,
          new_posts: newPosts.length,
          prefilter_skipped: prefilterSkipped,
          sent_to_openai: passedPrefilter.length,
          news_classified: newsCount,
          city_mismatch: cityMismatch,
          out_of_bbox: outOfBbox,
          rejected_non_news: rejectedCount,
          openai_calls: openaiCalls,
        },
      })
      .eq('id', run_id);

    return json({
      refreshed: true,
      mode,
      total_fetched: allPosts.length,
      new_posts: newPosts.length,
      prefilter_skipped: prefilterSkipped,
      sent_to_openai: passedPrefilter.length,
      news_classified: newsCount,
      city_mismatch: cityMismatch,
      out_of_bbox: outOfBbox,
      rejected_non_news: rejectedCount,
      inserted,
      openai_calls: openaiCalls,
      run_id,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase
      .from('scrape_runs')
      .update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - runStart,
        error_message: msg,
      })
      .eq('id', run_id);

    const kind = msg.includes('OpenAI') ? 'openai_error' : 'other';
    await upsertAlert(supabase, source.id, run_id, kind, 'high', msg);

    return json({ refreshed: false, error: msg, run_id }, 502);
  }
});
