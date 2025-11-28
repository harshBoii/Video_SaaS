// components/video/CommentSection.jsx
'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Check, 
  ThumbsUp,
  MoreVertical,
  Trash2,
  Flag,
  AlertCircle
} from 'lucide-react';
import ProtectedButton from '../general/protectedButton';
import { showSuccess, showError, showConfirm } from '@/app/lib/swal';

const PRIORITY_OPTIONS = [
  { value: 'NONE', label: 'Regular Comment', color: 'bg-gray-400', textColor: 'text-gray-700' },
  { value: 'LOW', label: 'Low Priority', color: 'bg-yellow-400', textColor: 'text-yellow-700' },
  { value: 'MEDIUM', label: 'Medium Priority', color: 'bg-blue-400', textColor: 'text-blue-700' },
  { value: 'HIGH', label: 'High Priority', color: 'bg-red-400', textColor: 'text-red-700' },
];

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  return Math.floor(seconds) + ' seconds ago';
}

function PriorityBadge({ priority }) {
  const option = PRIORITY_OPTIONS.find(opt => opt.value === priority);
  if (!option || priority === 'NONE') return null;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${option.textColor} bg-${option.color.split('-')[1]}-100`}>
      <div className={`w-2 h-2 rounded-full ${option.color}`} />
      {option.label}
    </div>
  );
}

function CommentItem({ comment, onReply, onResolve, onDelete, depth = 0 }) {
  const [showActions, setShowActions] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      await onReply(comment.id, replyContent);
      setReplyContent('');
      setIsReplying(false);
      showSuccess('Success', 'Reply posted');
    } catch (error) {
      showError('Error', 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async () => {
    try {
      await onResolve(comment.id);
      showSuccess('Success', 'Comment resolved');
    } catch (error) {
      showError('Error', 'Failed to resolve comment');
    }
  };

  const handleDelete = async () => {
    const result = await showConfirm('Delete Comment?', 'This action cannot be undone.', 'Delete', 'Cancel');
    if (result.isConfirmed) {
      try {
        await onDelete(comment.id);
        showSuccess('Deleted', 'Comment removed');
      } catch (error) {
        showError('Error', 'Failed to delete');
      }
    }
  };

  // Helper variables for safe rendering
  const hasEmployee = !!comment.employee;
  const displayName = hasEmployee 
    ? `${comment.employee.firstName} ${comment.employee.lastName}` 
    : (comment.guestName || "Guest User");
  
  const initials = hasEmployee
    ? `${comment.employee.firstName[0]}${comment.employee.lastName[0]}`
    : (comment.guestName ? comment.guestName[0].toUpperCase() : 'G');

  return (
    <div className={`flex gap-3 ${depth > 0 ? 'ml-12 mt-3' : 'py-4'} ${depth === 0 ? 'border-b border-gray-200' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
          hasEmployee ? "bg-gradient-to-br from-blue-500 to-purple-600" : "bg-gradient-to-br from-gray-400 to-gray-500"
        }`}>
          {initials}
        </div>
      </div>

      {/* Comment Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm text-gray-900">
            {displayName}
          </span>
          
          {/* Guest Badge */}
          {!hasEmployee && (
             <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 font-medium rounded-full border border-gray-200 uppercase tracking-wide">
               Guest
             </span>
          )}

          <span className="text-xs text-gray-500">
            {formatTimeAgo(comment.createdAt)}
          </span>
          {comment.timestamp !== null && (
            <>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-blue-600 font-medium">
                {Math.floor(comment.timestamp / 60)}:{(comment.timestamp % 60).toString().padStart(2, '0')}
              </span>
            </>
          )}
        </div>

        {/* Priority Badge */}
        {comment.priority !== 'NONE' && (
          <div className="mb-2">
            <PriorityBadge priority={comment.priority} />
          </div>
        )}

        {/* Content */}
        <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap leading-relaxed">
          {comment.content}
        </p>

        {/* Resolved Badge */}
        {comment.status === 'RESOLVED' && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium mb-2">
            <Check className="w-3 h-3" />
            Resolved
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 font-medium">
            <ThumbsUp className="w-4 h-4" />
          </button>

          {comment.status === 'OPEN' && (
            <>
              <button onClick={() => setIsReplying(!isReplying)} className="text-xs text-gray-600 hover:text-gray-900 font-medium">
                Reply
              </button>
              {/* Only show Resolve if NOT guest (unless you want guests to resolve) */}
              <ProtectedButton requiredPermissions={['Resolve Comment']} onClick={handleResolve} className="text-xs text-green-600 hover:text-green-700 font-medium bg-transparent border-0 shadow-none p-0 backdrop-blur-none">
                Mark as Resolved
              </ProtectedButton>
            </>
          )}

          {/* More Actions */}
          <div className="relative ml-auto">
            <button onClick={() => setShowActions(!showActions)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
            <AnimatePresence>
              {showActions && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                    <button onClick={() => setShowActions(false)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <Flag className="w-4 h-4" /> Report
                    </button>
                    <ProtectedButton requiredPermissions={['Delete Comment']} onClick={() => { setShowActions(false); handleDelete(); }} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 bg-transparent border-0 shadow-none backdrop-blur-none rounded-none">
                      <Trash2 className="w-4 h-4" /> Delete
                    </ProtectedButton>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Reply Input */}
        <AnimatePresence>
          {isReplying && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">U</div>
                <div className="flex-1">
                  <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Add a reply..." className="w-full px-0 py-1 border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:ring-0 resize-none text-sm" rows={2} />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setIsReplying(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-colors">Cancel</button>
                    <button onClick={handleReply} disabled={submitting || !replyContent.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors">Reply</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Render Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3">
            <button onClick={() => setShowReplies(!showReplies)} className="text-blue-600 text-sm font-medium hover:bg-blue-50 px-3 py-1.5 rounded-full transition-colors">
              {showReplies ? '▼' : '▶'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
            <AnimatePresence>
              {showReplies && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  {comment.replies.map((reply) => (
                    <CommentItem key={reply.id} comment={reply} onReply={onReply} onResolve={onResolve} onDelete={onDelete} depth={depth + 1} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function PriorityDropdown({ selected, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = PRIORITY_OPTIONS.find(opt => opt.value === selected) || PRIORITY_OPTIONS[0];

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
        <div className={`w-2.5 h-2.5 rounded-full ${selectedOption.color}`} />
        {selectedOption.label}
      </button>
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
              {PRIORITY_OPTIONS.map((option) => (
                <button key={option.value} onClick={() => { onSelect(option.value); setIsOpen(false); }} className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors ${selected === option.value ? 'bg-blue-50' : ''}`}>
                  <div className={`w-3 h-3 rounded-full ${option.color}`} />
                  <span className="font-medium">{option.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CommentSection({ videoId, currentTime = null , isPublic = false }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [priority, setPriority] = useState('NONE');
  const [showInput, setShowInput] = useState(false);
  const [guestName, setGuestName] = useState('');

  useEffect(() => {
    loadComments();
  }, [videoId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/videos/${videoId}/comments?sort=${sortBy}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load comments');
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      showError('Error', 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (isPublic && !guestName.trim()) {
      showError('Required', 'Please enter a name to comment');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/videos/${videoId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: isPublic ? 'omit':'include',
        body: JSON.stringify({
          content: newComment,
          timestamp: currentTime,
          priority,
          isGuest: isPublic,
          guestName: isPublic ? guestName : undefined, 
        }),
      });
      if (!response.ok) throw new Error('Failed to post comment');
      setNewComment('');
      setPriority('NONE');
      setShowInput(false);
      await loadComments();
      showSuccess('Success', 'Comment posted');
    } catch (error) {
      showError('Error', 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId, content) => {
    const response = await fetch(`/api/videos/${videoId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content, parentId }),
    });
    if (!response.ok) throw new Error('Failed to post reply');
    await loadComments();
  };

  const handleResolve = async (commentId) => {
    const response = await fetch(`/api/videos/${videoId}/comments/${commentId}/resolve`, { method: 'PATCH', credentials: 'include' });
    if (!response.ok) throw new Error('Failed to resolve comment');
    await loadComments();
  };

  const handleDelete = async (commentId) => {
    const response = await fetch(`/api/videos/${videoId}/comments/${commentId}`, { method: 'DELETE', credentials: 'include' });
    if (!response.ok) throw new Error('Failed to delete comment');
    await loadComments();
  };

  const filteredComments = comments.filter((comment) => {
    if (comment.parentId) return false;
    if (filter === 'open') return comment.status === 'OPEN';
    if (filter === 'resolved') return comment.status === 'RESOLVED';
    return true;
  });

  const commentCount = comments.filter(c => !c.parentId).length;

  // REUSABLE UI FOR INPUT
  const CommentInputUI = (
    <div className="p-4 border-b border-black">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
          {isPublic ? (guestName ? guestName[0].toUpperCase() : 'G') : 'U'} 
        </div>
        <div className="flex-1">
          {isPublic && showInput && (
            <div className="mb-2">
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Enter guest name "
                className="w-80 md:w-1/2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          )}
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onFocus={() => setShowInput(true)}
            placeholder={isPublic ? "Add a public comment..." : "Add a comment..."}
            className="w-full px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:ring-0 text-sm bg-transparent"
          />
          <AnimatePresence>
            {showInput && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3">
                <div className="flex items-center justify-between">
                  {!isPublic ? (
                    <PriorityDropdown selected={priority} onSelect={setPriority} />
                  ) : (
                    <div className="text-xs text-gray-400">Posting as {guestName || 'Guest'}</div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => { setShowInput(false); setNewComment(''); setPriority('NONE'); }} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-colors">Cancel</button>
                    <button onClick={handleAddComment} disabled={submitting || !newComment.trim() || (isPublic && !guestName.trim())} className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors flex items-center gap-2">
                      <Send className="w-4 h-4" /> Comment
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">{commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}</h3>
          <div className="flex gap-2">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="newest">Newest first</option>
              <option value="top">Top comments</option>
            </select>
          </div>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {['all', 'open', 'resolved'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Comment Input Area - Logic split for Public/Private */}
      {isPublic ? (
        <div className="bg-transparent border-0 shadow-none p-0 block">
          {CommentInputUI}
        </div>
      ) : (
        <ProtectedButton requiredPermissions={['Comment Video', 'Team Only Comments']} className="w-140 bg-transparent border-0 shadow-none p-0 block">
          {CommentInputUI}
        </ProtectedButton>
      )}

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="px-4">
            {filteredComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} onReply={handleReply} onResolve={handleResolve} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
