// components/video/ProtectedCommentSection.jsx
'use client';
import { useCampaignPermissions } from '@/app/context/permissionContext';
import CommentSection from './CommentSection';

function toTitleCase(str = '') {
  return str
    .replace(/^[-_]*(.)/, (_, c) => c.toUpperCase())
    .replace(/[-_]+(.)/g, (_, c) => ' ' + c.toUpperCase());
}

export default function ProtectedCommentSection({ videoId, currentTime }) {
  const { permissionsData, loading } = useCampaignPermissions();

  // Don't render anything while loading
  if (loading || !permissionsData) {
    return null;
  }

  // Check if user has permission to view/comment
  const isAdmin = permissionsData.isAdmin === true;
  const isSuperAdmin = permissionsData.role?.toLowerCase() === 'superadmin' || 
                       permissionsData.role?.toLowerCase() === 'admin';
  const hasSuperAdminPermission = permissionsData.permissions?.some(p => 
    toTitleCase(p).toLowerCase() === 'superadmin all'
  );

  // Check for specific comment permissions
  const permissions = permissionsData.permissions || [];
  const standardized = permissions.map(toTitleCase);
  const requiredPermissions = ['Comment Video', 'Team Only Comments', 'Preview Video'];
  const hasPermission = requiredPermissions.some(perm => standardized.includes(perm));

  // Allow if admin or has specific permissions
  const allowed = isAdmin || isSuperAdmin || hasSuperAdminPermission || hasPermission;

  if (!allowed) {
    return null; // Don't render comment section at all if no permission
  }

  // Render the comment section
  return (
    <div className="flex-[3] bg-white border-l border-gray-200 flex flex-col max-h-screen">
      <CommentSection videoId={videoId} currentTime={currentTime} />
    </div>
  );
}
