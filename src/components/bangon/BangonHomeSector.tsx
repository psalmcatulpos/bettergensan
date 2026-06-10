// BangonHomeSector — temporary BetterGenSan homepage sector promoting the
// BangonGenSan emergency response surface during an active relief operation.
//
// EASY REMOVAL (when the operation winds down):
//   1. Delete this file.
//   2. Remove the import + the single <BangonHomeSector /> mount in
//      src/pages/Home.tsx.
//
// All four counts are live pulls from prod via the public RLS policies:
//   - bangon_requests   (anon SELECT all rows)
//   - bangon_incidents  (anon SELECT all rows)
//   - bangon_fundraisers (anon SELECT WHERE status='approved' — RLS filtered)
//   - bangon_offers     (anon SELECT all rows)

import { useEffect, useState } from 'react';
import { Siren, ArrowRight, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Counts {
  requests: number;
  incidents: number;
  fundraisers: number;
  offers: number;
}

export default function BangonHomeSector() {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCounts = async () => {
      try {
        const [req, inc, fund, offer] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('bangon_requests')   .select('*', { count: 'exact', head: true }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('bangon_incidents')  .select('*', { count: 'exact', head: true }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('bangon_fundraisers').select('*', { count: 'exact', head: true }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('bangon_offers')     .select('*', { count: 'exact', head: true }),
        ]);
        if (cancelled) return;
        setCounts({
          requests:    req.count   ?? 0,
          incidents:   inc.count   ?? 0,
          fundraisers: fund.count  ?? 0,
          offers:      offer.count ?? 0,
        });
      } catch {
        // Failed-to-fetch (e.g. table not deployed) → leave counts null so
        // the cards render the loading dash instead of fake zeros.
      }
    };

    void fetchCounts();
    const id = setInterval(() => void fetchCounts(), 60_000);
    return () => { cancelled = true; clearInterval(id); };
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
          backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 1px)',
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
          #BangonGensan <span className="text-red-300">— June 8 Earthquake Response</span>
        </h2>

        {/* Stats grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard label="Help Requests"      value={counts?.requests}    accent="bg-red-700/25     border-red-500/40" />
          <StatCard label="Incidents Reported" value={counts?.incidents}   accent="bg-orange-700/25  border-orange-500/40" />
          <StatCard label="Active Fundraisers" value={counts?.fundraisers} accent="bg-amber-700/25   border-amber-500/40" />
          <StatCard label="Offers of Help"     value={counts?.offers}      accent="bg-emerald-700/25 border-emerald-500/40" />
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
          #BangonGensan is a temporary community-powered relief coordination platform. All submissions are public.
        </p>
      </div>
    </section>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number | undefined; accent: string }) {
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${accent}`}>
      <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums leading-none">
        {value === undefined ? '—' : value.toLocaleString('en-PH')}
      </div>
      <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-red-200 mt-1.5">
        {label}
      </div>
    </div>
  );
}
