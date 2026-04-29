// JobsNearYou — homepage preview: government vacancies on top, private
// sector below. Government block only renders when there are open
// vacancies; otherwise the section shows the private list only.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Briefcase, Landmark } from 'lucide-react';
import PageSection from '../ui/PageSection';
import SectionHeading from '../ui/SectionHeading';
import useReveal from '../../hooks/useReveal';
import {
  cleanLocation,
  readJobsFromTable,
  refreshAndReadJobs,
  timeAgo,
  type JobRow,
} from '../../lib/jobsSource';
import type { GovJob } from '../../types';
import { fetchGovJobs, sortGovJobs } from '../../lib/govJobsSource';

const DAY_MS = 24 * 60 * 60 * 1000;

const JobsNearYou = () => {
  const [rows, setRows] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [govJobs, setGovJobs] = useState<GovJob[]>([]);
  const [govTotal, setGovTotal] = useState(0);
  const [govLoading, setGovLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const data = await refreshAndReadJobs(50, controller.signal);
        if (controller.signal.aborted) return;
        setRows(data.slice(0, 5));
      } catch (e) {
        if (controller.signal.aborted) return;
        const data = await readJobsFromTable(5, controller.signal);
        if (controller.signal.aborted) return;
        if (data.length > 0) {
          setRows(data);
        } else {
          setError(e instanceof Error ? e.message : 'Failed to load jobs');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    (async () => {
      const data = await fetchGovJobs();
      const sorted = sortGovJobs(data);
      setGovTotal(sorted.length);
      setGovJobs(sorted.slice(0, 3));
      setGovLoading(false);
    })();
  }, []);

  const headingRef = useReveal();
  const govRef = useReveal();
  const privateRef = useReveal();

  const showGov = !govLoading && govJobs.length > 0;

  return (
    <PageSection background="gray" tier="primary">
      <div ref={headingRef} className="reveal">
        <SectionHeading
          tier="primary"
          icon={Briefcase}
          eyebrow="Work"
          title="Jobs Near You"
          helper="Latest openings in General Santos City."
          action={
            <Link
              to="/jobs"
              className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
            >
              View all jobs →
            </Link>
          }
        />
      </div>

      <div
        ref={govRef}
        className="reveal"
        style={{ '--reveal-delay': '100ms' } as React.CSSProperties}
      >
        {/* ---------- Government block ---------- */}
        {showGov && (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                <Landmark className="h-3.5 w-3.5 text-primary-600" />
                Government vacancies
                <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-[10px] font-semibold text-primary-700">
                  {govTotal}
                </span>
              </h3>
              <Link
                to="/jobs?tab=gov"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 transition-colors hover:text-primary-800"
              >
                View all government jobs
                <ArrowRight className="h-3 w-3 transition-transform duration-[var(--dur-fast)] group-hover:translate-x-0.5" />
              </Link>
            </div>

            <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
              {govJobs.map(job => (
                <GovJobRow key={job.id} job={job} />
              ))}
            </ul>
          </div>
        )}

        {/* ---------- Divider ---------- */}
        {showGov && (
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
              Private sector
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
        )}
      </div>

      {/* ---------- Private block ---------- */}
      <div
        ref={privateRef}
        className="reveal"
        style={
          {
            '--reveal-delay': showGov ? '200ms' : '100ms',
          } as React.CSSProperties
        }
      >
        {loading ? (
          <SkeletonList />
        ) : error && rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            Couldn't load jobs right now. Please try again later.
          </p>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            No cached jobs available right now.
          </p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {rows.map(job => (
              <PrivateJobRow key={job.id} job={job} />
            ))}
          </ul>
        )}
      </div>
    </PageSection>
  );
};

// =============================================================================
// Government job row (compact homepage version)
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

const GovJobRow: React.FC<{ job: GovJob }> = ({ job }) => {
  const soon = isClosingSoon(job.closing_date);

  return (
    <li className="group">
      <a
        href={job.apply_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between gap-3 px-3 py-2.5 transition-colors duration-[var(--dur-fast)] hover:bg-primary-50/30"
      >
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-1 text-sm font-semibold text-gray-900 transition group-hover:text-primary-700">
            {job.position}
          </h4>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
            <span>{job.place_of_assignment}</span>
            <span className="text-gray-300">·</span>
            <span className="font-medium text-gray-600">
              Salary Grade {job.salary_grade}
            </span>
            <span className="text-gray-300">·</span>
            <span className="font-medium text-gray-600">
              {fmtSalary(job.monthly_salary)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`hidden items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold sm:inline-flex ${
              soon
                ? 'border-warning-200 bg-warning-50 text-warning-700'
                : 'border-gray-200 bg-gray-50 text-gray-500'
            }`}
          >
            {job.closing_date ? `Closes ${fmtClosingDate(job.closing_date)}` : 'No closing date'}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-gray-500 transition-colors duration-[var(--dur-fast)] group-hover:text-primary-700">
            Apply
            <ArrowUpRight className="h-3 w-3 transition-transform duration-[var(--dur-fast)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </a>
    </li>
  );
};

// =============================================================================
// Private job row (existing, renamed to avoid collision with JobRow type)
// =============================================================================

const PrivateJobRow: React.FC<{ job: JobRow }> = ({ job }) => {
  const apply = job.apply_url ?? '#';
  const posted = timeAgo(job.date_published);
  const meta = [job.company_name, cleanLocation(job.location), posted]
    .filter(Boolean)
    .join(' · ');

  return (
    <li className="group">
      <a
        href={apply}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between gap-4 py-2.5 transition-colors duration-[var(--dur-fast)]"
      >
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-1 text-sm font-semibold text-gray-900 transition group-hover:text-primary-700">
            {job.title}
          </h4>
          <p className="mt-0.5 line-clamp-1 text-[12px] text-gray-500">
            {meta}
            {meta && <span className="mx-1.5 text-gray-300">·</span>}
            <SourcePill source={job.source} />
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-gray-500 transition-colors duration-[var(--dur-fast)] group-hover:text-primary-700">
          Apply
          <ArrowUpRight className="h-3 w-3 transition-transform duration-[var(--dur-fast)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </a>
    </li>
  );
};

const SourcePill: React.FC<{ source: string }> = ({ source }) => {
  const tone: Record<string, string> = {
    indeed: 'text-indigo-600',
    linkedin: 'text-sky-600',
  };
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wider ${
        tone[source] ?? 'text-gray-500'
      }`}
    >
      {source}
    </span>
  );
};

const SkeletonList: React.FC = () => {
  return (
    <ul className="divide-y divide-gray-200">
      {Array.from({ length: 5 }).map((_, i) => (
        <li
          key={i}
          className="flex items-center justify-between gap-4 py-2.5"
        >
          <div className="min-w-0 flex-1">
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-gray-200" />
            <div className="mt-1.5 h-2.5 w-1/2 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="h-3 w-10 animate-pulse rounded bg-gray-100" />
        </li>
      ))}
    </ul>
  );
};

export default JobsNearYou;
