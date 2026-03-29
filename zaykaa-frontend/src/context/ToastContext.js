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
  success:
    'border-emerald-200/70 bg-emerald-50/90 text-emerald-950 dark:border-emerald-500/20 dark:bg-emerald-500/12 dark:text-emerald-50',
  info: 'border-slate-200/70 bg-white/90 text-slate-900 dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-50',
  error:
    'border-rose-200/70 bg-rose-50/90 text-rose-950 dark:border-rose-500/20 dark:bg-rose-500/12 dark:text-rose-50',
};

const ToastItem = ({ toast, onClose }) => {
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
      className={cn(
        'w-full max-w-sm rounded-[1.75rem] border px-4 py-4 shadow-glow backdrop-blur-2xl',
        variants[toast.variant] || variants.info
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />
        <div className="min-w-0 flex-1">
          {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
          {toast.description && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{toast.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onClose(toast.id)}
          className="rounded-full border border-black/5 p-1 text-slate-500 transition hover:text-slate-900 dark:border-white/10 dark:text-slate-300 dark:hover:text-white"
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
