// BangonOpenBusinessesSector — temporary BetterGenSan homepage sector listing
// businesses open in the wake of the June 2026 GenSan earthquake. The dataset
// is community-sourced from a viral Facebook post (extracted with OpenAI) +
// OSM-verified Brigada Pharmacy branches, then merged at runtime with
// admin-approved community submissions from bangon_business_submissions.
//
// EASY REMOVAL: delete this file + the bangonOpenBusinesses.json data file
// + the <BangonOpenBusinessesSector /> mount in Home.tsx.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search as SearchIcon,
  Store,
  MapPin,
  Clock,
  Phone,
  Plus,
  ExternalLink,
} from 'lucide-react';
import data from '../../data/bangonOpenBusinesses.json';
import { supabase } from '../../lib/supabase';

interface Business {
  id: string;
  name: string;
  categories: string[];
  sells: string | null;
  address: string | null;
  opens: string | null;
  closes: string | null;
  contact: string | null;
  source: string;
}

interface SubmissionRow {
  id: string;
  name: string;
  categories: string[] | null;
  category?: string | null;
  sells: string | null;
  address: string | null;
  opens: string | null;
  closes: string | null;
  contact: string | null;
}

const STATIC_BUSINESSES = data.businesses as Business[];
const CATEGORIES = data.meta.categories as string[];

// Priority map derived from the JSON's category order — first listed = highest
// priority. Used to sort the list essentials-first (Grocery → Pharmacy →
// Medical → Food → …) when no specific filter is active. A business with
// multiple categories is bucketed by its highest-priority tag.
const PRIORITY: Record<string, number> = Object.fromEntries(
  CATEGORIES.map((c, i) => [c, i]),
);
function priorityOf(b: Business): number {
  let min = Number.POSITIVE_INFINITY;
  for (const c of b.categories) {
    const p = PRIORITY[c] ?? 999;
    if (p < min) min = p;
  }
  return min === Number.POSITIVE_INFINITY ? 999 : min;
}

