'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  FiPlus, FiSearch, FiGrid, FiList, FiFilter,
  FiMoreVertical, FiClock, FiStar, FiTrash2,
  FiEdit2, FiCopy, FiDownload, FiArrowLeft
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { v4 as uuidv4 } from 'uuid';

export default function DesignHub() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [filterType, setFilterType] = useState('all');

  // Sample designs data
  const [designs] = useState([
    {
      id: '1',
      title: 'Product Launch Banner',
      thumbnail: 'https://via.placeholder.com/400x300',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      starred: true,
      size: '1920x1080'
    },
    {
      id: '2',
      title: 'Social Media Post',
      thumbnail: 'https://via.placeholder.com/400x300',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      starred: false,
      size: '1080x1080'
    },
    {
      id: '3',
      title: 'Instagram Story',
      thumbnail: 'https://via.placeholder.com/400x300',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      starred: false,
      size: '1080x1920'
    }
  ]);

  const filteredDesigns = designs.filter(design =>
    design.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const handleCreateNew = () => {
    const newId = uuidv4();
    router.push(`/design/${newId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="glass-card border-b border-[var(--glass-border)] p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/')}
              className="p-2 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Design Studio</h1>
              <p className="text-xs text-muted-foreground">Create and manage your designs</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/history')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--glass-hover)] transition-colors text-sm"
            >
              <FiClock className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-violet-500 
                       text-primary-foreground text-sm font-medium shadow-lg"
            >
              <FiPlus className="w-4 h-4" />
              New Design
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Controls Bar */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search designs..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-[var(--glass-border)] 
                         bg-[var(--glass-hover)] text-foreground placeholder:text-muted-foreground 
                         focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
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

            {/* Filter */}
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--glass-hover)] 
                             hover:bg-primary/10 transition-colors text-sm">
              <FiFilter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        {/* Designs Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDesigns.map((design, index) => (
              <motion.div
                key={design.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                onClick={() => router.push(`/design/${design.id}`)}
                className="glass-card p-4 cursor-pointer hover:shadow-xl transition-all group"
              >
                {/* Thumbnail */}
                <div className="aspect-video rounded-lg mb-3 overflow-hidden relative bg-gradient-to-br from-violet-500/20 to-purple-600/20">
                  <img src={design.thumbnail} alt="" className="w-full h-full object-cover" />
                  
                  {/* Star */}
                  {design.starred && (
                    <div className="absolute top-2 right-2">
                      <FiStar className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    </div>
                  )}

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 
                                transition-opacity flex items-center justify-center gap-2">
                    <button className="p-2 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30">
                      <FiEdit2 className="w-4 h-4 text-white" />
                    </button>
                    <button className="p-2 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30">
                      <FiCopy className="w-4 h-4 text-white" />
                    </button>
                    <button className="p-2 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30">
                      <FiDownload className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <h3 className="font-semibold text-foreground mb-1 truncate group-hover:text-primary transition-colors">
                  {design.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{design.size}</span>
                  <span className="flex items-center gap-1">
                    <FiClock className="w-3 h-3" />
                    {formatTimestamp(design.timestamp)}
                  </span>
                </div>
              </motion.div>
            ))}

            {/* Create New Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: filteredDesigns.length * 0.05 }}
              whileHover={{ y: -4 }}
              onClick={handleCreateNew}
              className="glass-card p-4 cursor-pointer hover:shadow-xl transition-all 
                       border-2 border-dashed border-[var(--glass-border)] hover:border-primary/50
                       flex flex-col items-center justify-center min-h-[200px]"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <FiPlus className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Create New Design</h3>
              <p className="text-xs text-muted-foreground text-center">
                Start with a blank canvas
              </p>
            </motion.div>
          </div>
        ) : (
          // List View
          <div className="space-y-2">
            {filteredDesigns.map((design, index) => (
              <motion.div
                key={design.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 4 }}
                onClick={() => router.push(`/design/${design.id}`)}
                className="glass-card p-4 cursor-pointer hover:shadow-lg transition-all flex items-center gap-4"
              >
                <div className="w-20 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex-shrink-0">
                  <img src={design.thumbnail} alt="" className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">{design.title}</h3>
                    {design.starred && <FiStar className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{design.size}</p>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{formatTimestamp(design.timestamp)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="p-1 rounded hover:bg-[var(--glass-hover)] transition-colors"
                  >
                    <FiMoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredDesigns.length === 0 && (
          <div className="text-center py-16">
            <HiSparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No designs found</h3>
            <p className="text-muted-foreground mb-4">Create your first design to get started</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateNew}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-violet-500 
                       text-primary-foreground font-medium shadow-lg"
            >
              Create New Design
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
