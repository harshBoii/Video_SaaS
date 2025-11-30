'use client';
import { useState, useEffect } from 'react';
import { List, Clock, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DescriptionViewer({ videoId, onSeek }) {
  const [content, setContent] = useState('');
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChapter, setActiveChapter] = useState(null);

  useEffect(() => {
    loadDescription();
  }, [videoId]);

  const loadDescription = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/description`);
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

  // ✅ Show empty state instead of returning null
  if (!content && chapters.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-t border-gray-200"
      >
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            Description & Chapters
          </h3>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 text-center"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 font-medium mb-1">No description available</p>
          <p className="text-xs text-gray-400">Description and chapters will appear here</p>
        </motion.div>
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
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <motion.h3 
          className="font-semibold text-gray-900 flex items-center gap-2"
        >
          <FileText className="w-4 h-4 text-gray-500" />
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
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
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
        {content && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="p-4"
          >
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {renderContent(content)}
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
