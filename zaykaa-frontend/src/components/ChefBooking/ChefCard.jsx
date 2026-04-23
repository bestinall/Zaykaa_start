import React from 'react';
import { motion } from 'framer-motion';
import SmartImage from '../ui/SmartImage';
import { formatCurrency } from '../../utils/display';

const Icon = ({ path, className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {path}
  </svg>
);

const icons = {
  star: <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8L6.6 19.7l1-6L3.2 9.4l6.1-.9L12 3z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
};

const ChefCard = ({ chef, onSelect }) => {
  const specialties = chef.specialties?.length ? chef.specialties.slice(0, 3) : ['Curated menus'];

  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group overflow-hidden rounded-[1.4rem] border border-white/60 bg-white/80 shadow-soft hover:shadow-elevated dark:border-white/10 dark:bg-[#17171d]/80"
    >
      <div className="relative h-44 overflow-hidden">
        <SmartImage
          src={chef.image}
          alt={chef.name}
          fallbackText={chef.name}
          className="h-full w-full"
          imageClassName="group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-slate-900 shadow-soft backdrop-blur-xl dark:bg-slate-950/70 dark:text-white">
          <Icon path={icons.star} className="h-2.5 w-2.5 text-amber-500" />
          {Number(chef.rating || 0).toFixed(1)}
        </div>
        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-slate-950/75 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-xl">
          <Icon path={icons.calendar} className="h-2.5 w-2.5" />
          {chef.availabilityText || 'On request'}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{chef.location || 'Private dining'}</p>
            <h3 className="mt-0.5 font-display text-base font-semibold text-slate-950 dark:text-white line-clamp-1">{chef.name}</h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
              {chef.bio || `${chef.reviews || 0} reviews`}
            </p>
          </div>
          <div className="rounded-lg bg-slate-900/5 px-2 py-1.5 text-right dark:bg-white/5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              From
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-950 dark:text-white">
              {formatCurrency(chef.hourlyRate)}/hr
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[chef.cuisine, ...specialties].filter(Boolean).slice(0, 3).map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-white/60 bg-white/80 px-2 py-0.5 text-[10px] text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            >
              {chip}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            {chef.availableDays || 'Flexible'}
          </p>
          <button
            type="button"
            onClick={() => onSelect(chef)}
            className="inline-flex items-center rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-glow transition hover:brightness-105"
          >
            Book
          </button>
        </div>
      </div>
    </motion.article>
  );
};

export default ChefCard;
