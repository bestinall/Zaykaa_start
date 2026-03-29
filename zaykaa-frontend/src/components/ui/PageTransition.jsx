import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const PageTransition = ({ children, className }) => (
  <motion.main
    initial={{ opacity: 0, y: 20, filter: 'blur(12px)' }}
    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className={cn('relative', className)}
  >
    {children}
  </motion.main>
);

export default PageTransition;
