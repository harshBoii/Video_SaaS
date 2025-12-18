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
  FileSpreadsheet,
  Presentation,
  FileCode,
  Edit3,
  ChevronDown,
  Check,
  Eye,
  Star,
  Clock,
  User,
  Columns2,
  Loader2,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import dynamic from 'next/dynamic';
import GoogleEditorIntegration from './editors/GoogleEditorIntegration';
import DocumentCommentPanel from './DocumentCommentPanel';

// Import DocViewer with proper loading state
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
 * Universal Asset Viewer Modal with Version Management & Comments
 * Supports: Images, Videos, PDFs, DOCX, XLSX, TXT, PPT, etc.
 * Features: Version selection, activation, multi-version comparison, comments
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
  hasPrev = false,
  onVersionChange
}) {
  // View states
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [docViewerReady, setDocViewerReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showComments, setShowComments] = useState(true);

  // Version Management States
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  const [activatingVersion, setActivatingVersion] = useState(null);
  const [previewingVersion, setPreviewingVersion] = useState(null);

  // Fetch versions when asset changes
  useEffect(() => {
    if (asset?.id) {
      fetchVersions();
    }
  }, [asset?.id]);

  const fetchVersions = async () => {
    if (!asset?.id) return;
    
    setLoadingVersions(true);
    try {
      const response = await fetch(`/api/documents/${asset.id}/versions`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch versions');

      const data = await response.json();
      if (data.success) {
        setVersions(data.data || []);
      }
    } catch (error) {
      console.error('[FETCH VERSIONS ERROR]', error);
    } finally {
      setLoadingVersions(false);
    }
  };

  // Activate a version
  const handleActivateVersion = async (versionNumber) => {
    setActivatingVersion(versionNumber);
    try {
      const response = await fetch(`/api/documents/${asset.id}/versions/activate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: versionNumber }),
      });

      if (!response.ok) throw new Error('Failed to activate version');

      const data = await response.json();
      if (data.success) {
        await fetchVersions();
        if (onVersionChange) {
          onVersionChange(versionNumber);
        }
      }
    } catch (error) {
      console.error('[ACTIVATE VERSION ERROR]', error);
    } finally {
      setActivatingVersion(null);
    }
  };

  // Toggle version selection for comparison
  const toggleVersionSelection = (versionNumber) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionNumber)) {
        return prev.filter(v => v !== versionNumber);
      } else {
        if (prev.length >= 3) {
          return [...prev.slice(1), versionNumber];
        }
        return [...prev, versionNumber];
      }
    });
  };

  // Enter comparison mode
  const enterCompareMode = () => {
    if (selectedVersions.length < 2) {
      return;
    }
    setCompareMode(true);
    setPreviewingVersion(null);
    setShowVersionDropdown(false);
  };

  // Get version details
  const getVersionDetails = (versionNumber) => {
    return versions.find(v => v.version === versionNumber);
  };

  // Reset states when asset changes
  useEffect(() => {
    if (asset) {
      setZoom(100);
      setRotation(0);
      setError(null);
      setLoading(true);
      setShowEditor(false);
      setCompareMode(false);
      setSelectedVersions([]);
      setPreviewingVersion(null);
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

  // Load DocViewer after component mounts
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

    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension) || 
        mimeType.startsWith('image/')) {
      return 'image';
    }

    if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(extension) || 
        mimeType.startsWith('video/')) {
      return 'video';
    }

    if (extension === 'pdf' || mimeType === 'application/pdf') {
      return 'pdf';
    }

    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'md', 'rtf'].includes(extension)) {
      return 'document';
    }

    return 'unknown';
  };

  const fileType = getFileType();
  const viewUrl = asset.viewUrl || asset.thumbnailUrl || asset.playbackUrl || asset.url;

  // Get display URL (version or original)
  const getDisplayUrl = () => {
    if (previewingVersion) {
      const version = getVersionDetails(previewingVersion);
      return version?.viewUrl || viewUrl;
    }
    return viewUrl;
  };

  const displayUrl = getDisplayUrl();

  // Check if file is editable via Google Drive
  const isEditable = () => {
    const extension = asset.filename?.split('.').pop()?.toLowerCase();
    return ['docx', 'doc', 'txt', 'rtf', 'xlsx', 'xls', 'csv', 'pptx', 'ppt'].includes(extension);
  };

  // Get document type specific styling
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
      IMAGE: {
        icon: ImageIcon,
        color: 'pink',
        bgGradient: 'from-pink-500/10 to-pink-600/5',
        borderColor: 'border-pink-500/20',
        textColor: 'text-pink-300',
        label: 'Image'
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
    window.open(displayUrl, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(displayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get file icon
  const getFileIcon = () => {
    switch(fileType) {
      case 'image': return <ImageIcon className="w-5 h-5" />;
      case 'video': return <Film className="w-5 h-5" />;
      case 'pdf': 
      case 'document': return <DocIcon className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format file size helper
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Check if comments should be shown for this file type
  const supportsComments = fileType === 'image' || fileType === 'pdf' || fileType === 'document';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 z-[100] flex flex-col"
        onClick={onClose}
      >
        {/* Header Controls */}
        <div className="flex-shrink-0 bg-gradient-to-b from-black/90 to-transparent border-b border-white/5 p-3">
          <div className="max-w-full mx-auto flex items-center justify-between text-white gap-3">
            {/* LEFT: File Info & Version */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* File Icon */}
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm flex-shrink-0">
                {getFileIcon()}
              </div>

              {/* File Info */}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm truncate">{asset.title}</h3>
                <p className="text-xs text-white/60 truncate">{asset.filename}</p>
              </div>

              {/* Version Dropdown */}
              {versions.length > 0 && (
                <div className="relative flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowVersionDropdown(!showVersionDropdown);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors text-xs"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-medium">
                      v{previewingVersion || asset.currentVersion || 1}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showVersionDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Version Dropdown Menu */}
                  <AnimatePresence>
                    {showVersionDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 mt-2 w-80 bg-slate-900 border border-white/20 rounded-lg shadow-2xl overflow-hidden z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Dropdown Header */}
                        <div className="px-3 py-2 border-b border-white/10 bg-slate-800/50">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-xs">Version History</h3>
                            {selectedVersions.length >= 2 && (
                              <button
                                onClick={enterCompareMode}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
                              >
                                <Columns2 className="w-3 h-3" />
                                Compare ({selectedVersions.length})
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Version List */}
                        <div className="max-h-80 overflow-y-auto">
                          {loadingVersions ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            </div>
                          ) : versions.length === 0 ? (
                            <div className="px-3 py-6 text-center text-white/50 text-xs">
                              <AlertCircle className="w-6 h-6 mx-auto mb-1 opacity-50" />
                              <p>No version history</p>
                            </div>
                          ) : (
                            versions.map((version) => (
                              <div
                                key={version.id}
                                className={`px-3 py-2 border-b border-white/5 hover:bg-white/5 transition-colors ${
                                  version.isActive ? 'bg-blue-500/10' : ''
                                } ${previewingVersion === version.version ? 'bg-green-500/10' : ''}`}
                              >
                                <div className="flex items-start gap-2">
                                  {/* Checkbox */}
                                  <input
                                    type="checkbox"
                                    checked={selectedVersions.includes(version.version)}
                                    onChange={() => toggleVersionSelection(version.version)}
                                    className="mt-0.5 w-3.5 h-3.5 rounded border-white/20 bg-white/10 text-blue-600"
                                    onClick={(e) => e.stopPropagation()}
                                  />

                                  {/* Version Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <span className="font-semibold text-xs">v{version.version}</span>
                                      {version.isActive && (
                                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                                          <Star className="w-2.5 h-2.5 fill-current" />
                                          Active
                                        </span>
                                      )}
                                      {previewingVersion === version.version && (
                                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                                          <Eye className="w-2.5 h-2.5" />
                                          Viewing
                                        </span>
                                      )}
                                    </div>

                                    {version.versionNote && (
                                      <p className="text-xs text-white/60 mb-1 line-clamp-1">
                                        {version.versionNote}
                                      </p>
                                    )}

                                    <div className="flex items-center gap-2 text-xs text-white/40">
                                      <span className="flex items-center gap-0.5">
                                        <User className="w-2.5 h-2.5" />
                                        {version.uploader?.name || 'Unknown'}
                                      </span>
                                      <span>•</span>
                                      <span>{formatFileSize(version.fileSize)}</span>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-0.5">
                                    <button
                                      onClick={() => {
                                        setPreviewingVersion(version.version);
                                        setSelectedVersions([version.version]);
                                        setShowVersionDropdown(false);
                                        setCompareMode(false);
                                      }}
                                      className="p-1 hover:bg-white/10 rounded transition-colors"
                                      title="Preview"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>

                                    {!version.isActive && (
                                      <button
                                        onClick={() => handleActivateVersion(version.version)}
                                        disabled={activatingVersion === version.version}
                                        className="p-1 hover:bg-green-500/20 text-green-400 rounded transition-colors disabled:opacity-50"
                                        title="Set as Active"
                                      >
                                        {activatingVersion === version.version ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Check className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* CENTER: Mode Badges */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {compareMode && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 rounded-lg text-xs">
                  <Columns2 className="w-3.5 h-3.5" />
                  <span className="font-medium">Comparing {selectedVersions.length}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCompareMode(false);
                    }}
                    className="ml-1 hover:bg-white/20 rounded p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {previewingVersion && !compareMode && !showEditor && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-600 rounded-lg text-xs">
                  <Eye className="w-3.5 h-3.5" />
                  <span className="font-medium">Preview v{previewingVersion}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewingVersion(null);
                    }}
                    className="ml-1 hover:bg-white/20 rounded p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT: Action Buttons */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Comments Toggle */}
              {supportsComments && !showEditor && !compareMode && (
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setShowComments(!showComments); 
                  }}
                  className={`p-2 rounded-lg backdrop-blur-sm transition-colors ${
                    showComments 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                  title="Toggle Comments"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              )}

              {/* Edit Button */}
              {isEditable() && !showEditor && !compareMode && (
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setShowEditor(true); 
                  }}
                  className="p-2 bg-green-600 hover:bg-green-700 rounded-lg backdrop-blur-sm transition-colors"
                  title="Edit Document"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}

              {/* Back to Preview */}
              {(showEditor || compareMode) && (
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setShowEditor(false);
                    setCompareMode(false);
                  }}
                  className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg backdrop-blur-sm transition-colors"
                  title="Back to Preview"
                >
                  <FileText className="w-4 h-4" />
                </button>
              )}

              {/* Image Controls */}
              {fileType === 'image' && !showEditor && !compareMode && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="px-2.5 py-1 bg-white/10 rounded-lg backdrop-blur-sm text-xs font-medium min-w-[50px] text-center">
                    {zoom}%
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRotate(); }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
                    title="Rotate"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReset(); }}
                    className="px-2.5 py-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors text-xs font-medium"
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
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              )}

              {/* Download */}
              {showDownload && onDownload && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDownload(asset); }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}

              {/* Close */}
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (showEditor || compareMode) {
                    setShowEditor(false);
                    setCompareMode(false);
                  } else if (previewingVersion) {
                    setPreviewingVersion(null);
                  } else {
                    onClose();
                  }
                }}
                className="p-2 bg-white/10 hover:bg-red-500/80 rounded-lg backdrop-blur-sm transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div 
          id="asset-viewer-container"
          className="flex-1 flex overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Asset Viewer Section */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            {/* Navigation Buttons */}
            {showNavigation && !showEditor && !compareMode && (
              <>
                {hasPrev && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all z-20"
                    title="Previous"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                )}
                {hasNext && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all z-20"
                    title="Next"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                )}
              </>
            )}

            {/* Content Renderer */}
            <div className="w-full h-full flex items-center justify-center p-4">
              {/* COMPARISON MODE */}
              {compareMode && selectedVersions.length >= 2 ? (
                <div className="w-full h-full grid grid-cols-2 lg:grid-cols-3 gap-3 overflow-auto">
                  {selectedVersions.map((versionNum) => {
                    const version = getVersionDetails(versionNum);
                    if (!version) return null;

                    return (
                      <motion.div
                        key={version.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900/50 rounded-lg border border-white/10 overflow-hidden flex flex-col"
                      >
                        {/* Version Header */}
                        <div className="px-3 py-2 bg-slate-800/50 border-b border-white/10">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-xs">Version {version.version}</span>
                            {version.isActive && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                Active
                              </span>
                            )}
                          </div>
                          {version.versionNote && (
                            <p className="text-xs text-white/60 truncate">{version.versionNote}</p>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-white/40 mt-1">
                            <span>{formatFileSize(version.fileSize)}</span>
                            <span>•</span>
                            <span>{formatDate(version.createdAt)}</span>
                          </div>
                        </div>

                        {/* Version Preview */}
                        <div className="flex-1 bg-slate-950/60 p-2 flex items-center justify-center min-h-0">
                          {fileType === 'image' ? (
                            <img
                              src={version.viewUrl}
                              alt={`Version ${version.version}`}
                              className="max-w-full max-h-full object-contain rounded"
                            />
                          ) : (
                            <div className="text-center text-white/50 text-xs">
                              <DocIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                              <p>Version {version.version}</p>
                              <p className="mt-1">{formatFileSize(version.fileSize)}</p>
                            </div>
                          )}
                        </div>

                        {/* Version Actions */}
                        <div className="px-3 py-2 bg-slate-800/50 border-t border-white/10 flex items-center justify-between">
                          <button
                            onClick={() => {
                              setPreviewingVersion(version.version);
                              setSelectedVersions([version.version]);
                              setCompareMode(false);
                            }}
                            className="text-xs px-2 py-1 bg-white/5 hover:bg-white/10 rounded transition-colors"
                          >
                            <Eye className="w-3 h-3 inline mr-1" />
                            View
                          </button>
                          {!version.isActive && (
                            <button
                              onClick={() => handleActivateVersion(version.version)}
                              disabled={activatingVersion === version.version}
                              className="text-xs px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors disabled:opacity-50"
                            >
                              {activatingVersion === version.version ? (
                                <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3 inline mr-1" />
                              )}
                              Activate
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <>
                  {/* SINGLE VIEW */}
                  {/* IMAGE VIEWER */}
                  {fileType === 'image' && !showEditor && (
                    <motion.img
                      key={previewingVersion || asset.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={displayUrl}
                      alt={previewingVersion ? `Version ${previewingVersion}` : asset.title}
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

                  {/* VIDEO VIEWER */}
                  {fileType === 'video' && !showEditor && (
                    <div className="w-full h-full max-w-5xl max-h-[85vh]">
                      <video
                        key={previewingVersion || asset.id}
                        controls
                        autoPlay
                        className="w-full h-full rounded-lg"
                        onLoadedData={() => setLoading(false)}
                        onError={() => {
                          setError('Failed to load video');
                          setLoading(false);
                        }}
                      >
                        <source src={displayUrl} type={asset.mimeType || 'video/mp4'} />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}

                  {/* DOCUMENT/PDF VIEWER with EDITOR */}
                  {(fileType === 'pdf' || fileType === 'document') && (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      {showEditor && isEditable() ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="w-full max-w-4xl h-full"
                        >
                          <GoogleEditorIntegration
                            document={asset}
                            onSave={() => {
                              setShowEditor(false);
                              window.location.reload();
                            }}
                            onClose={() => setShowEditor(false)}
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key={previewingVersion || asset.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`w-full ${showComments ? 'max-w-5xl' : 'max-w-6xl'} h-[85vh] bg-gradient-to-br ${docConfig.bgGradient} rounded-xl border ${docConfig.borderColor} shadow-2xl overflow-hidden flex flex-col`}
                        >
                          {/* Document Header */}
                          <div className={`flex items-center justify-between px-4 py-2.5 border-b ${docConfig.borderColor} bg-slate-900/50`}>
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <div className={`p-1.5 rounded-lg bg-gradient-to-br ${docConfig.bgGradient} border ${docConfig.borderColor}`}>
                                <DocIcon className={`w-4 h-4 ${docConfig.textColor}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-white truncate">
                                  {asset.title || asset.filename}
                                </p>
                                <p className="text-xs text-white/50 truncate">
                                  {asset.mimeType || docConfig.label}
                                </p>
                              </div>
                            </div>

                            {/* Document Meta */}
                            <div className="flex items-center gap-2 text-xs text-white/60">
                              {asset.pageCount && (
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5">
                                  <FileText className="w-3 h-3" />
                                  <span>{asset.pageCount} {asset.pageCount === 1 ? 'page' : 'pages'}</span>
                                </div>
                              )}
                              {asset.fileSizeFormatted && (
                                <div className="px-2 py-0.5 rounded-md bg-white/5">
                                  {asset.fileSizeFormatted}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* DocViewer Container */}
                          <div className="flex-1 bg-slate-950/60 relative overflow-hidden">
                            {docViewerReady ? (
                              <DocViewer
                                key={previewingVersion || asset.id}
                                documents={[{
                                  uri: displayUrl,
                                  fileType: asset.mimeType || 'application/pdf',
                                  fileName: previewingVersion 
                                    ? `v${previewingVersion}-${asset.filename}` 
                                    : asset.filename
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
                                  <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                                  <p className="text-white/70 text-xs">Loading document...</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Document Actions */}
                          <div className={`flex items-center justify-between px-4 py-2 border-t ${docConfig.borderColor} bg-slate-900/50`}>
                            <div className="flex items-center gap-1.5">
                              {isEditable() && (
                                <button
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setShowEditor(true); 
                                  }}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 transition-all text-xs font-medium text-green-300"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                              )}

                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenInNewTab(); }}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border ${docConfig.borderColor} transition-all text-xs font-medium text-white/90`}
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Open</span>
                              </button>

                              <button
                                onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border ${docConfig.borderColor} transition-all text-xs font-medium text-white/90`}
                              >
                                {copied ? (
                                  <>
                                    <span className="text-green-400">✓</span>
                                    <span className="text-green-400">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <LinkIcon className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="text-xs text-white/50">
                              {asset.uploader && (
                                <span>By {asset.uploader.name || asset.uploader.email}</span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* UNKNOWN FILE TYPE */}
                  {fileType === 'unknown' && (
                    <div className="text-center text-white">
                      <File className="w-16 h-16 mx-auto mb-3 text-white/50" />
                      <p className="text-lg font-semibold mb-2">Preview Not Available</p>
                      <p className="text-white/70 mb-4 text-sm">
                        This file type cannot be previewed
                      </p>
                      {showDownload && onDownload && (
                        <button
                          onClick={() => onDownload(asset)}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 mx-auto text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download File
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* LOADING STATE */}
              {loading && !error && fileType !== 'document' && fileType !== 'pdf' && !showEditor && !compareMode && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="text-center text-white">
                    <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm font-medium">Loading {fileType}...</p>
                  </div>
                </div>
              )}

              {/* ERROR STATE */}
              {error && (
                <div className="text-center text-white">
                  <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <X className="w-7 h-7 text-red-500" />
                  </div>
                  <p className="text-lg font-semibold mb-2">Failed to Load</p>
                  <p className="text-white/70 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Comment Panel */}
          {showComments && supportsComments && !compareMode && !showEditor && (
            <DocumentCommentPanel
              documentId={asset.id}
              currentVersion={previewingVersion || asset.currentVersion || 1}
              fileType={fileType}
              className="w-[400px] flex-shrink-0 border-l border-white/10"
            />
          )}
        </div>

        {/* Bottom Info Bar - Only for Images/Videos */}
        {(fileType === 'image' || fileType === 'video') && !showEditor && !compareMode && (
          <div className="flex-shrink-0 bg-gradient-to-t from-black/90 to-transparent border-t border-white/5 px-4 py-2">
            <div className="flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-3">
                {asset.fileSizeFormatted && (
                  <span className="text-white/60">
                    {asset.fileSizeFormatted}
                  </span>
                )}
                {asset.dimensions && (
                  <span className="text-white/60">
                    {asset.dimensions}
                  </span>
                )}
                {asset.durationFormatted && (
                  <span className="text-white/60">
                    {asset.durationFormatted}
                  </span>
                )}
              </div>
              <div className="text-white/60">
                Uploaded {formatDate(asset.createdAt)}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
