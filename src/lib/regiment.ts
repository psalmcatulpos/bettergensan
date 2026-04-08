// Thin client for the Regiment API, called through the /api/regiment dev
// proxy (see vite.config.ts). The proxy injects the X-API-Key header so the
// secret never ships to the browser. For production, deploy an equivalent
// proxy (serverless function, nginx, etc.) at the same path.

const BASE = '/api/regiment';

async function get<T>(
  module: string,
  tool: string,
  params: Record<string, string | number | undefined>
): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') qs.append(k, String(v));
  }
  const url = `${BASE}/${module}/${tool}${qs.toString() ? `?${qs}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Regiment ${module}/${tool} failed: ${res.status}`);
  }
  const body = (await res.json()) as { success?: boolean; data?: T };
  if (body.success === false || body.data === undefined) {
    throw new Error(`Regiment ${module}/${tool} returned no data`);
  }
  return body.data;
}

// --- Jobs API types ----------------------------------------------------

export interface LinkedInJob {
  id: string;
  title: string;
  companyName: string;
  linkedinCompanyName?: string;
  location: string;
  linkedinUrl: string;
  datePosted: string;
  postedTimeAgo: string;
}

interface LinkedInSearchResponse {
  data: LinkedInJob[];
  meta?: { nextToken?: string; count?: number };
}

export interface IndeedJob {
  id: string;
  title: string;
  company: { name: string; image?: string };
  location: { location: string; country?: string };
  description: string;
  applyUrl: string;
  datePublishedTimestamp: number;
}

interface IndeedSearchResponse {
  data: IndeedJob[];
  meta?: { nextToken?: string; count?: number };
}

// --- Public calls ------------------------------------------------------

export function linkedinSearch(opts: {
  query?: string;
  location?: string;
  datePosted?: 'day' | 'week' | 'month' | 'any';
}) {
  return get<LinkedInSearchResponse>('jobs-api', 'linkedin_search', {
    query: opts.query,
    location: opts.location ?? 'General Santos City, Philippines',
    datePosted: opts.datePosted ?? 'month',
  });
}

export function indeedSearch(opts: { query?: string; location?: string }) {
  return get<IndeedSearchResponse>('jobs-api', 'indeed_search', {
    countryCode: 'ph',
    query: opts.query,
    location: opts.location ?? 'General Santos City',
  });
}
