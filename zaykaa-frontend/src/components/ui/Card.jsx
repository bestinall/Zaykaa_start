import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const Card = ({ children, className, hover = true, padded = true }) => (
  <motion.div
    whileHover={hover ? { y: -6 } : undefined}
    transition={{ duration: 0.24 }}
    className={cn(
      'glass-panel overflow-hidden rounded-4xl border border-white/60 bg-white/75 shadow-soft backdrop-blur-2xl dark:border-white/10 dark:bg-[#17171d]/75',
      padded && 'p-6',
      className
    )}
  >
    {children}
  </motion.div>
);

export default Card;
