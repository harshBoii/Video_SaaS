'use client';
import React, { useEffect, useState } from 'react';
import styles from './EmployeeSide.module.css';
import Logo from '../general/logo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FiGrid, 
  FiVideo, 
  FiCheckSquare, 
  FiBarChart2, 
  FiHelpCircle, 
  FiSettings, 
  FiUsers,
  FiClipboard, 
  FiCodesandbox, 
  FiGitBranch,
  FiMessageSquare,
  FiBell
} from 'react-icons/fi';
import Spinner from '../general/spinner';

const NavItem = ({ icon, label, href }) => {
  const pathname = usePathname();
  const active = href === pathname;

  if (href) {
    return (
      <Link href={href} className={`${styles.navItem} ${active ? styles.active : ''}`}>
        {icon}
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <div className={styles.navItem}>
      {icon}
      <span>{label}</span>
    </div>
  );
};

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
    
    console.log("Permission are :", user.permissionNames)

    return user.permissionNames?.includes(permissionName) || false;

  };

  // Helper function to check multiple permissions (OR logic)
  const hasAnyPermission = (...permissionNames) => {
    return permissionNames.some(permission => hasPermission(permission));
  };

  if (loading) {
    return (
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <Logo />
        </div>
        <div className={`${styles.nav} flex items-center justify-center`}>
          <Spinner/>
        </div>
      </aside>
    );
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Logo />
      </div>
      <nav className={styles.nav}>
        {/* Dashboard - Always visible to authenticated users */}
        <NavItem icon={<FiGrid />} href="/employee/campaign" label="Campaigns" />
        <NavItem icon={<FiBell />} href="/employee/notification" label="Notification" />

        {/* Campaigns - Project permissions */}
        {/* {hasAnyPermission(
          'Create Campaign',
          'Assign Team',
          'Manage Workflows',
          'View Analytics',
          'Tag Content'
        ) && (
          <NavItem icon={<FiUploadCloud />} href="/admin/campaigns" label="Campaigns" />
        )} */}

        {/* Videos - Video management permissions */}
        {hasAnyPermission(
          'Upload Video',
          'Version Control',
          'Delete Video',
          'Publish Video',
          'Approve Reject Video',
          'Preview Video',
          'Request Edits'
        ) && (
          <NavItem icon={<FiVideo />} href="/admin/videos" label="Videos" />
        )}

        {/* Review Workflow - Review permissions */}
        {hasAnyPermission(
          'Approve Review',
          'Request Revision',
          'Reject Review'
        ) && (
          <NavItem icon={<FiCheckSquare />} href="/admin/reviews" label="Reviews" />
        )}

        {/* Comments - Comment permissions */}
        {hasAnyPermission(
          'Team Only Comments',
          'Resolve Comment',
          'Delete Comment',
          'Comment Video'
        ) && (
          <NavItem icon={<FiMessageSquare />} href="/admin/comments" label="Comments" />
        )}

        {/* Metadata & Scripts - Metadata permissions */}
        {hasAnyPermission(
          'Edit Metadata',
          'Upload Scripts',
          'Edit Subtitles'
        ) && (
          <NavItem icon={<FiClipboard />} href="/admin/metadata" label="Metadata" />
        )}

        {/* Users & Teams - User/Team management permissions */}
        {hasPermission(
          'Manage Users',
        ) && (
          <NavItem icon={<FiUsers />} href="/admin/employees" label="Users & Teams" />
        )}

        {/* Roles - Role management permission */}
        {hasAnyPermission('Manage Roles',
                          'Assign Permissions'
        ) && (
          <NavItem icon={<FiCodesandbox />} href="/admin/roles" label="Roles" />
        )}

        {/* Hierarchy - Organization view (if you implement this) */}
        {hasAnyPermission(
          'Manage Workflows'
        ) && (
          <NavItem icon={<FiGitBranch />} href="/admin/hierarchy" label="Hierarchy" />
        )}

        {/* Analytics - View Analytics permission */}
        {hasPermission('View Analytics') && (
          <NavItem icon={<FiBarChart2 />} href="/admin/analytics" label="Analytics" />
        )}
      </nav>
      
      <div className={styles.footer}>
        <NavItem icon={<FiHelpCircle />} label="Help" />
        <NavItem icon={<FiSettings />} href="/settings" label="Settings" />
      </div>
      
      <div className={styles.copyright}>
        <p>Privacy Policy | Terms</p>
        <p>© 2025 CreateOS Pvt. Ltd.</p>
      </div>
    </aside>
  );
};

export default EmployeeSide;
