// /bangon-gensan/admin/chat — admins write into the SAME public chat that
// users see on /bangon-gensan, but as STAFF. Admins can also delete any
// message (including users') for moderation.
//
// Schema notes:
//   - bangon_chat_messages.is_staff = true   → posted by an admin (gated by
//     RLS to `is_bangon_admin()`); rendered with a STAFF badge in white.
//   - bangon_chat_messages.is_staff = false  → posted anonymously by a public
//     visitor.
//   - DELETE policy is `is_bangon_admin()` only — anon can't remove anything.

import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { supabaseBangonAdmin as supabase } from '../../lib/supabaseBangonAdmin';
import { useBangonAuth } from '../../contexts/BangonAuthContext';
import { cleanText, stripAngle } from '../../lib/bangonSanitize';

interface ChatRow {
  id: string;
  session_id: string;
  display_name: string;
  content: string;
  created_at: string;
  is_staff: boolean;
}

export default function AdminChat() {
  const { user, profile } = useBangonAuth();
  const [rows, setRows] = useState<ChatRow[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Stable session id per admin so their own messages render with "you" on
  // their side and any reply they make later in the same browser still
  // reads as theirs.
  const adminSessionId = user ? `admin:${user.id}` : 'admin:anon';
  const adminName = profile?.display_name || profile?.email?.split('@')[0] || 'Staff';

  const load = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('bangon_chat_messages')
        .select('id, session_id, display_name, content, created_at, is_staff')
        .order('created_at', { ascending: true })
        .limit(500);
      if (error) { setError(error.message); return; }
      setError(null);
      setRows((data as ChatRow[]) ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not load chat.';
      setError(msg.includes('fetch') ? 'Chat is unreachable. Check your connection.' : msg);
    }
  };

  useEffect(() => {
    void load();

    const channel = supabase
      .channel('bangon-admin-public-chat')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bangon_chat_messages' },
        payload => {
          const row = payload.new as ChatRow;
          setRows(prev => (prev.find(r => r.id === row.id) ? prev : [...prev, row]));
        },
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'bangon_chat_messages' },
        payload => {
          const old = payload.old as { id: string };
          setRows(prev => prev.filter(r => r.id !== old.id));
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
    const content = stripAngle(cleanText(draft, 500));
    if (!content) return;
    setSending(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('bangon_chat_messages')
        .insert({
          session_id: adminSessionId,
          display_name: adminName.slice(0, 50),
          content,
          is_staff: true,
        });
      if (error) { setError(error.message); return; }
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Delete this message? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('bangon_chat_messages')
        .delete()
        .eq('id', id);
      if (error) { setError(error.message); return; }
      setRows(prev => prev.filter(r => r.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Helmet><title>Community Chat — BangonGensan Admin</title></Helmet>
      <div className="h-[100svh] lg:h-screen flex flex-col">
        <div className="px-4 sm:px-6 py-3 border-b border-[#1e2a3a] flex items-center gap-3 flex-shrink-0">
          <MessageSquare size={16} className="text-gray-300" />
          <h1 className="text-white font-bold uppercase tracking-widest text-sm">Community Chat</h1>
          <span className="ml-auto text-[10px] text-gray-500">
            Posting as <span className="text-white font-bold">{adminName}</span> · change in Profile
          </span>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-2 rounded-md bg-red-900/40 border border-red-700/60 text-[11px] text-red-200 shrink-0">
            {error}
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 space-y-2 overscroll-contain">
          {rows.length === 0 && (
            <div className="text-center text-[12px] text-gray-500 italic py-8">
              No messages yet. Be the first to say something.
            </div>
          )}
          {rows.map(m => {
            const mine = m.session_id === adminSessionId;
            return (
              <div key={m.id} className={`group flex flex-col ${mine ? 'items-end' : 'items-start'} bg-anim-slide-x`}>
                <div className="text-[9px] uppercase tracking-widest mb-0.5 px-1 flex items-center gap-1">
                  {m.is_staff && (
                    <span className="px-1 py-0 rounded bg-red-600 text-white text-[8px] font-bold tracking-widest">STAFF</span>
                  )}
                  <span className={m.is_staff ? 'text-white font-bold' : 'text-gray-500'}>
                    {mine ? 'you' : m.display_name}
                  </span>
                  <span className="text-gray-500">· {new Date(m.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-end gap-1">
                  {mine && (
                    <button
                      type="button"
                      onClick={() => void deleteMessage(m.id)}
                      disabled={deletingId === m.id}
                      title="Delete message"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-900/30 disabled:opacity-50"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                  <div className={`max-w-[80%] px-3 py-2 rounded-lg text-[13px] leading-snug ${
                    mine ? 'bg-red-600 text-white'
                    : m.is_staff ? 'bg-red-900/40 text-white border border-red-700/60'
                    : 'bg-[#111720] text-gray-100 border border-gray-700'
                  }`}>
                    {m.content}
                  </div>
                  {!mine && (
                    <button
                      type="button"
                      onClick={() => void deleteMessage(m.id)}
                      disabled={deletingId === m.id}
                      title="Delete message"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-900/30 disabled:opacity-50"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
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
            placeholder="Reply to the community as STAFF…"
            maxLength={500}
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
