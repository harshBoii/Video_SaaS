'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Video, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Download, 
  Play, 
  Trash2, 
  Eye,
  RefreshCw,
  FileVideo,
  HardDrive,
  Search,
  X,
  Lock,
  Layers,
  Star,
  Plus,
  AlertCircle
} from 'lucide-react';
import { showSuccess, showError, showConfirm } from '@/app/lib/swal';
import VideoPlayer from '../video/VideoPlayer';
import ProtectedButton from '../general/protectedButton';
import { CampaignPermissionsProvider, useCampaignPermissions } from '@/app/context/permissionContext';
import ProtectedShareModal from '../video/ProtectedShareModal';
import { Share2 } from 'lucide-react';
import { ProtectedUploadSection , UploadQueueItem } from './protectedUploadSection';
// Helper function
function toTitleCase(str = '') {
  return str
    .replace(/^[-_]*(.)/, (_, c) => c.toUpperCase())
    .replace(/[-_]+(.)/g, (_, c) => ' ' + c.toUpperCase());
}

// Loading Skeleton Component
function VideoTableSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <tr key={i} className="border-b border-gray-200">
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-24 h-14 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map((j) => (
                <div key={j} className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

// Protected Upload Section Component
// function ProtectedUploadSection({ campaign, loading, uploadingFile, uploadProgress, onFileUpload }) {
//   const { permissionsData, loading: permissionsLoading } = useCampaignPermissions();

//   if (permissionsLoading) {
//     return (
//       <div className="bg-white rounded-xl border border-gray-200 p-6">
//         <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Video</h3>
//         <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
//         </div>
//       </div>
//     );
//   }

//   if (!permissionsData) {
//     return null;
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
//   const requiredPermissions = ['Upload Video'];
//   const hasPermission = requiredPermissions.some(perm => standardized.includes(perm));

//   const allowed = isAdmin || isSuperAdmin || hasSuperAdminPermission || hasPermission;

//   // If no permission, show restricted message
//   if (!allowed) {
//     return (
//       <div className="bg-white rounded-xl border border-gray-200 p-6">
//         <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Video</h3>
        
//         <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
//           <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
//           <p className="text-lg font-medium text-gray-600 mb-1">
//             Upload Restricted
//           </p>
//           <p className="text-sm text-gray-500">
//             You don't have permission to upload videos to this campaign
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // Render upload section with permission
//   return (
//     <div className="bg-white rounded-xl border border-gray-200 p-6">
//       <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Video</h3>
      
//       <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors bg-blue-50/50">
//         {!uploadingFile ? (
//           <label className="cursor-pointer block">
//             <Upload className="w-12 h-12 text-blue-500 mx-auto mb-3" />
//             <p className="text-lg font-medium text-gray-900 mb-1">
//               Click to upload or drag and drop
//             </p>
//             <p className="text-sm text-gray-600 mb-4">
//               MP4, MOV, AVI, MKV, WEBM up to 100GB
//             </p>
//             <input
//               type="file"
//               accept="video/*"
//               onChange={onFileUpload}
//               className="hidden"
//               disabled={loading}
//             />
//             <div className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
//               Select Video File
//             </div>
//           </label>
//         ) : (
//           <div>
//             <FileVideo className="w-12 h-12 text-blue-600 mx-auto mb-3 animate-pulse" />
//             <p className="text-lg font-medium text-gray-900 mb-2">
//               Uploading: {uploadingFile.name}
//             </p>
//             <p className="text-sm text-gray-600 mb-4">
//               {(uploadingFile.size / 1024 / 1024 / 1024).toFixed(2)} GB
//             </p>
//             <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
//               <motion.div
//                 initial={{ width: 0 }}
//                 animate={{ width: `${uploadProgress}%` }}
//                 className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full"
//               />
//             </div>
//             <p className="text-sm font-medium text-blue-600">{uploadProgress}% complete</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// Main Component
export default function CampaignVideo({ campaign, onUpdate, campaignId }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingVideos, setFetchingVideos] = useState(true); // ✅ NEW: Separate loading state for fetching
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [videoToShare, setVideoToShare] = useState(null);
  const [versionUploadModal, setVersionUploadModal] = useState(null);
  const [versionNote, setVersionNote] = useState('');
  const [showVersionModal, setShowVersionModal] = useState(false);
  const MAX_CONCURRENT_UPLOADS = 2;
  const MAX_FILES = 5;
  const [uploadQueue, setUploadQueue] = useState([]);

  useEffect(() => {
    fetchVideos();
    fetchStats();
  }, [campaign.id]);

  const openVersionUploadModal = (video) => {
    setVersionUploadModal(video);
    setShowVersionModal(true);
  };

  const handleVersionUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!versionUploadModal) {
      showError('Error', 'No video selected');
      return;
    }

    const videoId = versionUploadModal.id;

    if (!versionNote.trim()) {
      showError('Error', 'Please provide a version note');
      return;
    }

    setUploadingFile(file);
    setLoading(true);
    setUploadProgress(0);

    try {
      console.log('[VERSION UPLOAD] Starting upload for:', file.name);
      
      const getVideoDuration = (file) => {
        return new Promise((resolve) => {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            resolve(video.duration);
          };
          video.onerror = () => resolve(null);
          video.src = URL.createObjectURL(file);
        });
      };

      const duration = await getVideoDuration(file);

      const startRes = await fetch(`/api/videos/${videoId}/versions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionNote: versionNote,
          fileSize: file.size,
          fileName: file.name,
          fileType: file.type,
        })
      });

      if (!startRes.ok) {
        const errorData = await startRes.json();
        throw new Error(errorData.error || 'Failed to start version upload');
      }

      const startData = await startRes.json();
      
      if (!startData.success || !startData.upload || !startData.urls) {
        throw new Error('Invalid response from server');
      }

      const { upload, urls, version } = startData;
      
      console.log('[VERSION UPLOAD] Upload initialized:', {
        versionId: version.id,
        versionNumber: version.version,
        uploadId: upload.uploadId,
        totalParts: upload.totalParts,
      });

      const partSize = upload.partSize;
      const uploadedParts = [];

      for (let i = 0; i < urls.length; i++) {
        const start = i * partSize;
        const end = Math.min(start + partSize, file.size);
        const chunk = file.slice(start, end);

        console.log(`[VERSION UPLOAD] Uploading part ${i + 1}/${urls.length}`);

        let retries = 3;
        let uploadRes;
        
        while (retries > 0) {
          try {
            uploadRes = await fetch(urls[i].url, {
              method: 'PUT',
              body: chunk,
              headers: { 'Content-Type': file.type },
            });

            if (uploadRes.ok) break;
            retries--;
            if (retries === 0) throw new Error(`Failed to upload part ${i + 1}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            retries--;
            if (retries === 0) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        const etag = uploadRes.headers.get('ETag');
        if (!etag) throw new Error(`Part ${i + 1} missing ETag`);

        uploadedParts.push({
          PartNumber: urls[i].partNumber,
          ETag: etag.replace(/"/g, ''),
        });

        setUploadProgress(Math.round(((i + 1) / urls.length) * 100));
      }

      console.log('[VERSION UPLOAD] All parts uploaded, completing...');

      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId: upload.uploadId,
          key: upload.key,
          parts: uploadedParts,
          duration: duration,
          versionId: version.id,
        })
      });

      if (!completeRes.ok) {
        const errorData = await completeRes.json();
        throw new Error(errorData.error || 'Failed to complete upload');
      }

      const result = await completeRes.json();
      
      if (result.success) {
        console.log('[VERSION UPLOAD] Upload completed:', result);
        await showSuccess('Version Uploaded', `Version ${version.version} uploaded successfully`);
        setShowVersionModal(false);
        setVersionNote('');
        setVersionUploadModal(null);
        fetchVideos();
        fetchStats();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('[VERSION UPLOAD ERROR]', error);
      await showError('Upload Failed', error.message);
    } finally {
      setLoading(false);
      setUploadingFile(null);
      setUploadProgress(0);
    }
  };

  const fetchVideos = async () => {
    setFetchingVideos(true); // ✅ NEW: Set fetching state
    try {
      const response = await fetch(
        `/api/videos/list?projectId=${campaign.id}&limit=50`,
        { credentials: 'include' }
      );

      const data = await response.json();
      if (data.success) {
        setVideos(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setFetchingVideos(false); // ✅ NEW: Clear fetching state
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `/api/videos/list?projectId=${campaign.id}&limit=1`,
        { credentials: 'include' }
      );

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // const handleFileUpload = async (event) => {
    
  //   const file = event.target.files[0];
  //   if (!file) return;

  //   setUploadingFile(file);
  //   setLoading(true);
  //   setUploadProgress(0);

  //   try {
  //     console.log('[UPLOAD] Starting upload for:', file.name);
  //     const getVideoDuration = (file) => {
  //         return new Promise((resolve, reject) => {
  //           const video = document.createElement('video');
  //           video.preload = 'metadata';
  //           video.onloadedmetadata = () => {
  //             window.URL.revokeObjectURL(video.src);
  //             resolve(video.duration);
  //           };
  //           video.onerror = () => {
  //             resolve(null);
  //           };
  //           video.src = URL.createObjectURL(file);
  //         });
  //       };

  //     const duration = await getVideoDuration(file)

  //     const startRes = await fetch('/api/upload/start', {
  //       method: 'POST',
  //       credentials: 'include',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         fileName: file.name,
  //         fileType: file.type,
  //         fileSize: file.size,
  //         campaignId: campaign.id,
  //         metadata: {
  //           title: file.name.replace(/\.[^/.]+$/, ''),
  //           description: `Uploaded to ${campaign.name}`,
  //         }
  //       })
  //     });

  //     if (!startRes.ok) {
  //       const errorData = await startRes.json();
  //       throw new Error(errorData.error || errorData.message || 'Failed to start upload');
  //     }

  //     const startData = await startRes.json();
      
  //     if (!startData.success || !startData.upload || !startData.urls) {
  //       throw new Error('Invalid response from server');
  //     }

  //     const { upload, urls } = startData;
      
  //     console.log('[UPLOAD] Upload initialized:', {
  //       uploadId: upload.uploadId,
  //       totalParts: upload.totalParts,
  //     });

  //     const partSize = upload.partSize;
  //     const uploadedParts = [];

  //     for (let i = 0; i < urls.length; i++) {
  //       const start = i * partSize;
  //       const end = Math.min(start + partSize, file.size);
  //       const chunk = file.slice(start, end);

  //       console.log(`[UPLOAD] Uploading part ${i + 1}/${urls.length} (${chunk.size} bytes)`);

  //       let uploadRes;
  //       let retries = 3;
        
  //       while (retries > 0) {
  //         try {
  //           uploadRes = await fetch(urls[i].url, {
  //             method: 'PUT',
  //             body: chunk,
  //             headers: {
  //               'Content-Type': file.type,
  //             },
  //           });

  //           if (uploadRes.ok) break;
            
  //           console.warn(`[UPLOAD] Part ${i + 1} failed (${uploadRes.status}), retrying... (${retries - 1} left)`);
  //           retries--;
            
  //           if (retries === 0) {
  //             throw new Error(`Failed to upload part ${i + 1}: ${uploadRes.status}`);
  //           }
            
  //           await new Promise(resolve => setTimeout(resolve, 1000));
  //         } catch (fetchError) {
  //           console.error(`[UPLOAD] Network error uploading part ${i + 1}:`, fetchError);
  //           retries--;
            
  //           if (retries === 0) {
  //             throw new Error(`Network error uploading part ${i + 1}: ${fetchError.message}`);
  //           }
            
  //           await new Promise(resolve => setTimeout(resolve, 1000));
  //         }
  //       }

  //       const etag = uploadRes.headers.get('ETag');
        
  //       if (!etag) {
  //         throw new Error(`Part ${i + 1} uploaded but no ETag received`);
  //       }

  //       uploadedParts.push({
  //         PartNumber: urls[i].partNumber,
  //         ETag: etag.replace(/"/g, ''),
  //       });

  //       console.log(`[UPLOAD] Part ${i + 1} uploaded successfully`);
  //       setUploadProgress(Math.round(((i + 1) / urls.length) * 100));
  //     }

  //     console.log('[UPLOAD] All parts uploaded, completing...');

  //     const completeRes = await fetch('/api/upload/complete', {
  //       method: 'POST',
  //       credentials: 'include',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         uploadId: upload.uploadId,
  //         key: upload.key,
  //         parts: uploadedParts,
  //         duration:duration,
  //       })
  //     });

  //     if (!completeRes.ok) {
  //       const errorData = await completeRes.json();
  //       throw new Error(errorData.error || errorData.message || 'Failed to complete upload');
  //     }

  //     const result = await completeRes.json();
      
  //     if (result.success) {
  //       console.log('[UPLOAD] Upload completed successfully:', result.video);
  //       await showSuccess('Upload Complete', 'Video uploaded successfully and queued for processing');
  //       fetchVideos();
  //       fetchStats();
  //       if (onUpdate) onUpdate();
  //     } else {
  //       throw new Error(result.error || 'Upload completion failed');
  //     }
  //   } catch (error) {
  //     console.error('[UPLOAD ERROR]', error);
  //     await showError('Upload Failed', error.message || 'An unexpected error occurred');
  //   } finally {
  //     setLoading(false);
  //     setUploadingFile(null);
  //     setUploadProgress(0);
  //   }
  // };

  const handleFileUpload = async (event) => {
  const files = Array.from(event.target.files);
  if (!files.length) return;
  const currentQueueLength = uploadQueue.length;
  const availableSlots = MAX_FILES - currentQueueLength;
  
  if (files.length > availableSlots) {
    await showError(
      'Too Many Files', 
      `You can only upload ${MAX_FILES} videos at once. You have ${availableSlots} slot(s) remaining.`
    );
    return;
  }

  // Initialize queue with all selected files
  const newQueue = files.map((file, index) => ({
    id: `${Date.now()}-${index}`,
    file,
    progress: 0,
    status: 'pending',
    error: null,
    videoId: null,
  }));

  setUploadQueue(prev => [...prev, ...newQueue]);
  
  // Start processing queue
  processUploadQueue(newQueue);
};

const handleClearQueue = () => {
  // Only clear completed/failed items, not uploading ones
  setUploadQueue(prev => 
    prev.filter(item => item.status === 'uploading')
  );
};

const handleRemoveFromQueue = (id) => {
  setUploadQueue(prev => prev.filter(item => item.id !== id));
};


const processUploadQueue = async (queue) => {
  // setIsUploading(true);

  // Process uploads with concurrency limit
  const chunks = [];
  for (let i = 0; i < queue.length; i += MAX_CONCURRENT_UPLOADS) {
    chunks.push(queue.slice(i, i + MAX_CONCURRENT_UPLOADS));
  }

  for (const chunk of chunks) {
    await Promise.allSettled(
      chunk.map(item => uploadSingleFile(item))
    );
  }

  // setIsUploading(false);
  fetchVideos();
  fetchStats();
  if (onUpdate) onUpdate();
};

const uploadSingleFile = async (queueItem) => {
  const { id, file } = queueItem;

  try {
    // Update status to uploading
    updateQueueItem(id, { status: 'uploading' });

    console.log(`[UPLOAD] Starting upload for: ${file.name}`);

    // Get video duration
    const duration = await getVideoDuration(file);

    // Start upload
    const startRes = await fetch('/api/upload/start', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        campaignId: campaign.id,
        metadata: {
          title: file.name.replace(/\.[^/.]+$/, ''),
          description: `Uploaded to ${campaign.name}`,
        }
      })
    });

    if (!startRes.ok) {
      const errorData = await startRes.json();
      throw new Error(errorData.error || 'Failed to start upload');
    }

    const startData = await startRes.json();
    const { upload, urls } = startData;

    // Upload parts
    const partSize = upload.partSize;
    const uploadedParts = [];

    for (let i = 0; i < urls.length; i++) {
      const start = i * partSize;
      const end = Math.min(start + partSize, file.size);
      const chunk = file.slice(start, end);

      let retries = 3;
      let uploadRes;

      while (retries > 0) {
        try {
          uploadRes = await fetch(urls[i].url, {
            method: 'PUT',
            body: chunk,
            headers: { 'Content-Type': file.type },
          });

          if (uploadRes.ok) break;

          retries--;
          if (retries === 0) throw new Error(`Failed to upload part ${i + 1}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (fetchError) {
          retries--;
          if (retries === 0) throw fetchError;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const etag = uploadRes.headers.get('ETag');
      if (!etag) throw new Error(`Part ${i + 1} uploaded but no ETag received`);

      uploadedParts.push({
        PartNumber: urls[i].partNumber,
        ETag: etag.replace(/"/g, ''),
      });

      // Update progress for this specific file
      const progress = Math.round(((i + 1) / urls.length) * 100);
      updateQueueItem(id, { progress });
    }

    // Complete upload
    const completeRes = await fetch('/api/upload/complete', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId: upload.uploadId,
        key: upload.key,
        parts: uploadedParts,
        duration,
      })
    });

    if (!completeRes.ok) {
      const errorData = await completeRes.json();
      throw new Error(errorData.error || 'Failed to complete upload');
    }

    const result = await completeRes.json();

    // Mark as completed
    updateQueueItem(id, {
      status: 'completed',
      progress: 100,
      videoId: result.video.id,
    });

    console.log(`[UPLOAD] ✅ Completed: ${file.name}`);

  } catch (error) {
    console.error(`[UPLOAD ERROR] ${file.name}:`, error);
    updateQueueItem(id, {
      status: 'failed',
      error: error.message,
    });
  }
};

// Helper to update individual queue item
const updateQueueItem = (id, updates) => {
  setUploadQueue(prev =>
    prev.map(item => item.id === id ? { ...item, ...updates } : item)
  );
};

// Helper function (reuse existing)
const getVideoDuration = (file) => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => resolve(null);
    video.src = URL.createObjectURL(file);
  });
};


  const viewVideoDetails = async (videoId) => {
    try {
      const response = await fetch(`/api/videos/${videoId}/details`, {
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        setSelectedVideo(data.video);
        setShowVideoModal(true);
      }
    } catch (error) {
      await showError('Failed to load video details');
    }
  };

  const downloadVideo = async (videoId, title) => {
    try {
      const response = await fetch(`/api/videos/${videoId}/raw?expiresIn=3600`, {
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        window.open(data.download.url, '_blank');
        await showSuccess('Download Started', `Downloading ${title}`);
      }
    } catch (error) {
      await showError('Download Failed', error.message);
    }
  };

  const openShareModal = (video) => {
    setVideoToShare(video);
    setShareModalOpen(true);
  };

  const playVideo = (video) => {
    if (!video.playbackUrl) {
      showError('Video Not Ready', 'This video is still processing. Please try again later.');
      return;
    }
    setPlayingVideo(video);
  };

  const deleteVideo = async (videoId, title) => {
    const result = await showConfirm(
      'Delete Video?',
      `Are you sure you want to delete "${title}"? This will remove it from both R2 storage and Cloudflare Stream.`,
      'Yes, Delete',
      'Cancel'
    );

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/videos/${videoId}/delete`, {
          method: 'DELETE',
          credentials: 'include'
        });

        const data = await response.json();
        if (data.success) {
          await showSuccess('Video Deleted', 'Video removed successfully');
          fetchVideos();
          fetchStats();
          if (onUpdate) onUpdate();
        }
      } catch (error) {
        await showError('Delete Failed', error.message);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'uploading': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4 animate-spin" />;
      case 'uploading': return <Upload className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || video.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <CampaignPermissionsProvider campaignId={campaignId}>
      <div className="space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Videos</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{stats.totalVideos || 0}</p>
                </div>
                <div className="bg-blue-500 p-3 rounded-lg">
                  <Video className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Ready</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">
                    {stats.statusBreakdown?.ready || 0}
                  </p>
                </div>
                <div className="bg-green-500 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Processing</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-1">
                    {stats.statusBreakdown?.processing || 0}
                  </p>
                </div>
                <div className="bg-yellow-500 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Total Size</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">
                    {stats.totalSizeFormatted || '0 GB'}
                  </p>
                </div>
                <div className="bg-purple-500 p-3 rounded-lg">
                  <HardDrive className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Protected Upload Section */}
        <ProtectedUploadSection
          campaign={campaign}
          loading={loading}
          uploadQueue={uploadQueue}
          onFileUpload={handleFileUpload}
          onClearQueue={handleClearQueue}
          onRemoveFromQueue={handleRemoveFromQueue}
        />
        
        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="ready">Ready</option>
              <option value="processing">Processing</option>
              <option value="uploading">Uploading</option>
              <option value="error">Error</option>
            </select>

            <button
              onClick={() => {
                fetchVideos();
                fetchStats();
              }}
              disabled={fetchingVideos}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${fetchingVideos ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Videos Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Video
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Versions
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Size
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Uploaded
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* ✅ Loading Skeleton */}
                {fetchingVideos ? (
                  <VideoTableSkeleton />
                ) : filteredVideos.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium mb-1">
                        {searchQuery || statusFilter 
                          ? 'No videos match your filters'
                          : 'No videos uploaded yet'
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        {!(searchQuery || statusFilter) && 'Upload your first video to get started!'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredVideos.map((video) => (
                    <motion.tr
                      key={video.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* ✅ Show thumbnail from active version */}
                          {video.thumbnailUrl ? (
                            <div className="relative">
                              <img
                                src={video.thumbnailUrl}
                                alt={video.title}
                                className="w-24 h-14 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="w-24 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center border border-blue-200 absolute inset-0" style={{ display: 'none' }}>
                                <Video className="w-8 h-8 text-blue-500" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-24 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center border border-blue-200">
                              <Video className="w-8 h-8 text-blue-500" />
                            </div>
                          )}
                          <div className='max-w-50'>
                            <p className="font-medium text-gray-900">{video.title}</p>
                            <p className="text-sm text-gray-500">{video.filename}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(video.status)}`}>
                          {getStatusIcon(video.status)}
                          {video.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {/* ✅ Show duration from active version */}
                        {video.durationFormatted || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {/* ✅ Show version count and active version */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
                            <Layers className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold">
                              {video.versionCount || 1}
                            </span>
                          </div>
                          {video.currentVersion && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg border border-green-200">
                              <Star className="w-3 h-3 fill-current" />
                              <span className="text-xs font-semibold">
                                v{video.currentVersion}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {video.originalSizeFormatted}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(video.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => viewVideoDetails(video.id)}
                            className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <ProtectedButton
                            onClick={() => playVideo(video)}
                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={video.playbackUrl ? "Play Video" : "Processing..."}
                            disabled={!video.playbackUrl}
                            requiredPermissions={['Preview Video']}
                          >
                            <Play className="w-4 h-4" />
                          </ProtectedButton>
                          <ProtectedButton
                            onClick={() => downloadVideo(video.id, video.title)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Download"
                            requiredPermissions={['Download Original']}
                          >
                            <Download className="w-4 h-4" />
                          </ProtectedButton>
                          <ProtectedButton
                            onClick={() => deleteVideo(video.id, video.title)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="Delete"
                            requiredPermissions={['Delete Video']}
                          >
                            <Trash2 className="w-4 h-4" />
                          </ProtectedButton>
                          <ProtectedButton
                            onClick={() => openShareModal(video)}
                            className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                            title="Share Video"
                            requiredPermissions={['Share Video']}
                          >
                            <Share2 className="w-4 h-4" />
                          </ProtectedButton>
                          <ProtectedButton
                            onClick={() => openVersionUploadModal(video)}
                            className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                            title="Upload New Version"
                            requiredPermissions={['Upload Video','Version Control']}
                          >
                            <Upload className="w-4 h-4" />
                          </ProtectedButton>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Video Details Modal */}
        <AnimatePresence>
          {showVideoModal && selectedVideo && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setShowVideoModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                    <h3 className="text-xl font-bold text-gray-900">Video Details</h3>
                    <button
                      onClick={() => setShowVideoModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {selectedVideo.thumbnailUrl && (
                      <img
                        src={selectedVideo.thumbnailUrl}
                        alt={selectedVideo.title}
                        className="w-full rounded-lg"
                      />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Title</p>
                        <p className="font-medium text-gray-900">{selectedVideo.title}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Status</p>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedVideo.status)}`}>
                          {getStatusIcon(selectedVideo.status)}
                          {selectedVideo.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Duration</p>
                        <p className="font-medium text-gray-900">{selectedVideo.durationFormatted || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Resolution</p>
                        <p className="font-medium text-gray-900">{selectedVideo.resolution || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">File Size</p>
                        <p className="font-medium text-gray-900">{selectedVideo.originalSizeFormatted}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">FPS</p>
                        <p className="font-medium text-gray-900">{selectedVideo.fps || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Codec</p>
                        <p className="font-medium text-gray-900">{selectedVideo.codec || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Uploaded</p>
                        <p className="font-medium text-gray-900">
                          {new Date(selectedVideo.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      {selectedVideo.playbackUrl && (
                        <button
                          onClick={() => {
                            playVideo(selectedVideo);
                            setShowVideoModal(false);
                          }}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Play Video
                        </button>
                      )}
                      <button
                        onClick={() => {
                          downloadVideo(selectedVideo.id, selectedVideo.title);
                          setShowVideoModal(false);
                        }}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
            {showVersionModal && versionUploadModal && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-40"
                  onClick={() => {
                    setShowVersionModal(false);
                    setVersionNote('');
                  }}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                  <div className="bg-white rounded-2xl max-w-md w-full p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">
                        Upload New Version
                      </h3>
                      <button
                        onClick={() => {
                          setShowVersionModal(false);
                          setVersionNote('');
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Uploading new version for: <span className="font-semibold">{versionUploadModal.title}</span>
                      </p>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Version Note *
                      </label>
                      <textarea
                        value={versionNote}
                        onChange={(e) => setVersionNote(e.target.value)}
                        placeholder="What changed in this version?"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        rows={3}
                      />
                    </div>

                    <label className="block">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVersionUpload}
                        disabled={!versionNote.trim() || loading}
                        className="hidden"
                      />
                      <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        versionNote.trim() && !loading
                          ? 'border-blue-400 bg-blue-50 hover:bg-blue-100'
                          : 'border-gray-300 bg-gray-50 cursor-not-allowed'
                      }`}>
                        <Upload className="w-10 h-10 mx-auto mb-2 text-blue-500" />
                        <p className="text-sm font-medium text-gray-900">
                          {loading ? 'Uploading...' : 'Click to select video file'}
                        </p>
                        {loading && (
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{uploadProgress}%</p>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </motion.div>
              </>
            )}
        </AnimatePresence>

        {/* Video Player Modal */}
        {playingVideo && (
          <VideoPlayer
            video={playingVideo}
            onClose={() => setPlayingVideo(null)}
          />
        )}
      </div>
        <ProtectedShareModal 
          isOpen={shareModalOpen} 
          onClose={() => {
            setShareModalOpen(false);
            setVideoToShare(null);
          }}
          videoId={videoToShare?.id} 
        />

    </CampaignPermissionsProvider>
  );
}