import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { useToast } from '../components/ToastProvider';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';

type ProfileRow = {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  updated_at: string | null;
};

async function getSignedAvatarUrl(path: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  const [editingUsername, setEditingUsername] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);

  const [usernameDraft, setUsernameDraft] = useState('');
  const [bioDraft, setBioDraft] = useState('');
  const [emailDraft, setEmailDraft] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const initials = useMemo(() => {
    const email = user?.email ?? '';
    const a = (profile?.username ?? email).trim();
    if (!a) return 'U';
    return a
      .split(/\s+/)
      .slice(0, 2)
      .map(s => s[0]?.toUpperCase())
      .join('');
  }, [profile?.username, user?.email]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
        const supabase = getSupabase();
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, bio, avatar_url, updated_at')
          .eq('id', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          const { data: created, error: insertError } = await supabase
            .from('profiles')
            .insert({ id: user.id, username: user.user_metadata?.username ?? null, bio: null, avatar_url: null })
            .select('id, username, bio, avatar_url, updated_at')
            .single();
          if (insertError) throw insertError;
          setProfile(created);
          setUsernameDraft(created.username ?? '');
          setBioDraft(created.bio ?? '');
          setEmailDraft(user.email ?? '');
          setAvatarSrc(null);
          return;
        }

        if (error) throw error;
        setProfile(data);
        setUsernameDraft(data.username ?? '');
        setBioDraft(data.bio ?? '');
        setEmailDraft(user.email ?? '');

        if (data.avatar_url) {
          const signed = await getSignedAvatarUrl(data.avatar_url);
          setAvatarSrc(signed);
        } else {
          setAvatarSrc(null);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load profile.';
        pushToast({ type: 'error', message });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [pushToast, user]);

  if (!user) return null;
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-16 bg-white dark:bg-[#0a1612]">
        <div className="w-full max-w-xl bg-paper/20 dark:bg-white/5 p-1.5 rounded-[44px] shadow-3xl border border-paper dark:border-green-900/30">
          <div className="bg-paper/60 dark:bg-dark-serpent/50 rounded-[40px] p-8 md:p-10">
            <h1 className="text-2xl font-black text-dark-serpent dark:text-white">Supabase not configured</h1>
            <p className="mt-3 text-sm font-bold text-green-1 dark:text-green-3">
            Create a <span className="font-black">.env</span> file and set{' '}
            <span className="font-black">VITE_SUPABASE_URL</span> and <span className="font-black">VITE_SUPABASE_ANON_KEY</span>,
            then restart <span className="font-black">npm run dev</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const saveUsername = async () => {
    try {
      const supabase = getSupabase();
      const value = usernameDraft.trim();
      if (!value) throw new Error('Username is required.');
      const { data, error } = await supabase
        .from('profiles')
        .update({ username: value, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select('id, username, bio, avatar_url, updated_at')
        .single();
      if (error) throw error;
      setProfile(data);
      pushToast({ type: 'success', message: 'Username updated.' });
      setEditingUsername(false);
    } catch (err) {
      pushToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update username.' });
    }
  };

  const saveBio = async () => {
    try {
      const supabase = getSupabase();
      const value = bioDraft.trim();
      if (value.length > 200) throw new Error('Bio must be 200 characters or less.');
      const { data, error } = await supabase
        .from('profiles')
        .update({ bio: value || null, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select('id, username, bio, avatar_url, updated_at')
        .single();
      if (error) throw error;
      setProfile(data);
      pushToast({ type: 'success', message: 'Bio updated.' });
      setEditingBio(false);
    } catch (err) {
      pushToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update bio.' });
    }
  };

  const saveEmail = async () => {
    try {
      const supabase = getSupabase();
      const value = emailDraft.trim();
      if (!value) throw new Error('Email is required.');
      const { error } = await supabase.auth.updateUser({ email: value });
      if (error) throw error;

      pushToast({
        type: 'info',
        message: 'Email change requested. Please verify the new email address to complete the update.',
      });

      await supabase.auth.signOut();
      navigate('/login', { replace: true, state: { message: 'Please verify your email change, then log in again.' } });
      setEditingEmail(false);
    } catch (err) {
      pushToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update email.' });
    }
  };

  const savePassword = async () => {
    try {
      const supabase = getSupabase();
      if (!user.email) throw new Error('Missing user email.');
      if (!currentPassword) throw new Error('Current password is required.');
      if (!newPassword) throw new Error('New password is required.');
      if (newPassword !== confirmNewPassword) throw new Error('New passwords do not match.');

      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (reauthError) throw reauthError;

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      pushToast({ type: 'success', message: 'Password updated.' });
      setEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      pushToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update password.' });
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      const supabase = getSupabase();
      const ext = file.name.split('.').pop() || 'png';
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: path, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select('id, username, bio, avatar_url, updated_at')
        .single();
      if (error) throw error;
      setProfile(data);

      const signed = await getSignedAvatarUrl(path);
      setAvatarSrc(signed);
      pushToast({ type: 'success', message: 'Profile picture updated.' });
    } catch (err) {
      pushToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to upload avatar.' });
    }
  };

  const onSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const cardClass =
    'bg-white/70 dark:bg-green-900/20 rounded-[32px] border border-paper dark:border-green-800 shadow-xl';
  const labelClass = 'text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85';
  const inputClass =
    'w-full px-4 py-3 border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] text-dark-serpent dark:text-white rounded-2xl focus:border-castleton-green dark:focus:border-saffron focus:outline-none transition-colors text-sm font-semibold placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs';
  const outlineBtnClass =
    'px-6 py-2.5 border-2 border-castleton-green/20 dark:border-saffron/20 text-castleton-green dark:text-saffron font-black rounded-full hover:bg-castleton-green dark:hover:bg-saffron hover:text-white dark:hover:text-dark-serpent transition-all shadow-lg hover:-translate-y-0.5';
  const primaryBtnClass =
    'px-8 py-4 bg-saffron text-dark-serpent font-black rounded-full hover:bg-earth-yellow transition-all shadow-xl hover:-translate-y-0.5';

  return (
    <div className="pt-32 pb-20 px-4 bg-white dark:bg-[#0a1612] animate-in fade-in duration-500">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex items-start justify-between gap-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/70 dark:bg-green-900/20 border border-paper dark:border-green-800 flex items-center justify-center text-xl">
              {'\u{1F464}'}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-dark-serpent dark:text-white">
                Profile
              </h1>
              <p className="mt-1 text-sm font-bold text-green-1 dark:text-green-3 opacity-90">
                Manage your account settings and public profile.
              </p>
            </div>
          </div>

          <button type="button" onClick={onSignOut} className={outlineBtnClass}>
            Sign out
          </button>
        </div>

        {loading ? (
          <div className="text-sm font-bold text-green-2 dark:text-green-4/80">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`lg:col-span-1 p-6 ${cardClass}`}>
              <div className="flex items-center gap-4">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="w-16 h-16 rounded-2xl object-cover border border-paper dark:border-green-800"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-dark-serpent text-white flex items-center justify-center font-black">
                    {initials}
                  </div>
                )}
                <div>
                  <div className="text-sm font-black text-dark-serpent dark:text-white">{profile?.username || user.email}</div>
                  <div className="text-xs font-semibold text-green-2 dark:text-green-4/80">{user.email}</div>
                </div>
              </div>

              <div className="mt-6">
                <label className={`block mb-2 ${labelClass}`}>Profile picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    void uploadAvatar(f);
                    e.currentTarget.value = '';
                  }}
                  className="block w-full text-sm font-semibold text-green-1 dark:text-green-4 file:mr-4 file:py-2.5 file:px-4 file:rounded-2xl file:border-0 file:bg-castleton-green file:text-white file:font-black hover:file:opacity-90"
                />
                <div className="mt-2 text-xs font-semibold text-green-2 dark:text-green-4/80">
                  Stored in Supabase Storage bucket: avatars
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className={`p-6 ${cardClass}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className={labelClass}>Username</div>
                    {!editingUsername ? (
                      <div className="mt-2 text-sm font-bold text-dark-serpent dark:text-white">{profile?.username || '—'}</div>
                    ) : null}
                  </div>
                  {!editingUsername ? (
                    <button
                      type="button"
                      onClick={() => setEditingUsername(true)}
                      className={outlineBtnClass}
                    >
                      Edit
                    </button>
                  ) : null}
                </div>

                {editingUsername ? (
                  <div className="mt-4 space-y-3">
                    <input
                      value={usernameDraft}
                      onChange={e => setUsernameDraft(e.target.value)}
                      className={inputClass}
                      type="text"
                    />
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => void saveUsername()}
                        className={primaryBtnClass}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUsernameDraft(profile?.username ?? '');
                          setEditingUsername(false);
                        }}
                        className={outlineBtnClass}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className={`p-6 ${cardClass}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className={labelClass}>Email</div>
                    {!editingEmail ? (
                      <div className="mt-2 text-sm font-bold text-dark-serpent dark:text-white">{user.email}</div>
                    ) : null}
                  </div>
                  {!editingEmail ? (
                    <button
                      type="button"
                      onClick={() => setEditingEmail(true)}
                      className={outlineBtnClass}
                    >
                      Edit
                    </button>
                  ) : null}
                </div>

                {editingEmail ? (
                  <div className="mt-4 space-y-3">
                    <input
                      value={emailDraft}
                      onChange={e => setEmailDraft(e.target.value)}
                      className={inputClass}
                      type="email"
                      autoComplete="email"
                    />
                    <div className="text-xs font-semibold text-green-2 dark:text-green-4/80">
                      Updating email requires re-verification.
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => void saveEmail()}
                        className={primaryBtnClass}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEmailDraft(user.email ?? '');
                          setEditingEmail(false);
                        }}
                        className={outlineBtnClass}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className={`p-6 ${cardClass}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className={labelClass}>Bio</div>
                    {!editingBio ? (
                      <div className="mt-2 text-sm font-bold text-dark-serpent dark:text-white whitespace-pre-wrap">
                        {profile?.bio || '—'}
                      </div>
                    ) : null}
                  </div>
                  {!editingBio ? (
                    <button
                      type="button"
                      onClick={() => setEditingBio(true)}
                      className={outlineBtnClass}
                    >
                      Edit
                    </button>
                  ) : null}
                </div>

                {editingBio ? (
                  <div className="mt-4 space-y-3">
                    <textarea
                      value={bioDraft}
                      onChange={e => setBioDraft(e.target.value)}
                      className={`${inputClass} min-h-[120px]`}
                      maxLength={200}
                    />
                    <div className="text-xs font-semibold text-green-2 dark:text-green-4/80">{bioDraft.length}/200</div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => void saveBio()}
                        className={primaryBtnClass}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBioDraft(profile?.bio ?? '');
                          setEditingBio(false);
                        }}
                        className={outlineBtnClass}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className={`p-6 ${cardClass}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className={labelClass}>Password</div>
                    {!editingPassword ? (
                      <div className="mt-2 text-sm font-bold text-dark-serpent dark:text-white">••••••••</div>
                    ) : null}
                  </div>
                  {!editingPassword ? (
                    <button
                      type="button"
                      onClick={() => setEditingPassword(true)}
                      className={outlineBtnClass}
                    >
                      Edit
                    </button>
                  ) : null}
                </div>

                {editingPassword ? (
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <input
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className={inputClass}
                      type="password"
                      placeholder="Current password"
                      autoComplete="current-password"
                    />
                    <input
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className={inputClass}
                      type="password"
                      placeholder="New password"
                      autoComplete="new-password"
                    />
                    <input
                      value={confirmNewPassword}
                      onChange={e => setConfirmNewPassword(e.target.value)}
                      className={inputClass}
                      type="password"
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                    />
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => void savePassword()}
                        className={primaryBtnClass}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPassword(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmNewPassword('');
                        }}
                        className={outlineBtnClass}
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="text-xs font-semibold text-green-2 dark:text-green-4/80">
                      Changing password requires your current password.
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
