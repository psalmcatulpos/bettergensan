// Jobs page — refined civic job-board UI.
//
// Goals:
//   - Compact, scannable row-cards instead of bulky tiles
//   - Tight toolbar with search, source filter, posted-window filter, sort
//   - Title dominant; meta row (company · location · posted · source) muted
//   - Apply CTA visible but not oversized
//   - Skeleton loaders + clean empty state
//
// Data flow is preserved verbatim from the previous version. Only the UI
// shell + filtering/sorting layers were reworked.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  ListFilter,
  MapPin,
  Search,
  X,
} from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import {
  cleanLocation,
  readJobsFromTable,
  refreshAndReadJobs,
  timeAgo,
  type JobRow,
} from '../lib/jobsSource';

// =============================================================================
// Filter types
// =============================================================================

type SourceFilter = 'all' | 'indeed' | 'linkedin';
type PostedFilter = 'any' | 'today' | '3d' | '7d';
type SortKey = 'newest' | 'relevance';

const SOURCE_OPTIONS: { value: SourceFilter; label: string }[] = [
  { value: 'all', label: 'All sources' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'linkedin', label: 'LinkedIn' },
];

const POSTED_OPTIONS: { value: PostedFilter; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: 'today', label: 'Today' },
  { value: '3d', label: 'Past 3 days' },
  { value: '7d', label: 'Past 7 days' },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'relevance', label: 'Relevance' },
];

const DAY_MS = 24 * 60 * 60 * 1000;

const POSTED_WINDOW_DAYS: Record<PostedFilter, number | null> = {
  any: null,
  today: 1,
  '3d': 3,
  '7d': 7,
};

// =============================================================================
// Page
// =============================================================================

const Jobs: React.FC = () => {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<SourceFilter>('all');
  const [posted, setPosted] = useState<PostedFilter>('any');
  const [sort, setSort] = useState<SortKey>('newest');

  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const data = await refreshAndReadJobs(100, controller.signal);
        if (controller.signal.aborted) return;
        setJobs(data);
      } catch (e) {
        if (controller.signal.aborted) return;
        const fallback = await readJobsFromTable(100, controller.signal);
        if (controller.signal.aborted) return;
        if (fallback.length > 0) {
          setJobs(fallback);
        } else {
          setError(e instanceof Error ? e.message : 'Failed to load jobs');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  // ---------- Filter pipeline ----------
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const windowDays = POSTED_WINDOW_DAYS[posted];
    const cutoff = windowDays != null ? Date.now() - windowDays * DAY_MS : null;

    let out = jobs;

    if (source !== 'all') {
      out = out.filter(j => j.source === source);
    }

    if (cutoff != null) {
      out = out.filter(j => {
        if (!j.date_published) return false;
        return new Date(j.date_published).getTime() >= cutoff;
      });
    }

    if (q) {
      out = out.filter(j => {
        const hay = `${j.title} ${j.company_name ?? ''} ${j.location ?? ''}`.toLowerCase();
        return hay.includes(q);
      });
    }

    // Sorting
    if (sort === 'newest') {
      out = [...out].sort((a, b) => {
        const ta = a.date_published ? new Date(a.date_published).getTime() : 0;
        const tb = b.date_published ? new Date(b.date_published).getTime() : 0;
        return tb - ta;
      });
    } else if (sort === 'relevance' && q) {
      out = [...out].sort((a, b) => {
        const score = (j: JobRow) => {
          const t = j.title.toLowerCase();
          if (t.startsWith(q)) return 3;
          if (t.includes(q)) return 2;
          const c = (j.company_name ?? '').toLowerCase();
          if (c.includes(q)) return 1;
          return 0;
        };
        return score(b) - score(a);
      });
    }

    return out;
  }, [jobs, query, source, posted, sort]);

  const hasActiveFilters =
    query.trim().length > 0 || source !== 'all' || posted !== 'any';

  const resetFilters = () => {
    setQuery('');
    setSource('all');
    setPosted('any');
    setSort('newest');
  };

  return (
    <>
      <SEO
        path="/jobs"
        title="Jobs in General Santos City"
        description="Browse the latest job openings in General Santos City, pulled from Indeed and LinkedIn."
        keywords="gensan jobs, general santos city jobs, hiring gensan, employment south cotabato"
      />

      {/* ---------- Page header ---------- */}
      <div className="bg-gray-50 py-8">
        <div className="mx-auto max-w-[960px] px-4">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Jobs' }]}
            className="mb-4"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <Briefcase className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Jobs in General Santos City
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-gray-600">
                Live local openings merged daily from Indeed and LinkedIn. Click
                any role to apply on the source site.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[960px] px-4 py-6">
        {/* ---------- Toolbar ---------- */}
        <Toolbar
          query={query}
          onQuery={setQuery}
          source={source}
          onSource={setSource}
          posted={posted}
          onPosted={setPosted}
          sort={sort}
          onSort={setSort}
        />

        {/* ---------- Result count + reset ---------- */}
        {!loading && !error && (
          <div className="mt-3 mb-3 flex items-center justify-between text-[11px] text-gray-500">
            <span>
              {filtered.length === 0 ? (
                <>No matches</>
              ) : (
                <>
                  Showing{' '}
                  <strong className="text-gray-700">
                    {filtered.length.toLocaleString()}
                  </strong>{' '}
                  of {jobs.length.toLocaleString()} jobs
                </>
              )}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 font-medium text-primary-600 hover:text-primary-700"
              >
                <X className="h-3 w-3" />
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* ---------- Body ---------- */}
        {loading ? (
          <SkeletonList />
        ) : error ? (
          <ErrorState message={error} />
        ) : filtered.length === 0 ? (
          <EmptyState onReset={resetFilters} hasFilters={hasActiveFilters} />
        ) : (
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {filtered.map(job => (
              <JobRowCard key={job.id} job={job} />
            ))}
          </ul>
        )}

        {/* ---------- Footer ---------- */}
        {!loading && !error && jobs.length > 0 && (
          <p className="mt-4 text-center text-[11px] text-gray-400">
            Sources cached daily via Regiment ·{' '}
            <Link to="/" className="underline decoration-dotted hover:text-gray-600">
              Back to home
            </Link>
          </p>
        )}
      </div>
    </>
  );
};

