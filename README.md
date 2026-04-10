# BetterGensan

> A citizen-first portal for **General Santos City** that archives public records and keeps them accessible even when official websites go offline.

BetterGensan archives publicly available government data, turns it into clean civic dashboards, and preserves it so information remains searchable and usable even when official websites go offline. Part of the [BetterGov movement](https://bettergov.ph), localized for General Santos City, South Cotabato.

> _If information is public, it should remain public._

## Why this exists

Government websites frequently experience downtime, restructuring, or content removal. When this happens, public information becomes difficult to access. BetterGensan preserves these records and makes them searchable, durable, and citizen-friendly.

---

## What this repository contains

**This repository is the frontend application only.** The cached records, scraper edge functions, cron jobs, and admin authentication all live in a separately-hosted Supabase project that the deployed instance points at.

When you clone this repo you get the React/TypeScript SPA, the YAML/Markdown content tree (services, departments, officials), the build configuration, and the documented schema/edge-function patterns the frontend expects. You do **not** get any cached records — those are runtime data, not code, and they're populated by the scraper pipeline running against your own Supabase project.

To run a meaningful local instance you need to:
1. Provision your own Supabase project
2. Apply the cache table migrations (`executive_orders_cache`, `splis_cache`, `procurement_cache`, `jobs`, `sources`, `scrape_runs`, `scrape_alerts`, `snapshots`, `page_fetches`, `profiles`) and the `source_health` view
3. Deploy the edge functions (`gensan-eo-refresh`, `gensan-procurement-refresh`, `gensan-splis-refresh`, `admin-run-source`, `jobs-refresh`, `linkedin-refresh`)
4. Schedule the `pg_cron` jobs that trigger them
5. Provide your own Regiment API key

Without these the frontend renders empty cards and "no records" placeholders — by design, since the readers are wrapped in `safe()` and degrade gracefully when the database is empty.

### What's intentionally **not** in this repo

- **Cached records** — runtime data, lives in the operator's Supabase project
- **Scraper edge functions** — operational infrastructure tied to a specific Supabase project + Regiment credentials
- **Backfill scripts** — one-shot Phase-1 helpers that target now-deleted edge functions; gitignored
- **`.env.local`** — contains real Supabase URL + anon key; gitignored
- **Internal docs** (`CLAUDE.md`, `DOSSIER.md`, `CHANGELOG.md`, the project plan) — operator notes, gitignored at the repo root

## What the live deployed instance archives

The numbers below describe what the **production deployment** has cached at the time of writing — they are **not** what you get from cloning this repo.

| Dataset | Records (live deployment) | Source |
|---|---:|---|
| Executive Orders | 286 | `eo.gensantos.gov.ph` |
| Sangguniang Panglungsod (Ordinances + Resolutions) | 17,731 | `splis.gensantos.gov.ph` |
| Procurement (7 datasets) | 18,663 | `procurement.gensantos.gov.ph` |
| Jobs (public listings aggregated from multiple sources) | ~50 | aggregated public listings |
| Infrastructure Projects (DPWH in GenSan) | 43 | `bisto.ph` / BetterGov Meilisearch |
| **Total cached records** | **~36,700+** | refreshed on scheduled intervals (typically daily) |

Every record links back to its official source. Records are **never deleted** by sync — when something disappears upstream, it gets flagged as `missing_from_source` and stays viewable as a cached copy with a clear notice.

---

## What's on the site

- **`/`** — Homepage with 7 civic sectors: hero search, Jobs, Civic Decisions (EO + SP), Government Opportunities (procurement), Population & Demographics, Join community
- **`/jobs`** — Live job listings filtered to General Santos City, with source/posted/sort filters
- **`/eo`** — Executive Orders archive with year filter and PDF preview
- **`/splis`** — Sangguniang Panglungsod archive (Ordinances + Resolutions) with type tabs, year filter, and pagination
- **`/procurement`** — Full procurement archive across 7 dataset categories
- **`/services`** — 11 dedicated service category pages (Certificates, Business, Tax Payments, Health, etc.)
- **`/government/departments`** — Directory of all GenSan LGU departments
- **`/government/officials`** — 21st Sangguniang Panlungsod (2025–2028)
- **`/population`** — PSA-sourced demographic data and 26-barangay breakdown
- **`/city-map`** — Infrastructure projects listing with map view, table view, and filter sidebar (year, category, status). Data sourced from Bisto.ph, scoped to GenSan city boundary via point-in-polygon filtering
- **`/city-map/:projectId`** — Project detail dossier: overview metrics, timeline, procurement, implementation details, embedded map with GenSan boundary overlay, record integrity metadata, related projects, sticky intelligence sidebar
- **`/city-profile`** — City overview, OSM map, weather, history
- **`/about`** — Mission, archive stats (live), data sources, trust principles

---

## Tech stack

- **Frontend**: React 19 · TypeScript · Vite · Tailwind 4 · React Router 7 · i18next · nuqs · Lucide icons
- **Data layer**: Supabase (Postgres + RLS + Edge Functions + Auth + pg_cron)
- **Scrapers**: Internal Regiment ingestion service → Supabase edge functions on a scheduled interval. Regiment is a personal internal data collection and normalization system operated by the BetterGensan maintainer. Access is not publicly shared as it contains sensitive ingestion logic and source integrations. BetterGensan does not require Regiment to run — it only consumes cached data produced by scheduled ingestion jobs.
- **Hosting**: Static SPA — deploys to any static host (Netlify, Cloudflare Pages, S3 + CloudFront, Nginx, etc.)

---

## Architecture in one paragraph

BetterGensan mirrors public data into durable cache tables. The frontend reads only from the archive, ensuring availability even if upstream sources fail.

The system is split in two: **this repository** is the React/TypeScript frontend that reads from a Supabase project, and the **data layer** (cache tables, edge functions, cron jobs) lives inside that Supabase project — not in this repo. On the data side, a daily `pg_cron` job triggers a Supabase edge function for each source. Each function calls the Regiment ingestion service, parses the response, computes a stable content hash per record, and upserts into a per-domain cache table (`executive_orders_cache`, `splis_cache`, `procurement_cache`, `jobs`). The frontend reads exclusively from these cache tables via Supabase's anonymous client — **the frontend never calls Regiment directly**. Every read is wrapped in a `safe()` helper that catches network errors AND hangs (12 s timeout via `Promise.race`), so a transient upstream failure degrades to an empty state instead of an infinite loading spinner. An admin dashboard at `/admin` (Supabase Auth + `is_admin` RLS) shows source health, recent runs, alerts, and lets operators trigger manual refreshes.

---

## Quick start

### Prerequisites

- Node 18+
- A Supabase project (free tier works) — only required if you want the data layer; the frontend will start without it but will render empty cards
- A Regiment API key (only required if running the ingestion pipeline locally). Regiment is internal infrastructure and access is not publicly distributed.

### Install (frontend only)

```bash
git clone https://github.com/psalmcatulpos/bettergensan.git
cd bettergensan
npm install
```

### Configure

```bash
cp env.example .env.local
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (+ REGIMENT_API_KEY if running scrapers locally)
```

`.env.local` is gitignored. **Never commit it.** Only variables prefixed with `VITE_` are exposed to the browser bundle; everything else (including `REGIMENT_API_KEY`) stays server-side and is only used by the Vite dev proxy in `vite.config.ts`. It is **not** bundled into the production build.

For the Supabase key, use the **anon / publishable** key (it's safe to ship in the browser because Row-Level Security gates every table). The **service-role** key must never appear in any `VITE_*` variable, any frontend file, or any committed config.

### Run

```bash
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
npm run lint     # ESLint
npm run format   # Prettier
```

The build produces a static `dist/` folder you can host on any static hosting provider. Hosting the SPA does not require Node at runtime.

### Standing up the data layer

The frontend points at whatever Supabase project you configure. To get an instance with real data you need to:

1. Create a Supabase project and copy the URL + anon key into `.env.local`
2. Apply the cache table schema (`executive_orders_cache`, `splis_cache`, `procurement_cache`, `jobs`, `infrastructure_projects`, `sources`, `scrape_runs`, `scrape_alerts`, `snapshots`, `page_fetches`, `profiles`, `source_upstream_health`) plus the `source_health` view and the `is_admin()` RLS helper
3. Deploy the edge functions (`gensan-eo-refresh`, `gensan-procurement-refresh`, `gensan-splis-refresh`, `bisto-sync`, `admin-run-source`, `jobs-refresh`, `linkedin-refresh`)
4. Provide a Regiment API key as the `REGIMENT_API_KEY` Supabase Vault secret
5. Schedule daily `pg_cron` jobs that POST to each edge function

The schemas, edge function shapes, hash conventions, and cron schedules are documented in the source itself — see `src/lib/gensanCache.ts` for the row types and `src/contexts/AuthContext.tsx` for the auth wiring. The edge functions are intentionally **not** committed to this repo because they're operational infrastructure tied to a specific Supabase project.

### First admin user

After signing up at `/admin/login` against your Supabase project, promote the account from the Supabase SQL editor:

```sql
update profiles set is_admin = true where email = 'you@example.com';
```

The next sign-in unlocks `/admin`.

---

## Deployment

BetterGensan builds to a plain static `dist/` folder. There is no Node runtime, no SSR, no build-time secret. Drop `dist/` behind any web server you like.

### Build

```bash
npm install
npm run build      # outputs to dist/
```

The build inlines the `VITE_*` environment variables present at build time, so make sure `.env.local` (or your CI environment) has at least `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set before running `npm run build`. The Supabase **anon / publishable key** is the correct key here — never put the service-role key in any `VITE_*` variable.

### Hosting on a VPS (Nginx example)

```nginx
server {
  listen 80;
  server_name bettergensan.example;
  root /var/www/bettergensan/dist;
  index index.html;

  # SPA fallback — every unknown path serves index.html so React Router
  # can resolve it client-side. Without this, refreshing /eo or /splis
  # returns a 404.
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Long-cache the hashed asset bundle, never cache index.html.
  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
  location = /index.html {
    add_header Cache-Control "no-cache";
  }

  gzip on;
  gzip_types text/plain text/css application/javascript application/json image/svg+xml;
}
```

For Apache, the equivalent is a `.htaccess` rewrite to `index.html` for any request that doesn't resolve to a real file.

### Static hosts (Vercel / Netlify / Cloudflare Pages)

Build command: `npm run build`. Output directory: `dist`. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the host's environment variables. SPA fallback is enabled automatically on all three.

### Updating the deployed site

Pull, rebuild, replace `dist/`. Nothing on the database side needs to change — the cache tables are server-state and live independently of the frontend. A rolling deploy is just a static-asset swap.

---

## Project layout

```
bettergensan/
├── public/             # Static assets, i18n locales, robots.txt
├── content/            # Markdown + YAML for service & government pages
│   ├── services/       # 11 service categories
│   └── government/     # Department & legislative pages
├── src/
│   ├── components/     # Reusable UI primitives + section components
│   ├── contexts/       # AuthContext (Supabase auth state)
│   ├── data/           # services.yaml, government.yaml, navigation.ts, gensanBoundary.ts
│   ├── lib/            # gensanCache.ts, jobsSource.ts, supabase.ts
│   ├── pages/          # Route components (Home, Jobs, Splis, Procurement, etc.)
│   └── i18n.ts         # i18next setup
├── supabase/
│   └── functions/      # Edge functions (bisto-sync, admin-run-source)
├── scripts/            # YAML→JSON converter and operator helpers
├── terraform/          # IaC (Supabase project provisioning)
└── vite.config.ts      # Vite + dev proxy + production console-stripping
```

---

## Contributing

BetterGensan is built and maintained by GenSan residents. Contributions of any size are welcome:

- **Content fixes** — outdated phone numbers, wrong office hours, broken links → edit the relevant `content/services/**.md` or `content/government/**.md` directly via the GitHub web UI and open a PR
- **New civic data sources** — propose a dataset by opening an issue
- **Bug fixes & accessibility improvements** — fork, branch, PR
- **Translations** — `public/locales/en/common.json` is the only file today; add a new `public/locales/<lang>/common.json` and the language selector picks it up

Before submitting a PR, run:

```bash
npm run lint
npm run build
```

Both must exit clean.

---

## Trust principles

1. **Citizen-first, not official** — BetterGensan is independent and not affiliated with the LGU of General Santos City
2. **Records are never deleted** — disappearing upstream records are archived, not removed
3. **Source links everywhere** — every record links back to its official source
4. **Visible freshness** — every dataset shows a live status badge (fresh / delayed / unavailable)
5. **Use official sources for legal matters** — for legally binding information, always confirm with the relevant LGU office or `gensantos.gov.ph`
6. **Independent civic archive** — BetterGensan is not a government service and operates independently

---

## License

[Creative Commons Zero (CC0)](LICENSE) — public domain. Use, modify, and redistribute freely.

---

## Acknowledgments

- [BetterGov](https://bettergov.ph) — the parent civic-tech movement
- Regiment — internal ingestion infrastructure used to refresh cached public data (not publicly accessible)
- [Bisto.ph](https://bisto.ph) / [BetterGov](https://bettergov.ph) — DPWH infrastructure project data
- [Supabase](https://supabase.com/) — Postgres + auth + edge functions
- [PSA RSSO XII](https://rsso12.psa.gov.ph/) — official population and demographics data
- The City Government of General Santos for publishing the public records this portal mirrors

---

**Cost to the people of GenSan: ₱0.**
Built and maintained by volunteers using publicly available data. No taxpayer funds, no LGU budget, no political endorsement.
