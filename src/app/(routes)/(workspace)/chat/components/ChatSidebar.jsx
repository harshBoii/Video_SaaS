'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiPlus,
  FiMessageSquare,
  FiChevronRight,
  FiMoreHorizontal,
  FiTrash2,
  FiEdit2,
  FiFolder,
  FiClock,
} from 'react-icons/fi';

// Mock chat history data
const mockChatHistory = [
  {
    id: '1',
    title: 'Summer Campaign Strategy',
    preview: 'Let\'s create a vibrant summer marketing campaign...',
    timestamp: new Date(),
    campaign: 'Summer 2024',
    isActive: true,
  },
  {
    id: '2',
    title: 'Product Launch Videos',
    preview: 'I need help creating promotional videos for...',
    timestamp: new Date(Date.now() - 3600000),
    campaign: 'Product Launch Q1',
  },
  {
    id: '3',
    title: 'Social Media Content Ideas',
    preview: 'Can you suggest some engaging content ideas...',
    timestamp: new Date(Date.now() - 86400000),
    campaign: null,
  },
  {
    id: '4',
    title: 'Brand Guidelines Review',
    preview: 'Help me review the current brand guidelines...',
    timestamp: new Date(Date.now() - 172800000),
    campaign: 'Rebranding 2024',
  },
  {
    id: '5',
    title: 'Email Newsletter Templates',
    preview: 'I want to create professional email templates...',
    timestamp: new Date(Date.now() - 259200000),
    campaign: null,
  },
];

const formatTimestamp = (date) => {
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const ChatHistoryItem = ({ chat, isSelected, onSelect }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(chat.id)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`
        relative group flex items-start gap-3 p-3 rounded-xl cursor-pointer
        transition-all duration-200
        ${isSelected
          ? 'bg-primary/10 dark:bg-primary/20 border border-primary/20'
          : 'hover:bg-clipfox-surface-hover dark:hover:bg-white/5 border border-transparent'
        }
      `}
    >
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
        ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
      `}>
        <FiMessageSquare className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="text-sm font-medium text-foreground truncate">
            {chat.title}
          </h4>
          {chat.campaign && (
            <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded">
              {chat.campaign}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {chat.preview}
        </p>
        <span className="text-[10px] text-muted-foreground/70 mt-1 block">
          {formatTimestamp(chat.timestamp)}
        </span>
      </div>

      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute right-2 top-2 flex items-center gap-1"
          >
            <button
              onClick={(e) => { e.stopPropagation(); }}
              className="p-1.5 rounded-md hover:bg-background/80 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <FiMoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ChatSidebar = ({ isOpen, onToggle, selectedChat, onSelectChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [chatHistory] = useState(mockChatHistory);

  const filteredChats = chatHistory.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayChats = filteredChats.filter(chat => {
    const today = new Date();
    return chat.timestamp.toDateString() === today.toDateString();
  });

  const olderChats = filteredChats.filter(chat => {
    const today = new Date();
    return chat.timestamp.toDateString() !== today.toDateString();
  });

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 300, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="flex-shrink-0 h-full border-r border-border bg-clipfox-surface dark:bg-card overflow-hidden"
        >
          <div className="flex flex-col h-full w-[300px]">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold font-heading text-foreground">
                  Chat History
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <FiPlus className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background dark:bg-white/5 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
              {/* Today Section */}
              {todayChats.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <FiClock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Today
                    </span>
                  </div>
                  <div className="space-y-1">
                    {todayChats.map(chat => (
                      <ChatHistoryItem
                        key={chat.id}
                        chat={chat}
                        isSelected={selectedChat === chat.id}
                        onSelect={onSelectChat}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Previous Section */}
              {olderChats.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <FiFolder className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Previous
                    </span>
                  </div>
                  <div className="space-y-1">
                    {olderChats.map(chat => (
                      <ChatHistoryItem
                        key={chat.id}
                        chat={chat}
                        isSelected={selectedChat === chat.id}
                        onSelect={onSelectChat}
                      />
                    ))}
                  </div>
                </div>
              )}

              {filteredChats.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                    <FiMessageSquare className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No conversations found</p>
                </div>
              )}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default ChatSidebar;
