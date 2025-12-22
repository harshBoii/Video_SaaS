'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid,
  FiTarget,
  FiUsers,
  FiShield,
  FiGitBranch,
  FiShare2,
  FiFileText,
  FiFolderPlus,
  FiPlus,
  FiBarChart2,
  FiUserCheck,
  FiChevronDown,
  FiChevronRight,
  FiSearch,
  FiBell,
  FiMoreHorizontal,
  FiVideo,
  FiFilm,
  FiLayers,
  FiMessageSquare,
  FiUser,
  FiSettings,
  FiHelpCircle,
  FiMoon,
  FiSun,
  FiCheckSquare,
  FiPlay,
  FiEdit3,
  FiLogOut,
} from 'react-icons/fi';
import { HiOutlineSwitchHorizontal } from 'react-icons/hi';

/* ----------------------------------
   NavItem - Premium minimal style
----------------------------------- */
const NavItem = ({ icon, label, href, indent = false, badge = null }) => {
  const pathname = usePathname();
  const active = href === pathname || (href !== '/' && pathname?.startsWith(href));

  const content = (
    <motion.div
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
        text-sm transition-all duration-200 font-body
        ${indent ? 'ml-4 pl-2' : ''}
        ${active
          ? 'bg-clipfox-surface-hover dark:bg-white/10 text-foreground font-medium'
          : 'text-muted-foreground hover:bg-clipfox-surface-hover dark:hover:bg-white/5 hover:text-foreground'
        }
      `}
    >
      <span className={`flex items-center justify-center w-4 h-4 ${active ? 'text-primary' : ''}`}>
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
          {badge}
        </span>
      )}
    </motion.div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }
  return content;
};

/* ----------------------------------
   Collapsible Nav Group
----------------------------------- */
const NavGroup = ({ icon, label, children, defaultOpen = false, emoji = null }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-0.5">
      <motion.div
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer
          text-sm transition-all duration-200 font-body
          ${isOpen ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}
          hover:bg-clipfox-surface-hover dark:hover:bg-white/5
        `}
      >
        <motion.span
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center justify-center w-4 h-4 text-muted-foreground"
        >
          <FiChevronRight className="w-3.5 h-3.5" />
        </motion.span>
        {emoji && <span className="text-base">{emoji}</span>}
        {!emoji && icon && (
          <span className="flex items-center justify-center w-4 h-4">{icon}</span>
        )}
        <span className="flex-1 truncate font-medium">{label}</span>
      </motion.div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="overflow-hidden"
          >

            <div className="mt-0.5 space-y-0.5 ml-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ----------------------------------
   Section Label
----------------------------------- */
const SectionLabel = ({ label, action = null }) => (
  <div className="flex items-center justify-between px-3 pt-5 pb-1.5">
    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-body">
      {label}
    </span>
    {action}
  </div>
);

/* ----------------------------------
   User Mode Toggle (Admin Only)
----------------------------------- */
const UserModeToggle = ({ userType, onToggle, isAdmin }) => {
  if (!isAdmin) return null;

  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-body
        bg-gradient-to-r from-primary/10 to-clipfox-accent/10 
        hover:from-primary/15 hover:to-clipfox-accent/15
        border border-primary/20 dark:border-primary/30
        text-foreground transition-all duration-200"
    >
      <HiOutlineSwitchHorizontal className="w-4 h-4 text-primary" />
      <span className="flex-1 text-left">
        {userType === 'admin' ? 'Admin View' : 'User View'}
      </span>
      <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-background rounded">
        Switch
      </span>
    </motion.button>
  );
};

/* ----------------------------------
   Theme Toggle
----------------------------------- */
const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
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
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center justify-center w-8 h-8 rounded-lg
        text-muted-foreground hover:text-foreground
        hover:bg-clipfox-surface-hover dark:hover:bg-white/5
        transition-all duration-200"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? 'moon' : 'sun'}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {isDark ? <FiMoon className="w-4 h-4" /> : <FiSun className="w-4 h-4" />}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
};

