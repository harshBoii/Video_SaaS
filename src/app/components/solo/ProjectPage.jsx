'use client';
import { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, Search, Plus, Upload, Video, Users, Calendar,
  LayoutGrid, LayoutList, Filter, ChevronDown, Loader2,
  Play, Eye, Clock, ArrowUpDown, X, Check, Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { showSuccess, showError, showConfirm } from '@/app/lib/swal';

const ShareCollectionButton = lazy(() => 
  import('@/app/components/video/collection/ShareCollectionButton')
);
import CreateProjectModal from './CreateProjectModal';


export default function ProjectsPage() {
  const router = useRouter();
  
  // Data State
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({ totalCampaigns: 0, totalVideos: 0 });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  
  // Upload State
  const [uploadingFile, setUploadingFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingProjectId, setUploadingProjectId] = useState(null);
  
  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    status: 'active'
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  // Debounced search
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    fetchCampaigns();
  }, [filters, pagination.page]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });

      const res = await fetch(`/api/campaigns?${params}`, { credentials: 'include' });
      const data = await res.json();
      
      if (data.success) {
        setCampaigns(data.data.campaigns);
        setStats(data.data.stats);
        setPagination(prev => ({ ...prev, ...data.data.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      await showError('Error', 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event, campaignId) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      await showError('Invalid File', 'Please select a valid video file.');
      return;
    }

    setUploadingFile(file);
    setUploadProgress(0);
    setUploadingProjectId(campaignId);

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
            title: file.name.replace(/\\.[^/.]+$/, ''),
            description: 'Uploaded from projects page',
          },
        }),
      });

      if (!startRes.ok) {
        const errorData = await startRes.json();
        throw new Error(errorData.error || 'Failed to start upload');
      }

      const startData = await startRes.json();
      if (!startData.success || !startData.upload || !startData.urls) {
        throw new Error('Invalid response from server');
      }

      const { upload, urls } = startData;
      const partSize = upload.partSize;
      const uploadedParts = [];

      for (let i = 0; i < urls.length; i++) {
        const start = i * partSize;
        const end = Math.min(start + partSize, file.size);
        const chunk = file.slice(start, end);

        let retries = 3;
        let uploadRes = null;
        
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
          duration,
        }),
      });

      if (!completeRes.ok) {
        const errorData = await completeRes.json();
        throw new Error(errorData.error || 'Failed to complete upload');
      }

      const result = await completeRes.json();
      if (result.success) {
        await showSuccess('Upload Complete', 'Video uploaded successfully!');
        fetchCampaigns();
      }
    } catch (error) {
      console.error('[UPLOAD ERROR]', error);
      await showError('Upload Failed', error.message || 'An unexpected error occurred');
    } finally {
      setUploadingFile(null);
      setUploadProgress(0);
      setUploadingProjectId(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const sortOptions = [
    { value: 'updatedAt-desc', label: 'Recently Updated' },
    { value: 'updatedAt-asc', label: 'Oldest Updated' },
    { value: 'createdAt-desc', label: 'Newest Created' },
    { value: 'createdAt-asc', label: 'Oldest Created' },
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Folder className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
                <p className="text-sm text-slate-500">Manage your campaigns</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Stats Pills */}
              <div className="hidden md:flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium">
                  <Folder className="w-4 h-4" />
                  <span>{stats.totalCampaigns} Projects</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium">
                  <Video className="w-4 h-4" />
                  <span>{stats.totalVideos} Videos</span>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white shadow-sm text-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-white shadow-sm text-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>

              {/* Create Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </motion.button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex-1 min-w-[280px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg"
                  >
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Sort */}
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                setFilters(prev => ({ ...prev, sortBy, sortOrder }));
              }}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Upload Progress Banner */}
      <AnimatePresence>
        {uploadingFile && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50/80 backdrop-blur-sm border-b border-blue-200/60 px-6 py-3"
          >
            <div className="max-w-7xl mx-auto flex items-center gap-4">
              <Video className="w-5 h-5 text-blue-600 animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-900 truncate">{uploadingFile.name}</span>
                  <span className="text-sm font-bold text-blue-600 ml-2">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-blue-200/50 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <LoadingSkeleton viewMode={viewMode} />
        ) : campaigns.length === 0 ? (
          <EmptyState onCreateClick={() => setShowCreateModal(true)} />
        ) : viewMode === 'grid' ? (
          <GridView
            campaigns={campaigns}
            onNavigate={(id) => router.push(`/projects/${id}`)}
            onUpload={handleFileUpload}
            uploadingProjectId={uploadingProjectId}
            uploadProgress={uploadProgress}
            formatDate={formatDate}
          />
        ) : (
          <ListView
            campaigns={campaigns}
            onNavigate={(id) => router.push(`/projects/${id}`)}
            onUpload={handleFileUpload}
            uploadingProjectId={uploadingProjectId}
            uploadProgress={uploadProgress}
            formatDate={formatDate}
          />
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 rounded-xl font-semibold bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                    pagination.page === pageNum
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 rounded-xl font-semibold bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <Suspense fallback={<Loader2 className="animate-spin" />}>
            <CreateProjectModal 
              onClose={() => setShowCreateModal(false)}
              onSuccess={() => {
                setShowCreateModal(false);
                fetchCampaigns();
              }}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ SUB-COMPONENTS ============

function GridView({ campaigns, onNavigate, onUpload, uploadingProjectId, uploadProgress, formatDate }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {campaigns.map((campaign, index) => (
        <motion.div
          key={campaign.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ y: -4 }}
          className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-200/60 hover:border-blue-300 transition-all"
        >
          {/* Thumbnail Grid */}
          <div 
            onClick={() => onNavigate(campaign.id)}
            className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden cursor-pointer"
          >
            {campaign.recentVideos?.length > 0 ? (
              <div className="grid grid-cols-2 grid-rows-2 h-full">
                {campaign.recentVideos.slice(0, 4).map((video, i) => (
                  <div key={video.id} className="relative overflow-hidden">
                    {video.thumbnailUrl ? (
                      <img 
                        src={video.thumbnailUrl} 
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                        <Video className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                  </div>
                ))}
                {campaign.recentVideos.length < 4 && 
                  [...Array(4 - campaign.recentVideos.length)].map((_, i) => (
                    <div key={`empty-${i}`} className="bg-slate-100 flex items-center justify-center">
                      <Video className="w-6 h-6 text-slate-300" />
                    </div>
                  ))
                }
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Folder className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No videos yet</p>
                </div>
              </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1, opacity: 1 }}
                className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Eye className="w-6 h-6 text-blue-600" />
              </motion.div>
            </div>

            {/* Video Count Badge */}
            <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-xs text-white font-semibold">
              {campaign.videoCount} videos
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h3 
                  onClick={() => onNavigate(campaign.id)}
                  className="text-lg font-bold text-slate-900 line-clamp-1 cursor-pointer hover:text-blue-600 transition-colors"
                >
                  {campaign.name}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Created by {campaign.admin.name}
                </p>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg shadow-blue-500/25">
                {campaign.name.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{campaign.memberCount} members</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(campaign.updatedAt)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <Suspense fallback={<Loader2 className="w-4 h-4 animate-spin" />}>
                <ShareCollectionButton 
                  campaignId={campaign.id}
                  preSelectedVideos={[]}
                />
              </Suspense>

              {/* Upload Button */}
              <label className="cursor-pointer flex-1">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => onUpload(e, campaign.id)}
                  className="hidden"
                  disabled={uploadingProjectId === campaign.id}
                />
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    uploadingProjectId === campaign.id
                      ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  <Upload className={`w-4 h-4 ${uploadingProjectId === campaign.id ? 'animate-pulse' : ''}`} />
                  <span>{uploadingProjectId === campaign.id ? `${uploadProgress}%` : 'Upload'}</span>
                </motion.div>
              </label>

              <button
                onClick={() => onNavigate(campaign.id)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-all"
              >
                View →
              </button>
            </div>

            {/* Upload Progress */}
            {uploadingProjectId === campaign.id && (
              <div className="mt-3">
                <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1.5 rounded-full"
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function ListView({ campaigns, onNavigate, onUpload, uploadingProjectId, uploadProgress, formatDate }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      {campaigns.map((campaign, index) => (
        <motion.div
          key={campaign.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.03 }}
          className="group bg-white rounded-2xl border border-slate-200/60 hover:border-blue-300 hover:shadow-lg transition-all overflow-hidden"
        >
          <div className="flex items-center gap-4 p-4">
            {/* Thumbnail */}
            <div 
              onClick={() => onNavigate(campaign.id)}
              className="w-24 h-16 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer"
            >
              {campaign.recentVideos?.[0]?.thumbnailUrl ? (
                <img 
                  src={campaign.recentVideos[0].thumbnailUrl}
                  alt={campaign.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Folder className="w-6 h-6 text-slate-400" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 
                onClick={() => onNavigate(campaign.id)}
                className="text-base font-bold text-slate-900 line-clamp-1 cursor-pointer hover:text-blue-600 transition-colors"
              >
                {campaign.name}
              </h3>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                <span>{campaign.admin.name}</span>
                <span>•</span>
                <span>{campaign.videoCount} videos</span>
                <span>•</span>
                <span>{campaign.memberCount} members</span>
                <span>•</span>
                <span>{formatDate(campaign.updatedAt)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Suspense fallback={<Loader2 className="w-4 h-4 animate-spin" />}>
                <ShareCollectionButton 
                  campaignId={campaign.id}
                  preSelectedVideos={[]}
                />
              </Suspense>

              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => onUpload(e, campaign.id)}
                  className="hidden"
                  disabled={uploadingProjectId === campaign.id}
                />
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2.5 rounded-xl transition-all ${
                    uploadingProjectId === campaign.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                  title="Upload video"
                >
                  <Upload className={`w-4 h-4 ${uploadingProjectId === campaign.id ? 'animate-pulse' : ''}`} />
                </motion.div>
              </label>

              <button
                onClick={() => onNavigate(campaign.id)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-all"
              >
                View →
              </button>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadingProjectId === campaign.id && (
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-600">Uploading...</span>
                <span className="text-xs font-bold text-blue-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1.5 rounded-full"
                />
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

function LoadingSkeleton({ viewMode }) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-200/60">
            <div className="aspect-video bg-slate-200 animate-pulse" />
            <div className="p-5">
              <div className="h-6 bg-slate-200 rounded-lg w-3/4 mb-3 animate-pulse" />
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-4 animate-pulse" />
              <div className="flex gap-2">
                <div className="h-10 bg-slate-200 rounded-xl flex-1 animate-pulse" />
                <div className="h-10 bg-slate-200 rounded-xl flex-1 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200/60 p-4 flex items-center gap-4">
          <div className="w-24 h-16 bg-slate-200 rounded-xl animate-pulse flex-shrink-0" />
          <div className="flex-1">
            <div className="h-5 bg-slate-200 rounded-lg w-1/3 mb-2 animate-pulse" />
            <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse" />
            <div className="w-20 h-10 bg-slate-200 rounded-xl animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onCreateClick }) {
  return (
    <div className="text-center py-24">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6"
      >
        <Folder className="w-12 h-12 text-blue-500" />
      </motion.div>
      <h3 className="text-2xl font-bold text-slate-900 mb-3">No Projects Yet</h3>
      <p className="text-slate-600 mb-8 max-w-md mx-auto">
        Create your first project to start organizing and sharing your video content.
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all"
      >
        <Plus className="w-5 h-5" />
        <span>Create Your First Project</span>
      </motion.button>
    </div>
  );
}
