import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef();

  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback((next) => {
    clearTimeout(timer.current);
    setToast({ ...next, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), next.duration ?? (next.action ? 5000 : 3000));
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        role="status"
        aria-live="polite"
      >
        {toast && (
          <div
            key={toast.id}
            className={clsx(
              'pointer-events-auto mb-20 flex w-full max-w-sm animate-slide-up items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-lg',
              toast.tone === 'error' ? 'bg-rose-600' : 'bg-ink',
            )}
          >
            <span className="flex-1">{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className="rounded-lg px-2 py-1 font-bold text-brand-300 hover:bg-white/10"
                onClick={() => {
                  toast.action.onClick();
                  dismiss();
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
