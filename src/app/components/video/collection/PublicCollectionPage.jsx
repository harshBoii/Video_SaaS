// app/share/collection/[id]/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Play, Lock, Loader2, Calendar, User, AlertCircle } from 'lucide-react';
import PublicVideoPlayer from '@/components/PublicVideoPlayer';
import Swal from 'sweetalert2';

export default function PublicCollectionPage({collectionId}) {
  const params = useParams();
  const searchParams = useSearchParams();
  const collectionId = params.id;

  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    fetchCollection();
  }, [collectionId]);

  const fetchCollection = async (pwd = null) => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL(`/api/collections/${collectionId}`, window.location.origin);
      if (pwd) url.searchParams.set('password', pwd);

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 && data.message === 'Password required') {
          setShowPasswordModal(true);
          setLoading(false);
          return;
        }
        throw new Error(data.message || 'Failed to load collection');
      }

      setCollection(data.data);
      setShowPasswordModal(false);
    } catch (err) {
      setError(err.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message,
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!password.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Password Required',
        text: 'Please enter the password',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }
    fetchCollection(password);
  };

  const handleVideoClick = (video) => {
    setSelectedVideo(video);
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading collection...</p>
        </div>
      </div>
    );
  }

  // Password Modal
  if (showPasswordModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Password Protected</h2>
          <p className="text-center text-gray-600 mb-8">Enter password to view this collection</p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-0 transition-colors"
              autoFocus
            />

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
            >
              Unlock Collection
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Collection</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Video Player View
  if (selectedVideo) {
    return (
      <div className="h-screen">
        <PublicVideoPlayer
          video={selectedVideo}
          allowDownload={collection.allowDownload}
          allowComments={collection.allowComments}
          shareId={collectionId}
        />
        <button
          onClick={() => setSelectedVideo(null)}
          className="fixed top-4 left-4 z-50 px-4 py-2 bg-white/90 hover:bg-white backdrop-blur-sm text-gray-900 rounded-lg shadow-lg font-medium transition-colors"
        >
          ← Back to Collection
        </button>
      </div>
    );
  }

  // Collection Grid View
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{collection.name}</h1>
            
            {collection.description && (
              <p className="text-gray-600 text-lg mb-6">{collection.description}</p>
            )}

            <div className="flex flex-wrap gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Shared by {collection.createdBy}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(collection.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                <span>{collection.videos.length} video{collection.videos.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collection.videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              onClick={() => handleVideoClick(video)}
              className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer group border border-gray-100 hover:border-blue-300 transition-all"
            >
              <div className="relative aspect-video bg-gray-900">
                <img
                  src={video.thumbnailUrl || '/placeholder.png'}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-blue-600 ml-1" />
                  </div>
                </div>
                {video.duration && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs rounded">
                    {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{video.title}</h3>
                {video.resolution && (
                  <p className="text-xs text-gray-500">{video.resolution}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Powered By Footer */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            Powered by <span className="font-semibold text-blue-600">CreateOS</span>
          </p>
        </div>
      </div>
    </div>
  );
}
