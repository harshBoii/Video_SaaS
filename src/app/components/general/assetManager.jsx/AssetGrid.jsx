// components/asset-library/AssetGrid.jsx
import { motion } from 'framer-motion';
import { FolderOpen } from 'lucide-react';
import AssetCard from './AssetCard';

export default function AssetGrid({ 
  assets, 
  loading, 
  view, 
  userRole, 
  onVisibilityClick, 
  onRefresh,
  onAssetClick 
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="glass-card animate-pulse">
            <div className="aspect-video bg-[var(--glass-hover)] rounded-t-2xl" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-[var(--glass-hover)] rounded-lg w-3/4" />
              <div className="h-4 bg-[var(--glass-hover)] rounded-lg w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 px-4"
      >
        <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-violet-500/20 rounded-2xl flex items-center justify-center mb-6">
          <FolderOpen className="w-12 h-12 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No assets found</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Try adjusting your filters or upload new assets to get started
        </p>
      </motion.div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  if (view === 'list') {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {assets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            view="list"
            userRole={userRole}
            onVisibilityClick={onVisibilityClick}
            onRefresh={onRefresh}
            onAssetClick={onAssetClick}
          />
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          view="grid"
          userRole={userRole}
          onVisibilityClick={onVisibilityClick}
          onRefresh={onRefresh}
          onAssetClick={onAssetClick}
        />
      ))}
    </motion.div>
  );
}
