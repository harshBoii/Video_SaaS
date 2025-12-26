'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUpload, FiImage, FiFilm, FiMusic, FiX,
  FiCheck, FiFolder, FiLink
} from 'react-icons/fi';

export default function UploadPanel({ addElement, currentPage }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const newFiles = files.map(file => ({
      id: `file-${Date.now()}-${Math.random()}`,
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 
            file.type.startsWith('video/') ? 'video' :
            file.type.startsWith('audio/') ? 'audio' : 'other',
      size: file.size,
      url: URL.createObjectURL(file),
      file
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleAddToCanvas = (uploadedFile) => {
    if (uploadedFile.type === 'image') {
      const newElement = {
        id: `image-${Date.now()}`,
        type: 'image',
        src: uploadedFile.url,
        x: 100,
        y: 100,
        width: 300,
        height: 200,
        borderRadius: 0,
        zIndex: 1,
        startTime: 0,
        duration: 5,
      };
      addElement(newElement);
    } else if (uploadedFile.type === 'video') {
      // Create temporary video element to get duration
      const video = document.createElement('video');
      video.src = uploadedFile.url;
      video.onloadedmetadata = () => {
        const duration = video.duration || 10;
        const newElement = {
          id: `video-${Date.now()}`,
          type: 'video',
          src: uploadedFile.url,
          x: 100,
          y: 100,
          width: 400,
          height: 225,
          borderRadius: 0,
          zIndex: 1,
          startTime: 0,
          duration: duration,
          videoDuration: duration,
        };
        addElement(newElement);
      };
      video.onerror = () => {
        // Fallback if metadata fails to load
        const newElement = {
          id: `video-${Date.now()}`,
          type: 'video',
          src: uploadedFile.url,
          x: 100,
          y: 100,
          width: 400,
          height: 225,
          borderRadius: 0,
          zIndex: 1,
          startTime: 0,
          duration: 10,
          videoDuration: 10,
        };
        addElement(newElement);
      };
    }
  };

  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    
    // Determine type from URL
    const isVideo = urlInput.match(/\.(mp4|webm|mov|avi)$/i) || urlInput.includes('youtube') || urlInput.includes('vimeo');
    const isImage = urlInput.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

    if (isImage) {
      const newElement = {
        id: `image-${Date.now()}`,
        type: 'image',
        src: urlInput,
        x: 100,
        y: 100,
        width: 300,
        height: 200,
        borderRadius: 0,
        zIndex: 1,
        startTime: 0,
        duration: 5,
      };
      addElement(newElement);
    } else if (isVideo) {
      // Create temporary video element to get duration
      const video = document.createElement('video');
      video.src = urlInput;
      video.onloadedmetadata = () => {
        const duration = video.duration || 10;
        const newElement = {
          id: `video-${Date.now()}`,
          type: 'video',
          src: urlInput,
          x: 100,
          y: 100,
          width: 400,
          height: 225,
          borderRadius: 0,
          zIndex: 1,
          startTime: 0,
          duration: duration,
          videoDuration: duration,
        };
        addElement(newElement);
      };
      video.onerror = () => {
        // Fallback if metadata fails to load
        const newElement = {
          id: `video-${Date.now()}`,
          type: 'video',
          src: urlInput,
          x: 100,
          y: 100,
          width: 400,
          height: 225,
          borderRadius: 0,
          zIndex: 1,
          startTime: 0,
          duration: 10,
          videoDuration: 10,
        };
        addElement(newElement);
      };
    }
    
    setUrlInput('');
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'image': return FiImage;
      case 'video': return FiFilm;
      case 'audio': return FiMusic;
      default: return FiFolder;
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--glass-hover)]">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
            ${activeTab === 'upload' 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'hover:bg-[var(--glass-hover)]'
            }`}
        >
          Upload
        </button>
        <button
          onClick={() => setActiveTab('url')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
            ${activeTab === 'url' 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'hover:bg-[var(--glass-hover)]'
            }`}
        >
          From URL
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
                transition-all duration-200
                ${isDragging 
                  ? 'border-primary bg-primary/10' 
                  : 'border-[var(--glass-border)] hover:border-primary/50 hover:bg-[var(--glass-hover)]'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <motion.div
                animate={{ scale: isDragging ? 1.1 : 1 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <FiUpload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {isDragging ? 'Drop files here' : 'Click to upload'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or drag and drop
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Images, Videos, Audio files
                </p>
              </motion.div>
            </div>

            {/* Supported Formats */}
            <div className="flex flex-wrap gap-2 justify-center">
              {['PNG', 'JPG', 'GIF', 'MP4', 'WEBM', 'MP3'].map((format) => (
                <span 
                  key={format}
                  className="px-2 py-1 text-xs rounded-lg bg-[var(--glass-hover)] text-muted-foreground"
                >
                  {format}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'url' && (
          <motion.div
            key="url"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-3">
                <FiLink className="w-4 h-4 text-primary" />
                Import from URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Paste image or video URL..."
                  className="flex-1 px-4 py-2 rounded-xl bg-[var(--glass-hover)] 
                           border border-[var(--glass-border)] focus:border-primary/50
                           focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim()}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </motion.button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Supports: Direct image/video links, YouTube, Vimeo
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Uploaded Files</label>
            <span className="text-xs text-muted-foreground">
              {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uploadedFiles.map((file) => {
              const FileIcon = getFileIcon(file.type);
              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--glass-hover)] 
                           border border-[var(--glass-border)] group"
                >
                  {/* Preview */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted/30 flex-shrink-0">
                    {file.type === 'image' ? (
                      <img 
                        src={file.url} 
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : file.type === 'video' ? (
                      <video 
                        src={file.url}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleAddToCanvas(file)}
                      className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
                      title="Add to canvas"
                    >
                      <FiCheck className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemoveFile(file.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-red-500 transition-colors"
                      title="Remove"
                    >
                      <FiX className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock Media Section */}
      <div className="pt-4 border-t border-[var(--glass-border)]">
        <label className="text-sm font-medium mb-3 block">Stock Media</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: 'Pexels', icon: FiImage },
            { name: 'Unsplash', icon: FiImage },
            { name: 'Pixabay', icon: FiFilm },
            { name: 'Freesound', icon: FiMusic },
          ].map((source) => (
            <motion.button
              key={source.name}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-[var(--glass-hover)]
                       border border-[var(--glass-border)] hover:border-primary/50
                       hover:bg-primary/10 transition-all"
            >
              <source.icon className="w-4 h-4 text-primary" />
              <span className="text-sm">{source.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
