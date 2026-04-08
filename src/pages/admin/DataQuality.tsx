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
  record_ref: string | null;
  field: string | null;
  issue: string;
  severity: string;
  resolved: boolean;
  created_at: string;
  source_id: string;
  sources: { slug: string; name: string } | null;
}

const DataQuality = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('validation_results')
      .select(
        'id, record_ref, field, issue, severity, resolved, created_at, source_id, sources(slug, name)'
      )
      .order('created_at', { ascending: false })
      .limit(100);
    if (!showResolved) q = q.eq('resolved', false);
    const { data } = await q;
    setRows(
      (data ?? []).map(r => ({
        ...r,
        sources: Array.isArray(r.sources) ? r.sources[0] : r.sources,
      })) as Row[]
    );
    setLoading(false);
  }, [showResolved]);

  useEffect(() => {
    load();
  }, [load]);

  const resolve = async (id: number) => {
    await supabase
      .from('validation_results')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', id);
    await load();
  };

  return (
    <div>
      <PageHeader
        title="Data Quality"
        subtitle="Records flagged by validation rules"
        right={
          <label className="text-xs text-gray-600 inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={e => setShowResolved(e.target.checked)}
            />
            Include resolved
          </label>
        }
      />

      <Card>
        {loading ? (
          <LoadingState />
        ) : rows.length === 0 ? (
          <EmptyState message="No data-quality issues. Nice." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-2">Source</th>
                <th className="px-4 py-2">Record</th>
                <th className="px-4 py-2">Field</th>
                <th className="px-4 py-2">Issue</th>
                <th className="px-4 py-2">Severity</th>
                <th className="px-4 py-2">Seen</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-700">
                    {v.sources?.name ?? v.source_id}
                  </td>
                  <td className="px-4 py-2 text-xs font-mono text-gray-700">
                    {v.record_ref ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-700">
                    {v.field ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    <StatusBadge status={v.issue} />
                  </td>
                  <td className="px-4 py-2 text-xs">
                    <StatusBadge status={v.severity} />
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {timeAgo(v.created_at)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {!v.resolved && (
                      <button
                        onClick={() => resolve(v.id)}
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

export default DataQuality;
