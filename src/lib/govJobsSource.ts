// Shared helper for reading government job vacancies from the HRMDO
// scraper cache. Mirrors the shape of jobsSource.ts.

import type { GovJob } from '../types';
import { GOV_JOBS_FIXTURE } from '../data/govJobsFixture';

// TODO: replace with a supabase query against gov_jobs_cache once the
// HRMDO scraper ships. For now, returns the fixture array directly.
export async function fetchGovJobs(): Promise<GovJob[]> {
  return GOV_JOBS_FIXTURE;
}

export type EligibilityFilter =
  | 'any'
  | 'none'
  | 'subprofessional'
  | 'professional'
  | 'ra1080';

export interface GovJobFilters {
  closingWithinDays?: number;
  eligibility?: EligibilityFilter;
}

export function filterGovJobs(
  jobs: GovJob[],
  filters: GovJobFilters,
): GovJob[] {
  let result = jobs;

  if (filters.closingWithinDays != null) {
    const now = Date.now();
    const cutoff = now + filters.closingWithinDays * 24 * 60 * 60 * 1000;
    result = result.filter(j => {
      const close = new Date(j.closing_date).getTime();
      return close >= now && close <= cutoff;
    });
  }

  if (filters.eligibility && filters.eligibility !== 'any') {
    const needle = filters.eligibility.toLowerCase();
    result = result.filter(j => {
      const haystack = j.eligibility.toLowerCase();
      if (needle === 'none') return haystack.includes('none');
      if (needle === 'ra1080') return haystack.includes('ra 1080');
      return haystack.includes(needle);
    });
  }

  return result;
}

export function sortGovJobs(jobs: GovJob[]): GovJob[] {
  return [...jobs].sort((a, b) => {
    const closeDiff =
      new Date(a.closing_date).getTime() - new Date(b.closing_date).getTime();
    if (closeDiff !== 0) return closeDiff;
    return (
      new Date(b.posting_date).getTime() - new Date(a.posting_date).getTime()
    );
  });
}
