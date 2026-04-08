// PopulationSpotlight — homepage sector that surfaces PSA-sourced
// population data for General Santos City and links to the full
// /population page. Replaces the previous StartBusinessIntel sector.
//
// Pure presentation. All numbers are real PSA census figures (the same
// values shown on /population), no projections or estimates.

import {
  ArrowRight,
  BarChart3,
  Building2,
  Database,
  ExternalLink,
  MapPin,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageSection from '../ui/PageSection';
import SectionHeading from '../ui/SectionHeading';

interface Stat {
  icon: LucideIcon;
  value: string;
  label: string;
  helper: string;
}

const STATS: Stat[] = [
  {
    icon: Users,
    value: '722,059',
    label: 'Total population',
    helper: '2024 PSA Census of Population (provisional).',
  },
  {
    icon: TrendingUp,
    value: '+3.24%',
    label: 'Annual growth (2015–2020)',
    helper: 'Annualized between PSA census reference dates.',
  },
  {
    icon: Building2,
    value: '26',
    label: 'Barangays',
    helper: 'Component barangays of the city.',
  },
  {
    icon: MapPin,
    value: '492.86 km²',
    label: 'Land area',
    helper: 'Density of 1,415 persons / km² in 2020.',
  },
];

const TOP_BARANGAYS = [
  { name: 'Calumpang', pop: 87718 },
  { name: 'Labangal', pop: 77052 },
  { name: 'Fatima', pop: 72613 },
  { name: 'San Isidro', pop: 64958 },
  { name: 'Apopong', pop: 58314 },
];

const fmt = (n: number) => n.toLocaleString();

const PopulationSpotlight = () => {
  const max = Math.max(...TOP_BARANGAYS.map(b => b.pop));

  return (
    <PageSection background="white" tier="secondary">
      <SectionHeading
        tier="secondary"
        icon={Users}
        eyebrow="GenSan by the numbers"
        title="Population & demographics"
        helper="PSA-sourced census data for General Santos City. Trends since 1990, the full 26-barangay breakdown, age structure, household stats, and every figure linked to its source."
        action={
          <Link
            to="/population"
            className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
          >
            Open the full data page
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-5">
        {/* ----- Left: 4 stat cards (3-wide) ----- */}
        <div className="grid grid-cols-2 gap-3 lg:col-span-3">
          {STATS.map(s => (
            <div
              key={s.label}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04]"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                {s.value}
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-primary-700">
                {s.label}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
                {s.helper}
              </p>
            </div>
          ))}
        </div>

        {/* ----- Right: top 5 barangays (2-wide) ----- */}
        <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04] lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-primary-700">
                Largest barangays
              </div>
              <h3 className="text-sm font-bold text-gray-900">
                Top 5 by 2020 population
              </h3>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/10">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>

          <ul className="flex-grow space-y-2.5">
            {TOP_BARANGAYS.map(b => {
              const w = (b.pop / max) * 100;
              return (
                <li key={b.name} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-semibold text-gray-900">
                      {b.name}
                    </span>
                    <span className="font-bold text-primary-700 tabular-nums">
                      {fmt(b.pop)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-primary-600"
                      style={{ width: `${w}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <Link
            to="/population"
            className="mt-4 inline-flex items-center gap-1 self-start text-[11px] font-semibold text-primary-700 hover:text-primary-800"
          >
            See all 26 barangays
            <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* ----- Source line ----- */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-[11px] text-gray-500">
        <span className="inline-flex items-center gap-1">
          <Database className="h-3 w-3" />
          Source:{' '}
          <a
            href="https://rsso12.psa.gov.ph/content/highlights-population-general-santos-city-2020-census-population-and-housing-2020-cph"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted hover:text-gray-700"
          >
            PSA RSSO XII · 2020 CPH highlights
          </a>{' '}
          · cross-checked against{' '}
          <a
            href="https://www.philatlas.com/mindanao/r12/general-santos.html"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted hover:text-gray-700"
          >
            PhilAtlas
          </a>
        </span>
        <a
          href="https://psa.gov.ph/statistics/population-and-housing"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline decoration-dotted hover:text-gray-700"
        >
          PSA Population & Housing
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </PageSection>
  );
};

export default PopulationSpotlight;
