// /bangon-gensan/admin — Dashboard with pending counts + recent activity.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HandHelping, AlertTriangle, BadgeAlert, Shield, Clock } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { supabaseBangonAdmin as supabase } from '../../lib/supabaseBangonAdmin';

interface Kpis {
  requestsPending: number;
  incidentsOpen: number;
  fundraisersPending: number;
  offersTotal: number;
}

interface Activity {
  id: string;
  table: 'bangon_requests' | 'bangon_incidents' | 'bangon_fundraisers' | 'bangon_offers';
  title: string;
  subtitle: string;
  created_at: string;
}

const TABLE_META: Record<Activity['table'], { label: string; tone: string; icon: React.ReactNode; href: string }> = {
  bangon_requests:    { label: 'Request',    tone: 'bg-red-600/15 text-red-300',         icon: <HandHelping size={11} />,   href: '/bangon-gensan' },
  bangon_incidents:   { label: 'Incident',   tone: 'bg-orange-600/15 text-orange-300',   icon: <AlertTriangle size={11} />, href: '/bangon-gensan' },
  bangon_fundraisers: { label: 'Fundraiser', tone: 'bg-amber-600/15 text-amber-300',     icon: <BadgeAlert size={11} />,    href: '/bangon-gensan/admin/fundraisers' },
  bangon_offers:      { label: 'Offer',      tone: 'bg-emerald-600/15 text-emerald-300', icon: <Shield size={11} />,        href: '/bangon-gensan' },
};

export default function BangonAdminDashboard() {
  const [kpis, setKpis] = useState<Kpis>({ requestsPending: 0, incidentsOpen: 0, fundraisersPending: 0, offersTotal: 0 });
  const [activity, setActivity] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sb = supabase as any;
        const [reqs, incs, funds, offs] = await Promise.all([
          sb.from('bangon_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          sb.from('bangon_incidents').select('id', { count: 'exact', head: true }).eq('status', 'open'),
          sb.from('bangon_fundraisers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          sb.from('bangon_offers').select('id', { count: 'exact', head: true }),
        ]);
        if (cancelled) return;
        setKpis({
          requestsPending: reqs.count ?? 0,
          incidentsOpen: incs.count ?? 0,
          fundraisersPending: funds.count ?? 0,
          offersTotal: offs.count ?? 0,
        });

        const [rR, rI, rF, rO] = await Promise.all([
          sb.from('bangon_requests').select('id, need_type, barangay, full_name, created_at').order('created_at', { ascending: false }).limit(8),
          sb.from('bangon_incidents').select('id, incident_type, barangay, description, created_at').order('created_at', { ascending: false }).limit(8),
          sb.from('bangon_fundraisers').select('id, title, status, contact_name, created_at').order('created_at', { ascending: false }).limit(8),
          sb.from('bangon_offers').select('id, contact_name, offer_description, barangay, created_at').order('created_at', { ascending: false }).limit(8),
        ]);
        if (cancelled) return;
        const items: Activity[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const r of (rR.data as any[] ?? [])) items.push({ id: `req-${r.id}`, table: 'bangon_requests', title: `${r.need_type} · ${r.barangay}`, subtitle: r.full_name, created_at: r.created_at });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const r of (rI.data as any[] ?? [])) items.push({ id: `inc-${r.id}`, table: 'bangon_incidents', title: `${r.incident_type} · ${r.barangay}`, subtitle: (r.description ?? '').slice(0, 80), created_at: r.created_at });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const r of (rF.data as any[] ?? [])) items.push({ id: `fund-${r.id}`, table: 'bangon_fundraisers', title: r.title, subtitle: `${r.status} · ${r.contact_name}`, created_at: r.created_at });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const r of (rO.data as any[] ?? [])) items.push({ id: `off-${r.id}`, table: 'bangon_offers', title: `${r.contact_name} · ${r.barangay}`, subtitle: (r.offer_description ?? '').slice(0, 80), created_at: r.created_at });
        items.sort((a, b) => b.created_at.localeCompare(a.created_at));
        setActivity(items.slice(0, 20));
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <Helmet><title>Dashboard — BangonGensan Admin</title></Helmet>
      <div className="p-4 sm:p-6 space-y-5">
        <div>
          <h1 className="text-white font-bold uppercase tracking-widest text-base sm:text-lg">Dashboard</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">Live operational snapshot — pending counts and the last 20 submissions.</p>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-900/40 border border-red-700/60 text-[12px] text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi label="Requests pending" value={kpis.requestsPending} icon={<HandHelping size={16} />}    tone="bg-red-600/15 border-red-500/30 text-red-200" loading={loading} />
          <Kpi label="Incidents open"    value={kpis.incidentsOpen}    icon={<AlertTriangle size={16} />} tone="bg-orange-600/15 border-orange-500/30 text-orange-200" loading={loading} />
          <Kpi label="Fundraisers pending" value={kpis.fundraisersPending} icon={<BadgeAlert size={16} />}    tone="bg-amber-600/15 border-amber-500/30 text-amber-200" loading={loading} />
          <Kpi label="Offers total"      value={kpis.offersTotal}      icon={<Shield size={16} />}        tone="bg-emerald-600/15 border-emerald-500/30 text-emerald-200" loading={loading} />
        </div>

        <div>
          <h2 className="text-white font-bold uppercase tracking-widest text-xs mb-2">Recent activity</h2>
          <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl overflow-hidden">
            {loading ? (
              <div className="px-4 py-6 text-center text-[12px] text-gray-500">Loading…</div>
            ) : activity.length === 0 ? (
              <div className="px-4 py-6 text-center text-[12px] text-gray-500">No activity yet.</div>
            ) : (
              <ul className="divide-y divide-[#1e2a3a]">
                {activity.map(a => {
                  const meta = TABLE_META[a.table];
                  return (
                    <li key={a.id}>
                      <Link to={meta.href} className="flex items-start gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border border-current/40 flex items-center gap-1 mt-0.5 ${meta.tone}`}>
                          {meta.icon}{meta.label}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] text-gray-100 truncate">{a.title}</div>
                          <div className="text-[11px] text-gray-500 truncate">{a.subtitle}</div>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] text-gray-500 font-mono ml-2 shrink-0 mt-0.5">
                          <Clock size={9} />
                          {new Date(a.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, icon, tone, loading }: { label: string; value: number; icon: React.ReactNode; tone: string; loading: boolean }) {
  return (
    <div className={`px-4 py-3 rounded-xl border ${tone}`}>
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-80">
        {icon}<span>{label}</span>
      </div>
      <div className="text-2xl font-bold mt-1 tabular-nums">
        {loading ? '—' : value.toLocaleString('en-PH')}
      </div>
    </div>
  );
}
