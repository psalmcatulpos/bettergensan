// /population — General Santos City Population & Demographics
//
// All figures sourced from the Philippine Statistics Authority (PSA),
// PSA RSSO XII press releases, and PhilAtlas / CityPopulation.de
// compilations of PSA data. Each table and stat block names its source
// and links to the canonical page so readers can verify or dig deeper.
//
// The brief that guided this page (Executive Summary.pdf) called for a
// static, non-interactive presentation: Summary → Indicators → Trends
// → Barangay Breakdown → Demographics → Methodology → Sources.
//
// Sample / placeholder values from the brief were never used. Every
// number on this page is a real PSA census figure for General Santos.

import {
  AlertTriangle,
  BarChart3,
  Building2,
  Database,
  ExternalLink,
  Hash,
  Info,
  Landmark,
  MapPin,
  ScrollText,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import SectionHeading from '../components/ui/SectionHeading';
import PageSection from '../components/ui/PageSection';

// ---------- Headline indicators ----------

interface Stat {
  icon: LucideIcon;
  value: string;
  label: string;
  helper: string;
}

const HEADLINE_STATS: Stat[] = [
  {
    icon: Users,
    value: '722,059',
    label: 'Total population',
    helper: '2024 Census of Population (PSA, declared 2025).',
  },
  {
    icon: TrendingUp,
    value: '+3.24%',
    label: 'Annual growth rate',
    helper: '2015 to 2020, computed from PSA census totals.',
  },
  {
    icon: Building2,
    value: '26',
    label: 'Barangays',
    helper: 'Component barangays of the city, per PSGC.',
  },
  {
    icon: MapPin,
    value: '492.86 km²',
    label: 'Land area',
    helper: 'Total land area as cited in PhilAtlas / PSA records.',
  },
  {
    icon: BarChart3,
    value: '1,415',
    label: 'Persons / km² (2020)',
    helper: 'Population density at the 2020 reference date.',
  },
  {
    icon: Hash,
    value: '4.11',
    label: 'Avg. household size',
    helper: 'From the 2015 PSA Census of Population (latest published).',
  },
];

// ---------- Population trends (verified PSA totals) ----------

interface TrendRow {
  year: number;
  population: number;
  growth: string;
  growthNote: string;
}

const TRENDS: TrendRow[] = [
  {
    year: 1990,
    population: 250395,
    growth: '—',
    growthNote: 'Earliest published baseline.',
  },
  {
    year: 2000,
    population: 411822,
    growth: '+5.10%',
    growthNote: '1990 → 2000, annualized.',
  },
  {
    year: 2010,
    population: 538086,
    growth: '+2.71%',
    growthNote: '2000 → 2010, annualized.',
  },
  {
    year: 2015,
    population: 594446,
    growth: '+2.02%',
    growthNote: '2010 → 2015, annualized.',
  },
  {
    year: 2020,
    population: 697315,
    growth: '+3.24%',
    growthNote: '2015 → 2020, annualized (May 2020 reference).',
  },
  {
    year: 2024,
    population: 722059,
    growth: '+0.86%',
    growthNote: '2020 → 2024, annualized (provisional).',
  },
];

// ---------- Barangay breakdown ----------
//
// Source: City Population (citypopulation.de) compilation of PSA Census of
// Population data. 2015 and 2020 columns are official PSA census figures.

interface BarangayRow {
  name: string;
  pop2015: number;
  pop2020: number;
}

const BARANGAYS: BarangayRow[] = [
  { name: 'Apopong', pop2015: 46384, pop2020: 58314 },
  { name: 'Baluan', pop2015: 7611, pop2020: 11861 },
  { name: 'Batomelong', pop2015: 3235, pop2020: 2967 },
  { name: 'Buayan', pop2015: 11196, pop2020: 11487 },
  { name: 'Bula', pop2015: 31363, pop2020: 30845 },
  { name: 'Calumpang', pop2015: 75342, pop2020: 87718 },
  { name: 'City Heights', pop2015: 24014, pop2020: 24343 },
  { name: 'Conel', pop2015: 11164, pop2020: 15931 },
  { name: 'Dadiangas East', pop2015: 4746, pop2020: 3387 },
  { name: 'Dadiangas North', pop2015: 8056, pop2020: 6801 },
  { name: 'Dadiangas South', pop2015: 6199, pop2020: 4815 },
  { name: 'Dadiangas West', pop2015: 13827, pop2020: 13090 },
  { name: 'Fatima', pop2015: 66460, pop2020: 72613 },
  { name: 'Katangawan', pop2015: 13948, pop2020: 17355 },
  { name: 'Labangal', pop2015: 61713, pop2020: 77052 },
  { name: 'Lagao', pop2015: 50789, pop2020: 53706 },
  { name: 'Ligaya', pop2015: 5298, pop2020: 6688 },
  { name: 'Mabuhay', pop2015: 28288, pop2020: 37629 },
  { name: 'Olympog', pop2015: 3352, pop2020: 4455 },
  { name: 'San Isidro', pop2015: 52832, pop2020: 64958 },
  { name: 'San Jose', pop2015: 11333, pop2020: 13504 },
  { name: 'Siguel', pop2015: 12757, pop2020: 15687 },
  { name: 'Sinawal', pop2015: 13285, pop2020: 18467 },
  { name: 'Tambler', pop2015: 21474, pop2020: 31539 },
  { name: 'Tinagacan', pop2015: 6322, pop2020: 8344 },
  { name: 'Upper Labay', pop2015: 3458, pop2020: 3759 },
];

// ---------- Demographic snapshot (2015 census, latest published age/sex) ----------

interface Demographic {
  label: string;
  value: string;
  helper: string;
}

const DEMOGRAPHICS: Demographic[] = [
  {
    label: 'Median age',
    value: '23.94',
    helper: '2015 census. Reflects a young, growing city.',
  },
  {
    label: 'Largest age group',
    value: '15–19 yrs',
    helper: '61,928 persons (10.42% of population).',
  },
  {
    label: 'Smallest age group',
    value: '80+ yrs',
    helper: '2,738 persons (0.46% of population).',
  },
  {
    label: 'Youth dependency ratio',
    value: '48.38',
    helper: 'Persons under 15 per 100 of working age (15–64).',
  },
  {
    label: 'Old-age dependency ratio',
    value: '5.12',
    helper: 'Persons 65+ per 100 of working age.',
  },
  {
    label: 'Total dependency ratio',
    value: '53.50',
    helper: 'Sum of youth and old-age dependency.',
  },
  {
    label: 'Households',
    value: '144,340',
    helper: '2015 census household count.',
  },
  {
    label: 'Average household size',
    value: '4.11',
    helper: '2015 census household population ÷ households.',
  },
];

// ---------- Sources ----------

interface Source {
  icon: LucideIcon;
  name: string;
  scope: string;
  href: string;
  domain: string;
}

const SOURCES: Source[] = [
  {
    icon: Database,
    name: 'PSA RSSO XII — 2020 CPH Highlights for General Santos City',
    scope: 'Regional Statistical Services Office XII press release on the 2020 Census of Population and Housing for GenSan.',
    href: 'https://rsso12.psa.gov.ph/content/highlights-population-general-santos-city-2020-census-population-and-housing-2020-cph',
    domain: 'rsso12.psa.gov.ph',
  },
  {
    icon: ScrollText,
    name: 'PSA — Population and Housing portal',
    scope: 'PSA national landing page for Population and Housing data, including the 2020 and 2024 censuses.',
    href: 'https://psa.gov.ph/statistics/population-and-housing',
    domain: 'psa.gov.ph',
  },
  {
    icon: ScrollText,
    name: 'PSA — General Santos City data',
    scope: 'PSA detail page for General Santos City population and housing tables.',
    href: 'https://psa.gov.ph/statistics/population-and-housing/node/2291',
    domain: 'psa.gov.ph',
  },
  {
    icon: ScrollText,
    name: '2020 CPH Press Release — PIA',
    scope: 'PIA mirror of the official PSA press release announcing the 2020 census counts.',
    href: 'https://mirror.pia.gov.ph/press-releases/2021/07/08/2020-census-of-population-and-housing-2020-cph-population-counts-declared-official-by-the-president',
    domain: 'mirror.pia.gov.ph',
  },
  {
    icon: Database,
    name: 'PSA OpenStat',
    scope: 'Online query tool for PSA tables, including population by region, province, city, and barangay.',
    href: 'https://openstat.psa.gov.ph/PXWeb/pxweb/en/DB/DB__1A__PO/?tablelist=true',
    domain: 'openstat.psa.gov.ph',
  },
  {
    icon: ScrollText,
    name: 'PhilAtlas — General Santos City',
    scope: 'Independent compilation of PSA census figures for General Santos City. Used for cross-check and historical context.',
    href: 'https://www.philatlas.com/mindanao/r12/general-santos.html',
    domain: 'philatlas.com',
  },
  {
    icon: BarChart3,
    name: 'City Population — General Santos City',
    scope: 'Population statistics, charts, and per-barangay tables compiled from PSA data.',
    href: 'https://www.citypopulation.de/en/philippines/generalsantos/',
    domain: 'citypopulation.de',
  },
];

const fmt = (n: number) => n.toLocaleString();

const Population: React.FC = () => {
  const [sortKey, setSortKey] = useState<'name' | 'pop2020'>('pop2020');

  const sortedBarangays = useMemo(() => {
    const copy = [...BARANGAYS];
    if (sortKey === 'name') {
      copy.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      copy.sort((a, b) => b.pop2020 - a.pop2020);
    }
    return copy;
  }, [sortKey]);

  const totalPop2020 = BARANGAYS.reduce((sum, b) => sum + b.pop2020, 0);
  const maxPop = Math.max(...BARANGAYS.map(b => b.pop2020));

  return (
    <>
      <SEO
        title="Population & Demographics — GenSan"
        description="Verified Philippine Statistics Authority (PSA) census data for General Santos City. Population trends since 1990, 26-barangay breakdown for 2015 and 2020, household statistics, age structure, and dependency ratios. All figures sourced and linked."
        keywords="general santos city population, gensan census, psa 2020 census gensan, gensan barangays population, gensan demographics, rsso 12"
      />

      {/* ---------- Hero ---------- */}
      <div className="bg-gray-50 py-10">
        <div className="mx-auto max-w-[1100px] px-4">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Population & Demographics' },
            ]}
            className="mb-4"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <Users className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">
                PSA Census Data · Sourced & Cited
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Population & Demographics
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-900">
                Verified Philippine Statistics Authority (PSA) census data
                for General Santos City. Population trends since 1990, the
                full 26-barangay breakdown for 2015 and 2020, household
                statistics, age structure, and dependency ratios. Every
                number on this page is sourced and linked at the bottom.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="https://rsso12.psa.gov.ph/content/highlights-population-general-santos-city-2020-census-population-and-housing-2020-cph"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
                >
                  <Database className="h-3.5 w-3.5" />
                  PSA RSSO XII release
                </a>
                <a
                  href="https://psa.gov.ph/statistics/population-and-housing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
                >
                  Visit PSA
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Key indicators ---------- */}
      <PageSection background="white" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={BarChart3}
          eyebrow="At a glance"
          title="Headline indicators"
          helper="The six numbers that summarize the state of the city. All values from PSA census data."
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {HEADLINE_STATS.map(s => (
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
      </PageSection>

      {/* ---------- Population trends ---------- */}
      <PageSection background="gray" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={TrendingUp}
          eyebrow="Population trends"
          title="Population by census year"
          helper="Total population at each PSA census reference date, with annualized growth between censuses."
        />

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.04]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Census Year</th>
                <th className="px-4 py-3">Population</th>
                <th className="px-4 py-3">Annual growth</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {TRENDS.map(t => (
                <tr key={t.year} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {t.year}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-primary-700">
                    {fmt(t.population)}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-gray-700">
                    {t.growth}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {t.growthNote}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 max-w-3xl text-[11px] text-gray-500">
          Sources: PSA Census of Population and Housing (1990, 2000, 2010,
          2015, 2020) and the 2024 Census of Population. Growth rates are
          annualized between published census counts. The 2024 figure is
          provisional pending the full PSA release.
        </p>
      </PageSection>

      {/* ---------- Barangay breakdown ---------- */}
      <PageSection background="white" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={Building2}
          eyebrow="Per-barangay"
          title="Population by barangay"
          helper="All 26 barangays of General Santos City. The 2020 column is the most recent PSA-published barangay-level total. The bar shows each barangay's share of the city total."
          action={
            <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setSortKey('pop2020')}
                className={`rounded-full px-2.5 py-1 transition ${
                  sortKey === 'pop2020'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-primary-700'
                }`}
              >
                Sort by 2020 pop
              </button>
              <button
                type="button"
                onClick={() => setSortKey('name')}
                className={`rounded-full px-2.5 py-1 transition ${
                  sortKey === 'name'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-primary-700'
                }`}
              >
                Sort A–Z
              </button>
            </div>
          }
        />

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.04]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Barangay</th>
                <th className="px-4 py-3 text-right">2015</th>
                <th className="px-4 py-3 text-right">2020</th>
                <th className="px-4 py-3 text-right">Δ 2015–20</th>
                <th className="px-4 py-3 hidden sm:table-cell">% of city</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedBarangays.map(b => {
                const delta = b.pop2020 - b.pop2015;
                const pct = (b.pop2020 / totalPop2020) * 100;
                const barWidth = (b.pop2020 / maxPop) * 100;
                const positive = delta >= 0;
                return (
                  <tr key={b.name} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {b.name}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-700">
                      {fmt(b.pop2015)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-primary-700">
                      {fmt(b.pop2020)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right text-xs font-semibold ${
                        positive ? 'text-success-700' : 'text-error-700'
                      }`}
                    >
                      {positive ? '+' : ''}
                      {fmt(delta)}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-primary-600"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span className="text-[11px] tabular-nums text-gray-600">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 text-xs">
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-900">
                  City total (sum of barangays)
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-700">
                  {fmt(BARANGAYS.reduce((s, b) => s + b.pop2015, 0))}
                </td>
                <td className="px-4 py-3 text-right font-bold text-primary-700">
                  {fmt(totalPop2020)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-700">
                  +
                  {fmt(
                    BARANGAYS.reduce(
                      (s, b) => s + (b.pop2020 - b.pop2015),
                      0
                    )
                  )}
                </td>
                <td className="hidden px-4 py-3 sm:table-cell" />
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="mt-3 max-w-3xl text-[11px] text-gray-500">
          Source: City Population (citypopulation.de) compilation of PSA
          Census of Population data, cross-checked against PSA RSSO XII
          highlights for General Santos City. Both 2015 and 2020 columns
          are official PSA census figures.
        </p>
      </PageSection>

      {/* ---------- Demographic snapshot ---------- */}
      <PageSection background="gray" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={Users}
          eyebrow="Demographic snapshot"
          title="Age structure & households"
          helper="Age distribution, dependency ratios, and household statistics from the most recently published PSA detail tables for General Santos City."
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {DEMOGRAPHICS.map(d => (
            <div
              key={d.label}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-900/[0.04]"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-primary-700">
                {d.label}
              </div>
              <div className="mt-1 text-xl font-bold tracking-tight text-gray-900">
                {d.value}
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-gray-600">
                {d.helper}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-3 max-w-3xl text-[11px] text-gray-500">
          Source: PSA 2015 Census of Population (latest published age-sex
          and household tables for General Santos City). PSA has not yet
          released the equivalent detail tables for the 2020 and 2024
          rounds at the time of publication.
        </p>
      </PageSection>

      {/* ---------- Methodology ---------- */}
      <PageSection background="white" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={Info}
          eyebrow="How this page is built"
          title="Methodology & limitations"
          helper="What we did with the data, and what to watch out for when reading it."
        />

        <ul className="space-y-2.5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04]">
          {[
            'All totals come from PSA Census of Population and Housing rounds. Earlier figures (1990, 2000, 2010, 2015, 2020) are final. The 2024 figure is provisional pending the complete PSA release.',
            'Annual growth rates are annualized between published census counts. Reference dates differ slightly across census rounds (e.g. May 2020 vs August 2015), so rates may vary by ~0.1% from PhilAtlas summaries that use different reference assumptions.',
            'Per-barangay totals for 2015 and 2020 are PSA census figures via the City Population compilation, cross-checked against the PSA RSSO XII press release. PSA has not yet released barangay-level totals for the 2024 round at the time of publication.',
            'Age structure, household counts, and dependency ratios are from the 2015 PSA detail tables. PSA typically publishes the equivalent 2020 / 2024 detail tables in stages over the years following each census.',
            'BetterGensan does not produce population estimates of its own. We do not project, model, or extrapolate; everything you see was either published by PSA or computed directly from PSA totals.',
            'No migration breakdown is shown. PSA does not publish internal migration figures at the barangay level for General Santos City.',
          ].map(line => (
            <li
              key={line}
              className="flex items-start gap-2 text-sm text-gray-700"
            >
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </PageSection>

      {/* ---------- Sources ---------- */}
      <PageSection background="gray" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={Database}
          eyebrow="Where this data comes from"
          title="Sources"
          helper="Every figure on this page traces back to one of these. Click any card to open the source in a new tab."
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SOURCES.map(s => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-900/[0.04] transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-grow">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">
                    {s.name}
                  </h4>
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400 group-hover:text-primary-700" />
                </div>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                  {s.scope}
                </p>
                <p className="mt-1.5 text-[11px] font-medium text-primary-700">
                  {s.domain}
                </p>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div>
              <strong>For official use,</strong> always cite the original
              PSA publication, not BetterGensan. PSA is the authoritative
              source of all Philippine census data.
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <strong>Spotted a number that looks wrong?</strong> Email{' '}
              <a
                href="mailto:psalm.catulpos@brigada.com.ph"
                className="font-semibold text-primary-700 hover:text-primary-800"
              >
                psalm.catulpos@brigada.com.ph
              </a>{' '}
              with the source you trust and we will reconcile.
            </div>
          </div>
        </div>
      </PageSection>
    </>
  );
};

export default Population;
