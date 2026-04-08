// CivicDecisions — replaces the legacy Safety & Alerts sector. Surfaces two
// real, cached, source-linked civic record streams behind a single freshness
// badge:
//
//   1. Executive Orders   (gensan-executive-orders, eo.gensantos.gov.ph)
//   2. Sangguniang Panglungsod (gensan-splis-ordinances/-resolutions,
//      splis.gensantos.gov.ph)
//
// Both blocks read from Supabase cache tables only. The frontend never calls
// Regiment. Edge functions + cron are the only writers.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  FileText,
  Landmark,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import PageSection from '../ui/PageSection';
import SectionHeading from '../ui/SectionHeading';
import FreshnessBadge from '../ui/FreshnessBadge';
import SourceHealthFooter from '../ui/SourceHealthFooter';
import {
  EO_SOURCE_SLUG,
  SPLIS_ORDINANCES_SLUG,
  SPLIS_RESOLUTIONS_SLUG,
  SPLIS_SLUGS,
  aggregateFreshness,
  freshnessFromHealth,
  humanDate,
  normalizeTitle,
  readExecutiveOrderCount,
  readExecutiveOrders,
  readSourceHealth,
  readSplisCounts,
  readSplisLatest,
  shortenEoTitle,
  type ExecutiveOrderRow,
  type FreshnessInfo,
  type SplisRecordType,
  type SplisRow,
} from '../../lib/gensanCache';

// =============================================================================
// Executive Orders block
// =============================================================================

const ExecutiveOrdersBlock: React.FC<{
  rows: ExecutiveOrderRow[];
  loading: boolean;
  freshness: FreshnessInfo;
  totalCount: number;
}> = ({ rows, loading, freshness, totalCount }) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: 1 | -1) => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">
                Executive Orders
              </h3>
              <FreshnessBadge
                tone={freshness.tone}
                ageText={freshness.ageText}
              />
            </div>
            <p className="text-xs text-gray-500">
              <strong className="text-gray-700">
                {totalCount > 0 ? totalCount.toLocaleString() : '—'}
              </strong>{' '}
              cached records · 1 dataset
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden gap-1 sm:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Scroll left"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-primary-300 hover:bg-primary-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Scroll right"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-primary-300 hover:bg-primary-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <Link
            to="/eo"
            className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-primary-700"
          >
            View all executive orders →
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-gray-400">
          Loading cached records…
        </div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-400">
          No cached executive orders yet.
        </div>
      ) : (
        <div
          ref={carouselRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {rows.map(o => (
            <ExecutiveOrderCard key={o.id} o={o} />
          ))}
        </div>
      )}

      <SourceHealthFooter
        sourceKeys={['gensan-eo']}
        sourceDomain="eo.gensantos.gov.ph"
        sourceHref="https://eo.gensantos.gov.ph/"
        hasCachedData={rows.length > 0}
      />
    </div>
  );
};

