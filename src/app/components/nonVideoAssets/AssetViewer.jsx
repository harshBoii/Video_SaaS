"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  FileText,
  Film,
  File
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import DocViewer to avoid SSR issues
const DocViewer = dynamic(
  () => import('@cyntler/react-doc-viewer').then(mod => mod.default),
  { ssr: false }
);

const DocViewerRenderers = dynamic(
  () => import('@cyntler/react-doc-viewer').then(mod => mod.DocViewerRenderers),
  { ssr: false }
);

/**
 * Universal Asset Viewer Modal
 * Supports: Images, Videos, PDFs, DOCX, XLSX, TXT, etc.
 */
export default function AssetViewerModal({ 
  asset, 
  isOpen, 
  onClose,
  onDownload,
  showDownload = true,
  showNavigation = false,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false
}) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Reset states when asset changes
  useEffect(() => {
    if (asset) {
      setZoom(100);
      setRotation(0);
      setError(null);
      setLoading(true);
    }
  }, [asset?.id]);

  if (!isOpen || !asset) return null;

  // Determine file type
  const getFileType = () => {
    const extension = asset.filename?.split('.').pop()?.toLowerCase();
    const mimeType = asset.fileType || asset.mimeType || '';

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension) || 
        mimeType.startsWith('image/')) {
      return 'image';
    }

    // Videos
    if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(extension) || 
        mimeType.startsWith('video/')) {
      return 'video';
    }

    // PDFs
    if (extension === 'pdf' || mimeType === 'application/pdf') {
      return 'pdf';
    }

    // Documents
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].includes(extension)) {
      return 'document';
    }

    return 'unknown';
  };

  const fileType = getFileType();
  const viewUrl = asset.r2Url || asset.playbackUrl || asset.url;

  // Image Controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(100);
    setRotation(0);
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.getElementById('asset-viewer-container')?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isOpen) return;

      switch(e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasPrev && onPrev) onPrev();
          break;
        case 'ArrowRight':
          if (hasNext && onNext) onNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case 'r':
        case 'R':
          handleRotate();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, hasNext, hasPrev, onNext, onPrev]);

  // Get file icon
  const getFileIcon = () => {
    switch(fileType) {
      case 'image': return <ImageIcon className="w-6 h-6" />;
      case 'video': return <Film className="w-6 h-6" />;
      case 'pdf': 
      case 'document': return <FileText className="w-6 h-6" />;
      default: return <File className="w-6 h-6" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center"
        onClick={onClose}
      >
        {/* Header Controls */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-white">
            {/* File Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                {getFileIcon()}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-lg truncate">{asset.title}</h3>
                <p className="text-sm text-white/70 truncate">{asset.filename}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 ml-4">
              {/* Image-specific controls */}
              {fileType === 'image' && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
                    title="Zoom Out (-)  "
                  >
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <span className="px-3 py-1 bg-white/10 rounded-lg backdrop-blur-sm text-sm font-medium min-w-[60px] text-center">
                    {zoom}%
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
                    title="Zoom In (+)"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRotate(); }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
                    title="Rotate (R)"
                  >
                    <RotateCw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReset(); }}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors text-sm font-medium"
                  >
                    Reset
                  </button>
                </>
              )}

              {/* Fullscreen */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
                title="Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>

              {/* Download */}
              {showDownload && onDownload && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDownload(asset); }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}

              {/* Close */}
              <button
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-red-500/80 rounded-lg backdrop-blur-sm transition-colors"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div 
          id="asset-viewer-container"
          className="w-full h-full flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Navigation Buttons */}
          {showNavigation && (
            <>
              {hasPrev && (
                <button
                  onClick={(e) => { e.stopPropagation(); onPrev(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all z-10 group"
                >
                  <ChevronLeft className="w-8 h-8 text-white" />
                </button>
              )}
              {hasNext && (
                <button
                  onClick={(e) => { e.stopPropagation(); onNext(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all z-10 group"
                >
                  <ChevronRight className="w-8 h-8 text-white" />
                </button>
              )}
            </>
          )}

          {/* Content Renderer */}
          <div className="max-w-7xl max-h-[calc(100vh-8rem)] w-full h-full flex items-center justify-center">
            {fileType === 'image' && (
              <motion.img
                key={asset.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={viewUrl}
                alt={asset.title}
                className="max-w-full max-h-full object-contain transition-transform duration-300"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                }}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setError('Failed to load image');
                  setLoading(false);
                }}
              />
            )}

            {fileType === 'video' && (
              <div className="w-full h-full max-w-5xl max-h-[80vh]">
                <video
                  key={asset.id}
                  controls
                  autoPlay
                  className="w-full h-full rounded-lg"
                  onLoadedData={() => setLoading(false)}
                  onError={() => {
                    setError('Failed to load video');
                    setLoading(false);
                  }}
                >
                  <source src={viewUrl} type={asset.fileType || 'video/mp4'} />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {(fileType === 'pdf' || fileType === 'document') && (
              <div className="w-full h-full bg-white rounded-lg overflow-hidden">
                <DocViewer
                  documents={[{ uri: viewUrl, fileName: asset.filename }]}
                  pluginRenderers={DocViewerRenderers}
                  config={{
                    header: {
                      disableHeader: false,
                      disableFileName: false,
                      retainURLParams: false
                    },
                    csvDelimiter: ',',
                    pdfZoom: {
                      defaultZoom: 1.0,
                      zoomJump: 0.1,
                    },
                  }}
                  style={{ width: '100%', height: '100%' }}
                  onLoadSuccess={() => setLoading(false)}
                  onError={() => {
                    setError('Failed to load document');
                    setLoading(false);
                  }}
                />
              </div>
            )}

            {fileType === 'unknown' && (
              <div className="text-center text-white">
                <File className="w-16 h-16 mx-auto mb-4 text-white/50" />
                <p className="text-lg font-semibold mb-2">Preview Not Available</p>
                <p className="text-white/70 mb-4">
                  This file type cannot be previewed in the browser
                </p>
                {showDownload && onDownload && (
                  <button
                    onClick={() => onDownload(asset)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Download className="w-5 h-5" />
                    Download File
                  </button>
                )}
              </div>
            )}

            {/* Loading State */}
            {loading && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="text-center text-white">
                  <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-lg font-semibold">Loading {fileType}...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-lg font-semibold mb-2">Failed to Load</p>
                <p className="text-white/70">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-white text-sm">
            <div className="flex items-center gap-4">
              <span className="text-white/70">
                Size: {asset.fileSizeFormatted || asset.originalSizeFormatted || 'Unknown'}
              </span>
              {asset.resolution && (
                <span className="text-white/70">
                  {asset.resolution}
                </span>
              )}
              {asset.durationFormatted && (
                <span className="text-white/70">
                  Duration: {asset.durationFormatted}
                </span>
              )}
            </div>
            <div className="text-white/70">
              Uploaded: {new Date(asset.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
