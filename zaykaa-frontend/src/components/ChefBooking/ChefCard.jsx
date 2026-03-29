import React from 'react';
import { motion } from 'framer-motion';
import SmartImage from '../ui/SmartImage';
import { formatCurrency } from '../../utils/display';

const ChefCard = ({ chef, onSelect }) => {
  const specialties = chef.specialties?.length ? chef.specialties.slice(0, 3) : ['Curated menus'];

  return (
    <motion.article
      whileHover={{ y: -8 }}
      transition={{ duration: 0.22 }}
      className="group overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 shadow-soft backdrop-blur-2xl dark:border-white/10 dark:bg-[#17171d]/80"
    >
      <div className="relative h-72 overflow-hidden">
        <SmartImage
          src={chef.image}
          alt={chef.name}
          fallbackText={chef.name}
          className="h-full w-full"
          imageClassName="group-hover:scale-105"
        />
        <div className="absolute left-4 top-4 inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-slate-900 shadow-soft backdrop-blur-xl dark:bg-slate-950/70 dark:text-white">
          {Number(chef.rating || 0).toFixed(1)} rating
        </div>
        <div className="absolute bottom-4 left-4 inline-flex items-center rounded-full bg-slate-950/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-xl">
          {chef.availabilityText || 'Available on request'}
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{chef.location || 'Private dining specialist'}</p>
            <h3 className="mt-2 font-display text-3xl text-slate-950 dark:text-white">{chef.name}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {chef.bio || `${chef.reviews || 0} reviews`}
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-slate-900/5 px-4 py-3 text-right dark:bg-white/5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Starting
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
              {formatCurrency(chef.hourlyRate)}/hr
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[chef.cuisine, ...specialties].filter(Boolean).slice(0, 4).map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-white/60 bg-white/80 px-3 py-1.5 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            >
              {chip}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {chef.availableDays || 'Flexible schedule available'}
          </p>
          <button
            type="button"
            onClick={() => onSelect(chef)}
            className="inline-flex items-center rounded-2xl bg-gradient-to-r from-brand via-orange-500 to-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-105"
          >
            Book chef
          </button>
        </div>
      </div>
    </motion.article>
  );
};

export default ChefCard;
