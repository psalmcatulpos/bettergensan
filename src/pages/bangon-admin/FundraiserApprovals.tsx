// /bangon-gensan/admin/fundraisers — review pending fundraisers,
// approve / reject. Every action writes a bangon_admin_audit_log row.

import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { BadgeAlert, Check, X, ExternalLink, RefreshCcw } from 'lucide-react';
import { supabaseBangonAdmin as supabase } from '../../lib/supabaseBangonAdmin';
import { useBangonAuth } from '../../contexts/BangonAuthContext';
import { logAuditEntry } from '../../lib/bangonAudit';

interface Row {
  id: string;
  title: string;
  description: string;
  goal_amount: number;
  payment_details: string;
  contact_name: string;
  contact_number: string;
  facebook_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

export default function FundraiserApprovals() {
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
      .from('bangon_fundraisers')
      .select('id, title, description, goal_amount, payment_details, contact_name, contact_number, facebook_url, status, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (filter !== 'all') q = q.eq('status', filter);
    const { data, error } = await q;
    setLoading(false);
    if (error) { setError(error.message); return; }
    setError(null);
    setRows((data as Row[]) ?? []);
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  const setStatus = async (row: Row, next: 'approved' | 'rejected') => {
    if (!user) return;
    if (!confirm(`${next === 'approved' ? 'Approve' : 'Reject'} fundraiser "${row.title}"?`)) return;
    setBusyId(row.id);
    const before = { status: row.status };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upErr } = await (supabase as any)
      .from('bangon_fundraisers')
      .update({ status: next })
      .eq('id', row.id);
    if (upErr) {
      setBusyId(null);
      setError(upErr.message);
      return;
    }
    await logAuditEntry(user.id, profile?.display_name || profile?.email || 'admin', {
      action: next === 'approved' ? 'approved' : 'rejected',
      recordTable: 'bangon_fundraisers',
      recordId: row.id,
      before,
      after: { status: next },
    });
    setBusyId(null);
    await load();
  };

  return (
    <>
      <Helmet><title>Fundraiser Approvals — BangonGensan Admin</title></Helmet>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <BadgeAlert size={18} className="text-amber-300" />
          <h1 className="text-white font-bold uppercase tracking-widest text-base sm:text-lg">Fundraiser Approvals</h1>
          <button type="button" onClick={() => void load()}
            className="ml-auto flex items-center gap-1 px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-bold uppercase tracking-widest">
            <RefreshCcw size={11} /> Refresh
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {(['pending', 'approved', 'rejected', 'all'] as Filter[]).map(f => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${filter === f ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
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
          {loading && <div className="p-3 text-center text-[12px] text-gray-500">Loading…</div>}
          {!loading && rows.length === 0 && (
            <div className="p-6 text-center text-[12px] text-gray-500 bg-[#0d1117] border border-[#1e2a3a] rounded-xl">
              No {filter === 'all' ? '' : filter} fundraisers.
            </div>
          )}
          {rows.map(r => (
            <div key={r.id} className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-2 flex-wrap">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${
                  r.status === 'approved' ? 'bg-emerald-600/15 text-emerald-300 border-emerald-500/40' :
                  r.status === 'rejected' ? 'bg-gray-600/15 text-gray-300 border-gray-500/40' :
                  'bg-amber-600/15 text-amber-300 border-amber-500/40'
                }`}>
                  {r.status}
                </span>
                <h3 className="text-white font-bold text-sm leading-snug">{r.title}</h3>
                <span className="ml-auto text-[10px] text-gray-500 font-mono">
                  {new Date(r.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[12px] text-gray-300 leading-relaxed whitespace-pre-line">{r.description}</p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                <Item label="Goal"          value={`₱${Number(r.goal_amount).toLocaleString('en-PH')}`} />
                <Item label="Payment"       value={r.payment_details} />
                <Item label="Contact name"  value={r.contact_name} />
                <Item label="Contact phone" value={<span className="font-mono">{r.contact_number}</span>} />
                <div className="sm:col-span-2 flex items-baseline gap-2">
                  <dt className="text-gray-500 uppercase tracking-widest text-[9px] w-20 shrink-0">Facebook</dt>
                  <dd className="break-all">
                    {r.facebook_url ? (
                      <a href={r.facebook_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#4799ff] hover:text-[#6dafff] underline underline-offset-2">
                        {r.facebook_url}
                        <ExternalLink size={11} />
                      </a>
                    ) : <span className="text-gray-500">—</span>}
                  </dd>
                </div>
              </dl>
              {r.status === 'pending' && (
                <div className="flex items-center gap-2 pt-1">
                  <button type="button" disabled={busyId === r.id} onClick={() => void setStatus(r, 'approved')}
                    className="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:cursor-not-allowed text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                    <Check size={12} /> Approve
                  </button>
                  <button type="button" disabled={busyId === r.id} onClick={() => void setStatus(r, 'rejected')}
                    className="px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                    <X size={12} /> Reject
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

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-gray-500 uppercase tracking-widest text-[9px] w-20 shrink-0">{label}</dt>
      <dd className="text-gray-200">{value}</dd>
    </div>
  );
}
