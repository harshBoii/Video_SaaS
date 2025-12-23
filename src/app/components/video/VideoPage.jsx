'use client';
import { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid, List, Search, Filter, Trash2, Share2, Play, 
  Check, X, Loader2, Download, Eye, MessageSquare,
  Calendar, User, LayoutGrid, LayoutList, ChevronDown, Upload, Layers,
  Video, Clock, Star, FolderOpen, SlidersHorizontal, MoreHorizontal,
  Sparkles, TrendingUp, Film
} from 'lucide-react';
import SingleVideoVersionUploadModal from './VersionUploadModal';

// Quick action categories for Canva-style layout
const QUICK_ACTIONS = [
  { id: 'all', label: 'All Videos', icon: Film, color: 'from-violet-500 to-purple-600' },
  { id: 'recent', label: 'Recent', icon: Clock, color: 'from-blue-500 to-cyan-600' },
  { id: 'popular', label: 'Popular', icon: TrendingUp, color: 'from-rose-500 to-pink-600' },
  { id: 'starred', label: 'Starred', icon: Star, color: 'from-amber-500 to-orange-600' },
];
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
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [selectedVideoForVersion, setSelectedVideoForVersion] = useState(null);

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

  const handleVersionUpload = (video) => {
    setSelectedVideoForVersion(video);
    setShowVersionModal(true);
  };

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

  // Stats for display
  const videoStats = useMemo(() => ({
    total: pagination.total || videos.length,
    campaigns: campaigns.length
  }), [pagination.total, videos.length, campaigns.length]);

  return (
    <div className="min-h-screen">
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 via-primary/10 to-violet-500/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        {/* Floating Shapes */}
        <div className="absolute top-10 right-20 w-64 h-64 bg-gradient-to-br from-primary/30 to-rose-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-gradient-to-br from-violet-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative max-w-6xl mx-auto px-6 pt-8 pb-12">
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              <span className="bg-gradient-to-r from-rose-500 via-primary to-violet-500 bg-clip-text text-transparent">
                Your Video
              </span>
              <span className="text-foreground"> Library</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Browse, organize, and share your video content
            </p>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-2 mb-8 flex-wrap"
          >
            <button
              onClick={() => setFilters(prev => ({ ...prev, sortBy: 'createdAt', sortOrder: 'desc' }))}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                filters.sortBy === 'createdAt' && filters.sortOrder === 'desc'
                  ? 'bg-foreground text-background shadow-lg'
                  : 'glass-card hover:bg-[var(--glass-hover)] text-foreground'
              }`}
            >
              <Film className="w-4 h-4 inline-block mr-2" />
              All Videos
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, sortBy: 'viewCount', sortOrder: 'desc' }))}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                filters.sortBy === 'viewCount'
                  ? 'bg-foreground text-background shadow-lg'
                  : 'glass-card hover:bg-[var(--glass-hover)] text-foreground'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline-block mr-2" />
              Popular
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, sortBy: 'duration', sortOrder: 'desc' }))}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                filters.sortBy === 'duration'
                  ? 'bg-foreground text-background shadow-lg'
                  : 'glass-card hover:bg-[var(--glass-hover)] text-foreground'
              }`}
            >
              <Clock className="w-4 h-4 inline-block mr-2" />
              By Duration
            </button>
          </motion.div>

          {/* Search Bar - Canva Style */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto mb-10"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-primary/20 to-violet-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative glass-card rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search your videos..."
                  className="w-full pl-14 pr-14 py-5 bg-transparent text-lg text-foreground placeholder:text-muted-foreground outline-none rounded-2xl"
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-[var(--glass-hover)] rounded-xl transition-colors">
                  <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Quick Action Icons Row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-4 md:gap-8 flex-wrap"
          >
            {QUICK_ACTIONS.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (item.id === 'all') setFilters(prev => ({ ...prev, sortBy: 'createdAt', sortOrder: 'desc' }));
                  else if (item.id === 'recent') setFilters(prev => ({ ...prev, sortBy: 'createdAt', sortOrder: 'desc' }));
                  else if (item.id === 'popular') setFilters(prev => ({ ...prev, sortBy: 'viewCount', sortOrder: 'desc' }));
                }}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200`}>
                  <item.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <span className="text-xs md:text-sm font-medium text-foreground">{item.label}</span>
              </motion.button>
            ))}
            
            {/* Upload New Version */}
            <motion.button
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowVersionModal(true)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                <Upload className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>
              <span className="text-xs md:text-sm font-medium text-foreground">Upload</span>
            </motion.button>
            
            {/* More Options */}
            <motion.button
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[var(--glass-hover)] border-2 border-dashed border-[var(--glass-border)] flex items-center justify-center group-hover:border-primary/50 transition-all duration-200">
                <MoreHorizontal className="w-7 h-7 md:w-8 md:h-8 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-xs md:text-sm font-medium text-foreground">More</span>
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Section Header with Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-6"
        >
          <div>
            <h2 className="text-2xl font-bold text-foreground">Your Videos</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {videoStats.total} videos across {videoStats.campaigns} campaigns
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {/* Bulk Actions */}
            <AnimatePresence>
              {selectedVideos.length > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl border border-primary/20"
                >
                  <span className="text-sm font-semibold text-primary">
                    {selectedVideos.length} selected
                  </span>
                  <button
                    onClick={() => setSelectedVideos([])}
                    className="p-1 hover:bg-primary/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-primary" />
                  </button>
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
                    className="p-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Campaign Filter */}
            <select
              value={filters.campaignId}
              onChange={(e) => setFilters(prev => ({ ...prev, campaignId: e.target.value }))}
              className="px-4 py-2.5 bg-[var(--glass-hover)] border border-[var(--glass-border)] rounded-xl text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all text-foreground"
            >
              <option value="">All Campaigns</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>

            {/* View Toggle */}
            <div className="flex items-center bg-[var(--glass-hover)] rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-background shadow-sm text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-background shadow-sm text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutList className="w-5 h-5" />
              </button>
            </div>

            {selectedVideos.length < videos.length && videos.length > 0 && (
              <button
                onClick={selectAll}
                className="px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-xl transition-colors border border-primary/20"
              >
                Select All
              </button>
            )}
          </div>
        </motion.div>

        {/* Video Grid/List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card p-4 animate-pulse">
                <div className="aspect-video bg-[var(--glass-hover)] rounded-xl mb-4" />
                <div className="h-6 bg-[var(--glass-hover)] rounded mb-2" />
                <div className="h-4 bg-[var(--glass-hover)] rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-[var(--glass-hover)] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Play className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No Videos Found</h3>
            <p className="text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          <GridView
            videos={videos}
            selectedVideos={selectedVideos}
            onToggleSelect={toggleSelectVideo}
            onPlay={setPlayingVideo}
            formatDuration={formatDuration}
            onVersionUpload={handleVersionUpload} 

          />
        ) : (
          <ListView
            videos={videos}
            selectedVideos={selectedVideos}
            onToggleSelect={toggleSelectVideo}
            onPlay={setPlayingVideo}
            formatDuration={formatDuration}
            onVersionUpload={handleVersionUpload} 
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
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'glass-card hover:bg-[var(--glass-hover)]'
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
              <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md" style={{ zIndex: 99999 }}>
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
      <SingleVideoVersionUploadModal
        isOpen={showVersionModal}
        onClose={() => {
          setShowVersionModal(false);
          setSelectedVideoForVersion(null);
        }}
        videoId={selectedVideoForVersion?.id}
        videoTitle={selectedVideoForVersion?.title}
        onUploadComplete={() => {
          fetchVideos(); // Refresh videos list
        }}
      />
    </div>
    
  );
}

// Grid View Component
function GridView({ videos, selectedVideos, onToggleSelect, onPlay, onVersionUpload, formatDuration }) {
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
          className={`group glass-card overflow-hidden hover:shadow-2xl transition-all border-2 ${
            selectedVideos.includes(video.id)
              ? 'border-primary ring-4 ring-primary/20'
              : 'border-transparent'
          }`}
        >
          {/* Thumbnail */}
          <div className="relative aspect-video bg-[var(--glass-hover)]">
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
                  ? 'bg-primary border-primary'
                  : 'bg-white/90 dark:bg-black/50 border-white dark:border-white/20 hover:border-primary'
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
                className="w-16 h-16 bg-white/90 dark:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl"
              >
                <Play className="w-8 h-8 text-primary ml-1" />
              </motion.div>
            </button>

            {/* Duration */}
            <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 backdrop-blur-sm rounded-lg text-xs text-white font-mono">
              {formatDuration(video.duration)}
            </div>

            {/* ✅ Version Badge */}
            {video.currentVersion > 1 && (
              <div className="absolute top-3 right-3 px-2 py-1 bg-purple-600/90 backdrop-blur-sm rounded-lg text-xs text-white font-semibold flex items-center gap-1">
                <Layers className="w-3 h-3" />
                v{video.currentVersion}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="font-bold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
              {video.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {video.campaign.name}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{video.viewCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{video.commentCount || 0}</span>
                </div>
              </div>
              
              {/* ✅ Version Upload Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onVersionUpload(video);
                }}
                className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                title="Upload New Version"
              >
                <Upload className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// List View Component
function ListView({ videos, selectedVideos, onToggleSelect, onPlay, onVersionUpload, formatDuration }) {
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
          className={`group glass-card p-4 hover:shadow-lg transition-all border-2 ${
            selectedVideos.includes(video.id)
              ? 'border-primary ring-4 ring-primary/20'
              : 'border-transparent'
          }`}
        >
          <div className="flex items-center gap-4">
            {/* Checkbox */}
            <button
              onClick={() => onToggleSelect(video.id)}
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                selectedVideos.includes(video.id)
                  ? 'bg-primary border-primary'
                  : 'bg-background border-[var(--glass-border)] hover:border-primary'
              }`}
            >
              {selectedVideos.includes(video.id) && (
                <Check className="w-4 h-4 text-white" />
              )}
            </button>

            {/* Thumbnail */}
            <div className="relative w-32 aspect-video bg-[var(--glass-hover)] rounded-xl overflow-hidden flex-shrink-0">
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
              
              {/* ✅ Version Badge */}
              {video.currentVersion > 1 && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-purple-600/90 backdrop-blur-sm rounded text-xs text-white font-semibold flex items-center gap-1">
                  <Layers className="w-2.5 h-2.5" />
                  v{video.currentVersion}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                {video.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {video.campaign.name} • {video.uploaderName}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
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

            {/* Duration & Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-sm font-mono text-muted-foreground">
                {formatDuration(video.duration)}
              </div>
              
              {/* ✅ Version Upload Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onVersionUpload(video)}
                className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                title="Upload New Version"
              >
                <Upload className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
