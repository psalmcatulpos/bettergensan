import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Pause, RefreshCw, ChevronLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  StatusBadge,
  timeAgo,
} from '../../components/admin/ui';

interface SourceRow {
  id: string;
  slug: string;
  name: string;
  type: string;
  domain: string | null;
  base_url: string | null;
  schedule_cron: string | null;
  expected_ttl_minutes: number;
  parser_version: string | null;
  retry_policy: unknown;
  is_active: boolean;
  is_paused: boolean;
  fallback_mode: boolean;
  notes: string | null;
}

interface HealthRow {
  runs_24h: number | null;
  successes_24h: number | null;
  avg_duration_ms_24h: number | null;
  avg_records_24h: number | null;
  last_success_at: string | null;
  last_failure_at: string | null;
  last_failure_message: string | null;
  freshness_status: string | null;
}

interface Run {
  id: number;
  status: string;
  trigger: string;
  started_at: string;
  duration_ms: number | null;
  records_inserted: number;
  error_message: string | null;
}

interface SnapshotRow {
  id: number;
  run_id: number | null;
  kind: string;
  bytes: number | null;
  captured_at: string;
  inline: unknown;
}

const SourceDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [source, setSource] = useState<SourceRow | null>(null);
  const [health, setHealth] = useState<HealthRow | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [lastGoodSnapshot, setLastGoodSnapshot] = useState<SnapshotRow | null>(
    null
  );
  const [latestSnapshot, setLatestSnapshot] = useState<SnapshotRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    const { data: src } = await supabase
      .from('sources')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (!src) {
      setLoading(false);
      return;
    }
    setSource(src as SourceRow);

    const [healthRes, runsRes, lastGoodRunRes, latestRunRes] = await Promise.all([
      supabase
        .from('source_health')
        .select(
          'runs_24h, successes_24h, avg_duration_ms_24h, avg_records_24h, last_success_at, last_failure_at, last_failure_message, freshness_status'
        )
        .eq('source_id', src.id)
        .maybeSingle(),
      supabase
        .from('scrape_runs')
        .select('id, status, trigger, started_at, duration_ms, records_inserted, error_message')
        .eq('source_id', src.id)
        .order('started_at', { ascending: false })
        .limit(10),
      supabase
        .from('scrape_runs')
        .select('id')
        .eq('source_id', src.id)
        .eq('status', 'success')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('scrape_runs')
        .select('id')
        .eq('source_id', src.id)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    setHealth((healthRes.data ?? null) as HealthRow | null);
    setRuns((runsRes.data ?? []) as Run[]);

    if (lastGoodRunRes.data?.id) {
      const { data } = await supabase
        .from('snapshots')
        .select('id, run_id, kind, bytes, captured_at, inline')
        .eq('run_id', lastGoodRunRes.data.id)
        .order('captured_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setLastGoodSnapshot((data ?? null) as SnapshotRow | null);
    }

    if (latestRunRes.data?.id) {
      const { data } = await supabase
        .from('snapshots')
        .select('id, run_id, kind, bytes, captured_at, inline')
        .eq('run_id', latestRunRes.data.id)
        .order('captured_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setLatestSnapshot((data ?? null) as SnapshotRow | null);
    }

    setLoading(false);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const runNow = async () => {
    if (!source) return;
    setRunning(true);
    setMessage(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-run-source', {
        body: { slug: source.slug, trigger: 'manual' },
      });
      if (error) throw error;
      setMessage(
        data?.ok
          ? `Refreshed. ${data?.upstream?.inserted_count ?? 0} records.`
          : 'Run failed. Check alerts.'
      );
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Run failed');
    } finally {
      setRunning(false);
    }
  };

  const togglePause = async () => {
    if (!source) return;
    const { error } = await supabase
      .from('sources')
      .update({ is_paused: !source.is_paused })
      .eq('id', source.id);
    if (error) setMessage(error.message);
    else await load();
  };

  if (loading) return <LoadingState />;
  if (!source) return <EmptyState message={`Source '${slug}' not found.`} />;

  const successRate =
    health?.runs_24h && health.runs_24h > 0
      ? `${Math.round(((health.successes_24h ?? 0) / health.runs_24h) * 100)}%`
      : '—';

  return (
    <div>
      <Link
        to="/admin/sources"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 mb-3"
      >
        <ChevronLeft className="w-3 h-3" /> All sources
      </Link>

      <PageHeader
        title={source.name}
        subtitle={source.slug}
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={runNow}
              disabled={running}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white text-xs font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
              Run now
            </button>
            <button
              onClick={togglePause}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium"
            >
              {source.is_paused ? (
                <>
                  <Play className="w-3.5 h-3.5" /> Resume
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause
                </>
              )}
            </button>
          </div>
        }
      />

      {message && (
        <div className="mb-4 text-xs bg-sky-50 border border-sky-200 text-sky-800 rounded-md px-3 py-2">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card title="Info">
          <dl className="text-sm divide-y divide-gray-100">
            {[
              ['Type', source.type],
              ['Domain', source.domain],
              ['Base URL', source.base_url],
              ['Schedule', source.schedule_cron],
              ['Expected TTL', `${source.expected_ttl_minutes} min`],
              ['Parser version', source.parser_version],
              ['Active', source.is_active ? 'yes' : 'no'],
              ['Paused', source.is_paused ? 'yes' : 'no'],
              ['Fallback mode', source.fallback_mode ? 'yes' : 'no'],
              ['Notes', source.notes],
            ].map(([k, v]) => (
              <div key={k as string} className="flex gap-3 px-4 py-2">
                <dt className="text-xs text-gray-500 w-32 shrink-0">{k}</dt>
                <dd className="text-gray-800 break-all">{v || '—'}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title="Health (24h)">
          <dl className="text-sm divide-y divide-gray-100">
            {[
              ['Freshness', <StatusBadge key="s" status={health?.freshness_status ?? null} />],
              ['Success rate', successRate],
              ['Runs', `${health?.successes_24h ?? 0}/${health?.runs_24h ?? 0}`],
              ['Avg duration', health?.avg_duration_ms_24h ? `${health.avg_duration_ms_24h} ms` : '—'],
              ['Avg records/run', health?.avg_records_24h ?? '—'],
              ['Last success', timeAgo(health?.last_success_at ?? null)],
              ['Last failure', timeAgo(health?.last_failure_at ?? null)],
            ].map(([k, v]) => (
              <div key={k as string} className="flex gap-3 px-4 py-2">
                <dt className="text-xs text-gray-500 w-32 shrink-0">{k}</dt>
                <dd className="text-gray-800">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <Card title="Last 10 runs">
        {runs.length === 0 ? (
          <EmptyState message="No runs yet." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Trigger</th>
                <th className="px-4 py-2">Started</th>
                <th className="px-4 py-2">Duration</th>
                <th className="px-4 py-2">Records</th>
                <th className="px-4 py-2">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {runs.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link
                      to={`/admin/runs/${r.id}`}
                      className="text-primary-600 hover:text-primary-700 font-mono text-xs"
                    >
                      #{r.id}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-600">
                    {r.trigger}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {timeAgo(r.started_at)}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-600">
                    {r.duration_ms ? `${r.duration_ms} ms` : '—'}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-700">
                    {r.records_inserted}
                  </td>
                  <td className="px-4 py-2 text-xs text-red-600 line-clamp-1 max-w-xs">
                    {r.error_message ?? ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Card
          title="Last good snapshot"
          right={
            lastGoodSnapshot && (
              <Link
                to={`/admin/snapshots/${lastGoodSnapshot.id}`}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                Open
              </Link>
            )
          }
        >
          {lastGoodSnapshot ? (
            <pre className="p-4 text-[10px] bg-gray-50 max-h-80 overflow-auto font-mono">
              {JSON.stringify(lastGoodSnapshot.inline, null, 2).slice(0, 2000)}
              {JSON.stringify(lastGoodSnapshot.inline).length > 2000 && '\n…'}
            </pre>
          ) : (
            <EmptyState message="No successful snapshot yet." />
          )}
        </Card>

        <Card
          title="Latest snapshot"
          right={
            latestSnapshot && (
              <Link
                to={`/admin/snapshots/${latestSnapshot.id}`}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                Open
              </Link>
            )
          }
        >
          {latestSnapshot ? (
            <pre className="p-4 text-[10px] bg-gray-50 max-h-80 overflow-auto font-mono">
              {JSON.stringify(latestSnapshot.inline, null, 2).slice(0, 2000)}
              {JSON.stringify(latestSnapshot.inline).length > 2000 && '\n…'}
            </pre>
          ) : (
            <EmptyState message="No snapshot yet." />
          )}
        </Card>
      </div>
    </div>
  );
};

export default SourceDetail;
