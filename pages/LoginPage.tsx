import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { useToast } from '../components/ToastProvider';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { isValidEmail } from '../lib/validation';
import { useProfile } from '../hooks/useProfile';

type LocationState = { from?: string; message?: string } | null;

export default function LoginPage() {
  const { user } = useAuth();
  const { loading: profileLoading, isAdmin } = useProfile();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const state = (location.state ?? null) as LocationState;
  const from = '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(state?.message ?? null);

  if (user && !submitting && !profileLoading) {
    return <Navigate to={isAdmin ? '/admin' : '/'} replace />;
  }
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-16 bg-white dark:bg-[#0a1612]">
        <div className="w-full max-w-xl bg-paper/20 dark:bg-white/5 p-1.5 rounded-[44px] shadow-3xl border border-paper dark:border-green-900/30">
          <div className="bg-paper/60 dark:bg-dark-serpent/50 rounded-[40px] p-8 md:p-10">
            <h1 className="text-2xl font-black text-dark-serpent dark:text-white">Supabase not configured</h1>
            <p className="mt-3 text-sm font-bold text-green-1 dark:text-green-3">
            Create a <span className="font-black">.env</span> file and set{' '}
            <span className="font-black">VITE_SUPABASE_URL</span> and <span className="font-black">VITE_SUPABASE_ANON_KEY</span>.
            </p>
            <p className="mt-2 text-xs font-semibold text-green-2 dark:text-green-4/80">
              Use <span className="font-black">.env.example</span> as a template, then restart <span className="font-black">npm run dev</span>.
            </p>
            <div className="mt-6">
              <Link to="/" className="font-black text-castleton-green dark:text-saffron hover:opacity-80 transition-opacity">
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }

    try {
      setSubmitting(true);
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      const signedInUser = data.user;
      if (!signedInUser.email_confirmed_at) {
        await supabase.auth.signOut();
        setError('Please verify your email before logging in.');
        return;
      }

      pushToast({ type: 'success', message: 'Signed in.' });

      // Redirect admins directly to the dashboard
      const supabaseClient = getSupabase();
      const { data: profileData } = await supabaseClient
        .from('profiles')
        .select('is_admin')
        .eq('id', signedInUser.id)
        .single();

      if (profileData?.is_admin) {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) { // ✅ catch block was missing entirely
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
      pushToast({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] px-4 py-16 flex items-center justify-center bg-white dark:bg-[#0a1612]">
      <div className="w-full max-w-xl bg-paper/20 dark:bg-white/5 p-1.5 rounded-[44px] shadow-3xl border border-paper dark:border-green-900/30">
        <div className="bg-paper/60 dark:bg-dark-serpent/50 rounded-[40px] p-8 md:p-10 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-castleton-green/10 dark:bg-saffron/10 rounded-full blur-[40px]" />
          <div className="relative">
            <div className="flex items-start justify-between gap-6 pb-6 border-b border-paper dark:border-green-900/30 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/70 dark:bg-green-900/20 border border-paper dark:border-green-800 flex items-center justify-center text-xl">
                  {'\u{1F512}'}
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-dark-serpent dark:text-white tracking-tight leading-none">
                    Log in
                  </h1>
                  <p className="mt-1 text-sm font-bold text-green-1 dark:text-green-3 opacity-90">
                    Use your verified email to continue.
                  </p>
                </div>
              </div>
              <Link
                to="/"
                className="hidden sm:inline-flex px-5 py-3 border-2 border-castleton-green/20 dark:border-saffron/20 text-castleton-green dark:text-saffron font-black rounded-full hover:bg-castleton-green dark:hover:bg-saffron hover:text-white dark:hover:text-dark-serpent transition-all shadow-lg hover:-translate-y-0.5"
              >
                Home
              </Link>
            </div>

            <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85 mb-2">Email</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] text-dark-serpent dark:text-white rounded-2xl focus:border-castleton-green dark:focus:border-saffron focus:outline-none transition-colors text-sm font-semibold placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs"
              type="email"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85 mb-2">Password</label>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] text-dark-serpent dark:text-white rounded-2xl focus:border-castleton-green dark:focus:border-saffron focus:outline-none transition-colors text-sm font-semibold placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-700 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-5 bg-saffron text-dark-serpent font-black text-xl rounded-full hover:bg-earth-yellow hover:-translate-y-1 transition-all shadow-2xl shadow-saffron/20 disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="text-sm font-semibold text-green-1 dark:text-green-4">
            New here?{' '}
            <Link to="/signup" className="font-black text-castleton-green dark:text-saffron hover:opacity-80 transition-opacity">
              Create an account
            </Link>
          </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
