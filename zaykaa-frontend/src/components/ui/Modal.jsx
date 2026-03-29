import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const sizeClasses = {
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-5xl',
};

const Modal = ({ isOpen, onClose, title, description, size = 'lg', children }) => {
  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/50 p-4 backdrop-blur-md sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.24 }}
            onClick={(event) => event.stopPropagation()}
            className={cn(
              'glass-panel relative max-h-[90vh] w-full overflow-hidden rounded-[2rem] border border-white/60 bg-white/90 shadow-elevated dark:border-white/10 dark:bg-[#121218]/95',
              sizeClasses[size] || sizeClasses.lg
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-black/5 px-6 py-5 dark:border-white/10">
              <div>
                {title && <h2 className="font-display text-2xl text-slate-950 dark:text-white">{title}</h2>}
                {description && (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-black/5 p-2 text-slate-500 transition hover:text-slate-900 dark:border-white/10 dark:text-slate-300 dark:hover:text-white"
                aria-label="Close modal"
              >
                <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current">
                  <path d="M5.22 5.22a.75.75 0 0 1 1.06 0L10 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L11.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 0 1 0-1.06Z" />
                </svg>
              </button>
            </div>
            <div className="max-h-[calc(90vh-96px)] overflow-y-auto px-6 py-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
