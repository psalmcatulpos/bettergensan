// Caching contract: fetchGovJobs() is called once per page mount. Callers hold
// the result in component state and run all filter/sort operations in memory.
// Refresh is the scraper's job (gensan-gov-jobs-refresh edge function writes to
// gov_jobs_cache on a schedule); the frontend does not trigger refreshes and
// does not refetch on filter, tab, or sort changes.
//
// Shared helper for reading government job vacancies from the HRMDO
// scraper cache. Mirrors the shape of jobsSource.ts.

import type { GovJob } from '../types';
import { supabase } from './supabase';

export async function fetchGovJobs(): Promise<GovJob[]> {
  const { data, error } = await supabase
    .from('gov_jobs_cache')
    .select(
      'id, position, plantilla_item_no, salary_grade, monthly_salary, place_of_assignment, evaluator_email, education, training, experience, eligibility, competency, posting_date, closing_date, source_url, apply_url, first_seen_at, last_seen_at, missing_from_source',
    )
    .eq('missing_from_source', false)
    .order('closing_date', { ascending: true });

  if (error) {
    console.warn('[govJobsSource] fetchGovJobs failed', error.message);
    return [];
  }
  return (data ?? []) as GovJob[];
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
      if (!j.closing_date) return false;
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
    // Null closing dates sort last
    const ca = a.closing_date ? new Date(a.closing_date).getTime() : Infinity;
    const cb = b.closing_date ? new Date(b.closing_date).getTime() : Infinity;
    if (ca !== cb) return ca - cb;
    const pa = a.posting_date ? new Date(a.posting_date).getTime() : 0;
    const pb = b.posting_date ? new Date(b.posting_date).getTime() : 0;
    return pb - pa;
  });
}
