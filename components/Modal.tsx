import React, { useEffect } from 'react';

export default function Modal({
  open,
  title,
  onClose,
  children,
  instagramStyle = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  instagramStyle?: boolean;
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
        className="absolute inset-0 bg-black/45 backdrop-blur-[6px]"
        aria-label="Close"
        onClick={onClose}
      />

      <div className="relative min-h-full flex items-center justify-center p-4">
        {instagramStyle ? (
          <div className="relative w-[85vw] max-w-[1100px] max-h-[85vh]">
            <div className="rounded-[44px] border border-paper bg-paper/20 p-1.5 shadow-3xl dark:border-green-900/30 dark:bg-white/5">
              <div className="relative overflow-hidden rounded-[40px] bg-paper/45 shadow-[0_24px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl dark:bg-dark-serpent/45">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-4 right-4 z-20 h-10 w-10 rounded-2xl border border-paper bg-white/80 text-dark-serpent font-black shadow-md transition-opacity hover:opacity-80 dark:border-green-800 dark:bg-green-900/25 dark:text-white"
                  aria-label="Close"
                >
                  ×
                </button>
                {children}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-3xl">
            <div className="rounded-[44px] border border-paper bg-paper/20 p-1.5 shadow-3xl dark:border-green-900/30 dark:bg-white/5">
              <div className="relative overflow-hidden rounded-[40px] bg-paper/60 dark:bg-dark-serpent/50">
                <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-castleton-green/10 blur-[40px] dark:bg-saffron/10" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-6 border-b border-paper p-6 dark:border-green-900/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-paper bg-white/70 text-xl dark:border-green-800 dark:bg-green-900/20">
                        {'\u{1F4C4}'}
                      </div>
                      <div>
                        <h3 className="leading-none tracking-tight text-xl font-black text-dark-serpent dark:text-white">
                          {title}
                        </h3>
                        <p className="mt-1 text-xs font-bold text-green-1 opacity-90 dark:text-green-3">
                          Lifewood Data Technology
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onClose}
                      className="h-10 w-10 rounded-2xl border border-paper bg-white/70 font-black text-dark-serpent transition-opacity hover:opacity-80 dark:border-green-800 dark:bg-green-900/20 dark:text-white"
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>

                  <div className="max-h-[70vh] overflow-auto p-6">{children}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
