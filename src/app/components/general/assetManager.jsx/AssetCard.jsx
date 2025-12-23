// components/asset-library/AssetCard.jsx
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Play, FileText, Image, Eye, FolderOpen, Building2 } from 'lucide-react';
import Badge from './ui/badge';

export default function AssetCard({ 
  asset, 
  view, 
  userRole, 
  onVisibilityClick, 
  onRefresh,
  onAssetClick // New prop to handle asset viewing
}) {
  const [showActions, setShowActions] = useState(false);
  const isVideo = asset.assetType === 'VIDEO';
  const isImage = asset.assetType === 'IMAGE';
  const isDocument = asset.assetType === 'DOCUMENT';
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

  const handleAssetClick = () => {
    onAssetClick?.(asset);
  };

  const getAssetIcon = () => {
    if (isVideo) {
      return (
        <svg className="w-8 h-8 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
      </svg>
    );
  };

  const getAssetTypeLabel = () => {
    if (isVideo) return 'Video';
    if (isImage) return 'Image';
    return asset.documentType || 'Document';
  };

  if (view === 'list') {
    return (
      <motion.div
        variants={cardVariants}
        whileHover={{ scale: 1.01, x: 4 }}
        className="glass-card p-4 hover:shadow-lg transition-all group"
      >
        <div className="flex items-center gap-4">
          {/* Thumbnail */}
          <div 
            className="w-32 h-20 bg-[var(--glass-hover)] rounded-xl overflow-hidden shrink-0 relative cursor-pointer"
            onClick={handleAssetClick}
          >
            {asset.thumbnailUrl ? (
              <img src={asset.thumbnailUrl} alt={asset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {isVideo ? <Play className="w-8 h-8 text-muted-foreground" /> : 
                 isImage ? <Image className="w-8 h-8 text-muted-foreground" /> :
                 <FileText className="w-8 h-8 text-muted-foreground" />}
              </div>
            )}
            {isVideo && asset.duration && (
              <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm text-white text-xs px-1.5 py-0.5 rounded-md font-mono">
                {formatDuration(asset.duration)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 
              className="font-semibold text-foreground truncate mb-1 cursor-pointer group-hover:text-primary transition-colors"
              onClick={handleAssetClick}
            >
              {asset.title}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={isVideo ? 'blue' : isImage ? 'green' : 'purple'}>
                {getAssetTypeLabel()}
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
                className="p-2 hover:bg-[var(--glass-hover)] rounded-xl transition-colors"
                title="Manage Visibility"
              >
                <Eye className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
            <button
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-colors font-medium"
              onClick={handleAssetClick}
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
      className="glass-card hover:shadow-2xl transition-all overflow-hidden group"
    >
      {/* Thumbnail */}
      <div 
        className="relative aspect-video bg-[var(--glass-hover)] overflow-hidden cursor-pointer"
        onClick={handleAssetClick}
      >
        {asset.thumbnailUrl ? (
          <img src={asset.thumbnailUrl} alt={asset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isVideo ? <Play className="w-16 h-16 text-muted-foreground/50" /> : 
             isImage ? <Image className="w-16 h-16 text-muted-foreground/50" /> :
             <FileText className="w-16 h-16 text-muted-foreground/50" />}
          </div>
        )}

        {/* Overlay Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showActions ? 1 : 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center gap-2"
        >
          <button
            onClick={handleAssetClick}
            className="px-4 py-2 bg-white/90 hover:bg-white text-foreground rounded-xl font-medium transition-colors shadow-lg"
          >
            View
          </button>
          {isAdmin && !asset.campaignId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onVisibilityClick(asset);
              }}
              className="p-2 bg-white/90 hover:bg-white rounded-xl transition-colors shadow-lg"
              title="Manage Visibility"
            >
              <Eye className="w-5 h-5 text-foreground" />
            </button>
          )}
        </motion.div>

        {/* Duration Badge */}
        {isVideo && asset.duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg font-mono">
            {formatDuration(asset.duration)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 
          className="font-semibold text-foreground mb-2 truncate cursor-pointer group-hover:text-primary transition-colors" 
          title={asset.title}
          onClick={handleAssetClick}
        >
          {asset.title}
        </h3>

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Badge variant={isVideo ? 'blue' : isImage ? 'green' : 'purple'}>
            {getAssetTypeLabel()}
          </Badge>
          <Badge variant="slate">{formatFileSize(asset.fileSize || asset.originalSize)}</Badge>
        </div>

        {asset.campaign ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FolderOpen className="w-4 h-4" />
            <span className="truncate">{asset.campaign.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <Building2 className="w-4 h-4" />
            <span className="truncate">Company Asset</span>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-[var(--glass-border)] text-xs text-muted-foreground">
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
