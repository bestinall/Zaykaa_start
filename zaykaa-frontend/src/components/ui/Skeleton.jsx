import React from 'react';
import { cn } from '../../utils/cn';

const Skeleton = ({ className }) => (
  <div
    className={cn(
      'animate-pulseSoft rounded-2xl bg-gradient-to-r from-slate-200/60 via-white/80 to-slate-200/60 dark:from-white/5 dark:via-white/10 dark:to-white/5',
      className
    )}
  />
);

export const SkeletonCard = ({ className }) => (
  <div
    className={cn(
      'glass-panel rounded-4xl border border-white/60 bg-white/70 p-5 shadow-soft dark:border-white/10 dark:bg-white/5',
      className
    )}
  >
    <Skeleton className="h-40 w-full rounded-3xl" />
    <Skeleton className="mt-4 h-4 w-24" />
    <Skeleton className="mt-3 h-7 w-2/3" />
    <Skeleton className="mt-3 h-4 w-full" />
    <Skeleton className="mt-2 h-4 w-5/6" />
    <Skeleton className="mt-5 h-11 w-32 rounded-2xl" />
  </div>
);

export default Skeleton;
