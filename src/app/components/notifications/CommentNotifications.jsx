'use client';
import { useState, useEffect, useMemo } from 'react';
import { 
  Bell, MessageSquare, Flag, Clock, User, 
  Video, CheckCircle, AlertCircle, Loader2, Play, RefreshCw,
  FolderOpen, ChevronDown, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showSuccess, showError } from '@/app/lib/swal';
import VideoPlayer from '../video/VideoPlayer';
import { CampaignPermissionsProvider } from '@/app/context/permissionContext';

const PRIORITY_CONFIG = {
  NONE: { 
    color: 'gray', 
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    label: 'Regular', 
    icon: MessageSquare 
  },
  LOW: { 
    color: 'yellow', 
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    label: 'Low Priority', 
    icon: Flag 
  },
  MEDIUM: { 
    color: 'blue', 
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    label: 'Medium Priority', 
    icon: Flag 
  },
  HIGH: { 
    color: 'red', 
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    label: 'High Priority', 
    icon: AlertCircle 
  }
};

// NotificationCard component (same as before)
const NotificationCard = ({ notification, onResolve, onViewVideo, index }) => {
  const [isResolving, setIsResolving] = useState(false);
  const [resolution, setResolution] = useState('');
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(false);

  const priorityConfig = PRIORITY_CONFIG[notification.priority];
  const PriorityIcon = priorityConfig.icon;

  const handleResolve = async () => {
    if (!resolution.trim()) {
      showError('Error', 'Please provide a resolution');
      return;
    }

    setIsResolving(true);
    try {
      const res = await fetch(`/api/notifications/comments/${notification.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ resolution })
      });

      const data = await res.json();
      
      if (data.success) {
        showSuccess('Resolved', 'Comment has been resolved successfully');
        onResolve(notification.id);
        setShowResolutionForm(false);
      } else if (res.status === 403) {
        showError('Permission Denied', 'You don\'t have permission to resolve comments');
      } else {
        showError('Error', data.error || 'Failed to resolve comment');
      }
    } catch (error) {
      showError('Error', 'Failed to resolve comment');
    } finally {
      setIsResolving(false);
    }
  };

  const handleViewVideo = async () => {
    setLoadingVideo(true);
    try {
      const res = await fetch(`/api/videos/${notification.video.id}`, {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (data.success) {
        onViewVideo(data.video, notification.video.campaign.id);
      } else {
        showError('Error', 'Failed to load video');
      }
    } catch (error) {
      showError('Error', 'Failed to load video');
    } finally {
      setLoadingVideo(false);
    }
  };

  const formatTimestamp = (seconds) => {
    if (seconds === null || seconds === undefined) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        duration: 0.3,
        delay: index * 0.05,
        ease: "easeOut"
      }}
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">{timeAgo(notification.createdAt)}</span>
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${priorityConfig.bg} ${priorityConfig.border} border`}>
          <PriorityIcon className={`w-4 h-4 ${priorityConfig.text}`} />
          <span className={`text-xs font-semibold ${priorityConfig.text} uppercase`}>
            {priorityConfig.label}
          </span>
        </div>
      </div>

      {/* Commenter Info */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {notification.commenter.name}
          </p>
          {notification.commenter.email && (
            <p className="text-xs text-gray-500 truncate">{notification.commenter.email}</p>
          )}
        </div>
      </div>

      {/* Video Info */}
      <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <Video className="w-4 h-4 text-slate-600" />
          <span className="text-xs font-medium text-slate-600">Video</span>
        </div>
        <p className="text-sm font-semibold text-gray-900 truncate mb-1">
          {notification.video.title}
        </p>
        <p className="text-xs text-gray-600 truncate">
          {notification.video.campaign.name}
        </p>
      </div>

      {/* Comment Content */}
      <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
        <p className="text-sm text-gray-800 leading-relaxed">
          "{notification.content}"
        </p>
        {notification.timestamp !== null && (
          <div className="flex items-center gap-1.5 mt-2 text-blue-700">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold font-mono">
              {formatTimestamp(notification.timestamp)}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleViewVideo}
          disabled={loadingVideo}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingVideo ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              View Video
            </>
          )}
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowResolutionForm(!showResolutionForm)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
        >
          <CheckCircle className="w-4 h-4" />
          Resolve
        </motion.button>
      </div>

      {/* Resolution Form */}
      <AnimatePresence>
        {showResolutionForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
              Resolution Details
            </label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Describe how this issue was resolved..."
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
              rows={3}
            />
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => setShowResolutionForm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={isResolving || !resolution.trim()}
                className="flex-1 px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isResolving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resolving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirm
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Main Component
export default function CommentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [campaignFilter, setCampaignFilter] = useState('ALL');
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications/comments', {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      showError('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = (commentId) => {
    setNotifications(prev => prev.filter(n => n.id !== commentId));
  };

  const handleViewVideo = (video, campaignId) => {
    setSelectedVideo(video);
    setSelectedCampaignId(campaignId);
  };

  // ✅ Extract unique campaigns with counts
  const campaigns = useMemo(() => {
    const campaignMap = new Map();
    
    notifications.forEach(notification => {
      const campaign = notification.video.campaign;
      if (!campaignMap.has(campaign.id)) {
        campaignMap.set(campaign.id, {
          id: campaign.id,
          name: campaign.name,
          count: 0
        });
      }
      campaignMap.get(campaign.id).count++;
    });
    
    return Array.from(campaignMap.values()).sort((a, b) => b.count - a.count);
  }, [notifications]);

  // ✅ Apply both filters
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchesPriority = priorityFilter === 'ALL' || n.priority === priorityFilter;
      const matchesCampaign = campaignFilter === 'ALL' || n.video.campaign.id === campaignFilter;
      return matchesPriority && matchesCampaign;
    });
  }, [notifications, priorityFilter, campaignFilter]);

  const priorityCounts = {
    ALL: notifications.length,
    HIGH: notifications.filter(n => n.priority === 'HIGH').length,
    MEDIUM: notifications.filter(n => n.priority === 'MEDIUM').length,
    LOW: notifications.filter(n => n.priority === 'LOW').length,
    NONE: notifications.filter(n => n.priority === 'NONE').length
  };

  const selectedCampaignName = campaignFilter === 'ALL' 
    ? 'All Campaigns' 
    : campaigns.find(c => c.id === campaignFilter)?.name || 'Select Campaign';

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                <Bell className="w-7 h-7 text-white" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {notifications.length > 99 ? '99+' : notifications.length}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Comment Notifications
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  {filteredNotifications.length} of {notifications.length} comment{notifications.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadNotifications}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
          </div>

          {/* Filters Row */}
          <div className="space-y-3">
            {/* Priority Filters */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Priority
              </label>
              <div className="flex gap-2 flex-wrap">
                {['ALL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'].map((f) => (
                  <motion.button
                    key={f}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPriorityFilter(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      priorityFilter === f
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {f.charAt(0) + f.slice(1).toLowerCase()} 
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                      priorityFilter === f ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      {priorityCounts[f]}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Campaign Filter */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Campaign
              </label>
              <div className="flex gap-2 items-center">
                {/* Campaign Dropdown */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCampaignDropdown(!showCampaignDropdown)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:border-blue-300 transition-colors font-medium min-w-[200px]"
                  >
                    <FolderOpen className="w-4 h-4 text-gray-500" />
                    <span className="flex-1 text-left truncate text-sm">{selectedCampaignName}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCampaignDropdown ? 'rotate-180' : ''}`} />
                  </motion.button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {showCampaignDropdown && (
                      <>
                        {/* Backdrop */}
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowCampaignDropdown(false)}
                        />
                        
                        {/* Dropdown */}
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-96 overflow-y-auto"
                        >
                          {/* All Campaigns Option */}
                          <button
                            onClick={() => {
                              setCampaignFilter('ALL');
                              setShowCampaignDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                              campaignFilter === 'ALL' ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FolderOpen className="w-4 h-4 text-gray-400" />
                                <span className="font-semibold text-gray-900">All Campaigns</span>
                              </div>
                              <span className="text-sm font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                {notifications.length}
                              </span>
                            </div>
                          </button>

                          {/* Campaign List */}
                          {campaigns.map((campaign) => (
                            <button
                              key={campaign.id}
                              onClick={() => {
                                setCampaignFilter(campaign.id);
                                setShowCampaignDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                                campaignFilter === campaign.id ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900 truncate pr-2">
                                  {campaign.name}
                                </span>
                                <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                                  {campaign.count}
                                </span>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Clear Campaign Filter */}
                {campaignFilter !== 'ALL' && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCampaignFilter('ALL')}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    title="Clear campaign filter"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
            <p className="text-gray-500 font-medium">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {notifications.length === 0 ? 'All Caught Up!' : 'No Matching Notifications'}
            </h3>
            <p className="text-gray-600">
              {notifications.length === 0 
                ? 'No open comments to review' 
                : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <AnimatePresence>
              {filteredNotifications.map((notification, index) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onResolve={handleResolve}
                  onViewVideo={handleViewVideo}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      <AnimatePresence>
        {selectedVideo && selectedCampaignId && (
          <CampaignPermissionsProvider campaignId={selectedCampaignId}>
            <VideoPlayer
              video={selectedVideo}
              onClose={() => {
                setSelectedVideo(null);
                setSelectedCampaignId(null);
              }}
            />
          </CampaignPermissionsProvider>
        )}
      </AnimatePresence>
    </div>
  );
}
