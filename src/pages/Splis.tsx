// Full /splis archive page.
//
// Mirrors /procurement: type tabs (Ordinance / Resolution / All), year filter
// chips, paginated grid of cards, deep-link state via nuqs so users can share
// or refresh without losing position:
//   ?type=Resolution&year=2024&page=12

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import {
  Archive,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  Landmark,
  Search,
  X,
} from 'lucide-react';
import SourceHealthFooter from '../components/ui/SourceHealthFooter';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import FreshnessBadge from '../components/ui/FreshnessBadge';
import {
  SPLIS_ORDINANCES_SLUG,
  SPLIS_RESOLUTIONS_SLUG,
  SPLIS_SLUGS,
  aggregateFreshness,
  freshnessFromHealth,
  normalizeTitle,
  readSourceHealth,
  readSplisCounts,
  readSplisPage,
  readSplisYears,
  type FreshnessInfo,
  type SourceHealthRow,
  type SplisRecordType,
  type SplisRow,
} from '../lib/gensanCache';

const PAGE_SIZE = 24;

type TypeFilter = 'All' | SplisRecordType;
const TYPE_FILTERS: TypeFilter[] = ['All', 'Ordinance', 'Resolution'];

interface TabCfg {
  key: TypeFilter;
  label: string;
  subtitle: string;
}

const TABS: TabCfg[] = [
  { key: 'All', label: 'All Records', subtitle: 'ordinances + resolutions' },
  { key: 'Ordinance', label: 'Ordinances', subtitle: 'binding city legislation' },
  { key: 'Resolution', label: 'Resolutions', subtitle: 'council expressions of policy' },
];

