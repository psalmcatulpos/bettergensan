// Jobs page — two-tab civic job board: Private Sector + Government.
//
// Private tab shows merged Indeed/LinkedIn listings from Supabase.
// Government tab shows HRMDO vacancies (fixtures for now, supabase later).
// ?tab=gov query param selects the Government tab on mount.

import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Hash,
  Landmark,
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
import type { GovJob } from '../types';
import {
  fetchGovJobs,
  filterGovJobs,
  sortGovJobs,
  type EligibilityFilter,
} from '../lib/govJobsSource';

// =============================================================================
// Filter types (private tab)
// =============================================================================

type SourceFilter = 'all' | 'indeed' | 'linkedin';
type PostedFilter = 'any' | 'today' | '3d' | '7d' | '30d';
type SortKey = 'newest' | 'relevance';

const SOURCE_OPTIONS: { value: SourceFilter; label: string }[] = [
  { value: 'all', label: 'All sources' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'linkedin', label: 'LinkedIn' },
];

const POSTED_OPTIONS: { value: PostedFilter; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: 'today', label: 'Past 24h' },
  { value: '3d', label: 'Past 3 days' },
  { value: '7d', label: 'Past 7 days' },
  { value: '30d', label: 'Past 30 days' },
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
  '30d': 30,
};

// =============================================================================
// Filter types (government tab)
// =============================================================================

type ClosingFilter = 'all' | '7d' | '30d';

const CLOSING_OPTIONS: { value: ClosingFilter; label: string }[] = [
  { value: 'all', label: 'All open' },
  { value: '7d', label: 'Closing in 7 days' },
  { value: '30d', label: 'Closing in 30 days' },
];

const ELIGIBILITY_OPTIONS: { value: EligibilityFilter; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 'none', label: 'None required' },
  { value: 'subprofessional', label: 'Subprofessional' },
  { value: 'professional', label: 'Professional' },
  { value: 'ra1080', label: 'RA 1080' },
];

type SalaryGradeFilter = 'any' | '1-8' | '9-15' | '16-23' | '24+';

const SALARY_GRADE_OPTIONS: { value: SalaryGradeFilter; label: string }[] = [
  { value: 'any', label: 'Any Salary Grade' },
  { value: '1-8', label: 'Salary Grade 1–8' },
  { value: '9-15', label: 'Salary Grade 9–15' },
  { value: '16-23', label: 'Salary Grade 16–23' },
  { value: '24+', label: 'Salary Grade 24+' },
];

const SALARY_GRADE_RANGE: Record<SalaryGradeFilter, [number, number] | null> = {
  any: null,
  '1-8': [1, 8],
  '9-15': [9, 15],
  '16-23': [16, 23],
  '24+': [24, 99],
};

const CLOSING_DAYS: Record<ClosingFilter, number | undefined> = {
  all: undefined,
  '7d': 7,
  '30d': 30,
};

// =============================================================================
// Page
// =============================================================================

const PRIVATE_PAGE_SIZE = 20;
const GOV_PAGE_SIZE = 20;

type TabKey = 'private' | 'gov';

