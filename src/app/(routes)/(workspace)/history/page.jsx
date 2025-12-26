'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, FiFilter, FiTrash2, FiMoreVertical,
  FiMessageSquare, FiImage, FiVideo, FiClock,
  FiStar, FiArchive, FiChevronDown, FiGrid,
  FiList, FiCalendar, FiTag, FiHome, FiChevronRight
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';

export default function HistoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | brainstorm | images | videos
  const [sortBy, setSortBy] = useState('recent'); // recent | name | modified
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [selectedItems, setSelectedItems] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Sample history data
  const [sessions] = useState([
    {
      id: '1',
      type: 'brainstorm',
      title: 'Q4 Marketing Campaign Strategy',
      preview: 'Exploring viral marketing strategies for Gen Z audience...',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      starred: true,
      tags: ['marketing', 'strategy']
    },
    {
      id: '2',
      type: 'images',
      title: 'Product Launch Visuals',
      preview: 'https://via.placeholder.com/400x300',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      starred: false,
      tags: ['design', 'product']
    },
    {
      id: '3',
      type: 'videos',
      title: 'Social Media Ad - 15s',
      preview: 'Cinematic product reveal with dramatic lighting...',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      starred: false,
      tags: ['video', 'ad']
    },
    {
      id: '4',
      type: 'brainstorm',
      title: 'Content Calendar Planning',
      preview: 'Monthly content themes and posting schedule...',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
      starred: true,
      tags: ['content', 'planning']
    },
    {
      id: '5',
      type: 'images',
      title: 'Instagram Story Templates',
      preview: 'https://via.placeholder.com/400x300',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
      starred: false,
      tags: ['social', 'templates']
    }
  ]);

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.preview.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || session.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type) => {
    switch(type) {
      case 'brainstorm': return FiMessageSquare;
      case 'images': return FiImage;
      case 'videos': return FiVideo;
      default: return FiMessageSquare;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'brainstorm': return 'from-blue-500 to-cyan-600';
      case 'images': return 'from-violet-500 to-purple-600';
      case 'videos': return 'from-orange-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const formatTimestamp = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleSessionClick = (session) => {
    const routeMap = {
      brainstorm: 'chat',
      images: 'design',
      videos: 'video'
    };
    router.push(`/${routeMap[session.type]}/${session.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button 
              onClick={() => router.push('/')}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <FiHome className="w-4 h-4" />
              Home
            </button>
            <FiChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">History</span>
          </div>
        </motion.div>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">History</h1>
          <p className="text-muted-foreground">Your creative sessions and projects</p>
        </motion.div>

        {/* Controls Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your history..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-[var(--glass-border)] 
                         bg-[var(--glass-hover)] text-foreground placeholder:text-muted-foreground 
                         focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'brainstorm', label: 'Brainstorm', icon: FiMessageSquare },
                { id: 'images', label: 'Images', icon: FiImage },
                { id: 'videos', label: 'Videos', icon: FiVideo }
              ].map((filter) => (
                <motion.button
                  key={filter.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFilterType(filter.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                    ${filterType === filter.id 
                      ? 'bg-primary text-primary-foreground shadow-lg' 
                      : 'bg-[var(--glass-hover)] text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {filter.icon && <filter.icon className="inline w-4 h-4 mr-1" />}
                  {filter.label}
                </motion.button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 px-1 py-1 rounded-lg bg-[var(--glass-hover)]">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-all
                  ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
              >
                <FiGrid className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-all
                  ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
              >
                <FiList className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Sort */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--glass-hover)] 
                       hover:bg-primary/10 transition-colors text-sm"
            >
              <FiFilter className="w-4 h-4" />
              Sort
              <FiChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-[var(--glass-border)] overflow-hidden"
              >
                <div className="flex flex-wrap gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[var(--glass-border)] 
                             bg-[var(--glass-hover)] text-sm focus:outline-none"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="name">Name</option>
                    <option value="modified">Last Modified</option>
                  </select>

                  <button className="px-3 py-2 rounded-lg bg-[var(--glass-hover)] text-sm 
                                   hover:bg-primary/10 transition-colors">
                    <FiStar className="inline w-4 h-4 mr-1" />
                    Starred Only
                  </button>

                  <button className="px-3 py-2 rounded-lg bg-[var(--glass-hover)] text-sm 
                                   hover:bg-primary/10 transition-colors">
                    <FiCalendar className="inline w-4 h-4 mr-1" />
                    This Week
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Sessions Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredSessions.map((session, index) => {
                const TypeIcon = getTypeIcon(session.type);
                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                    onClick={() => handleSessionClick(session)}
                    className="glass-card p-4 cursor-pointer hover:shadow-xl transition-all group"
                  >
                    {/* Preview */}
                    <div className={`aspect-video rounded-lg mb-3 overflow-hidden relative
                                   bg-gradient-to-br ${getTypeColor(session.type)}`}>
                      {session.type === 'images' ? (
                        <img src={session.preview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <TypeIcon className="w-12 h-12 text-white/80" />
                        </div>
                      )}
                      
                      {/* Type Badge */}
                      <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/50 
                                    backdrop-blur-sm text-white text-xs font-medium">
                        {session.type}
                      </div>

                      {/* Star */}
                      {session.starred && (
                        <div className="absolute top-2 right-2">
                          <FiStar className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <h3 className="font-semibold text-foreground mb-1 truncate 
                                 group-hover:text-primary transition-colors">
                      {session.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {session.type !== 'images' && session.preview}
                    </p>
                    
                    {/* Meta */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        <FiClock className="inline w-3 h-3 mr-1" />
                        {formatTimestamp(session.timestamp)}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle more options
                        }}
                        className="p-1 rounded hover:bg-[var(--glass-hover)] transition-colors"
                      >
                        <FiMoreVertical className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          // List View
          <div className="space-y-2">
            <AnimatePresence>
              {filteredSessions.map((session, index) => {
                const TypeIcon = getTypeIcon(session.type);
                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                    onClick={() => handleSessionClick(session)}
                    className="glass-card p-4 cursor-pointer hover:shadow-lg transition-all flex items-center gap-4"
                  >
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getTypeColor(session.type)} 
                                   flex items-center justify-center flex-shrink-0`}>
                      <TypeIcon className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{session.title}</h3>
                        {session.starred && <FiStar className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {session.type !== 'images' && session.preview}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{formatTimestamp(session.timestamp)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle more options
                        }}
                        className="p-1 rounded hover:bg-[var(--glass-hover)] transition-colors"
                      >
                        <FiMoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {filteredSessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <HiSparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No sessions found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/')}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-violet-500 
                       text-primary-foreground font-medium shadow-lg"
            >
              Create New Session
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
