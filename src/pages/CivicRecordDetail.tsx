// Unified Civic Record detail page — handles BOTH:
//   - Executive Orders (/government/executive-orders/:id)
//   - SP records      (/government/sp-records/:id)
//
// One layout, one breadcrumb pattern, one freshness/footer treatment. The
// component branches on `recordKind` for fetch + body rendering. The EO view
// is preserved verbatim (no behavior change for existing bookmarks).

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Archive,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Download,
  ExternalLink,
  FileText,
  Hash,
  Tag,
} from 'lucide-react';
import SourceHealthFooter from '../components/ui/SourceHealthFooter';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import FreshnessBadge from '../components/ui/FreshnessBadge';
import {
  EO_SOURCE_SLUG,
  SPLIS_ORDINANCES_SLUG,
  SPLIS_RESOLUTIONS_SLUG,
  aggregateFreshness,
  freshnessFromHealth,
  humanDate,
  normalizeTitle,
  readExecutiveOrderById,
  readSourceHealth,
  readSplisById,
  type ExecutiveOrderRow,
  type FreshnessInfo,
  type SplisRow,
} from '../lib/gensanCache';

export type CivicRecordKind = 'eo' | 'sp';

interface Props {
  recordKind: CivicRecordKind;
}

const CivicRecordDetail: React.FC<Props> = ({ recordKind }) => {
  const { id } = useParams<{ id: string }>();
  const [eoRow, setEoRow] = useState<ExecutiveOrderRow | null>(null);
  const [spRow, setSpRow] = useState<SplisRow | null>(null);
  const [freshness, setFreshness] = useState<FreshnessInfo>({
    tone: 'unknown',
    ageText: 'never',
    ageMs: null,
    lastSuccessAt: null,
    lastSuccessLabel: 'Loading…',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setLoading(true);
    setEoRow(null);
    setSpRow(null);
    (async () => {
      if (recordKind === 'eo') {
        const [row, healthMap] = await Promise.all([
          readExecutiveOrderById(id, controller.signal),
          readSourceHealth([EO_SOURCE_SLUG], controller.signal),
        ]);
        if (controller.signal.aborted) return;
        setEoRow(row);
        setFreshness(freshnessFromHealth(healthMap[EO_SOURCE_SLUG]));
      } else {
        const [row, healthMap] = await Promise.all([
          readSplisById(id, controller.signal),
          readSourceHealth(
            [SPLIS_ORDINANCES_SLUG, SPLIS_RESOLUTIONS_SLUG],
            controller.signal
          ),
        ]);
        if (controller.signal.aborted) return;
        setSpRow(row);
        if (row?.record_type === 'Ordinance') {
          setFreshness(freshnessFromHealth(healthMap[SPLIS_ORDINANCES_SLUG]));
        } else if (row?.record_type === 'Resolution') {
          setFreshness(freshnessFromHealth(healthMap[SPLIS_RESOLUTIONS_SLUG]));
        } else {
          setFreshness(
            aggregateFreshness([
              freshnessFromHealth(healthMap[SPLIS_ORDINANCES_SLUG]),
              freshnessFromHealth(healthMap[SPLIS_RESOLUTIONS_SLUG]),
            ])
          );
        }
      }
      if (!controller.signal.aborted) setLoading(false);
    })();
    return () => controller.abort();
  }, [id, recordKind]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-12">
        <div className="text-center text-sm text-gray-400">
          Loading civic record…
        </div>
      </div>
    );
  }

  if (recordKind === 'eo' && !eoRow) {
    return <NotFound kind="eo" />;
  }
  if (recordKind === 'sp' && !spRow) {
    return <NotFound kind="sp" />;
  }

  if (recordKind === 'eo' && eoRow) {
    return <EoView order={eoRow} freshness={freshness} />;
  }
  if (recordKind === 'sp' && spRow) {
    return <SpView record={spRow} freshness={freshness} />;
  }
  return null;
};

// =============================================================================
// Empty / not found
// =============================================================================

const NotFound: React.FC<{ kind: CivicRecordKind }> = ({ kind }) => {
  const label = kind === 'eo' ? 'Executive Order' : 'SP Record';
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-12">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Civic Decisions', href: '/#civic-decisions' },
          { label },
        ]}
        className="mb-6"
      />
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
        <FileText className="mx-auto mb-2 h-8 w-8 text-gray-300" />
        <p className="text-sm text-gray-500">
          {label} not found in the cache.
        </p>
        <Link
          to="/#civic-decisions"
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Civic Decisions
        </Link>
      </div>
    </div>
  );
};

// =============================================================================
// Executive Order view (preserved verbatim from the prior ExecutiveOrder page)
// =============================================================================

