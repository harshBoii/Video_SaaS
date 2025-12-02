'use client'; // Required for using hooks like usePathname
import React from 'react';
import styles from './SoloSide.module.css';
import Logo from '../general/logo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { FiGrid, FiBarChart2, FiHelpCircle, FiSettings,FiUser,FiClipboard } from 'react-icons/fi';

// 2. Modify NavItem to handle links and dynamic active state
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

  // If no href, render a non-clickable div (e.g., for "Help")
  return (
    <div className={styles.navItem}>
      {icon}
      <span>{label}</span>
    </div>
  );
};

const SoloSide = () => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Logo/>
      </div>
      <nav className={styles.nav}>
        {/* 3. Use the corrected NavItem with href props for each link */}
        <NavItem icon={<FiGrid />} href="/solo" label="Dashboard" />
        <NavItem icon={<FiClipboard />} href="/solo/notification" label="Comments" />
        <NavItem icon={<FiBarChart2 />} href="/admin/Analytics" label="Analytics" />
        <NavItem icon={<FiUser />} href="/solo/profile" label="Profile" />
      </nav>
      <div className={styles.footer}>
        <NavItem icon={<FiHelpCircle />} label="Help" /> {/* No href = not a link */}
        {/* <NavItem icon={<FiSettings />} href='/settings' label="Settings" /> */}
      </div>
       <div className={styles.copyright}>
            <p>Privacy Policy | Terms</p>
            <p>@ 2025 CreateOS Pvt. Ltd.</p>
        </div>
    </aside>
  );
};

export default SoloSide;