const ExecutiveOrderCard: React.FC<{ o: ExecutiveOrderRow }> = ({ o }) => {
  const short = shortenEoTitle(normalizeTitle(o.title), 12);
  const isMissing = o.status === 'missing_from_source';
  return (
    <article
      className={`flex w-[260px] shrink-0 snap-start flex-col rounded-xl border bg-white px-3 pb-3 pt-2.5 transition hover:shadow-sm ${
        isMissing
          ? 'border-gray-200 opacity-80 hover:border-gray-300'
          : 'border-gray-200 hover:border-primary-300'
      }`}
    >
      <div className="mb-1 flex flex-wrap items-center gap-1">
        {o.order_number && (
          <span className="rounded-full border border-primary-100 bg-primary-50/60 px-1.5 py-0 text-[9px] font-medium text-primary-600">
            EO {o.order_number}
          </span>
        )}
        {o.date_issued && (
          <span className="text-[9px] text-gray-400">
            {humanDate(o.date_issued)}
          </span>
        )}
        {isMissing && (
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-1.5 py-0 text-[9px] font-medium text-gray-500">
            No longer available
          </span>
        )}
      </div>
      <h4
        className={`mb-2 line-clamp-2 text-[13px] font-medium leading-tight tracking-normal ${
          isMissing ? 'text-gray-600' : 'text-gray-800'
        }`}
        title={o.title}
      >
        {short}
      </h4>
      <div className="mt-auto flex items-center gap-1.5">
        <Link
          to={`/government/executive-orders/${o.id}`}
          className={`inline-flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-white transition ${
            isMissing
              ? 'bg-gray-500 hover:bg-gray-600'
              : 'bg-primary-600 hover:bg-primary-700'
          }`}
        >
          View Details
        </Link>
        <a
          href={o.download_url ?? o.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-normal text-gray-500 transition hover:border-primary-300 hover:bg-primary-50"
        >
          Original
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </article>
  );
};

// =============================================================================
// Sangguniang Panglungsod block
// =============================================================================

const SangguniangBlock: React.FC<{
  rows: SplisRow[];
  loading: boolean;
  freshness: FreshnessInfo;
  totalCount: number;
  perType: Record<SplisRecordType, number>;
}> = ({ rows, loading, freshness, totalCount, perType }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
            <Landmark className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">
                Sangguniang Panglungsod
              </h3>
              <FreshnessBadge
                tone={freshness.tone}
                ageText={freshness.ageText}
              />
            </div>
            <p className="text-xs text-gray-500">
              <strong className="text-gray-700">
                {totalCount > 0 ? totalCount.toLocaleString() : '—'}
              </strong>{' '}
              cached records ·{' '}
              <strong className="text-gray-700">
                {perType.Ordinance.toLocaleString()}
              </strong>{' '}
              ordinances ·{' '}
              <strong className="text-gray-700">
                {perType.Resolution.toLocaleString()}
              </strong>{' '}
              resolutions
            </p>
          </div>
        </div>
        <Link
          to="/splis"
          className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-primary-700"
        >
          View all SP records →
        </Link>
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-gray-400">
          Loading cached records…
        </div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-400">
          No cached SP records yet.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {rows.map(r => (
            <SplisRowCard key={r.id} r={r} />
          ))}
        </ul>
      )}

      <SourceHealthFooter
        sourceKeys={['gensan-splis']}
        sourceDomain="splis.gensantos.gov.ph"
        sourceHref="https://splis.gensantos.gov.ph/"
        hasCachedData={rows.length > 0}
      />
    </div>
  );
};

