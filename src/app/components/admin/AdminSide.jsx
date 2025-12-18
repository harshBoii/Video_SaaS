'use client';

import React, { useState } from 'react';
import Logo from '../general/logo';
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
  FiFileText ,
  FiFolderPlus ,
  FiPlus,
  FiBarChart2,
  FiUserCheck,
  FiChevronDown,
  FiChevronRight,
} from 'react-icons/fi';

/* ----------------------------------
   NavItem with Framer Motion
----------------------------------- */
const NavItem = ({ icon, label, href, indent = false }) => {
  const pathname = usePathname();
  const active = href === pathname;

  return (
    <Link href={href} className="block">
      <motion.div
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
};

/* ----------------------------------
   Collapsible Nav Group
----------------------------------- */
const NavGroup = ({ icon, label, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-1">
      <motion.div
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
  <div className="px-4 pt-6 pb-2">
    <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
      {label}
    </span>
  </div>
);

/* ----------------------------------
   AdminSide
----------------------------------- */
const AdminSide = () => {
  return (
    <aside className="w-60 flex-shrink-0 bg-[#fdfdfd] dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col px-4 py-6  sticky top-0 h-screen overflow-y-auto transition-colors duration-200">
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
        {/* Core Section */}
        <NavItem icon={<FiGrid />} href="/admin" label="Dashboard" />

        <NavItem
          icon={<FiTarget />}
          href="/admin/campaigns"
          label="Campaigns"
        />

        <NavItem
          icon={<FiUsers />}
          href="/admin/employees"
          label="Employees"
        />

        {/* Contractors Section - Hierarchical Group */}
        <NavGroup
          icon={<FiUserCheck />}
          label="Contractors"
          defaultOpen={false}
        >
          <NavItem
            icon={<FiTarget />}
            href="/admin/agencies"
            label="Agencies"
            indent={true}
          />
          <NavItem
            icon={<FiUsers />}
            href="/admin/freelancers"
            label="Freelancers"
            indent={true}
          />
          <NavItem
            icon={<FiFileText />}
            href="/admin/contract/add"
            label="Create Contract"
            indent={true}
          />

        </NavGroup>

        <SectionDivider label="System" />

        <NavItem
          icon={<FiShield />}
          href="/admin/roles"
          label="Roles & Permissions"
        />

        <NavItem
          icon={<FiGitBranch />}
          href="/admin/hierarchy"
          label="Hierarchy"
        />

        <SectionDivider label="Content" />

        <NavItem
          icon={<FiShare2 />}
          href="/admin/socials"
          label="Social Accounts"
        />

        <NavItem
          icon={<FiFileText />}
          href="/admin/posts"
          label="Posts"
        />

        <NavItem
          icon={<FiFolderPlus />}
          href="/admin/assets"
          label="Asset Library"
        />
      </nav>

      {/* Footer Section */}
      <div className="pt-4 mt-4 border-t border-gray-200 dark:border-slate-800 flex flex-col gap-1">
        <NavItem
          icon={<FiPlus />}
          href="/admin/integrations"
          label="Integrations"
        />

        <NavItem
          icon={<FiBarChart2 />}
          href="/admin/reports"
          label="Analytics"
        />
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

export default AdminSide;
