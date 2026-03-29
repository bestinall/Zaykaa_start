import React from 'react';
import { cn } from '../../utils/cn';

const FloatingInput = ({
  label,
  className,
  inputClassName,
  as = 'input',
  value,
  rows = 4,
  ...props
}) => {
  const Component = as;
  const hasValue = String(value ?? '').length > 0;

  return (
    <label
      className={cn(
        'group relative flex w-full rounded-[1.6rem] border border-white/60 bg-white/80 px-4 pb-3 pt-6 shadow-soft backdrop-blur-xl transition focus-within:border-brand/60 dark:border-white/10 dark:bg-white/5',
        className
      )}
    >
      <Component
        {...props}
        value={value}
        rows={as === 'textarea' ? rows : undefined}
        placeholder=" "
        className={cn(
          'peer w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-transparent dark:text-white',
          as === 'textarea' ? 'min-h-[120px] resize-none pt-1' : 'h-7',
          inputClassName
        )}
      />
      <span
        className={cn(
          'pointer-events-none absolute left-4 origin-left text-sm font-medium text-slate-500 transition duration-200 dark:text-slate-400',
          hasValue ? 'top-3 scale-90' : 'top-1/2 -translate-y-1/2',
          'peer-focus:top-3 peer-focus:translate-y-0 peer-focus:scale-90 peer-focus:text-brand'
        )}
      >
        {label}
      </span>
    </label>
  );
};

export default FloatingInput;
