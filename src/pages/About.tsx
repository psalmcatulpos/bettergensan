// /about — About BetterGensan
//
// Citizen-first portal explainer. Civic, clean, trustworthy tone. No marketing
// fluff. Clarifies what BetterGensan does and (importantly) what it does not.
// Updated to use the unified PageSection + SectionHeading primitives and to
// reflect the current state of the project (caches, sectors, dedicated
// service pages, admin pipeline, brand color scheme).

import {
  AlertTriangle,
  Archive,
  Building2,
  Check,
  Database,
  ExternalLink,
  Eye,
  FileText,
  Gavel,
  Github,
  Heart,
  Info,
  Landmark,
  LayoutDashboard,
  Layers,
  Palette,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import PageSection from '../components/ui/PageSection';
import SectionHeading from '../components/ui/SectionHeading';
import JoinBetterGov from '../components/dashboard/JoinBetterGov';
import {
  readExecutiveOrderCount,
  readProcurementCounts,
  readSplisCounts,
} from '../lib/gensanCache';

// ---------- What we do ----------

interface DoesItem {
  icon: LucideIcon;
  title: string;
  body: string;
}

const DOES: DoesItem[] = [
  {
    icon: Database,
    title: 'Caches public records',
    body: 'Daily snapshots of executive orders, Sangguniang Panglungsod ordinances and resolutions, procurement notices, bid results, and the price catalogue so the public record stays accessible even when official portals go down.',
  },
  {
    icon: Eye,
    title: 'Surfaces civic data',
    body: 'Live job openings from Indeed and LinkedIn, government opportunities, civic decisions, demographics, and city services — organized in one citizen-friendly dashboard.',
  },
  {
    icon: Archive,
    title: 'Acts as a watchdog archive',
    body: 'Records that disappear from the official site are flagged as "no longer available", never deleted. The completeness gate prevents partial-snapshot false flags.',
  },
  {
    icon: Sparkles,
    title: 'Translates jargon',
    body: 'Procurement classifications, executive-order titles, and legislative terminology are rewritten as plain civic language so residents can actually use the data.',
  },
];

const DOES_NOT = [
  {
    title: 'Replace the official city website',
    body: 'BetterGensan is citizen-built and unofficial. For legally binding information, always check gensantos.gov.ph and the relevant LGU office.',
  },
  {
    title: 'Process applications or payments',
    body: 'We do not collect documents, accept payments, or submit forms on your behalf. Every transactional link redirects to the responsible BIR or LGU portal.',
  },
  {
    title: 'Edit or alter source records',
    body: 'Cached records are presented as scraped. The DB value remains the audit-safe source of truth. UI title normalization is presentation-only.',
  },
  {
    title: 'Endorse any politician or campaign',
    body: 'BetterGensan is non-partisan. The portal exists to make public information easier to find, not to promote any official.',
  },
];

// ---------- By the numbers ----------

// Stats are derived live from the Supabase cache via useArchiveCounts() at
// render time — see the hook below the About component. Each row provides the
// icon and a helper-builder function that gets the live counts and returns
// the contextual text.

interface LiveStat {
  icon: LucideIcon;
  label: string;
  // value is derived from the live counts; null means "still loading"
  value: (counts: ArchiveCounts) => string;
  helper: (counts: ArchiveCounts) => string;
}

interface ArchiveCounts {
  loading: boolean;
  eo: number;
  splisOrdinances: number;
  splisResolutions: number;
  splisTotal: number;
  procurement: number;
  total: number;
}

const fmt = (n: number) => n.toLocaleString();

const LIVE_STATS: LiveStat[] = [
  {
    icon: FileText,
    label: 'Executive orders',
    value: c => (c.loading ? '—' : fmt(c.eo)),
    helper: () => 'Full GenSan archive from 2022 to present.',
  },
  {
    icon: Landmark,
    label: 'SP records',
    value: c => (c.loading ? '—' : fmt(c.splisTotal)),
    helper: c =>
      c.loading
        ? 'Sangguniang Panglungsod ordinances + resolutions, 2007 to present.'
        : `${fmt(c.splisOrdinances)} ordinances + ${fmt(c.splisResolutions)} resolutions from the Sangguniang Panglungsod, 2007 to present.`,
  },
  {
    icon: Gavel,
    label: 'Procurement records',
    value: c => (c.loading ? '—' : fmt(c.procurement)),
    helper: () =>
      'Bids, awards, infra notices, and the price catalogue across 7 datasets.',
  },
  {
    icon: Layers,
    label: 'Total cached records',
    value: c => (c.loading ? '—' : fmt(c.total)),
    helper: () =>
      'Civic public records under continuous archive — refreshed daily, never deleted.',
  },
];

// ---------- Data sources ----------

interface DataSource {
  dataset: string;
  source: string;
  cadence: string;
  mode: string;
}

const DATA_SOURCES: DataSource[] = [
  {
    dataset: 'Executive Orders',
    source: 'eo.gensantos.gov.ph',
    cadence: 'Daily',
    mode: 'Cached archive',
  },
  {
    dataset: 'Sangguniang Panglungsod (ordinances + resolutions)',
    source: 'splis.gensantos.gov.ph',
    cadence: 'Daily',
    mode: 'Cached archive',
  },
  {
    dataset: 'Procurement (7 datasets)',
    source: 'procurement.gensantos.gov.ph',
    cadence: 'Daily',
    mode: 'Cached archive',
  },
  {
    dataset: 'Jobs (Indeed + LinkedIn)',
    source: 'indeed.com, linkedin.com',
    cadence: 'Daily',
    mode: 'Cached',
  },
  {
    dataset: 'Government services',
    source: 'gensantos.gov.ph',
    cadence: '—',
    mode: 'Redirect to official',
  },
  {
    dataset: 'City profile data',
    source: 'PSA, gensantos.gov.ph',
    cadence: 'Manual',
    mode: 'Curated',
  },
  {
    dataset: 'Weather',
    source: 'open-meteo.com',
    cadence: 'Live',
    mode: 'Direct fetch',
  },
];

// ---------- Trust principles ----------

interface TrustItem {
  icon: LucideIcon;
  title: string;
  body: string;
}

const TRUST: TrustItem[] = [
  {
    icon: ShieldCheck,
    title: 'Citizen-first, not official',
    body: 'BetterGensan is an independent civic project. It is not affiliated with the Local Government Unit of General Santos City.',
  },
  {
    icon: Archive,
    title: 'Records are never deleted',
    body: 'When a public record disappears from the official site, it gets marked archived and stays viewable with a "No longer available" notice.',
  },
  {
    icon: ExternalLink,
    title: 'Source links everywhere',
    body: 'Every record on BetterGensan links back to its official source. Every fact is verifiable against the original document.',
  },
  {
    icon: Eye,
    title: 'Visible freshness',
    body: 'Every dataset shows a live status badge — updated, delayed, or temporarily unavailable — so you always know how fresh the data is.',
  },
  {
    icon: AlertTriangle,
    title: 'Use official sources for legal matters',
    body: 'BetterGensan is a civic convenience layer. For legally binding information, always confirm with the relevant LGU office or gensantos.gov.ph.',
  },
];

// =============================================================================
// CountUp — animated count-up component for the stat tiles
// =============================================================================
//
// Animates from 0 to `value` over `durationMs` using requestAnimationFrame and
// an easeOutCubic curve. The final rendered text is `value.toLocaleString()`
// so thousands separators stay correct (e.g. 17,731). When `value` changes
// after the initial mount, it re-animates from the previously displayed
// number to the new target so live cache updates feel smooth.

interface CountUpProps {
  value: number;
  durationMs?: number;
  /** Render `—` when value is 0 AND we haven't started a real animation yet
   *  (i.e. data still loading). Avoids flashing 0 → realCount on slow loads. */
  showDashWhileZero?: boolean;
}

const CountUp: React.FC<CountUpProps> = ({
  value,
  durationMs = 1400,
  showDashWhileZero = false,
}) => {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (to - from) * eased);
      setDisplay(next);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  if (showDashWhileZero && value === 0 && display === 0) {
    return <>—</>;
  }
  return <>{display.toLocaleString()}</>;
};

