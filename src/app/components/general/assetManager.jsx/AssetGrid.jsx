// components/asset-library/AssetGrid.jsx
import { motion } from 'framer-motion';
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
          <div key={i} className="animate-pulse">
            <div className="bg-white rounded-xl h-72 shadow-sm" />
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
        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">No assets found</h3>
        <p className="text-slate-600 text-center max-w-md">
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
