import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

export type ToastInput = {
  type: ToastType;
  message: string;
};

type Toast = ToastInput & {
  id: string;
};

type ToastContextValue = {
  pushToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function id() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now());
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((toast: ToastInput) => {
    const toastWithId: Toast = { ...toast, id: id() };
    setToasts(prev => [...prev, toastWithId]);

    window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastWithId.id));
    }, 1800);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[3000] flex flex-col items-end gap-3 max-w-[92vw]">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`inline-flex max-w-[min(92vw,420px)] rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur bg-white/90 ${
              t.type === 'success'
                ? 'border-emerald-500/30 text-emerald-900'
                : t.type === 'error'
                  ? 'border-red-500/30 text-red-900'
                  : 'border-slate-500/30 text-slate-900'
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="text-sm font-bold">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
