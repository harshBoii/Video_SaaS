'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, ChevronDown, CheckCircle, Clock, 
  User, Calendar, FileVideo, Loader2,
  ArrowLeftRight, Sparkles, AlertCircle, Play
} from 'lucide-react';
import { showError } from '@/app/lib/swal';

export default function PublicVersionSelector({ videoId, shareToken, currentVersion, onVersionChange, onCompare, loading }) {
  const [versions, setVersions] = useState([]);
  const [videoData, setVideoData] = useState(null);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);

  useEffect(() => {
    if (videoId && shareToken) {
      loadVersions();
    }
  }, [videoId, shareToken]);

  const loadVersions = async () => {
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/public/video/${shareToken}/versions`);
      
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
      console.error('[PUBLIC VERSION SELECTOR] Failed to load versions:', error);
      showError('Error', 'Failed to load version history');
      setVersions([]);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleVersionSelect = (version) => {
    if (onVersionChange && version.streamId) {
      onVersionChange(version.version, version.streamId, version.thumbnailUrl);
      setShowDropdown(false);
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

  const formatFileSize = (bytes) => {
    const gb = parseFloat(bytes) / (1024 ** 3);
    return `${gb.toFixed(2)} GB`;
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
                    const isCurrentlyViewing = version.version === displayVersion;
                    
                    return (
                      <motion.div
                        key={version.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-all ${
                          isCurrentlyViewing ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        } ${isSelected ? 'bg-purple-50 border-l-4 border-l-purple-500' : ''}`}
                      >
                        {/* Version Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
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

                            {isCurrentlyViewing && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                Viewing
                              </motion.div>
                            )}
                          </div>
                          
                          {!isCurrentlyViewing && version.status === 'ready' && version.streamId && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleVersionSelect(version)}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                            >
                              View
                            </motion.button>
                          )}
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
                              {formatFileSize(version.fileSize)}
                            </span>
                          </div>
                          
                          <div className={`flex items-center gap-1.5 p-2 rounded-lg border ${
                            version.status === 'ready' ? 'bg-green-50 text-green-700 border-green-200' :
                            version.status === 'processing' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                            {version.status === 'ready' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5 animate-spin" />}
                            <span className="font-semibold capitalize">
                              {version.status || 'unknown'}
                            </span>
                          </div>
                        </div>

                        {/* Compare Checkbox */}
                        {version.status === 'ready' && version.streamId && (
                          <motion.label 
                            whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                            className={`flex items-center gap-2 p-2 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-purple-500 bg-purple-50' 
                                : isDisabled 
                                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                                : 'border-gray-300 hover:border-purple-300 hover:bg-purple-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectForCompare(version.id)}
                              disabled={isDisabled}
                              className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed"
                            />
                            <span className={`text-xs font-medium ${
                              isSelected ? 'text-purple-700' : 'text-gray-600'
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
