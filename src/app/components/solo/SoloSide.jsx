'use client';
import React from 'react';
import styles from './SoloSide.module.css';
import Logo from '../general/logo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '../general/ThemeToggler';
import { 
  FiGrid, FiBarChart2, FiHelpCircle, FiSettings,
  FiUser, FiClipboard, FiPlayCircle, FiFolder 
} from 'react-icons/fi';

const NavItem = ({ icon, label, href }) => {
  const pathname = usePathname();
  const active = href === pathname;

  if (href) {
    return (
      <Link href={href} className={`${styles.navItem} ${active ? styles.active : ''}`}>
        <span className={styles.navIcon}>{icon}</span>
        <span className={styles.navLabel}>{label}</span>
      </Link>
    );
  }

  return (
    <div className={styles.navItem}>
      <span className={styles.navIcon}>{icon}</span>
      <span className={styles.navLabel}>{label}</span>
    </div>
  );
};

const SoloSide = () => {
  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <Logo />
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <NavItem icon={<FiGrid />} href="/solo" label="Dashboard" />
        <NavItem icon={<FiPlayCircle />} href="/solo/videos" label="Videos" />
        <NavItem icon={<FiFolder />} href="/solo/projects" label="Projects" />
        <NavItem icon={<FiClipboard />} href="/solo/notification" label="Comments" />
        <NavItem icon={<FiUser />} href="/solo/profile" label="Profile" />
      </nav>

      {/* Footer Section */}
      <div className={styles.footer}>
        {/* Theme Toggle Row */}
        <div className={styles.themeRow}>
          <span className={styles.themeLabel}>Theme</span>
        </div>

        {/* Help Link */}
        <NavItem icon={<FiHelpCircle />} label="Help" />
      </div>

      {/* Copyright */}
      <div className={styles.copyright}>
        <p>Privacy Policy | Terms</p>
        <p>© 2025 ClipFox Pvt. Ltd.</p>
      </div>
    </aside>
  );
};

export default SoloSide;
