'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
  FiVideo,
  FiFilm,
  FiLayers,
  FiMessageSquare,
  FiUser,
  FiSettings,
  FiMoon,
  FiSun,
  FiCheckSquare,
  FiHome,
  FiBox,
  FiLogOut,
  FiUserPlus,
  FiGrid,
} from 'react-icons/fi';
import {
  HiOutlineSwitchHorizontal,
  HiOutlineColorSwatch,
  HiOutlineCog,
  HiOutlineUserGroup,
  HiTemplate,
} from 'react-icons/hi';
import {
  RiDashboardLine,
  RiChat3Line,
  RiFolderLine,
  RiSettings4Line,
  RiAdminLine,
} from 'react-icons/ri';
import { FaRegComment } from 'react-icons/fa';
import { SiGitconnected, SiGooglegemini } from 'react-icons/si';
import { MdOutlinePhoto, MdOutlinePhotoLibrary } from 'react-icons/md';
import { FiX, FiChevronLeft } from 'react-icons/fi';

/* ============================================
   SEARCH MODAL COMPONENT
============================================ */
const SearchModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const allNavItems = [
    // Campaigns
    { label: 'All Campaigns', href: '/campaign', section: 'Campaigns' },
    { label: 'New Campaign', href: '/campaign/new', section: 'Campaigns' },
    // Chat
    { label: 'AI Chat', href: '/chat', section: 'AI' },
    // Assets
    { label: 'All Assets', href: '/assets', section: 'Assets' },
    { label: 'Videos', href: '/assets?type=videos', section: 'Assets' },
    { label: 'Images', href: '/assets?type=images', section: 'Assets' },
    { label: 'Documents', href: '/assets?type=docs', section: 'Assets' },
    // Content Ops
    { label: 'My Videos', href: '/videos', section: 'Content Ops' },
    { label: 'Approvals', href: '/videos/approval', section: 'Content Ops' },
    { label: 'Docs', href: '/docs', section: 'Content Ops' },
    { label: 'Notifications', href: '/notification', section: 'Content Ops' },
    { label: 'Social Accounts', href: '/socials', section: 'Content Ops' },
    { label: 'Posts', href: '/posts', section: 'Content Ops' },
    { label: 'Reviews', href: '/reviews', section: 'Content Ops' },
    { label: 'Comments', href: '/comments', section: 'Content Ops' },
    // Admin
    { label: 'Dashboard', href: '/dashboard', section: 'Admin' },
    { label: 'Analytics', href: '/reports', section: 'Admin' },
    { label: 'Employees', href: '/employees', section: 'Admin' },
    { label: 'Agencies', href: '/agencies', section: 'Admin' },
    { label: 'Freelancers', href: '/freelancers', section: 'Admin' },
    { label: 'Roles & Permissions', href: '/roles', section: 'Admin' },
    { label: 'Hierarchy', href: '/hierarchy', section: 'Admin' },
    { label: 'Integrations', href: '/integrations', section: 'Admin' },
  ];

  const filteredItems = searchQuery
    ? allNavItems.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.section.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : allNavItems;

  const handleNavigate = (href) => {
    router.push(href);
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Use portal to render outside any stacking context
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-start justify-center pt-20 px-4"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl glass-card overflow-hidden"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-[var(--glass-border)]">
          <FiSearch className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search navigation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
          />
          <kbd className="px-2 py-1 text-xs bg-[var(--glass-hover)] rounded border border-[var(--glass-border)] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto glass-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No results found for "{searchQuery}"
            </div>
          ) : (
            <div className="p-2">
              {filteredItems.map((item, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => handleNavigate(item.href)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[var(--glass-hover)] transition-colors text-left group"
                >
                  <div>
                    <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {item.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.section}
                    </div>
                  </div>
                  <FiChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

/* ============================================
   MAIN SECTIONS - Slack-like structure
============================================ */
const MAIN_SECTIONS = [
  { id: 'campaigns', label: 'Campaigns', icon: RiDashboardLine, hasSecondary: true, defaultHref: '/campaign' },
  { id: 'chat', label: 'AI', icon: SiGooglegemini, hasSecondary: false, defaultHref: '/chat' },
  { id: 'assets', label: 'Assets', icon: MdOutlinePhotoLibrary, hasSecondary: true, defaultHref: '/assets' },
  { id: 'content', label: 'Content Ops', icon: HiTemplate, hasSecondary: true, defaultHref: '/videos' },
  { id: 'admin', label: 'Admin', icon: RiAdminLine, hasSecondary: true, defaultHref: '/dashboard' },
];

/* ============================================
   Primary Sidebar Icon Button
============================================ */
const PrimarySidebarIcon = ({ icon: Icon, label, isActive, onClick, badge = null, href = null }) => {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className="flex flex-col items-center w-full select-none">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        title={label}
        className={`
          relative flex items-center justify-center
          w-10 h-10 rounded-xl
          transition-all duration-200
          ${isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:text-foreground'
          }
        `}
      >
        <Icon className="w-5 h-5" />

        {badge && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            {badge}
          </span>
        )}
      </motion.button>

      {/* Label */}
      <span className="mt-0.5 text-[10px] leading-none text-center text-muted-foreground">
        {label}
      </span>
    </div>
  );
};

/* ============================================
   Secondary Nav Item
============================================ */
const SecondaryNavItem = ({ icon: Icon, label, href, indent = false, badge = null, onClick }) => {
  const pathname = usePathname();
  const isActive = href === pathname || (href !== '/' && pathname?.startsWith(href));

  const content = (
    <motion.div
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer
        text-sm transition-all duration-200 font-body
        ${indent ? 'ml-3' : ''}
        ${isActive
          ? 'glass-button text-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-[var(--glass-hover)]'
        }
      `}
    >
      {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />}
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

/* ============================================
   Collapsible Nav Group
============================================ */
const NavGroup = ({ icon: Icon, label, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-0.5">
      <motion.div
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-all duration-200 font-body text-muted-foreground hover:text-foreground hover:bg-[var(--glass-hover)]"
      >
        <motion.span
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="w-4 h-4 flex items-center justify-center"
        >
          <FiChevronRight className="w-3.5 h-3.5" />
        </motion.span>
        {Icon && <Icon className="w-4 h-4" />}
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
            <div className="mt-0.5 space-y-0.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ============================================
   Section Label
============================================ */
const SectionLabel = ({ label, action = null }) => (
  <div className="flex items-center justify-between px-3 pt-4 pb-1.5">
    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
      {label}
    </span>
    {action}
  </div>
);

/* ============================================
   Workspace Profile Dropdown
============================================ */
const WorkspaceProfileDropdown = ({ user, isOpen, onClose, dropdownRef }) => {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      ref={dropdownRef}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute top-full left-0 mt-2 w-64 glass-dropdown rounded-xl overflow-hidden z-50"
    >
      {/* User Info */}
      <div className="p-4 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold text-sm">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-2 space-y-0.5">
        <button
          onClick={() => { onClose(); router.push('/invite'); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-[var(--glass-hover)] transition-colors"
        >
          <FiUserPlus className="w-4 h-4 text-muted-foreground" />
          <span>Invite users</span>
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">1</span>
        </button>

        <button
          onClick={() => { onClose(); router.push('/settings/workspace'); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-[var(--glass-hover)] transition-colors"
        >
          <FiSettings className="w-4 h-4 text-muted-foreground" />
          <span>Workspace settings</span>
        </button>

        <button
          onClick={() => { onClose(); router.push('/workspaces'); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-[var(--glass-hover)] transition-colors"
        >
          <HiOutlineSwitchHorizontal className="w-4 h-4 text-muted-foreground" />
          <span>Switch workspace</span>
          <FiChevronRight className="ml-auto w-4 h-4 text-muted-foreground" />
        </button>

        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-[var(--glass-hover)] transition-colors"
        >
          <HiOutlineColorSwatch className="w-4 h-4 text-muted-foreground" />
          <span>Color theme</span>
          <span className="ml-auto">
            {isDark ? <FiMoon className="w-4 h-4" /> : <FiSun className="w-4 h-4" />}
          </span>
        </button>
      </div>

      {/* Account Section */}
      <div className="p-2 border-t border-[var(--glass-border)] space-y-0.5">
        <button
          onClick={() => { onClose(); router.push('/profile'); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-[var(--glass-hover)] transition-colors"
        >
          <FiUser className="w-4 h-4 text-muted-foreground" />
          <span>Account settings</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <FiLogOut className="w-4 h-4" />
          <span>Log out</span>
        </button>
      </div>
    </motion.div>
  );
};

/* ============================================
   Campaign Item for Secondary Sidebar
============================================ */
const CampaignItem = ({ campaign, isActive }) => (
  <Link href={`/campaign/${campaign.id}`}>
    <motion.div
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={`
        flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer
        text-sm transition-all duration-200
        ${isActive
          ? 'glass-button text-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-[var(--glass-hover)]'
        }
      `}
    >
      <span className="w-2 h-2 rounded-full bg-primary/60" />
      <span className="flex-1 truncate">{campaign.name}</span>
    </motion.div>
  </Link>
);

/* ============================================
   Secondary Sidebar Content - Dynamic per section
============================================ */
const SecondarySidebarContent = ({ activeSection, user, viewMode, hasPermission, hasAnyPermission, campaigns = [], campaignsLoading = false }) => {
  const pathname = usePathname();

  const hasContentPermissions = hasAnyPermission(
    'Upload Video', 'Version Control', 'Delete Video', 'Publish Video',
    'Approve Reject Video', 'Preview Video', 'Request Edits',
    'Edit Metadata', 'Upload Scripts', 'Edit Subtitles'
  );

  const hasCollaborationPermissions = hasAnyPermission(
    'Approve Review', 'Request Revision', 'Reject Review',
    'Team Only Comments', 'Resolve Comment', 'Delete Comment', 'Comment Video'
  );

  switch (activeSection) {
    case 'campaigns':
      return (
        <>
          <SectionLabel label="Campaigns" />
          <SecondaryNavItem icon={FiHome} label="All Campaigns" href="/campaign" />

          <div className="px-3 py-2">
            <Link href="/campaign/new">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <FiPlus className="w-4 h-4" />
                New Campaign
              </motion.button>
            </Link>
          </div>

          <SectionLabel label="All Campaigns" />
          {campaignsLoading ? (
            <div className="px-3 py-4 text-center">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : campaigns.length > 0 ? (
            <div className="space-y-0.5">
              {campaigns.map((campaign) => (
                <CampaignItem
                  key={campaign.id}
                  campaign={campaign}
                  isActive={pathname === `/campaign/${campaign.id}`}
                />
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 text-xs text-muted-foreground text-center">
              No campaigns yet
            </div>
          )}
        </>
      );

    case 'chat':
      return (
        <>
          <SectionLabel label="Messages" />
          <SecondaryNavItem icon={FiMessageSquare} label="All Messages" href="/chat" />
          <SecondaryNavItem icon={FiUsers} label="Team Chat" href="/chat/team" />

          <SectionLabel label="Direct Messages" />
          <SecondaryNavItem label="Coming soon..." />
        </>
      );

    case 'assets':
      return (
        <>
          <SectionLabel label="Asset Library" />
          <SecondaryNavItem icon={FiFolderPlus} label="All Assets" href="/assets" />
          <SecondaryNavItem icon={FiVideo} label="Videos" href="/assets?type=videos" />
          <SecondaryNavItem icon={FiFilm} label="Images" href="/assets?type=images" />
          <SecondaryNavItem icon={FiFileText} label="Documents" href="/assets?type=docs" />
        </>
      );

    case 'content':
      return (
        <>
          <SectionLabel label="Content Operations" />

          {hasContentPermissions && (
            <>
              <NavGroup icon={FiVideo} label="Video Management" defaultOpen>
                <SecondaryNavItem icon={FiFilm} label="My Videos" href="/videos" indent />
                {hasAnyPermission('Publish Video', 'Approve Reject Video') && (
                  <SecondaryNavItem icon={FiCheckSquare} label="Approvals" href="/videos/approval" indent />
                )}
              </NavGroup>

              <SecondaryNavItem icon={FiFileText} label="Docs" href="/docs" />
              <SecondaryNavItem icon={FiBell} label="Notifications" href="/notification" />
              <SecondaryNavItem icon={FiShare2} label="Social Accounts" href="/socials" />
              <SecondaryNavItem icon={FiFileText} label="Posts" href="/posts" />
            </>
          )}

          {hasCollaborationPermissions && (
            <>
              <SectionLabel label="Collaboration" />
              {hasAnyPermission('Approve Review', 'Request Revision', 'Reject Review') && (
                <SecondaryNavItem icon={FiCheckSquare} label="Reviews" href="/reviews" />
              )}
              {hasAnyPermission('Team Only Comments', 'Resolve Comment', 'Delete Comment', 'Comment Video') && (
                <SecondaryNavItem icon={FiMessageSquare} label="Comments" href="/comments" />
              )}
            </>
          )}
        </>
      );

    case 'admin':
      return (
        <>
          <SectionLabel label="Dashboard" />
          <SecondaryNavItem icon={FiGrid} label="Overview" href="/dashboard" />
          <SecondaryNavItem icon={FiBarChart2} label="Analytics" href="/reports" />

          <SectionLabel label="Team" />
          <SecondaryNavItem icon={FiUsers} label="Employees" href="/employees" />

          <NavGroup icon={FiUserCheck} label="Contractors" defaultOpen={false}>
            <SecondaryNavItem icon={FiTarget} label="Agencies" href="/agencies" indent />
            <SecondaryNavItem icon={FiUsers} label="Freelancers" href="/freelancers" indent />
            <SecondaryNavItem icon={FiFileText} label="Create Contract" href="/contract/add" indent />
          </NavGroup>

          <SectionLabel label="System" />
          <SecondaryNavItem icon={FiShield} label="Roles & Permissions" href="/roles" />
          <SecondaryNavItem icon={FiGitBranch} label="Hierarchy" href="/hierarchy" />
          <SecondaryNavItem icon={FiPlus} label="Integrations" href="/integrations" />
        </>
      );

    default:
      return (
        <>
          <SectionLabel label="Navigation" />
          <SecondaryNavItem icon={FiHome} label="Home" href="/dashboard" />
        </>
      );
  }
};

/* ============================================
   MAIN WORKSPACE SIDEBAR COMPONENT
============================================ */
const WorkspaceSidebar = ({ user, userType: initialUserType }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('campaigns');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState(initialUserType);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isAdmin = initialUserType === 'admin';
  const isSolo = initialUserType === 'solo';

  // Fetch campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (activeSection !== 'campaigns') return;

      setCampaignsLoading(true);
      try {
        const response = await fetch('/api/employees/campaign', {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.success && data.campaigns) {
          setCampaigns(data.campaigns);
        }
      } catch (error) {
        console.error('Failed to fetch campaigns:', error);
      } finally {
        setCampaignsLoading(false);
      }
    };

    fetchCampaigns();
  }, [activeSection]);

  // Determine active section based on pathname
  useEffect(() => {
    if (pathname?.startsWith('/campaign')) setActiveSection('campaigns');
    else if (pathname?.startsWith('/chat')) setActiveSection('chat');
    else if (pathname?.startsWith('/assets')) setActiveSection('assets');
    else if (pathname?.startsWith('/videos') || pathname?.startsWith('/docs') || pathname?.startsWith('/notification') || pathname?.startsWith('/socials') || pathname?.startsWith('/posts')) setActiveSection('content');
    else if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/employees') || pathname?.startsWith('/roles') || pathname?.startsWith('/hierarchy') || pathname?.startsWith('/integrations') || pathname?.startsWith('/agencies') || pathname?.startsWith('/freelancers') || pathname?.startsWith('/contract') || pathname?.startsWith('/reports')) setActiveSection('admin');
  }, [pathname]);

  // Global keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasPermission = (permissionName) => {
    if (!user) return false;
    if (user.permissionNames?.includes('Superadmin All')) return true;
    if (user.isAdmin || isAdmin) return true;
    return user.permissionNames?.includes(permissionName) || false;
  };

  const hasAnyPermission = (...permissionNames) => {
    return permissionNames.some((permission) => hasPermission(permission));
  };

  // Filter sections based on user type
  const visibleSections = MAIN_SECTIONS.filter(section => {
    if (isSolo) return ['campaigns', 'assets', 'content'].includes(section.id);
    if (!isAdmin && section.id === 'admin') return false;
    return true;
  });

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 glass-sidebar flex items-center justify-between px-4 z-50">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-[var(--glass-hover)] text-foreground"
        >
          <FiGrid className="w-5 h-5" />
        </motion.button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-xs">
            {user?.company_name?.charAt(0) || 'C'}
          </div>
          <span className="text-sm font-semibold text-foreground">{user?.company_name || 'Workspace'}</span>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setSearchModalOpen(true)}
          className="p-2 rounded-lg hover:bg-[var(--glass-hover)] text-muted-foreground"
        >
          <FiSearch className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Slide-out Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="md:hidden fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] glass-sidebar z-50 flex flex-col"
          >
            {/* Mobile Menu Header */}
            <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {user?.company_name?.charAt(0) || 'C'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{user?.company_name || 'Workspace'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--glass-hover)] text-muted-foreground"
              >
                <FiX className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Mobile Section Tabs */}
            <div className="p-3 border-b border-[var(--glass-border)]">
              <div className="flex flex-wrap gap-2">
                {visibleSections.map((section) => (
                  <motion.button
                    key={section.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeSection === section.id
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-[var(--glass-hover)] hover:text-foreground'
                    }`}
                  >
                    <section.icon className="w-4 h-4" />
                    <span>{section.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Mobile Navigation Content */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 glass-scrollbar">
              <SecondarySidebarContent
                activeSection={activeSection}
                user={user}
                viewMode={viewMode}
                hasPermission={hasPermission}
                hasAnyPermission={hasAnyPermission}
                campaigns={campaigns}
                campaignsLoading={campaignsLoading}
              />
            </nav>

            {/* Mobile Menu Footer */}
            <div className="p-3 border-t border-[var(--glass-border)] space-y-2">
              <Link href="/integrations" onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--glass-hover)] transition-colors">
                  <SiGitconnected className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-foreground">Integrations</span>
                </div>
              </Link>
              <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--glass-hover)] transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground font-medium text-xs">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user?.role?.name?.replace(/_/g, ' ') || 'User'}</p>
                  </div>
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    <div className="hidden md:flex h-screen sticky top-0">
      {/* PRIMARY SIDEBAR - Narrow icon bar */}
      <aside className="w-16 flex-shrink-0 glass-sidebar flex flex-col items-center py-4 z-20">
        {/* Workspace Avatar / Profile */}
        <div className="relative mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg hover:shadow-xl transition-shadow"
          >
            {user?.company_name?.charAt(0) || 'C'}
          </motion.button>

          <AnimatePresence>
            {profileDropdownOpen && (
              <WorkspaceProfileDropdown
                user={user}
                isOpen={profileDropdownOpen}
                onClose={() => setProfileDropdownOpen(false)}
                dropdownRef={dropdownRef}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="w-8 h-px bg-[var(--glass-border)] mb-4" />

        {/* Main Section Icons */}
        <nav className="flex-1 flex flex-col items-center gap-2">
          {visibleSections.map((section) => (
            <PrimarySidebarIcon
              key={section.id}
              icon={section.icon}
              label={section.label}
              isActive={activeSection === section.id}
              onClick={section.hasSecondary ? () => setActiveSection(section.id) : null}
              href={!section.hasSecondary ? section.defaultHref : section.defaultHref}
            />
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-2 mt-auto pt-4">
          <Link href={'/integrations'}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode(prev => prev === 'admin' ? 'employee' : 'admin')}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${viewMode === 'admin'
                ? 'bg-primary/20 text-primary'
                : 'sidebar-icon text-muted-foreground hover:text-foreground'
                }`}
              title={'Integrations'}
            >
              <SiGitconnected className="w-5 h-5" />
            </motion.button>
          </Link>

          {/* Search */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSearchModalOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl sidebar-icon text-muted-foreground hover:text-foreground"
            title="Search (⌘K)"
          >
            <FiSearch className="w-5 h-5" />
          </motion.button>
        </div>
      </aside>

      {/* SECONDARY SIDEBAR - Context-aware navigation */}
      <AnimatePresence>
        {!sidebarCollapsed && MAIN_SECTIONS.find(s => s.id === activeSection)?.hasSecondary && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 224, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 glass-sidebar-secondary flex flex-col h-screen overflow-hidden"
          >
            {/* Section Header */}
            <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                {MAIN_SECTIONS.find(s => s.id === activeSection)?.label || 'Navigation'}
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSidebarCollapsed(true)}
                className="p-1 rounded hover:bg-[var(--glass-hover)] text-muted-foreground hover:text-foreground transition-colors"
                title="Collapse sidebar"
              >
                <FiChevronLeft className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Navigation Content */}
            <nav className="flex-1 overflow-y-auto px-2 py-2 glass-scrollbar">
              <SecondarySidebarContent
                activeSection={activeSection}
                user={user}
                viewMode={viewMode}
                hasPermission={hasPermission}
                hasAnyPermission={hasAnyPermission}
                campaigns={campaigns}
                campaignsLoading={campaignsLoading}
              />
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-[var(--glass-border)]">
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--glass-hover)] cursor-pointer transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground font-medium text-xs">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.role?.name?.replace(/_/g, ' ') || 'User'}
                  </p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Collapsed Sidebar Toggle */}
      {sidebarCollapsed && MAIN_SECTIONS.find(s => s.id === activeSection)?.hasSecondary && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSidebarCollapsed(false)}
          className="fixed left-16 top-1/2 -translate-y-1/2 p-2 glass-card rounded-r-lg shadow-lg z-10"
          title="Expand sidebar"
        >
          <FiChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.button>
      )}

      {/* Search Modal */}
      <AnimatePresence>
        {searchModalOpen && (
          <SearchModal
            isOpen={searchModalOpen}
            onClose={() => setSearchModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>

    {/* Search Modal for Mobile (outside the hidden div) */}
    <div className="md:hidden">
      <AnimatePresence>
        {searchModalOpen && (
          <SearchModal
            isOpen={searchModalOpen}
            onClose={() => setSearchModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
    </>
  );
};

export default WorkspaceSidebar;