/* ----------------------------------
   Workspace Sidebar
----------------------------------- */
const WorkspaceSidebar = ({ user, userType: initialUserType }) => {
  const [viewMode, setViewMode] = useState(initialUserType);
  const isAdmin = initialUserType === 'admin';

  const handleModeToggle = () => {
    setViewMode(prev => prev === 'admin' ? 'employee' : 'admin');
  };

  const hasPermission = (permissionName) => {
    if (!user) return false;
    if (user.permissionNames?.includes('Superadmin All')) return true;
    if (user.isAdmin || isAdmin) return true;
    return user.permissionNames?.includes(permissionName) || false;
  };

  const hasAnyPermission = (...permissionNames) => {
    return permissionNames.some((permission) => hasPermission(permission));
  };

  const hasContentPermissions = hasAnyPermission(
    'Upload Video', 'Version Control', 'Delete Video', 'Publish Video',
    'Approve Reject Video', 'Preview Video', 'Request Edits',
    'Edit Metadata', 'Upload Scripts', 'Edit Subtitles'
  );

  const hasCollaborationPermissions = hasAnyPermission(
    'Approve Review', 'Request Revision', 'Reject Review',
    'Team Only Comments', 'Resolve Comment', 'Delete Comment', 'Comment Video'
  );

  const hasAdminPermissions = hasAnyPermission(
    'Manage Users', 'Manage Roles', 'Assign Permissions', 'Manage Workflows'
  );

  return (
    <aside className="w-64 flex-shrink-0 bg-clipfox-surface dark:bg-card border-r border-border flex flex-col sticky top-0 h-screen overflow-hidden transition-colors duration-200">
      {/* Header - Workspace Selector */}
      <div className="p-3 border-b border-border">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-clipfox-surface-hover dark:hover:bg-white/5 cursor-pointer transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-clipfox-accent flex items-center justify-center text-white font-heading font-bold text-sm">
            {user?.company_name?.charAt(0) || 'C'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate font-heading">
              {user?.company_name || 'ClipFox'}
            </p>
          </div>
          <FiChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="p-3 space-y-2">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background dark:bg-white/5 border border-border text-muted-foreground text-sm cursor-pointer hover:border-primary/50 transition-colors">
          <FiSearch className="w-4 h-4" />
          <span className="font-body">Search...</span>
          <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">⌘K</span>
        </div>

        {/* Admin Mode Toggle */}
        {isAdmin && (
          <UserModeToggle
            userType={viewMode}
            onToggle={handleModeToggle}
            isAdmin={isAdmin}
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 scrollbar-thin">
        {/* Core Navigation */}
        <NavItem icon={<FiBell />} href="/notification" label="Notifications" />

        {/* Solo Creator View */}
        {initialUserType === 'solo' && (
          <>
            <NavItem icon={<FiGrid />} href="/dashboard" label="Dashboard" />
            <NavItem icon={<FiFilm />} href="/videos" label="My Videos" />
            <NavItem icon={<FiLayers />} href="/projects" label="Projects" />
            <NavItem icon={<FiMessageSquare />} href="/notification" label="Comments" />
            <NavItem icon={<FiUser />} href="/profile" label="Profile" />
          </>
        )}

        {/* Employee View */}
        {(initialUserType === 'employee' || (isAdmin && viewMode === 'employee')) && initialUserType !== 'solo' && (
          <>
            <NavItem icon={<FiGrid />} href="/campaign" label="My Campaigns" />

            {hasContentPermissions && (
              <>
                <SectionLabel label="Content" />
                {hasAnyPermission('Upload Video', 'Version Control', 'Delete Video', 'Publish Video', 'Approve Reject Video', 'Preview Video', 'Request Edits') && (
                  <NavGroup icon={<FiPlay />} label="Video Management" defaultOpen={false}>
                    {hasAnyPermission('Upload Video', 'Preview Video') && (
                      <NavItem icon={<FiVideo />} href="/videos" label="My Videos" indent />
                    )}
                    {hasAnyPermission('Publish Video', 'Approve Reject Video') && (
                      <NavItem icon={<FiCheckSquare />} href="/videos/approval" label="Approvals" indent />
                    )}
                  </NavGroup>
                )}
                {hasAnyPermission('Edit Metadata', 'Upload Scripts', 'Edit Subtitles') && (
                  <NavItem icon={<FiFileText />} href="/metadata" label="Metadata & Scripts" />
                )}
              </>
            )}

            {hasCollaborationPermissions && (
              <>
                <SectionLabel label="Collaboration" />
                {hasAnyPermission('Approve Review', 'Request Revision', 'Reject Review') && (
                  <NavItem icon={<FiCheckSquare />} href="/reviews" label="Reviews" />
                )}
                {hasAnyPermission('Team Only Comments', 'Resolve Comment', 'Delete Comment', 'Comment Video') && (
                  <NavItem icon={<FiMessageSquare />} href="/comments" label="Comments" />
                )}
              </>
            )}
          </>
        )}

        {/* Admin View */}
        {isAdmin && viewMode === 'admin' && (
          <>
            <NavItem icon={<FiGrid />} href="/dashboard" label="Dashboard" />
            <NavItem icon={<FiTarget />} href="/campaign" label="Campaigns" />
            <NavItem icon={<FiUsers />} href="/employees" label="Employees" />

            {/* Contractors Group */}
            <NavGroup icon={<FiUserCheck />} label="Contractors" defaultOpen={false}>
              <NavItem icon={<FiTarget />} href="/agencies" label="Agencies" indent />
              <NavItem icon={<FiUsers />} href="/freelancers" label="Freelancers" indent />
              <NavItem icon={<FiFileText />} href="/contract/add" label="Create Contract" indent />
            </NavGroup>

            <SectionLabel label="System" />
            <NavItem icon={<FiShield />} href="/roles" label="Roles & Permissions" />
            <NavItem icon={<FiGitBranch />} href="/hierarchy" label="Hierarchy" />

            <SectionLabel label="Content" />
            <NavItem icon={<FiShare2 />} href="/socials" label="Social Accounts" />
            <NavItem icon={<FiFileText />} href="/posts" label="Posts" />
            <NavItem icon={<FiFolderPlus />} href="/assets" label="Asset Library" />
          </>
        )}

        {/* Common Admin Controls at bottom of nav */}
        {(isAdmin || hasAdminPermissions) && viewMode !== 'admin' && (
          <>
            <SectionLabel label="Administration" />
            {hasPermission('Manage Users') && (
              <NavItem icon={<FiUsers />} href="/employees" label="Team Members" />
            )}
            {hasAnyPermission('Manage Roles', 'Assign Permissions') && (
              <NavItem icon={<FiShield />} href="/roles" label="Roles & Permissions" />
            )}
            {hasAnyPermission('Manage Workflows') && (
              <NavItem icon={<FiGitBranch />} href="/hierarchy" label="Organization" />
            )}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-1">
        <NavItem icon={<FiPlus />} href="/integrations" label="Integrations" />
        {hasPermission('View Analytics') && (

          <NavItem icon={<FiBarChart2 />} href="/reports" label="Analytics" />
        )}

        {/* <div className="flex items-center gap-1 pt-2">
          <NavItem icon={<FiHelpCircle />} label="Help" />
          <NavItem icon={<FiSettings />} href="/settings" label="Settings" />
          <ThemeToggle />
        </div> */}

        {/* User Profile */}
        {/* <div className="flex items-center gap-3 p-2 mt-2 rounded-lg hover:bg-clipfox-surface-hover dark:hover:bg-white/5 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground font-medium text-sm">
            {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate font-body">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
          <FiMoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </div> */}

        {/* Copyright */}
        {/* <div className="text-[0.65rem] text-muted-foreground/60 pt-3 px-2 space-y-0.5 font-body">
          <p>Privacy Policy | Terms</p>
          <p>© 2025 ClipFox Pvt. Ltd.</p>
        </div> */}
      </div>

      {/* Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: var(--muted-foreground);
        }
      `}</style>
    </aside>
  );
};

export default WorkspaceSidebar;
