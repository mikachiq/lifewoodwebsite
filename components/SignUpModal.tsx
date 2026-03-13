import React, { useEffect, useMemo, useState } from 'react';
import { TranslationSet } from '../types';

interface SignUpModalProps {
  open: boolean;
  onClose: () => void;
  translations: TranslationSet;
}

type FormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  status: 'idle' | 'success' | 'error';
  error?: string;
};

const SignUpModal: React.FC<SignUpModalProps> = ({ open, onClose, translations }) => {
  const initialState = useMemo<FormState>(
    () => ({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      status: 'idle',
    }),
    []
  );

  const [form, setForm] = useState<FormState>(initialState);

  const title = translations.signupTitle || 'Create account';
  const subtitle = translations.signupSubtitle || 'Sign up to get started.';
  const submitLabel = translations.signupSubmit || 'Create account';
  const requiredError = translations.signupErrorRequired || 'Please fill in all required fields.';
  const passwordMismatchError = translations.signupErrorPasswordMismatch || 'Passwords do not match.';

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setForm(initialState);
  }, [open, initialState]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    const nameOk = form.name.trim().length > 0;
    const emailOk = form.email.trim().length > 0;
    const passwordOk = form.password.trim().length > 0;
    const confirmOk = form.confirmPassword.trim().length > 0;

    if (!nameOk || !emailOk || !passwordOk || !confirmOk) {
      setForm(prev => ({ ...prev, status: 'error', error: requiredError }));
      return;
    }

    if (form.password !== form.confirmPassword) {
      setForm(prev => ({ ...prev, status: 'error', error: passwordMismatchError }));
      return;
    }

    setForm(prev => ({ ...prev, status: 'success', error: undefined }));
  };

  const Field = ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <label className="block">
      <span className="block text-xs font-black uppercase tracking-widest text-green-1 dark:text-green-4/80 mb-2">
        {label}
      </span>
      {children}
    </label>
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000]" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        onClick={onClose}
        aria-label={translations.closeLabel || 'Close'}
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
      />

      <div className="relative min-h-full flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          <div className="bg-paper/20 dark:bg-white/5 p-1.5 rounded-[44px] shadow-3xl border border-paper dark:border-green-900/30">
            <div className="bg-paper/60 dark:bg-dark-serpent/50 rounded-[40px] p-8 md:p-10 relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-castleton-green/10 dark:bg-saffron/10 rounded-full blur-[40px]" />

              <div className="relative">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/70 dark:bg-green-900/20 border border-paper dark:border-green-800 flex items-center justify-center text-xl">
                      {'\u{1F511}'}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-dark-serpent dark:text-white tracking-tight leading-none">
                        {title}
                      </h3>
                      <p className="text-sm font-bold text-green-1 dark:text-green-3 mt-1">
                        {subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {form.status === 'success' && (
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-castleton-green/10 dark:bg-saffron/10 text-castleton-green dark:text-saffron border border-current/30 whitespace-nowrap">
                        {translations.signupStatusSuccess || 'Created'}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-10 h-10 rounded-2xl bg-white/70 dark:bg-green-900/20 border border-paper dark:border-green-800 text-dark-serpent dark:text-white font-black hover:opacity-80 transition-opacity"
                      aria-label={translations.closeLabel || 'Close'}
                    >
                      {'\u00D7'}
                    </button>
                  </div>
                </div>

                <form onSubmit={submit} className="space-y-5">
                  <Field label={translations.signupNameLabel || 'Name'}>
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm(prev => ({ ...prev, name: e.target.value, status: 'idle', error: undefined }))
                      }
                      type="text"
                      autoComplete="name"
                      placeholder={translations.signupNamePlaceholder || 'Your name'}
                      className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-[#0a1612] border-2 border-paper dark:border-green-800 focus:outline-none focus:border-castleton-green dark:focus:border-saffron transition-colors text-dark-serpent dark:text-white font-semibold"
                      required
                    />
                  </Field>

                  <Field label={translations.signupEmailLabel || 'Email'}>
                    <input
                      value={form.email}
                      onChange={(e) =>
                        setForm(prev => ({ ...prev, email: e.target.value, status: 'idle', error: undefined }))
                      }
                      type="email"
                      autoComplete="email"
                      placeholder={translations.signupEmailPlaceholder || 'name@company.com'}
                      className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-[#0a1612] border-2 border-paper dark:border-green-800 focus:outline-none focus:border-castleton-green dark:focus:border-saffron transition-colors text-dark-serpent dark:text-white font-semibold"
                      required
                    />
                  </Field>

                  <Field label={translations.signupPasswordLabel || 'Password'}>
                    <input
                      value={form.password}
                      onChange={(e) =>
                        setForm(prev => ({ ...prev, password: e.target.value, status: 'idle', error: undefined }))
                      }
                      type="password"
                      autoComplete="new-password"
                      placeholder={translations.signupPasswordPlaceholder || '••••••••'}
                      className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-[#0a1612] border-2 border-paper dark:border-green-800 focus:outline-none focus:border-castleton-green dark:focus:border-saffron transition-colors text-dark-serpent dark:text-white font-semibold"
                      required
                    />
                  </Field>

                  <Field label={translations.signupConfirmPasswordLabel || 'Confirm password'}>
                    <input
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm(prev => ({ ...prev, confirmPassword: e.target.value, status: 'idle', error: undefined }))
                      }
                      type="password"
                      autoComplete="new-password"
                      placeholder={translations.signupConfirmPasswordPlaceholder || '••••••••'}
                      className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-[#0a1612] border-2 border-paper dark:border-green-800 focus:outline-none focus:border-castleton-green dark:focus:border-saffron transition-colors text-dark-serpent dark:text-white font-semibold"
                      required
                    />
                  </Field>

                  {form.status === 'error' && (
                    <div className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-200 text-sm font-bold">
                      {form.error || requiredError}
                    </div>
                  )}

                  {form.status === 'success' && (
                    <div className="px-4 py-3 rounded-2xl bg-castleton-green/10 dark:bg-saffron/10 border border-current/20 text-castleton-green dark:text-saffron text-sm font-bold">
                      {translations.signupSuccessMsg ||
                        'Account captured (demo). Hook this up to your auth backend when ready.'}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full mt-2 px-8 py-4 rounded-full font-black text-lg bg-saffron text-dark-serpent hover:bg-earth-yellow transition-all shadow-xl hover:-translate-y-0.5"
                  >
                    {submitLabel}
                  </button>

                  <p className="text-[11px] leading-relaxed font-semibold text-green-1/80 dark:text-green-4/70">
                    {translations.signupDisclaimer ||
                      'Note: This is a front-end form only. Add your auth API to create accounts.'}
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpModal;

