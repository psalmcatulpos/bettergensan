import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  StatusBadge,
  timeAgo,
} from '../../components/admin/ui';

interface Row {
  source_id: string | null;
  slug: string | null;
  name: string | null;
  type: string | null;
  last_success_at: string | null;
  freshness_status: string | null;
  runs_24h: number | null;
  successes_24h: number | null;
  open_alerts: number | null;
}

const Sources = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('source_health')
        .select(
          'source_id, slug, name, type, last_success_at, freshness_status, runs_24h, successes_24h, open_alerts'
        )
        .order('name', { ascending: true });
      setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <PageHeader
        title="Sources"
        subtitle="Everywhere the city data comes from"
      />

      <Card>
        {loading ? (
          <LoadingState />
        ) : rows.length === 0 ? (
          <EmptyState message="No sources registered yet." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-2">Source</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Last success</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">24h success rate</th>
                <th className="px-4 py-2">Alerts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(r => {
                const successRate =
                  r.runs_24h && r.runs_24h > 0
                    ? `${Math.round(((r.successes_24h ?? 0) / r.runs_24h) * 100)}%`
                    : '—';
                return (
                  <tr
                    key={r.source_id ?? r.slug ?? ''}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/sources/${r.slug}`}
                        className="font-medium text-gray-900 hover:text-primary-600"
                      >
                        {r.name}
                      </Link>
                      <div className="text-xs text-gray-500 font-mono">
                        {r.slug}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.type}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {timeAgo(r.last_success_at)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.freshness_status} />
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {successRate}{' '}
                      <span className="text-xs text-gray-400">
                        ({r.successes_24h ?? 0}/{r.runs_24h ?? 0})
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(r.open_alerts ?? 0) > 0 ? (
                        <span className="text-red-600 font-medium">
                          {r.open_alerts}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default Sources;
