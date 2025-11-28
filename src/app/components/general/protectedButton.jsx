'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { useCampaignPermissions } from '@/app/context/permissionContext';

const glassButton =
  "relative overflow-hidden  text-blue-700 font-semibold  border " +
  "shadow-xl rounded-xl px-6 py-3 transition-all duration-200 group flex items-center justify-center";

const highlight =
  "absolute inset-0 pointer-events-none rounded-xl transition";

function toTitleCase(str = '') {
  return str
    .replace(/^[-_]*(.)/, (_, c) => c.toUpperCase())
    .replace(/[-_]+(.)/g, (_, c) => ' ' + c.toUpperCase());
}

export default function ProtectedButton({ requiredPermissions, children, ...props }) {
  const { permissionsData, loading } = useCampaignPermissions();

  if (loading || !permissionsData) return null;

  // Check if user is admin or has superadmin/admin role
  const isAdmin = permissionsData.isAdmin === true;
  const isSuperAdmin = permissionsData.role?.toLowerCase() === 'superadmin' || 
                       permissionsData.role?.toLowerCase() === 'admin';
  const hasSuperAdminPermission = permissionsData.permissions?.some(p => 
    toTitleCase(p).toLowerCase() === 'superadmin all'
  );

  // Allow if user is admin or has admin/superadmin role
  if (isAdmin || isSuperAdmin || hasSuperAdminPermission) {
    return (
      <motion.button
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.97, y: 1 }}
        className={glassButton}
        {...props}
      >
        <span className={highlight} />
        <span className="relative z-10">{children}</span>
      </motion.button>
    );
  }

  // Check specific permissions
  const permissions = permissionsData.permissions || [];
  const standardized = permissions.map(toTitleCase);
  const needed = requiredPermissions.map(toTitleCase);
  const allowed = needed.some(perm => standardized.includes(perm));

  if (!allowed) return null;

  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97, y: 1 }}
      className={glassButton}
      {...props}
    >
      <span className={highlight} />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
