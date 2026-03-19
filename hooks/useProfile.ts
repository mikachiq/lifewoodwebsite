import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';

// Local type extended from types.ts Profile
export type Profile = {
  id: string;
  username: string | null;
  bio: string | null;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      setProfile(null);
      setAvatarSrc(null);
      return;
    }

    let cancelled = false;
    const supabase = getSupabase();

    const run = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            username,
            bio,
            avatar_url,
            is_admin,
            updated_at
          `)
          .eq('id', user.id)
          .single();

        if (cancelled) return;
        if (error) throw error;

        setProfile(data);

        if (data.avatar_url) {
          const { data: signed, error: signedError } = await supabase.storage
            .from('avatars')
            .createSignedUrl(data.avatar_url, 60 * 60);
          if (signedError) throw signedError;
          if (!cancelled) setAvatarSrc(signed.signedUrl);
        } else {
          setAvatarSrc(null);
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
          setAvatarSrc(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const displayName = useMemo(() => {
    if (!user) return null;
    return (profile?.username?.trim() || emailPrefix(user.email)) ?? null;
  }, [profile?.username, user]);

  const isAdmin = profile?.is_admin ?? false;

  return { loading, profile, avatarSrc, displayName, isAdmin };
}


