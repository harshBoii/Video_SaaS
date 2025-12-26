// components/video/VersionUploadModal.jsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Upload, Search, Loader2, FileVideo, 
  ChevronLeft, Clock, Video, Layers,
  CheckCircle2, AlertCircle, Filter
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function VersionUploadModal({ 
  isOpen, 
  onClose, 
  campaignId,
  onUploadComplete 
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

  return createPortal(
    <ModalContent 
      onClose={onClose}
      campaignId={campaignId}
      onUploadComplete={onUploadComplete}
    />,
    document.body
  );
}

function ModalContent({ onClose, campaignId, onUploadComplete }) {
  const [step, setStep] = useState(1); // 1: Select Video, 2: Upload Version
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [versionNote, setVersionNote] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent, title, duration

  // Fetch videos on mount
  useEffect(() => {
    if (campaignId) {
      fetchVideos();
    }
  }, [campaignId]);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/videos?campaignId=${campaignId}&limit=50`, {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (data.success) {
        setVideos(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch videos');
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Failed to Load',
        text: 'Unable to fetch videos',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  // Filter and sort videos
  const filteredVideos = useCallback(() => {
    let filtered = videos.filter(video => 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'duration':
        filtered.sort((a, b) => (b.duration || 0) - (a.duration || 0));
        break;
      default:
        break;
    }

    return filtered;
  }, [videos, searchQuery, sortBy]);

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    setStep(2);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid File',
        text: 'Please select a valid video file',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    setSelectedFile(file);
  };

  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => resolve(null);
      video.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = useCallback(async () => {
    // Validation
    if (!selectedFile) {
      await Swal.fire({
        icon: 'warning',
        title: 'No File Selected',
        text: 'Please select a video file to upload',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    if (!versionNote.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Version Note Required',
        text: 'Please provide a note describing what changed in this version',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      console.log('[VERSION UPLOAD] Starting upload for:', selectedFile.name);
      
      const duration = await getVideoDuration(selectedFile);

      // Step 1: Initialize version upload
      const startRes = await fetch(`/api/videos/${selectedVideo.id}/versions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionNote: versionNote,
          fileSize: selectedFile.size,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
        })
      });

      if (!startRes.ok) {
        const errorData = await startRes.json();
        throw new Error(errorData.error || 'Failed to start version upload');
      }

      const startData = await startRes.json();
      
      if (!startData.success || !startData.upload || !startData.urls) {
        throw new Error('Invalid response from server');
      }

      const { upload, urls, version } = startData;
      
      console.log('[VERSION UPLOAD] Upload initialized:', {
        versionId: version.id,
        versionNumber: version.version,
        uploadId: upload.uploadId,
        totalParts: upload.totalParts,
      });

      // Step 2: Upload parts
      const partSize = upload.partSize;
      const uploadedParts = [];

      for (let i = 0; i < urls.length; i++) {
        const start = i * partSize;
        const end = Math.min(start + partSize, selectedFile.size);
        const chunk = selectedFile.slice(start, end);

        console.log(`[VERSION UPLOAD] Uploading part ${i + 1}/${urls.length}`);

        let retries = 3;
        let uploadRes;
        
        while (retries > 0) {
          try {
            uploadRes = await fetch(urls[i].url, {
              method: 'PUT',
              body: chunk,
              headers: { 'Content-Type': selectedFile.type },
            });

            if (uploadRes.ok) break;
            retries--;
            if (retries === 0) throw new Error(`Failed to upload part ${i + 1}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            retries--;
            if (retries === 0) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        const etag = uploadRes.headers.get('ETag');
        if (!etag) throw new Error(`Part ${i + 1} missing ETag`);

        uploadedParts.push({
          PartNumber: urls[i].partNumber,
          ETag: etag.replace(/"/g, ''),
        });

        setUploadProgress(Math.round(((i + 1) / urls.length) * 100));
      }

      console.log('[VERSION UPLOAD] All parts uploaded, completing...');

      // Step 3: Complete upload
      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId: upload.uploadId,
          key: upload.key,
          parts: uploadedParts,
          duration: duration,
          versionId: version.id,
        })
      });

      if (!completeRes.ok) {
        const errorData = await completeRes.json();
        throw new Error(errorData.error || 'Failed to complete upload');
      }

      const result = await completeRes.json();
      
      if (result.success) {
        console.log('[VERSION UPLOAD] Upload completed:', result);
        await Swal.fire({
          icon: 'success',
          title: 'Version Uploaded!',
          html: `Version <strong>${version.version}</strong> uploaded successfully`,
          confirmButtonColor: '#10b981'
        });
        
        if (onUploadComplete) onUploadComplete();
        handleClose();
      }
    } catch (error) {
      console.error('[VERSION UPLOAD ERROR]', error);
      await Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: error.message,
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [selectedFile, selectedVideo, versionNote, onUploadComplete]);

  const handleClose = useCallback(() => {
    setStep(1);
    setSelectedVideo(null);
    setSelectedFile(null);
    setVersionNote('');
    setSearchQuery('');
    setSortBy('recent');
    setUploadProgress(0);
    onClose();
  }, [onClose]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
                <Layers className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Upload New Version</h2>
                <p className="text-purple-100 text-sm mt-1">
                  Step {step} of 2 • {step === 1 ? 'Select video' : selectedVideo?.title}
                </p>
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
              initial={{ width: '50%' }}
              animate={{ width: `${(step / 2) * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>

          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto p-8">
            <AnimatePresence mode="wait">
              {/* STEP 1: Select Video */}
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
                        <p className="text-sm text-muted-foreground">Fetching your videos</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Search and Sort */}
                      <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search videos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                          />
                        </div>

                        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                          <button
                            onClick={() => setSortBy('recent')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                              sortBy === 'recent'
                                ? 'bg-white text-purple-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <Clock className="w-4 h-4 inline mr-1" />
                            Recent
                          </button>
                          <button
                            onClick={() => setSortBy('title')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                              sortBy === 'title'
                                ? 'bg-white text-purple-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            Title
                          </button>
                          <button
                            onClick={() => setSortBy('duration')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                              sortBy === 'duration'
                                ? 'bg-white text-purple-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            Duration
                          </button>
                        </div>
                      </div>

                      {filteredVideos().length === 0 ? (
                        <div className="text-center py-24">
                          <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Video className="w-12 h-12 text-gray-400" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {searchQuery ? 'No videos found' : 'No Videos Available'}
                          </h3>
                          <p className="text-gray-500">
                            {searchQuery ? 'Try a different search term' : 'Upload videos to this campaign first'}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredVideos().map((video) => (
                            <motion.div
                              key={video.id}
                              whileHover={{ y: -4, scale: 1.02 }}
                              onClick={() => handleVideoSelect(video)}
                              className="group relative p-4 rounded-2xl border-2 border-gray-200 bg-white hover:border-purple-300 hover:shadow-lg cursor-pointer transition-all"
                            >
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
                                    <Video className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}

                                {/* Duration Badge */}
                                {video.duration && (
                                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/75 backdrop-blur-sm rounded-lg text-xs text-white font-mono">
                                    {formatDuration(video.duration)}
                                  </div>
                                )}

                                {/* Version Badge */}
                                <div className="absolute top-2 left-2 px-2 py-1 bg-purple-600/90 backdrop-blur-sm rounded-lg text-xs text-white font-semibold flex items-center gap-1">
                                  <Layers className="w-3 h-3" />
                                  v{video.currentVersion || 1}
                                </div>
                              </div>

                              {/* Video Info */}
                              <h4 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-purple-700 transition-colors">
                                {video.title}
                              </h4>
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1">
                                  <Layers className="w-3.5 h-3.5" />
                                  {video.versionCount || 1}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {/* STEP 2: Upload Version */}
              {step === 2 && selectedVideo && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-2xl mx-auto space-y-6"
                >
                  {/* Selected Video Info */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border-2 border-purple-200">
                    <div className="flex items-start gap-4">
                      <div className="w-32 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200">
                        {selectedVideo.thumbnailUrl ? (
                          <img
                            src={selectedVideo.thumbnailUrl}
                            alt={selectedVideo.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {selectedVideo.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Layers className="w-4 h-4" />
                            Current: v{selectedVideo.currentVersion || 1}
                          </span>
                          <span>→</span>
                          <span className="flex items-center gap-1 text-purple-600 font-semibold">
                            <Layers className="w-4 h-4" />
                            New: v{(selectedVideo.currentVersion || 1) + 1}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Version Note */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Version Note *
                    </label>
                    <textarea
                      value={versionNote}
                      onChange={(e) => setVersionNote(e.target.value)}
                      placeholder="Describe what changed in this version..."
                      rows={4}
                      disabled={uploading}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Example: "Fixed audio sync issues", "Updated branding", "Added new scenes"
                    </p>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Video File *
                    </label>
                    <label className="block">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileSelect}
                        disabled={uploading}
                        className="hidden"
                      />
                      <div className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                        uploading
                          ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                          : selectedFile
                          ? 'border-purple-400 bg-purple-50'
                          : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-purple-300'
                      }`}>
                        <Upload className={`w-12 h-12 mx-auto mb-3 ${
                          selectedFile ? 'text-purple-600' : 'text-gray-400'
                        }`} />
                        {selectedFile ? (
                          <>
                            <p className="text-base font-semibold text-gray-900 mb-1">
                              {selectedFile.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            {!uploading && (
                              <p className="text-xs text-purple-600 mt-2">
                                Click to change file
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-base font-semibold text-gray-900 mb-1">
                              Click to select video file
                            </p>
                            <p className="text-sm text-gray-600">
                              MP4, MOV, AVI, MKV, WEBM up to 100GB
                            </p>
                          </>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* Upload Progress */}
                  {uploading && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-900">
                          Uploading...
                        </span>
                        <span className="text-sm font-bold text-blue-600">
                          {uploadProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full"
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-2 text-center">
                        Please don't close this window
                      </p>
                    </motion.div>
                  )}

                  {/* Info Box */}
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        Version Upload Guidelines
                      </p>
                      <ul className="text-xs text-gray-700 space-y-1">
                        <li>• Existing version remains accessible until new version is ready</li>
                        <li>• Version history is preserved for rollback capability</li>
                        <li>• New version will automatically become the active version</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-purple-50 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={step === 1 ? handleClose : () => setStep(1)}
              disabled={uploading}
              className="px-6 py-3 text-gray-700 font-semibold bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              {step === 1 ? 'Cancel' : 'Back'}
            </motion.button>

            {step === 2 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !versionNote.trim()}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload Version
                  </>
                )}
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
