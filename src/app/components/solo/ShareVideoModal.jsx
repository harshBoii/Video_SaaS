'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Copy, Check, Lock, Globe, ExternalLink, Loader2 } from 'lucide-react';

export default function ShareVideoModal({ videos, onClose }) {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [accessType, setAccessType] = useState('PUBLIC');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleCreateShareLink = async () => {
    if (!selectedVideo) {
      setError('Please select a video to share');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/videos/${selectedVideo}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          accessType,
          password: accessType === 'PASSWORD' ? password : undefined,
          allowComments: true,
          allowDownload: false
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create share link');
      }

      const link = `${window.location.origin}/public/video/${data.shareId}`;
      setShareLink(link);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#93C572] p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Share Video</h2>
                  <p className="text-sm text-white/80">Create a public link to share</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Video Selection */}
            {!shareLink && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Video
                  </label>
                  <select
                    value={selectedVideo || ''}
                    onChange={(e) => setSelectedVideo(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#93C572] focus:border-transparent outline-none transition-all"
                  >
                    <option value="">Choose a video...</option>
                    {videos.map((video) => (
                      <option key={video.id} value={video.id}>
                        {video.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Access Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Access Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAccessType('PUBLIC')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        accessType === 'PUBLIC'
                          ? 'border-[#93C572] bg-[#93C572]/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Globe className={`w-6 h-6 mx-auto mb-2 ${accessType === 'PUBLIC' ? 'text-[#93C572]' : 'text-gray-400'}`} />
                      <div className="text-sm font-semibold text-gray-900">Public</div>
                      <div className="text-xs text-gray-500 mt-1">Anyone with link</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAccessType('PASSWORD')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        accessType === 'PASSWORD'
                          ? 'border-[#93C572] bg-[#93C572]/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Lock className={`w-6 h-6 mx-auto mb-2 ${accessType === 'PASSWORD' ? 'text-[#93C572]' : 'text-gray-400'}`} />
                      <div className="text-sm font-semibold text-gray-900">Password</div>
                      <div className="text-xs text-gray-500 mt-1">Requires password</div>
                    </button>
                  </div>
                </div>

                {/* Password Field (if PASSWORD selected) */}
                {accessType === 'PASSWORD' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Set Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#93C572] focus:border-transparent outline-none transition-all"
                    />
                  </motion.div>
                )}

                {/* Create Button */}
                <button
                  onClick={handleCreateShareLink}
                  disabled={loading || !selectedVideo || (accessType === 'PASSWORD' && !password)}
                  className="w-full px-4 py-3 bg-[#93C572] hover:bg-[#7AB55C] text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Link...
                    </>
                  ) : (
                    'Create Share Link'
                  )}
                </button>
              </>
            )}

            {/* Share Link Display */}
            {shareLink && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-[#93C572]/10 border border-[#93C572]/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-5 h-5 text-[#93C572]" />
                    <span className="font-semibold text-gray-900">Link Created Successfully!</span>
                  </div>
                  <p className="text-sm text-gray-600">Share this link with anyone to give them access</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Share Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-3 bg-[#93C572] hover:bg-[#7AB55C] text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => window.open(shareLink, '_blank')}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Link
                  </button>
                  <button
                    onClick={() => {
                      setShareLink('');
                      setSelectedVideo(null);
                      setPassword('');
                    }}
                    className="px-4 py-2 bg-[#93C572] hover:bg-[#7AB55C] text-white rounded-lg font-medium transition-colors"
                  >
                    Share Another
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