// =============================================================================
// Toolbar
// =============================================================================

interface ToolbarProps {
  query: string;
  onQuery: (v: string) => void;
  source: SourceFilter;
  onSource: (v: SourceFilter) => void;
  posted: PostedFilter;
  onPosted: (v: PostedFilter) => void;
  sort: SortKey;
  onSort: (v: SortKey) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  query,
  onQuery,
  source,
  onSource,
  posted,
  onPosted,
  sort,
  onSort,
}) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      {/* Search */}
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 transition focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
        <Search className="h-4 w-4 shrink-0 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => onQuery(e.target.value)}
          placeholder="Search by title, skill, or company…"
          className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          aria-label="Search jobs"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQuery('')}
            aria-label="Clear search"
            className="flex h-5 w-5 items-center justify-center rounded text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-gray-400">
          <ListFilter className="h-3 w-3" />
          Filters
        </span>
        <FilterSelect
          icon={<Building2 className="h-3.5 w-3.5" />}
          value={source}
          onChange={v => onSource(v as SourceFilter)}
          options={SOURCE_OPTIONS}
          ariaLabel="Filter by source"
        />
        <FilterSelect
          icon={<Calendar className="h-3.5 w-3.5" />}
          value={posted}
          onChange={v => onPosted(v as PostedFilter)}
          options={POSTED_OPTIONS}
          ariaLabel="Filter by posted date"
        />
        <div className="ml-auto">
          <FilterSelect
            icon={<Clock className="h-3.5 w-3.5" />}
            value={sort}
            onChange={v => onSort(v as SortKey)}
            options={SORT_OPTIONS}
            ariaLabel="Sort jobs"
            prefix="Sort:"
          />
        </div>
      </div>
    </div>
  );
};

interface FilterSelectProps {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
  prefix?: string;
}

