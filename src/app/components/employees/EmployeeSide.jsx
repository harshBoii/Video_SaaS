'use client';
import React, { useEffect, useState } from 'react';
import Logo from '../general/logo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid,
  FiVideo,
  FiCheckSquare,
  FiBarChart2,
  FiHelpCircle,
  FiSettings,
  FiUsers,
  FiFileText,
  FiShield,
  FiGitBranch,
  FiMessageSquare,
  FiBell,
  FiChevronDown,
  FiPlay,
  FiEdit3,
} from 'react-icons/fi';
import Spinner from '../general/spinner';

/* ----------------------------------
   NavItem with Framer Motion
----------------------------------- */
const NavItem = ({ icon, label, href, indent = false }) => {
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
            ${indent ? 'ml-6 pl-3' : ''}
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
   Collapsible Nav Group
----------------------------------- */
const NavGroup = ({ icon, label, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-1">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer
          text-sm font-medium transition-all duration-200
          ${
            isOpen
              ? 'bg-blue-50/50 dark:bg-slate-800 text-gray-700 dark:text-slate-300'
              : 'text-gray-500 dark:text-slate-400 hover:bg-blue-50/50 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-300'
          }
        `}
      >
        <span className="flex items-center justify-center w-5 h-5">
          {icon}
        </span>
        <span className="flex-1">{label}</span>
        <motion.span
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center"
        >
          <FiChevronDown className="w-4 h-4" />
        </motion.span>
      </motion.div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-1 space-y-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ----------------------------------
   Section Divider
----------------------------------- */
const SectionDivider = ({ label }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="px-4 pt-6 pb-2"
  >
    <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
      {label}
    </span>
  </motion.div>
);

/* ----------------------------------
   EmployeeSide
----------------------------------- */
const EmployeeSide = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (data.success) {
          setUser(data.employee);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const hasPermission = (permissionName) => {
    if (!user) return false;
    if (user.permissionNames?.includes('Superadmin All')) return true;
    if (user.isAdmin) return true;
    console.log('Permissions are:', user.permissionNames);
    return user.permissionNames?.includes(permissionName) || false;
  };

  const hasAnyPermission = (...permissionNames) => {
    return permissionNames.some((permission) => hasPermission(permission));
  };

  // Check if content management permissions exist
  const hasContentPermissions = hasAnyPermission(
    'Upload Video',
    'Version Control',
    'Delete Video',
    'Publish Video',
    'Approve Reject Video',
    'Preview Video',
    'Request Edits',
    'Edit Metadata',
    'Upload Scripts',
    'Edit Subtitles'
  );

  // Check if collaboration permissions exist
  const hasCollaborationPermissions = hasAnyPermission(
    'Approve Review',
    'Request Revision',
    'Reject Review',
    'Team Only Comments',
    'Resolve Comment',
    'Delete Comment',
    'Comment Video'
  );

  // Check if admin permissions exist
  const hasAdminPermissions = hasAnyPermission(
    'Manage Users',
    'Manage Roles',
    'Assign Permissions',
    'Manage Workflows'
  );

  if (loading) {
    return (
      <aside className="w-60 flex-shrink-0 bg-[#fdfdfd] dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col px-4 py-6  sticky top-0 h-screen">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 pb-6"
        >
          <Logo />
        </motion.div>
        <div className="flex-grow flex items-center justify-center">
          <Spinner />
        </div>
      </aside>
    );
  }

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
        {/* Always visible - Core */}
        <NavItem
          icon={<FiGrid />}
          href="/employee/campaign"
          label="My Campaigns"
        />
        <NavItem
          icon={<FiBell />}
          href="/employee/notification"
          label="Notifications"
        />

        {/* Content Management Section */}
        {hasContentPermissions && (
          <>
            <SectionDivider label="Content" />

            {hasAnyPermission(
              'Upload Video',
              'Version Control',
              'Delete Video',
              'Publish Video',
              'Approve Reject Video',
              'Preview Video',
              'Request Edits'
            ) && (
              <NavGroup
                icon={<FiPlay />}
                label="Video Management"
                defaultOpen={false}
              >
                {hasAnyPermission('Upload Video', 'Preview Video') && (
                  <NavItem
                    icon={<FiVideo />}
                    href="/admin/videos"
                    label="My Videos"
                    indent={true}
                  />
                )}
                {hasAnyPermission('Publish Video', 'Approve Reject Video') && (
                  <NavItem
                    icon={<FiCheckSquare />}
                    href="/admin/videos/approval"
                    label="Approvals"
                    indent={true}
                  />
                )}
              </NavGroup>
            )}

            {hasAnyPermission(
              'Edit Metadata',
              'Upload Scripts',
              'Edit Subtitles'
            ) && (
              <NavItem
                icon={<FiFileText />}
                href="/admin/metadata"
                label="Metadata & Scripts"
              />
            )}
          </>
        )}

        {/* Collaboration Section */}
        {hasCollaborationPermissions && (
          <>
            <SectionDivider label="Collaboration" />

            {hasAnyPermission(
              'Approve Review',
              'Request Revision',
              'Reject Review'
            ) && (
              <NavItem
                icon={<FiCheckSquare />}
                href="/admin/reviews"
                label="Reviews"
              />
            )}

            {hasAnyPermission(
              'Team Only Comments',
              'Resolve Comment',
              'Delete Comment',
              'Comment Video'
            ) && (
              <NavItem
                icon={<FiMessageSquare />}
                href="/admin/comments"
                label="Comments"
              />
            )}
          </>
        )}

        {/* Analytics */}
        {hasPermission('View Analytics') && (
          <>
            <SectionDivider label="Insights" />
            <NavItem
              icon={<FiBarChart2 />}
              href="/admin/analytics"
              label="Analytics"
            />
          </>
        )}

        {/* Admin Section */}
        {hasAdminPermissions && (
          <>
            <SectionDivider label="Administration" />

            {hasPermission('Manage Users') && (
              <NavItem
                icon={<FiUsers />}
                href="/admin/employees"
                label="Team Members"
              />
            )}

            {hasAnyPermission('Manage Roles', 'Assign Permissions') && (
              <NavItem
                icon={<FiShield />}
                href="/admin/roles"
                label="Roles & Permissions"
              />
            )}

            {hasAnyPermission('Manage Workflows') && (
              <NavItem
                icon={<FiGitBranch />}
                href="/admin/hierarchy"
                label="Organization"
              />
            )}
          </>
        )}
      </nav>

      {/* Footer Section */}
      <div className="pt-4 mt-4 border-t border-gray-200 dark:border-slate-800 flex flex-col gap-1">
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

export default EmployeeSide;
