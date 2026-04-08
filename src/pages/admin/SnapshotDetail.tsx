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

interface Snapshot {
  id: number;
  kind: string;
  bytes: number | null;
  url: string | null;
  captured_at: string;
  run_id: number | null;
  inline: unknown;
  source_id: string;
  sources: { slug: string; name: string } | null;
}

const SnapshotDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [lastGood, setLastGood] = useState<Snapshot | null>(null);
  const [compare, setCompare] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const snapId = parseInt(id, 10);
      const { data } = await supabase
        .from('snapshots')
        .select('*, sources(slug, name)')
        .eq('id', snapId)
        .maybeSingle();

      if (data) {
        const normalized = {
          ...data,
          sources: Array.isArray(data.sources) ? data.sources[0] : data.sources,
        } as Snapshot;
        setSnap(normalized);

        // Fetch last successful snapshot for the same source for comparison.
        const { data: goodRun } = await supabase
          .from('scrape_runs')
          .select('id')
          .eq('source_id', normalized.source_id)
          .eq('status', 'success')
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (goodRun?.id) {
          const { data: lastGoodData } = await supabase
            .from('snapshots')
            .select('*, sources(slug, name)')
            .eq('run_id', goodRun.id)
            .order('captured_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (lastGoodData) {
            setLastGood({
              ...lastGoodData,
              sources: Array.isArray(lastGoodData.sources)
                ? lastGoodData.sources[0]
                : lastGoodData.sources,
            } as Snapshot);
          }
        }
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <LoadingState />;
  if (!snap) return <EmptyState message={`Snapshot #${id} not found.`} />;

  const json = JSON.stringify(snap.inline, null, 2);
  const goodJson = lastGood ? JSON.stringify(lastGood.inline, null, 2) : null;

  return (
    <div>
      <Link
        to="/admin/snapshots"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 mb-3"
      >
        <ChevronLeft className="w-3 h-3" /> All snapshots
      </Link>

      <PageHeader
        title={`Snapshot #${snap.id}`}
        subtitle={
          snap.sources?.name
            ? `${snap.sources.name} • ${snap.bytes ?? 0} bytes • ${timeAgo(snap.captured_at)}`
            : undefined
        }
        right={
          <div className="flex items-center gap-2">
            <StatusBadge status={snap.kind} />
            {goodJson && goodJson !== json && (
              <button
                onClick={() => setCompare(c => !c)}
                className="text-xs px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
              >
                {compare ? 'Hide compare' : 'Compare to last good'}
              </button>
            )}
          </div>
        }
      />

      {snap.run_id && (
        <Link
          to={`/admin/runs/${snap.run_id}`}
          className="text-xs text-primary-600 hover:text-primary-700 mb-3 inline-block"
        >
          From run #{snap.run_id}
        </Link>
      )}

      <div className={`grid gap-4 ${compare ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        <Card title={compare ? 'This snapshot' : 'Payload'}>
          <pre className="p-4 text-[10px] bg-gray-50 max-h-[70vh] overflow-auto font-mono whitespace-pre-wrap break-all">
            {json}
          </pre>
        </Card>
        {compare && goodJson && (
          <Card title="Last good snapshot">
            <pre className="p-4 text-[10px] bg-gray-50 max-h-[70vh] overflow-auto font-mono whitespace-pre-wrap break-all">
              {goodJson}
            </pre>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SnapshotDetail;
