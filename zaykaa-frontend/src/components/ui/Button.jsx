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
    'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-60';

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-brand via-orange-500 to-red-500 text-white shadow-glow hover:brightness-105',
    secondary:
      'border border-white/60 bg-white/80 text-slate-900 shadow-soft hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/10',
    ghost:
      'text-slate-700 hover:bg-slate-900/5 dark:text-slate-200 dark:hover:bg-white/10',
    danger:
      'border border-rose-300 bg-rose-500/10 text-rose-700 hover:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300',
  };

  const sizeStyles = {
    sm: 'px-3.5 py-2 text-sm',
    md: 'px-4.5 py-3 text-sm',
    lg: 'px-6 py-3.5 text-base',
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
