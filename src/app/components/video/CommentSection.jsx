'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, Check, Clock, User, 
  MoreVertical, Trash2, ChevronDown, ChevronUp, Flag
} from 'lucide-react';
import ProtectedButton from '../general/protectedButton';
import { showSuccess, showError, showConfirm } from '@/app/lib/swal';

// --- CONSTANTS ---

const PRIORITY_OPTIONS = [
  { value: 'NONE', label: 'Regular Comment', color: 'bg-gray-400', textColor: 'text-gray-700', bgLight: 'bg-gray-100' },
  { value: 'LOW', label: 'Low Priority', color: 'bg-yellow-400', textColor: 'text-yellow-700', bgLight: 'bg-yellow-50' },
  { value: 'MEDIUM', label: 'Medium Priority', color: 'bg-blue-400', textColor: 'text-blue-700', bgLight: 'bg-blue-50' },
  { value: 'HIGH', label: 'High Priority', color: 'bg-red-400', textColor: 'text-red-700', bgLight: 'bg-red-50' },
];

// --- HELPERS ---

const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const formatTimestamp = (sec) => {
  if (!sec && sec !== 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const renderWithTimestamps = (text, onSeek) => {
  const regex = /\[(\d{1,2}:\d{2})\]/g;
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (part.match(/^\d{1,2}:\d{2}$/)) {
      const [m, s] = part.split(':').map(Number);
      return (
        <button
          key={i}
          onClick={() => onSeek(m * 60 + s)}
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors"
        >
          <Clock className="w-3 h-3" />
          {part}
        </button>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

// --- COMPONENTS ---

function Avatar({ name, isEmployee }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
  const bgClass = isEmployee 
    ? "bg-gradient-to-br from-blue-500 to-purple-600" 
    : "bg-gradient-to-br from-gray-400 to-gray-500";
  
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${bgClass} shadow-sm`}>
      {initials}
    </div>
  );
}

function PriorityBadge({ priority }) {
  const option = PRIORITY_OPTIONS.find(opt => opt.value === priority);
  if (!option || priority === 'NONE') return null;
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold ${option.textColor} ${option.bgLight} border border-${option.color.split('-')[1]}-200`}>
      <Flag className="w-3 h-3" />
      {option.label}
    </div>
  );
}

// ✅ NEW: Custom Priority Dropdown with Colors
function PriorityDropdown({ selected, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = PRIORITY_OPTIONS.find(opt => opt.value === selected) || PRIORITY_OPTIONS[0];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
      >
        <div className={`w-2.5 h-2.5 rounded-full ${selectedOption.color}`}></div>
        <span className="text-gray-700">{selectedOption.label}</span>
        <ChevronDown className="w-3 h-3 text-gray-400 ml-1" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <button 
                  key={option.value}
                  onClick={() => { 
                    onSelect(option.value); 
                    setIsOpen(false); 
                  }}
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors ${
                    selected === option.value ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${option.color}`}></div>
                  <span className="font-medium text-gray-700">{option.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function CommentItem({ comment, onResolve, onDelete, onSeek, onReply }) {
  const [showReplies, setShowReplies] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEmployee = !!comment.employee;
  const name = isEmployee 
    ? `${comment.employee.firstName} ${comment.employee.lastName}` 
    : (comment.guestName || "Guest");

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await onReply(comment.id, replyText);
      setReplyText('');
      setIsReplying(false);
      showSuccess('Reply posted');
    } catch (e) {
      showError('Failed to reply');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="group py-3 border-b border-gray-100 last:border-0">
      <div className="flex gap-3">
        <Avatar name={name} isEmployee={isEmployee} />
        
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-gray-900">{name}</span>
              {!isEmployee && (
                <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 border rounded-full uppercase tracking-wide">Guest</span>
              )}
              <span className="text-xs text-gray-400">{formatTimeAgo(comment.createdAt)}</span>
            </div>
            
            {/* Actions (visible on hover) */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              {comment.status === 'OPEN' && (
                <ProtectedButton 
                  requiredPermissions={['Resolve Comment']}
                  onClick={() => onResolve(comment.id)}
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-md bg-transparent border-0 shadow-none"
                  title="Mark Resolved"
                >
                  <Check className="w-4 h-4" />
                </ProtectedButton>
              )}
              <ProtectedButton 
                requiredPermissions={['Delete Comment']}
                onClick={() => onDelete(comment.id)}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-md bg-transparent border-0 shadow-none"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </ProtectedButton>
            </div>
          </div>

          {/* Priority Badge */}
          {comment.priority && comment.priority !== 'NONE' && (
            <div className="mb-2">
              <PriorityBadge priority={comment.priority} />
            </div>
          )}

          {/* Content */}
          <div className="text-sm text-gray-700 leading-relaxed mb-2">
            {renderWithTimestamps(comment.content, onSeek)}
          </div>

          {/* Status Badge */}
          {comment.status === 'RESOLVED' && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-md mb-2">
              <Check className="w-3 h-3" /> Resolved
            </div>
          )}

          {/* Reply Button */}
          {comment.status === 'OPEN' && (
            <button 
              onClick={() => setIsReplying(!isReplying)}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium"
            >
              Reply
            </button>
          )}

          {/* Reply Input */}
          <AnimatePresence>
            {isReplying && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 flex gap-2"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                />
                <button 
                  onClick={handleReply}
                  disabled={!replyText.trim() || submitting}
                  className="px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Post
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              <button 
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </button>
              
              <AnimatePresence>
                {showReplies && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-6 mt-3 space-y-3 border-l-2 border-gray-100 pl-4"
                  >
                    {comment.replies.map(reply => (
                      <CommentItem 
                        key={reply.id} 
                        comment={reply} 
                        onResolve={onResolve}
                        onDelete={onDelete}
                        onSeek={onSeek}
                        onReply={onReply}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- INPUT COMPONENT ---

function CommentInput({ currentUser, currentTime, isPublic, onPost, isSubmitting }) {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [priority, setPriority] = useState('NONE');

  const insertTime = () => {
    setText(prev => prev + `[${formatTimestamp(currentTime)}] `);
  };

  const handlePost = () => {
    onPost({ content: text, priority, guestName: isPublic ? guestName : undefined });
    setText('');
    setPriority('NONE');
    setIsFocused(false);
  };

  const displayName = isPublic 
    ? (guestName || 'Guest') 
    : (currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'You');

  return (
    <div className={`p-4 transition-all ${isFocused ? 'bg-white shadow-md' : 'bg-gray-50'}`}>
      <div className="flex gap-3">
        <Avatar name={displayName} isEmployee={!isPublic} />
        
        <div className="flex-1">
          {isPublic && isFocused && (
            <input
              type="text"
              placeholder="Your name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full mb-2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
            />
          )}
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={isPublic ? "Add a public comment..." : "Add a comment..."}
            rows={isFocused ? 3 : 1}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none resize-none transition-all"
          />

          <AnimatePresence>
            {isFocused && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 flex items-center justify-between"
              >
                <div className="flex gap-2">
                  <button 
                    onClick={insertTime}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Clock className="w-3 h-3" /> {formatTimestamp(currentTime)}
                  </button>
                  
                  {/* ✅ Custom Priority Dropdown with Colors */}
                  {!isPublic && (
                    <PriorityDropdown selected={priority} onSelect={setPriority} />
                  )}
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setIsFocused(false);
                      setText('');
                      setPriority('NONE');
                    }}
                    className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handlePost}
                    disabled={!text.trim() || isSubmitting || (isPublic && !guestName.trim())}
                    className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" /> Post
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// --- MAIN ---

export default function CommentSection({ videoId, currentTime = 0, isPublic = false, onSeek }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch current user
  useEffect(() => {
    if (!isPublic) {
      fetch('/api/auth/me', { credentials: 'include' })
        .then(res => res.json())
        .then(data => { if (data.success) setCurrentUser(data.employee); })
        .catch(() => {});
    }
  }, [isPublic]);

  // Load comments
  const loadComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/comments`, { credentials: 'include' });
      const data = await res.json();
      setComments(data.comments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadComments(); }, [videoId]);

  const handlePost = async (data) => {
    setSubmitting(true);
    try {
      await fetch(`/api/videos/${videoId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: isPublic ? 'omit' : 'include',
        body: JSON.stringify({
          content: data.content,
          timestamp: currentTime,
          priority: data.priority,
          isGuest: isPublic,
          guestName: data.guestName
        }),
      });
      await loadComments();
      showSuccess('Comment posted');
    } catch (e) {
      showError('Failed to post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId, content) => {
    await fetch(`/api/videos/${videoId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content, parentId }),
    });
    await loadComments();
  };

  const handleResolve = async (id) => {
    await fetch(`/api/videos/${videoId}/comments/${id}/resolve`, { 
      method: 'PATCH', 
      credentials: 'include' 
    });
    await loadComments();
    showSuccess('Resolved');
  };

  const handleDelete = async (id) => {
    const result = await showConfirm('Delete this comment?', 'This cannot be undone.');
    if (result.isConfirmed) {
      await fetch(`/api/videos/${videoId}/comments/${id}`, { 
        method: 'DELETE', 
        credentials: 'include' 
      });
      await loadComments();
      showSuccess('Deleted');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </h3>
      </div>

      {/* Input */}
      {isPublic ? (
        <CommentInput 
          currentUser={null}
          currentTime={currentTime}
          isPublic={true}
          onPost={handlePost}
          isSubmitting={submitting}
        />
      ) : (
        <ProtectedButton requiredPermissions={['Comment Video']} className="bg-transparent border-0 shadow-none p-0">
          <CommentInput 
            currentUser={currentUser}
            currentTime={currentTime}
            isPublic={false}
            onPost={handlePost}
            isSubmitting={submitting}
          />
        </ProtectedButton>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4">
        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading...</div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">No comments yet</p>
          </div>
        ) : (
          comments.map(c => (
            <CommentItem 
              key={c.id} 
              comment={c} 
              onResolve={handleResolve}
              onDelete={handleDelete}
              onSeek={onSeek}
              onReply={handleReply}
            />
          ))
        )}
      </div>
    </div>
  );
}
