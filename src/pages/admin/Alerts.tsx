import { useCallback, useEffect, useState } from 'react';
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
  id: number;
  severity: string;
  kind: string;
  message: string | null;
  last_seen_at: string;
  first_seen_at: string;
  seen_count: number;
  resolved_at: string | null;
  source_id: string;
  sources: { slug: string; name: string } | null;
}

type Tab = 'active' | 'resolved';

const Alerts = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('active');

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('scrape_alerts')
      .select(
        'id, severity, kind, message, last_seen_at, first_seen_at, seen_count, resolved_at, source_id, sources(slug, name)'
      )
      .order('last_seen_at', { ascending: false })
      .limit(100);
    if (tab === 'active') q = q.is('resolved_at', null);
    else q = q.not('resolved_at', 'is', null);

    const { data } = await q;
    setRows(
      (data ?? []).map(r => ({
        ...r,
        sources: Array.isArray(r.sources) ? r.sources[0] : r.sources,
      })) as Row[]
    );
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const resolve = async (id: number) => {
    await supabase.rpc('resolve_alert', { alert_id: id });
    await load();
  };

  return (
    <div>
      <PageHeader
        title="Alerts"
        subtitle="Scraper issues surfaced by the ingestion pipeline"
        right={
          <div className="inline-flex rounded-md border border-gray-300 overflow-hidden text-xs">
            {(['active', 'resolved'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 capitalize ${
                  tab === t
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        }
      />

      <Card>
        {loading ? (
          <LoadingState />
        ) : rows.length === 0 ? (
          <EmptyState
            message={
              tab === 'active' ? 'No active alerts.' : 'No resolved alerts.'
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-2">Source</th>
                <th className="px-4 py-2">Kind</th>
                <th className="px-4 py-2">Severity</th>
                <th className="px-4 py-2">Message</th>
                <th className="px-4 py-2">Seen</th>
                <th className="px-4 py-2">First</th>
                <th className="px-4 py-2">Last</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-700">
                    {a.sources?.name ?? a.source_id}
                  </td>
                  <td className="px-4 py-2 text-xs font-mono text-gray-700">
                    {a.kind}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={a.severity} />
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-600 line-clamp-2 max-w-md">
                    {a.message}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-700">
                    {a.seen_count}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {timeAgo(a.first_seen_at)}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {timeAgo(a.last_seen_at)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {tab === 'active' && (
                      <button
                        onClick={() => resolve(a.id)}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Resolve
                      </button>
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

export default Alerts;