const FilterSelect: React.FC<FilterSelectProps> = ({
  icon,
  value,
  onChange,
  options,
  ariaLabel,
  prefix,
}) => {
  return (
    <label className="group inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 transition hover:border-primary-300 hover:bg-primary-50/50 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
      <span className="text-gray-500 group-hover:text-primary-600">{icon}</span>
      {prefix && <span className="text-gray-400">{prefix}</span>}
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="cursor-pointer appearance-none border-0 bg-transparent pr-1 text-[11px] font-medium text-gray-700 focus:outline-none"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
};

// =============================================================================
// Job row card
// =============================================================================

const JobRowCard: React.FC<{ job: JobRow }> = ({ job }) => {
  const apply = job.apply_url ?? '#';
  const posted = timeAgo(job.date_published);
  const isFresh = posted === 'today' || posted === '1 day ago';

  return (
    <li className="group relative bg-white transition hover:bg-primary-50/30">
      <a
        href={apply}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start justify-between gap-4 px-4 py-3 sm:px-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className="line-clamp-1 text-sm font-semibold text-gray-900 transition group-hover:text-primary-700 sm:text-[15px]">
              {job.title}
            </h3>
            {isFresh && (
              <span className="inline-flex shrink-0 items-center rounded-full border border-success-200 bg-success-50 px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide text-success-700">
                New
              </span>
            )}
          </div>

          {/* Meta row — single tight line, wraps gracefully */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-gray-600">
            {job.company_name && (
              <span className="inline-flex items-center gap-1 font-medium text-gray-700">
                <Building2 className="h-3 w-3 text-gray-400" />
                {job.company_name}
              </span>
            )}
            {job.location && (
              <span className="inline-flex items-center gap-1 text-gray-500">
                <MapPin className="h-3 w-3 text-gray-400" />
                {cleanLocation(job.location)}
              </span>
            )}
            {posted && (
              <span className="inline-flex items-center gap-1 text-gray-500">
                <Clock className="h-3 w-3 text-gray-400" />
                {posted}
              </span>
            )}
            <SourcePill source={job.source} />
          </div>
        </div>

        {/* Apply CTA */}
        <span className="inline-flex shrink-0 items-center gap-1 self-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 transition group-hover:border-primary-400 group-hover:bg-primary-600 group-hover:text-white">
          Apply
          <ArrowUpRight className="h-3 w-3" />
        </span>
      </a>
    </li>
  );
};

// Source pill — refined, low-key, sits inside the meta row
const SourcePill: React.FC<{ source: string }> = ({ source }) => {
  const tone: Record<string, string> = {
    indeed: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    linkedin: 'border-sky-200 bg-sky-50 text-sky-700',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wider ${
        tone[source] ?? 'border-gray-200 bg-gray-50 text-gray-600'
      }`}
    >
      {source}
    </span>
  );
};

// =============================================================================
// Skeleton / Empty / Error states
// =============================================================================

const SkeletonList: React.FC = () => {
  return (
    <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
      {Array.from({ length: 8 }).map((_, i) => (
        <li
          key={i}
          className="flex items-start justify-between gap-4 px-4 py-3 sm:px-5"
        >
          <div className="min-w-0 flex-1">
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 flex gap-3">
              <div className="h-2.5 w-24 animate-pulse rounded bg-gray-100" />
              <div className="h-2.5 w-20 animate-pulse rounded bg-gray-100" />
              <div className="h-2.5 w-12 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
          <div className="h-6 w-14 animate-pulse rounded bg-gray-100" />
        </li>
      ))}
    </ul>
  );
};

const EmptyState: React.FC<{ onReset: () => void; hasFilters: boolean }> = ({
  onReset,
  hasFilters,
}) => {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
      <Search className="mx-auto mb-3 h-8 w-8 text-gray-300" />
      <p className="text-sm font-medium text-gray-700">No matching jobs</p>
      <p className="mt-1 text-xs text-gray-500">
        {hasFilters
          ? 'Try a different search term or relax the filters.'
          : 'No cached jobs are available right now. Check back shortly.'}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="mt-4 inline-flex items-center gap-1 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700"
        >
          Clear filters
        </button>
      )}
    </div>
  );
};

const ErrorState: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-800">
      <strong className="font-semibold">Couldn't load jobs.</strong> {message}
    </div>
  );
};

export default Jobs;
