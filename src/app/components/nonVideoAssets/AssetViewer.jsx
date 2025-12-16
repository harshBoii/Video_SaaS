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
  File,
  ExternalLink,
  Link as LinkIcon,
  Copy,
  FileSpreadsheet,
  Presentation,
  FileCode,
  Edit3
} from 'lucide-react';
import dynamic from 'next/dynamic';
import GoogleEditorIntegration from './editors/GoogleEditorIntegration';

// ✅ Import DocViewer with proper loading state
const DocViewer = dynamic(
  () => import('@cyntler/react-doc-viewer'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading document viewer...</p>
        </div>
      </div>
    )
  }
);

/**
 * Universal Asset Viewer Modal
 * Supports: Images, Videos, PDFs, DOCX, XLSX, TXT, PPT, etc.
 * With Google Drive editing integration
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
  const [docViewerReady, setDocViewerReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEditor, setShowEditor] = useState(false); // ✅ NEW: Toggle editor view

  // Reset states when asset changes
  useEffect(() => {
    if (asset) {
      setZoom(100);
      setRotation(0);
      setError(null);
      setLoading(true);
      setShowEditor(false); // ✅ Reset editor view
    }
  }, [asset?.id]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e) => {
      switch(e.key) {
        case 'Escape':
          if (showEditor) {
            setShowEditor(false);
          } else {
            onClose?.();
          }
          break;
        case 'ArrowLeft':
          if (!showEditor && hasPrev && onPrev) onPrev();
          break;
        case 'ArrowRight':
          if (!showEditor && hasNext && onNext) onNext();
          break;
        case '+':
        case '=':
          if (!showEditor) handleZoomIn();
          break;
        case '-':
          if (!showEditor) handleZoomOut();
          break;
        case 'r':
        case 'R':
          if (!showEditor) handleRotate();
          break;
        case 'e':
        case 'E':
          if (isEditable()) setShowEditor(!showEditor);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, hasNext, hasPrev, onNext, onPrev, showEditor]);

  // ✅ Load DocViewer after component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDocViewerReady(true);
    }
  }, []);

  // Early return AFTER all hooks
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
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'md', 'rtf'].includes(extension)) {
      return 'document';
    }

    return 'unknown';
  };

  const fileType = getFileType();
  const viewUrl = asset.viewUrl || asset.thumbnailUrl || asset.playbackUrl || asset.url;

  // ✅ Check if file is editable via Google Drive
  const isEditable = () => {
    const extension = asset.filename?.split('.').pop()?.toLowerCase();
    return ['docx', 'doc', 'txt', 'rtf', 'xlsx', 'xls', 'csv', 'pptx', 'ppt'].includes(extension);
  };

  // ✅ Get document type specific styling
  const getDocumentTypeConfig = () => {
    const docType = asset.documentType || 'OTHER';
    
    const configs = {
      PDF: {
        icon: FileText,
        color: 'emerald',
        bgGradient: 'from-emerald-500/10 to-emerald-600/5',
        borderColor: 'border-emerald-500/20',
        textColor: 'text-emerald-300',
        label: 'PDF Document'
      },
      DOCUMENT: {
        icon: FileText,
        color: 'blue',
        bgGradient: 'from-blue-500/10 to-blue-600/5',
        borderColor: 'border-blue-500/20',
        textColor: 'text-blue-300',
        label: 'Word Document'
      },
      SPREADSHEET: {
        icon: FileSpreadsheet,
        color: 'green',
        bgGradient: 'from-green-500/10 to-green-600/5',
        borderColor: 'border-green-500/20',
        textColor: 'text-green-300',
        label: 'Spreadsheet'
      },
      PRESENTATION: {
        icon: Presentation,
        color: 'orange',
        bgGradient: 'from-orange-500/10 to-orange-600/5',
        borderColor: 'border-orange-500/20',
        textColor: 'text-orange-300',
        label: 'Presentation'
      },
      TEXT: {
        icon: FileCode,
        color: 'purple',
        bgGradient: 'from-purple-500/10 to-purple-600/5',
        borderColor: 'border-purple-500/20',
        textColor: 'text-purple-300',
        label: 'Text File'
      },
      OTHER: {
        icon: File,
        color: 'slate',
        bgGradient: 'from-slate-500/10 to-slate-600/5',
        borderColor: 'border-slate-500/20',
        textColor: 'text-slate-300',
        label: 'Document'
      }
    };

    return configs[docType] || configs.OTHER;
  };

  const docConfig = getDocumentTypeConfig();
  const DocIcon = docConfig.icon;

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
    } else {
      document.exitFullscreen();
    }
  };

  // Document Actions
  const handleOpenInNewTab = () => {
    window.open(viewUrl, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(viewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get file icon
  const getFileIcon = () => {
    switch(fileType) {
      case 'image': return <ImageIcon className="w-6 h-6" />;
      case 'video': return <Film className="w-6 h-6" />;
      case 'pdf': 
      case 'document': return <DocIcon className="w-6 h-6" />;
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
              {/* ✅ Edit Button for editable documents */}
              {isEditable() && !showEditor && (
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setShowEditor(true); 
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg backdrop-blur-sm transition-colors text-sm font-medium flex items-center gap-2"
                  title="Edit with Google Drive (E)"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
              )}

              {/* ✅ Back to Preview button when in editor */}
              {showEditor && (
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setShowEditor(false); 
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg backdrop-blur-sm transition-colors text-sm font-medium flex items-center gap-2"
                  title="Back to Preview"
                >
                  <FileText className="w-4 h-4" />
                  Preview
                </button>
              )}

              {/* Image-specific controls */}
              {fileType === 'image' && !showEditor && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
                    title="Zoom Out (-)"
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
              {!showEditor && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
                  title="Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
              )}

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
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (showEditor) {
                    setShowEditor(false);
                  } else {
                    onClose();
                  }
                }}
                className="p-2 bg-white/10 hover:bg-red-500/80 rounded-lg backdrop-blur-sm transition-colors"
                title={showEditor ? "Back to Preview (Esc)" : "Close (Esc)"}
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
          {/* Navigation Buttons - Hide in editor mode */}
          {showNavigation && !showEditor && (
            <>
              {hasPrev && (
                <button
                  onClick={(e) => { e.stopPropagation(); onPrev(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all z-10 group"
                  title="Previous (←)"
                >
                  <ChevronLeft className="w-8 h-8 text-white" />
                </button>
              )}
              {hasNext && (
                <button
                  onClick={(e) => { e.stopPropagation(); onNext(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all z-10 group"
                  title="Next (→)"
                >
                  <ChevronRight className="w-8 h-8 text-white" />
                </button>
              )}
            </>
          )}

          {/* Content Renderer */}
          <div className="max-w-7xl max-h-[calc(100vh-8rem)] w-full h-full flex items-center justify-center">
            {/* ===== IMAGE VIEWER ===== */}
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

            {/* ===== VIDEO VIEWER ===== */}
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
                  <source src={viewUrl} type={asset.mimeType || 'video/mp4'} />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {/* ===== DOCUMENT/PDF VIEWER with EDITOR ===== */}
            {(fileType === 'pdf' || fileType === 'document') && (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                {/* ✅ SHOW EDITOR if showEditor is true and file is editable */}
                {showEditor && isEditable() ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-2xl"
                  >
                    <GoogleEditorIntegration
                      document={asset}
                      onSave={() => {
                        setShowEditor(false);
                        // Optionally refresh the asset data
                        window.location.reload();
                      }}
                      onClose={() => setShowEditor(false)}
                    />
                  </motion.div>
                ) : (
                  /* ✅ SHOW PREVIEW MODE */
                  <>
                    {/* Document Card Panel */}
                    <motion.div
                      key={asset.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className={`w-full max-w-6xl h-[75vh] bg-gradient-to-br ${docConfig.bgGradient} rounded-2xl border ${docConfig.borderColor} shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl`}
                    >
                      {/* Document Header Bar */}
                      <div className={`flex items-center justify-between px-5 py-3 border-b ${docConfig.borderColor} bg-slate-900/50 backdrop-blur-md`}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${docConfig.bgGradient} ${docConfig.borderColor} border`}>
                            <DocIcon className={`w-5 h-5 ${docConfig.textColor}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white truncate">
                              {asset.title || asset.filename}
                            </p>
                            <p className="text-xs text-white/60 truncate">
                              {asset.mimeType || docConfig.label}
                            </p>
                          </div>
                        </div>

                        {/* Quick Meta Info */}
                        <div className="flex items-center gap-4 text-xs text-white/70">
                          {asset.pageCount && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5">
                              <FileText className="w-3.5 h-3.5" />
                              <span>{asset.pageCount} {asset.pageCount === 1 ? 'page' : 'pages'}</span>
                            </div>
                          )}
                          {asset.fileSizeFormatted && (
                            <div className="px-2.5 py-1 rounded-md bg-white/5">
                              {asset.fileSizeFormatted}
                            </div>
                          )}
                          {asset.currentVersion && (
                            <div className="px-2.5 py-1 rounded-md bg-white/5">
                              v{asset.currentVersion}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* DocViewer Container */}
                      <div className="flex-1 bg-slate-950/60 relative overflow-hidden">
                        {docViewerReady ? (
                          <DocViewer
                            documents={[{
                              uri: viewUrl,
                              fileType: asset.mimeType || 'application/pdf',
                              fileName: asset.filename
                            }]}
                            config={{
                              header: {
                                disableHeader: false,
                                disableFileName: true,
                                retainURLParams: false
                              }
                            }}
                            className="h-full"
                            style={{ width: '100%', height: '100%' }}
                            onDocumentLoadSuccess={() => setLoading(false)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <div className={`w-12 h-12 border-4 border-${docConfig.color}-500/20 border-t-${docConfig.color}-500 rounded-full animate-spin mx-auto mb-4`} />
                              <p className="text-white/70 text-sm">Preparing document viewer...</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Document Action Bar */}
                      <div className={`flex items-center justify-between px-5 py-3 border-t ${docConfig.borderColor} bg-slate-900/50 backdrop-blur-md`}>
                        <div className="flex items-center gap-2">
                          {/* ✅ Edit button in action bar */}
                          {isEditable() && (
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setShowEditor(true); 
                              }}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 transition-all text-xs font-medium text-green-300`}
                              title="Edit with Google Drive"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Document</span>
                            </button>
                          )}

                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenInNewTab(); }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border ${docConfig.borderColor} transition-all text-xs font-medium text-white/90`}
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open in Tab</span>
                          </button>

                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border ${docConfig.borderColor} transition-all text-xs font-medium text-white/90`}
                            title="Copy link"
                          >
                            {copied ? (
                              <>
                                <span className="text-green-400">✓</span>
                                <span className="text-green-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <LinkIcon className="w-3.5 h-3.5" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>

                          {showDownload && onDownload && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onDownload(asset); }}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-${docConfig.color}-500/20 hover:bg-${docConfig.color}-500/30 border ${docConfig.borderColor} transition-all text-xs font-medium ${docConfig.textColor}`}
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </button>
                          )}
                        </div>

                        <div className="text-xs text-white/60">
                          {asset.uploader && (
                            <span>Uploaded by {asset.uploader.name || asset.uploader.email}</span>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Document Meta Footer */}
                    <div className="flex items-center justify-between w-full max-w-6xl text-xs text-white/50 px-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${docConfig.bgGradient} border ${docConfig.borderColor} ${docConfig.textColor} font-medium`}>
                          {docConfig.label}
                        </span>
                        {isEditable() && (
                          <span className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-medium">
                            ✏️ Editable
                          </span>
                        )}
                        {asset.tags && asset.tags.length > 0 && (
                          <span className="text-white/40">
                            Tags: {asset.tags.join(', ')}
                          </span>
                        )}
                      </div>
                      <span className="text-white/40">
                        Uploaded {new Date(asset.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ===== UNKNOWN FILE TYPE ===== */}
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

            {/* ===== LOADING STATE ===== */}
            {loading && !error && fileType !== 'document' && fileType !== 'pdf' && !showEditor && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="text-center text-white">
                  <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-lg font-semibold">Loading {fileType}...</p>
                </div>
              </div>
            )}

            {/* ===== ERROR STATE ===== */}
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

        {/* ===== BOTTOM INFO BAR (For Images/Videos only) ===== */}
        {(fileType === 'image' || fileType === 'video') && !showEditor && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between text-white text-sm">
              <div className="flex items-center gap-4">
                {asset.fileSizeFormatted && (
                  <span className="text-white/70">
                    Size: {asset.fileSizeFormatted}
                  </span>
                )}
                {asset.dimensions && (
                  <span className="text-white/70">
                    {asset.dimensions}
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
        )}
      </motion.div>
    </AnimatePresence>
  );
}
