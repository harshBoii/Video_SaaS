'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggler from './ThemeToggler';
import { Menu, X, LogOut, UserCircle2, ChevronDown, CloudLightningIcon, Settings, HelpCircle } from 'lucide-react';
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
      className="sticky top-0 z-50 glass-navbar h-14"
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
              className={`font-medium text-lg bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-slate-100 dark:via-slate-200 dark:to-slate-300 bg-clip-text tracking-tight select-none flex-shrink-0 ${isLoadingAuth ? 'opacity-50' : ''
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
                    className="group flex items-center gap-2 h-full px-3 py-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 backdrop-blur-sm transition-all duration-200 flex-shrink-0"
                  >
                    {/* Avatar */}
                    <motion.div
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary text-primary-foreground flex items-center justify-center font-medium text-sm overflow-hidden relative flex-shrink-0"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="relative z-10">{user.firstName?.[0]}{user.lastName?.[0]}</span>
                    </motion.div>

                    {/* Chevron */}
                    <motion.div
                      animate={{ rotate: userDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="hidden sm:block"
                    >
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                  </motion.button>

                  {/* User Dropdown */}
                  <AnimatePresence>
                    {userDropdownOpen && (
                      <motion.div
                        initial={{ y: -10, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -10, opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute right-0 w-64 mt-2 rounded-xl glass-dropdown overflow-hidden z-50"
                      >
                        {/* User Info Section */}
                        <div className="p-4 border-b border-[var(--glass-border)]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-primary text-primary-foreground flex items-center justify-center font-medium text-sm flex-shrink-0">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {user.email}
                              </p>
                              <p className="text-xs font-semibold px-3 py-1 bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 rounded-full capitalize">
                                {user.role?.name?.replace(/_/g, ' ') || 'User'}
                              </p>

                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                          <motion.button
                            whileHover={{ x: 4 }}
                            onClick={() => {
                              setUserDropdownOpen(false);
                              router.push('/settings');
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-[var(--glass-hover)] transition-all duration-200"
                          >
                            <Settings className="w-4 h-4 text-muted-foreground" />
                            <span>Settings</span>
                          </motion.button>

                          <motion.button
                            whileHover={{ x: 4 }}
                            onClick={() => {
                              setUserDropdownOpen(false);
                              router.push('/help');
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-[var(--glass-hover)] transition-all duration-200"
                          >
                            <HelpCircle className="w-4 h-4 text-muted-foreground" />
                            <span>Help & Support</span>
                          </motion.button>

                          <div className="my-2 border-t border-[var(--glass-border)]" />

                          <motion.button
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </motion.button>
                        </div>
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
            className="lg:hidden glass-solid border-t border-[var(--glass-border)] shadow-inner"
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
