// /bangon-gensan/admin/verify — Verification Queue.
//
// Two tabs (Requests, Incidents) listing user submissions that haven't been
// admin-verified yet. Approve flips verified=true so the row surfaces on the
// public right-panel + map markers. Reject deletes the row outright. Every
// action writes a bangon_admin_audit_log entry via logAuditEntry.

import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ShieldCheck, Check, X, RefreshCcw, HandHelping, AlertTriangle, MapPin, Image as ImageIcon,
  Utensils, Droplet, Pill, Home as HomeIcon, LifeBuoy,
} from 'lucide-react';
import { supabaseBangonAdmin as supabase } from '../../lib/supabaseBangonAdmin';
import { useBangonAuth } from '../../contexts/BangonAuthContext';
import { logAuditEntry } from '../../lib/bangonAudit';

type Tab = 'requests' | 'incidents';

type NeedType = 'food' | 'water' | 'medicine' | 'shelter' | 'rescue';
type IncidentType = 'natural_disaster' | 'fire' | 'medical' | 'security' | 'infrastructure' | 'other';

interface RequestRow {
  id: string;
  need_type: NeedType;
  barangay: string;
  landmark: string | null;
  full_name: string;
  contact_number: string;
  status: string;
  verified: boolean;
  created_at: string;
}

interface IncidentRow {
  id: string;
  incident_type: IncidentType;
  barangay: string;
  landmark: string | null;
  description: string;
  photo_url: string | null;
  contact_number: string;
  status: string;
  verified: boolean;
  created_at: string;
}

const NEED_META: Record<NeedType, { label: string; icon: React.ReactNode; tone: string }> = {
  food:     { label: 'Food',     icon: <Utensils size={11} />, tone: 'bg-amber-600/15   text-amber-300   border-amber-500/40' },
  water:    { label: 'Water',    icon: <Droplet size={11} />,  tone: 'bg-sky-600/15     text-sky-300     border-sky-500/40' },
  medicine: { label: 'Medicine', icon: <Pill size={11} />,     tone: 'bg-emerald-600/15 text-emerald-300 border-emerald-500/40' },
  shelter:  { label: 'Shelter',  icon: <HomeIcon size={11} />, tone: 'bg-violet-600/15  text-violet-300  border-violet-500/40' },
  rescue:   { label: 'Rescue',   icon: <LifeBuoy size={11} />, tone: 'bg-red-600/15     text-red-300     border-red-500/40' },
};

