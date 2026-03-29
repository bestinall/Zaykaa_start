import React from 'react';
import { motion } from 'framer-motion';

const LineChart = ({ data = [] }) => {
  const values = data.map((item) => Number(item.value || 0));
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;
  const width = 320;
  const height = 180;

  const points = data.map((item, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * (width - 30) + 15;
    const y = height - ((Number(item.value || 0) - minValue) / range) * (height - 40) - 20;
    return `${x},${y}`;
  });

  const fillPath = points.length
    ? `M ${points[0]} L ${points
        .slice(1)
        .map((point) => point.replace(',', ' '))
        .join(' L ')} L ${width - 15} ${height - 10} L 15 ${height - 10} Z`
    : '';

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full">
          <defs>
            <linearGradient id="zaykaa-line" x1="0%" x2="100%">
              <stop offset="0%" stopColor="#FF6B35" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
            <linearGradient id="zaykaa-fill" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,107,53,0.28)" />
              <stop offset="100%" stopColor="rgba(255,107,53,0.02)" />
            </linearGradient>
          </defs>
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
            <line
              key={ratio}
              x1="10"
              x2={width - 10}
              y1={height * ratio}
              y2={height * ratio}
              stroke="rgba(148,163,184,0.18)"
              strokeDasharray="4 6"
            />
          ))}
          {fillPath && <path d={fillPath} fill="url(#zaykaa-fill)" />}
          <motion.polyline
            points={points.join(' ')}
            fill="none"
            stroke="url(#zaykaa-line)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
          {points.map((point, index) => {
            const [cx, cy] = point.split(',');
            return (
              <motion.circle
                key={`${point}-${index}`}
                cx={cx}
                cy={cy}
                r="4.5"
                fill="#ffffff"
                stroke="#FF6B35"
                strokeWidth="3"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.08 }}
              />
            );
          })}
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
        {data.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-center dark:border-white/10 dark:bg-white/5"
          >
            <p className="text-slate-500 dark:text-slate-400">{item.label}</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LineChart;
