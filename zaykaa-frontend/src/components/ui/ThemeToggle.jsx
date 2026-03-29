import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';

const SunIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
    <path d="M20.3 14.6A8.8 8.8 0 1 1 9.4 3.7a7.2 7.2 0 1 0 10.9 10.9Z" />
  </svg>
);

const ThemeToggle = ({ className }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={toggleTheme}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-soft backdrop-blur-xl transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/10',
        className
      )}
      aria-label="Toggle theme"
    >
      <span className="text-brand">{isDark ? <MoonIcon /> : <SunIcon />}</span>
      <span>{isDark ? 'Dark' : 'Light'}</span>
    </motion.button>
  );
};

export default ThemeToggle;
