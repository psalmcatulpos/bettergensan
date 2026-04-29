# devtools leakage audit — 2026-04-29

## summary
- total findings: 18
- critical: 1
- high: 3
- medium: 5
- low: 6
- informational: 3

## scope
- commit hash: f7e6338de8cb339e05180f749157f616225683dc
- branch: style/beautify-landing-page
- passes completed: 1, 2, 3, 4, 5, 6, 7

---

## findings

### F-001 — Admin pipeline tables readable by anon role (RLS: `using (true)`)
- severity: critical
- pass: 3
- location: `supabase/migrations/20260410073550` lines 21, 39, 57, 77, 96
- evidence:
  ```sql
  -- scrape_runs (line 21)
  create policy "Anyone can read scrape_runs" on public.scrape_runs
    for select using (true);
  -- page_fetches (line 39)
  create policy "Anyone can read page_fetches" on public.page_fetches
    for select using (true);
  -- snapshots (line 57), scrape_alerts (line 77), validation_results (line 96)
  -- all identical: using (true)
  ```
- impact: Any user with the public anon key can query `scrape_runs`, `page_fetches`, `snapshots` (including full raw scraped payloads in `inline` jsonb), `scrape_alerts`, and `validation_results` via the Supabase REST API. The admin UI is protected only by a client-side React route guard which provides zero security.
- fix sketch: Change all five `SELECT` policies from `using (true)` to `using (public.is_admin())`.

### F-002 — `sync_rejections` readable by anon role
- severity: high
- pass: 3
- location: `supabase/migrations/20260422231055:35`
- evidence:
  ```sql
  create policy "sync_rejections_public_read" on public.sync_rejections
    for select using (true);
  ```
- impact: Anon users can read `post_preview` (first 200 chars of rejected Facebook posts), `source_query` (reveals pipeline search queries), and classifier internals (`extracted_city`, `extracted_location`).
- fix sketch: Change policy to `using (public.is_admin())`.

### F-003 — `safety_reports` exposes PII columns to anon users
- severity: high
- pass: 3
- location: `src/lib/gensanCache.ts:1529`, `supabase/migrations/20260411091105:60`
- evidence:
  ```ts
  // gensanCache.ts — frontend SELECT includes:
  .select('..., author_name, author_url, message, message_url, ...')
  ```
  RLS policy: `using (true)` — fully public read, all columns.
- impact: Anyone can query `safety_reports` and extract Facebook post author names, profile URLs, full post text, and `raw_payload` (not selected by frontend but still queryable directly). PII of individuals who posted about safety incidents is exposed.
- fix sketch: Create a Postgres view that omits PII columns (`author_name`, `author_url`, `message_url`, `raw_payload`, `source_page_id`, `source_query`) and grant anon SELECT on the view only. Or strip PII from the table at ingest time.

### F-004 — `facebook-safety-backfill` is unauthenticated and has no cache gate
- severity: high
- pass: 4
- location: `supabase/functions/facebook-safety-backfill/index.ts:10`
- evidence: Deployed with `verify_jwt: false`. Accepts `?force=1` query param. No 24h cache gate — the function runs on every invocation. Uses `REGIMENT_API_KEY` and `OPENAI_API_KEY` for upstream calls.
- impact: Anyone who discovers the function URL can trigger unlimited Regiment and OpenAI API calls, burning paid API credits. The `?force=1` param bypasses any soft limits.
- fix sketch: Add `verify_jwt: true` and an `is_admin()` check, or add a shared secret header check.

### F-005 — Meilisearch API token hardcoded in `bisto-sync` source
- severity: medium
- pass: 4
- location: `supabase/functions/bisto-sync/index.ts:17-18`
- evidence:
  ```ts
  const SEARCH_TOKEN =
    '307c9f43a066a443cc37d62b45fa47fde2b39f765139dd964ea151daed65f55c';
  ```
