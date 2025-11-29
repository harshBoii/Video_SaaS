// components/video/ProtectedCommentSection.jsx
'use client';
import { useCampaignPermissions } from '@/app/context/permissionContext';
import CommentSection from './CommentSection';
import { Loader2, Lock } from 'lucide-react';

function toTitleCase(str = '') {
  return str
    .replace(/^[-_]*(.)/, (_, c) => c.toUpperCase())
    .replace(/[-_]+(.)/g, (_, c) => ' ' + c.toUpperCase());
}

export default function ProtectedCommentSection({ 
  videoId, 
  currentTime   ,
  isPublicView = false,  
  allowPublicComments = false ,
  onSeek
 }) {
    if (isPublicView) 
      {
    if (!allowPublicComments) return null; 
    
    return (
      <div className="flex-[3] bg-white border-l border-gray-200 flex flex-col max-h-screen">
        <CommentSection 
          videoId={videoId} 
          currentTime={currentTime} 
          isPublic={true} 
          onSeek={onSeek}
        />
      </div>
    );
      }

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
        return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Comments Restricted</h3>
          <p className="text-sm text-gray-600">
            You don't have permission to view or add comments.
          </p>
        </div>
      </div>
            )
  }

  // Render the comment section
  return (
    <div className="flex-[3] bg-white border-l border-gray-200 flex flex-col max-h-screen">
      <CommentSection videoId={videoId} currentTime={currentTime}  onSeek={onSeek} />
    </div>
  );
}
// components/video/ProtectedCommentSection.jsx
// 'use client';
// import { useCampaignPermissions } from '@/app/context/permissionContext';
// import CommentSection from './CommentSection';
// import { Loader2, Lock } from 'lucide-react';

// function toTitleCase(str = '') {
//   return str
//     .replace(/^[-_]*(.)/, (_, c) => c.toUpperCase())
//     .replace(/[-_]+(.)/g, (_, c) => ' ' + c.toUpperCase());
// }

// export default function ProtectedCommentSection({ 
//   videoId, 
//   currentTime,
//   isPublicView = false,  
//   allowPublicComments = false,
//   onSeek
// }) {
//   // ✅ Public view handling (no wrapper div)
//   if (isPublicView) {
//     if (!allowPublicComments) return null; 
    
//     return (
//       <CommentSection 
//         videoId={videoId} 
//         currentTime={currentTime} 
//         isPublic={true} 
//         onSeek={onSeek}
//       />
//     );
//   }

//   const { permissionsData, loading } = useCampaignPermissions();

//   // ✅ Show loading state instead of null
//   if (loading || !permissionsData) {
//     return (
//       <div className="flex items-center justify-center h-full bg-gray-50">
//         <div className="text-center">
//           <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
//           <p className="text-sm text-gray-500">Loading permissions...</p>
//         </div>
//       </div>
//     );
//   }

//   // Check permissions
//   const isAdmin = permissionsData.isAdmin === true;
//   const isSuperAdmin = permissionsData.role?.toLowerCase() === 'superadmin' || 
//                        permissionsData.role?.toLowerCase() === 'admin';
//   const hasSuperAdminPermission = permissionsData.permissions?.some(p => 
//     toTitleCase(p).toLowerCase() === 'superadmin all'
//   );

//   const permissions = permissionsData.permissions || [];
//   const standardized = permissions.map(toTitleCase);
//   const requiredPermissions = ['Comment Video', 'Team Only Comments', 'Preview Video'];
//   const hasPermission = requiredPermissions.some(perm => standardized.includes(perm));

//   const allowed = isAdmin || isSuperAdmin || hasSuperAdminPermission || hasPermission;

//   // ✅ Show "no permission" message instead of null
//   if (!allowed) {
//     return (
//       <div className="flex items-center justify-center h-full bg-gray-50">
//         <div className="text-center p-8">
//           <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
//             <Lock className="w-8 h-8 text-gray-400" />
//           </div>
//           <h3 className="text-lg font-semibold text-gray-900 mb-2">Comments Restricted</h3>
//           <p className="text-sm text-gray-600">
//             You don't have permission to view or add comments.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // ✅ Render WITHOUT wrapper div - let parent handle layout
//   return (
//     <CommentSection 
//       videoId={videoId} 
//       currentTime={currentTime} 
//       onSeek={onSeek} 
//     />
//   );
// }
