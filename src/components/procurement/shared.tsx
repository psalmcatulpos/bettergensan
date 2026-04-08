// Shared procurement UI primitives — components only.
//
// IMPORTANT: This file MUST contain only React component exports. Mixing
// component and non-component exports breaks Vite Fast Refresh and causes a
// full page invalidation on every save, which unmounts every active fetch
// in the entire app. The chip helpers (statusChipFor, modeChipFor, ChipTone,
// Chip, CHIP_STYLES) live in `./helpers.ts`.
//
// HARD RULE: presentation only. No data access. No Regiment calls.

import { ExternalLink } from 'lucide-react';
import {
  formatPhp,
  humanDate,
  normalizeTitle,
  type ProcEndpoint,
  type ProcurementRow,
} from '../../lib/gensanCache';
import type { FreshnessTone } from '../ui/FreshnessBadge';
import {
  CHIP_STYLES,
  modeChipFor,
  statusChipFor,
  type Chip,
} from './helpers';

export const ChipPill = ({ label, tone }: Chip) => (
  <span
    className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${CHIP_STYLES[tone]}`}
  >
    {label}
  </span>
);

// ---------- Procurement card ----------
//
// Per spec, the card keeps only: status chip, mode chip, title, amount, date,
// View Original button. Reference number and supplier are intentionally
// omitted to reduce noise.
//
// Cards for archived records (status = 'missing_from_source') get a small
// "No longer available" tag and a slightly muted appearance so they read as
// historical archive entries rather than live opportunities.

export const ProcurementCard = ({ r }: { r: ProcurementRow }) => {
  const href = r.detail_url ?? r.source_url;
  const amount = formatPhp(r.amount);
  const isMissing = r.status === 'missing_from_source';
  // Suppress the live status/mode chips on archived records — they read
  // confusingly next to a "No longer available" tag.
  const status = isMissing ? null : statusChipFor(r);
  const mode = isMissing ? null : modeChipFor(r);

  return (
    <article
      className={`group flex flex-col rounded-xl border bg-white p-3 transition hover:shadow-sm ${
        isMissing
          ? 'border-gray-200 opacity-80 hover:border-gray-300'
          : 'border-gray-200 hover:border-primary-300'
      }`}
    >
      {(status || mode || isMissing) && (
        <div className="mb-1.5 flex flex-wrap items-center gap-1">
          {status && <ChipPill {...status} />}
          {mode && <ChipPill {...mode} />}
          {isMissing && (
            <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
              No longer available
            </span>
          )}
        </div>
      )}

      <h4
        className={`mb-2 text-sm font-semibold leading-snug line-clamp-2 ${
          isMissing ? 'text-gray-700' : 'text-gray-900'
        }`}
        title={r.title}
      >
        {/* UI-only title normalization — DB value preserved in `title` attr */}
        {normalizeTitle(r.title)}
      </h4>

      {(amount || r.date_posted) && (
        <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[11px] text-gray-500">
          {amount && (
            <span className="font-medium text-gray-700">{amount}</span>
          )}
          {r.date_posted && <span>{humanDate(r.date_posted)}</span>}
        </div>
      )}

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-auto inline-flex items-center gap-1 self-start rounded-md px-2 py-1 text-[10px] font-semibold transition ${
          isMissing
            ? 'border border-gray-200 bg-gray-50 text-gray-600 group-hover:bg-gray-100'
            : 'bg-primary-600 text-white hover:bg-primary-700'
        }`}
      >
        View Original <ExternalLink className="h-3 w-3" />
      </a>
    </article>
  );
};

// ---------- Tab pill ----------

interface TabPillProps {
  cfg: ProcEndpoint;
  isActive: boolean;
  count: number;
  tone: FreshnessTone;
  onClick: () => void;
}

export const TabPill = ({
  cfg,
  isActive,
  count,
  tone,
  onClick,
}: TabPillProps) => {
  // Freshness dot stays semantic so operators can spot stale tabs at a glance,
  // but on the active brand-blue tab we lighten it for contrast.
  const dotColor =
    tone === 'healthy'
      ? isActive
        ? 'bg-success-300'
        : 'bg-success-500'
      : tone === 'degraded'
        ? isActive
          ? 'bg-accent-300'
          : 'bg-accent-500'
        : tone === 'offline'
          ? isActive
            ? 'bg-error-300'
            : 'bg-error-500'
          : 'bg-gray-300';
  return (
    <button
      type="button"
      onClick={onClick}
      title={cfg.headline}
      className={`flex shrink-0 snap-start flex-col items-start gap-0.5 rounded-xl border px-4 py-2.5 text-left transition ${
        isActive
          ? 'border-primary-700 bg-primary-600 text-white shadow-sm shadow-primary-900/10'
          : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/40'
      }`}
    >
      <div className="flex w-full items-center gap-2">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
        <span
          className={`text-sm font-semibold ${
            isActive ? 'text-white' : 'text-gray-900'
          }`}
        >
          {cfg.label}
        </span>
        <span
          className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
            isActive
              ? 'bg-white/20 text-white'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {count.toLocaleString()}
        </span>
      </div>
      <span
        className={`line-clamp-1 text-[11px] font-normal ${
          isActive ? 'text-white/80' : 'text-gray-500'
        }`}
      >
        {cfg.subtitle}
      </span>
    </button>
  );
};
