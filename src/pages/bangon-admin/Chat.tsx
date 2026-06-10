// /bangon-gensan/admin/chat — realtime admin chat between BangonGensan admins.
//
// Uses Supabase Realtime on `postgres_changes` for low-latency updates;
// also polls every 8 s as a safety net in case the channel hiccups.

import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MessageSquare, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useBangonAuth } from '../../contexts/BangonAuthContext';
import { cleanText, stripAngle } from '../../lib/bangonSanitize';

interface ChatRow {
  id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

export default function AdminChat() {
  const { user, profile } = useBangonAuth();
  const [rows, setRows] = useState<ChatRow[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('bangon_admin_chat')
      .select('id, sender_id, sender_name, message, created_at')
      .order('created_at', { ascending: true })
      .limit(500);
    if (error) { setError(error.message); return; }
    setError(null);
    setRows((data as ChatRow[]) ?? []);
  };

  useEffect(() => {
    void load();

    const channel = supabase
      .channel('bangon-admin-chat')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bangon_admin_chat' },
        payload => {
          const row = payload.new as ChatRow;
          setRows(prev => (prev.find(r => r.id === row.id) ? prev : [...prev, row]));
        },
      )
      .subscribe();

    const pollInterval = setInterval(() => void load(), 8000);
    return () => {
      void supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [rows]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user) return;
    const content = stripAngle(cleanText(draft, 1000));
    if (!content) return;
    setSending(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('bangon_admin_chat')
      .insert({
        sender_id: user.id,
        sender_name: profile?.display_name || profile?.email || 'admin',
        message: content,
      });
    setSending(false);
    if (error) { setError(error.message); return; }
    setDraft('');
  };

  return (
    <>
      <Helmet><title>Admin Chat — BangonGensan</title></Helmet>
      <div className="h-[100svh] lg:h-screen flex flex-col">
        <div className="px-4 sm:px-6 py-3 border-b border-[#1e2a3a] flex items-center gap-3 flex-shrink-0">
          <MessageSquare size={16} className="text-gray-300" />
          <h1 className="text-white font-bold uppercase tracking-widest text-sm">Admin Chat</h1>
          <span className="ml-auto text-[10px] text-gray-500">Realtime · admins only</span>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-2 rounded-md bg-red-900/40 border border-red-700/60 text-[11px] text-red-200 shrink-0">
            {error}
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 space-y-2 overscroll-contain">
          {rows.length === 0 && (
            <div className="text-center text-[12px] text-gray-500 italic py-8">No messages yet. Say something.</div>
          )}
          {rows.map(m => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'} bg-anim-slide-x`}>
                <div className="text-[9px] uppercase tracking-widest text-gray-500 mb-0.5 px-1">
                  {mine ? 'you' : m.sender_name} · {new Date(m.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className={`max-w-[80%] px-3 py-2 rounded-lg text-[13px] leading-snug ${mine ? 'bg-red-600 text-white' : 'bg-[#111720] text-gray-100 border border-gray-700'}`}>
                  {m.message}
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={send} className="flex items-stretch border-t border-[#1e2a3a] bg-[#0d1117] flex-shrink-0">
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Message admins…"
            maxLength={1000}
            enterKeyHint="send"
            autoCapitalize="sentences"
            className="flex-1 bg-transparent px-4 py-3 text-[13px] text-white placeholder:text-gray-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="px-4 bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white text-[11px] font-bold uppercase tracking-widest flex items-center gap-1"
          >
            <Send size={13} />
          </button>
        </form>
      </div>
    </>
  );
}
