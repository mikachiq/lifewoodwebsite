import React, { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../components/AuthProvider';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { LIFWOOD_TERMS_TEXT, LIFWOOD_TERMS_TITLE } from '../lib/terms';
import { isValidEmail, passwordMeetsRules } from '../lib/validation';

type Field =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'terms';

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
};

export default function SignupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const [stage, setStage] = useState<'form' | 'verify'>(() => 'form');
  const [termsOpen, setTermsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  });

  const [touched, setTouched] = useState<Record<Field, boolean>>({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
    terms: false,
  });

  const validate = useMemo(() => {
    const errors: Partial<Record<Field, string>> = {};

    if (!form.firstName.trim()) errors.firstName = 'First name is required.';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required.';
    if (!form.email.trim()) errors.email = 'Email is required.';
    else if (!isValidEmail(form.email.trim())) errors.email = 'Enter a valid email (e.g. user@example.com).';

    if (!form.password) errors.password = 'Password is required.';
    else if (!passwordMeetsRules(form.password))
      errors.password = 'Password must be at least 8 characters and include 1 uppercase letter and 1 number.';

    if (!form.confirmPassword) errors.confirmPassword = 'Confirm your password.';
    else if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.';

    if (!form.terms) errors.terms = 'You must agree to the Terms & Conditions.';

    return errors;
  }, [form]);

  const errorFor = (field: Field) => (touched[field] ? validate[field] : undefined);

  if (user) return <Navigate to="/profile" replace />;

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

  if (stage === 'verify') {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-16 bg-white dark:bg-[#0a1612]">
        <div className="w-full max-w-xl bg-paper/20 dark:bg-white/5 p-1.5 rounded-[44px] shadow-3xl border border-paper dark:border-green-900/30">
          <div className="bg-paper/60 dark:bg-dark-serpent/50 rounded-[40px] p-8 md:p-10">
            <h1 className="text-2xl font-black text-dark-serpent dark:text-white">Verify your email</h1>
            <p className="mt-3 text-sm font-bold text-green-1 dark:text-green-3">
            A verification link has been sent to your email. Please verify to continue.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-saffron text-dark-serpent font-black rounded-full hover:bg-earth-yellow transition-all shadow-xl hover:-translate-y-0.5"
              >
                Go to login
              </button>
              <Link
                to="/"
                className="px-8 py-4 border-2 border-castleton-green/30 dark:border-saffron/30 text-castleton-green dark:text-saffron font-black rounded-full hover:bg-castleton-green dark:hover:bg-saffron hover:text-white dark:hover:text-dark-serpent transition-all shadow-lg hover:-translate-y-0.5 text-center"
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true,
      terms: true,
    });

    if (Object.keys(validate).length > 0) return;

    try {
      setSubmitting(true);
      const supabase = getSupabase();
      const emailRedirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          emailRedirectTo,
          data: {
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            full_name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
            username: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
          },
        },
      });

      if (error) throw error;
      setStage('verify');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed. Please try again.';
      pushToast({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] px-4 py-16 flex items-center justify-center bg-white dark:bg-[#0a1612]">
      <div className="w-full max-w-2xl">
        <div className="bg-paper/20 dark:bg-white/5 p-1.5 rounded-[44px] shadow-3xl border border-paper dark:border-green-900/30">
          <div className="bg-paper/60 dark:bg-dark-serpent/50 rounded-[40px] p-8 md:p-10 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-castleton-green/10 dark:bg-saffron/10 rounded-full blur-[40px]" />
            <div className="relative">
              <div className="flex items-start justify-between gap-6 pb-6 border-b border-paper dark:border-green-900/30 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/70 dark:bg-green-900/20 border border-paper dark:border-green-800 flex items-center justify-center text-xl">
                    {'\u{1F511}'}
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-black text-dark-serpent dark:text-white tracking-tight leading-none">
                      Create your account
                    </h1>
                    <p className="mt-1 text-sm font-bold text-green-1 dark:text-green-3 opacity-90">
                      Lifewood Data Technology — secure access to your portal.
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

              <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85 mb-2">
                  First name
                </label>
                <input
                  value={form.firstName}
                  onChange={e => setForm(prev => ({ ...prev, firstName: e.target.value }))}
                  onBlur={() => setTouched(prev => ({ ...prev, firstName: true }))}
                  className="w-full px-4 py-3 border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] text-dark-serpent dark:text-white rounded-2xl focus:border-castleton-green dark:focus:border-saffron focus:outline-none transition-colors text-sm font-semibold placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs"
                  type="text"
                  autoComplete="given-name"
                  required
                />
                {errorFor('firstName') ? (
                  <div className="mt-2 text-xs font-bold text-red-700 dark:text-red-200">{errorFor('firstName')}</div>
                ) : null}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85 mb-2">
                  Last name
                </label>
                <input
                  value={form.lastName}
                  onChange={e => setForm(prev => ({ ...prev, lastName: e.target.value }))}
                  onBlur={() => setTouched(prev => ({ ...prev, lastName: true }))}
                  className="w-full px-4 py-3 border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] text-dark-serpent dark:text-white rounded-2xl focus:border-castleton-green dark:focus:border-saffron focus:outline-none transition-colors text-sm font-semibold placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs"
                  type="text"
                  autoComplete="family-name"
                  required
                />
                {errorFor('lastName') ? (
                  <div className="mt-2 text-xs font-bold text-red-700 dark:text-red-200">{errorFor('lastName')}</div>
                ) : null}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85 mb-2">
                Email address
              </label>
              <input
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                className="w-full px-4 py-3 border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] text-dark-serpent dark:text-white rounded-2xl focus:border-castleton-green dark:focus:border-saffron focus:outline-none transition-colors text-sm font-semibold placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs"
                type="email"
                autoComplete="email"
                required
              />
              {errorFor('email') ? (
                <div className="mt-2 text-xs font-bold text-red-700 dark:text-red-200">{errorFor('email')}</div>
              ) : null}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85 mb-2">
                Password
              </label>
              <input
                value={form.password}
                onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                className="w-full px-4 py-3 border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] text-dark-serpent dark:text-white rounded-2xl focus:border-castleton-green dark:focus:border-saffron focus:outline-none transition-colors text-sm font-semibold placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs"
                type="password"
                autoComplete="new-password"
                required
              />
              {errorFor('password') ? (
                <div className="mt-2 text-xs font-bold text-red-700 dark:text-red-200">{errorFor('password')}</div>
              ) : (
                <div className="mt-2 text-xs font-semibold text-green-2 dark:text-green-4/80">
                  At least 8 characters, 1 uppercase letter, 1 number.
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-green-2 dark:text-green-4 uppercase tracking-wider opacity-85 mb-2">
                Confirm password
              </label>
              <input
                value={form.confirmPassword}
                onChange={e => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                className="w-full px-4 py-3 border-2 border-paper dark:border-green-800 bg-white/80 dark:bg-[#0a1612] text-dark-serpent dark:text-white rounded-2xl focus:border-castleton-green dark:focus:border-saffron focus:outline-none transition-colors text-sm font-semibold placeholder-green-2/50 dark:placeholder-green-4/50 placeholder:text-xs"
                type="password"
                autoComplete="new-password"
                required
              />
              {errorFor('confirmPassword') ? (
                <div className="mt-2 text-xs font-bold text-red-700 dark:text-red-200">{errorFor('confirmPassword')}</div>
              ) : null}
            </div>

            <div className="bg-white/70 dark:bg-green-900/20 py-3 px-4 rounded-2xl border border-paper dark:border-green-800">
              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-3 cursor-pointer select-none leading-none">
                  <input
                    type="checkbox"
                    checked={form.terms}
                    onChange={e => setForm(prev => ({ ...prev, terms: e.target.checked }))}
                    onBlur={() => setTouched(prev => ({ ...prev, terms: true }))}
                    className="w-4 h-4 accent-castleton-green dark:accent-saffron"
                  />
                  <span className="text-sm font-bold text-dark-serpent dark:text-white leading-none">
                    I agree to Terms &amp; Conditions
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setTermsOpen(true)}
                  className="w-10 h-10 rounded-2xl bg-white/70 dark:bg-green-900/20 border border-paper dark:border-green-800 text-dark-serpent dark:text-white font-black hover:opacity-80 transition-opacity flex items-center justify-center"
                  aria-label="View Terms & Conditions"
                  title="View Terms & Conditions"
                >
                  ?
                </button>
              </div>
              {errorFor('terms') ? (
                <div className="mt-2 text-xs font-bold text-red-700 dark:text-red-200">{errorFor('terms')}</div>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-5 bg-saffron text-dark-serpent font-black text-xl rounded-full hover:bg-earth-yellow hover:-translate-y-1 transition-all shadow-2xl shadow-saffron/20 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {submitting ? 'Creating…' : 'Create account'}
            </button>

            <div className="text-sm font-semibold text-green-1 dark:text-green-4">
              Already have an account?{' '}
              <Link to="/login" className="font-black text-castleton-green dark:text-saffron hover:opacity-80 transition-opacity">
                Log in
              </Link>
            </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Modal open={termsOpen} title={LIFWOOD_TERMS_TITLE} onClose={() => setTermsOpen(false)}>
        <div className="whitespace-pre-wrap text-sm font-medium text-green-1 dark:text-green-4 leading-relaxed">
          {LIFWOOD_TERMS_TEXT}
        </div>
      </Modal>
    </div>
  );
}
