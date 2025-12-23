'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiPlus,
  FiFile,
  FiFileText,
  FiFolder,
  FiChevronRight,
  FiMoreHorizontal,
  FiTrash2,
  FiCopy,
  FiStar,
  FiClock,
  FiHash,
  FiImage,
  FiVideo,
  FiLink,
} from 'react-icons/fi';

// Mock docs data
const mockDocs = [
  {
    id: 'doc-1',
    title: 'Campaign Brief - Summer 2024',
    icon: '📋',
    type: 'document',
    updatedAt: new Date(),
    starred: true,
    campaign: 'Summer 2024',
  },
  {
    id: 'doc-2',
    title: 'Video Script - Product Launch',
    icon: '🎬',
    type: 'document',
    updatedAt: new Date(Date.now() - 3600000),
    starred: false,
    campaign: 'Product Launch Q1',
  },
  {
    id: 'doc-3',
    title: 'Brand Guidelines',
    icon: '🎨',
    type: 'document',
    updatedAt: new Date(Date.now() - 86400000),
    starred: true,
  },
  {
    id: 'doc-4',
    title: 'Social Media Calendar',
    icon: '📅',
    type: 'document',
    updatedAt: new Date(Date.now() - 172800000),
    starred: false,
  },
  {
    id: 'doc-5',
    title: 'Meeting Notes - Q4 Planning',
    icon: '📝',
    type: 'document',
    updatedAt: new Date(Date.now() - 259200000),
    starred: false,
  },
  {
    id: 'doc-6',
    title: 'Content Ideas Bank',
    icon: '💡',
    type: 'document',
    updatedAt: new Date(Date.now() - 345600000),
    starred: true,
  },
];

const mockFolders = [
  {
    id: 'folder-1',
    name: 'Campaigns',
    icon: '📁',
    docs: ['doc-1', 'doc-2'],
    expanded: true,
  },
  {
    id: 'folder-2',
    name: 'Templates',
    icon: '📁',
    docs: [],
    expanded: false,
  },
];

const formatDate = (date) => {
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

const DocItem = ({ doc, isSelected, onSelect }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(doc.id)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`
        relative group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
        transition-all duration-200
        ${isSelected
          ? 'bg-primary/10 dark:bg-primary/20 border border-primary/20'
          : 'hover:bg-clipfox-surface-hover dark:hover:bg-white/5 border border-transparent'
        }
      `}
    >
      <span className="text-base flex-shrink-0">{doc.icon}</span>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-foreground truncate">
            {doc.title}
          </h4>
          {doc.starred && (
            <FiStar className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">
          {formatDate(doc.updatedAt)}
        </span>
      </div>

      <AnimatePresence>
        {showActions && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); }}
            className="absolute right-2 p-1.5 rounded-md hover:bg-background/80 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
          >
            <FiMoreHorizontal className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FolderItem = ({ folder, docs, selectedDoc, onSelectDoc }) => {
  const [isExpanded, setIsExpanded] = useState(folder.expanded);
  const folderDocs = docs.filter(doc => folder.docs.includes(doc.id));

  return (
    <div className="mb-1">
      <motion.div
        whileHover={{ x: 2 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground hover:bg-clipfox-surface-hover dark:hover:bg-white/5 transition-colors"
      >
        <motion.span
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center justify-center w-4 h-4"
        >
          <FiChevronRight className="w-3.5 h-3.5" />
        </motion.span>
        <FiFolder className="w-4 h-4" />
        <span className="text-sm font-medium flex-1">{folder.name}</span>
        <span className="text-xs text-muted-foreground">{folderDocs.length}</span>
      </motion.div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden ml-4"
          >
            <div className="space-y-0.5 py-1">
              {folderDocs.map(doc => (
                <DocItem
                  key={doc.id}
                  doc={doc}
                  isSelected={selectedDoc === doc.id}
                  onSelect={onSelectDoc}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const QuickActions = () => (
  <div className="space-y-1">
    <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      Quick Actions
    </p>
    {[
      { icon: FiFileText, label: 'New Document', shortcut: '⌘N' },
      { icon: FiImage, label: 'Import Image', shortcut: null },
      { icon: FiLink, label: 'Add Link', shortcut: null },
    ].map((action, index) => (
      <motion.button
        key={index}
        whileHover={{ x: 2 }}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-clipfox-surface-hover dark:hover:bg-white/5 transition-colors"
      >
        <action.icon className="w-4 h-4" />
        <span className="text-sm flex-1 text-left">{action.label}</span>
        {action.shortcut && (
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{action.shortcut}</span>
        )}
      </motion.button>
    ))}
  </div>
);

const DocsSidebar = ({ isOpen, selectedDoc, onSelectDoc, onCreateDoc }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [docs] = useState(mockDocs);
  const [folders] = useState(mockFolders);

  const filteredDocs = docs.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const starredDocs = filteredDocs.filter(doc => doc.starred);
  const recentDocs = filteredDocs
    .filter(doc => !doc.starred)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="flex-shrink-0 h-full border-r border-border bg-clipfox-surface dark:bg-card overflow-hidden"
        >
          <div className="flex flex-col h-full w-[280px]">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold font-heading text-foreground">
                  Documents
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onCreateDoc}
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
                  placeholder="Search docs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background dark:bg-white/5 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Docs List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
              {/* Starred Section */}
              {starredDocs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <FiStar className="w-3.5 h-3.5 text-yellow-500" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Starred
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {starredDocs.map(doc => (
                      <DocItem
                        key={doc.id}
                        doc={doc}
                        isSelected={selectedDoc === doc.id}
                        onSelect={onSelectDoc}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Section */}
              {recentDocs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <FiClock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Recent
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {recentDocs.map(doc => (
                      <DocItem
                        key={doc.id}
                        doc={doc}
                        isSelected={selectedDoc === doc.id}
                        onSelect={onSelectDoc}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Folders Section */}
              <div>
                <div className="flex items-center gap-2 px-2 mb-2">
                  <FiFolder className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Folders
                  </span>
                </div>
                {folders.map(folder => (
                  <FolderItem
                    key={folder.id}
                    folder={folder}
                    docs={docs}
                    selectedDoc={selectedDoc}
                    onSelectDoc={onSelectDoc}
                  />
                ))}
              </div>

              {filteredDocs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                    <FiFileText className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No documents found</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="p-3 border-t border-border">
              <QuickActions />
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default DocsSidebar;
