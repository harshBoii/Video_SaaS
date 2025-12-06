// components/video/SingleVideoVersionUploadModal.jsx
'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Loader2, FileVideo, Layers, AlertCircle } from 'lucide-react';
import { showSuccess, showError } from '@/app/lib/swal';

export default function SingleVideoVersionUploadModal({ 
  isOpen, 
  onClose, 
  videoId,
  videoTitle,
  onUploadComplete 
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

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
      videoId={videoId}
      videoTitle={videoTitle}
      onUploadComplete={onUploadComplete}
    />,
    document.body
  );
}

function ModalContent({ onClose, videoId, videoTitle, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [versionNote, setVersionNote] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      showError('Invalid File', 'Please select a valid video file.');
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

  const handleUpload = async () => {
    // Validation
    if (!selectedFile) {
      showError('Error', 'Please select a video file');
      return;
    }

    if (!versionNote.trim()) {
      showError('Error', 'Please provide a version note');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      console.log('[VERSION UPLOAD] Starting upload for:', selectedFile.name);
      
      const duration = await getVideoDuration(selectedFile);

      // Step 1: Initialize version upload
      const startRes = await fetch(`/api/videos/${videoId}/versions`, {
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
        await showSuccess('Version Uploaded', `Version ${version.version} uploaded successfully`);
        
        if (onUploadComplete) onUploadComplete();
        handleClose();
      }
    } catch (error) {
      console.error('[VERSION UPLOAD ERROR]', error);
      await showError('Upload Failed', error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setVersionNote('');
      setSelectedFile(null);
      setUploadProgress(0);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Upload New Version</h2>
                <p className="text-purple-100 text-sm mt-0.5">{videoTitle}</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              disabled={uploading}
              className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Version Note */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Version Note *
              </label>
              <textarea
                value={versionNote}
                onChange={(e) => setVersionNote(e.target.value)}
                placeholder="What changed in this version? (e.g., 'Fixed audio sync issues', 'Updated branding')"
                rows={4}
                disabled={uploading}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
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
                    ? 'border-purple-400 bg-purple-50 hover:bg-purple-100'
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-purple-300'
                }`}>
                  <FileVideo className={`w-12 h-12 mx-auto mb-3 ${
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
                className="bg-blue-50 rounded-2xl p-5 border-2 border-blue-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
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
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all"
                  />
                </div>
              </motion.div>
            )}

            {/* Info Box */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Version Upload Guidelines
                </p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Current version remains active until new version is ready</li>
                  <li>• Version history preserved for rollback capability</li>
                  <li>• New version automatically becomes active when processed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-purple-50 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={handleClose}
              disabled={uploading}
              className="px-5 py-2.5 text-gray-700 font-semibold bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            <motion.button
              whileHover={{ scale: uploading ? 1 : 1.02 }}
              whileTap={{ scale: uploading ? 1 : 0.98 }}
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !versionNote.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
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
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