const Splis: React.FC = () => {
  const [{ type, year, page, q }, setQuery] = useQueryStates(
    {
      type: parseAsString.withDefault('All'),
      year: parseAsInteger,
      page: parseAsInteger.withDefault(1),
      q: parseAsString.withDefault(''),
    },
    { history: 'push' }
  );

  const activeType: TypeFilter = useMemo(() => {
    return (TYPE_FILTERS as string[]).includes(type) ? (type as TypeFilter) : 'All';
  }, [type]);

  // Debounced search input → URL `q` param
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

  const [healthMap, setHealthMap] = useState<Record<string, SourceHealthRow>>(
    {}
  );
  const [counts, setCounts] = useState<{
    total: number;
    perType: Record<SplisRecordType, number>;
  }>({ total: 0, perType: { Ordinance: 0, Resolution: 0 } });
  const [years, setYears] = useState<number[]>([]);
  const [rows, setRows] = useState<SplisRow[]>([]);
  const [tabTotal, setTabTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const tabsRef = useRef<HTMLDivElement>(null);
  const scrollTabs = (dir: 1 | -1) => {
    const el = tabsRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  // Mount: load source health, counts, year chips.
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const [healthRes, countsRes, yearsRes] = await Promise.all([
        readSourceHealth([...SPLIS_SLUGS], controller.signal),
        readSplisCounts(controller.signal),
        readSplisYears(controller.signal),
      ]);
      if (controller.signal.aborted) return;
      setHealthMap(healthRes);
      setCounts(countsRes);
      setYears(yearsRes);
    })();
    return () => controller.abort();
  }, []);

  // Reload page when type/year/search/page changes.
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    (async () => {
      const { rows: r, total } = await readSplisPage(
        activeType,
        page,
        PAGE_SIZE,
        year ?? undefined,
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
  }, [activeType, year, page, q]);

  const totalPages = Math.max(1, Math.ceil(tabTotal / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const fromIdx = tabTotal === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const toIdx = Math.min(safePage * PAGE_SIZE, tabTotal);

  const setType = (t: TypeFilter) =>
    setQuery({ type: t === 'All' ? null : t, page: 1 });
  const setYear = (y: number | null) =>
    setQuery({ year: y, page: 1 });
  const setPage = (p: number) =>
    setQuery({ page: Math.max(1, Math.min(totalPages, p)) });

  const headlineFreshness: FreshnessInfo = useMemo(
    () =>
      aggregateFreshness([
        freshnessFromHealth(healthMap[SPLIS_ORDINANCES_SLUG]),
        freshnessFromHealth(healthMap[SPLIS_RESOLUTIONS_SLUG]),
      ]),
    [healthMap]
  );

  const activeTabCount =
    activeType === 'All'
      ? counts.total
      : counts.perType[activeType as SplisRecordType] ?? 0;

  return (
    <>
      <SEO
        title={`GenSan Sangguniang Panglungsod — ${
          TABS.find(t => t.key === activeType)?.label ?? 'All Records'
        }`}
        description="Full archive of Sangguniang Panglungsod ordinances and resolutions for General Santos City. Cached daily from splis.gensantos.gov.ph via Regiment."
        keywords="gensan sangguniang panglungsod, gensan ordinance, gensan resolution, sp records, general santos city council"
      />

      <div className="bg-gray-50 py-8">
        <div className="mx-auto max-w-[1100px] px-4">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Civic Decisions', href: '/#civic-decisions' },
              { label: 'Sangguniang Panglungsod' },
            ]}
            className="mb-4"
          />

          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <Landmark className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  Sangguniang Panglungsod
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-gray-600">
                  Ordinances, resolutions, and other legislative records of the
                  General Santos City Council.
                </p>
              </div>
            </div>
            <FreshnessBadge
              tone={headlineFreshness.tone}
              ageText={headlineFreshness.ageText}
            />
          </div>

          {/* Stats strip — matches /procurement style */}
          <div className="text-xs text-gray-500">
            <strong className="text-gray-700">
              {counts.total.toLocaleString()}
            </strong>{' '}
            records ·{' '}
            <strong className="text-gray-700">
              {counts.perType.Ordinance.toLocaleString()}
            </strong>{' '}
            ordinances ·{' '}
            <strong className="text-gray-700">
              {counts.perType.Resolution.toLocaleString()}
            </strong>{' '}
            resolutions ·{' '}
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
            placeholder="Search title, SP number, or category…"
            className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            aria-label="Search SP records"
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

        {/* ---------- Type tabs ---------- */}
        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollTabs(-1)}
            aria-label="Scroll types left"
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-primary-300 hover:bg-primary-50 sm:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div
            ref={tabsRef}
            role="tablist"
            aria-label="SPLIS record types"
            className="flex flex-1 gap-2 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {TABS.map(t => {
              const isActive = t.key === activeType;
              const tabCount =
                t.key === 'All'
                  ? counts.total
                  : counts.perType[t.key as SplisRecordType] ?? 0;
              return (
                <button
                  key={t.key}
                  role="tab"
                  type="button"
                  onClick={() => setType(t.key)}
                  aria-selected={isActive}
                  className={`group flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-50'
                  }`}
                >
                  <span>{t.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0 text-[10px] font-semibold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {tabCount.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => scrollTabs(1)}
            aria-label="Scroll types right"
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-primary-300 hover:bg-primary-50 sm:flex"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* ---------- Year filter chips ---------- */}
        {years.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-medium uppercase tracking-wider text-gray-400">
              Year
            </span>
            <button
              type="button"
              onClick={() => setYear(null)}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${
                year == null
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:bg-primary-50'
              }`}
            >
              All
            </button>
            {years.map(y => (
              <button
                key={y}
                type="button"
                onClick={() => setYear(y)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${
                  year === y
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:bg-primary-50'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        )}

        {/* ---------- Tab title + page summary ---------- */}
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {TABS.find(t => t.key === activeType)?.label}
              {year != null && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  · {year}
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500">
              {activeTabCount.toLocaleString()} cached
              {year != null ? ` · filtered to ${year}` : ''}
            </p>
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
            No records found for this filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map(r => (
              <SplisCard key={r.id} r={r} />
            ))}
          </div>
        )}

        {/* ---------- Pagination ---------- */}
        {tabTotal > PAGE_SIZE && (
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPage={setPage}
          />
        )}

        <SourceHealthFooter
          sourceKeys={['gensan-splis']}
          sourceDomain="splis.gensantos.gov.ph"
          sourceHref="https://splis.gensantos.gov.ph/"
          hasCachedData={rows.length > 0}
        />
      </div>
    </>
  );
};

// =============================================================================
// SPLIS card (grid item)
// =============================================================================

const SplisCard: React.FC<{ r: SplisRow }> = ({ r }) => {
  const isMissing = r.status === 'missing_from_source';
  const isOrdinance = r.record_type === 'Ordinance';
  const numberLabel = `${isOrdinance ? 'Ord' : 'Res'} ${r.record_no}`;
  const titleNormalized = normalizeTitle(r.title);

  return (
    <article
      className={`flex flex-col rounded-xl border bg-white p-4 transition hover:shadow-sm ${
        isMissing
          ? 'border-gray-200 opacity-80 hover:border-gray-300'
          : 'border-gray-200 hover:border-primary-300'
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            isOrdinance
              ? 'border border-primary-200 bg-primary-50 text-primary-700'
              : 'border border-primary-200 bg-primary-50 text-primary-700'
          }`}
        >
          {r.record_type}
        </span>
        <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-700">
          {numberLabel}
        </span>
        {r.record_year && (
          <span className="text-[10px] text-gray-500">{r.record_year}</span>
        )}
        {isMissing ? (
          <span className="inline-flex items-center gap-0.5 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500">
            <Archive className="h-2.5 w-2.5" />
            Archived
          </span>
        ) : (
          <span className="inline-flex items-center gap-0.5 rounded-full border border-success-200 bg-success-50 px-2 py-0.5 text-[10px] font-semibold text-success-700">
            <CheckCircle className="h-2.5 w-2.5" />
            Enacted
          </span>
        )}
      </div>

      <h3
        className={`mb-2 line-clamp-3 text-sm font-medium leading-snug ${
          isMissing ? 'text-gray-500' : 'text-gray-900'
        }`}
        title={r.title}
      >
        {titleNormalized}
      </h3>

      {r.category && (
        <p className="mb-3 line-clamp-1 text-[11px] text-gray-500">
          {r.category}
        </p>
      )}

      <div className="mt-auto flex items-center gap-1.5">
        <Link
          to={`/government/sp-records/${r.id}`}
          className={`inline-flex flex-1 items-center justify-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium text-white transition ${
            isMissing
              ? 'bg-gray-500 hover:bg-gray-600'
              : 'bg-primary-600 hover:bg-primary-700'
          }`}
        >
          View Details
        </Link>
        {r.pdf_url && (
          <a
            href={r.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-normal text-gray-500 transition hover:border-primary-300 hover:bg-primary-50"
          >
            PDF
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </article>
  );
};

// =============================================================================
// Pagination (cloned from Procurement.tsx — same UX)
// =============================================================================

interface PaginationProps {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}

const Pagination = ({ page, totalPages, onPage }: PaginationProps) => {
  const pages: (number | 'ellipsis')[] = [];
  const push = (n: number) => {
    if (!pages.includes(n)) pages.push(n);
  };
  push(1);
  for (let p = page - 2; p <= page + 2; p++) {
    if (p > 1 && p < totalPages) push(p);
  }
  if (totalPages > 1) push(totalPages);
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

export default Splis;
