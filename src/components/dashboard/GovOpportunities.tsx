import PageSection from '../ui/PageSection';
import SectionHeading from '../ui/SectionHeading';
import {
  Building2,
  Gavel,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import SourceHealthFooter from '../ui/SourceHealthFooter';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import FreshnessBadge from '../ui/FreshnessBadge';
import { ProcurementCard, TabPill } from '../procurement/shared';
import useReveal from '../../hooks/useReveal';
import {
  PROCUREMENT_ENDPOINTS,
  freshnessFromHealth,
  readProcurement,
  readProcurementCounts,
  readSourceHealth,
  type FreshnessInfo,
  type ProcurementRow,
  type SourceHealthRow,
} from '../../lib/gensanCache';

// ---------- Procurement subsection ----------

const ProcurementSubsection = () => {
  const [active, setActive] = useState<string>(
    PROCUREMENT_ENDPOINTS[0].endpoint
  );
  const [rows, setRows] = useState<ProcurementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthMap, setHealthMap] = useState<Record<string, SourceHealthRow>>(
    {}
  );
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = useState<number>(0);
  const tabsRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (dir: 1 | -1) => {
    const el = tabsRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const slugs = useMemo(() => PROCUREMENT_ENDPOINTS.map(e => e.slug), []);

  // Load source health + per-endpoint counts once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [healthRes, countsRes] = await Promise.all([
        readSourceHealth(slugs),
        readProcurementCounts(),
      ]);
      if (cancelled) return;
      setHealthMap(healthRes);
      setCounts(countsRes.perEndpoint);
      setTotalCount(countsRes.total);
    })();
    return () => {
      cancelled = true;
    };
  }, [slugs]);

  // Reload rows when active tab changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const r = await readProcurement(active, 9);
      if (cancelled) return;
      setRows(r);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [active]);

  // Section-level "headline" freshness: take the worst tone across all sources
  // so the top badge reflects "is the procurement pipeline as a whole healthy".
  //
  // Important: 'unknown' (= row not yet present in source_health) sits BETWEEN
  // healthy and degraded in the order map. If we naively seeded the loop with
  // an unknown sentinel, a healthy result (order 0) could never replace it
  // (0 > 1 is false) and the headline would be stuck on "Awaiting first sync"
  // even after every endpoint successfully synced. Fix: ignore unknown rows
  // when at least one endpoint has real sync data.
  const headlineFreshness: FreshnessInfo = useMemo(() => {
    const order: Record<string, number> = {
      healthy: 0,
      unknown: 1,
      degraded: 2,
      offline: 3,
    };
    const all = PROCUREMENT_ENDPOINTS.map(e =>
      freshnessFromHealth(healthMap[e.slug])
    );
    const known = all.filter(f => f.lastSuccessAt !== null);
    if (known.length === 0) return freshnessFromHealth(undefined);
    return known.reduce((worst, f) =>
      (order[f.tone] ?? 0) > (order[worst.tone] ?? 0) ? f : worst
    );
  }, [healthMap]);

  return (
    <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04] sm:p-6">
      {/* ---------- Section header (tightened) ---------- */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
            <Gavel className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">
                GenSan Procurement
              </h3>
              <FreshnessBadge
                tone={headlineFreshness.tone}
                ageText={headlineFreshness.ageText}
              />
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              <strong className="text-gray-700">
                {totalCount.toLocaleString()}
              </strong>{' '}
              records · {PROCUREMENT_ENDPOINTS.length} datasets · public bidding
              and awards from official city systems
            </p>
          </div>
        </div>
        <Link
          to="/procurement"
          className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-primary-700"
        >
          View all procurement →
        </Link>
      </div>

      {/* ---------- Tabs (no scrollbar, < > arrow navigation) ---------- */}
      <div className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => scrollTabs(-1)}
          aria-label="Scroll datasets left"
          className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-primary-300 hover:bg-primary-50 sm:flex"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div
          ref={tabsRef}
          role="tablist"
          aria-label="Procurement datasets"
          className="flex flex-1 gap-2 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {PROCUREMENT_ENDPOINTS.map(e => {
            const tabHealth = healthMap[e.slug];
            const tabTone = freshnessFromHealth(tabHealth).tone;
            return (
              <TabPill
                key={e.endpoint}
                cfg={e}
                isActive={e.endpoint === active}
                count={counts[e.endpoint] ?? 0}
                tone={tabTone}
                onClick={() => setActive(e.endpoint)}
              />
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => scrollTabs(1)}
          aria-label="Scroll datasets right"
          className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-primary-300 hover:bg-primary-50 sm:flex"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* ---------- Active tab body ---------- */}
      {loading ? (
        <div className="py-10 text-center text-sm text-gray-400">
          Loading cached records…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center text-sm text-gray-500">
          No records found for this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(r => (
            <ProcurementCard key={r.id} r={r} />
          ))}
        </div>
      )}

      <SourceHealthFooter
        sourceKeys={['gensan-procurement']}
        sourceDomain="procurement.gensantos.gov.ph"
        sourceHref="https://procurement.gensantos.gov.ph/"
        hasCachedData={rows.length > 0}
      />
    </div>
  );
};

const GovOpportunities = () => {
  const headingRef = useReveal();
  const contentRef = useReveal();

  return (
    <PageSection background="gray" tier="primary">
        <div ref={headingRef} className="reveal">
        <SectionHeading
          tier="primary"
          icon={Building2}
          eyebrow="Public Sector"
          title="Government Opportunities"
          helper="Live procurement bids, scholarships, trainings, and cash aid programs from official LGU sources."
        />
        </div>

        <div ref={contentRef} className="reveal" style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
        <ProcurementSubsection />
        </div>
    </PageSection>
  );
};

export default GovOpportunities;
