'use client';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/app/context/themeContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ThemeToggler({ size = 'default' }) {
  const { isDark, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <div 
        className={`rounded-lg bg-slate-200 ${
          size === 'small' ? 'w-8 h-8' : 'w-10 h-10'
        }`} 
      />
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={`
        relative flex items-center justify-center rounded-lg
        bg-white border border-slate-200 shadow-sm
        hover:shadow-md hover:border-slate-300
        transition-all overflow-hidden
        ${size === 'small' ? 'w-8 h-8' : 'w-10 h-10'}
      `}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="sun"
            initial={{ y: -20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.15 }}
          >
            <Sun className={`text-amber-500 ${size === 'small' ? 'w-4 h-4' : 'w-5 h-5'}`} />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ y: -20, opacity: 0, rotate: 90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: -90 }}
            transition={{ duration: 0.15 }}
          >
            <Moon className={`text-slate-600 ${size === 'small' ? 'w-4 h-4' : 'w-5 h-5'}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
