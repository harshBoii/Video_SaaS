'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, ChevronDown, CheckCircle, Clock, 
  User, Calendar, FileVideo, Loader2,
  ArrowLeftRight, Sparkles, AlertCircle, Play, Eye
} from 'lucide-react';
import { showSuccess, showError, showConfirm } from '@/app/lib/swal';

export default function VersionSelector({ videoId, currentVersion, onVersionChange, onCompare, loading }) {
  const [versions, setVersions] = useState([]);
  const [videoData, setVideoData] = useState(null);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activating, setActivating] = useState(null);
  const [selectedForCompare, setSelectedForCompare] = useState([]);

  useEffect(() => {
    if (videoId) {
      loadVersions();
    }
  }, [videoId]);

  const loadVersions = async () => {
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/versions`, {
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      
      if (data.success) {
        setVersions(data.versions || []);
        setVideoData(data.video || null);
      } else {
        throw new Error(data.error || 'Failed to load versions');
      }
    } catch (error) {
      console.error('[VERSION SELECTOR] Failed to load versions:', error);
      showError('Error', 'Failed to load version history');
      setVersions([]);
    } finally {
      setLoadingVersions(false);
    }
  };

  // ✅ NEW: Preview version (view without activating)
  const handlePreviewVersion = (version) => {
    if (!version.streamId || version.status !== 'ready') {
      showError('Error', 'This version is not ready for preview');
      return;
    }
    
    if (onVersionChange) {
      onVersionChange(version.version, version.streamId, version.thumbnailUrl);
      setShowDropdown(false);
    }
  };

  const handleActivateVersion = async (versionId, versionNumber) => {
    const result = await showConfirm(
      'Switch Version?',
      `Activate version ${versionNumber}? This will become the active playback version.`,
      'Yes, Activate',
      'Cancel'
    );

    if (!result.isConfirmed) return;

    setActivating(versionId);
    try {
      const res = await fetch(
        `/api/videos/${videoId}/versions/${versionId}/activate`, 
        {
          method: 'PATCH',
          credentials: 'include',
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      
      if (data.success) {
        showSuccess('Success!', `Version ${versionNumber} is now active`);
        
        // Reload versions to get updated active status
        await loadVersions();
        
        // Also preview the newly activated version
        const activatedVersion = versions.find(v => v.id === versionId);
        if (activatedVersion && onVersionChange) {
          onVersionChange(activatedVersion.version, activatedVersion.streamId, activatedVersion.thumbnailUrl);
        }
      } else {
        throw new Error(data.error || 'Activation failed');
      }
    } catch (error) {
      console.error('[VERSION SELECTOR] Activation error:', error);
      showError('Error', error.message || 'Failed to activate version');
    } finally {
      setActivating(null);
    }
  };

  const handleSelectForCompare = (versionId) => {
    setSelectedForCompare(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      }
      if (prev.length >= 2) {
        return [prev[1], versionId];
      }
      return [...prev, versionId];
    });
  };

  const handleCompare = () => {
    if (selectedForCompare.length === 2 && onCompare) {
      onCompare(selectedForCompare);
      setShowDropdown(false);
      setSelectedForCompare([]);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'ready':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'processing':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'uploading':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed':
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'ready':
        return <CheckCircle className="w-3.5 h-3.5" />;
      case 'processing':
      case 'uploading':
        return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
      default:
        return <Clock className="w-3.5 h-3.5" />;
    }
  };

  if (loadingVersions) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin text-white" />
        <span className="text-sm text-white font-medium">Loading versions...</span>
      </div>
    );
  }

  const displayVersion = currentVersion || videoData?.currentVersion || 1;

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
      >
        <motion.div
          animate={{ rotate: showDropdown ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <History className="w-4 h-4 text-white" />
        </motion.div>
        <span className="text-sm font-semibold text-white">
          v{displayVersion}
        </span>
        {versions.length > 1 && (
          <span className="text-xs text-white/70">
            ({versions.length} {versions.length === 1 ? 'version' : 'versions'})
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-white/70 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-10" 
              onClick={() => {
                setShowDropdown(false);
                setSelectedForCompare([]);
              }}
            />
            
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", damping: 20 }}
              className="absolute top-full left-0 mt-2 w-[480px] bg-white border border-gray-200 rounded-xl shadow-2xl z-20 max-h-[600px] overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900">Version History</h3>
                    {videoData && (
                      <span className="text-xs text-gray-500 truncate max-w-[200px]">
                        {videoData.title}
                      </span>
                    )}
                  </div>
                  
                  {selectedForCompare.length === 2 && (
                    <motion.button
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCompare}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-xs font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      Compare
                    </motion.button>
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  {selectedForCompare.length === 0 
                    ? `${versions.length} version${versions.length !== 1 ? 's' : ''} available`
                    : `${selectedForCompare.length} selected for comparison`
                  }
                </p>
              </div>

              {/* Versions List */}
              <div className="overflow-y-auto max-h-[500px]">
                {versions.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileVideo className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">No versions available</p>
                  </div>
                ) : (
                  versions.map((version, index) => {
                    const isSelected = selectedForCompare.includes(version.id);
                    const isDisabled = !isSelected && selectedForCompare.length >= 2;
                    const canActivate = !version.isActive && version.status === 'ready';
                    const canPreview = version.status === 'ready' && version.streamId;
                    const isCurrentlyViewing = version.version === displayVersion;
                    
                    return (
                      <motion.div
                        key={version.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-all ${
                          version.isActive ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                        } ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''} ${
                          isCurrentlyViewing && !version.isActive ? 'bg-purple-50 border-l-4 border-l-purple-500' : ''
                        }`}
                      >
                        {/* Version Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <FileVideo className="w-5 h-5 text-gray-600" />
                            <span className="font-bold text-gray-900">
                              Version {version.version}
                            </span>
                            
                            {version.isActive && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Active
                              </motion.div>
                            )}

                            {isCurrentlyViewing && !version.isActive && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold"
                              >
                                <Eye className="w-3 h-3" />
                                Viewing
                              </motion.div>
                            )}
                          </div>
                          
                          {/* ✅ Action Buttons */}
                          <div className="flex gap-2">
                            {canPreview && !isCurrentlyViewing && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handlePreviewVersion(version)}
                                className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 px-3 py-1 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"
                                title="Preview this version"
                              >
                                <Eye className="w-3 h-3" />
                                Preview
                              </motion.button>
                            )}

                            {canActivate && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleActivateVersion(version.id, version.version)}
                                disabled={activating === version.id}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 px-3 py-1 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors disabled:cursor-not-allowed flex items-center gap-1"
                              >
                                {activating === version.id ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Activating...</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3 h-3" />
                                    <span>Activate</span>
                                  </>
                                )}
                              </motion.button>
                            )}
                          </div>
                        </div>

                        {/* Version Note */}
                        {version.versionNote && (
                          <div className="mb-3 p-3 bg-blue-50/50 border-l-4 border-blue-400 rounded-r-lg">
                            <p className="text-sm text-gray-700 italic">
                              "{version.versionNote}"
                            </p>
                          </div>
                        )}

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                            <User className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                            <span className="text-gray-700 truncate">
                              {version.uploaderName || 'Unknown'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                            <Calendar className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                            <span className="text-gray-700 truncate">
                              {formatDate(version.createdAt)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                            <FileVideo className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                            <span className="text-gray-700">
                              {version.fileSizeFormatted || 'Unknown size'}
                            </span>
                          </div>
                          
                          <div className={`flex items-center gap-1.5 p-2 rounded-lg border ${getStatusColor(version.status)}`}>
                            {getStatusIcon(version.status)}
                            <span className="font-semibold capitalize">
                              {version.status || 'unknown'}
                            </span>
                          </div>
                        </div>

                        {/* Compare Checkbox */}
                        {version.status === 'ready' && (
                          <motion.label 
                            whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                            className={`flex items-center gap-2 p-2 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50' 
                                : isDisabled 
                                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                                : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectForCompare(version.id)}
                              disabled={isDisabled}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
                            />
                            <span className={`text-xs font-medium ${
                              isSelected ? 'text-blue-700' : 'text-gray-600'
                            }`}>
                              {isSelected ? 'Selected for comparison' : 'Select for comparison'}
                            </span>
                          </motion.label>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Footer Hint */}
              {selectedForCompare.length > 0 && selectedForCompare.length < 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-yellow-50 border-t border-yellow-200 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  <p className="text-xs text-yellow-700 font-medium">
                    Select one more version to compare
                  </p>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