const SplisRowCard: React.FC<{ r: SplisRow }> = ({ r }) => {
  const isMissing = r.status === 'missing_from_source';
  const isOrdinance = r.record_type === 'Ordinance';
  const numberLabel = `${isOrdinance ? 'Ord' : 'Res'} ${r.record_no}`;
  const titleNormalized = normalizeTitle(r.title);

  return (
    <li className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:gap-4">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              isOrdinance
                ? 'border border-primary-200 bg-primary-50 text-primary-700'
                : 'border border-primary-200 bg-primary-50 text-primary-700'
            }`}
          >
            {r.record_type}
          </span>
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-700">
            {numberLabel}
          </span>
          {r.record_year && (
            <span className="text-[10px] text-gray-500">{r.record_year}</span>
          )}
          {isMissing ? (
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500">
              No longer available
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 rounded-full border border-success-200 bg-success-50 px-2 py-0.5 text-[10px] font-semibold text-success-700">
              <CheckCircle className="h-2.5 w-2.5" />
              Enacted
            </span>
          )}
        </div>
        <h4
          className={`mb-1 line-clamp-2 text-sm font-medium leading-snug ${
            isMissing ? 'text-gray-500' : 'text-gray-900'
          }`}
          title={r.title}
        >
          {titleNormalized}
        </h4>
        {r.category && (
          <p className="text-[11px] text-gray-500">
            <span className="font-medium text-gray-600">{r.category}</span>
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Link
          to={`/government/sp-records/${r.id}`}
          className={`inline-flex items-center justify-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium text-white transition ${
            isMissing
              ? 'bg-gray-500 hover:bg-gray-600'
              : 'bg-primary-600 hover:bg-primary-700'
          }`}
        >
          View Details
        </Link>
        {r.pdf_url && (
          <a
            href={r.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-normal text-gray-500 transition hover:border-primary-300 hover:bg-primary-50"
          >
            PDF
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </li>
  );
};

// =============================================================================
// Section
// =============================================================================

const UNKNOWN_FRESHNESS: FreshnessInfo = {
  tone: 'unknown',
  ageText: 'never',
  ageMs: null,
  lastSuccessAt: null,
  lastSuccessLabel: 'Loading…',
};

const CivicDecisions: React.FC = () => {
  const [eoRows, setEoRows] = useState<ExecutiveOrderRow[]>([]);
  const [splisRows, setSplisRows] = useState<SplisRow[]>([]);
  const [eoLoading, setEoLoading] = useState(true);
  const [splisLoading, setSplisLoading] = useState(true);
  const [eoCount, setEoCount] = useState(0);
  const [splisCount, setSplisCount] = useState(0);
  const [splisPerType, setSplisPerType] = useState<
    Record<SplisRecordType, number>
  >({ Ordinance: 0, Resolution: 0 });
  const [eoFreshness, setEoFreshness] =
    useState<FreshnessInfo>(UNKNOWN_FRESHNESS);
  // SPLIS surfaces ONE freshness badge aggregated across both ordinances +
  // resolutions sources (the user sees "Sangguniang Panglungsod" as one
  // dataset, even though it's modeled as two sources for granular admin/cron).
  const [splisFreshness, setSplisFreshness] =
    useState<FreshnessInfo>(UNKNOWN_FRESHNESS);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const [eo, splis, healthMap, eoTotal, splisTotals] = await Promise.all([
        readExecutiveOrders(5, controller.signal),
        readSplisLatest(5, controller.signal),
        readSourceHealth([EO_SOURCE_SLUG, ...SPLIS_SLUGS], controller.signal),
        readExecutiveOrderCount(controller.signal),
        readSplisCounts(controller.signal),
      ]);
      if (controller.signal.aborted) return;
      setEoRows(eo);
      setSplisRows(splis);
      setEoLoading(false);
      setSplisLoading(false);
      setEoCount(eoTotal);
      setSplisCount(splisTotals.total);
      setSplisPerType(splisTotals.perType);
      setEoFreshness(freshnessFromHealth(healthMap[EO_SOURCE_SLUG]));
      setSplisFreshness(
        aggregateFreshness([
          freshnessFromHealth(healthMap[SPLIS_ORDINANCES_SLUG]),
          freshnessFromHealth(healthMap[SPLIS_RESOLUTIONS_SLUG]),
        ])
      );
    })();
    return () => controller.abort();
  }, []);

  const sectionTotal = eoCount + splisCount;

  return (
    <PageSection id="civic-decisions" background="tinted" tier="primary">
      <SectionHeading
        tier="primary"
        icon={Scale}
        eyebrow="Signature · Civic Records"
        title="Civic Decisions"
        helper={
          sectionTotal > 0
            ? `${sectionTotal.toLocaleString()} cached records · 2 datasets · executive orders, ordinances, and official actions affecting General Santos City.`
            : 'Executive orders, ordinances, and official actions affecting General Santos City.'
        }
        iconClassName="!bg-primary-600 !text-white !ring-primary-700 shadow-md shadow-primary-900/20 h-12 w-12"
        titleClassName="!text-gray-950"
      />

      <ExecutiveOrdersBlock
        rows={eoRows}
        loading={eoLoading}
        freshness={eoFreshness}
        totalCount={eoCount}
      />
      <SangguniangBlock
        rows={splisRows}
        loading={splisLoading}
        freshness={splisFreshness}
        totalCount={splisCount}
        perType={splisPerType}
      />
    </PageSection>
  );
};

export default CivicDecisions;
