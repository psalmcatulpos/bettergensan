import { useEffect, useState } from 'react';
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
  name: string | null;
  type: string | null;
  expected_ttl_minutes: number | null;
  last_success_at: string | null;
  freshness_status: string | null;
}

const Freshness = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('source_health')
        .select(
          'source_id, name, type, expected_ttl_minutes, last_success_at, freshness_status'
        )
        .order('name', { ascending: true });
      setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <PageHeader
        title="Data Freshness"
        subtitle="Which datasets are up to date, which are going stale"
      />
      <Card>
        {loading ? (
          <LoadingState />
        ) : rows.length === 0 ? (
          <EmptyState message="No sources tracked yet." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-2">Dataset</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Expected refresh</th>
                <th className="px-4 py-2">Last update</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(r => (
                <tr key={r.source_id ?? ''} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-900 font-medium">
                    {r.name}
                  </td>
                  <td className="px-4 py-2 text-gray-700 text-xs">
                    {r.type}
                  </td>
                  <td className="px-4 py-2 text-gray-600 text-xs">
                    {r.expected_ttl_minutes
                      ? `every ${r.expected_ttl_minutes} min`
                      : '—'}
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {timeAgo(r.last_success_at)}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={r.freshness_status} />
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

export default Freshness;
