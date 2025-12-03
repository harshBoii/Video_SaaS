'use client';
import { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid, List, Search, Filter, Trash2, Share2, Play, 
  Check, X, Loader2, Download, Eye, MessageSquare,
  Calendar, User, LayoutGrid, LayoutList, ChevronDown
} from 'lucide-react';

const CampaignPermissionsProvider = lazy(() =>
  import('@/app/context/permissionContext').then(m => ({ default: m.CampaignPermissionsProvider }))
);

const VideoPlayer = lazy(() => import('@/app/components/video/VideoPlayer'));
const ShareCollectionButton = lazy(() => 
  import('@/app/components/video/collection/ShareCollectionButton')
);

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [playingVideo, setPlayingVideo] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    campaignId: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    status: 'ready'
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [filters, pagination.page]);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns/list');
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data.campaigns);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    }
  };

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });

      const res = await fetch(`/api/videos?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setVideos(data.data.videos);
        setPagination(prev => ({ ...prev, ...data.data.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectVideo = (videoId) => {
    setSelectedVideos(prev =>
      prev.includes(videoId)
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const selectAll = () => {
    if (selectedVideos.length === videos.length) {
      setSelectedVideos([]);
    } else {
      setSelectedVideos(videos.map(v => v.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedVideos.length === 0) return;
    
    const confirmed = confirm(`Delete ${selectedVideos.length} videos?`);
    if (!confirmed) return;

    try {
      const res = await fetch('/api/videos/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoIds: selectedVideos })
      });

      if (res.ok) {
        setSelectedVideos([]);
        fetchVideos();
      }
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-black text-gray-900">Videos</h1>
            <div className="flex items-center gap-3">
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
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-white shadow-sm text-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutList className="w-5 h-5" />
                </button>
              </div>

              {/* Bulk Actions */}
              <AnimatePresence>
                {selectedVideos.length > 0 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="flex items-center gap-2 bg-indigo-100 px-4 py-2 rounded-xl"
                  >
                    <span className="text-sm font-semibold text-indigo-900">
                      {selectedVideos.length} selected
                    </span>
                    <button
                      onClick={() => setSelectedVideos([])}
                      className="p-1 hover:bg-indigo-200 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-indigo-700" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {selectedVideos.length > 0 && (
                <>
                  <Suspense fallback={<Loader2 className="w-5 h-5 animate-spin" />}>
                    <ShareCollectionButton
                      campaignId={filters.campaignId || videos[0]?.campaignId}
                      preSelectedVideos={selectedVideos}
                    />
                  </Suspense>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleBulkDelete}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search videos..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* Campaign Filter */}
            <select
              value={filters.campaignId}
              onChange={(e) => setFilters(prev => ({ ...prev, campaignId: e.target.value }))}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            >
              <option value="">All Campaigns</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name} ({campaign.videoCount})
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                setFilters(prev => ({ ...prev, sortBy, sortOrder }));
              }}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="duration-desc">Longest</option>
              <option value="duration-asc">Shortest</option>
            </select>

            {selectedVideos.length < videos.length && (
              <button
                onClick={selectAll}
                className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl transition-colors"
              >
                Select All
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="aspect-video bg-slate-200 rounded-xl mb-4" />
                <div className="h-6 bg-slate-200 rounded mb-2" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Play className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Videos Found</h3>
            <p className="text-slate-600">Try adjusting your filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          <GridView
            videos={videos}
            selectedVideos={selectedVideos}
            onToggleSelect={toggleSelectVideo}
            onPlay={setPlayingVideo}
            formatDuration={formatDuration}
          />
        ) : (
          <ListView
            videos={videos}
            selectedVideos={selectedVideos}
            onToggleSelect={toggleSelectVideo}
            onPlay={setPlayingVideo}
            formatDuration={formatDuration}
          />
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  pagination.page === i + 1
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      <AnimatePresence>
        {playingVideo && (
          <Suspense
            fallback={
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
            }
          >
            <CampaignPermissionsProvider campaignId={playingVideo.campaignId}>
              <VideoPlayer
                video={playingVideo}
                onClose={() => setPlayingVideo(null)}
              />
            </CampaignPermissionsProvider>
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}

// Grid View Component
function GridView({ videos, selectedVideos, onToggleSelect, onPlay, formatDuration }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {videos.map((video, index) => (
        <motion.div
          key={video.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className={`group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all border-2 ${
            selectedVideos.includes(video.id)
              ? 'border-indigo-500 ring-4 ring-indigo-100'
              : 'border-transparent'
          }`}
        >
          {/* Thumbnail */}
          <div className="relative aspect-video bg-slate-100">
            <img
              src={video.thumbnailUrl || '/placeholder.jpg'}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            
            {/* Checkbox */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(video.id);
              }}
              className={`absolute top-3 left-3 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                selectedVideos.includes(video.id)
                  ? 'bg-indigo-600 border-indigo-600'
                  : 'bg-white/90 border-white hover:border-indigo-400'
              }`}
            >
              {selectedVideos.includes(video.id) && (
                <Check className="w-4 h-4 text-white" />
              )}
            </button>

            {/* Play Button */}
            <button
              onClick={() => onPlay(video)}
              className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-all group"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl"
              >
                <Play className="w-8 h-8 text-indigo-600 ml-1" />
              </motion.div>
            </button>

            {/* Duration */}
            <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 backdrop-blur-sm rounded-lg text-xs text-white font-mono">
              {formatDuration(video.duration)}
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
              {video.title}
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              {video.campaign.name}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{video.viewCount || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{video.commentCount || 0}</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// List View Component
function ListView({ videos, selectedVideos, onToggleSelect, onPlay, formatDuration }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      {videos.map((video, index) => (
        <motion.div
          key={video.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.03 }}
          whileHover={{ x: 4 }}
          className={`group bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all border-2 ${
            selectedVideos.includes(video.id)
              ? 'border-indigo-500 ring-4 ring-indigo-100'
              : 'border-transparent'
          }`}
        >
          <div className="flex items-center gap-4">
            {/* Checkbox */}
            <button
              onClick={() => onToggleSelect(video.id)}
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                selectedVideos.includes(video.id)
                  ? 'bg-indigo-600 border-indigo-600'
                  : 'bg-white border-slate-300 hover:border-indigo-400'
              }`}
            >
              {selectedVideos.includes(video.id) && (
                <Check className="w-4 h-4 text-white" />
              )}
            </button>

            {/* Thumbnail */}
            <div className="relative w-32 aspect-video bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
              <img
                src={video.thumbnailUrl || '/placeholder.jpg'}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => onPlay(video)}
                className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-all"
              >
                <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-indigo-600 transition-colors">
                {video.title}
              </h3>
              <p className="text-sm text-slate-600 mb-2">
                {video.campaign.name} • {video.uploaderName}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{video.viewCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{video.commentCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="text-sm font-mono text-slate-600 flex-shrink-0">
              {formatDuration(video.duration)}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
