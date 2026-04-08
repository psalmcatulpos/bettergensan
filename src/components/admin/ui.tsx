import type { ReactNode } from 'react';

export const PageHeader = ({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) => (
  <div className="mb-6 flex items-start justify-between gap-4">
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
    {right && <div className="shrink-0">{right}</div>}
  </div>
);

export const Kpi = ({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  tone?: 'neutral' | 'good' | 'warn' | 'bad';
}) => {
  const toneCls =
    tone === 'good'
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : tone === 'warn'
        ? 'text-amber-700 bg-amber-50 border-amber-200'
        : tone === 'bad'
          ? 'text-red-700 bg-red-50 border-red-200'
          : 'text-gray-800 bg-white border-gray-200';
  return (
    <div className={`rounded-lg border px-4 py-3 ${toneCls}`}>
      <div className="text-[11px] uppercase tracking-wide opacity-70">
        {label}
      </div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
};

export const Card = ({
  title,
  right,
  children,
}: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
}) => (
  <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
    {(title || right) && (
      <header className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        {title && (
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        )}
        {right}
      </header>
    )}
    {children}
  </section>
);

export const StatusBadge = ({ status }: { status: string | null }) => {
  const map: Record<string, string> = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    running: 'bg-sky-50 text-sky-700 border-sky-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    partial: 'bg-amber-50 text-amber-700 border-amber-200',
    fresh: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    aging: 'bg-amber-50 text-amber-700 border-amber-200',
    stale: 'bg-red-50 text-red-700 border-red-200',
    never_run: 'bg-gray-50 text-gray-600 border-gray-200',
    paused: 'bg-gray-100 text-gray-700 border-gray-300',
    critical: 'bg-red-600 text-white border-red-600',
    high: 'bg-red-50 text-red-700 border-red-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-sky-50 text-sky-700 border-sky-200',
  };
  const cls = status ? (map[status] ?? 'bg-gray-100 text-gray-700 border-gray-300') : 'bg-gray-50 text-gray-400 border-gray-200';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-medium uppercase tracking-wide ${cls}`}
    >
      {status ?? '—'}
    </span>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return 'in the future';
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export const EmptyState = ({ message }: { message: string }) => (
  <div className="px-6 py-10 text-center text-sm text-gray-500">{message}</div>
);

export const LoadingState = () => (
  <div className="px-6 py-10 text-center text-sm text-gray-400">Loading…</div>
);
