'use client';
import { useState, useEffect } from 'react';
import { Save, X, Clock, List, Edit3, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showSuccess, showError } from '@/app/lib/swal';

export default function DescriptionEditor({ videoId, onSeek, currentTime }) {
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [activeChapter, setActiveChapter] = useState(null);

  useEffect(() => {
    loadDescription();
  }, [videoId]);

  const loadDescription = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/description`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setContent(data.description.content || '');
        setChapters(data.description.chapters || []);
      }
    } catch (error) {
      console.error('Failed to load description:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      if (data.success) {
        setChapters(data.description.chapters || []);
        setIsEditing(false);
        showSuccess('Saved', 'Description updated successfully');
      }
    } catch (error) {
      showError('Error', 'Failed to save description');
    } finally {
      setSaving(false);
    }
  };

  const insertTimestamp = () => {
    const m = Math.floor(currentTime / 60);
    const s = Math.floor(currentTime % 60).toString().padStart(2, '0');
    const timestamp = `[${m}:${s}] `;
    setContent(prev => prev + (prev.endsWith('\n') ? '' : '\n') + timestamp);
  };

  const renderContent = (text) => {
    const timestampRegex = /\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/g;
    const parts = text.split(timestampRegex);
    
    return parts.map((part, i) => {
      if (part && part.match(/^\d{1,2}$/)) {
        const nextPart = parts[i + 1];
        if (nextPart && nextPart.match(/^\d{2}$/)) {
          const minutes = parseInt(part);
          const seconds = parseInt(nextPart);
          const totalSeconds = minutes * 60 + seconds;
          
          return (
            <motion.button
              key={i}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSeek(totalSeconds)}
              className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors"
            >
              <Clock className="w-3 h-3" />
              [{part}:{nextPart}]
            </motion.button>
          );
        }
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-8 text-center"
      >
        <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm mt-3">Loading description...</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-t border-gray-200"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
        <motion.h3 
          layout
          className="font-semibold text-gray-900 flex items-center gap-2"
        >
          <motion.div
            animate={{ rotate: isEditing ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isEditing ? <Edit3 className="w-4 h-4 text-blue-600" /> : <FileText className="w-4 h-4 text-gray-500" />}
          </motion.div>
          Description & Chapters
          {chapters.length > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium"
            >
              {chapters.length}
            </motion.span>
          )}
        </motion.h3>
        
        <AnimatePresence mode="wait">
          {!isEditing ? (
            <motion.button
              key="edit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </motion.button>
          ) : (
            <motion.div 
              key="actions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex gap-2"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsEditing(false);
                  loadDescription();
                }}
                className="text-sm text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all font-medium shadow-sm"
              >
                {saving ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="editor"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-900 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    How to add chapters
                  </p>
                <p className="text-xs text-blue-700">
                Use format:{" "}
                <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-blue-900">
                    [0:00] Chapter Title
                </code>
                </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={insertTimestamp}
                  className="flex items-center gap-1.5 text-xs bg-white text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors font-medium shadow-sm border border-blue-200"
                >
                  <Clock className="w-3 h-3" />
                  Insert {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}
                </motion.button>
              </div>
            </motion.div>

            <motion.textarea
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add video description and chapters here...&#10;&#10;Example:&#10;[0:00] Introduction&#10;[1:30] Main Topic&#10;[5:45] Conclusion&#10;&#10;You can add regular text between chapters too!"
              className="w-full h-64 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none resize-none text-sm font-mono leading-relaxed shadow-inner bg-gray-50 focus:bg-white transition-all"
            />
          </motion.div>
        ) : (
          <motion.div
            key="viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {/* Chapters */}
            {chapters.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border-b border-gray-100 bg-gradient-to-b from-blue-50/50 to-white"
              >
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                  <List className="w-3 h-3" />
                  Chapters ({chapters.length})
                </h4>
                <div className="space-y-1">
                  <AnimatePresence>
                    {chapters.map((chapter, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setActiveChapter(idx);
                          onSeek(chapter.time);
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left group ${
                          activeChapter === idx 
                            ? 'bg-blue-100 border border-blue-200' 
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <motion.div 
                          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            activeChapter === idx 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-200 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                          }`}
                          animate={activeChapter === idx ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          {idx + 1}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-xs font-mono font-semibold ${
                              activeChapter === idx ? 'text-blue-700' : 'text-blue-600'
                            }`}>
                              {chapter.timestamp}
                            </span>
                          </div>
                          <span className={`text-sm font-medium line-clamp-1 ${
                            activeChapter === idx ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {chapter.title}
                          </span>
                        </div>
                        <Clock className={`w-4 h-4 flex-shrink-0 transition-opacity ${
                          activeChapter === idx ? 'text-blue-600 opacity-100' : 'text-gray-400 opacity-0 group-hover:opacity-100'
                        }`} />
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* Full Description */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="p-4"
            >
              {content ? (
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {renderContent(content)}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-400 mb-3">No description yet</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors font-medium"
                  >
                    Add description and chapters
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
