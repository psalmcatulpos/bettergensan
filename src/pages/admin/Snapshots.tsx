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
  kind: string;
  bytes: number | null;
  captured_at: string;
  run_id: number | null;
  source_id: string;
  sources: { slug: string; name: string } | null;
}

const Snapshots = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('snapshots')
        .select(
          'id, kind, bytes, captured_at, run_id, source_id, sources(slug, name)'
        )
        .order('captured_at', { ascending: false })
        .limit(100);
      setRows(
        (data ?? []).map(r => ({
          ...r,
          sources: Array.isArray(r.sources) ? r.sources[0] : r.sources,
        })) as Row[]
      );
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <PageHeader
        title="Snapshots"
        subtitle="Raw payloads captured from each scraper run"
      />

      <Card>
        {loading ? (
          <LoadingState />
        ) : rows.length === 0 ? (
          <EmptyState message="No snapshots captured yet." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Source</th>
                <th className="px-4 py-2">Run</th>
                <th className="px-4 py-2">Kind</th>
                <th className="px-4 py-2">Size</th>
                <th className="px-4 py-2">Captured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link
                      to={`/admin/snapshots/${s.id}`}
                      className="text-primary-600 hover:text-primary-700 font-mono text-xs"
                    >
                      #{s.id}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-700">
                    {s.sources?.name ?? s.source_id}
                  </td>
                  <td className="px-4 py-2">
                    {s.run_id && (
                      <Link
                        to={`/admin/runs/${s.run_id}`}
                        className="text-xs text-primary-600 hover:text-primary-700 font-mono"
                      >
                        #{s.run_id}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={s.kind} />
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-600">
                    {s.bytes ? `${s.bytes} B` : '—'}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {timeAgo(s.captured_at)}
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

export default Snapshots;
