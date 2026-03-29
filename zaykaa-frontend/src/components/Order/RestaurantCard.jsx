import React from 'react';
import { motion } from 'framer-motion';
import SmartImage from '../ui/SmartImage';
import { formatCurrency } from '../../utils/display';

const RestaurantCard = ({ restaurant, onSelect, isActive }) => (
  <motion.button
    type="button"
    whileHover={{ y: -4 }}
    whileTap={{ scale: 0.99 }}
    onClick={() => onSelect(restaurant)}
    className={`group w-full overflow-hidden rounded-[1.8rem] border text-left transition ${
      isActive
        ? 'border-brand/60 bg-brand/10 shadow-glow dark:bg-brand/10'
        : 'border-white/60 bg-white/80 shadow-soft hover:bg-white dark:border-white/10 dark:bg-[#17171d]/80 dark:hover:bg-[#1b1b22]'
    }`}
  >
    <div className="grid gap-4 p-4 sm:grid-cols-[124px_1fr]">
      <SmartImage
        src={restaurant.image}
        alt={restaurant.name}
        fallbackText={restaurant.name}
        className="h-28 rounded-[1.4rem]"
        imageClassName="group-hover:scale-105"
      />
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="truncate font-display text-2xl text-slate-950 dark:text-white">
              {restaurant.name}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{restaurant.location}</p>
          </div>
          <div className="rounded-full bg-slate-950/10 px-3 py-1 text-sm font-semibold text-slate-900 dark:bg-white/10 dark:text-white">
            {Number(restaurant.rating || 0).toFixed(1)}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(restaurant.cuisines || []).slice(0, 3).map((cuisine) => (
            <span
              key={cuisine}
              className="rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
            >
              {cuisine}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-4 text-sm">
          <p className="text-slate-500 dark:text-slate-400">
            {restaurant.deliveryTime || 'Fast delivery'} • {formatCurrency(restaurant.costForTwo)} for two
          </p>
          <span className="font-semibold text-brand">{restaurant.offer || 'Chef special menu'}</span>
        </div>
      </div>
    </div>
  </motion.button>
);

export default RestaurantCard;
