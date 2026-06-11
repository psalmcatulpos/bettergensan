// /bangon-gensan/admin/businesses — review pending community-submitted
// businesses for the Open Today list. Approving flips status='approved' so
// the row appears on the homepage sector. Each row links to Google Maps via
// the same query format the public sector uses.

import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Store,
  Check,
  X,
  RefreshCcw,
  MapPin,
  Clock,
  Phone,
  ExternalLink,
} from 'lucide-react';
import { supabaseBangonAdmin as supabase } from '../../lib/supabaseBangonAdmin';
import { useBangonAuth } from '../../contexts/BangonAuthContext';
import { logAuditEntry } from '../../lib/bangonAudit';

interface Row {
  id: string;
  name: string;
  categories: string[] | null;
  category: string | null;
  sells: string | null;
  address: string | null;
  opens: string | null;
  closes: string | null;
  contact: string | null;
  submitter_name: string;
  submitter_contact: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

function googleMapsUrl(r: Row): string {
  const query = [r.name, r.address, 'General Santos City']
    .filter(Boolean)
    .join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function BusinessApprovals() {
  const { user, profile } = useBangonAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<Filter>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q = (supabase as any)
      .from('bangon_business_submissions')
      .select(
        'id, name, categories, category, sells, address, opens, closes, contact, submitter_name, submitter_contact, status, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(200);
    if (filter !== 'all') q = q.eq('status', filter);
    const { data, error } = await q;
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setError(null);
    setRows((data as Row[]) ?? []);
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (row: Row, next: 'approved' | 'rejected') => {
    if (!user) return;
    if (
      !confirm(
        `${next === 'approved' ? 'Approve' : 'Reject'} business "${row.name}"?`,
      )
    )
      return;
    setBusyId(row.id);
    const before = { status: row.status };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upErr } = await (supabase as any)
      .from('bangon_business_submissions')
      .update({
        status: next,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', row.id);
    if (upErr) {
      setBusyId(null);
      setError(upErr.message);
      return;
    }
    await logAuditEntry(
      user.id,
      profile?.display_name || profile?.email || 'admin',
      {
        action: next === 'approved' ? 'approved' : 'rejected',
        recordTable: 'bangon_business_submissions',
        recordId: row.id,
        before,
        after: { status: next },
      },
    );
    setBusyId(null);
    await load();
  };

  return (
    <>
      <Helmet>
        <title>Business Approvals — BangonGensan Admin</title>
      </Helmet>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Store size={18} className="text-emerald-300" />
          <h1 className="text-white font-bold uppercase tracking-widest text-base sm:text-lg">
            Business Approvals
          </h1>
          <button
            type="button"
            onClick={() => void load()}
            className="ml-auto flex items-center gap-1 px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-bold uppercase tracking-widest"
          >
            <RefreshCcw size={11} /> Refresh
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {(['pending', 'approved', 'rejected', 'all'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                filter === f
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-900/40 border border-red-700/60 text-[12px] text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {loading && (
            <div className="p-3 text-center text-[12px] text-gray-500">
              Loading…
            </div>
          )}
          {!loading && rows.length === 0 && (
            <div className="p-6 text-center text-[12px] text-gray-500 bg-[#0d1117] border border-[#1e2a3a] rounded-xl">
              No {filter === 'all' ? '' : filter} submissions.
            </div>
          )}
          {rows.map((r) => (
            <div
              key={r.id}
              className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-4 space-y-2"
            >
              <div className="flex items-start gap-2 flex-wrap">
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${
                    r.status === 'approved'
                      ? 'bg-emerald-600/15 text-emerald-300 border-emerald-500/40'
                      : r.status === 'rejected'
                        ? 'bg-gray-600/15 text-gray-300 border-gray-500/40'
                        : 'bg-amber-600/15 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {r.status}
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {(r.categories && r.categories.length > 0
                    ? r.categories
                    : r.category
                      ? [r.category]
                      : []
                  ).map((c) => (
                    <span
                      key={c}
                      className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-700/40 border border-gray-600/50 text-gray-200 uppercase tracking-widest"
                    >
                      {c}
                    </span>
                  ))}
                </div>
                <span className="ml-auto text-[10px] text-gray-500 font-mono">
                  {fmt(r.created_at)}
                </span>
              </div>

              <div className="flex items-baseline gap-2 flex-wrap">
                <h2 className="text-white font-bold text-sm">{r.name}</h2>
                <a
                  href={googleMapsUrl(r)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-[10px] text-sky-300 hover:text-sky-200"
                >
                  Verify on Google Maps <ExternalLink size={9} />
                </a>
              </div>

              {r.sells && (
                <p className="text-[12px] text-gray-300 leading-snug">
                  {r.sells}
                </p>
              )}

              <div className="flex flex-wrap gap-3 text-[11px] text-gray-400">
                {r.address && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={11} /> {r.address}
                  </span>
                )}
                {(r.opens || r.closes) && (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} />
                    {r.opens && r.closes
                      ? `${r.opens} – ${r.closes}`
                      : (r.opens ?? r.closes)}
                  </span>
                )}
                {r.contact && (
                  <span className="inline-flex items-center gap-1">
                    <Phone size={11} /> {r.contact}
                  </span>
                )}
              </div>

              <div className="text-[10px] text-gray-500 border-t border-[#1e2a3a] pt-2">
                Submitted by <span className="text-gray-300">{r.submitter_name}</span>
                {r.submitter_contact && (
                  <>
                    {' · '}
                    <span className="text-gray-300">{r.submitter_contact}</span>
                  </>
                )}
              </div>

              {r.status === 'pending' && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void setStatus(r, 'approved')}
                    disabled={busyId === r.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[10px] font-bold uppercase tracking-widest"
                  >
                    <Check size={11} /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => void setStatus(r, 'rejected')}
                    disabled={busyId === r.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-100 text-[10px] font-bold uppercase tracking-widest"
                  >
                    <X size={11} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
