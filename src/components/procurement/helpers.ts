// Procurement chip helpers — extracted from shared.tsx so shared.tsx only
// exports React components. Mixing component and non-component exports in
// the same file breaks Vite Fast Refresh, which forces a full-page
// invalidation on every save and unmounts every active fetch in the app.
// Splitting helpers out makes Fast Refresh work cleanly.
//
// HARD RULE: presentation helpers only. No data access. No Regiment calls.

import type { ProcurementRow } from '../../lib/gensanCache';

export type ChipTone =
  | 'open'
  | 'awarded'
  | 'closed'
  | 'cancelled'
  | 'planned'
  | 'reference'
  | 'neutral'
  | 'competitive'
  | 'alternative'
  | 'infra'
  | 'goods'
  | 'services';

// Chip palette aligned to the site brand. Status chips keep semantic meaning
// (open=green, cancelled=red) but every "mode" chip sits inside the brand
// blue family at varying intensities so the procurement UI reads cohesive
// with the rest of BetterGensan instead of spraying random hues.
export const CHIP_STYLES: Record<ChipTone, string> = {
  // ----- status (semantic) -----
  open: 'bg-success-50 text-success-700 border-success-200',
  awarded: 'bg-primary-600 text-white border-primary-700',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-error-50 text-error-700 border-error-200',
  planned: 'bg-primary-50 text-primary-800 border-primary-200',
  reference: 'bg-gray-50 text-gray-600 border-gray-200',
  neutral: 'bg-gray-50 text-gray-600 border-gray-200',
  // ----- mode (brand family) -----
  competitive: 'bg-primary-600 text-white border-primary-700',
  alternative: 'bg-primary-50 text-primary-800 border-primary-200',
  infra: 'bg-primary-100 text-primary-800 border-primary-200',
  goods: 'bg-gray-100 text-gray-700 border-gray-200',
  services: 'bg-gray-100 text-gray-700 border-gray-200',
};

export interface Chip {
  label: string;
  tone: ChipTone;
}

export function statusChipFor(r: ProcurementRow): Chip | null {
  const raw = (r.status ?? '').toLowerCase();
  if (raw.includes('cancel'))
    return { label: 'Cancelled', tone: 'cancelled' };
  if (raw.includes('award')) return { label: 'Awarded', tone: 'awarded' };
  if (raw === 'open' || raw === 'ongoing')
    return { label: 'Open', tone: 'open' };
  if (raw === 'closed') return { label: 'Closed', tone: 'closed' };

  switch (r.endpoint) {
    case 'ongoing-competitive-bids':
    case 'ongoing-alter-bids':
    case 'ongoing-alternative-bids':
      return { label: 'Open', tone: 'open' };
    case 'bidresults':
      return r.supplier
        ? { label: 'Awarded', tone: 'awarded' }
        : { label: 'Closed', tone: 'closed' };
    case 'infra-publications':
      return { label: 'Open', tone: 'open' };
    case 'indicative-items':
      return { label: 'Planned', tone: 'planned' };
    case 'price-catalogue':
      return { label: 'Reference', tone: 'reference' };
    default:
      return null;
  }
}

export function modeChipFor(r: ProcurementRow): Chip | null {
  const m = (r.procurement_mode ?? '').toLowerCase();
  if (m.includes('competitive'))
    return { label: 'Competitive', tone: 'competitive' };
  if (m.includes('alternative'))
    return { label: 'Alternative', tone: 'alternative' };
  if (r.endpoint === 'infra-publications')
    return { label: 'Infra', tone: 'infra' };
  const cat = (r.category ?? '').toLowerCase();
  if (cat.includes('drug') || cat.includes('medic') || cat.includes('supply'))
    return { label: 'Goods', tone: 'goods' };
  if (cat.includes('service') || cat.includes('consult'))
    return { label: 'Services', tone: 'services' };
  if (m) return { label: r.procurement_mode!, tone: 'neutral' };
  return null;
}
