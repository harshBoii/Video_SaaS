'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Video, Eye, TrendingUp, MessageSquare, 
  Play, Share2, Folder, Plus, Search,
  Camera, Activity, Clock, FileVideo,
  AlertCircle, CheckCircle,X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { showSuccess, showError, showConfirm } from '@/app/lib/swal';
import VideoPlayer from '@/app/components/video/VideoPlayer';
import CreateProjectModal from './CreateProjectModal';
import ShareVideoModal from './ShareVideoModal';
import SearchModal from './SearchModal';
import { CampaignPermissionsProvider } from '@/app/context/permissionContext';
import ShareCollectionButton from '../video/collection/ShareCollectionButton';


export default function IndividualDashboard() {
  const router = useRouter();
  
  // Data State
  const [stats, setStats] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Upload State
  const [uploadingFile, setUploadingFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingProjectId, setUploadingProjectId] = useState(null);

  const [uploadQueue, setUploadQueue] = useState([]);
  const MAX_FILES = 5;
  const MAX_CONCURRENT_UPLOADS = 2;

  
  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  
  const [versionUploadModal, setVersionUploadModal] = useState(null);
  const [versionNote, setVersionNote] = useState('');
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionUploading, setVersionUploading] = useState(false);
  const [selectedVersionFile, setSelectedVersionFile] = useState(null); // ← ADD THIS

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, videosRes, reviewsRes, projectsRes] = await Promise.all([
        fetch('/api/individual/stats', { credentials: 'include' }),
        fetch('/api/individual/videos?limit=4', { credentials: 'include' }),
        fetch('/api/individual/notifications', { credentials: 'include' }),
        fetch('/api/individual/projects?limit=3', { credentials: 'include' }),
      ]);

      const [statsData, videosData, reviewsData, projectsData] = await Promise.all([
        statsRes.json(),
        videosRes.json(),
        reviewsRes.json(),
        projectsRes.json(),
      ]);

      if (statsData.success) setStats(statsData.stats);
      if (videosData.success) setRecentVideos(videosData.videos);
      if (reviewsData.success) setRecentReviews(reviewsData.notifications.slice(0, 5));
      if (projectsData.success) setProjects(projectsData.projects);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      await showError('Failed to Load', 'Could not load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };
  const closeVersionModal = () => {
    setShowVersionModal(false);
    setVersionNote('');
    setVersionUploadModal(null);
    setSelectedVersionFile(null); // ← Important
  };
  // const handleFileUpload = async (event, campaignId) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;

  //   if (!file.type.startsWith('video/')) {
  //     await showError('Invalid File', 'Please select a valid video file.');
  //     return;
  //   }

  //   setUploadingFile(file);
  //   setUploadProgress(0);
  //   setUploadingProjectId(campaignId);

  //   try {
  //     console.log('[UPLOAD] Starting upload for:', file.name, 'to campaign:', campaignId);
      
  //     const getVideoDuration = (file) => {
  //       return new Promise((resolve) => {
  //         const video = document.createElement('video');
  //         video.preload = 'metadata';
  //         video.onloadedmetadata = () => {
  //           window.URL.revokeObjectURL(video.src);
  //           resolve(video.duration);
  //         };
  //         video.onerror = () => resolve(null);
  //         video.src = URL.createObjectURL(file);
  //       });
  //     };

  //     const duration = await getVideoDuration(file);

  //     const startRes = await fetch('/api/upload/start', {
  //       method: 'POST',
  //       credentials: 'include',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         fileName: file.name,
  //         fileType: file.type,
  //         fileSize: file.size,
  //         campaignId,
  //         metadata: {
  //           title: file.name.replace(/\.[^/.]+$/, ''),
  //           description: 'Uploaded from dashboard',
  //         },
  //       }),
  //     });

  //     if (!startRes.ok) {
  //       const errorData = await startRes.json();
  //       throw new Error(errorData.error || 'Failed to start upload');
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

  //       console.log(`[UPLOAD] Uploading part ${i + 1}/${urls.length}`);

  //       let retries = 3;
  //       let uploadRes = null;
        
  //       while (retries > 0) {
  //         try {
  //           uploadRes = await fetch(urls[i].url, {
  //             method: 'PUT',
  //             body: chunk,
  //             headers: { 'Content-Type': file.type },
  //           });

  //           if (uploadRes.ok) break;
  //           retries--;
  //           if (retries === 0) throw new Error(`Failed to upload part ${i + 1}`);
  //           await new Promise(resolve => setTimeout(resolve, 1000));
  //         } catch (error) {
  //           retries--;
  //           if (retries === 0) throw error;
  //           await new Promise(resolve => setTimeout(resolve, 1000));
  //         }
  //       }

  //       const etag = uploadRes.headers.get('ETag');
  //       if (!etag) throw new Error(`Part ${i + 1} missing ETag`);

  //       uploadedParts.push({
  //         PartNumber: urls[i].partNumber,
  //         ETag: etag.replace(/"/g, ''),
  //       });

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
  //         duration,
  //       }),
  //     });

  //     if (!completeRes.ok) {
  //       const errorData = await completeRes.json();
  //       throw new Error(errorData.error || 'Failed to complete upload');
  //     }

  //     const result = await completeRes.json();
  //     if (result.success) {
  //       console.log('[UPLOAD] Upload completed successfully');
  //       await showSuccess('Upload Complete', 'Video uploaded successfully and queued for processing!');
  //       loadDashboardData();
  //     }
  //   } catch (error) {
  //     console.error('[UPLOAD ERROR]', error);
  //     await showError('Upload Failed', error.message || 'An unexpected error occurred during upload.');
  //   } finally {
  //     setUploadingFile(null);
  //     setUploadProgress(0);
  //     setUploadingProjectId(null);
  //   }
  // };
const handleFileUpload = async (event, campaignId) => {
  const files = Array.from(event.target.files);
  if (!files.length) return;

  // Validate max files
  const currentQueueForProject = uploadQueue.filter(
    item => item.campaignId === campaignId && item.status !== 'completed'
  );
  const availableSlots = MAX_FILES - currentQueueForProject.length;

  if (files.length > availableSlots) {
    await showError(
      'Too Many Files',
      `You can only upload ${MAX_FILES} videos at once per project. You have ${availableSlots} slot(s) remaining.`
    );
    return;
  }

  // Validate file types
  const invalidFiles = files.filter(file => !file.type.startsWith('video/'));
  if (invalidFiles.length > 0) {
    await showError('Invalid Files', 'Please select only video files.');
    return;
  }

  // Initialize queue
  const newQueue = files.map((file, index) => ({
    id: `${Date.now()}-${index}`,
    file,
    campaignId,
    progress: 0,
    status: 'pending',
    error: null,
    videoId: null,
  }));

  setUploadQueue(prev => [...prev, ...newQueue]);
  processUploadQueue(newQueue, campaignId);
};

const processUploadQueue = async (queue, campaignId) => {
  // Process uploads with concurrency limit
  const chunks = [];
  for (let i = 0; i < queue.length; i += MAX_CONCURRENT_UPLOADS) {
    chunks.push(queue.slice(i, i + MAX_CONCURRENT_UPLOADS));
  }

  for (const chunk of chunks) {
    await Promise.allSettled(
      chunk.map(item => uploadSingleFile(item, campaignId))
    );
  }

  loadDashboardData(); // Refresh after all uploads
};

const uploadSingleFile = async (queueItem, campaignId) => {
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
        campaignId,
        metadata: {
          title: file.name.replace(/\.[^/.]+$/, ''),
          description: 'Uploaded from dashboard',
        },
      }),
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
      }),
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

    console.log(`[UPLOAD] ✅ Completed: ${file.name}`);
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

  const handleVersionFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      showError('Invalid File', 'Please select a valid video file.');
      return;
    }

    setSelectedVersionFile(file);
  };

