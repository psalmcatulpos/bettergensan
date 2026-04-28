// /eo — Full Executive Orders archive for General Santos City.
//
// Modeled on the /procurement detail page: hero, headline freshness badge,
// year filter chips, paginated card grid, and compact pagination. Reads from
// the same Supabase cache as the homepage carousel and the EO detail page.
// Never calls Regiment from the frontend.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  FileText,
  Hash,
  Calendar,
  Search,
  X,
} from 'lucide-react';
import SourceHealthFooter from '../components/ui/SourceHealthFooter';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import FreshnessBadge from '../components/ui/FreshnessBadge';
import {
  EO_SOURCE_SLUG,
  freshnessFromHealth,
  humanDate,
  normalizeTitle,
  readExecutiveOrderYears,
  readExecutiveOrdersPage,
  readSourceHealth,
  shortenEoTitle,
  type ExecutiveOrderRow,
  type FreshnessInfo,
} from '../lib/gensanCache';

const PAGE_SIZE = 24;

const ExecutiveOrders: React.FC = () => {
  const [{ year, page, q }, setQuery] = useQueryStates(
    {
      year: parseAsString.withDefault('all'),
      page: parseAsInteger.withDefault(1),
      q: parseAsString.withDefault(''),
    },
    { history: 'push' }
  );

  // Local input state — debounced into the URL `q` param so we don't fire a
  // Supabase query on every keystroke. The URL stays the source of truth.
  const [searchInput, setSearchInput] = useState(q);
  useEffect(() => {
    if (searchInput === q) return;
    const t = setTimeout(() => {
      setQuery({ year, q: searchInput || null, page: 1 });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);
  // If the URL `q` changes externally (back/forward, deep link), sync input.
  useEffect(() => {
    if (q !== searchInput) setSearchInput(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const [years, setYears] = useState<number[]>([]);
  const [rows, setRows] = useState<ExecutiveOrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [freshness, setFreshness] = useState<FreshnessInfo>({
    tone: 'unknown',
    ageText: 'never',
    ageMs: null,
    lastSuccessAt: null,
    lastSuccessLabel: 'Loading…',
  });

  // Mount: load source health + year list
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const [healthMap, yearList] = await Promise.all([
        readSourceHealth([EO_SOURCE_SLUG], controller.signal),
        readExecutiveOrderYears(controller.signal),
      ]);
      if (controller.signal.aborted) return;
      setFreshness(freshnessFromHealth(healthMap[EO_SOURCE_SLUG]));
      setYears(yearList);
    })();
    return () => controller.abort();
  }, []);

  // Reload page when filter, search, or page changes
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const yearFilter = year === 'all' ? null : Number(year);
    (async () => {
      const { rows: r, total: t } = await readExecutiveOrdersPage(
        page,
        PAGE_SIZE,
        yearFilter,
        q,
        controller.signal
      );
      if (controller.signal.aborted) return;
      setRows(r);
      setTotal(t);
      setLoading(false);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    })();
    return () => controller.abort();
  }, [year, page, q]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const fromIdx = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const toIdx = Math.min(safePage * PAGE_SIZE, total);

  const setYear = (y: string) => setQuery({ year: y, page: 1, q: q || null });
  const setPage = (p: number) =>
    setQuery({ year, q: q || null, page: Math.max(1, Math.min(totalPages, p)) });

  const yearChips = useMemo(() => ['all', ...years.map(String)], [years]);

  return (
    <>
      <SEO
        path="/eo"
        title="Executive Orders — GenSan"
        description="Full archive of General Santos City executive orders. Daily-refreshed cache from eo.gensantos.gov.ph with year filtering and direct PDF previews."
        keywords="gensan executive orders, mayoral order general santos, lgu executive orders, gensan archive, eo gensan"
      />

      {/* ---------- Hero ---------- */}
      <div className="bg-gray-50 py-8">
        <div className="mx-auto max-w-[1100px] px-4">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Executive Orders' },
            ]}
            className="mb-4"
          />

          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">
                  Mayoral Orders Archive
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Executive Orders
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-gray-900">
                  Full daily-refreshed archive of General Santos City
                  executive orders. Cached from{' '}
                  <a
                    href="https://eo.gensantos.gov.ph/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary-700 hover:text-primary-800"
                  >
                    eo.gensantos.gov.ph
                  </a>{' '}
                  via Regiment so the public record stays accessible even
                  when the official site is down.
                </p>
              </div>
            </div>
            <FreshnessBadge
              tone={freshness.tone}
              ageText={freshness.ageText}
            />
          </div>

          <div className="text-xs text-gray-500">
            <strong className="text-gray-700">{total.toLocaleString()}</strong>{' '}
            {total === 1 ? 'order' : 'orders'}
            {year !== 'all' && (
              <>
                {' '}
                in <strong className="text-gray-700">{year}</strong>
              </>
            )}{' '}
            ·{' '}
            <Link
              to="/"
              className="text-primary-700 hover:text-primary-800 underline decoration-dotted"
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
            placeholder="Search EO title or order number…"
            className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            aria-label="Search executive orders"
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

        {/* ---------- Year filter ---------- */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Filter by year
          </span>
          {yearChips.map(y => {
            const active = y === year;
            return (
              <button
                key={y}
                type="button"
                onClick={() => setYear(y)}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  active
                    ? 'border-primary-700 bg-primary-600 text-white shadow-sm shadow-primary-900/10'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-50/40'
                }`}
              >
                {y === 'all' ? (
                  <>
                    <Hash className="h-3 w-3" />
                    All years
                  </>
                ) : (
                  <>
                    <Calendar className="h-3 w-3" />
                    {y}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* ---------- Page summary ---------- */}
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {year === 'all' ? 'All executive orders' : `Year ${year}`}
            </h2>
            <p className="text-xs text-gray-500">
              Latest orders shown first.
            </p>
          </div>
          <div className="text-[11px] text-gray-400">
            {total === 0 ? (
              <span>No records</span>
            ) : (
              <>
                Showing {fromIdx.toLocaleString()}–{toIdx.toLocaleString()} of{' '}
                {total.toLocaleString()}
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
            No executive orders found for this filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map(o => (
              <EoCard key={o.id} o={o} />
            ))}
          </div>
        )}

        {/* ---------- Pagination ---------- */}
        {total > PAGE_SIZE && (
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPage={setPage}
          />
        )}

        <SourceHealthFooter
          sourceKeys={['gensan-eo']}
          sourceDomain="eo.gensantos.gov.ph"
          sourceHref="https://eo.gensantos.gov.ph/"
          hasCachedData={rows.length > 0}
        />
      </div>
    </>
  );
};

// ---------- EO card ----------
//
// Compact version of the homepage carousel card, sized for a 4-col responsive
// grid on the archive page. Title is normalized + truncated to ~14 words.
// Archived rows (status='missing_from_source') get a muted appearance and a
// "No longer available" tag.

const EoCard = ({ o }: { o: ExecutiveOrderRow }) => {
  const short = shortenEoTitle(normalizeTitle(o.title), 14);
  const isMissing = o.status === 'missing_from_source';
  return (
    <article
      className={`flex flex-col rounded-xl border bg-white p-3 shadow-sm shadow-gray-900/[0.04] transition hover:-translate-y-0.5 hover:shadow-md ${
        isMissing
          ? 'border-gray-200 opacity-80 hover:border-gray-300'
          : 'border-gray-200 hover:border-primary-300'
      }`}
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-1">
        {o.order_number && (
          <span className="rounded-full border border-primary-200 bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold text-primary-700">
            EO {o.order_number}
          </span>
        )}
        {o.date_issued && (
          <span className="text-[10px] text-gray-500">
            {humanDate(o.date_issued)}
          </span>
        )}
        {isMissing && (
          <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-gray-50 px-1.5 py-0.5 text-[9px] font-medium text-gray-600">
            <Archive className="h-2.5 w-2.5" />
            Archived
          </span>
        )}
      </div>

      <h4
        className={`mb-3 line-clamp-3 text-[13px] font-medium leading-snug tracking-normal ${
          isMissing ? 'text-gray-600' : 'text-gray-800'
        }`}
        title={o.title}
      >
        {short}
      </h4>

      <div className="mt-auto flex items-center gap-1.5">
        <Link
          to={`/government/executive-orders/${o.id}`}
          className={`inline-flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-white transition ${
            isMissing
              ? 'bg-gray-500 hover:bg-gray-600'
              : 'bg-primary-600 hover:bg-primary-700'
          }`}
        >
          View Details
        </Link>
        <a
          href={o.download_url ?? o.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium text-gray-600 transition hover:border-primary-300 hover:bg-primary-50"
        >
          Original
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </article>
  );
};

// ---------- Pagination ----------

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

export default ExecutiveOrders;
