// components/video/collection/CreateCollectionModal.jsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Share2, Lock, Globe, Calendar, Download, 
  MessageSquare, Loader2, Copy, Check, ChevronLeft,
  CheckCircle2
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function CreateCollectionModal({ 
  isOpen, 
  onClose, 
  campaignId, 
  preSelectedVideos = [] 
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  // Portal to document.body - escapes ALL parent overflow constraints
  return createPortal(
    <ModalContent 
      onClose={onClose}
      campaignId={campaignId}
      preSelectedVideos={preSelectedVideos}
    />,
    document.body
  );
}

function ModalContent({ onClose, campaignId, preSelectedVideos }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [videos, setVideos] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    accessType: 'PUBLIC',
    password: '',
    allowComments: true,
    allowDownload: false,
    expiresAt: ''
  });

  // Fetch videos on mount
  useEffect(() => {
    fetchVideos();
  }, [campaignId]);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/videos`, {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (data.success) {
        const readyVideos = data.data.filter(v => v.status === 'ready');
        setVideos(readyVideos);
        
        // Auto-select all ready videos if no preselection
        if (preSelectedVideos.length === 0) {
          setSelectedVideos(readyVideos.map(v => v.id));
        } else {
          setSelectedVideos(preSelectedVideos);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch videos');
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Failed to Load',
        text: 'Unable to fetch campaign videos',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
    }
  }, [campaignId, preSelectedVideos]);

  const toggleVideo = useCallback((videoId) => {
    setSelectedVideos(prev =>
      prev.includes(videoId)
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  }, []);

  const handleCreate = useCallback(async () => {
    // Validation
    if (!formData.name.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Name Required',
        text: 'Please enter a collection name',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    if (selectedVideos.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'No Videos',
        text: 'Select at least one video to share',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    if (formData.accessType === 'PASSWORD' && !formData.password.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Password Required',
        text: 'Enter a password for protected access',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    setCreating(true);
    try {
    const res = await fetch('/api/collections/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      name: formData.name,
      description: formData.description,
      accessType: formData.accessType,
      password: formData.password,
      allowComments: formData.allowComments,
      allowDownload: formData.allowDownload,
      expiresAt: formData.expiresAt,
      videoIds: selectedVideos,
      campaignId
    })
  });


      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create collection');

      setShareUrl(data.data.shareUrl);
      setStep(3);
      
      await Swal.fire({
        icon: 'success',
        title: 'Collection Created!',
        html: `<strong>${data.data.videoCount}</strong> videos ready to share`,
        confirmButtonColor: '#10b981'
      });
    } catch (error) {
      console.error('Create collection error:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        text: error.message,
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setCreating(false);
    }
  }, [formData, selectedVideos, campaignId]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  const handleClose = useCallback(() => {
    setStep(1);
    setFormData({
      name: '',
      description: '',
      accessType: 'PUBLIC',
      password: '',
      allowComments: true,
      allowDownload: false,
      expiresAt: ''
    });
    setSelectedVideos([]);
    setShareUrl('');
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        style={{ zIndex: 99999 }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="glass-card rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary via-primary/80 to-primary px-8 py-6 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Share2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Share Video Collection</h2>
                <p className="text-blue-100 text-sm mt-1">Step {step} of 3 • {selectedVideos.length} videos selected</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-2xl text-white transition-all"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-[var(--glass-hover)] flex-shrink-0">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary"
              initial={{ width: '33%' }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>

          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto p-8">
            <AnimatePresence mode="wait">
              {/* STEP 1: Select Videos */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-6">
                      <Loader2 className="w-16 h-16 text-primary animate-spin" />
                      <div className="text-center">
                        <p className="text-xl font-semibold text-foreground mb-2">Loading Videos...</p>
                        <p className="text-sm text-muted-foreground">Fetching your campaign content</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-foreground">
                          Select Videos
                        </h3>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setSelectedVideos(videos.map(v => v.id))}
                            className="text-sm text-primary hover:text-primary/80 font-semibold"
                          >
                            Select All
                          </button>
                          <button
                            onClick={() => setSelectedVideos([])}
                            className="text-sm text-muted-foreground hover:text-foreground font-semibold"
                          >
                            Clear All
                          </button>
                          <div className="text-sm font-bold text-gray-700 bg-indigo-100 px-4 py-2 rounded-full">
                            {selectedVideos.length} / {videos.length}
                          </div>
                        </div>
                      </div>

                      {videos.length === 0 ? (
                        <div className="text-center py-24">
                          <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Share2 className="w-12 h-12 text-gray-400" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Videos Available</h3>
                          <p className="text-gray-500">Upload videos to this campaign first</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {videos.map((video) => (
                            <motion.div
                              key={video.id}
                              whileHover={{ y: -4, scale: 1.02 }}
                              onClick={() => toggleVideo(video.id)}
                              className={`group relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                selectedVideos.includes(video.id)
                                  ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-200/50'
                                  : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                              }`}
                            >
                              {/* Checkbox */}
                              <div className="absolute top-4 right-4 z-10">
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                  selectedVideos.includes(video.id)
                                    ? 'bg-indigo-600 border-indigo-600'
                                    : 'bg-white border-gray-300 group-hover:border-indigo-400'
                                }`}>
                                  {selectedVideos.includes(video.id) && (
                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                  )}
                                </div>
                              </div>

                              {/* Thumbnail */}
                              <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-gray-100 to-gray-200">
                                {video.thumbnailUrl ? (
                                  <img
                                    src={video.thumbnailUrl}
                                    alt={video.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Share2 className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}
                              </div>

                              {/* Video Info */}
                              <h4 className="font-semibold text-gray-900 line-clamp-2 mb-2 pr-6 group-hover:text-indigo-700 transition-colors">
                                {video.title}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {video.duration 
                                  ? `${Math.floor(video.duration / 60)}:${String(Math.floor(video.duration % 60)).padStart(2, '0')}`
                                  : '0:00'
                                }
                                {video.resolution && ` • ${video.resolution}`}
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {/* STEP 2: Collection Settings */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-2xl mx-auto space-y-6"
                >
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Collection Settings</h3>

                  {/* Collection Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Collection Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Product Demo Videos Q4 2024"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Add a description for this collection..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition-all"
                    />
                  </div>

                  {/* Access Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Access Type
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setFormData({ ...formData, accessType: 'PUBLIC' })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.accessType === 'PUBLIC'
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <Globe className="w-6 h-6 mb-2 mx-auto text-indigo-600" />
                        <p className="font-semibold text-gray-900">Public</p>
                        <p className="text-xs text-gray-500 mt-1">Anyone with the link</p>
                      </button>
                      <button
                        onClick={() => setFormData({ ...formData, accessType: 'PASSWORD' })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.accessType === 'PASSWORD'
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <Lock className="w-6 h-6 mb-2 mx-auto text-indigo-600" />
                        <p className="font-semibold text-gray-900">Password</p>
                        <p className="text-xs text-gray-500 mt-1">Requires password</p>
                      </button>
                    </div>
                  </div>

                  {/* Password Field */}
                  {formData.accessType === 'PASSWORD' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Password *
                      </label>
                      <input
                        type="text"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter a password"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                    </motion.div>
                  )}

                  {/* Permissions */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      Viewer Permissions
                    </label>
                    
                    <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 cursor-pointer hover:bg-gray-50 transition-all">
                      <input
                        type="checkbox"
                        checked={formData.allowComments}
                        onChange={(e) => setFormData({ ...formData, allowComments: e.target.checked })}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <MessageSquare className="w-5 h-5 text-gray-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Allow Comments</p>
                        <p className="text-xs text-gray-500">Viewers can leave feedback</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 cursor-pointer hover:bg-gray-50 transition-all">
                      <input
                        type="checkbox"
                        checked={formData.allowDownload}
                        onChange={(e) => setFormData({ ...formData, allowDownload: e.target.checked })}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <Download className="w-5 h-5 text-gray-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Allow Downloads</p>
                        <p className="text-xs text-gray-500">Viewers can download videos</p>
                      </div>
                    </label>
                  </div>

                  {/* Expiration Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Expiration Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Share Link */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="max-w-2xl mx-auto text-center py-12"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/50">
                    <Check className="w-12 h-12 text-white" />
                  </div>
                  
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">Collection Created!</h3>
                  <p className="text-lg text-gray-600 mb-8">
                    Your collection with <strong>{selectedVideos.length} videos</strong> is ready to share
                  </p>

                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 text-left">
                      Share Link
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl font-mono text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={copyToClipboard}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="w-5 h-5" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-5 h-5" />
                            Copy
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-left">
                    <div className="p-4 bg-white rounded-xl border border-gray-200">
                      <p className="text-sm text-gray-600">Access</p>
                      <p className="font-bold text-gray-900 mt-1 capitalize">{formData.accessType.toLowerCase()}</p>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-gray-200">
                      <p className="text-sm text-gray-600">Comments</p>
                      <p className="font-bold text-gray-900 mt-1">{formData.allowComments ? 'Enabled' : 'Disabled'}</p>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-gray-200">
                      <p className="text-sm text-gray-600">Downloads</p>
                      <p className="font-bold text-gray-900 mt-1">{formData.allowDownload ? 'Enabled' : 'Disabled'}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
            {step < 3 ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={step === 1 ? handleClose : () => setStep(step - 1)}
                  className="px-6 py-3 text-gray-700 font-semibold bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-xl shadow-sm transition-all flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {step === 1 ? 'Cancel' : 'Back'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={step === 1 ? () => setStep(2) : handleCreate}
                  disabled={loading || creating || (step === 1 && selectedVideos.length === 0)}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : step === 1 ? (
                    `Continue with ${selectedVideos.length} videos`
                  ) : (
                    'Create Collection'
                  )}
                </motion.button>
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                className="w-full px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Done
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