const handleVersionUpload = async () => {
  if (!selectedVersionFile) {
    showError('Error', 'Please select a video file');
    return;
  }

  if (!versionUploadModal) {
    showError('Error', 'No video selected');
    return;
  }

  const videoId = versionUploadModal.id;

  if (!versionNote.trim()) {
    showError('Error', 'Please provide a version note');
    return;
  }

  setUploadingFile(selectedVersionFile);
  setVersionUploading(true);
  setUploadProgress(0);

  try {
    console.log('[VERSION UPLOAD] Starting upload for:', selectedVersionFile.name); // ← FIXED
    
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

    const duration = await getVideoDuration(selectedVersionFile); 

    const startRes = await fetch(`/api/videos/${videoId}/versions`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        versionNote: versionNote,
        fileSize: selectedVersionFile.size, 
        fileName: selectedVersionFile.name, 
        fileType: selectedVersionFile.type, 
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
      const end = Math.min(start + partSize, selectedVersionFile.size); // ← FIXED
      const chunk = selectedVersionFile.slice(start, end); // ← FIXED

      console.log(`[VERSION UPLOAD] Uploading part ${i + 1}/${urls.length}`);

      let retries = 3;
      let uploadRes;
      
      while (retries > 0) {
        try {
          uploadRes = await fetch(urls[i].url, {
            method: 'PUT',
            body: chunk,
            headers: { 'Content-Type': selectedVersionFile.type }, // ← FIXED
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
      closeVersionModal();
      loadDashboardData();
    }
  } catch (error) {
    console.error('[VERSION UPLOAD ERROR]', error);
    await showError('Upload Failed', error.message);
  } finally {
    setVersionUploading(false);
    setUploadingFile(null);
    setUploadProgress(0);
  }
};
  

  const playVideo = (video) => {
    console.log('[PLAY VIDEO] Clicked:', video.id, video.title);
    console.log('[PLAY VIDEO] Has streamId:', !!video.streamId);
    console.log('[PLAY VIDEO] Campaign ID:', video.campaign?.id);
    
    if (!video.streamId) {
      showError('Video Not Ready', 'This video is still processing. Please try again later.');
      return;
    }
    setPlayingVideo(video);
  };

  const playVideoAtTimestamp = (review) => {
    const video = review.video;
    if (!video?.streamId) {
      showError('Video Not Ready', 'This video is still processing. Please try again later.');
      return;
    }
    setPlayingVideo({
      ...video,
      seekTo: review.timestamp,
    });
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const openVersionUploadModal = (video) => {
    setVersionUploadModal(video);
    setShowVersionModal(true);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Video Studio</h1>
              <p className="text-xs text-slate-500">Manage your content</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSearch(true)}
              className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Upload Progress Banner */}
      <AnimatePresence>
        {uploadingFile && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50/80 backdrop-blur-sm border-b border-blue-200/60 px-6 py-2.5"
          >
            <div className="flex items-center gap-3">
              <FileVideo className="w-4 h-4 text-blue-600 animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-900 truncate">{uploadingFile.name}</span>
                  <span className="text-xs font-bold text-blue-600 ml-2">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-blue-200/50 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1.5 rounded-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-5">
        <div className="h-full grid grid-cols-12 gap-5">
          {/* Left Column */}
          <div className="col-span-8 flex flex-col gap-5 overflow-hidden">
            {/* Stats Cards */}
            <div className="grid grid-cols-5 gap-4">
              <StatCard icon={Video} value={stats?.totalVideos ?? 0} label="Total Videos" color="blue" />
              <StatCard icon={Folder} value={stats?.totalProjects ?? 0} label="Total Projects" color="indigo" />
              <StatCard icon={AlertCircle} value={stats?.pendingReviews ?? 0} label="Pending Reviews" color="red" />
              <StatCard icon={CheckCircle} value={stats?.resolvedReviews ?? 0} label="Resolved Reviews" color="green" />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                className="bg-gradient-to-br from-slate-50 via-zinc-400 to-slate-400 rounded-2xl border border-slate-200/80 p-4 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold tracking-wide text-black uppercase">
                    Quiet Progress
                  </span>
                  <span className="text-[11px] text-emerald-800">
                    You're on track
                  </span>
                </div>
                <div className="mt-1">
                  <p className="text-sm font-medium text-white">
                    Consistency beats hype.
                  </p>
                  <p className="text-[11px] text-white mt-1">
                    Ship small, refine often, let the work speak.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Videos Section */}
            <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200/60 overflow-hidden flex flex-col shadow-sm">
              <div className="px-5 py-4 border-b border-slate-200/60 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Recent Videos</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Your latest uploads</p>
                </div>
                <button 
                  onClick={() => router.push('/solo/videos')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  View All →
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-4">
                  {recentVideos.length > 0 ? (
                    recentVideos.map((video) => (
                      <VideoCard 
                        key={video.id} 
                        video={video}
                        formatDuration={formatDuration}
                        formatNumber={formatNumber}
                        onPlay={() => playVideo(video)}
                        openVersionUploadModal={openVersionUploadModal}
                      />
                    ))
                  ) : (
                    <div className="col-span-2 py-12 text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Video className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-600 mb-1">No videos yet</p>
                      <p className="text-xs text-slate-500">Upload your first video to a project</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-4 flex flex-col gap-5 overflow-hidden">
            {/* Projects */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200/60 overflow-hidden flex flex-col shadow-sm" style={{ height: '48%' }}>
              <div className="px-5 py-4 border-b border-slate-200/60 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Projects</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Your campaigns</p>
                </div>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Create Project"
                >
                  <Plus className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {projects.length > 0 ? (
                  projects.map((project) => (
                  <ProjectCard 
                    key={project.id}
                    project={project}
                    onClick={() => router.push(`/projects/${project.id}`)}
                    onUpload={(e) => handleFileUpload(e, project.id)}
                    uploadQueue={uploadQueue}
                  />
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Folder className="w-7 h-7 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 mb-1">No projects</p>
                    <p className="text-xs text-slate-500 mb-3">Create your first project</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="text-xs px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      Create Project
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Reviews */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200/60 overflow-hidden flex flex-col shadow-sm" style={{ height: '52%' }}>
              <div className="px-5 py-4 border-b border-slate-200/60">
                <h2 className="text-base font-bold text-slate-900">Recent Reviews</h2>
                <p className="text-xs text-slate-500 mt-0.5">Open comments on your videos</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {recentReviews.length > 0 ? (
                  recentReviews.map((review) => (
                    <ReviewItem 
                      key={review.id} 
                      review={review}
                      onClick={() => playVideoAtTimestamp(review)}
                    />
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="w-7 h-7 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">No pending reviews</p>
                    <p className="text-xs text-slate-500 mt-1">All comments are resolved</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateProjectModal 
            onClose={() => setShowCreateModal(false)}
            onSuccess={loadDashboardData}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShareModal && (
          <ShareVideoModal 
            videos={recentVideos}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSearch && (
          <SearchModal onClose={() => setShowSearch(false)} />
        )}
      </AnimatePresence>

      {/* Video Player Modal */}
      {playingVideo && playingVideo.campaign?.id && (
        <CampaignPermissionsProvider campaignId={playingVideo.campaign.id}>
          <VideoPlayer 
            video={playingVideo}
            onClose={() => setPlayingVideo(null)}
          />
        </CampaignPermissionsProvider>
      )}
      <AnimatePresence>
  {showVersionModal && versionUploadModal && (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-40"
        onClick={closeVersionModal}
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
              onClick={closeVersionModal}
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
              disabled={versionUploading}
            />
          </div>

          {/* File Selection - FIXED */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Video File *
            </label>
            <label className="block">
              <input
                type="file"
                accept="video/*"
                onChange={handleVersionFileSelect}
                disabled={versionUploading}
                className="hidden"
              />
              <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                versionUploading
                  ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                  : selectedVersionFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
              }`}>
                <FileVideo className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium text-gray-900">
                  {selectedVersionFile ? selectedVersionFile.name : 'Click to select video file'}
                </p>
                {selectedVersionFile && (
                  <p className="text-xs text-gray-500 mt-1">
                    {(selectedVersionFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
            </label>
          </div>

          {/* Upload Progress */}
          {versionUploading && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1 text-center">{uploadProgress}%</p>
            </div>
          )}

          {/* Upload Button - NEW */}
          <button
            onClick={handleVersionUpload} 
            disabled={!versionNote.trim() || !selectedVersionFile || versionUploading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {versionUploading ? 'Uploading...' : 'Upload Version'}
          </button>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>

    </div>
  );
}

/* ============================
   SUB-COMPONENTS
============================ */

function LoadingSkeleton() {
  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 overflow-hidden flex flex-col">
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl animate-pulse" />
            <div>
              <div className="h-5 w-32 bg-slate-200 rounded-lg animate-pulse mb-1.5" />
              <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-5">
        <div className="h-full grid grid-cols-12 gap-5">
          <div className="col-span-8 flex flex-col gap-5 overflow-hidden">
            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5">
                  <div className="w-11 h-11 bg-slate-200 rounded-xl mb-3 animate-pulse" />
                  <div className="h-8 w-16 bg-slate-200 rounded-lg mb-2 animate-pulse" />
                  <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
                </div>
              ))}
            </div>

            <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200/60 overflow-hidden flex flex-col shadow-sm">
              <div className="px-5 py-4 border-b border-slate-200/60">
                <div className="h-5 w-32 bg-slate-200 rounded-lg animate-pulse mb-1.5" />
                <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
              </div>

              <div className="flex-1 p-4">
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
                      <div className="aspect-video bg-slate-200 animate-pulse" />
                      <div className="p-3">
                        <div className="h-4 w-3/4 bg-slate-200 rounded-lg animate-pulse mb-2" />
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-12 bg-slate-200 rounded animate-pulse" />
                          <div className="h-3 w-12 bg-slate-200 rounded animate-pulse" />
                          <div className="h-3 w-16 bg-slate-200 rounded animate-pulse ml-auto" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-4 flex flex-col gap-5 overflow-hidden">
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200/60 overflow-hidden flex flex-col shadow-sm" style={{ height: '48%' }}>
              <div className="px-5 py-4 border-b border-slate-200/60">
                <div className="h-5 w-24 bg-slate-200 rounded-lg animate-pulse mb-1.5" />
                <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="flex-1 p-4 space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200/60">
                    <div className="w-10 h-10 bg-slate-200 rounded-lg flex-shrink-0 animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-slate-200 rounded-lg animate-pulse mb-1.5" />
                      <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200/60 overflow-hidden flex flex-col shadow-sm" style={{ height: '52%' }}>
              <div className="px-5 py-4 border-b border-slate-200/60">
                <div className="h-5 w-32 bg-slate-200 rounded-lg animate-pulse mb-1.5" />
                <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="flex-1 p-4 space-y-2.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-3 p-3">
                    <div className="w-8 h-8 bg-slate-200 rounded-lg flex-shrink-0 animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 w-full bg-slate-200 rounded-lg animate-pulse mb-1.5" />
                      <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, color }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/20',
    indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/20',
    violet: 'from-violet-500 to-violet-600 shadow-violet-500/20',
    red: 'from-red-500 to-red-600 shadow-red-500/20',
    green: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all"
    >
      <div className={`w-11 h-11 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center shadow-lg mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-xs font-medium text-slate-600">{label}</div>
    </motion.div>
  );
}

function VideoCard({ video, formatDuration, formatNumber, onPlay , openVersionUploadModal }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="group bg-white rounded-xl overflow-hidden border border-slate-200/60 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer"
    >
      <div 
        onClick={onPlay}
        className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden"
      >
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="w-8 h-8 text-slate-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 text-blue-600 ml-0.5" />
          </div>
        </div>
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/75 backdrop-blur-sm rounded-lg text-xs text-white font-mono">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-slate-900 line-clamp-1 mb-2">{video.title}</h3>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {formatNumber(video.views || 0)}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            {video.comments || 0}
          </span>
          <span className="flex items-center gap-1 ml-auto text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            {new Date(video.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <span>
            <button
              onClick={(e) => {
                e.stopPropagation(); 
                openVersionUploadModal(video);
              }}
              className="p-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
              title="Upload New Version"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function ProjectCard({ project, onClick, onUpload, uploadQueue }) {
  // Filter queue items for this project
  const projectUploads = uploadQueue.filter(
    item => item.campaignId === project.id && item.status !== 'completed'
  );
  const isUploading = projectUploads.some(item => item.status === 'uploading');
  const activeUploads = projectUploads.filter(item => item.status === 'uploading');

  return (
    <motion.div className="bg-white rounded-xl border border-slate-200/60 hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/10 transition-all overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        {/* Project Info */}
        <div onClick={onClick} className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg shadow-blue-500/25">
            {(project.name && project.name.charAt(0).toUpperCase()) || 'P'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
              {project.name}
            </h4>
            <p className="text-xs text-slate-500">{project.videoCount || 0} videos</p>
          </div>
        </div>

        <ShareCollectionButton campaignId={project.id} preSelectedVideos={[]} />

        {/* Multi-file Upload Button */}
        <label className="cursor-pointer">
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={onUpload}
            className="hidden"
            disabled={isUploading}
          />
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-lg transition-all ${
              isUploading
                ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
            title="Upload videos (up to 5)"
          >
            <Upload className={`w-4 h-4 ${isUploading ? 'animate-pulse' : ''}`} />
          </motion.div>
        </label>
      </div>

      {/* Upload Progress - Show all active uploads for this project */}
      {activeUploads.length > 0 && (
        <div className="px-3 pb-3 space-y-2">
          {activeUploads.map(upload => (
            <div key={upload.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-600 truncate max-w-[200px]">
                  {upload.file.name}
                </span>
                <span className="text-xs font-bold text-blue-600">{upload.progress}%</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${upload.progress}%` }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1.5 rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}



function ReviewItem({ review, onClick }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-700 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'LOW': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'HIGH': return AlertCircle;
      case 'MEDIUM': return Clock;
      default: return MessageSquare;
    }
  };

  const formatTimestamp = (seconds) => {
    if (seconds == null) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffMs = now.getTime() - commentDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return commentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const Icon = getPriorityIcon(review.priority);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer group border border-transparent hover:border-blue-200"
    >
      <div className={`w-8 h-8 ${getPriorityColor(review.priority)} rounded-lg flex items-center justify-center flex-shrink-0 border`}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900 font-medium line-clamp-2 leading-relaxed mb-1">
          {review.content}
        </p>

        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
          <span className="font-medium text-slate-700">
            {review.commenter?.name || 'Anonymous'}
          </span>
          <span>•</span>
          <span className="truncate max-w-[140px]" title={review.video?.title}>
            {review.video?.title}
          </span>
          {review.timestamp != null && (
            <>
              <span>•</span>
              <span className="font-mono text-blue-600 group-hover:text-blue-700">
                {formatTimestamp(review.timestamp)}
              </span>
            </>
          )}
        </div>

        <p className="text-xs text-slate-400 mt-1">
          {formatTimeAgo(review.createdAt)}
        </p>
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Play className="w-4 h-4 text-blue-600" />
      </div>
    </motion.div>
  );
}
