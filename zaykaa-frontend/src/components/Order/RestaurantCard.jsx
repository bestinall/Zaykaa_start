import React from 'react';
import { motion } from 'framer-motion';
import SmartImage from '../ui/SmartImage';
import { formatCurrency } from '../../utils/display';

const Icon = ({ path, className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {path}
  </svg>
);

const icons = {
  star: <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8L6.6 19.7l1-6L3.2 9.4l6.1-.9L12 3z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  arrowRight: <><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>,
};

const RestaurantCard = ({ restaurant, onSelect, isActive }) => (
  <motion.button
    type="button"
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.99 }}
    onClick={() => onSelect(restaurant)}
    className={`group w-full overflow-hidden rounded-[1.4rem] border text-left transition ${
      isActive
        ? 'border-brand/60 bg-brand/10 shadow-glow dark:bg-brand/10'
        : 'border-white/60 bg-white/80 shadow-soft hover:bg-white hover:shadow-elevated dark:border-white/10 dark:bg-[#17171d]/80 dark:hover:bg-[#1b1b22]'
    }`}
  >
    <div className="grid gap-3 p-3 sm:grid-cols-[100px_1fr]">
      <SmartImage
        src={restaurant.image}
        alt={restaurant.name}
        fallbackText={restaurant.name}
        className="h-20 rounded-[1.2rem]"
        imageClassName="group-hover:scale-105"
      />
      <div className="min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg leading-snug text-slate-950 dark:text-white line-clamp-1">
              {restaurant.name}
            </h3>
            <div className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Icon path={icons.clock} className="h-3 w-3" />
              <span>{restaurant.deliveryTime || 'Fast delivery'}</span>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            <Icon path={icons.star} className="h-3 w-3" />
            {Number(restaurant.rating || 0).toFixed(1)}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {(restaurant.cuisines || []).slice(0, 3).map((cuisine) => (
            <span
              key={cuisine}
              className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300"
            >
              {cuisine}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {formatCurrency(restaurant.costForTwo)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">for two</span>
          </p>
          <span className="text-xs font-semibold text-brand line-clamp-1">
            {restaurant.offer || 'Chef special menu'}
          </span>
        </div>
      </div>
    </div>
  </motion.button>
);

export default RestaurantCard;