- impact: The 64-char hex token for BetterGov's Meilisearch instance (`search2.bettergov.ph`) is hardcoded. While likely read-only scoped to the `dpwh` index, the token cannot be rotated without a code change and is visible to anyone with repo access.
- fix sketch: Move to an env var or Supabase Vault secret.

### F-006 — `bisto-sync` is unauthenticated (`verify_jwt: false`) with force bypass
- severity: medium
- pass: 4
- location: `supabase/functions/bisto-sync/index.ts:9`
- evidence: Deployed with `verify_jwt: false`. Accepts `?force=1` to bypass 24h cache gate. Uses `SUPABASE_SERVICE_ROLE_KEY` internally.
- impact: Anyone with the function URL can force-trigger infrastructure syncs. Service role key is used server-side (not leaked to caller), but the function becomes a free compute/bandwidth oracle.
- fix sketch: Add JWT verification or a shared secret header.

### F-007 — `facebook-safety-sync` is unauthenticated with force bypass
- severity: medium
- pass: 4
- location: `supabase/functions/facebook-safety-sync/index.ts:22`
- evidence: Deployed with `verify_jwt: false`. 12h cache gate bypassable with `?force=1`. Uses `REGIMENT_API_KEY` and `OPENAI_API_KEY`.
- impact: Same credit-burn risk as F-004 but limited to one call per forced invocation (12h gate only applies to non-forced calls).
- fix sketch: Add JWT verification or shared secret, or remove `force` support from the public surface.

### F-008 — Login page passes raw Supabase error messages (potential user enumeration)
- severity: medium
- pass: 6
- location: `src/pages/admin/Login.tsx:40-43`
- evidence:
  ```ts
  const { error } = await signInWithPassword(email, password);
  if (error) throw error;
  // ...
  setError(e instanceof Error ? e.message : 'Sign-in failed');
  ```
- impact: If Supabase returns distinct messages for "Email not confirmed" vs "Invalid login credentials", an attacker can enumerate registered emails. Current Supabase versions unify the message, but this is fragile — a Supabase upgrade could re-introduce distinct messages.
- fix sketch: Replace raw `error.message` with a static string: `"Invalid email or password"`.

### F-009 — `VITE_AISSTREAM_API_KEY` bundled into client JS
- severity: medium
- pass: 2, 5
- location: `src/pages/CommandCenter.tsx:391`, `dist/assets/index-jhAqjgW4.js`
- evidence: `const AISSTREAM_KEY = import.meta.env.VITE_AISSTREAM_API_KEY` — value is inlined into the production bundle. Sent in WebSocket message body (not URL).
- impact: The AISStream.io API key is visible to any browser user via DevTools or bundle inspection. AISStream's free tier expects browser usage so this is their design, but the key is public and could be abused for quota exhaustion.
- fix sketch: Proxy the WebSocket connection through a Supabase Edge Function to keep the key server-side.

### F-010 — `jobs.raw` column queryable by anon despite not being selected by frontend
- severity: low
- pass: 3
- location: `supabase/migrations/20260410073613:16,20`
- evidence: `jobs` table has a `raw jsonb` column. RLS: `using (true)`. Frontend selects only specific columns, but the column is still accessible via direct REST API.
- impact: Full raw Indeed/LinkedIn API response data is queryable by anyone, potentially containing fields not intended for public consumption.
- fix sketch: Create a column-restricted view for public reads, or drop the `raw` column if unused.

### F-011 — `infrastructure_projects.raw_payload` selected on detail page and fully queryable
- severity: low
- pass: 3
- location: `src/lib/gensanCache.ts:1460`, `src/pages/InfrastructureDetail.tsx:330`
- evidence: `raw_payload` (jsonb) is selected in the detail query and rendered. RLS: `using (true)`.
- impact: Full upstream Bisto/DPWH record exposed. While infrastructure data is public, raw payloads reveal scraper field mappings and internal structure.
- fix sketch: Remove `raw_payload` from the public select, or strip it to curated fields.

