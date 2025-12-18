"use client"
import React from 'react';
import { motion } from 'framer-motion';
import AssetListItem from './AssetListItem';

export default function AssetList({ assets, onAssetClick, onDownload }) {
  return (
    <div className="space-y-2">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-800/30 border border-white/5 rounded-lg text-xs font-semibold text-white/50 uppercase tracking-wider">
        <div className="col-span-5">Name</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-2">Campaign</div>
        <div className="col-span-1">Size</div>
        <div className="col-span-1">Modified</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>

      {/* Asset List Items */}
      {assets.map((asset, index) => (
        <motion.div
          key={asset.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.03, duration: 0.3 }}
        >
          <AssetListItem
            asset={asset}
            onClick={() => onAssetClick(asset)}
            onDownload={() => onDownload(asset)}
          />
        </motion.div>
      ))}
    </div>
  );
}
