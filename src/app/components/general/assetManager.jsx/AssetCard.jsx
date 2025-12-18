// components/asset-library/AssetCard.jsx
import { motion } from 'framer-motion';
import { useState } from 'react';
import Badge from '../ui/Badge';

export default function AssetCard({ asset, view, userRole, onVisibilityClick, onRefresh }) {
  const [showActions, setShowActions] = useState(false);
  const isVideo = asset.assetType === 'VIDEO';
  const isAdmin = userRole === 'admin';

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (view === 'list') {
    return (
      <motion.div
        variants={cardVariants}
        whileHover={{ scale: 1.01 }}
        className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-4">
          {/* Thumbnail */}
          <div className="w-32 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg overflow-hidden shrink-0 relative">
            {asset.thumbnailUrl ? (
              <img src={asset.thumbnailUrl} alt={asset.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {isVideo ? (
                  <svg className="w-8 h-8 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                  </svg>
                )}
              </div>
            )}
            {isVideo && asset.duration && (
              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                {formatDuration(asset.duration)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate mb-1">{asset.title}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={isVideo ? 'blue' : 'purple'}>
                {isVideo ? 'Video' : asset.documentType}
              </Badge>
              <Badge variant="slate">{formatFileSize(asset.fileSize || asset.originalSize)}</Badge>
              {asset.campaign && (
                <Badge variant="green">{asset.campaign.name}</Badge>
              )}
              {!asset.campaignId && (
                <Badge variant="amber">Company Asset</Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isAdmin && !asset.campaignId && (
              <button
                onClick={() => onVisibilityClick(asset)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Manage Visibility"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            )}
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              onClick={() => window.open(isVideo ? `/video/${asset.id}` : `/document/${asset.id}`, '_blank')}
            >
              View
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -8, scale: 1.02 }}
      onHoverStart={() => setShowActions(true)}
      onHoverEnd={() => setShowActions(false)}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden">
        {asset.thumbnailUrl ? (
          <img src={asset.thumbnailUrl} alt={asset.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isVideo ? (
              <svg className="w-16 h-16 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            ) : (
              <svg className="w-16 h-16 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
              </svg>
            )}
          </div>
        )}

        {/* Overlay Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showActions ? 1 : 0 }}
          className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2"
        >
          <button
            onClick={() => window.open(isVideo ? `/video/${asset.id}` : `/document/${asset.id}`, '_blank')}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 rounded-lg font-medium transition-colors"
          >
            View
          </button>
          {isAdmin && !asset.campaignId && (
            <button
              onClick={() => onVisibilityClick(asset)}
              className="p-2 bg-white hover:bg-slate-100 rounded-lg transition-colors"
              title="Manage Visibility"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}
        </motion.div>

        {/* Duration Badge */}
        {isVideo && asset.duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(asset.duration)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 mb-2 truncate" title={asset.title}>
          {asset.title}
        </h3>

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Badge variant={isVideo ? 'blue' : 'purple'}>
            {isVideo ? 'Video' : asset.documentType}
          </Badge>
          <Badge variant="slate">{formatFileSize(asset.fileSize || asset.originalSize)}</Badge>
        </div>

        {asset.campaign ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="truncate">{asset.campaign.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="truncate">Company Asset</span>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
          {new Date(asset.createdAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </div>
      </div>
    </motion.div>
  );
}
