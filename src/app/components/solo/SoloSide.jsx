'use client';
import React, { useState } from 'react';
import Logo from '../general/logo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid,
  FiHelpCircle,
  FiSettings,
  FiUser,
  FiMessageSquare,
  FiFilm,
  FiLayers,
  FiMoon,
  FiSun,
} from 'react-icons/fi';

/* ----------------------------------
   NavItem with Framer Motion
----------------------------------- */
const NavItem = ({ icon, label, href }) => {
  const pathname = usePathname();
  const active = href === pathname;

  if (href) {
    return (
      <Link href={href} className="block">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer
            text-sm font-medium transition-all duration-200
            ${
              active
                ? 'bg-blue-50 dark:bg-blue-500/20 text-black dark:text-slate-50 font-bold'
                : 'text-gray-500 dark:text-slate-400 hover:bg-blue-50/50 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-300'
            }
          `}
        >
          <span
            className={`
              flex items-center justify-center w-5 h-5 transition-colors
              ${active ? 'text-blue-600 dark:text-blue-400' : ''}
            `}
          >
            {icon}
          </span>
          <span className="flex-1">{label}</span>
        </motion.div>
      </Link>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-blue-50/50 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-300 transition-all duration-200"
    >
      <span className="flex items-center justify-center w-5 h-5">{icon}</span>
      <span className="flex-1">{label}</span>
    </motion.div>
  );
};

/* ----------------------------------
   Animated Theme Toggle
----------------------------------- */
const ThemeToggleButton = () => {
  const [isDark, setIsDark] = useState(false);

  React.useEffect(() => {
    // Check initial theme from document
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50 dark:bg-slate-800 mb-1 transition-colors duration-200"
    >
      <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
        Theme
      </span>
      <motion.button
        onClick={toggleTheme}
        className="relative w-14 h-7 rounded-full bg-gray-300 dark:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors duration-300"
        whileTap={{ scale: 0.95 }}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <motion.div
          className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-md"
          animate={{
            x: isDark ? 26 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isDark ? 'moon' : 'sun'}
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 180, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              {isDark ? (
                <FiMoon className="w-3 h-3 text-blue-600" />
              ) : (
                <FiSun className="w-3 h-3 text-yellow-500" />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.button>
    </motion.div>
  );
};

/* ----------------------------------
   SoloSide
----------------------------------- */
const SoloSide = () => {
  return (
    <aside className="w-60 flex-shrink-0 bg-[#fdfdfd] dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col px-4 py-6 font-['DM_Sans'] sticky top-0 h-screen overflow-y-auto transition-colors duration-200">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pb-6"
      >
        <Logo />
      </motion.div>

      {/* Main Navigation */}
      <nav className="flex-grow flex flex-col gap-1">
        <NavItem icon={<FiGrid />} href="/solo" label="Dashboard" />
        <NavItem icon={<FiFilm />} href="/solo/videos" label="My Videos" />
        <NavItem icon={<FiLayers />} href="/solo/projects" label="Projects" />
        <NavItem
          icon={<FiMessageSquare />}
          href="/solo/notification"
          label="Comments"
        />
        <NavItem icon={<FiUser />} href="/solo/profile" label="Profile" />
      </nav>

      {/* Footer Section */}
      <div className="pt-4 mt-4 border-t border-gray-200 dark:border-slate-800 flex flex-col gap-1">
        {/* Theme Toggle */}
        <ThemeToggleButton />

        {/* Help & Settings */}
        <NavItem icon={<FiHelpCircle />} label="Help & Support" />
        <NavItem icon={<FiSettings />} href="/settings" label="Settings" />
      </div>

      {/* Copyright */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-[0.65rem] text-black/40 dark:text-white/30 mt-5 px-4 space-y-1"
      >
        <p>Privacy Policy | Terms</p>
        <p>© 2025 ClipFox Pvt. Ltd.</p>
      </motion.div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        aside::-webkit-scrollbar {
          width: 4px;
        }
        aside::-webkit-scrollbar-track {
          background: transparent;
        }
        aside::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 2px;
        }
        :global(.dark) aside::-webkit-scrollbar-thumb {
          background: #334155;
        }
      `}</style>
    </aside>
  );
};

export default SoloSide;