const Jobs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>(
    searchParams.get('tab') === 'gov' ? 'gov' : 'private',
  );

  const switchTab = (tab: TabKey) => {
    setActiveTab(tab);
    setSearchParams(tab === 'gov' ? { tab: 'gov' } : {}, { replace: true });
  };

  // ----- Private sector data -----
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<SourceFilter>('all');
  const [posted, setPosted] = useState<PostedFilter>('any');
  const [sort, setSort] = useState<SortKey>('newest');
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [privateLoading, setPrivateLoading] = useState(true);
  const [privateError, setPrivateError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setPrivateLoading(true);
    setPrivateError(null);
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
          setPrivateError(
            e instanceof Error ? e.message : 'Failed to load jobs',
          );
        }
      } finally {
        if (!controller.signal.aborted) setPrivateLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  // ----- Government data -----
  const [govJobs, setGovJobs] = useState<GovJob[]>([]);
  const [govLoading, setGovLoading] = useState(true);
  const [govQuery, setGovQuery] = useState('');
  const [closing, setClosing] = useState<ClosingFilter>('all');
  const [eligibility, setEligibility] = useState<EligibilityFilter>('any');
  const [salaryGrade, setSalaryGrade] = useState<SalaryGradeFilter>('any');

  // Pagination
  const [privatePage, setPrivatePage] = useState(1);
  const [govPage, setGovPage] = useState(1);

  // Detail modal
  const [selectedGovJob, setSelectedGovJob] = useState<GovJob | null>(null);

  useEffect(() => {
    (async () => {
      const data = await fetchGovJobs();
      setGovJobs(data);
      setGovLoading(false);
    })();
  }, []);

  // ----- Private filter pipeline -----
  const filteredPrivate = useMemo(() => {
    const q = query.trim().toLowerCase();
    const windowDays = POSTED_WINDOW_DAYS[posted];
    const cutoff =
      windowDays != null ? Date.now() - windowDays * DAY_MS : null;

    let out = jobs;
    if (source !== 'all') out = out.filter(j => j.source === source);
    if (cutoff != null)
      out = out.filter(
        j => j.date_published && new Date(j.date_published).getTime() >= cutoff,
      );
    if (q)
      out = out.filter(j => {
        const hay =
          `${j.title} ${j.company_name ?? ''} ${j.location ?? ''}`.toLowerCase();
        return hay.includes(q);
      });

    if (sort === 'newest') {
      out = [...out].sort((a, b) => {
        const ta = a.date_published
          ? new Date(a.date_published).getTime()
          : 0;
        const tb = b.date_published
          ? new Date(b.date_published).getTime()
          : 0;
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

  // ----- Government filter pipeline -----
  const filteredGov = useMemo(() => {
    let out = filterGovJobs(govJobs, {
      closingWithinDays: CLOSING_DAYS[closing],
      eligibility,
    });
    const sgRange = SALARY_GRADE_RANGE[salaryGrade];
    if (sgRange) {
      out = out.filter(
        j => j.salary_grade >= sgRange[0] && j.salary_grade <= sgRange[1],
      );
    }
    const gq = govQuery.trim().toLowerCase();
    if (gq) {
      out = out.filter(j => {
        const hay =
          `${j.position} ${j.place_of_assignment} ${j.eligibility}`.toLowerCase();
        return hay.includes(gq);
      });
    }
    return sortGovJobs(out);
  }, [govJobs, closing, eligibility, salaryGrade, govQuery]);

  // Paginated slices
  const privateTotalPages = Math.max(1, Math.ceil(filteredPrivate.length / PRIVATE_PAGE_SIZE));
  const privatePageClamped = Math.min(privatePage, privateTotalPages);
  const privateSlice = filteredPrivate.slice(
    (privatePageClamped - 1) * PRIVATE_PAGE_SIZE,
    privatePageClamped * PRIVATE_PAGE_SIZE,
  );

  const govTotalPages = Math.max(1, Math.ceil(filteredGov.length / GOV_PAGE_SIZE));
  const govPageClamped = Math.min(govPage, govTotalPages);
  const govSlice = filteredGov.slice(
    (govPageClamped - 1) * GOV_PAGE_SIZE,
    govPageClamped * GOV_PAGE_SIZE,
  );

  const hasPrivateFilters =
    query.trim().length > 0 || source !== 'all' || posted !== 'any';

  // Reset private page when filters change
  useEffect(() => setPrivatePage(1), [query, source, posted, sort]);

  const resetPrivateFilters = () => {
    setQuery('');
    setSource('all');
    setPosted('any');
    setSort('newest');
  };

  const hasGovFilters =
    govQuery.trim().length > 0 ||
    closing !== 'all' ||
    eligibility !== 'any' ||
    salaryGrade !== 'any';

  // Reset gov page when filters change
  useEffect(() => setGovPage(1), [govQuery, closing, eligibility, salaryGrade]);

  const resetGovFilters = () => {
    setGovQuery('');
    setClosing('all');
    setEligibility('any');
    setSalaryGrade('any');
  };

  return (
    <>
      <SEO
        path="/jobs"
        title="Jobs in General Santos City"
        description="Browse the latest job openings in General Santos City — private sector listings from Indeed and LinkedIn, plus government vacancies from the HRMDO."
        keywords="gensan jobs, general santos city jobs, hiring gensan, employment south cotabato, hrmdo gensan, government jobs gensan"
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
                Private sector listings from Indeed and LinkedIn, plus
                government vacancies from the City HRMDO.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[960px] px-4 py-6">
        {/* ---------- Tab bar ---------- */}
        <div className="relative mb-5 flex border-b border-gray-200">
          <TabButton
            active={activeTab === 'private'}
            onClick={() => switchTab('private')}
            icon={<Building2 className="h-4 w-4" />}
            label="Private Sector"
            count={jobs.length}
            loading={privateLoading}
          />
          <TabButton
            active={activeTab === 'gov'}
            onClick={() => switchTab('gov')}
            icon={<Landmark className="h-4 w-4" />}
            label="Government"
            count={govJobs.length}
            loading={govLoading}
          />
        </div>

        {/* ---------- Private tab ---------- */}
        {activeTab === 'private' && (
          <>
            <PrivateToolbar
              query={query}
              onQuery={setQuery}
              source={source}
              onSource={setSource}
              posted={posted}
              onPosted={setPosted}
              sort={sort}
              onSort={setSort}
            />

            {!privateLoading && !privateError && (
              <div className="mt-3 mb-3 flex items-center justify-between text-[11px] text-gray-500">
                <span>
                  {filteredPrivate.length === 0 ? (
                    <>No matches</>
                  ) : (
                    <>
                      Showing{' '}
                      <strong className="text-gray-700">
                        {filteredPrivate.length.toLocaleString()}
                      </strong>{' '}
                      of {jobs.length.toLocaleString()} jobs
                    </>
                  )}
                </span>
                {hasPrivateFilters && (
                  <button
                    type="button"
                    onClick={resetPrivateFilters}
                    className="inline-flex items-center gap-1 font-medium text-primary-600 hover:text-primary-700"
                  >
                    <X className="h-3 w-3" />
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {privateLoading ? (
              <SkeletonList />
            ) : privateError ? (
              <ErrorState message={privateError} />
            ) : filteredPrivate.length === 0 ? (
              <EmptyState
                onReset={resetPrivateFilters}
                hasFilters={hasPrivateFilters}
              />
            ) : (
              <>
                <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
                  {privateSlice.map(job => (
                    <JobRowCard key={job.id} job={job} />
                  ))}
                </ul>
                {privateTotalPages > 1 && (
                  <Pagination
                    page={privatePageClamped}
                    totalPages={privateTotalPages}
                    onPage={setPrivatePage}
                  />
                )}
              </>
            )}

            {!privateLoading && !privateError && jobs.length > 0 && (
              <p className="mt-4 text-center text-[11px] text-gray-400">
                Sources cached daily via Regiment ·{' '}
                <Link
                  to="/"
                  className="underline decoration-dotted hover:text-gray-600"
                >
                  Back to home
                </Link>
              </p>
            )}
          </>
        )}

        {/* ---------- Government tab ---------- */}
        {activeTab === 'gov' && (
          <>
            <GovToolbar
              query={govQuery}
              onQuery={setGovQuery}
              closing={closing}
              onClosing={setClosing}
              eligibility={eligibility}
              onEligibility={setEligibility}
              salaryGrade={salaryGrade}
              onSalaryGrade={setSalaryGrade}
            />

            {!govLoading && (
              <div className="mt-3 mb-3 flex items-center justify-between text-[11px] text-gray-500">
                <span>
                  {filteredGov.length === 0 ? (
                    <>No matches</>
                  ) : (
                    <>
                      Showing{' '}
                      <strong className="text-gray-700">
                        {filteredGov.length.toLocaleString()}
                      </strong>{' '}
                      of {govJobs.length.toLocaleString()} vacancies
                    </>
                  )}
                </span>
                {hasGovFilters && (
                  <button
                    type="button"
                    onClick={resetGovFilters}
                    className="inline-flex items-center gap-1 font-medium text-primary-600 hover:text-primary-700"
                  >
                    <X className="h-3 w-3" />
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {govLoading ? (
              <SkeletonList />
            ) : filteredGov.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
                <Landmark className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                <p className="text-sm font-medium text-gray-700">
                  No vacancies match the current filters.
                </p>
                {hasGovFilters && (
                  <button
                    type="button"
                    onClick={resetGovFilters}
                    className="mt-4 inline-flex items-center gap-1 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
                  {govSlice.map(job => (
                    <GovJobRowCard
                      key={job.id}
                      job={job}
                      onSelect={setSelectedGovJob}
                    />
                  ))}
                </ul>
                {govTotalPages > 1 && (
                  <Pagination
                    page={govPageClamped}
                    totalPages={govTotalPages}
                    onPage={setGovPage}
                  />
                )}
              </>
            )}

            {selectedGovJob && (
              <GovJobDetailModal
                job={selectedGovJob}
                onClose={() => setSelectedGovJob(null)}
              />
            )}

            <p className="mt-4 text-center text-[11px] text-gray-400">
              Source: City HRMDO ·{' '}
              <a
                href="https://gensantos.gov.ph/city-human-resource-management-and-development-office/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-dotted hover:text-gray-600"
              >
                gensantos.gov.ph
              </a>
            </p>
          </>
        )}
      </div>
    </>
  );
};

// =============================================================================
// Tab button
// =============================================================================

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
  loading: boolean;
}> = ({ active, onClick, icon, label, count, loading }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors duration-[var(--dur-fast)] ${
      active ? 'text-primary-700' : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    {icon}
    {label}
    {!loading && (
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
          active
            ? 'bg-primary-100 text-primary-700'
            : 'bg-gray-100 text-gray-500'
        }`}
      >
        {count}
      </span>
    )}
    {active && (
      <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-primary-600" />
    )}
  </button>
);

// =============================================================================
// Private toolbar
// =============================================================================

interface PrivateToolbarProps {
  query: string;
  onQuery: (v: string) => void;
  source: SourceFilter;
  onSource: (v: SourceFilter) => void;
  posted: PostedFilter;
  onPosted: (v: PostedFilter) => void;
  sort: SortKey;
  onSort: (v: SortKey) => void;
}

const PrivateToolbar: React.FC<PrivateToolbarProps> = ({
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
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 transition-[border-color,box-shadow] duration-[var(--dur-fast)] focus-within:border-primary-300 focus-within:ring-1 focus-within:ring-primary-300">
        <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => onQuery(e.target.value)}
          placeholder="Search by title, skill, or company…"
          className="w-full bg-transparent text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
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

// =============================================================================
// Government toolbar
// =============================================================================

const GovToolbar: React.FC<{
  query: string;
  onQuery: (v: string) => void;
  closing: ClosingFilter;
  onClosing: (v: ClosingFilter) => void;
  eligibility: EligibilityFilter;
  onEligibility: (v: EligibilityFilter) => void;
  salaryGrade: SalaryGradeFilter;
  onSalaryGrade: (v: SalaryGradeFilter) => void;
}> = ({ query, onQuery, closing, onClosing, eligibility, onEligibility, salaryGrade, onSalaryGrade }) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 transition-[border-color,box-shadow] duration-[var(--dur-fast)] focus-within:border-primary-300 focus-within:ring-1 focus-within:ring-primary-300">
        <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => onQuery(e.target.value)}
          placeholder="Search by position, office, or eligibility…"
          className="w-full bg-transparent text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
          aria-label="Search government jobs"
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

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-gray-400">
          <ListFilter className="h-3 w-3" />
          Filters
        </span>
        <FilterSelect
          icon={<Calendar className="h-3.5 w-3.5" />}
          value={closing}
          onChange={v => onClosing(v as ClosingFilter)}
          options={CLOSING_OPTIONS}
          ariaLabel="Filter by closing date"
        />
        <FilterSelect
          icon={<Hash className="h-3.5 w-3.5" />}
          value={salaryGrade}
          onChange={v => onSalaryGrade(v as SalaryGradeFilter)}
          options={SALARY_GRADE_OPTIONS}
          ariaLabel="Filter by salary grade"
        />
        <FilterSelect
          icon={<Landmark className="h-3.5 w-3.5" />}
          value={eligibility}
          onChange={v => onEligibility(v as EligibilityFilter)}
          options={ELIGIBILITY_OPTIONS}
          ariaLabel="Filter by eligibility"
        />
      </div>
    </div>
  );
};

// =============================================================================
// Shared filter select
// =============================================================================

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
    <label className="group inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 transition-[border-color,background-color] duration-[var(--dur-fast)] hover:border-primary-200 hover:bg-primary-50/50 focus-within:border-primary-300 focus-within:ring-1 focus-within:ring-primary-300">
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
// Private job row card (unchanged from previous version)
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
        <span className="inline-flex shrink-0 items-center gap-1 self-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 transition group-hover:border-primary-400 group-hover:bg-primary-600 group-hover:text-white">
          Apply
          <ArrowUpRight className="h-3 w-3" />
        </span>
      </a>
    </li>
  );
};

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
// Government job row card
// =============================================================================

const fmtSalary = (n: number) =>
  '₱' + n.toLocaleString('en-PH', { maximumFractionDigits: 0 });

const fmtClosingDate = (iso: string | null) => {
  if (!iso) return 'No date';
  const d = new Date(iso);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
};

const isClosingSoon = (iso: string | null) => {
  if (!iso) return false;
  const diff = new Date(iso).getTime() - Date.now();
  return diff >= 0 && diff <= 7 * DAY_MS;
};

const GovJobRowCard: React.FC<{
  job: GovJob;
  onSelect: (job: GovJob) => void;
}> = ({ job, onSelect }) => {
  const soon = isClosingSoon(job.closing_date);

  return (
    <li className="group relative cursor-pointer bg-white transition hover:bg-primary-50/30" onClick={() => onSelect(job)}>
      <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-sm font-semibold text-gray-900 sm:text-[15px]">
            {job.position}
          </h3>
          <p className="mt-0.5 text-[12px] text-gray-500">
            {job.place_of_assignment}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
              Salary Grade {job.salary_grade}
            </span>
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
              {fmtSalary(job.monthly_salary)}
            </span>
            <span className="inline-flex items-center truncate rounded-full border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
              {job.eligibility.length > 35
                ? job.eligibility.slice(0, 35) + '…'
                : job.eligibility}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
              soon
                ? 'border-warning-200 bg-warning-50 text-warning-700'
                : 'border-gray-200 bg-gray-50 text-gray-600'
            }`}
          >
            {job.closing_date ? `Closes ${fmtClosingDate(job.closing_date)}` : 'No closing date'}
          </span>
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 transition-[border-color,background-color,color] duration-[var(--dur-fast)] hover:border-primary-400 hover:bg-primary-600 hover:text-white"
          >
            Apply
            <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </li>
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

// =============================================================================
// Pagination
// =============================================================================

interface PaginationProps {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}

const Pagination = ({ page, totalPages, onPage }: PaginationProps) => {
  const pages: (number | 'gap')[] = [];
  const push = (n: number) => {
    if (!pages.includes(n)) pages.push(n);
  };
  push(1);
  for (let p = page - 2; p <= page + 2; p++) {
    if (p > 1 && p < totalPages) push(p);
  }
  if (totalPages > 1) push(totalPages);
  const withGaps: (number | 'gap')[] = [];
  pages.forEach((p, i) => {
    if (i > 0) {
      const prev = pages[i - 1] as number;
      if ((p as number) - prev > 1) withGaps.push('gap');
    }
    withGaps.push(p);
  });

  const btn =
    'inline-flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-500 transition hover:border-primary-200 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-gray-200';

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex flex-wrap items-center justify-center gap-1"
    >
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
        p === 'gap' ? (
          <span key={`gap-${i}`} className="px-0.5 text-[11px] text-gray-400" aria-hidden>
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
                ? 'border-primary-700 bg-primary-600 text-white'
                : 'border-gray-200 text-gray-600 hover:border-primary-200 hover:bg-primary-50'
            }`}
          >
            {p}
          </button>
        ),
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
    </nav>
  );
};

// =============================================================================
// Government job detail modal
// =============================================================================

const GovJobDetailModal: React.FC<{
  job: GovJob;
  onClose: () => void;
}> = ({ job, onClose }) => {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
          <h2 className="text-base font-bold text-gray-900">
            Vacancy Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{job.position}</h3>
            <p className="mt-0.5 text-sm text-gray-500">
              {job.place_of_assignment}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DetailField label="Plantilla Item No." value={job.plantilla_item_no} />
            <DetailField label="Salary Grade" value={String(job.salary_grade)} />
            <DetailField
              label="Monthly Salary"
              value={fmtSalary(job.monthly_salary)}
            />
            <DetailField
              label="Evaluator Email"
              value={job.evaluator_email}
            />
          </div>

          <div className="space-y-3 border-t border-gray-100 pt-4">
            <DetailField label="Education" value={job.education} full />
            <DetailField label="Training" value={job.training} full />
            <DetailField label="Experience" value={job.experience} full />
            <DetailField label="Eligibility" value={job.eligibility} full />
            <DetailField label="Competency" value={job.competency} full />
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
            <DetailField
              label="Posting Date"
              value={
                job.posting_date
                  ? new Date(job.posting_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : null
              }
            />
            <DetailField
              label="Closing Date"
              value={
                job.closing_date
                  ? new Date(job.closing_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : null
              }
            />
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
          >
            Apply on HRMDO Portal
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailField: React.FC<{
  label: string;
  value: string | null | undefined;
  full?: boolean;
}> = ({ label, value, full }) => {
  const display = value?.trim() || null;
  return (
    <div className={full ? 'col-span-2' : ''}>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </dt>
      <dd
        className={`mt-0.5 text-sm ${display ? 'text-gray-900' : 'italic text-gray-400'}`}
      >
        {display ?? 'Not specified'}
      </dd>
    </div>
  );
};

export default Jobs;
