// SourceHealthFooter — compact upstream-source-health badge for the footer
// of every dataset surface (homepage sectors, archive pages, detail pages).
//
// Reads from public.source_upstream_health via gensanCache.readUpstreamHealth.
// The browser NEVER probes upstream URLs directly — health data comes from a
// scheduled backend job (gensan-source-health-check) that runs every 15 min.
//
// Visual taxonomy (subtle, calm — not noisy):
//   live      → green dot, "Source: Live · checked Xm ago"
//   degraded  → amber dot, "Source: Degraded · {reason} · checked Xm ago"
//   down      → red dot, "Source: Down · HTTP X · checked Xm ago"
//   unknown   → gray dot, "Source: Unknown"
//
// When a source is down/degraded, the component also surfaces a calm
// message clarifying that BetterGensan is still showing cached records,
// so users don't think OUR site is broken.

import { useEffect, useState } from 'react';
import { Database } from 'lucide-react';
import {
  humanAge,
  readUpstreamHealth,
  type UpstreamHealthRow,
  type UpstreamStatus,
} from '../../lib/gensanCache';

interface SourceHealthFooterProps {
  /** One or more source keys (e.g. 'gensan-eo'). If multiple, the worst
   *  status across them is shown in the badge. */
  sourceKeys: string[];
  /** Display label for the source attribution line (e.g. 'eo.gensantos.gov.ph'). */
  sourceDomain: string;
  /** Optional extra domain to show in the footer (multi-source attribution). */
  extraDomain?: string;
  extraHref?: string;
  sourceHref?: string;
  /** When true, the page is showing real cached data — controls the
   *  "showing cached records" callout when status is down/degraded. */
  hasCachedData?: boolean;
  /** Whether to render the dotted-underline domain link group at all. */
  showSourceLine?: boolean;
}

const TONE: Record<
  UpstreamStatus,
  { dot: string; text: string; label: string }
> = {
  live: {
    dot: 'bg-success-500',
    text: 'text-success-700',
    label: 'Live',
  },
  degraded: {
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    label: 'Degraded',
  },
  down: {
    dot: 'bg-error-500',
    text: 'text-error-700',
    label: 'Down',
  },
  unknown: {
    dot: 'bg-gray-300',
    text: 'text-gray-500',
    label: 'Unknown',
  },
};

// Pick the worst status across multiple rows so a 2-source block (like
// SPLIS ordinances + resolutions, or the homepage SP family) can summarize.
//
// Order: down > degraded > live > unknown. `live` ranks ABOVE `unknown` so
// that a real live row always overrides the initial seed — otherwise the
// badge gets stuck on Unknown even when the DB clearly returned `live`.
function pickWorst(rows: UpstreamHealthRow[]): UpstreamStatus {
  if (rows.length === 0) return 'unknown';
  const order: Record<UpstreamStatus, number> = {
    down: 4,
    degraded: 3,
    live: 2,
    unknown: 1,
  };
  let worst: UpstreamStatus = rows[0].status;
  for (const r of rows) {
    if (order[r.status] > order[worst]) worst = r.status;
  }
  return worst;
}

const SourceHealthFooter: React.FC<SourceHealthFooterProps> = ({
  sourceKeys,
  sourceDomain,
  extraDomain,
  extraHref,
  sourceHref,
  hasCachedData = true,
  showSourceLine = true,
}) => {
  const [healthMap, setHealthMap] = useState<Record<string, UpstreamHealthRow>>(
    {}
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const result = await readUpstreamHealth(sourceKeys, controller.signal);
      if (controller.signal.aborted) return;
      setHealthMap(result);
      setLoaded(true);
    })();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKeys.join(',')]);

  const rows = sourceKeys.map(k => healthMap[k]).filter(Boolean);
  const status: UpstreamStatus = loaded
    ? rows.length === 0
      ? 'unknown'
      : pickWorst(rows)
    : 'unknown';
  const tone = TONE[status];

  // Most-recently-checked time across the rows (use the OLDEST so the
  // displayed age is honest about the worst case).
  const oldestChecked = rows
    .map(r => (r.checked_at ? new Date(r.checked_at).getTime() : null))
    .filter((t): t is number => t !== null)
    .sort((a, b) => a - b)[0];
  const ageMs = oldestChecked ? Date.now() - oldestChecked : null;
  const ageText =
    ageMs != null ? `checked ${humanAge(ageMs)}` : 'no recent check';

  // For down/degraded, surface the most informative reason.
  const worstRow = rows.find(r => r.status === status);
  const httpStatus = worstRow?.http_status;
  const reason = worstRow?.status_reason ?? null;

  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-3 text-[11px] text-gray-500">
      {/* Source health row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}${status === 'live' ? ' pulse-dot' : ''}`}
            aria-hidden
          />
          <span>
            Source status:{' '}
            <strong className={`font-semibold ${tone.text}`}>{tone.label}</strong>
            {status !== 'unknown' && status !== 'live' && httpStatus != null && (
              <> · HTTP {httpStatus}</>
            )}
            {status !== 'unknown' && (
              <> · {ageText}</>
            )}
          </span>
        </div>
      </div>

      {/* Calm "showing cached" callout when upstream is unhealthy */}
      {(status === 'down' || status === 'degraded') && hasCachedData && (
        <div className="text-[11px] italic text-gray-500">
          Showing cached records.{' '}
          {status === 'down'
            ? 'Upstream source is currently down.'
            : 'Upstream source is degraded'}
          {reason ? ` — ${reason}` : ''}.
        </div>
      )}

      {/* Existing source attribution line */}
      {showSourceLine && (
        <div className="flex flex-wrap items-center justify-end gap-x-3">
          <span className="inline-flex items-center gap-1">
            <Database className="h-3 w-3" />
            Source:{' '}
            {sourceHref ? (
              <a
                href={sourceHref}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-dotted hover:text-gray-700"
              >
                {sourceDomain}
              </a>
            ) : (
              <span>{sourceDomain}</span>
            )}
            {extraDomain && (
              <>
                {' · '}
                {extraHref ? (
                  <a
                    href={extraHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-dotted hover:text-gray-700"
                  >
                    {extraDomain}
                  </a>
                ) : (
                  <span>{extraDomain}</span>
                )}
              </>
            )}{' '}
            · Cached via Regiment
          </span>
        </div>
      )}
    </div>
  );
};

export default SourceHealthFooter;