// =============================================================================
// useArchiveCounts — live Supabase counts for the "By the numbers" tiles
// =============================================================================

function useArchiveCounts(): ArchiveCounts {
  const [counts, setCounts] = useState<ArchiveCounts>({
    loading: true,
    eo: 0,
    splisOrdinances: 0,
    splisResolutions: 0,
    splisTotal: 0,
    procurement: 0,
    total: 0,
  });

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const [eo, splis, proc] = await Promise.all([
        readExecutiveOrderCount(controller.signal),
        readSplisCounts(controller.signal),
        readProcurementCounts(controller.signal),
      ]);
      if (controller.signal.aborted) return;
      setCounts({
        loading: false,
        eo,
        splisOrdinances: splis.perType.Ordinance,
        splisResolutions: splis.perType.Resolution,
        splisTotal: splis.total,
        procurement: proc.total,
        total: eo + splis.total + proc.total,
      });
    })();
    return () => controller.abort();
  }, []);

  return counts;
}

const About: React.FC = () => {
  const counts = useArchiveCounts();
  return (
    <>
      <SEO
        title="About BetterGensan"
        description="BetterGensan is a citizen-first portal for General Santos City. We cache and surface public records, civic data, and city services so residents have one trustworthy place to find what they need."
        keywords="about bettergensan, gensan portal, citizen portal, civic tech philippines, general santos city"
      />

      {/* ---------- Hero ---------- */}
      <div className="bg-gray-50 py-10">
        <div className="mx-auto max-w-[1100px] px-4">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'About' }]}
            className="mb-4"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <Heart className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">
                Citizen Portal
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                About BetterGensan
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-900">
                A citizen-first portal that makes public information about
                General Santos City easier to find, easier to read, and
                harder to lose.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Open the dashboard
                </Link>
                <a
                  href="https://github.com/psalmcatulpos/bettergensan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
                >
                  <Github className="h-3.5 w-3.5" />
                  View on GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Mission ---------- */}
      <PageSection background="white" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={Info}
          eyebrow="Mission"
          title="What we're building"
          helper="Make General Santos City's public records accessible, durable, and human-readable."
        />
        <div className="max-w-3xl space-y-4 text-base leading-relaxed text-gray-800">
          <p>
            BetterGensan ensures residents, journalists, and researchers can
            rely on public information without depending on government
            websites that frequently go offline, change structure, or quietly
            remove data.
          </p>
          <p>
            We archive publicly available records, turn them into clean
            dashboards, and preserve them so information remains searchable
            and accessible even during outages.
          </p>
          <p className="text-sm text-gray-600">
            Part of the{' '}
            <strong className="text-gray-900">BetterGov movement</strong>,
            localized for General Santos City.
          </p>
          <blockquote className="border-l-2 border-primary-600 pl-4 italic text-gray-700">
            If information is public, it should remain public.
          </blockquote>
        </div>
      </PageSection>

      {/* ---------- By the numbers ---------- */}
      <PageSection background="gray" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={LayoutDashboard}
          eyebrow="By the numbers"
          title="What's in the archive today"
          helper="Live cache totals across the BetterGensan data pipeline. Executive orders, Sangguniang Panglungsod ordinances and resolutions, and procurement records — refreshed daily."
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {LIVE_STATS.map(s => {
            // Pull the numeric value out of the live counts so CountUp can
            // animate it. Each LIVE_STATS row knows which field maps to its
            // tile via the value() lambda; for animation we want the raw int.
            const numericValue =
              s.label === 'Executive orders'
                ? counts.eo
                : s.label === 'SP records'
                  ? counts.splisTotal
                  : s.label === 'Procurement records'
                    ? counts.procurement
                    : counts.total;
            return (
              <div
                key={s.label}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04]"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  {counts.loading ? (
                    <span className="text-gray-300">—</span>
                  ) : (
                    <CountUp value={numericValue} showDashWhileZero />
                  )}
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-primary-700">
                  {s.label}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
                  {s.helper(counts)}
                </p>
              </div>
            );
          })}
        </div>
      </PageSection>

      {/* ---------- Why this exists ---------- */}
      <PageSection background="white" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={Building2}
          eyebrow="Background"
          title="Why this portal exists"
          helper="The gap BetterGensan was built to fill."
        />
        <div className="max-w-3xl space-y-3 text-sm leading-relaxed text-gray-700">
          <p>
            The official General Santos City website hosts critical
            information — executive orders, procurement notices, public
            announcements — but it's hard to navigate, frequently goes
            down, and presents data in formats designed for internal staff,
            not residents.
          </p>
          <p>
            When public records vanish from the official site, the public
            loses access to its own history. BetterGensan was built to fix
            both problems at once: a clean, citizen-friendly view of GenSan
            data, plus a daily-refreshed cached archive that survives
            website outages and never silently deletes records.
          </p>
          <p>
            We don't replace the official systems. We make them readable,
            durable, and trustworthy.
          </p>
        </div>
      </PageSection>

      {/* ---------- What we do ---------- */}
      <PageSection background="gray" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={Check}
          eyebrow="In scope"
          title="What BetterGensan does"
          helper="Four pillars the portal commits to."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {DOES.map(d => (
            <div
              key={d.title}
              className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <d.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-grow">
                <h3 className="text-sm font-semibold text-gray-900">
                  {d.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
                  {d.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </PageSection>

      {/* ---------- What we don't do ---------- */}
      <PageSection background="white" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={X}
          eyebrow="Out of scope"
          title="What BetterGensan does not do"
          helper="Where the line stays drawn — by design."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {DOES_NOT.map(d => (
            <div
              key={d.title}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04]"
            >
              <h3 className="mb-1.5 text-sm font-semibold text-gray-900">
                <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-error-100 text-error-700 align-text-bottom">
                  <X className="h-3 w-3" />
                </span>
                {d.title}
              </h3>
              <p className="text-xs leading-relaxed text-gray-600">
                {d.body}
              </p>
            </div>
          ))}
        </div>
      </PageSection>

      {/* ---------- Data sources ---------- */}
      <PageSection background="gray" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={Database}
          eyebrow="Where data comes from"
          title="Data sources & freshness"
          helper="Every dataset has a freshness badge that shows when it was last successfully synced. When an upstream source goes down, badges flip to delayed and the cached data keeps rendering — we never wipe records on a failed refresh."
        />

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.04]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Dataset</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Cadence</th>
                <th className="px-4 py-3">Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DATA_SOURCES.map(d => (
                <tr key={d.dataset} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {d.dataset}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {d.source}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {d.cadence}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{d.mode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 max-w-2xl text-xs text-gray-600">
          Some sections of BetterGensan show <strong>cached data</strong>{' '}
          (refreshed daily and stored in our archive), while others{' '}
          <strong>redirect</strong> straight to official LGU systems for
          transactional steps like permits, payments, and applications.
        </p>
      </PageSection>

      {/* ---------- Trust & transparency ---------- */}
      <PageSection background="white" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={ShieldCheck}
          eyebrow="How we operate"
          title="Trust & transparency"
          helper="Five principles that govern how BetterGensan handles your data, the public record, and its own claims."
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {TRUST.map(t => (
            <div
              key={t.title}
              className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <t.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-grow">
                <h3 className="text-sm font-semibold text-gray-900">
                  {t.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
                  {t.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </PageSection>

      {/* ---------- Stack & build ---------- */}
      <PageSection background="gray" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={Palette}
          eyebrow="Built in the open"
          title="The stack"
          helper="BetterGensan is open source. Every line of code is reviewable, auditable, and forkable."
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'Frontend',
              value: 'React 19 · TypeScript · Vite · Tailwind 4',
            },
            {
              label: 'Data layer',
              value: 'Supabase · Postgres · pg_cron · Edge Functions',
            },
            {
              label: 'Scrapers',
              value: 'Regiment API · 10 daily edge function jobs across 12 sources',
            },
            {
              label: 'License',
              value: 'Public domain content · MIT code',
            },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-900/[0.04]"
            >
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary-700">
                {s.label}
              </div>
              <div className="text-xs font-medium text-gray-900">
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </PageSection>

      {/* ---------- Final sector — same as the homepage closer ---------- */}
      <JoinBetterGov />
    </>
  );
};

export default About;
