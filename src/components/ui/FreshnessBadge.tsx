// Status pill for cached scraper data.
//
// Tone is derived in src/lib/gensanCache.ts via freshnessFromHealth() so the
// same thresholds (healthy < expected_ttl, degraded < 120 min, offline >= 120
// min) apply consistently. This component is presentation-only and renders
// short, civic-tone copy — no debug strings.

export type FreshnessTone = 'healthy' | 'degraded' | 'offline' | 'unknown';

export interface FreshnessBadgeProps {
  tone: FreshnessTone;
  ageText: string; // e.g. "12 minutes ago" — only shown for the healthy state
}

const TONES: Record<
  FreshnessTone,
  { dot: string; text: string; bg: string }
> = {
  healthy: {
    dot: 'bg-success-500',
    text: 'text-success-700',
    bg: 'bg-success-50 border-success-200',
  },
  degraded: {
    dot: 'bg-accent-500',
    text: 'text-accent-700',
    bg: 'bg-accent-50 border-accent-200',
  },
  offline: {
    dot: 'bg-error-500',
    text: 'text-error-700',
    bg: 'bg-error-50 border-error-200',
  },
  unknown: {
    dot: 'bg-gray-400',
    text: 'text-gray-600',
    bg: 'bg-gray-50 border-gray-200',
  },
};

function badgeText(tone: FreshnessTone, ageText: string): string {
  switch (tone) {
    case 'healthy':
      return `Updated ${ageText}`;
    case 'degraded':
      return 'Delayed · showing cached data';
    case 'offline':
      return 'Source temporarily unavailable';
    case 'unknown':
      return 'Awaiting first sync';
  }
}

const FreshnessBadge = ({ tone, ageText }: FreshnessBadgeProps) => {
  const t = TONES[tone];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${t.bg} ${t.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${t.dot}${tone === 'healthy' ? ' pulse-dot' : ''}`} />
      <span>{badgeText(tone, ageText)}</span>
    </span>
  );
};

export default FreshnessBadge;
