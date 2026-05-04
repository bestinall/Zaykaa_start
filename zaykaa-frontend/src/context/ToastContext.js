import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../utils/cn';

const ToastContext = createContext(null);

const variants = {
  success: {
    container:
      'border-emerald-300/90 bg-emerald-50/98 text-emerald-950 shadow-[0_20px_48px_rgba(6,95,70,0.18)] dark:border-emerald-400/45 dark:bg-emerald-950/96 dark:text-emerald-50',
    description: 'text-emerald-900 dark:text-emerald-100/92',
    accent: 'bg-emerald-600 dark:bg-emerald-300',
    close:
      'border-emerald-300/80 bg-white/75 text-emerald-900 hover:bg-white dark:border-emerald-400/25 dark:bg-white/10 dark:text-emerald-100 dark:hover:bg-white/16',
  },
  info: {
    container:
      'border-slate-300/90 bg-white/98 text-slate-950 shadow-[0_20px_48px_rgba(15,23,42,0.16)] dark:border-slate-600/85 dark:bg-slate-950/96 dark:text-slate-50',
    description: 'text-slate-700 dark:text-slate-200/92',
    accent: 'bg-sky-600 dark:bg-sky-300',
    close:
      'border-slate-300/80 bg-slate-50/90 text-slate-700 hover:bg-white hover:text-slate-950 dark:border-slate-600/70 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/16 dark:hover:text-white',
  },
  error: {
    container:
      'border-rose-300/90 bg-rose-50/98 text-rose-950 shadow-[0_20px_48px_rgba(159,18,57,0.18)] dark:border-rose-400/45 dark:bg-rose-950/96 dark:text-rose-50',
    description: 'text-rose-900 dark:text-rose-100/92',
    accent: 'bg-rose-600 dark:bg-rose-300',
    close:
      'border-rose-300/80 bg-white/75 text-rose-900 hover:bg-white dark:border-rose-400/25 dark:bg-white/10 dark:text-rose-100 dark:hover:bg-white/16',
  },
};

const ToastItem = ({ toast, onClose }) => {
  const variant = variants[toast.variant] || variants.info;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      onClose(toast.id);
    }, toast.duration ?? 3600);

    return () => window.clearTimeout(timeout);
  }, [toast, onClose]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.96 }}
      transition={{ duration: 0.22 }}
      role="status"
      aria-live="polite"
      className={cn(
        'w-full max-w-sm rounded-[1.75rem] border px-4 py-4 backdrop-blur-2xl',
        variant.container
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('mt-1 h-2.5 w-2.5 shrink-0 rounded-full', variant.accent)} />
        <div className="min-w-0 flex-1">
          {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
          {toast.description && (
            <p className={cn('mt-1 text-sm leading-6', variant.description)}>{toast.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onClose(toast.id)}
          className={cn('rounded-full border p-1.5 transition', variant.close)}
          aria-label="Close notification"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
            <path d="M5.22 5.22a.75.75 0 0 1 1.06 0L10 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L11.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 0 1 0-1.06Z" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((toast) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((currentToasts) => [...currentToasts, { id, variant: 'info', ...toast }]);
    return id;
  }, []);

  const value = useMemo(
    () => ({
      addToast: pushToast,
      removeToast,
      success: (title, description) => pushToast({ title, description, variant: 'success' }),
      error: (title, description) => pushToast({ title, description, variant: 'error' }),
      info: (title, description) => pushToast({ title, description, variant: 'info' }),
    }),
    [pushToast, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 top-4 z-[80] flex justify-end sm:inset-x-6">
        <div className="pointer-events-auto flex w-full max-w-sm flex-col gap-3">
          <AnimatePresence initial={false}>
            {toasts.map((toast) => (
              <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
};
