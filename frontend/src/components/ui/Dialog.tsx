import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// ============================================================
// Designed dialog system — replaces ALL native alert()/confirm().
// Imperative API so call sites stay one-liners:
//
//   await dialog.success('Saved', 'Your changes were saved.');
//   await dialog.error('Export failed', err.message);
//   const ok = await dialog.confirm({ title: 'Delete?', message: '...' });
//   const sure = await dialog.danger({ title: 'Delete 3 users?', ... });
//
// Mount <DialogProvider /> once in App.tsx.
// Requests queue — rapid sequential calls never overwrite each other.
// ============================================================

export type DialogVariant = 'success' | 'error' | 'info' | 'warning' | 'danger';

export interface DialogOptions {
  title: string;
  message: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
}

interface DialogRequest extends Required<Pick<DialogOptions, 'title' | 'message'>> {
  variant: DialogVariant;
  confirmText: string;
  cancelText: string | null; // null = alert mode (single button)
  resolve: (value: boolean) => void;
}

let pushRequest: ((req: Omit<DialogRequest, 'resolve'>) => Promise<boolean>) | null = null;

function request(opts: DialogOptions, cancelText: string | null, confirmText: string): Promise<boolean> {
  if (!pushRequest) {
    // Provider not mounted (should never happen in-app) — fall back silently
    // eslint-disable-next-line no-console
    console.warn(`[dialog] ${opts.title}: ${opts.message}`);
    return Promise.resolve(cancelText === null);
  }
  return pushRequest({
    title: opts.title,
    message: opts.message,
    variant: opts.variant ?? 'info',
    confirmText: opts.confirmText ?? confirmText,
    cancelText,
  });
}

const asOpts = (title: string, message: string): DialogOptions => ({ title, message });

export const dialog = {
  /** Single-button notice. Resolves when dismissed. */
  alert(opts: DialogOptions | string): Promise<boolean> {
    const o = typeof opts === 'string' ? { title: 'Notice', message: opts } : opts;
    return request(o, null, o.confirmText ?? 'OK');
  },
  success(title: string, message: string): Promise<boolean> {
    return request({ ...asOpts(title, message), variant: 'success' }, null, 'OK');
  },
  error(title: string, message: string): Promise<boolean> {
    return request({ ...asOpts(title, message), variant: 'error' }, null, 'OK');
  },
  info(title: string, message: string): Promise<boolean> {
    return request({ ...asOpts(title, message), variant: 'info' }, null, 'OK');
  },
  /** Two-button question. Resolves true on confirm, false on cancel/dismiss. */
  confirm(opts: DialogOptions): Promise<boolean> {
    return request({ variant: 'warning', ...opts }, opts.cancelText ?? 'Cancel', opts.confirmText ?? 'Confirm');
  },
  /** Destructive question (red confirm button). */
  danger(opts: DialogOptions): Promise<boolean> {
    return request({ variant: 'danger', ...opts }, opts.cancelText ?? 'Cancel', opts.confirmText ?? 'Delete');
  },
};

const VARIANT_STYLE: Record<DialogVariant, { ring: string; bg: string; text: string; Icon: React.FC<{ className?: string }> }> = {
  success: { ring: 'bg-green-100', bg: 'bg-green-500', text: 'text-green-600', Icon: CheckCircleIcon },
  error: { ring: 'bg-red-100', bg: 'bg-red-500', text: 'text-red-600', Icon: ExclamationCircleIcon },
  info: { ring: 'bg-blue-100', bg: 'bg-blue-500', text: 'text-blue-600', Icon: InformationCircleIcon },
  warning: { ring: 'bg-amber-100', bg: 'bg-amber-500', text: 'text-amber-600', Icon: ExclamationTriangleIcon },
  danger: { ring: 'bg-red-100', bg: 'bg-red-600', text: 'text-red-600', Icon: ExclamationTriangleIcon },
};

const CONFIRM_BTN: Record<DialogVariant, string> = {
  success: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
  error: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
  info: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
  warning: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
  danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
};

export const DialogProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const queueRef = useRef<DialogRequest[]>([]);
  queueRef.current = queue;
  const current = queue[0] ?? null;

  const push = useCallback((req: Omit<DialogRequest, 'resolve'>) => {
    return new Promise<boolean>((resolve) => {
      setQueue((q) => [...q, { ...req, resolve }]);
    });
  }, []);

  useEffect(() => {
    pushRequest = push;
    return () => {
      pushRequest = null;
    };
  }, [push]);

  const settle = useCallback((value: boolean) => {
    const [head, ...rest] = queueRef.current;
    if (!head) return;
    head.resolve(value);
    setQueue(rest);
  }, []);

  // Escape dismisses as cancel (alert mode resolves true = acknowledged)
  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') settle(current.cancelText === null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, settle]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = current ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [current]);

  if (!current) return <>{children}</>;
  const style = VARIANT_STYLE[current.variant];
  const { Icon } = style;

  return (
    <>
      {children}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label={current.title}>
        <div
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-fade-in"
          onClick={() => settle(current.cancelText === null)}
        />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
          <div className="flex items-start gap-4 p-6 pb-4">
            <div className={`${style.ring} rounded-full p-2.5 flex-shrink-0`}>
              <Icon className={`h-6 w-6 ${style.text}`} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="text-lg font-bold text-gray-900 leading-snug">{current.title}</h3>
            </div>
            <button
              onClick={() => settle(current.cancelText === null)}
              className="p-1.5 -m-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Close dialog"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="px-6 pb-2 overflow-y-auto">
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line break-words">{current.message}</p>
          </div>
          <div className={`flex gap-3 p-6 pt-4 ${current.cancelText ? 'flex-row' : 'flex-col'}`}>
            {current.cancelText && (
              <button
                onClick={() => settle(false)}
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all text-sm sm:text-base min-h-[44px]"
              >
                {current.cancelText}
              </button>
            )}
            <button
              onClick={() => settle(true)}
              className={`${current.cancelText ? 'flex-1' : 'w-full'} px-4 py-2.5 text-white rounded-xl font-semibold shadow-lg transition-all hover:shadow-xl text-sm sm:text-base min-h-[44px] ${CONFIRM_BTN[current.variant]}`}
            >
              {current.confirmText}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes dialog-scale-in { from { opacity: 0; transform: scale(0.94) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes dialog-fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-scale-in { animation: dialog-scale-in 0.22s ease-out; }
        .animate-fade-in { animation: dialog-fade-in 0.2s ease-out; }
      `}</style>
    </>
  );
};

export default DialogProvider;
