// /bangon-gensan/admin/profile — change display name + avatar.

import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { UserCircle, Upload, Save, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useBangonAuth } from '../../contexts/BangonAuthContext';
import { cleanText, validatePhoto } from '../../lib/bangonSanitize';

export default function AdminProfile() {
  const { user, profile, refresh } = useBangonAuth();
  const [displayName, setDisplayName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name || '');
    setAvatarPreview(profile?.avatar_url || null);
  }, [profile?.display_name, profile?.avatar_url]);

  const onPick = (f: File | null) => {
    setAvatarFile(f);
    setError(null);
    setSuccess(false);
    if (f) {
      const check = validatePhoto(f);
      if (!check.ok) { setError(check.reason); setAvatarFile(null); return; }
      const reader = new FileReader();
      reader.onload = ev => setAvatarPreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setAvatarPreview(profile?.avatar_url || null);
    }
  };

  const save = async () => {
    if (!user) return;
    const name = cleanText(displayName, 50);
    if (!name) { setError('Please enter a display name.'); return; }
    setSaving(true); setError(null); setSuccess(false);

    let avatarUrl = profile?.avatar_url ?? null;
    if (avatarFile) {
      const mime = avatarFile.type;
      const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('bangon-admin-avatars')
        .upload(path, avatarFile, { contentType: mime, upsert: true });
      if (upErr) { setSaving(false); setError(upErr.message); return; }
      const { data } = supabase.storage.from('bangon-admin-avatars').getPublicUrl(path);
      avatarUrl = data.publicUrl;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: dbErr } = await (supabase as any)
      .from('profiles')
      .update({ display_name: name, avatar_url: avatarUrl })
      .eq('id', user.id);
    setSaving(false);
    if (dbErr) { setError(dbErr.message); return; }
    setSuccess(true);
    setAvatarFile(null);
    await refresh();
  };

  return (
    <>
      <Helmet><title>Profile — BangonGensan Admin</title></Helmet>
      <div className="p-4 sm:p-6 space-y-4 max-w-xl">
        <div className="flex items-center gap-3">
          <UserCircle size={18} className="text-gray-300" />
          <h1 className="text-white font-bold uppercase tracking-widest text-base sm:text-lg">Profile</h1>
        </div>

        {success && (
          <div className="p-2.5 rounded-md bg-emerald-900/40 border border-emerald-700/60 text-[12px] text-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 size={13} /> Saved.
          </div>
        )}
        {error && (
          <div className="p-2.5 rounded-md bg-red-900/40 border border-red-700/60 text-[12px] text-red-200">
            {error}
          </div>
        )}

        <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#111720] border border-[#1e2a3a] overflow-hidden flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <UserCircle size={32} className="text-gray-600" />
              )}
            </div>
            <label className="flex-1">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Profile picture</span>
              <span className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#111720] border border-gray-700 text-[12px] text-gray-300 cursor-pointer hover:border-gray-500">
                <Upload size={13} /> {avatarFile?.name || 'Choose JPG / PNG / WebP, ≤ 5 MB'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                  onChange={e => onPick(e.target.files?.[0] ?? null)} />
              </span>
            </label>
          </div>

          <label className="block">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Display name</span>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={50}
              className="w-full px-3 py-2.5 rounded-md bg-[#111720] border border-gray-700 text-white text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
          </label>

          <button type="button" onClick={() => void save()} disabled={saving}
            className="px-4 py-2.5 rounded-md bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:cursor-not-allowed text-white text-[12px] font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Save size={13} /> {saving ? 'Saving…' : 'Save profile'}
          </button>

          <div className="text-[10px] text-gray-500 leading-relaxed pt-2 border-t border-[#1e2a3a]">
            Email: <span className="text-gray-300">{profile?.email || '—'}</span><br />
            Admin promotion is managed by 1Tahanan via SQL. No role / user management UI.
          </div>
        </div>
      </div>
    </>
  );
}
