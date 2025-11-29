// app/components/campaign/CampaignVideo.jsx
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
  Lock
} from 'lucide-react';
import { showSuccess, showError, showConfirm } from '@/app/lib/swal';
import VideoPlayer from '../video/VideoPlayer';
import ProtectedButton from '../general/protectedButton';
import { CampaignPermissionsProvider, useCampaignPermissions } from '@/app/context/permissionContext';
import ProtectedShareModal from '../video/ProtectedShareModal';
import { Share2 } from 'lucide-react'; // Import Share icon

// Helper function
function toTitleCase(str = '') {
  return str
    .replace(/^[-_]*(.)/, (_, c) => c.toUpperCase())
    .replace(/[-_]+(.)/g, (_, c) => ' ' + c.toUpperCase());
}

// Protected Upload Section Component
function ProtectedUploadSection({ campaign, loading, uploadingFile, uploadProgress, onFileUpload }) {
  const { permissionsData, loading: permissionsLoading } = useCampaignPermissions();

  if (permissionsLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Video</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!permissionsData) {
    return null;
  }

  // Check permissions
  const isAdmin = permissionsData.isAdmin === true;
  const isSuperAdmin = permissionsData.role?.toLowerCase() === 'superadmin' || 
                       permissionsData.role?.toLowerCase() === 'admin';
  const hasSuperAdminPermission = permissionsData.permissions?.some(p => 
    toTitleCase(p).toLowerCase() === 'superadmin all'
  );

  const permissions = permissionsData.permissions || [];
  const standardized = permissions.map(toTitleCase);
  const requiredPermissions = ['Upload Video'];
  const hasPermission = requiredPermissions.some(perm => standardized.includes(perm));

  const allowed = isAdmin || isSuperAdmin || hasSuperAdminPermission || hasPermission;

  // If no permission, show restricted message
  if (!allowed) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Video</h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-lg font-medium text-gray-600 mb-1">
            Upload Restricted
          </p>
          <p className="text-sm text-gray-500">
            You don't have permission to upload videos to this campaign
          </p>
        </div>
      </div>
    );
  }

  // Render upload section with permission
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Video</h3>
      
      <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors bg-blue-50/50">
        {!uploadingFile ? (
          <label className="cursor-pointer block">
            <Upload className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-900 mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-sm text-gray-600 mb-4">
              MP4, MOV, AVI, MKV, WEBM up to 100GB
            </p>
            <input
              type="file"
              accept="video/*"
              onChange={onFileUpload}
              className="hidden"
              disabled={loading}
            />
            <div className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Select Video File
            </div>
          </label>
        ) : (
          <div>
            <FileVideo className="w-12 h-12 text-blue-600 mx-auto mb-3 animate-pulse" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Uploading: {uploadingFile.name}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              {(uploadingFile.size / 1024 / 1024 / 1024).toFixed(2)} GB
            </p>
            <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full"
              />
            </div>
            <p className="text-sm font-medium text-blue-600">{uploadProgress}% complete</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Component
export default function CampaignVideo({ campaign, onUpdate, campaignId }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    fetchVideos();
    fetchStats();
  }, [campaign.id]);

  const fetchVideos = async () => {
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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingFile(file);
    setLoading(true);
    setUploadProgress(0);

    try {
      console.log('[UPLOAD] Starting upload for:', file.name);
      const getVideoDuration = (file) => {
          return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
              window.URL.revokeObjectURL(video.src);
              resolve(video.duration);
            };
            video.onerror = () => {
              resolve(null); // Fail silently if not a video
            };
            video.src = URL.createObjectURL(file);
          });
        };

      const duration = await getVideoDuration(file)

      // Step 1: Start upload
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
        throw new Error(errorData.error || errorData.message || 'Failed to start upload');
      }

      const startData = await startRes.json();
      
      if (!startData.success || !startData.upload || !startData.urls) {
        throw new Error('Invalid response from server');
      }

      const { upload, urls } = startData;
      
      console.log('[UPLOAD] Upload initialized:', {
        uploadId: upload.uploadId,
        totalParts: upload.totalParts,
      });

      // Step 2: Upload parts to R2
      const partSize = upload.partSize;
      const uploadedParts = [];

      for (let i = 0; i < urls.length; i++) {
        const start = i * partSize;
        const end = Math.min(start + partSize, file.size);
        const chunk = file.slice(start, end);

        console.log(`[UPLOAD] Uploading part ${i + 1}/${urls.length} (${chunk.size} bytes)`);

        let uploadRes;
        let retries = 3;
        
        while (retries > 0) {
          try {
            uploadRes = await fetch(urls[i].url, {
              method: 'PUT',
              body: chunk,
              headers: {
                'Content-Type': file.type,
              },
            });

            if (uploadRes.ok) break;
            
            console.warn(`[UPLOAD] Part ${i + 1} failed (${uploadRes.status}), retrying... (${retries - 1} left)`);
            retries--;
            
            if (retries === 0) {
              throw new Error(`Failed to upload part ${i + 1}: ${uploadRes.status}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (fetchError) {
            console.error(`[UPLOAD] Network error uploading part ${i + 1}:`, fetchError);
            retries--;
            
            if (retries === 0) {
              throw new Error(`Network error uploading part ${i + 1}: ${fetchError.message}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        const etag = uploadRes.headers.get('ETag');
        
        if (!etag) {
          throw new Error(`Part ${i + 1} uploaded but no ETag received`);
        }

        uploadedParts.push({
          PartNumber: urls[i].partNumber,
          ETag: etag.replace(/"/g, ''),
        });

        console.log(`[UPLOAD] Part ${i + 1} uploaded successfully`);
        setUploadProgress(Math.round(((i + 1) / urls.length) * 100));
      }

      console.log('[UPLOAD] All parts uploaded, completing...');

      // Step 3: Complete upload
      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId: upload.uploadId,
          key: upload.key,
          parts: uploadedParts,
          duration:duration,
        })
      });

      if (!completeRes.ok) {
        const errorData = await completeRes.json();
        throw new Error(errorData.error || errorData.message || 'Failed to complete upload');
      }

      const result = await completeRes.json();
      
      if (result.success) {
        console.log('[UPLOAD] Upload completed successfully:', result.video);
        await showSuccess('Upload Complete', 'Video uploaded successfully and queued for processing');
        fetchVideos();
        fetchStats();
        if (onUpdate) onUpdate();
      } else {
        throw new Error(result.error || 'Upload completion failed');
      }
    } catch (error) {
      console.error('[UPLOAD ERROR]', error);
      await showError('Upload Failed', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setUploadingFile(null);
      setUploadProgress(0);
    }
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
          uploadingFile={uploadingFile}
          uploadProgress={uploadProgress}
          onFileUpload={handleFileUpload}
        />

        {/* Rest of the component remains the same... */}
        {/* Filters, Videos Table, Modals, etc. */}
        
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
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
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
                {filteredVideos.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">
                        {searchQuery || statusFilter 
                          ? 'No videos match your filters'
                          : 'No videos uploaded yet. Upload your first video to get started!'
                        }
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
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-24 h-14 object-cover rounded-lg border border-gray-200"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="w-24 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center border border-blue-200" style={{ display: video.thumbnailUrl ? 'none' : 'flex' }}>
                            <Video className="w-8 h-8 text-blue-500" />
                          </div>
                          <div>
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
                        {video.durationFormatted || '-'}
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
                                requiredPermissions={['Share Video']} // Optional: if you want to restrict sharing
                              >
                                <Share2 className="w-4 h-4" />
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
