import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const MotionButton = motion.button;

export const buttonStyles = ({
  variant = 'primary',
  size = 'md',
  block = false,
} = {}) => {
  const baseStyles =
    'inline-flex min-h-[42px] items-center justify-center gap-2 whitespace-nowrap text-center rounded-[1.1rem] border font-semibold tracking-[0.01em] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none';

  const variantStyles = {
    primary:
      'border-orange-500/70 bg-gradient-to-r from-brand via-orange-500 to-red-500 text-white shadow-[0_16px_32px_rgba(199,93,42,0.28)] hover:brightness-105 hover:shadow-[0_20px_36px_rgba(199,93,42,0.34)] dark:border-orange-400/35',
    secondary:
      'border-slate-300/90 bg-white/92 text-slate-900 shadow-[0_12px_26px_rgba(15,23,42,0.08)] hover:border-slate-400 hover:bg-white hover:text-slate-950 dark:border-slate-700/90 dark:bg-slate-900/72 dark:text-white dark:hover:border-slate-500 dark:hover:bg-slate-900',
    ghost:
      'border-slate-200/80 bg-white/72 text-slate-700 shadow-[0_10px_22px_rgba(15,23,42,0.05)] hover:border-slate-300 hover:bg-white hover:text-slate-950 dark:border-slate-700/75 dark:bg-slate-900/45 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-900/70 dark:hover:text-white',
    danger:
      'border-rose-300/90 bg-rose-50 text-rose-800 shadow-[0_12px_24px_rgba(190,24,93,0.08)] hover:border-rose-400 hover:bg-rose-100 dark:border-rose-700/70 dark:bg-rose-950/45 dark:text-rose-100 dark:hover:border-rose-500 dark:hover:bg-rose-950/65',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return cn(baseStyles, variantStyles[variant], sizeStyles[size], block && 'w-full');
};

const Button = forwardRef(
  ({ children, className, variant = 'primary', size = 'md', block = false, ...props }, ref) => (
    <MotionButton
      ref={ref}
      whileHover={props.disabled ? undefined : { y: -2 }}
      whileTap={props.disabled ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.18 }}
      className={cn(buttonStyles({ variant, size, block }), className)}
      {...props}
    >
      {children}
    </MotionButton>
  )
);

export default Button;
