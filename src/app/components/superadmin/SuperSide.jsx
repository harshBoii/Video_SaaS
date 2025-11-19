'use client'; // Required for using hooks like usePathname
import React from 'react';
import styles from './SuperSide.module.css';
import Logo from '../general/logo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { FiGrid, FiUploadCloud, FiCheckSquare, FiBarChart2, FiHelpCircle, FiSettings,FiPlus,FiClipboard,FiCodesandbox } from 'react-icons/fi';


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

const SuperSide = () => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Logo/>
      </div>
      <nav className={styles.nav}>

        <NavItem icon={<FiGrid />} href="/superadmin" label="Dashboard" />
        <NavItem icon={<FiBarChart2 />} href="/superadmin/reports" label="Reports" />
      </nav>
      <div className={styles.footer}>
        <NavItem icon={<FiHelpCircle />} label="Help" /> {/* No href = not a link */}
        <NavItem icon={<FiSettings />} href='/settings' label="Settings" />
      </div>
       <div className={styles.copyright}>
            <p>Privacy Policy | Terms</p>
            <p>@ 2025 CreateOS Pvt. Ltd.</p>
        </div>
    </aside>
  );
};

export default SuperSide;