'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FiUpload, FiImage, FiVideo, FiFile, FiX, FiTrash2
} from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';

export default function UploadPanel({ addElement, currentPage }) {
  const fileInputRef = useRef(null);
  const [uploads, setUploads] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  // Handle file selection
  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    
    fileArray.forEach(file => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        return;
      }

      const fileId = uuidv4();
      const reader = new FileReader();

      // Simulate upload progress
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
      
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[fileId] || 0;
          if (current >= 100) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, [fileId]: Math.min(current + 10, 100) };
        });
      }, 100);

      reader.onload = (e) => {
        const newUpload = {
          id: fileId,
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          src: e.target.result,
          size: file.size,
          uploadedAt: new Date(),
        };

        setUploads(prev => [...prev, newUpload]);
        
        setTimeout(() => {
          setUploadProgress(prev => {
            const { [fileId]: _, ...rest } = prev;
            return rest;
          });
        }, 500);
      };

      reader.readAsDataURL(file);
    });
  };

  // Handle drag events
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
    handleFileSelect(e.dataTransfer.files);
  };

  // Add upload to canvas
  const addToCanvas = (upload) => {
    const newElement = {
      id: uuidv4(),
      type: 'image',
      x: 100,
      y: 100,
      width: 400,
      height: 300,
      src: upload.src,
      zIndex: 1,
      borderRadius: 0,
    };
    addElement(newElement);
  };

  // Delete upload
  const deleteUpload = (uploadId) => {
    setUploads(prev => prev.filter(u => u.id !== uploadId));
  };

  // Format file size
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--glass-border)]">
        <h2 className="text-lg font-semibold">Upload</h2>
        <p className="text-xs text-muted-foreground mt-1">Add media to your design</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                     transition-all duration-200
            ${isDragging 
              ? 'border-primary bg-primary/10' 
              : 'border-[var(--glass-border)] hover:border-primary/50 hover:bg-[var(--glass-hover)]'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
            <FiUpload className="w-6 h-6 text-primary" />
          </div>
          
          <p className="text-sm font-medium mb-1">
            {isDragging ? 'Drop files here' : 'Click or drag to upload'}
          </p>
          <p className="text-xs text-muted-foreground">
            Supports: JPG, PNG, GIF, WEBP, MP4
          </p>
        </div>

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="space-y-2">
            {Object.entries(uploadProgress).map(([id, progress]) => (
              <div key={id} className="bg-[var(--glass-hover)] rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Uploading...</span>
                  <span className="text-xs font-medium">{progress}%</span>
                </div>
                <div className="h-1.5 bg-background rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Uploads Grid */}
        {uploads.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                Your Uploads ({uploads.length})
              </label>
              <button
                onClick={() => setUploads([])}
                className="text-xs text-red-500 hover:text-red-400 transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {uploads.map((upload) => (
                <motion.div
                  key={upload.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative aspect-square rounded-lg overflow-hidden 
                           bg-[var(--glass-hover)] cursor-pointer"
                  onClick={() => addToCanvas(upload)}
                >
                  {upload.type === 'image' ? (
                    <img 
                      src={upload.src} 
                      alt={upload.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiVideo className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 
                                transition-opacity flex flex-col items-center justify-center gap-2">
                    <span className="text-white text-xs font-medium">Click to add</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteUpload(upload.id);
                      }}
                      className="p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-500 
                               transition-colors"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* File Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-xs truncate">{upload.name}</p>
                    <p className="text-white/70 text-[10px]">{formatSize(upload.size)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Stock Photos Placeholder */}
        <div className="space-y-2 pt-4 border-t border-[var(--glass-border)]">
          <label className="text-xs font-medium text-muted-foreground">Stock Photos</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              'https://via.placeholder.com/200x200?text=Stock+1',
              'https://via.placeholder.com/200x200?text=Stock+2',
              'https://via.placeholder.com/200x200?text=Stock+3',
              'https://via.placeholder.com/200x200?text=Stock+4',
            ].map((src, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const newElement = {
                    id: uuidv4(),
                    type: 'image',
                    x: 100,
                    y: 100,
                    width: 300,
                    height: 300,
                    src: src,
                    zIndex: 1,
                  };
                  addElement(newElement);
                }}
                className="aspect-square rounded-lg overflow-hidden bg-[var(--glass-hover)]"
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
