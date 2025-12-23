'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowRight,
  FiArrowLeft,
  FiMoreVertical,
  FiShare2,
  FiStar,
  FiClock,
  FiUsers,
  FiMessageSquare,
  FiLock,
  FiGlobe,
  FiChevronDown,
  
} from 'react-icons/fi';

import DocsSidebar from './components/DocsSidebar';
import DocumentEditor from './components/DocumentEditor';

// Mock document data
const mockDocument = {
  id: 'doc-1',
  title: 'Campaign Brief - Summer 2024',
  icon: '📋',
  starred: true,
  visibility: 'team',
  lastEdited: new Date(),
  editedBy: 'John Doe',
  collaborators: [
    { id: '1', name: 'John Doe', avatar: null },
    { id: '2', name: 'Jane Smith', avatar: null },
    { id: '3', name: 'Mike Johnson', avatar: null },
  ],
  blocks: [
    { id: '1', type: 'heading1', content: 'Summer 2024 Campaign' },
    { id: '2', type: 'paragraph', content: 'This document outlines the strategy and creative direction for our upcoming summer marketing campaign.' },
    { id: '3', type: 'heading2', content: 'Campaign Objectives' },
    { id: '4', type: 'bullet', content: 'Increase brand awareness by 25%' },
    { id: '5', type: 'bullet', content: 'Drive 50,000 new website visits' },
    { id: '6', type: 'bullet', content: 'Generate 5,000 qualified leads' },
    { id: '7', type: 'heading2', content: 'Target Audience' },
    { id: '8', type: 'paragraph', content: 'Our primary audience for this campaign consists of millennials and Gen Z consumers aged 18-35 who are interested in lifestyle products and sustainable brands.' },
    { id: '9', type: 'heading2', content: 'Key Messages' },
    { id: '10', type: 'todo', content: 'Draft main campaign tagline', checked: true },
    { id: '11', type: 'todo', content: 'Create supporting copy variations', checked: false },
    { id: '12', type: 'todo', content: 'Review with creative team', checked: false },
  ],
};

const EmptyState = ({ onCreateDoc }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center h-full px-4"
  >
    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-clipfox-accent/20 flex items-center justify-center mb-6">
      <span className="text-5xl">📝</span>
    </div>
    <h2 className="text-2xl font-heading font-semibold text-foreground mb-2">
      No document selected
    </h2>
    <p className="text-muted-foreground text-center max-w-md mb-8">
      Select a document from the sidebar or create a new one to get started.
    </p>
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onCreateDoc}
      className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
    >
      Create New Document
    </motion.button>
  </motion.div>
);

const CollaboratorAvatars = ({ collaborators }) => (
  <div className="flex items-center -space-x-2">
    {collaborators.slice(0, 3).map((collab, index) => (
      <div
        key={collab.id}
        className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-clipfox-accent flex items-center justify-center text-white text-xs font-medium border-2 border-background"
        title={collab.name}
      >
        {collab.name.charAt(0)}
      </div>
    ))}
    {collaborators.length > 3 && (
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium border-2 border-background">
        +{collaborators.length - 3}
      </div>
    )}
  </div>
);

const VisibilityBadge = ({ visibility }) => {
  const config = {
    public: { icon: FiGlobe, label: 'Public', color: 'text-green-600' },
    team: { icon: FiUsers, label: 'Team', color: 'text-blue-600' },
    private: { icon: FiLock, label: 'Private', color: 'text-orange-600' },
  };

  const { icon: Icon, label, color } = config[visibility] || config.private;

  return (
    <button className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      <span className="text-xs font-medium">{label}</span>
      <FiChevronDown className="w-3 h-3" />
    </button>
  );
};

export default function Docs() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState('doc-1');
  const [currentDocument, setCurrentDocument] = useState(mockDocument);

  const formatLastEdited = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleCreateDoc = () => {
    const newDoc = {
      id: Date.now().toString(),
      title: 'Untitled',
      icon: '📄',
      starred: false,
      visibility: 'private',
      lastEdited: new Date(),
      editedBy: 'You',
      collaborators: [],
      blocks: [
        { id: '1', type: 'heading1', content: '' },
        { id: '2', type: 'paragraph', content: '' },
      ],
    };
    setCurrentDocument(newDoc);
    setSelectedDoc(newDoc.id);
  };

  const handleSelectDoc = (docId) => {
    setSelectedDoc(docId);
    // In a real app, this would fetch the document from the server
    if (docId === 'doc-1') {
      setCurrentDocument(mockDocument);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Docs Sidebar */}
      <DocsSidebar
        isOpen={sidebarOpen}
        selectedDoc={selectedDoc}
        onSelectDoc={handleSelectDoc}
        onCreateDoc={handleCreateDoc}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {selectedDoc && currentDocument ? (
          <>
            {/* Document Header */}
            <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-background/80 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {sidebarOpen ? (
                    <FiArrowRight className="w-5 h-5" />
                  ) : (
                    <FiArrowLeft className="w-5 h-5" />
                  )}
                </motion.button>

                {/* Document Info */}
                <div className="flex items-center gap-3">
                  <span className="text-xl">{currentDocument.icon}</span>
                  <div>
                    <h1 className="text-sm font-semibold text-foreground truncate max-w-[200px] md:max-w-none">
                      {currentDocument.title}
                    </h1>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FiClock className="w-3 h-3" />
                      <span>Edited {formatLastEdited(currentDocument.lastEdited)}</span>
                      <span>by {currentDocument.editedBy}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Collaborators */}
                {currentDocument.collaborators.length > 0 && (
                  <CollaboratorAvatars collaborators={currentDocument.collaborators} />
                )}

                {/* Visibility */}
                <VisibilityBadge visibility={currentDocument.visibility} />

                {/* Star */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-2 rounded-lg transition-colors ${
                    currentDocument.starred
                      ? 'text-yellow-500'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <FiStar className={`w-5 h-5 ${currentDocument.starred ? 'fill-yellow-500' : ''}`} />
                </motion.button>

                {/* Share */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <FiShare2 className="w-4 h-4" />
                  <span className="text-sm font-medium hidden md:inline">Share</span>
                </motion.button>

                {/* More Options */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <FiMoreVertical className="w-5 h-5" />
                </motion.button>
              </div>
            </header>

            {/* Document Editor */}
            <DocumentEditor
              document={currentDocument}
              onChange={(updatedDoc) => setCurrentDocument(updatedDoc)}
            />
          </>
        ) : (
          <>
            {/* Header when no doc selected */}
            <header className="flex items-center px-4 md:px-6 py-3 border-b border-border bg-background/80 backdrop-blur-xl">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {sidebarOpen ? (
                  <FiArrowRight className="w-5 h-5" />
                ) : (
                  <FiArrowLeft className="w-5 h-5" />
                )}
              </motion.button>
            </header>

            <EmptyState onCreateDoc={handleCreateDoc} />
          </>
        )}
      </div>
    </div>
  );
}
