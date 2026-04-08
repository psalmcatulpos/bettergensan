import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  Card,
  EmptyState,
  Kpi,
  LoadingState,
  PageHeader,
  StatusBadge,
  timeAgo,
} from '../../components/admin/ui';

interface SourceHealthRow {
  source_id: string | null;
  slug: string | null;
  name: string | null;
  freshness_status: string | null;
  open_alerts: number | null;
  is_paused: boolean | null;
}

interface AlertRow {
  id: number;
  severity: string;
  kind: string;
  message: string | null;
  last_seen_at: string;
  source_id: string;
  sources: { slug: string; name: string } | null;
}

const Dashboard = () => {
  const [healths, setHealths] = useState<SourceHealthRow[]>([]);
  const [runsToday, setRunsToday] = useState(0);
  const [failedToday, setFailedToday] = useState(0);
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [criticalAlerts, setCriticalAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [healthRes, runsRes, failedRes, alertsCountRes, critRes] =
        await Promise.all([
          supabase
            .from('source_health')
            .select('source_id, slug, name, freshness_status, open_alerts, is_paused'),
          supabase
            .from('scrape_runs')
            .select('*', { count: 'exact', head: true })
            .gte('started_at', since),
          supabase
            .from('scrape_runs')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'failed')
            .gte('started_at', since),
          supabase
            .from('scrape_alerts')
            .select('*', { count: 'exact', head: true })
            .is('resolved_at', null),
          supabase
            .from('scrape_alerts')
            .select(
              'id, severity, kind, message, last_seen_at, source_id, sources(slug, name)'
            )
            .is('resolved_at', null)
            .in('severity', ['high', 'critical'])
            .order('last_seen_at', { ascending: false })
            .limit(10),
        ]);

      setHealths((healthRes.data ?? []) as SourceHealthRow[]);
      setRunsToday(runsRes.count ?? 0);
      setFailedToday(failedRes.count ?? 0);
      setActiveAlerts(alertsCountRes.count ?? 0);
      setCriticalAlerts(
        (critRes.data ?? []).map(r => ({
          ...r,
          sources: Array.isArray(r.sources) ? r.sources[0] : r.sources,
        })) as AlertRow[]
      );
      setLoading(false);
    })();
  }, []);

  const total = healths.length;
  const healthy = healths.filter(h => h.freshness_status === 'fresh').length;
  const warning = healths.filter(h =>
    ['aging', 'paused'].includes(h.freshness_status ?? '')
  ).length;
  const failed = healths.filter(h =>
    ['stale', 'failed', 'never_run'].includes(h.freshness_status ?? '')
  ).length;
  const stale = healths.filter(h =>
    ['stale', 'aging'].includes(h.freshness_status ?? '')
  ).length;

  return (
    <div>
      <PageHeader
        title="Operations Dashboard"
        subtitle="Is the city data alive?"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Kpi label="Total sources" value={total} />
        <Kpi label="Healthy" value={healthy} tone="good" />
        <Kpi label="Warning" value={warning} tone="warn" />
        <Kpi label="Failed" value={failed} tone={failed > 0 ? 'bad' : 'neutral'} />
        <Kpi label="Scrapes (24h)" value={runsToday} />
        <Kpi
          label="Failed runs (24h)"
          value={failedToday}
          tone={failedToday > 0 ? 'bad' : 'neutral'}
        />
        <Kpi label="Stale datasets" value={stale} tone={stale > 0 ? 'warn' : 'neutral'} />
        <Kpi
          label="Active alerts"
          value={activeAlerts}
          tone={activeAlerts > 0 ? 'bad' : 'good'}
        />
      </div>

      <Card title="Critical alerts">
        {loading ? (
          <LoadingState />
        ) : criticalAlerts.length === 0 ? (
          <EmptyState message="No high or critical alerts. Everything looks calm." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-2">Source</th>
                <th className="px-4 py-2">Issue</th>
                <th className="px-4 py-2">Severity</th>
                <th className="px-4 py-2">Last seen</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {criticalAlerts.map(a => (
                <tr key={a.id}>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {a.sources?.name ?? a.source_id}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    <div className="font-mono text-xs">{a.kind}</div>
                    <div className="text-xs text-gray-500 line-clamp-1">
                      {a.message}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={a.severity} />
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {timeAgo(a.last_seen_at)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {a.sources?.slug && (
                      <Link
                        to={`/admin/sources/${a.sources.slug}`}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Inspect
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
