// BangonHomeSector — temporary BetterGenSan homepage sector promoting the
// BangonGenSan emergency response surface during an active relief operation.
//
// EASY REMOVAL (when the operation winds down):
//   1. Delete this file.
//   2. Remove the import + the single <BangonHomeSector /> mount in
//      src/pages/Home.tsx.
//
// Live pulls from prod via the public RLS policies:
//   - bangon_fundraisers     (anon SELECT WHERE status='approved' — RLS filtered)
//   - bangon_social_reports  (anon SELECT — scraped Facebook disaster posts,
//                             same source that powers the /bangon-gensan Live Feed)

import { useEffect, useRef, useState } from 'react';
import { Siren, ArrowRight, MapPin, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Minimal row shape for the home Live Feed — a subset of the BangonSocialRow
// columns used on the full /bangon-gensan command center.
interface SocialRow {
  id: string;
  category: string | null;
  headline: string | null;
  summary: string | null;
  message: string | null;
  message_url: string | null;
  barangay: string | null;
  landmark: string | null;
  posted_at: string;
}

// Disaster-category color mapping, mirrored from BangonGensan.tsx so the home
// feed dots match the command-center feed.
const SOCIAL_COLOR: Record<string, string> = {
  Earthquake: '#a855f7',
  Flood: '#0ea5e9',
  Typhoon: '#0284c7',
  Landslide: '#92400e',
  'Fire Disaster': '#dc2626',
  'Power Outage': '#facc15',
  'Water Shortage': '#06b6d4',
  Evacuation: '#f97316',
  'Relief Operation': '#10b981',
  Rescue: '#ef4444',
  'Missing Person (Disaster)': '#7c3aed',
  Other: '#6b7280',
};
const SOCIAL_COLOR_DEFAULT = '#6b7280';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return 'now';
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export default function BangonHomeSector() {
  const [fundraisers, setFundraisers] = useState<number | null>(null);
  const [feed, setFeed] = useState<SocialRow[] | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const fetchData = async () => {
      try {
        const cutoff = new Date(
          Date.now() - 5 * 24 * 60 * 60 * 1000
        ).toISOString();
        const [fund, soc] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any)
            .from('bangon_fundraisers')
            .select('*', { count: 'exact', head: true }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any)
            .from('bangon_social_reports')
            .select(
              'id, category, headline, summary, message, message_url, barangay, landmark, posted_at'
            )
            .gte('posted_at', cutoff)
            .order('posted_at', { ascending: false })
            .limit(12),
        ]);
        if (cancelledRef.current) return;
        setFundraisers(fund.count ?? 0);
        setFeed((soc.data as SocialRow[]) ?? []);
      } catch {
        // Failed-to-fetch (e.g. table not deployed) → leave state null so the
        // UI renders loading/empty placeholders instead of fake data.
      }
    };

    void fetchData();
    const id = setInterval(() => void fetchData(), 60_000);
    return () => {
      cancelledRef.current = true;
      clearInterval(id);
    };
  }, []);

  return (
    <section
      aria-label="BangonGenSan active relief operation"
      className="relative overflow-hidden border-b border-red-900/50 bg-gradient-to-br from-[#1a0606] via-[#2a0a0a] to-[#0a0202]"
    >
      {/* faint dotted noise pattern */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #fff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative mx-auto max-w-[1100px] px-4 py-6 sm:py-8">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-red-300">
            Active Relief Operation
          </span>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
          #BangonGensan{' '}
          <span className="text-red-300">— June 8 Earthquake Response</span>
        </h2>

        {/* Body: Live Feed + Active Fundraisers stat */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Live Feed (scraped social-media disaster reports) */}
          <div className="lg:col-span-2 rounded-lg border border-red-900/50 bg-black/30 overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-red-900/40 bg-red-950/40">
              <Activity size={12} className="text-red-300" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-200">
                Live Feed
              </span>
              <span className="ml-auto relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-400" />
              </span>
            </div>
            <div className="max-h-[260px] overflow-y-auto divide-y divide-white/5">
              {feed === null && (
                <div className="px-3 py-6 text-center text-[10px] text-red-300/60">
                  Loading reports…
                </div>
              )}
              {feed !== null && feed.length === 0 && (
                <div className="px-3 py-6 text-center text-[10px] text-red-300/60">
                  No social-media disaster reports in the last 5 days.
                </div>
              )}
              {feed?.map(s => {
                const cat = s.category ?? 'Disaster';
                const loc = s.barangay
                  ? s.landmark
                    ? `${s.barangay} · ${s.landmark}`
                    : s.barangay
                  : (s.landmark ?? 'GenSan');
                const subtitle =
                  s.headline ?? s.summary ?? (s.message ?? '').slice(0, 140);
                // Whitelist URL schemes — defense in depth against an upstream
                // that lets a non-http(s) URL leak into bangon_social_reports.
                const url =
                  s.message_url && /^https?:\/\//i.test(s.message_url)
                    ? s.message_url
                    : undefined;
                const RowTag = url ? 'a' : 'div';
                const rowProps = url
                  ? {
                      href: url,
                      target: '_blank' as const,
                      rel: 'noopener noreferrer',
                    }
                  : {};
                return (
                  <RowTag
                    key={s.id}
                    {...rowProps}
                    className={`block px-3 py-2 hover:bg-white/5 transition-colors ${url ? 'cursor-pointer' : ''}`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            SOCIAL_COLOR[cat] ?? SOCIAL_COLOR_DEFAULT,
                        }}
                      />
                      <span className="text-[11px] font-bold text-white">
                        {cat}
                      </span>
                      <span className="text-[8px] px-1 py-0 rounded font-medium bg-sky-500/15 text-sky-300">
                        SOCIAL MEDIA
                      </span>
                      <span className="text-[9px] text-red-300/50 ml-auto font-mono">
                        {relativeTime(s.posted_at)}
                      </span>
                    </div>
                    <p className="text-[10px] text-red-100/70 leading-snug line-clamp-1 pl-3">
                      {subtitle}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 pl-3 text-[9px] text-red-300/50">
                      <span className="flex items-center gap-0.5">
                        <MapPin size={8} />
                        {loc}
                      </span>
                      {url && <span className="text-sky-300 ml-auto">↗</span>}
                    </div>
                  </RowTag>
                );
              })}
            </div>
          </div>

          {/* Active Fundraisers stat */}
          <div className="rounded-lg border border-amber-500/40 bg-amber-700/25 px-4 py-4 flex flex-col justify-center">
            <div className="text-4xl font-bold text-white tabular-nums leading-none">
              {fundraisers === null ? '—' : fundraisers.toLocaleString('en-PH')}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-200 mt-2">
              Active Fundraisers
            </div>
            <p className="mt-2 text-[10px] text-amber-100/60 leading-relaxed">
              Community-run relief fundraisers, verified before they appear.
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-5 flex flex-col sm:flex-row gap-2">
          <a
            href="/bangon-gensan/form"
            className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-sm uppercase tracking-widest transition-colors"
          >
            <Siren size={15} />
            Submit a Request or Report
            <ArrowRight size={14} />
          </a>
          <a
            href="/bangon-gensan"
            className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-lg bg-transparent hover:bg-white/5 border border-red-500/60 hover:border-red-400 text-red-200 hover:text-white font-bold text-sm uppercase tracking-widest transition-colors"
          >
            <MapPin size={15} />
            Open Command Center
          </a>
        </div>

        {/* Disclaimer */}
        <p className="mt-4 text-[11px] text-red-300/70 leading-relaxed max-w-2xl">
          #BangonGensan is a temporary community-powered relief coordination
          platform. All submissions are public.
        </p>
      </div>
    </section>
  );
}
