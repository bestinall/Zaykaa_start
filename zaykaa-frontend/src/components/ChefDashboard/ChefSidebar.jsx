import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const ChefSidebar = ({ items, activeItem, onChange, chefName }) => (
  <aside className="rounded-[2rem] border border-white/60 bg-white/75 p-4 shadow-soft backdrop-blur-2xl dark:border-white/10 dark:bg-[#17171d]/75">
    <div className="rounded-[1.75rem] bg-gradient-to-br from-brand via-orange-500 to-red-500 p-5 text-white shadow-glow">
      <p className="text-xs uppercase tracking-[0.22em] text-white/75">Chef workspace</p>
      <h2 className="mt-3 font-display text-3xl">{chefName}</h2>
      <p className="mt-2 text-sm leading-6 text-white/80">
        Manage bookings, menus, recipes and performance from one premium studio.
      </p>
    </div>
    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
      {items.map((item) => (
        <motion.button
          key={item.key}
          type="button"
          whileTap={{ scale: 0.99 }}
          onClick={() => onChange(item.key)}
          className={cn(
            'flex items-center gap-3 rounded-[1.35rem] px-4 py-3 text-left transition',
            activeItem === item.key
              ? 'bg-slate-950 text-white shadow-soft dark:bg-white dark:text-slate-950'
              : 'text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10'
          )}
        >
          <span
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-semibold',
              activeItem === item.key
                ? 'bg-white/10 text-inherit dark:bg-slate-900/10'
                : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200'
            )}
          >
            {item.short}
          </span>
          <div>
            <p className="font-semibold">{item.label}</p>
            <p
              className={cn(
                'text-xs',
                activeItem === item.key ? 'text-white/75 dark:text-slate-600' : 'text-slate-400'
              )}
            >
              {item.description}
            </p>
          </div>
        </motion.button>
      ))}
    </div>
  </aside>
);

export default ChefSidebar;