function googleMapsUrl(b: Business): string {
  const query = [b.name, b.address, 'General Santos City']
    .filter(Boolean)
    .join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function hoursLabel(b: Business): string | null {
  if (b.opens && b.closes) return `${b.opens} – ${b.closes}`;
  if (b.opens) return b.opens;
  if (b.closes) return `until ${b.closes}`;
  return null;
}

export default function BangonOpenBusinessesSector() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [approved, setApproved] = useState<Business[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (supabase as any)
        .from('bangon_business_submissions')
        .select('id, name, categories, sells, address, opens, closes, contact')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(200);
      if (cancelled) return;
      const rows = (res.data as SubmissionRow[] | null) ?? [];
      setApproved(
        rows.map((r) => ({
          id: `sub:${r.id}`,
          name: r.name,
          categories:
            Array.isArray(r.categories) && r.categories.length > 0
              ? r.categories
              : r.category
                ? [r.category]
                : ['Other'],
          sells: r.sells,
          address: r.address,
          opens: r.opens,
          closes: r.closes,
          contact: r.contact,
          source: 'community',
        })),
      );
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const all = useMemo(() => [...approved, ...STATIC_BUSINESSES], [approved]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = all.filter((b) => {
      if (activeCategory !== 'All' && !b.categories.includes(activeCategory))
        return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        (b.sells ?? '').toLowerCase().includes(q) ||
        (b.address ?? '').toLowerCase().includes(q) ||
        b.categories.some((c) => c.toLowerCase().includes(q))
      );
    });
    return rows.sort((a, b) => {
      const pa = priorityOf(a);
      const pb = priorityOf(b);
      if (pa !== pb) return pa - pb;
      return a.name.localeCompare(b.name);
    });
  }, [all, query, activeCategory]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of all) {
      for (const c of b.categories) m.set(c, (m.get(c) ?? 0) + 1);
    }
    return m;
  }, [all]);

  return (
    <section
      aria-label="Open businesses — community sourced"
      className="relative overflow-hidden border-b border-red-900/50 bg-[#1a0606]"
    >
      {/* Faint dotted noise pattern — matches BangonHomeSector so the two
          sub-sectors share the same surface texture and read as one block. */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #fff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative mx-auto max-w-[1100px] px-4 pt-1 pb-6 sm:pt-2 sm:pb-8">
        {/* Inter-sector separator — short centered dash so the two Bangon
            sub-sectors read as one block with a visual breath between them. */}
        <div
          aria-hidden
          className="flex items-center justify-center pt-2 pb-5 sm:pt-3 sm:pb-6"
        >
          <span className="h-px w-12 bg-red-700/70" />
        </div>

        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-2">
          <Store size={12} className="text-red-300" />
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-red-300">
            Open Today · Community Sourced
          </span>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
          Businesses Open in GenSan
        </h2>
        <p className="mt-1 text-[12px] text-red-200/70 leading-relaxed max-w-2xl">
          Pooled from neighbours&apos; comments on a viral June 11 post, plus
          OSM-verified pharmacies. Tap a row to find it on Google Maps. Know one
          we missed?{' '}
          <Link
            to="/bangon-gensan/business-form"
            className="underline hover:text-white"
          >
            Add it.
          </Link>
        </p>

        {/* Controls */}
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-red-300/60"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, what they sell, or address…"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-black/30 border border-red-900/50 text-[13px] text-white placeholder:text-red-300/40 focus:outline-none focus:border-red-500/60"
            />
          </div>
          <Link
            to="/bangon-gensan/business-form"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[12px] uppercase tracking-widest transition-colors"
          >
            <Plus size={14} />
            Add Your Business
          </Link>
        </div>

        {/* Category filter pills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveCategory('All')}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${
              activeCategory === 'All'
                ? 'bg-red-600 border-red-500 text-white'
                : 'bg-black/30 border-red-900/50 text-red-200 hover:border-red-500/60'
            }`}
          >
            All · {all.length}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCategory(c)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                activeCategory === c
                  ? 'bg-red-600 border-red-500 text-white'
                  : 'bg-black/30 border-red-900/50 text-red-200 hover:border-red-500/60'
              }`}
            >
              {c} · {counts.get(c) ?? 0}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="mt-4 rounded-lg border border-red-900/50 bg-black/30 overflow-hidden">
          {/* Desktop header only — mobile uses card rows instead. */}
          <div className="hidden sm:grid sm:grid-cols-12 px-3 py-2 border-b border-red-900/40 bg-red-950/40 text-[10px] font-bold uppercase tracking-[0.15em] text-red-200">
            <div className="col-span-5">Business</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-3">Sells / Address</div>
            <div className="col-span-2 text-right">Hours · Maps</div>
          </div>

          <div className="max-h-[60vh] sm:max-h-[420px] overflow-y-auto divide-y divide-white/5 bangon-shop-scroll">
            {filtered.length === 0 && (
              <div className="px-3 py-10 text-center text-[11px] text-red-300/60">
                No matches. Try a different keyword or category.
              </div>
            )}
            {filtered.map((b) => {
              const hours = hoursLabel(b);
              return (
                <a
                  key={b.id}
                  href={googleMapsUrl(b)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block sm:grid sm:grid-cols-12 sm:items-start sm:gap-2 px-3 py-3 sm:py-2 hover:bg-white/5 transition-colors group"
                >
                  {/* Top row on mobile: name + hours/maps inline. */}
                  <div className="flex items-start justify-between gap-2 sm:block sm:col-span-5 min-w-0">
                    <span className="text-[13px] sm:text-[12px] font-semibold text-white truncate">
                      {b.name}
                    </span>
                    {/* Mobile-only inline hours + maps chip */}
                    <span className="flex sm:hidden flex-col items-end shrink-0 gap-0.5">
                      {hours && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-red-200/85 whitespace-nowrap">
                          <Clock size={9} />
                          {hours}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-sky-300">
                        Maps <ExternalLink size={9} />
                      </span>
                    </span>
                  </div>

                  {/* Category pills — mobile (below name), desktop (own col) */}
                  <div className="mt-1 flex flex-wrap items-center gap-1 sm:hidden">
                    {b.categories.map((c) => (
                      <span
                        key={c}
                        className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-950/60 border border-red-800/60 text-red-200/85"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className="hidden sm:flex sm:col-span-2 flex-wrap items-start gap-1 min-w-0">
                    {b.categories.map((c) => (
                      <span
                        key={c}
                        className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-950/60 border border-red-800/60 text-red-200/85"
                      >
                        {c}
                      </span>
                    ))}
                  </div>

                  {/* Sells + address — full width on mobile, own col on desktop */}
                  <div className="mt-1.5 sm:mt-0 sm:col-span-3 min-w-0">
                    {b.sells && (
                      <div className="text-[11px] text-red-100/85 leading-snug line-clamp-2">
                        {b.sells}
                      </div>
                    )}
                    {b.address && (
                      <div className="flex items-start gap-1 mt-0.5 text-[10px] text-red-300/60 line-clamp-2">
                        <MapPin size={9} className="mt-0.5 shrink-0" />
                        <span>{b.address}</span>
                      </div>
                    )}
                    {!b.sells && !b.address && (
                      <div className="text-[10px] text-red-300/40 italic">
                        Name only — see Google Maps for details.
                      </div>
                    )}
                    {b.contact && (
                      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-red-300/60">
                        <Phone size={9} />
                        {b.contact}
                      </div>
                    )}
                  </div>

                  {/* Hours + Maps — desktop column, hidden on mobile (shown inline above) */}
                  <div className="hidden sm:flex sm:col-span-2 text-right flex-col items-end gap-1">
                    {hours && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-red-200/85">
                        <Clock size={9} />
                        {hours}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-sky-300 group-hover:text-sky-200">
                      Maps
                      <ExternalLink size={9} />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-3 text-[10px] text-red-300/60 leading-relaxed max-w-2xl">
          Community-sourced data — names, hours and addresses come from
          public comments; please verify before travelling. Pharmacy
          coordinates are OSM-verified. Hours marked &quot;—&quot; were not
          specified by the contributor.
        </p>
      </div>

      <style>{`
        .bangon-shop-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(239, 68, 68, 0.55) transparent;
        }
        .bangon-shop-scroll::-webkit-scrollbar { width: 8px; }
        .bangon-shop-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.25); }
        .bangon-shop-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(248,113,113,0.7), rgba(185,28,28,0.7));
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
      `}</style>
    </section>
  );
}
