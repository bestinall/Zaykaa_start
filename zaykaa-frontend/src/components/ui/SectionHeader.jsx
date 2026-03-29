import React from 'react';
import { cn } from '../../utils/cn';

const SectionHeader = ({ eyebrow, title, description, action, className }) => (
  <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
    <div className="max-w-2xl">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">{eyebrow}</p>
      )}
      {title && <h2 className="mt-3 font-display text-3xl text-slate-950 dark:text-white">{title}</h2>}
      {description && (
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
      )}
    </div>
    {action}
  </div>
);

export default SectionHeader;
