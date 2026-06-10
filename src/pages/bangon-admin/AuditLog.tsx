// /bangon-gensan/admin/audit — immutable audit log viewer.

import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ScrollText, ChevronRight, ChevronDown } from 'lucide-react';
import { supabaseBangonAdmin as supabase } from '../../lib/supabaseBangonAdmin';

interface AuditRow {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  record_table: string;
  record_id: string;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  created_at: string;
}

export default function AuditLog() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('bangon_admin_audit_log')
        .select('id, admin_id, admin_name, action, record_table, record_id, before_state, after_state, created_at')
        .order('created_at', { ascending: false })
        .limit(500);
      if (cancelled) return;
      setLoading(false);
      if (error) { setError(error.message); return; }
      setRows((data as AuditRow[]) ?? []);
    })();
    return () => { cancelled = true; };
  }, []);

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <>
      <Helmet><title>Audit Log — BangonGensan Admin</title></Helmet>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <ScrollText size={18} className="text-gray-300" />
          <h1 className="text-white font-bold uppercase tracking-widest text-base sm:text-lg">Audit Log</h1>
        </div>
        <p className="text-[11px] text-gray-500">Immutable record of admin actions. Read-only — no edit or delete.</p>

        {error && (
          <div className="p-3 rounded-md bg-red-900/40 border border-red-700/60 text-[12px] text-red-200">{error}</div>
        )}

        <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl overflow-hidden">
          {loading ? (
            <div className="px-4 py-6 text-center text-[12px] text-gray-500">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-gray-500">No audit entries yet.</div>
          ) : (
            <ul className="divide-y divide-[#1e2a3a]">
              {rows.map(r => {
                const isOpen = expanded.has(r.id);
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => toggle(r.id)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                    >
                      {isOpen ? <ChevronDown size={12} className="text-gray-500" /> : <ChevronRight size={12} className="text-gray-500" />}
                      <span className="text-[10px] font-mono text-gray-500 w-32 shrink-0">
                        {new Date(r.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-gray-300 w-32 truncate">{r.admin_name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                        r.action === 'approved' ? 'bg-emerald-600/15 text-emerald-300' :
                        r.action === 'rejected' ? 'bg-red-600/15 text-red-300' :
                        'bg-gray-600/15 text-gray-300'
                      }`}>
                        {r.action}
                      </span>
                      <span className="text-[11px] text-gray-400 font-mono truncate">{r.record_table} · {r.record_id.slice(0, 8)}…</span>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-3 grid grid-cols-1 lg:grid-cols-2 gap-2 bg-black/30">
                        <DiffBlock title="Before" value={r.before_state} />
                        <DiffBlock title="After"  value={r.after_state} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function DiffBlock({ title, value }: { title: string; value: Record<string, unknown> | null }) {
  return (
    <div>
      <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">{title}</div>
      <pre className="text-[11px] text-gray-300 bg-[#111720] border border-[#1e2a3a] rounded-md p-2 overflow-x-auto max-h-60">
        {value ? JSON.stringify(value, null, 2) : '—'}
      </pre>
    </div>
  );
}