### F-012 — Edge function error responses include truncated upstream text
- severity: low
- pass: 4
- location: `bisto-sync/index.ts:624`, `facebook-safety-sync/index.ts:960`, `facebook-safety-backfill/index.ts:260`
- evidence: Error paths return `{ error: e.message }` or `errText.slice(0, 200)`. Could include partial Meilisearch, OpenAI, or Regiment error responses.
- impact: Leaks upstream service names and partial error details. No credentials in error text.
- fix sketch: Return a generic error message; log details server-side only.

### F-013 — `admin-run-source` forwards full upstream response to admin client
- severity: low
- pass: 4
- location: `supabase/functions/admin-run-source/index.ts:138-145`
- evidence: Returns `upstream: payload` in JSON response where `payload` is the full downstream function response.
- impact: If a dispatched function errors verbosely (stack traces, upstream URLs), those details reach the admin browser. Admin-gated, so limited exposure.
- fix sketch: Strip or truncate the `upstream` field to safe summary fields.

### F-014 — Dead `signUpWithPassword` / `signInWithOtp` exports in auth.ts
- severity: low
- pass: 6
- location: `src/lib/auth.ts:28-45`
- evidence: Both functions exported but never imported. Tree-shaken from prod builds. `signUpWithPassword` could be trivially wired to enable public self-registration.
- impact: No runtime risk. Process risk if a developer wires them up without adding admin approval.
- fix sketch: Delete both exports if public registration is permanently disabled.

### F-015 — No client-side rate limiting on admin login form
- severity: low
- pass: 6
- location: `src/pages/admin/Login.tsx`
- evidence: No debounce, CAPTCHA, or attempt counter. Relies entirely on Supabase server-side rate limits (default 30/hr for auth endpoints).
- impact: Brute-force is throttled server-side but not signaled to the user.
- fix sketch: Add a client-side attempt counter with exponential backoff, or add CAPTCHA after N failures.

### F-016 — Session tokens stored in localStorage (Supabase default)
- severity: informational
- pass: 6
- location: `src/lib/supabase.ts:15`
- evidence: `createClient(url, anonKey)` with no `auth.storage` override. Session (access + refresh tokens) stored in `localStorage`.
- impact: XSS can exfiltrate the full session. This is the standard Supabase SPA trade-off.
- fix sketch: Consider `httpOnly` cookie storage via Supabase SSR helpers if the admin panel's threat model warrants it.

### F-017 — No production proxy for ADSB.fi (dev-only Vite proxy)
- severity: informational
- pass: 5
- location: `vite.config.ts:116-124`
- evidence: `/api/adsb` proxy is under `server:` block (dev-only). No edge function proxy exists in `supabase/functions/`. Aircraft tracking requests will 404 in production.
- impact: Feature broken in prod, not a security leak.
- fix sketch: Deploy a Supabase Edge Function that proxies ADSB.fi requests.

### F-018 — `loadEnv` with empty prefix loads all env vars into Vite config scope
- severity: informational
- pass: 1
- location: `vite.config.ts:105-108`
- evidence: `loadEnv(mode, process.cwd(), '')` loads ALL env vars (including `REGIMENT_API_KEY`). Currently only used in the server-side plugin, never in `define` or client code.
- impact: No leak today. Future risk if a developer adds `define: { ... }` using the loaded `env` object.
- fix sketch: Use `loadEnv(mode, process.cwd(), ['VITE_', 'REGIMENT_'])` to be explicit.

---

## pass notes

### Pass 1 — repo grep for leaked secrets
No secrets found in source code. All `VITE_*` vars are public metadata or the Supabase anon key (expected). `REGIMENT_API_KEY` is server-side only. `.env.local` is gitignored and never committed. Console statements in `src/lib/` log Supabase error messages but are stripped in production builds via `esbuild.drop: ['console']`.

