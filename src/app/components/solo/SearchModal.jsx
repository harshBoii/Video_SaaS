'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Video, Folder, Eye, MessageSquare, Clock, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SearchModal({ onClose }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'videos', 'projects'
  const [results, setResults] = useState({ videos: [], projects: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults({ videos: [], projects: [], total: 0 });
      setSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      performSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [query, activeTab]);

  const performSearch = async () => {
    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&type=${activeTab}&limit=20`,
        { credentials: 'include' }
      );

      const data = await response.json();

      if (data.success) {
        setResults(data.results);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (item) => {
    if (item.type === 'video') {
      router.push(`/videos/${item.id}`);
    } else {
      router.push(`/projects/${item.id}`);
    }
    onClose();
  };

  const formatNumber = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          {/* Search Input */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search videos and projects..."
                className="w-full pl-12 pr-12 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#93C572] focus:border-transparent outline-none transition-all"
              />
              <button
                onClick={onClose}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mt-3">
              {['all', 'videos', 'projects'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all capitalize ${
                    activeTab === tab
                      ? 'bg-[#93C572] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[500px] overflow-y-auto">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#93C572] animate-spin" />
              </div>
            )}

            {/* Empty State - No Query */}
            {!loading && !searched && query.length < 2 && (
              <div className="py-12 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Start typing to search...</p>
                <p className="text-sm text-gray-400 mt-1">Minimum 2 characters</p>
              </div>
            )}

            {/* Empty State - No Results */}
            {!loading && searched && results.total === 0 && (
              <div className="py-12 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-900 font-medium">No results found</p>
                <p className="text-sm text-gray-500 mt-1">Try different keywords</p>
              </div>
            )}

            {/* Results */}
            {!loading && results.total > 0 && (
              <div className="p-4 space-y-4">
                {/* Videos Section */}
                {(activeTab === 'all' || activeTab === 'videos') && results.videos.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Videos ({results.videos.length})
                    </h3>
                    <div className="space-y-2">
                      {results.videos.map((video, idx) => (
                        <motion.div
                          key={video.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => handleResultClick(video)}
                          className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group"
                        >
                          {/* Thumbnail */}
                          <div className="w-24 h-14 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            {video.thumbnailUrl ? (
                              <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Video className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 group-hover:text-[#93C572] transition-colors line-clamp-1">
                              {video.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Folder className="w-3 h-3" />
                                {video.projectName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {formatNumber(video.views)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {video.comments}
                              </span>
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="w-8 h-8 bg-[#93C572]/10 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Search className="w-4 h-4 text-[#93C572]" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects Section */}
                {(activeTab === 'all' || activeTab === 'projects') && results.projects.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Projects ({results.projects.length})
                    </h3>
                    <div className="space-y-2">
                      {results.projects.map((project, idx) => (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => handleResultClick(project)}
                          className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group"
                        >
                          {/* Icon */}
                          <div className="w-12 h-12 bg-gradient-to-br from-[#93C572] to-[#7AB55C] rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
                            {project.name.charAt(0).toUpperCase()}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 group-hover:text-[#93C572] transition-colors line-clamp-1">
                              {project.name}
                            </h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span>{project.videoCount} videos</span>
                              <span>•</span>
                              <span>{project.role}</span>
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="w-8 h-8 bg-[#93C572]/10 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Search className="w-4 h-4 text-[#93C572]" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {results.total > 0 && (
            <div className="p-3 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-600">
              Found {results.total} result{results.total !== 1 ? 's' : ''} for "{query}"
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
