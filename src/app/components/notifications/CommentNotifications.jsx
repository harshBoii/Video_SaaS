'use client';
import { useState, useEffect } from 'react';
import { 
  Bell, MessageSquare, Flag, Clock, User, 
  Video, CheckCircle, AlertCircle, Loader2, Play, RefreshCw, Lock,
  Calendar, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showSuccess, showError } from '@/app/lib/swal';
import VideoPlayer from '../video/VideoPlayer';
import { CampaignPermissionsProvider, useCampaignPermissions } from '@/app/context/permissionContext';

const PRIORITY_CONFIG = {
  NONE: { 
    color: 'gray', 
    gradient: 'from-gray-400 to-gray-500',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    label: 'Regular', 
    icon: MessageSquare 
  },
  LOW: { 
    color: 'yellow', 
    gradient: 'from-yellow-400 to-amber-500',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    label: 'Low Priority', 
    icon: Flag 
  },
  MEDIUM: { 
    color: 'blue', 
    gradient: 'from-blue-400 to-indigo-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    label: 'Medium Priority', 
    icon: Flag 
  },
  HIGH: { 
    color: 'red', 
    gradient: 'from-red-500 to-rose-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'High Priority', 
    icon: AlertCircle 
  }
};

function toTitleCase(str = '') {
  return str
    .replace(/^[-_]*(.)/, (_, c) => c.toUpperCase())
    .replace(/[-_]+(.)/g, (_, c) => ' ' + c.toUpperCase());
}

