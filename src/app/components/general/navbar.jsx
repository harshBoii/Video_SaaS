'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggler from './ThemeToggler';
import { Menu, X, LogOut, UserCircle2, ChevronDown, CloudLightningIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getDashboardRoute } from '@/app/lib/utils';
import Image from 'next/image';

export default function MainNav() {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      setIsLoadingAuth(true);
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.employee);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoClick = (e) => {
    if (isLoadingAuth) {
      e.preventDefault();
      return;
    }

    const route = getDashboardRoute(user);
    router.push(route);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const triggerCron = async () => {
    await fetch("/api/run-cron");
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="sticky top-0 z-50 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/50 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 h-16"
    >
      <div className="mx-auto h-full">
        <div className="h-full flex items-center px-4 sm:px-6 lg:px-8">

          {/* Logo with Role-based Routing */}
          <motion.button
            onClick={handleLogoClick}
            disabled={isLoadingAuth}
            className={`group flex items-center shrink-0 h-full py-1 ${isLoadingAuth
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
              }`}
            whileHover={!isLoadingAuth ? { scale: 1.02 } : {}}
            whileTap={!isLoadingAuth ? { scale: 0.98 } : {}}
          >
            <motion.div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-xl shadow-indigo-500/30 transition-all duration-400 overflow-hidden relative flex-shrink-0 mr-2 ${isLoadingAuth
                  ? ''
                  : 'group-hover:shadow-2xl group-hover:shadow-indigo-500/50'
                }`}
              animate={isLoadingAuth ? {
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0]
              } : {}}
              transition={isLoadingAuth ? {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              } : { duration: 0.25 }}
            >
              <motion.div
                className="w-10 h-10 text-white relative z-10"
                transition={isLoadingAuth ? {
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                } : { duration: 0.6, ease: 'easeOut' }}
              >
                <Image
                  src="/logo.svg"
                  alt="Clipfox Logo"
                  width={96}     // adjust as needed
                  height={96}
                  className="rounded-md text-white"
                  priority
                />
              </motion.div>
              {!isLoadingAuth && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
            </motion.div>
            <motion.span
              className={`font-bold text-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-slate-100 dark:via-slate-200 dark:to-slate-300 bg-clip-text tracking-tight select-none flex-shrink-0 ${isLoadingAuth ? 'opacity-50' : ''
                }`}
              whileHover={!isLoadingAuth ? { x: 4 } : {}}
              transition={{ duration: 0.3 }}
            >
              <div className='flex items-center'>

                Clipfox
              </div>
            </motion.span>
          </motion.button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right Controls */}
          <div className="flex items-center h-full space-x-2 sm:space-x-3 lg:space-x-4 shrink-0">

            {/* Theme Toggle & Cron */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.div
                whileHover={{ scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="h-12 w-12 flex items-center justify-center"
              >
                <ThemeToggler />
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={triggerCron}
                disabled={isLoadingAuth}
                className={`flex items-center justify-center h-10 w-10 rounded-xl hover:bg-slate-100/60 dark:hover:bg-slate-800/60 backdrop-blur-sm transition-all duration-200 shadow-sm hover:shadow-md ${isLoadingAuth ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                <CloudLightningIcon className={isLoadingAuth ? 'animate-pulse' : ''} />
              </motion.button>
            </div>

            {/* Guest CTA */}
            {!isLoadingAuth && !user && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                className="hidden md:inline-flex flex-shrink-0 h-10"
              >
                <Link
                  href="/login"
                  className="h-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white 
                    bg-gradient-to-r from-slate-500 via-slate-600 to-slate-700 
                    hover:from-slate-600 hover:via-slate-700 hover:to-slate-800 
                    rounded-xl shadow-md shadow-slate-400/30 hover:shadow-lg hover:shadow-slate-500/40 
                    transition-all duration-300 border border-slate-400/40 flex-shrink-0"
                >
                  Get Started
                </Link>
              </motion.div>
            )}

            {/* User Avatar Button */}
            <AnimatePresence mode="wait">
              {!isLoadingAuth && user && (
                <motion.div
                  ref={userDropdownRef}
                  className="relative h-10 flex-shrink-0"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    aria-haspopup="true"
                    aria-expanded={userDropdownOpen}
                    className="group flex items-center h-full p-1.5 rounded-xl hover:bg-slate-100/60 dark:hover:bg-slate-800/60 backdrop-blur-sm transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0"
                  >
                    {/* Avatar */}
                    <motion.div
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 text-white flex items-center justify-center font-semibold text-sm sm:text-base shadow-xl shadow-slate-500/30 group-hover:shadow-2xl group-hover:shadow-slate-500/50 overflow-hidden relative flex-shrink-0"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="relative z-10">{user.firstName?.[0]}{user.lastName?.[0]}</span>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.div>

                    {/* Chevron */}
                    <AnimatePresence>
                      {userDropdownOpen && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0, rotate: -90 }}
                          animate={{ scale: 1, opacity: 1, rotate: 0 }}
                          exit={{ scale: 0, opacity: 0, rotate: -90 }}
                          transition={{ duration: 0.2 }}
                          className="hidden md:hidden lg:block w-4 h-4 sm:w-5 sm:h-5 bg-slate-800 rounded-full shadow-lg shadow-slate-800/25 ml-1 flex-shrink-0"
                        >
                          <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white rotate-180 absolute inset-0 m-auto" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  {/* User Dropdown */}
                  <AnimatePresence>
                    {userDropdownOpen && (
                      <motion.div
                        initial={{ y: -20, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -20, opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="absolute right-0 w-72 sm:w-80 max-w-[90vw] mt-3 rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-5 z-50"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                          className="border-b border-slate-200/50 dark:border-slate-700/50 pb-4 sm:pb-5 mb-4 sm:mb-5"
                        >
                          {/* Large avatar */}
                          <motion.div
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 flex items-center justify-center text-xl sm:text-2xl font-semibold text-white shadow-2xl shadow-slate-500/40 mx-auto mb-3 sm:mb-4"
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            transition={{ duration: 0.3 }}
                          >
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </motion.div>

                          {/* Full name */}
                          <motion.p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 text-center truncate">
                            {user.firstName} {user.lastName}
                          </motion.p>

                          {/* Email */}
                          <p className="text-sm text-slate-500 dark:text-slate-400 text-center truncate mt-1">
                            {user.email}
                          </p>

                          {/* Role badge */}
                          <div className="flex justify-center mt-2">
                            <span className="text-xs font-semibold px-3 py-1 bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 rounded-full capitalize">
                              {user.role?.name?.replace(/_/g, ' ') || 'User'}
                            </span>
                          </div>
                        </motion.div>

                        {/* Logout button */}
                        <motion.button
                          onClick={handleLogout}
                          whileHover={{ scale: 1.02, x: 2 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex w-full items-center justify-center gap-3 rounded-xl py-3 sm:py-3.5 px-4 sm:px-5 text-sm font-semibold text-slate-900 dark:text-slate-100 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-500/10 dark:hover:to-red-400/10 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 transition-all duration-300 shadow-sm hover:shadow-md group"
                        >
                          <motion.div
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:shadow-xl group-hover:shadow-red-500/50 transition-all duration-300 flex-shrink-0"
                            whileHover={{ scale: 1.08 }}
                            transition={{ duration: 0.2 }}
                          >
                            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                          </motion.div>
                          <span className="leading-none">Sign Out</span>
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading Skeleton for User Avatar */}
            {isLoadingAuth && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse flex-shrink-0"
              />
            )}

            {/* Mobile Menu Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMenuOpen(!menuOpen)}
              disabled={isLoadingAuth}
              className={`h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100/60 dark:hover:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-sm hover:shadow-md lg:hidden flex-shrink-0 ml-2 ${isLoadingAuth ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <motion.div
                animate={{ rotate: menuOpen ? 90 : 0 }}
                transition={{ duration: 0.3 }}
                className="w-6 h-6 flex items-center justify-center"
              >
                {menuOpen ? (
                  <X className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                ) : (
                  <Menu className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                )}
              </motion.div>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 shadow-inner"
          >
            <div className="px-4 sm:px-6 py-8 space-y-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="text-center space-y-3"
              >
                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text tracking-tight text-transparent">
                  Clipfox
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm max-w-sm mx-auto">
                  Professional video management platform
                </p>
              </motion.div>

              <div className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                <div className="flex justify-center">
                  <ThemeToggler />
                </div>

                {!user ? (
                  <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full text-center py-4 px-8 font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 rounded-xl shadow-xl shadow-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 border border-indigo-500/30 text-sm"
                    >
                      Get Started Free
                    </Link>
                  </motion.div>
                ) : (
                  <motion.button
                    onClick={() => {
                      setMenuOpen(false);
                      setUserDropdownOpen(true);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/50 transition-all duration-300 text-sm"
                  >
                    <UserCircle2 className="w-5 h-5" />
                    View Profile
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