### Pass 2 — bundle inspection
- No sourcemaps in `dist/` (clean).
- Console statements stripped from production bundle (confirmed: 0 matches in main chunk).
- `VITE_AISSTREAM_API_KEY` reference present in bundle (F-009).
- No other secrets, JWTs, or service role keys in bundle.
- `dist/index.html` has no inline scripts or env dumps.

### Pass 3 — Supabase RLS reachability
Six tables intended for admin use have `SELECT using (true)` policies (F-001, F-002). `safety_reports` exposes PII columns (F-003). `jobs.raw` and `infrastructure_projects.raw_payload` are queryable extras (F-010, F-011). `profiles` is correctly gated (own-row + admin-only). `executive_orders_cache`, `splis_cache`, `procurement_cache` contain public government data — no issues.

### Pass 4 — edge function surface
Three `verify_jwt: false` functions accept `?force=1` to bypass cache gates (F-004, F-006, F-007). `admin-run-source` correctly validates `is_admin()` before dispatch. Meilisearch token hardcoded (F-005). Error responses leak truncated upstream text (F-012, F-013).

### Pass 5 — Command Center external APIs
NASA GIBS, OSM Overpass, Esri Ocean Basemap, Project NOAH (HuggingFace PMTiles), Meta HRSL (bundled JSON) — all unauthenticated public endpoints, no keys. ADSB.fi is unauthenticated open data (dev proxy only, F-017). AISStream.io key bundled into client JS (F-009), sent in WebSocket message body (not URL — no referrer leakage).

### Pass 6 — auth flow
Session in localStorage (Supabase default, F-016). No auth data logged to console. No `supabase.auth.admin.*` calls in browser. `?denied=1` does not leak cross-user info. Login error messages are passed through verbatim (F-008). Dead auth exports present but tree-shaken (F-014). No client-side rate limiting (F-015).

### Pass 7 — runtime sanity (manual steps for operator)

**Step 1: Homepage network audit**
1. Open `https://bettergensan.org/` in incognito, DevTools → Network → Fetch/XHR.
2. Walk the homepage (scroll all sectors). Expected hosts:
   - `<supabase-ref>.supabase.co` — REST queries for jobs, EO, procurement, SPLIS, source_health, source_upstream_health
   - `api.open-meteo.com` — weather data for CityProfile (if navigated there)
   - No Regiment calls from browser (frontend never calls Regiment directly).
3. Verify no requests carry `Authorization: Bearer` headers with service role key.

**Step 2: Command Center network audit**
1. Open `/command-center`. Expected hosts:
   - `<supabase-ref>.supabase.co` — safety_reports, infrastructure_projects
   - `gibs.earthdata.nasa.gov` — WMTS ocean tiles
   - `overpass-api.de` — OSM POI queries
   - `services.arcgisonline.com` — Esri bathymetry tiles
   - `opendata.adsb.fi` — aircraft tracking (only works if proxy is deployed)
   - `wss://stream.aisstream.io` — AIS ship tracking WebSocket
   - `huggingface.co` — Project NOAH PMTiles
2. Check the AIS WebSocket frame: confirm API key is in the message body, not URL.
3. Check that no requests carry unexpected auth headers.

**Step 3: JS bundle source inspection**
1. DevTools → Sources → `dist/assets/index-*.js` (prettify).
2. Search for: `eyJ`, `sk-`, `Bearer`, `service_role`, `apikey`.
3. Expected: only `VITE_SUPABASE_ANON_KEY` value (starts with `eyJ` — this is the anon key, expected).
4. Unexpected: any other JWT, any `sk-` prefix, any `service_role` string.

**Step 4: Storage inspection**
1. DevTools → Application → Storage.
2. `localStorage`: expect `sb-<ref>-auth-token` only if previously logged in, `i18nextLng`, `_hero_seen`. No secrets.
3. `sessionStorage`: expect `_hero_seen` only.
4. Cookies: expect none from the app (Supabase doesn't set cookies in SPA mode).
5. IndexedDB: expect none from the app.