// Enhanced Notification Card
const NotificationCard = ({ notification, onResolve, onViewVideo, index }) => {
  const [isResolving, setIsResolving] = useState(false);
  const [resolution, setResolution] = useState('');
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { permissionsData, loading: permissionsLoading } = useCampaignPermissions();
  const priorityConfig = PRIORITY_CONFIG[notification.priority];
  const PriorityIcon = priorityConfig.icon;

  const canResolve = () => {
    if (permissionsLoading || !permissionsData) return false;
    const isAdmin = permissionsData.isAdmin === true;
    const isSuperAdmin = permissionsData.role?.toLowerCase() === 'superadmin' || 
                         permissionsData.role?.toLowerCase() === 'admin';
    const hasSuperAdminPermission = permissionsData.permissions?.some(p => 
      toTitleCase(p).toLowerCase() === 'superadmin all'
    );
    const permissions = permissionsData.permissions || [];
    const standardized = permissions.map(toTitleCase);
    const hasResolvePermission = standardized.includes('Comment Video') || 
                                  standardized.includes('Resolve Comment');
    return isAdmin || isSuperAdmin || hasSuperAdminPermission || hasResolvePermission;
  };

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
      } else {
        showError('Error', data.error);
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

  const hasResolvePermission = canResolve();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.9 }}
      transition={{ 
        duration: 0.4,
        delay: index * 0.1,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ y: -5, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow relative"
    >
      {/* Animated gradient background on hover */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.05 : 0 }}
        className={`absolute inset-0 bg-gradient-to-br ${priorityConfig.gradient} pointer-events-none`}
      />

      <div className="relative p-6">
        {/* Priority Badge */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
          className="absolute top-4 right-4"
        >
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${priorityConfig.bg} ${priorityConfig.border} border`}>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <PriorityIcon className={`w-4 h-4 text-${priorityConfig.color}-600`} />
            </motion.div>
            <span className={`text-xs font-bold text-${priorityConfig.color}-700 uppercase tracking-wide`}>
              {priorityConfig.label}
            </span>
          </div>
        </motion.div>

        {/* Time Badge */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.3 }}
          className="flex items-center gap-2 mb-4"
        >
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500 font-medium">{timeAgo(notification.createdAt)}</span>
        </motion.div>

        {/* Commenter Info */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.4 }}
          className="flex items-center gap-3 mb-4"
        >
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-md"
          >
            <User className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <p className="text-base font-bold text-gray-900">
              {notification.commenter.name}
            </p>
            {notification.commenter.email && (
              <p className="text-xs text-gray-500">{notification.commenter.email}</p>
            )}
          </div>
        </motion.div>

        {/* Video Info */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.5 }}
          whileHover={{ scale: 1.02 }}
          className="relative mb-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border border-blue-100 overflow-hidden"
        >
          <motion.div
            animate={{ 
              x: [0, 100, 0],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
          />
          <div className="relative flex items-center gap-3">
            <Video className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {notification.video.title}
              </p>
              <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                <span className="font-semibold">📁</span>
                {notification.video.campaign.name}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Comment Content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.6 }}
          className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-r-xl relative overflow-hidden"
        >
          <Sparkles className="absolute top-2 right-2 w-4 h-4 text-blue-300 opacity-50" />
          <p className="text-sm text-gray-800 leading-relaxed relative z-10">
            "{notification.content}"
          </p>
          {notification.timestamp !== null && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 + 0.7 }}
              className="flex items-center gap-1.5 mt-3 bg-white/60 backdrop-blur-sm rounded-full px-3 py-1.5 w-fit"
            >
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs text-blue-700 font-bold font-mono">
                {formatTimestamp(notification.timestamp)}
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.7 }}
          className="flex gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleViewVideo}
            disabled={loadingVideo}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-xl text-sm font-bold disabled:opacity-50 relative overflow-hidden group"
          >
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
            {loadingVideo ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>View Video</span>
              </>
            )}
          </motion.button>
          
          {permissionsLoading ? (
            <motion.button
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              disabled
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-500 rounded-xl text-sm font-bold cursor-not-allowed"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Checking...</span>
            </motion.button>
          ) : hasResolvePermission ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowResolutionForm(!showResolutionForm)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-xl text-sm font-bold relative overflow-hidden group"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute -right-1 -top-1"
              >
                <Sparkles className="w-4 h-4 text-green-200 opacity-50" />
              </motion.div>
              <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Resolve</span>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              disabled
              title="You don't have permission to resolve comments"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-400 rounded-xl text-sm font-bold cursor-not-allowed border-2 border-dashed border-gray-300"
            >
              <Lock className="w-4 h-4" />
              <span>Restricted</span>
            </motion.button>
          )}
        </motion.div>

        {/* Resolution Form */}
        <AnimatePresence>
          {showResolutionForm && hasResolvePermission && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.3 }}
              className="pt-4 border-t-2 border-dashed border-gray-200"
            >
              <motion.label
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 block flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-green-600" />
                Resolution Details
              </motion.label>
              <motion.textarea
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describe how this issue was resolved..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none hover:border-green-300 transition-colors"
                rows={3}
              />
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex gap-3 mt-3"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowResolutionForm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors border-2 border-gray-200"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleResolve}
                  disabled={isResolving || !resolution.trim()}
                  className="flex-1 px-4 py-2.5 text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  {isResolving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Resolving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirm Resolution</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const ProtectedNotificationCard = (props) => (
  <CampaignPermissionsProvider campaignId={props.notification.video.campaign.id}>
    <NotificationCard {...props} />
  </CampaignPermissionsProvider>
);

// Main Component
export default function CommentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
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

  const filteredNotifications = filter === 'ALL' 
    ? notifications 
    : notifications.filter(n => n.priority === filter);

  const priorityCounts = {
    ALL: notifications.length,
    HIGH: notifications.filter(n => n.priority === 'HIGH').length,
    MEDIUM: notifications.filter(n => n.priority === 'MEDIUM').length,
    LOW: notifications.filter(n => n.priority === 'LOW').length,
    NONE: notifications.filter(n => n.priority === 'NONE').length
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="p-4 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl relative"
              >
                <Bell className="w-8 h-8 text-white" />
                {notifications.length > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
                  >
                    {notifications.length > 99 ? '99+' : notifications.length}
                  </motion.div>
                )}
              </motion.div>
              <div>
                <motion.h1
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
                >
                  Comment Notifications
                </motion.h1>
                <motion.p
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-gray-600 mt-1 font-medium"
                >
                  {notifications.length} open comment{notifications.length !== 1 ? 's' : ''} requiring attention
                </motion.p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadNotifications}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-blue-300 transition-all shadow-md hover:shadow-lg disabled:opacity-50 font-semibold"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </motion.button>
          </div>

          <div className="flex gap-3 flex-wrap">
            {['ALL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'].map((f, idx) => (
              <motion.button
                key={f}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: idx * 0.1, type: "spring" }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(f)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg ${
                  filter === f
                    ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }`}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()} 
                <motion.span 
                  key={priorityCounts[f]}
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                  className={`ml-2 px-2.5 py-1 rounded-full text-xs font-black ${
                    filter === f ? 'bg-white/30' : 'bg-gray-200'
                  }`}
                >
                  {priorityCounts[f]}
                </motion.span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-96"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mb-6"
            />
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-gray-500 font-semibold text-lg"
            >
              Loading notifications...
            </motion.p>
          </motion.div>
        ) : filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring" }}
            className="text-center py-20"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>
            <motion.h3
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-black text-gray-900 mb-3"
            >
              All Caught Up!
            </motion.h3>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 text-lg"
            >
              {filter === 'ALL' 
                ? 'No open comments to review' 
                : `No ${filter.toLowerCase()} priority comments`}
            </motion.p>
          </motion.div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notification, index) => (
                <ProtectedNotificationCard
                  key={notification.id}
                  notification={notification}
                  onResolve={handleResolve}
                  onViewVideo={handleViewVideo}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </motion.div>
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