const INCIDENT_META: Record<IncidentType, { label: string; tone: string }> = {
  natural_disaster: { label: 'Disaster', tone: 'bg-orange-600/15  text-orange-300  border-orange-500/40' },
  fire:             { label: 'Fire',     tone: 'bg-red-600/15     text-red-300     border-red-500/40' },
  medical:          { label: 'Medical',  tone: 'bg-emerald-600/15 text-emerald-300 border-emerald-500/40' },
  security:         { label: 'Security', tone: 'bg-violet-600/15  text-violet-300  border-violet-500/40' },
  infrastructure:   { label: 'Infra',    tone: 'bg-amber-600/15   text-amber-300   border-amber-500/40' },
  other:            { label: 'Other',    tone: 'bg-gray-700/30    text-gray-300    border-gray-500/40' },
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function VerificationQueue() {
  const { user, profile } = useBangonAuth();
  const [tab, setTab] = useState<Tab>('requests');
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const adminName = profile?.display_name || profile?.email || 'admin';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: reqs, error: reqErr } = await (supabase as any)
        .from('bangon_requests')
        .select('id, need_type, barangay, landmark, full_name, contact_number, status, verified, created_at')
        .eq('verified', false)
        .order('created_at', { ascending: true })
        .limit(200);
      if (reqErr) throw new Error(reqErr.message);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: incs, error: incErr } = await (supabase as any)
        .from('bangon_incidents')
        .select('id, incident_type, barangay, landmark, description, photo_url, contact_number, status, verified, created_at')
        .eq('verified', false)
        .order('created_at', { ascending: true })
        .limit(200);
      if (incErr) throw new Error(incErr.message);

      setRequests((reqs as RequestRow[]) ?? []);
      setIncidents((incs as IncidentRow[]) ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the verification queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const approveRequest = async (row: RequestRow) => {
    if (!user) return;
    setBusyId(row.id);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: upErr } = await (supabase as any)
        .from('bangon_requests')
        .update({ verified: true })
        .eq('id', row.id);
      if (upErr) { setError(upErr.message); return; }
      await logAuditEntry(user.id, adminName, {
        action: 'approve_request',
        recordTable: 'bangon_requests',
        recordId: row.id,
        before: { verified: false },
        after: { verified: true },
      });
      setRequests(prev => prev.filter(r => r.id !== row.id));
    } finally {
      setBusyId(null);
    }
  };

  const rejectRequest = async (row: RequestRow) => {
    if (!user) return;
    if (!confirm(`Reject request from ${row.full_name} (${NEED_META[row.need_type].label})? This deletes the row.`)) return;
    setBusyId(row.id);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: delErr } = await (supabase as any)
        .from('bangon_requests')
        .delete()
        .eq('id', row.id);
      if (delErr) { setError(delErr.message); return; }
      await logAuditEntry(user.id, adminName, {
        action: 'reject_request',
        recordTable: 'bangon_requests',
        recordId: row.id,
        before: {
          need_type: row.need_type,
          barangay: row.barangay,
          landmark: row.landmark,
          full_name: row.full_name,
          contact_number: row.contact_number,
          status: row.status,
        },
        after: null,
      });
      setRequests(prev => prev.filter(r => r.id !== row.id));
    } finally {
      setBusyId(null);
    }
  };

  const approveIncident = async (row: IncidentRow) => {
    if (!user) return;
    setBusyId(row.id);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: upErr } = await (supabase as any)
        .from('bangon_incidents')
        .update({ verified: true })
        .eq('id', row.id);
      if (upErr) { setError(upErr.message); return; }
      await logAuditEntry(user.id, adminName, {
        action: 'approve_incident',
        recordTable: 'bangon_incidents',
        recordId: row.id,
        before: { verified: false },
        after: { verified: true },
      });
      setIncidents(prev => prev.filter(r => r.id !== row.id));
    } finally {
      setBusyId(null);
    }
  };

  const rejectIncident = async (row: IncidentRow) => {
    if (!user) return;
    if (!confirm(`Reject incident report (${INCIDENT_META[row.incident_type].label} in ${row.barangay})? This deletes the row.`)) return;
    setBusyId(row.id);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: delErr } = await (supabase as any)
        .from('bangon_incidents')
        .delete()
        .eq('id', row.id);
      if (delErr) { setError(delErr.message); return; }
      await logAuditEntry(user.id, adminName, {
        action: 'reject_incident',
        recordTable: 'bangon_incidents',
        recordId: row.id,
        before: {
          incident_type: row.incident_type,
          barangay: row.barangay,
          landmark: row.landmark,
          description: row.description,
          photo_url: row.photo_url,
          contact_number: row.contact_number,
          status: row.status,
        },
        after: null,
      });
      setIncidents(prev => prev.filter(r => r.id !== row.id));
    } finally {
      setBusyId(null);
    }
  };

  const activeRows = tab === 'requests' ? requests.length : incidents.length;

  return (
    <>
      <Helmet><title>Verification Queue — BangonGensan Admin</title></Helmet>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <ShieldCheck size={18} className="text-emerald-300" />
          <h1 className="text-white font-bold uppercase tracking-widest text-base sm:text-lg">Verification Queue</h1>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">
            {requests.length} requests · {incidents.length} incidents pending
          </span>
          <button type="button" onClick={() => void load()}
            className="ml-auto flex items-center gap-1 px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-bold uppercase tracking-widest">
            <RefreshCcw size={11} /> Refresh
          </button>
        </div>

        <div className="flex items-stretch bg-[#0d1117] border border-[#1e2a3a] rounded-md overflow-hidden">
          <button type="button" onClick={() => setTab('requests')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors ${tab === 'requests' ? 'bg-red-600/20 text-white border-b-2 border-red-500' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <HandHelping size={12} /> Requests <span className="opacity-70">({requests.length})</span>
          </button>
          <button type="button" onClick={() => setTab('incidents')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors ${tab === 'incidents' ? 'bg-red-600/20 text-white border-b-2 border-red-500' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <AlertTriangle size={12} /> Incidents <span className="opacity-70">({incidents.length})</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-900/40 border border-red-700/60 text-[12px] text-red-200">
            {error}
          </div>
        )}

        {loading && <div className="p-3 text-center text-[12px] text-gray-500">Loading…</div>}

        {!loading && activeRows === 0 && (
          <div className="p-6 text-center text-[12px] text-gray-500 bg-[#0d1117] border border-[#1e2a3a] rounded-xl">
            Queue is empty — no pending {tab === 'requests' ? 'relief requests' : 'incident reports'} to verify.
          </div>
        )}

        {tab === 'requests' && (
          <div className="space-y-2">
            {requests.map(r => {
              const meta = NEED_META[r.need_type];
              return (
                <div key={r.id} className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-4 space-y-2">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${meta.tone}`}>
                      {meta.icon} {meta.label}
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-gray-700/40 text-gray-300 border border-gray-600/50">
                      <MapPin size={9} /> {r.barangay}{r.landmark ? ` · ${r.landmark}` : ''}
                    </span>
                    <span className="ml-auto text-[10px] text-gray-500 font-mono">{fmtTime(r.created_at)}</span>
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                    <Item label="Name"          value={<span className="text-white font-bold">{r.full_name}</span>} />
                    <Item label="Contact"       value={<span className="font-mono">{r.contact_number}</span>} />
                    <Item label="Status"        value={<span className="capitalize">{r.status}</span>} />
                  </dl>
                  <div className="flex items-center gap-2 pt-1">
                    <button type="button" disabled={busyId === r.id} onClick={() => void approveRequest(r)}
                      className="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:cursor-not-allowed text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                      <Check size={12} /> Approve
                    </button>
                    <button type="button" disabled={busyId === r.id} onClick={() => void rejectRequest(r)}
                      className="px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                      <X size={12} /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'incidents' && (
          <div className="space-y-2">
            {incidents.map(r => {
              const meta = INCIDENT_META[r.incident_type];
              return (
                <div key={r.id} className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-4 space-y-2">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${meta.tone}`}>
                      {meta.label}
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-gray-700/40 text-gray-300 border border-gray-600/50">
                      <MapPin size={9} /> {r.barangay}{r.landmark ? ` · ${r.landmark}` : ''}
                    </span>
                    <span className="ml-auto text-[10px] text-gray-500 font-mono">{fmtTime(r.created_at)}</span>
                  </div>
                  <div className="flex gap-3">
                    {r.photo_url ? (
                      <a href={r.photo_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                        <img
                          src={r.photo_url}
                          alt="incident"
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-md border border-[#1e2a3a]"
                          loading="lazy"
                        />
                      </a>
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-md border border-dashed border-[#1e2a3a] flex items-center justify-center text-gray-600 text-[9px] uppercase tracking-widest flex-shrink-0">
                        <ImageIcon size={18} />
                      </div>
                    )}
                    <p className="text-[12px] text-gray-300 leading-relaxed whitespace-pre-line flex-1 min-w-0">{r.description}</p>
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                    <Item label="Contact"       value={<span className="font-mono">{r.contact_number}</span>} />
                    <Item label="Status"        value={<span className="capitalize">{r.status}</span>} />
                  </dl>
                  <div className="flex items-center gap-2 pt-1">
                    <button type="button" disabled={busyId === r.id} onClick={() => void approveIncident(r)}
                      className="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:cursor-not-allowed text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                      <Check size={12} /> Approve
                    </button>
                    <button type="button" disabled={busyId === r.id} onClick={() => void rejectIncident(r)}
                      className="px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                      <X size={12} /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
