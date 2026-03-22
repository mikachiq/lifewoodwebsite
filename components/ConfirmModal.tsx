import React from 'react';
import { createPortal } from 'react-dom';

interface ConfirmModalProps {
  open: boolean;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(10,22,18,0.55)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white dark:bg-[#0d1f18] rounded-[28px] shadow-2xl border border-paper dark:border-green-900/40 w-full max-w-sm mx-4 p-8 flex flex-col gap-6">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-saffron/10'}`}>
          {danger ? (
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-castleton-green dark:text-saffron" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Message */}
        <p className="text-center text-base font-bold text-dark-serpent dark:text-white leading-snug">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-full border-2 border-paper dark:border-green-800 text-dark-serpent dark:text-white font-black text-sm hover:bg-paper dark:hover:bg-green-900/40 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-full font-black text-sm transition-all shadow-lg ${
              danger
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-saffron hover:bg-earth-yellow text-dark-serpent'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Hook for imperative usage: const confirmed = await confirm('Are you sure?')
export function useConfirm() {
  const [state, setState] = React.useState<{
    open: boolean;
    message: string;
    confirmLabel: string;
    danger: boolean;
    resolve: ((v: boolean) => void) | null;
  }>({ open: false, message: '', confirmLabel: 'Confirm', danger: false, resolve: null });

  const confirm = React.useCallback(
    (message: string, options?: { confirmLabel?: string; danger?: boolean }) =>
      new Promise<boolean>(resolve => {
        setState({
          open: true,
          message,
          confirmLabel: options?.confirmLabel ?? 'Confirm',
          danger: options?.danger ?? false,
          resolve,
        });
      }),
    []
  );

  const handleConfirm = () => {
    state.resolve?.(true);
    setState(s => ({ ...s, open: false, resolve: null }));
  };

  const handleCancel = () => {
    state.resolve?.(false);
    setState(s => ({ ...s, open: false, resolve: null }));
  };

  const modal = (
    <ConfirmModal
      open={state.open}
      message={state.message}
      confirmLabel={state.confirmLabel}
      danger={state.danger}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, modal };
}