const EoView: React.FC<{
  order: ExecutiveOrderRow;
  freshness: FreshnessInfo;
}> = ({ order, freshness }) => {
  const embedUrl = order.drive_file_id
    ? `https://drive.google.com/file/d/${order.drive_file_id}/preview`
    : null;
  const isMissing = order.status === 'missing_from_source';

  return (
    <>
      <SEO
        title={`EO ${order.order_number ?? ''} — GenSan Executive Orders`}
        description={order.title.slice(0, 160)}
        keywords="gensan executive orders, mayoral order, general santos city, civic policy"
      />

      <div className="bg-gray-50 py-8">
        <div className="mx-auto max-w-[1100px] px-4">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Civic Decisions', href: '/#civic-decisions' },
              {
                label: order.order_number
                  ? `EO ${order.order_number}`
                  : 'Executive Order',
              },
            ]}
            className="mb-4"
          />

          <div className="mb-3 flex flex-wrap items-center gap-2">
            {order.order_number && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
                <Hash className="h-3 w-3" />
                EO {order.order_number}
              </span>
            )}
            {order.date_issued && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                <Calendar className="h-3 w-3 text-gray-400" />
                {humanDate(order.date_issued)}
              </span>
            )}
            {isMissing && (
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                <Archive className="h-3 w-3" />
                Archived
              </span>
            )}
            <span className="ml-auto">
              <FreshnessBadge
                tone={freshness.tone}
                ageText={freshness.ageText}
              />
            </span>
          </div>

          <h1 className="text-xl font-bold leading-snug text-gray-900 sm:text-2xl">
            {normalizeTitle(order.title)}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-4 py-6">
        {isMissing && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-gray-300 bg-gray-50 p-4 text-sm text-gray-700">
            <Archive className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
            <div>
              <strong className="font-semibold">
                No longer available on the official website.
              </strong>{' '}
              Showing cached copy from the BetterGensan archive.
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          {order.download_url && (
            <a
              href={order.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </a>
          )}
          <a
            href={order.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-primary-300 hover:bg-primary-50"
          >
            View on official site
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {embedUrl ? (
          <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <iframe
              src={embedUrl}
              title={`EO ${order.order_number ?? ''} preview`}
              className="h-[70vh] w-full"
              allow="autoplay"
            />
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-xs text-gray-500">
            No PDF preview available for this order. Use the link above to view
            it on the official site.
          </div>
        )}

        <SourceHealthFooter
          sourceKeys={['gensan-eo']}
          sourceDomain="eo.gensantos.gov.ph"
          sourceHref="https://eo.gensantos.gov.ph/"
          hasCachedData={true}
        />
      </div>
    </>
  );
};

// =============================================================================
// SPLIS view
// =============================================================================

const SpView: React.FC<{
  record: SplisRow;
  freshness: FreshnessInfo;
}> = ({ record, freshness }) => {
  const isMissing = record.status === 'missing_from_source';
  const isOrdinance = record.record_type === 'Ordinance';
  const numberLabel = `${isOrdinance ? 'Ord' : 'Res'} ${record.record_no}`;
  const titleNormalized = normalizeTitle(record.title);

  return (
    <>
      <SEO
        title={`${numberLabel} (${record.record_year ?? ''}) — GenSan Sangguniang Panglungsod`}
        description={record.title.slice(0, 160)}
        keywords="gensan sangguniang panglungsod, ordinance, resolution, general santos city, sp"
      />

      <div className="bg-gray-50 py-8">
        <div className="mx-auto max-w-[1100px] px-4">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Civic Decisions', href: '/#civic-decisions' },
              { label: 'Sangguniang Panglungsod' },
              { label: numberLabel },
            ]}
            className="mb-4"
          />

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isOrdinance
                  ? 'border border-primary-200 bg-primary-50 text-primary-700'
                  : 'border border-primary-200 bg-primary-50 text-primary-700'
              }`}
            >
              <Hash className="h-3 w-3" />
              {record.record_type}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-gray-700">
              <FileText className="h-3 w-3 text-gray-400" />
              SP No. {record.record_no}
            </span>
            {record.record_year && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                <Calendar className="h-3 w-3 text-gray-400" />
                {record.record_year}
              </span>
            )}
            {isMissing ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                <Archive className="h-3 w-3" />
                Archived
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-success-200 bg-success-50 px-2.5 py-0.5 text-xs font-semibold text-success-700">
                <CheckCircle className="h-3 w-3" />
                Enacted
              </span>
            )}
            <span className="ml-auto">
              <FreshnessBadge
                tone={freshness.tone}
                ageText={freshness.ageText}
              />
            </span>
          </div>

          <h1 className="text-xl font-bold leading-snug text-gray-900 sm:text-2xl">
            {titleNormalized}
          </h1>

          {(record.category || record.internal_id) && (
            <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              {record.category && (
                <span className="inline-flex items-center gap-1">
                  <Tag className="h-3 w-3 text-gray-400" />
                  {record.category}
                </span>
              )}
              {record.internal_id && (
                <span className="inline-flex items-center gap-1 text-gray-400">
                  Ref: {record.internal_id}
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-4 py-6">
        {isMissing && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-gray-300 bg-gray-50 p-4 text-sm text-gray-700">
            <Archive className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
            <div>
              <strong className="font-semibold">
                No longer available on the official website.
              </strong>{' '}
              Showing cached copy from the BetterGensan archive.
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          {record.pdf_url && (
            <a
              href={record.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </a>
          )}
          <a
            href="https://splis.gensantos.gov.ph/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-primary-300 hover:bg-primary-50"
          >
            View on official site
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {record.pdf_url ? (
          <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <iframe
              src={record.pdf_url}
              title={`${numberLabel} preview`}
              className="h-[70vh] w-full"
            />
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-xs text-gray-500">
            No PDF preview available for this record. Use the link above to view
            it on the official site.
          </div>
        )}

        <SourceHealthFooter
          sourceKeys={['gensan-splis']}
          sourceDomain="splis.gensantos.gov.ph"
          sourceHref="https://splis.gensantos.gov.ph/"
          hasCachedData={true}
        />
      </div>
    </>
  );
};

export default CivicRecordDetail;
