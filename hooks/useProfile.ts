import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';

const PROFILE_REFRESH_EVENT = 'lifewood:profile-refresh';

// Module-level cache so AdminProtectedRoute doesn't flash blank on every route change
let _cachedProfile: Profile | null = null;
let _cachedAvatarSrc: string | null = null;

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  updated_at: string | null;
};

type UseProfileResult = {
  loading: boolean;
  profile: Profile | null;
  avatarSrc: string | null;
  displayName: string | null;
  isAdmin: boolean;
};

function emailPrefix(email: string | null | undefined) {
  if (!email) return null;
  return email.split('@')[0] || null;
}

export function useProfile(): UseProfileResult {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(_cachedProfile);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(_cachedAvatarSrc);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const handleRefresh = () => setRefreshToken(token => token + 1);
    window.addEventListener(PROFILE_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(PROFILE_REFRESH_EVENT, handleRefresh);
  }, []);

  useEffect(() => {
    if (authLoading) {
      setLoading(profile ? false : true);
      return;
    }

    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      setProfile(null);
      setAvatarSrc(null);
      _cachedProfile = null;
      _cachedAvatarSrc = null;
      return;
    }

    let cancelled = false;
    const supabase = getSupabase();
    const hasCachedProfile = profile?.id === user.id;

    const run = async () => {
      try {
        setLoading(!hasCachedProfile);
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            username,
            avatar_url,
            is_admin,
            updated_at
          `)
          .eq('id', user.id)
          .single();

        if (cancelled) return;
        if (error) throw error;

        _cachedProfile = data;
        setProfile(data);

        if (data.avatar_url) {
          const { data: signed, error: signedError } = await supabase.storage
            .from('avatars')
            .createSignedUrl(data.avatar_url, 60 * 60);
          if (signedError) throw signedError;
          if (!cancelled) {
            _cachedAvatarSrc = signed.signedUrl;
            setAvatarSrc(signed.signedUrl);
          }
        } else {
          _cachedAvatarSrc = null;
          setAvatarSrc(null);
        }
      } catch {
        if (!cancelled && !hasCachedProfile) {
          setProfile(null);
          setAvatarSrc(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [authLoading, profile?.id, refreshToken, user?.id]);

  const displayName = useMemo(() => {
    if (!user) return null;
    return (profile?.username?.trim() || emailPrefix(user.email)) ?? null;
  }, [profile?.username, user]);

  const isAdmin = profile?.is_admin ?? false;

  return { loading, profile, avatarSrc, displayName, isAdmin };
}
