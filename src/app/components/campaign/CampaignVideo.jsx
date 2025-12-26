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
  AlertCircle,
  Users,
  TrendingUp,
  Calendar,
  User
} from 'lucide-react';
import { showSuccess, showError, showConfirm } from '@/app/lib/swal';
import VideoPlayer from '../video/VideoPlayer';
import ProtectedButton from '../general/protectedButton';
import { CampaignPermissionsProvider, useCampaignPermissions } from '@/app/context/permissionContext';
import ProtectedShareModal from '../video/ProtectedShareModal';
import { Share2 } from 'lucide-react';
import { ProtectedUploadSection , UploadQueueItem } from './protectedUploadSection';
import { Scissors } from 'lucide-react';
import VideoEditor from '../video/VideoEditor';

// Helper function
function toTitleCase(str = '') {
  return str
    .replace(/^[-_]*(.)/, (_, c) => c.toUpperCase())
    .replace(/[-_]+(.)/g, (_, c) => ' ' + c.toUpperCase());
}

// ✅ NEW: Tooltip Component
function Tooltip({ children, content, position = 'top' }) {
  const [show, setShow] = useState(false);
  
  if (!content) return children;
  
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && (
        <div className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap
          ${position === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' : ''}
          ${position === 'bottom' ? 'top-full mt-2 left-1/2 -translate-x-1/2' : ''}
          ${position === 'left' ? 'right-full mr-2 top-1/2 -translate-y-1/2' : ''}
          ${position === 'right' ? 'left-full ml-2 top-1/2 -translate-y-1/2' : ''}
        `}>
          {content}
          <div className={`absolute w-2 h-2 bg-gray-900 transform rotate-45
            ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' : ''}
            ${position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' : ''}
            ${position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' : ''}
            ${position === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2' : ''}
          `} />
        </div>
      )}
    </div>
  );
}

// ✅ NEW: Workflow Stage Badge
function WorkflowStageBadge({ workflow }) {
  if (!workflow) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
        <AlertCircle className="w-3 h-3" />
        No Workflow
      </span>
    );
  }

  const statusColors = {
    'in_progress': 'bg-blue-50 text-blue-700 border-blue-200',
    'awaiting_review': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'approved': 'bg-green-50 text-green-700 border-green-200',
    'rejected': 'bg-red-50 text-red-700 border-red-200',
    'changes_requested': 'bg-orange-50 text-orange-700 border-orange-200',
    'completed': 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const statusIcons = {
    'in_progress': <Clock className="w-3 h-3" />,
    'awaiting_review': <Eye className="w-3 h-3" />,
    'approved': <CheckCircle className="w-3 h-3" />,
    'rejected': <XCircle className="w-3 h-3" />,
    'changes_requested': <RefreshCw className="w-3 h-3" />,
    'completed': <CheckCircle className="w-3 h-3" />,
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Tooltip content={`${workflow.currentStep.name} - ${workflow.currentStep.description}`}>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[workflow.status] || statusColors['in_progress']}`}>
          {statusIcons[workflow.status] || statusIcons['in_progress']}
          <span className="truncate max-w-[100px]">{workflow.currentStep.name}</span>
        </span>
      </Tooltip>
      
      {/* Progress indicator */}
      <Tooltip content={`Step ${workflow.progress.currentStep} of ${workflow.progress.totalSteps}`}>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div 
            className="bg-blue-600 h-1 rounded-full transition-all duration-300"
            style={{ width: `${workflow.progress.percentage}%` }}
          />
        </div>
      </Tooltip>
    </div>
  );
}

// ✅ NEW: Assigned Employee Component
function AssignedEmployee({ workflow }) {
  if (!workflow) return <span className="text-sm text-gray-400">-</span>;

  if (workflow.assignedTo) {
    return (
      <Tooltip content={`${workflow.assignedTo.name} (${workflow.assignedTo.email})`}>
        <div className="flex items-center gap-2">
          {workflow.assignedTo.avatarUrl ? (
            <img 
              src={workflow.assignedTo.avatarUrl} 
              alt={workflow.assignedTo.name}
              className="w-7 h-7 rounded-full border-2 border-blue-200"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
              <User className="w-4 h-4 text-blue-600" />
            </div>
          )}
          <span className="text-sm font-medium text-gray-900 truncate max-w-[80px]">
            {workflow.assignedTo.name.split(' ')[0]}
          </span>
        </div>
      </Tooltip>
    );
  }

  // Show role with available assignees count
  if (workflow.assignedToRole && workflow.availableAssignees?.length > 0) {
    return (
      <Tooltip content={`Available: ${workflow.availableAssignees.map(a => a.name).join(', ')}`}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
            <Users className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 truncate max-w-[80px]">{workflow.assignedToRole.name}</span>
            <span className="text-xs font-medium text-gray-700">{workflow.availableAssignees.length} available</span>
          </div>
        </div>
      </Tooltip>
    );
  }

  return (
    <Tooltip content={workflow.assignedToRole?.name || 'Unassigned'}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
          <Users className="w-4 h-4 text-gray-400" />
        </div>
        <span className="text-sm text-gray-500">Unassigned</span>
      </div>
    </Tooltip>
  );
}

// Loading Skeleton Component
function VideoTableSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <tr key={i} className="border-b border-gray-200">
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-20 h-12 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

// ✅ NEW: Mobile Card View
function VideoCard({ video, onPlay, onDownload, onDelete, onShare, onEdit, onVersionUpload }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all"
    >
      {/* Thumbnail and Title */}
      <div className="flex gap-3 mb-3">
        <Tooltip content="Click to play">
          <div 
            className="relative w-24 h-16 flex-shrink-0 cursor-pointer group"
            onClick={() => onPlay(video)}
          >
            {video.thumbnailUrl ? (
              <>
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover rounded-lg border border-gray-200 group-hover:scale-105 transition-transform"
                />
                {video.playbackUrl && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Play className="w-6 h-6 text-white drop-shadow-lg" />
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                <Video className="w-8 h-8 text-blue-500" />
              </div>
            )}
          </div>
        </Tooltip>
        
        <div className="flex-1 min-w-0">
          <Tooltip content={video.title}>
            <h3 className="font-semibold text-gray-900 truncate">{video.title.slice(0,25)}...</h3>
          </Tooltip>

          {/* Workflow Badge */}
          <div className="mt-2">
            <WorkflowStageBadge workflow={video.workflow} />
          </div>
        </div>
      </div>

      {/* Assigned Employee & Metadata */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
        <AssignedEmployee workflow={video.workflow} />
        
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <Tooltip content="Duration">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {video.durationFormatted || '-'}
            </div>
          </Tooltip>
          
          <Tooltip content={`${video.versionCount || 1} version(s)`}>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 rounded">
              <Layers className="w-3 h-3 text-purple-600" />
              <span className="font-semibold text-purple-700">{video.versionCount || 1}</span>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 flex-wrap">
        <ProtectedButton
          onClick={() => onEdit(video)}
          className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
          title="Edit Video"
          disabled={!video.playbackUrl}
          requiredPermissions={['Version Control']}
        >
          <Scissors className="w-4 h-4" />
        </ProtectedButton>

        <ProtectedButton
          onClick={() => onPlay(video)}
          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
          title="Play Video"
          disabled={!video.playbackUrl}
          requiredPermissions={['Preview Video']}
        >
          <Play className="w-4 h-4" />
        </ProtectedButton>

        <ProtectedButton
          onClick={() => onDownload(video.id, video.title)}
          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          title="Download"
          requiredPermissions={['Download Original']}
        >
          <Download className="w-4 h-4" />
        </ProtectedButton>

        <ProtectedButton
          onClick={() => onDelete(video.id, video.title)}
          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          title="Delete"
          requiredPermissions={['Delete Video']}
        >
          <Trash2 className="w-4 h-4" />
        </ProtectedButton>

        <ProtectedButton
          onClick={() => onShare(video)}
          className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
          title="Share Video"
          requiredPermissions={['Share Video']}
        >
          <Share2 className="w-4 h-4" />
        </ProtectedButton>

        <ProtectedButton
          onClick={() => onVersionUpload(video)}
          className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
          title="Upload New Version"
          requiredPermissions={['Upload Video','Version Control']}
        >
          <Upload className="w-4 h-4" />
        </ProtectedButton>
      </div>
    </motion.div>
  );
}

// Main Component
export default function CampaignVideo({ campaign, onUpdate, campaignId }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingVideos, setFetchingVideos] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [stats, setStats] = useState(null);
  const [workflowStats, setWorkflowStats] = useState(null); // ✅ NEW
  const [searchQuery, setSearchQuery] = useState('');
  const [workflowStatusFilter, setWorkflowStatusFilter] = useState(''); // ✅ CHANGED from statusFilter
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [videoToShare, setVideoToShare] = useState(null);
  const [versionUploadModal, setVersionUploadModal] = useState(null);
  const [versionNote, setVersionNote] = useState('');
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // ✅ NEW: 'table' or 'grid'
  const MAX_CONCURRENT_UPLOADS = 2;
  const MAX_FILES = 5;
  const [uploadQueue, setUploadQueue] = useState([]);
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [videoToEdit, setVideoToEdit] = useState(null);

  const openVideoEditor = (video) => {
    setVideoToEdit(video);
    setShowVideoEditor(true);
  };

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
    setFetchingVideos(true);
    try {
      const response = await fetch(
        `/api/videos?campaignId=${campaign.id}&limit=50`,
        { credentials: 'include' }
      );

      const data = await response.json();
      if (data.success) {
        setVideos(data.data.videos);
        setWorkflowStats(data.data.workflowStats); // ✅ NEW
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setFetchingVideos(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `/api/videos?campaignId=${campaign.id}&limit=1`,
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

    const newQueue = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      progress: 0,
      status: 'pending',
      error: null,
      videoId: null,
    }));

    setUploadQueue(prev => [...prev, ...newQueue]);
    processUploadQueue(newQueue);
  };

  const handleClearQueue = () => {
    setUploadQueue(prev => 
      prev.filter(item => item.status === 'uploading')
    );
  };

  const handleRemoveFromQueue = (id) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id));
  };

  const processUploadQueue = async (queue) => {
    const chunks = [];
    for (let i = 0; i < queue.length; i += MAX_CONCURRENT_UPLOADS) {
      chunks.push(queue.slice(i, i + MAX_CONCURRENT_UPLOADS));
    }

    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(item => uploadSingleFile(item))
      );
    }

    fetchVideos();
    fetchStats();
    if (onUpdate) onUpdate();
  };

  const uploadSingleFile = async (queueItem) => {
    const { id, file } = queueItem;

    try {
      updateQueueItem(id, { status: 'uploading' });

      const duration = await getVideoDuration(file);

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

        const progress = Math.round(((i + 1) / urls.length) * 100);
        updateQueueItem(id, { progress });
      }

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

      updateQueueItem(id, {
        status: 'completed',
        progress: 100,
        videoId: result.video.id,
      });

    } catch (error) {
      console.error(`[UPLOAD ERROR] ${file.name}:`, error);
      updateQueueItem(id, {
        status: 'failed',
        error: error.message,
      });
    }
  };

  const updateQueueItem = (id, updates) => {
    setUploadQueue(prev =>
      prev.map(item => item.id === id ? { ...item, ...updates } : item)
    );
  };

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
      `Are you sure you want to delete "${title}"?`,
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

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.filename.toLowerCase().includes(searchQuery.toLowerCase());
    
    // ✅ CHANGED: Filter by workflow status instead of video status
    const matchesWorkflowStatus = !workflowStatusFilter || 
                                   video.workflow?.status === workflowStatusFilter;
    
    return matchesSearch && matchesWorkflowStatus;
  });

  return (
    <CampaignPermissionsProvider campaignId={campaignId}>
      <div className="space-y-6">
        {/* ✅ NEW: Workflow Stats Cards */}
        {workflowStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <Tooltip content="Total videos in workflow">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200"
              >
                <p className="text-xs text-blue-600 font-medium">Total</p>
                <p className="text-2xl font-bold text-blue-900">{workflowStats.total}</p>
              </motion.div>
            </Tooltip>

            <Tooltip content="Assigned to you">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200"
              >
                <p className="text-xs text-purple-600 font-medium">My Tasks</p>
                <p className="text-2xl font-bold text-purple-900">{workflowStats.assignedToMe}</p>
              </motion.div>
            </Tooltip>

            <Tooltip content="Currently in progress">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3 border border-yellow-200"
              >
                <p className="text-xs text-yellow-600 font-medium">In Progress</p>
                <p className="text-2xl font-bold text-yellow-900">{workflowStats.inProgress}</p>
              </motion.div>
            </Tooltip>

            <Tooltip content="Awaiting review">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200"
              >
                <p className="text-xs text-orange-600 font-medium">Review</p>
                <p className="text-2xl font-bold text-orange-900">{workflowStats.awaitingReview}</p>
              </motion.div>
            </Tooltip>

            <Tooltip content="Approved videos">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200"
              >
                <p className="text-xs text-green-600 font-medium">Approved</p>
                <p className="text-2xl font-bold text-green-900">{workflowStats.approved}</p>
              </motion.div>
            </Tooltip>

            <Tooltip content="Completed videos">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-3 border border-teal-200"
              >
                <p className="text-xs text-teal-600 font-medium">Completed</p>
                <p className="text-2xl font-bold text-teal-900">{workflowStats.completed}</p>
              </motion.div>
            </Tooltip>

            <Tooltip content="Overdue tasks">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 border border-red-200"
              >
                <p className="text-xs text-red-600 font-medium">Overdue</p>
                <p className="text-2xl font-bold text-red-900">{workflowStats.overdue}</p>
              </motion.div>
            </Tooltip>
          </div>
        )}

        {uploadQueue.filter(item => item.status === 'uploading').length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Upload className="w-6 h-6 animate-bounce" />
                <div>
                  <p className="font-semibold">
                    Uploading {uploadQueue.filter(item => item.status === 'uploading').length} video(s)
                  </p>
                  <p className="text-sm opacity-90">
                    Please wait while your videos are being processed...
                  </p>
                </div>
              </div>
              <RefreshCw className="w-5 h-5 animate-spin opacity-75" />
            </div>
          </motion.div>
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

        {/* ✅ ENHANCED: Filters with Workflow Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row gap-3">
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
              value={workflowStatusFilter}
              onChange={(e) => setWorkflowStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Workflow Status</option>
              <option value="in_progress">In Progress</option>
              <option value="awaiting_review">Awaiting Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="changes_requested">Changes Requested</option>
              <option value="completed">Completed</option>
            </select>

            {/* ✅ NEW: View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Grid
              </button>
            </div>

            <button
              onClick={() => {
                fetchVideos();
                fetchStats();
              }}
              disabled={fetchingVideos}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${fetchingVideos ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* ✅ CONDITIONAL: Table or Grid View */}
        {viewMode === 'grid' ? (
          /* Grid View for Mobile/Tablet */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fetchingVideos ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                  <div className="flex gap-3 mb-3">
                    <div className="w-24 h-16 bg-gray-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-20 bg-gray-200 rounded" />
                </div>
              ))
            ) : filteredVideos.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No videos found</p>
              </div>
            ) : (
              filteredVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onPlay={playVideo}
                  onDownload={downloadVideo}
                  onDelete={deleteVideo}
                  onShare={openShareModal}
                  onEdit={openVideoEditor}
                  onVersionUpload={openVersionUploadModal}
                />
              ))
            )}
          </div>
        ) : (
          /* Table View for Desktop */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                      Video
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                      Workflow Stage
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                      Assigned To
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                      Versions
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {fetchingVideos ? (
                    <VideoTableSkeleton />
                  ) : filteredVideos.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">
                          {searchQuery || workflowStatusFilter 
                            ? 'No videos match your filters'
                            : 'No videos uploaded yet'
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
                        className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 transition-all duration-200 border-l-2 border-transparent hover:border-blue-500"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Tooltip content="Click to play">
                              <div 
                                className="relative w-20 h-12 flex-shrink-0 cursor-pointer group"
                                onClick={() => playVideo(video)}
                              >
                                {video.thumbnailUrl ? (
                                  <>
                                    <img
                                      src={video.thumbnailUrl}
                                      alt={video.title}
                                      className="w-full h-full object-cover rounded-lg border border-gray-200 group-hover:scale-105 transition-transform"
                                    />
                                    {video.playbackUrl && (
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                        <Play className="w-5 h-5 text-white drop-shadow-lg" />
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                                    <Video className="w-6 h-6 text-blue-500" />
                                  </div>
                                )}
                              </div>
                            </Tooltip>
                            <div className="min-w-0 max-w-[200px]">
                              <Tooltip content={video.title}>
                                <p className="font-medium text-sm text-gray-900 truncate">{video.title.slice(0,20)}...</p>
                              </Tooltip>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <WorkflowStageBadge workflow={video.workflow} />
                        </td>
                        <td className="px-4 py-3">
                          <AssignedEmployee workflow={video.workflow} />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {video.durationFormatted || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Tooltip content={`${video.versionCount || 1} version(s)`}>
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
                                <Layers className="w-3 h-3" />
                                <span className="text-xs font-semibold">{video.versionCount || 1}</span>
                              </div>
                            </Tooltip>
                            {video.currentVersion && (
                              <Tooltip content={`Active version: ${video.currentVersion}`}>
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-200">
                                  <Star className="w-3 h-3 fill-current" />
                                  <span className="text-xs font-semibold">v{video.currentVersion}</span>
                                </div>
                              </Tooltip>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            <Tooltip content="Edit Video">
                              <ProtectedButton
                                onClick={() => openVideoEditor(video)}
                                className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
                                disabled={!video.playbackUrl}
                                requiredPermissions={['Version Control']}
                              >
                                <Scissors className="w-4 h-4" />
                              </ProtectedButton>
                            </Tooltip>

                            <Tooltip content="Play Video">
                              <ProtectedButton
                                onClick={() => playVideo(video)}
                                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                                disabled={!video.playbackUrl}
                                requiredPermissions={['Preview Video']}
                              >
                                <Play className="w-4 h-4" />
                              </ProtectedButton>
                            </Tooltip>

                            <Tooltip content="Download">
                              <ProtectedButton
                                onClick={() => downloadVideo(video.id, video.title)}
                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                requiredPermissions={['Download Original']}
                              >
                                <Download className="w-4 h-4" />
                              </ProtectedButton>
                            </Tooltip>

                            <Tooltip content="Delete">
                              <ProtectedButton
                                onClick={() => deleteVideo(video.id, video.title)}
                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                requiredPermissions={['Delete Video']}
                              >
                                <Trash2 className="w-4 h-4" />
                              </ProtectedButton>
                            </Tooltip>

                            <Tooltip content="Share Video">
                              <ProtectedButton
                                onClick={() => openShareModal(video)}
                                className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                                requiredPermissions={['Share Video']}
                              >
                                <Share2 className="w-4 h-4" />
                              </ProtectedButton>
                            </Tooltip>

                            <Tooltip content="Upload New Version">
                              <ProtectedButton
                                onClick={() => openVersionUploadModal(video)}
                                className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                                requiredPermissions={['Upload Video','Version Control']}
                              >
                                <Upload className="w-4 h-4" />
                              </ProtectedButton>
                            </Tooltip>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Version Upload Modal */}
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

        {/* Video Editor */}
        <AnimatePresence>
          {showVideoEditor && videoToEdit && (
            <VideoEditor
              video={videoToEdit}
              onClose={() => {
                setShowVideoEditor(false);
                setVideoToEdit(null);
              }}
              onSaveComplete={(result) => {
                fetchVideos();
                fetchStats();
                if (onUpdate) onUpdate();
              }}
            />
          )}
        </AnimatePresence>

        {/* Share Modal */}
        <ProtectedShareModal 
          isOpen={shareModalOpen} 
          onClose={() => {
            setShareModalOpen(false);
            setVideoToShare(null);
          }}
          videoId={videoToShare?.id} 
        />
      </div>
    </CampaignPermissionsProvider>
  );
}
