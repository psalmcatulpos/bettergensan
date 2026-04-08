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
  id: number;
  status: string;
  trigger: string;
  started_at: string;
  duration_ms: number | null;
  records_inserted: number;
  error_message: string | null;
  source_id: string;
  sources: { slug: string; name: string } | null;
}

const Runs = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase
        .from('scrape_runs')
        .select(
          'id, status, trigger, started_at, duration_ms, records_inserted, error_message, source_id, sources(slug, name)'
        )
        .order('started_at', { ascending: false })
        .limit(100);
      if (status) q = q.eq('status', status);
      const { data } = await q;
      setRows(
        (data ?? []).map(r => ({
          ...r,
          sources: Array.isArray(r.sources) ? r.sources[0] : r.sources,
        })) as Row[]
      );
      setLoading(false);
    })();
  }, [status]);

  return (
    <div>
      <PageHeader
        title="Runs"
        subtitle="Every scraper execution"
        right={
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="text-xs border border-gray-300 rounded-md px-2 py-1.5"
          >
            <option value="">All statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="running">Running</option>
            <option value="partial">Partial</option>
          </select>
        }
      />

      <Card>
        {loading ? (
          <LoadingState />
        ) : rows.length === 0 ? (
          <EmptyState message="No runs match the filters." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-2">Run</th>
                <th className="px-4 py-2">Source</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Trigger</th>
                <th className="px-4 py-2">Started</th>
                <th className="px-4 py-2">Duration</th>
                <th className="px-4 py-2">Records</th>
                <th className="px-4 py-2">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(r => (
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
                    {r.sources?.slug ? (
                      <Link
                        to={`/admin/sources/${r.sources.slug}`}
                        className="text-gray-700 hover:text-primary-600"
                      >
                        {r.sources.name}
                      </Link>
                    ) : (
                      <span className="text-gray-400 text-xs">
                        {r.source_id}
                      </span>
                    )}
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
    </div>
  );
};

export default Runs;
