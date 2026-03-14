import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useToast } from '../components/ToastProvider';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();

  useEffect(() => {
    const run = async () => {
      try {
        if (!isSupabaseConfigured) {
          throw new Error('Supabase is not configured.');
        }
        const supabase = getSupabase();

        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          pushToast({ type: 'success', message: 'Email verified.' });
          navigate('/profile', { replace: true });
          return;
        }

        navigate('/login', { replace: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Authentication failed.';
        pushToast({ type: 'error', message });
        navigate('/login', { replace: true, state: { message } });
      }
    };

    run();
  }, [navigate, pushToast]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="text-sm font-bold text-slate-600">Finishing sign-in…</div>
    </div>
  );
}
