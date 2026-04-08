// JobsNearYou — lightweight homepage preview of the latest openings.
//
// Intentionally minimal: no card wrapper, no inner header block, no cached
// counts or freshness badge. Just a tight divider list of 5 rows that links
// to the full /jobs page for filters, search, and operational metadata.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Briefcase } from 'lucide-react';
import PageSection from '../ui/PageSection';
import SectionHeading from '../ui/SectionHeading';
import {
  cleanLocation,
  readJobsFromTable,
  refreshAndReadJobs,
  timeAgo,
  type JobRow,
} from '../../lib/jobsSource';

const JobsNearYou = () => {
  const [rows, setRows] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <PageSection background="gray" tier="primary">
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
            <JobRow key={job.id} job={job} />
          ))}
        </ul>
      )}
    </PageSection>
  );
};

// =============================================================================
// Single row — divider list, no card wrapper
// =============================================================================

const JobRow: React.FC<{ job: JobRow }> = ({ job }) => {
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
        className="flex items-center justify-between gap-4 py-2.5 transition"
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

        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-gray-500 transition group-hover:text-primary-700">
          Apply
          <ArrowUpRight className="h-3 w-3" />
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
