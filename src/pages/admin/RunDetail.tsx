import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  StatusBadge,
  timeAgo,
} from '../../components/admin/ui';

interface Run {
  id: number;
  status: string;
  trigger: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  records_total: number;
  records_inserted: number;
  error_message: string | null;
  http_status: number | null;
  source_id: string;
  sources: { slug: string; name: string } | null;
}

interface PageFetch {
  id: number;
  url: string;
  method: string;
  http_status: number | null;
  bytes: number | null;
  duration_ms: number | null;
  error: string | null;
}

interface Snapshot {
  id: number;
  kind: string;
  bytes: number | null;
  captured_at: string;
}

interface Alert {
  id: number;
  kind: string;
  severity: string;
  message: string | null;
  last_seen_at: string;
}

const RunDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [run, setRun] = useState<Run | null>(null);
  const [fetches, setFetches] = useState<PageFetch[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const runId = parseInt(id, 10);
      const [runRes, fetchesRes, snapshotsRes, alertsRes] = await Promise.all([
        supabase
          .from('scrape_runs')
          .select('*, sources(slug, name)')
          .eq('id', runId)
          .maybeSingle(),
        supabase
          .from('page_fetches')
          .select('id, url, method, http_status, bytes, duration_ms, error')
          .eq('run_id', runId)
          .order('fetched_at', { ascending: true }),
        supabase
          .from('snapshots')
          .select('id, kind, bytes, captured_at')
          .eq('run_id', runId)
          .order('captured_at', { ascending: true }),
        supabase
          .from('scrape_alerts')
          .select('id, kind, severity, message, last_seen_at')
          .eq('run_id', runId)
          .order('last_seen_at', { ascending: false }),
      ]);

      if (runRes.data) {
        const r = runRes.data;
        setRun({
          ...r,
          sources: Array.isArray(r.sources) ? r.sources[0] : r.sources,
        } as Run);
      }
      setFetches((fetchesRes.data ?? []) as PageFetch[]);
      setSnapshots((snapshotsRes.data ?? []) as Snapshot[]);
      setAlerts((alertsRes.data ?? []) as Alert[]);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <LoadingState />;
  if (!run) return <EmptyState message={`Run #${id} not found.`} />;

  return (
    <div>
      <Link
        to="/admin/runs"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 mb-3"
      >
        <ChevronLeft className="w-3 h-3" /> All runs
      </Link>

      <PageHeader
        title={`Run #${run.id}`}
        subtitle={
          run.sources?.name
            ? `${run.sources.name} (${run.sources.slug})`
            : run.source_id
        }
        right={<StatusBadge status={run.status} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card title="Metadata">
          <dl className="text-sm divide-y divide-gray-100">
            {[
              ['Trigger', run.trigger],
              ['Started', timeAgo(run.started_at)],
              ['Finished', run.finished_at ? timeAgo(run.finished_at) : 'not finished'],
              ['Duration', run.duration_ms ? `${run.duration_ms} ms` : '—'],
              ['HTTP status', run.http_status ?? '—'],
              ['Records total', run.records_total],
              ['Records inserted', run.records_inserted],
              ['Error', run.error_message ?? '—'],
            ].map(([k, v]) => (
              <div key={k as string} className="flex gap-3 px-4 py-2">
                <dt className="text-xs text-gray-500 w-32 shrink-0">{k}</dt>
                <dd className="text-gray-800 break-all">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title="Alerts from this run">
          {alerts.length === 0 ? (
            <EmptyState message="No alerts emitted by this run." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {alerts.map(a => (
                <li key={a.id} className="px-4 py-2 flex items-start gap-3">
                  <StatusBadge status={a.severity} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono text-gray-700">
                      {a.kind}
                    </div>
                    <div className="text-xs text-gray-500 line-clamp-2">
                      {a.message}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {timeAgo(a.last_seen_at)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Page fetches">
        {fetches.length === 0 ? (
          <EmptyState message="No HTTP fetches recorded." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-2">URL</th>
                <th className="px-4 py-2">Method</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Bytes</th>
                <th className="px-4 py-2">Duration</th>
                <th className="px-4 py-2">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fetches.map(f => (
                <tr key={f.id}>
                  <td className="px-4 py-2 text-xs font-mono break-all max-w-md">
                    {f.url}
                  </td>
                  <td className="px-4 py-2 text-xs">{f.method}</td>
                  <td className="px-4 py-2 text-xs">{f.http_status ?? '—'}</td>
                  <td className="px-4 py-2 text-xs">{f.bytes ?? '—'}</td>
                  <td className="px-4 py-2 text-xs">
                    {f.duration_ms ? `${f.duration_ms} ms` : '—'}
                  </td>
                  <td className="px-4 py-2 text-xs text-red-600 line-clamp-1 max-w-xs">
                    {f.error ?? ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <div className="mt-4">
        <Card title="Snapshots">
          {snapshots.length === 0 ? (
            <EmptyState message="No snapshots captured." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {snapshots.map(s => (
                <li key={s.id} className="px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-700">
                      #{s.id}
                    </span>
                    <StatusBadge status={s.kind} />
                    <span className="text-xs text-gray-500">
                      {s.bytes ?? 0} bytes
                    </span>
                    <span className="text-xs text-gray-400">
                      {timeAgo(s.captured_at)}
                    </span>
                  </div>
                  <Link
                    to={`/admin/snapshots/${s.id}`}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};

export default RunDetail;
