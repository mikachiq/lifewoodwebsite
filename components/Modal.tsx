import React, { useEffect } from 'react';

export default function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2500]" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />

      <div className="relative min-h-full flex items-center justify-center p-4">
        <div className="w-full max-w-3xl">
          <div className="bg-paper/20 dark:bg-white/5 p-1.5 rounded-[44px] shadow-3xl border border-paper dark:border-green-900/30">
            <div className="bg-paper/60 dark:bg-dark-serpent/50 rounded-[40px] relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-castleton-green/10 dark:bg-saffron/10 rounded-full blur-[40px]" />
              <div className="relative">
                <div className="flex items-start justify-between gap-6 p-6 border-b border-paper dark:border-green-900/30">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/70 dark:bg-green-900/20 border border-paper dark:border-green-800 flex items-center justify-center text-xl">
                      {'\u{1F4C4}'}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-dark-serpent dark:text-white tracking-tight leading-none">
                        {title}
                      </h3>
                      <p className="text-xs font-bold text-green-1 dark:text-green-3 mt-1 opacity-90">
                        Lifewood Data Technology
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-10 h-10 rounded-2xl bg-white/70 dark:bg-green-900/20 border border-paper dark:border-green-800 text-dark-serpent dark:text-white font-black hover:opacity-80 transition-opacity"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-auto">{children}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
