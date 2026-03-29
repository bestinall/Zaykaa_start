import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const BarChart = ({ data = [], className, valueFormatter = (value) => value }) => {
  const maxValue = Math.max(...data.map((item) => Number(item.value || 0)), 1);

  return (
    <div className={cn('space-y-4', className)}>
      {data.map((item, index) => {
        const width = `${Math.max((Number(item.value || 0) / maxValue) * 100, 10)}%`;

        return (
          <div key={`${item.label}-${index}`} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {valueFormatter(item.value)}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width }}
                transition={{ duration: 0.5, delay: index * 0.06 }}
                className="h-full rounded-full bg-gradient-to-r from-brand via-orange-500 to-red-500"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BarChart;
