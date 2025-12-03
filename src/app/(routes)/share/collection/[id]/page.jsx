'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Share2, Download, MessageSquare, Clock, Eye, Users 
} from 'lucide-react';

export default function PublicCollectionPage({ params }) {
  const { id: collectionId } = params;
  
  const [collectionData, setCollectionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCollection();
  }, [collectionId]);

  const fetchCollection = async () => {
    try {
      const res = await fetch(`/api/public/collection/${collectionId}`);
      const data = await res.json();
      
      if (data.success) {
        setCollectionData(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.4, ease: 'easeOut' }
    },
    hover: { 
      y: -8, 
      scale: 1.02,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
      transition: { duration: 0.2 }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md text-center"
        >
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Play className="w-10 h-10 text-red-500 rotate-90" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Collection Not Found</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Glass Header */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/90 backdrop-blur-xl border-b border-slate-200/50 shadow-xl sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-slate-900 bg-clip-text text-transparent mb-3 leading-tight">
                {collectionData.collection.name}
              </h1>
              {collectionData.collection.description && (
                <p className="text-xl text-slate-600 font-medium max-w-2xl">
                  {collectionData.collection.description}
                </p>
              )}
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-6 text-sm font-semibold"
            >
              <div className="flex items-center gap-2 text-indigo-600 bg-indigo-100 px-4 py-2 rounded-2xl">
                <Users className="w-4 h-4" />
                <span>{collectionData.videoShares.length} videos</span>
              </div>
              {collectionData.collection.allowComments && (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-100 px-4 py-2 rounded-2xl">
                  <MessageSquare className="w-4 h-4" />
                  <span>Comments enabled</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8 pt-12"
        >
          {collectionData.videoShares.map((videoShare, index) => (
            <motion.div
              key={videoShare.videoId}
              variants={itemVariants}
              whileHover="hover"
              className="group"
            >
              <motion.a
                href={`/watch/${videoShare.shareId}`}
                className="block bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl border border-slate-200/50 transition-all duration-500 group-hover:-translate-y-2"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                  {videoShare.video.thumbnailUrl ? (
                    <motion.img
                      src={videoShare.video.thumbnailUrl}
                      alt={videoShare.video.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      whileHover={{ scale: 1.1 }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                      <Play className="w-20 h-20 text-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-4" />
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                  >
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl px-6 py-3 shadow-2xl w-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Play className="w-6 h-6 text-indigo-600" />
                          <span className="font-bold text-gray-900 text-lg">Watch Video</span>
                        </div>
                        {collectionData.collection.allowDownload && (
                          <Download className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Content */}
                <div className="p-8">
                  <motion.h3 
                    className="text-xl font-bold text-gray-900 line-clamp-2 mb-4 leading-tight group-hover:text-indigo-600 transition-colors"
                    whileHover={{ color: '#4f46e5' }}
                  >
                    {videoShare.video.title}
                  </motion.h3>
                  
                  <div className="flex items-center gap-6 text-sm text-slate-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(videoShare.video.duration)}</span>
                    </div>
                    {collectionData.collection.allowComments && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>Comments</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Views</span>
                      </div>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="text-indigo-600 font-semibold text-sm hover:text-indigo-700 transition-colors"
                    >
                      Watch Now →
                    </motion.div>
                  </div>
                </div>
              </motion.a>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Stats Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-6 py-12 text-center"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/50 shadow-xl">
            <div className="text-3xl font-black text-indigo-600 mb-3">
              {collectionData.videoShares.length}
            </div>
            <div className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Videos
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/50 shadow-xl">
            <div className="text-3xl font-black text-emerald-600 mb-3">
              {collectionData.collection.allowComments ? 'Enabled' : 'Disabled'}
            </div>
            <div className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Comments
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/50 shadow-xl">
            <div className="text-3xl font-black text-amber-600 mb-3">
              {collectionData.collection.allowDownload ? 'Enabled' : 'Disabled'}
            </div>
            <div className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Downloads
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
