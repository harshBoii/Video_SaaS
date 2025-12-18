"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Filter,
  SortDesc,
  Flag,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  Edit3,
  MoreVertical,
  X,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';

const PRIORITIES = {
  LOW: { label: 'Low', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: '🔵' },
  MEDIUM: { label: 'Medium', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', icon: '🟡' },
  HIGH: { label: 'High', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: '🟠' },
  URGENT: { label: 'Urgent', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: '🔴' },
};

const STATUSES = {
  OPEN: { label: 'Open', color: 'text-green-400 bg-green-500/10 border-green-500/20', icon: AlertCircle },
  RESOLVED: { label: 'Resolved', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20', icon: CheckCircle },
};

export default function DocumentCommentPanel({ 
  documentId, 
  currentVersion,
  className = ""
}) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('MEDIUM');
  const [posting, setPosting] = useState(false);
  
  // Filter & Sort states
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterVersion, setFilterVersion] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  
  // Stats
  const [stats, setStats] = useState(null);
  
  // Resolution modal
  const [resolvingComment, setResolvingComment] = useState(null);
  const [resolution, setResolution] = useState('');

  // Fetch comments
  const fetchComments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        sort: sortOrder,
      });
      
      if (filterPriority !== 'ALL') params.append('priority', filterPriority);
      if (filterStatus !== 'ALL') params.append('status', filterStatus);
      if (filterVersion !== 'ALL') params.append('version', filterVersion);

      const response = await fetch(
        `/api/documents/${documentId}/comments?${params}`,
        { credentials: 'include' }
      );

      const data = await response.json();
      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('[FETCH COMMENTS ERROR]', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(
        `/api/documents/${documentId}/comments/stats`,
        { credentials: 'include' }
      );

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('[FETCH STATS ERROR]', error);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchComments();
      fetchStats();
    }
  }, [documentId, sortOrder, filterPriority, filterStatus, filterVersion]);

  // Post comment
  const handlePostComment = async () => {
    if (!newComment.trim()) return;

    setPosting(true);
    try {
      const response = await fetch(
        `/api/documents/${documentId}/comments`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: newComment,
            priority: selectedPriority,
            versionNumber: currentVersion,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setNewComment('');
        setSelectedPriority('MEDIUM');
        fetchComments();
        fetchStats();
      }
    } catch (error) {
      console.error('[POST COMMENT ERROR]', error);
    } finally {
      setPosting(false);
    }
  };

  // Resolve comment
  const handleResolveComment = async (commentId) => {
    if (!resolution.trim()) return;

    try {
      const response = await fetch(
        `/api/documents/${documentId}/comments/${commentId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'RESOLVED',
            resolution: resolution.trim(),
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setResolvingComment(null);
        setResolution('');
        fetchComments();
        fetchStats();
      }
    } catch (error) {
      console.error('[RESOLVE COMMENT ERROR]', error);
    }
  };

  // Update priority
  const handleUpdatePriority = async (commentId, newPriority) => {
    try {
      const response = await fetch(
        `/api/documents/${documentId}/comments/${commentId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priority: newPriority }),
        }
      );

      const data = await response.json();
      if (data.success) {
        fetchComments();
        fetchStats();
      }
    } catch (error) {
      console.error('[UPDATE PRIORITY ERROR]', error);
    }
  };

  // Format time
  const formatTime = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`${className} bg-slate-900 border-l border-white/10 flex flex-col h-full`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-500/10 rounded-lg">
              <MessageSquare className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Comments</h3>
              <p className="text-xs text-white/50">
                {stats?.total || 0} total • v{currentVersion || 1}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => { fetchComments(); fetchStats(); }}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-white/70" />
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? (
                <ChevronUp className="w-4 h-4 text-white/70" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/70" />
              )}
            </button>
          </div>
        </div>

        {/* Stats Badges */}
        {!collapsed && stats && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-xs">
              <AlertCircle className="w-3 h-3 text-green-400" />
              <span className="text-green-400 font-medium">{stats.byStatus.OPEN}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-500/10 border border-gray-500/20 rounded text-xs">
              <CheckCircle className="w-3 h-3 text-gray-400" />
              <span className="text-gray-400 font-medium">{stats.byStatus.RESOLVED}</span>
            </div>
            {stats.byPriority.URGENT > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-xs">
                <Flag className="w-3 h-3 text-red-400" />
                <span className="text-red-400 font-medium">{stats.byPriority.URGENT} Urgent</span>
              </div>
            )}
          </div>
        )}
      </div>

      {!collapsed && (
        <>
          {/* Filters & Sort */}
          <div className="px-4 py-2 border-b border-white/5 bg-slate-800/20">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-xs transition-colors"
              >
                <Filter className="w-3.5 h-3.5 text-white/70" />
                <span className="text-white/70">Filter</span>
                <ChevronDown className={`w-3 h-3 text-white/70 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-xs transition-colors"
              >
                <SortDesc className="w-3.5 h-3.5 text-white/70" />
                <span className="text-white/70 text-xs">
                  {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                </span>
              </button>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 pt-2 border-t border-white/5 space-y-2 overflow-hidden"
                >
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Priority</label>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-800 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-blue-500/50"
                    >
                      <option value="ALL">All</option>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-800 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-blue-500/50"
                    >
                      <option value="ALL">All</option>
                      <option value="OPEN">Open</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  </div>

                  {stats && Object.keys(stats.byVersion).length > 1 && (
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">Version</label>
                      <select
                        value={filterVersion}
                        onChange={(e) => setFilterVersion(e.target.value)}
                        className="w-full px-2 py-1 bg-slate-800 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-blue-500/50"
                      >
                        <option value="ALL">All Versions</option>
                        {Object.keys(stats.byVersion).map(version => (
                          <option key={version} value={version}>
                            v{version} ({stats.byVersion[version]})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-10 h-10 text-white/20 mx-auto mb-2" />
                <p className="text-white/50 text-sm">No comments</p>
                <p className="text-white/30 text-xs mt-1">Be the first!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  onResolve={() => setResolvingComment(comment)}
                  onUpdatePriority={(priority) => handleUpdatePriority(comment.id, priority)}
                  formatTime={formatTime}
                />
              ))
            )}
          </div>

          {/* New Comment Input */}
          <div className="px-4 py-3 border-t border-white/10 bg-slate-800/30">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add feedback..."
              className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-purple-500/50 resize-none"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handlePostComment();
                }
              }}
            />
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1">
                {Object.entries(PRIORITIES).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPriority(key)}
                    className={`px-1.5 py-0.5 rounded text-xs border transition-colors ${
                      selectedPriority === key
                        ? config.color
                        : 'text-white/40 bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                    title={config.label}
                  >
                    {config.icon}
                  </button>
                ))}
              </div>

              <button
                onClick={handlePostComment}
                disabled={!newComment.trim() || posting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed rounded-lg transition-colors text-xs font-medium"
              >
                {posting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Post
              </button>
            </div>
          </div>
        </>
      )}

      {/* Resolution Modal */}
      <AnimatePresence>
        {resolvingComment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setResolvingComment(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-xl p-4 max-w-sm w-full border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-bold text-white mb-3">Resolve Comment</h3>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="How was this resolved?"
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-green-500/50 resize-none mb-3"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setResolvingComment(null)}
                  className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleResolveComment(resolvingComment.id)}
                  disabled={!resolution.trim()}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 disabled:cursor-not-allowed rounded-lg transition-colors text-xs font-medium"
                >
                  Resolve
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Comment Card Component
function CommentCard({ comment, onResolve, onUpdatePriority, formatTime }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  
  const priorityConfig = PRIORITIES[comment.priority];
  const statusConfig = STATUSES[comment.status];
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 rounded-lg p-3 border border-white/10 hover:border-white/20 transition-colors"
    >
      <div className="flex items-start gap-2">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {comment.author?.name?.charAt(0) || '?'}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-1.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-white text-xs">{comment.author?.name || 'Unknown'}</span>
                <span className="text-xs text-white/40">{formatTime(comment.createdAt)}</span>
                {comment.versionNumber && (
                  <span className="px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs rounded">
                    v{comment.versionNumber}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`px-1.5 py-0.5 rounded text-xs border ${priorityConfig.color}`}>
                  {priorityConfig.icon}
                </span>
                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border ${statusConfig.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  <span className="text-xs">{statusConfig.label}</span>
                </span>
              </div>
            </div>

            {/* Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <MoreVertical className="w-3.5 h-3.5 text-white/50" />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 mt-1 w-32 bg-slate-800 border border-white/10 rounded-lg shadow-xl overflow-hidden z-10"
                  >
                    {comment.status === 'OPEN' && (
                      <button
                        onClick={() => {
                          onResolve();
                          setShowMenu(false);
                        }}
                        className="w-full px-2 py-1.5 text-left text-xs text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                        Resolve
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Content */}
          <p className="text-white/80 text-xs whitespace-pre-wrap leading-relaxed">{comment.content}</p>

          {/* Resolution */}
          {comment.status === 'RESOLVED' && comment.resolution && (
            <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded">
              <div className="flex items-center gap-1 mb-0.5">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-xs font-medium text-green-400">Resolution</span>
              </div>
              <p className="text-xs text-green-300/80">{comment.resolution}</p>
            </div>
          )}

          {/* Replies Toggle */}
          {comment.replies?.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="mt-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
            >
              <MessageSquare className="w-3 h-3" />
              {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              <ChevronDown className={`w-3 h-3 transition-transform ${showReplies ? 'rotate-180' : ''}`} />
            </button>
          )}

          {/* Replies List */}
          <AnimatePresence>
            {showReplies && comment.replies?.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 space-y-1.5 pl-3 border-l-2 border-purple-500/20"
              >
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="flex items-start gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                      {reply.author?.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-white">{reply.author?.name}</span>
                        <span className="text-xs text-white/30">{formatTime(reply.createdAt)}</span>
                      </div>
                      <p className="text-xs text-white/70 mt-0.5">{reply.content}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
