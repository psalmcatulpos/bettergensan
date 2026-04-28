// Full /procurement detail page.
//
// Same UI primitives as the homepage subsection (TabPill + ProcurementCard +
// FreshnessBadge + chips) but with complete pagination per category. URL state
// is preserved via nuqs so users can deep-link or refresh without losing
// position: ?endpoint=ongoing-alter-bids&page=42

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Gavel,
  Search,
  X,
} from 'lucide-react';
import SourceHealthFooter from '../components/ui/SourceHealthFooter';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import FreshnessBadge from '../components/ui/FreshnessBadge';
import { ProcurementCard, TabPill } from '../components/procurement/shared';
import {
  PROCUREMENT_ENDPOINTS,
  freshnessFromHealth,
  readProcurementCounts,
  readProcurementPage,
  readSourceHealth,
  type FreshnessInfo,
  type ProcurementRow,
  type SourceHealthRow,
} from '../lib/gensanCache';

const PAGE_SIZE = 24;

const Procurement: React.FC = () => {
  const [{ endpoint, page, q }, setQuery] = useQueryStates(
    {
      endpoint: parseAsString.withDefault(PROCUREMENT_ENDPOINTS[0].endpoint),
      page: parseAsInteger.withDefault(1),
      q: parseAsString.withDefault(''),
    },
    { history: 'push' }
  );

  // Debounced search input → URL `q` param. Local input state stays
  // immediate for typing; the URL is updated 300 ms after the user stops.
  const [searchInput, setSearchInput] = useState(q);
  useEffect(() => {
    if (searchInput === q) return;
    const t = setTimeout(() => {
      setQuery({ q: searchInput || null, page: 1 });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);
  useEffect(() => {
    if (q !== searchInput) setSearchInput(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Validate endpoint param against the registry; fall back to first.
  const activeCfg = useMemo(
    () =>
      PROCUREMENT_ENDPOINTS.find(e => e.endpoint === endpoint) ??
      PROCUREMENT_ENDPOINTS[0],
    [endpoint]
  );

  const [healthMap, setHealthMap] = useState<Record<string, SourceHealthRow>>(
    {}
  );
  const tabsRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (dir: 1 | -1) => {
    const el = tabsRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [rows, setRows] = useState<ProcurementRow[]>([]);
  const [tabTotal, setTabTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const slugs = useMemo(() => PROCUREMENT_ENDPOINTS.map(e => e.slug), []);

  // Mount: load source health + per-endpoint totals once.
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const [healthRes, countsRes] = await Promise.all([
        readSourceHealth(slugs, controller.signal),
        readProcurementCounts(controller.signal),
      ]);
      if (controller.signal.aborted) return;
      setHealthMap(healthRes);
      setCounts(countsRes.perEndpoint);
      setTotalCount(countsRes.total);
    })();
    return () => controller.abort();
  }, [slugs]);

  // Load page rows when active endpoint, search, or page changes.
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    (async () => {
      const { rows: r, total } = await readProcurementPage(
        activeCfg.endpoint,
        page,
        PAGE_SIZE,
        q,
        controller.signal
      );
      if (controller.signal.aborted) return;
      setRows(r);
      setTabTotal(total);
      setLoading(false);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    })();
    return () => controller.abort();
  }, [activeCfg.endpoint, page, q]);

  // Headline freshness = worst tone across all endpoints.
  // 'unknown' sits BETWEEN healthy and degraded in the order map, so seeding
  // with unknown would lock the headline on "Awaiting first sync" because
  // healthy (order 0) can never replace unknown (order 1). Ignore unknown
  // rows whenever any endpoint has real sync data.
  const headlineFreshness: FreshnessInfo = useMemo(() => {
    const order: Record<string, number> = {
      healthy: 0,
      unknown: 1,
      degraded: 2,
      offline: 3,
    };
    const all = PROCUREMENT_ENDPOINTS.map(e =>
      freshnessFromHealth(healthMap[e.slug])
    );
    const known = all.filter(f => f.lastSuccessAt !== null);
    if (known.length === 0) return freshnessFromHealth(undefined);
    return known.reduce((worst, f) =>
      (order[f.tone] ?? 0) > (order[worst.tone] ?? 0) ? f : worst
    );
  }, [healthMap]);

  const totalPages = Math.max(1, Math.ceil(tabTotal / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const fromIdx = tabTotal === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const toIdx = Math.min(safePage * PAGE_SIZE, tabTotal);

  const setEndpoint = (ep: string) =>
    setQuery({ endpoint: ep, page: 1 });
  const setPage = (p: number) =>
    setQuery({ endpoint: activeCfg.endpoint, page: Math.max(1, Math.min(totalPages, p)) });

  return (
    <>
      <SEO
        path="/procurement"
        title={`GenSan Procurement — ${activeCfg.label}`}
        description="Full procurement archive for General Santos City: bids, awards, infrastructure publications, and price catalogue. Cached daily from procurement.gensantos.gov.ph via Regiment."
        keywords="gensan procurement, gensan bids, bid results, BAC general santos, procurement archive"
      />

      <div className="bg-gray-50 py-8">
        <div className="mx-auto max-w-[1100px] px-4">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Procurement' },
            ]}
            className="mb-4"
          />

          {/* ---------- Page header (tightened) ---------- */}
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <Gavel className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  GenSan Procurement
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-gray-600">
                  Public bidding and awards from official city systems.
                </p>
              </div>
            </div>
            <FreshnessBadge
              tone={headlineFreshness.tone}
              ageText={headlineFreshness.ageText}
            />
          </div>

          {/* Stats strip */}
          <div className="text-xs text-gray-500">
            <strong className="text-gray-700">
              {totalCount.toLocaleString()}
            </strong>{' '}
            records · {PROCUREMENT_ENDPOINTS.length} datasets ·{' '}
            <Link
              to="/"
              className="text-primary-600 hover:text-primary-700 underline decoration-dotted"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-4 py-6">
        {/* ---------- Search ---------- */}
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 transition focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search title, supplier, reference number, or category…"
            className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            aria-label="Search procurement records"
            autoComplete="off"
            maxLength={200}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label="Clear search"
              className="flex h-5 w-5 items-center justify-center rounded text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* ---------- Tabs (no scrollbar, < > arrow navigation) ---------- */}
        <div className="mb-6 flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollTabs(-1)}
            aria-label="Scroll datasets left"
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-primary-300 hover:bg-primary-50 sm:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div
            ref={tabsRef}
            role="tablist"
            aria-label="Procurement datasets"
            className="flex flex-1 gap-2 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {PROCUREMENT_ENDPOINTS.map(e => {
              const tabHealth = healthMap[e.slug];
              const tabTone = freshnessFromHealth(tabHealth).tone;
              return (
                <TabPill
                  key={e.endpoint}
                  cfg={e}
                  isActive={e.endpoint === activeCfg.endpoint}
                  count={counts[e.endpoint] ?? 0}
                  tone={tabTone}
                  onClick={() => setEndpoint(e.endpoint)}
                />
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => scrollTabs(1)}
            aria-label="Scroll datasets right"
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-primary-300 hover:bg-primary-50 sm:flex"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* ---------- Tab title + page summary (lighter) ---------- */}
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {activeCfg.label}
            </h2>
            <p className="text-xs text-gray-500">{activeCfg.headline}</p>
          </div>
          <div className="text-[11px] text-gray-400">
            {tabTotal === 0 ? (
              <span>No records</span>
            ) : (
              <>
                Showing {fromIdx.toLocaleString()}–{toIdx.toLocaleString()} of{' '}
                {tabTotal.toLocaleString()}
              </>
            )}
          </div>
        </div>

        {/* ---------- Cards ---------- */}
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">
            Loading cached records…
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center text-sm text-gray-500">
            No records found for this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map(r => (
              <ProcurementCard key={r.id} r={r} />
            ))}
          </div>
        )}

        {/* ---------- Pagination controls ---------- */}
        {tabTotal > PAGE_SIZE && (
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPage={setPage}
          />
        )}

        <SourceHealthFooter
          sourceKeys={['gensan-procurement']}
          sourceDomain="procurement.gensantos.gov.ph"
          sourceHref="https://procurement.gensantos.gov.ph/"
          hasCachedData={rows.length > 0}
        />

        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
          <div className="flex items-start gap-2">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <strong>How to participate:</strong> Download bid documents from
              the official procurement site, then submit to the BAC before the
              deadline.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

interface PaginationProps {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}

const Pagination = ({ page, totalPages, onPage }: PaginationProps) => {
  // Build a compact page list: first, last, current ±2, with ellipses.
  const pages: (number | 'ellipsis')[] = [];
  const push = (n: number) => {
    if (!pages.includes(n)) pages.push(n);
  };
  push(1);
  for (let p = page - 2; p <= page + 2; p++) {
    if (p > 1 && p < totalPages) push(p);
  }
  if (totalPages > 1) push(totalPages);
  // Insert ellipses where there are gaps.
  const withGaps: (number | 'ellipsis')[] = [];
  pages.forEach((p, i) => {
    if (i > 0) {
      const prev = pages[i - 1] as number;
      if ((p as number) - prev > 1) withGaps.push('ellipsis');
    }
    withGaps.push(p);
  });

  const btn =
    'inline-flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-500 transition hover:border-primary-300 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-gray-200';

  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex flex-wrap items-center justify-center gap-1"
    >
      <button
        type="button"
        onClick={() => onPage(1)}
        disabled={page <= 1}
        className={btn}
        aria-label="First page"
      >
        <ChevronsLeft className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className={btn}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>

      {withGaps.map((p, i) =>
        p === 'ellipsis' ? (
          <span
            key={`gap-${i}`}
            className="px-0.5 text-[11px] text-gray-400"
            aria-hidden
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`inline-flex h-7 min-w-7 items-center justify-center rounded border px-1.5 text-[11px] font-medium transition ${
              p === page
                ? 'border-primary-700 bg-primary-600 text-white hover:bg-primary-700'
                : 'border-gray-200 text-gray-600 hover:border-primary-400 hover:bg-primary-50'
            }`}
          >
            {p.toLocaleString()}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className={btn}
        aria-label="Next page"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onPage(totalPages)}
        disabled={page >= totalPages}
        className={btn}
        aria-label="Last page"
      >
        <ChevronsRight className="h-3.5 w-3.5" />
      </button>
    </nav>
  );
};

export default Procurement;
