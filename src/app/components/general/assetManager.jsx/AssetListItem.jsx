"use client"
import React from 'react';
import { 
  Download, 
  Eye, 
  FileText, 
  Image as ImageIcon,
  Film,
  FileSpreadsheet,
  Presentation,
  File
} from 'lucide-react';

export default function AssetListItem({ asset, onClick, onDownload }) {
  const getAssetIcon = () => {
    const iconClass = "w-4 h-4";
    
    switch(asset.documentType) {
      case 'IMAGE': return <ImageIcon className={iconClass} />;
      case 'VIDEO': return <Film className={iconClass} />;
      case 'PDF': 
      case 'DOCUMENT': return <FileText className={iconClass} />;
      case 'SPREADSHEET': return <FileSpreadsheet className={iconClass} />;
      case 'PRESENTATION': return <Presentation className={iconClass} />;
      default: return <File className={iconClass} />;
    }
  };

  const getTypeLabel = () => {
    const labels = {
      'IMAGE': 'Image',
      'VIDEO': 'Video',
      'PDF': 'PDF',
      'DOCUMENT': 'Document',
      'SPREADSHEET': 'Spreadsheet',
      'PRESENTATION': 'Presentation',
      'OTHER': 'File'
    };
    return labels[asset.documentType] || 'File';
  };

  const getTypeColor = () => {
    switch(asset.documentType) {
      case 'IMAGE': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'VIDEO': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'PDF': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'DOCUMENT': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'SPREADSHEET': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'PRESENTATION': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="group grid grid-cols-12 gap-4 px-4 py-3 bg-slate-800/20 hover:bg-slate-800/40 border border-white/5 hover:border-white/10 rounded-lg transition-all cursor-pointer">
      {/* Name with Thumbnail */}
      <div className="col-span-5 flex items-center gap-3 min-w-0" onClick={onClick}>
        {/* Thumbnail */}
        {(asset.documentType === 'IMAGE' || asset.documentType === 'VIDEO') && asset.thumbnailUrl ? (
          <img
            src={asset.thumbnailUrl}
            alt={asset.title}
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-white/10"
          />
        ) : (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor()} border flex-shrink-0`}>
            {getAssetIcon()}
          </div>
        )}
        
        {/* Title & Filename */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
            {asset.title}
          </p>
          <p className="text-xs text-white/40 truncate">{asset.filename}</p>
        </div>
      </div>

      {/* Type */}
      <div className="col-span-2 flex items-center">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${getTypeColor()} border`}>
          {getAssetIcon()}
          <span>{getTypeLabel()}</span>
        </span>
      </div>

      {/* Campaign */}
      <div className="col-span-2 flex items-center">
        {asset.campaign ? (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-white/60 truncate">{asset.campaign.name}</span>
          </div>
        ) : (
          <span className="text-sm text-white/30">—</span>
        )}
      </div>

      {/* Size */}
      <div className="col-span-1 flex items-center">
        <span className="text-sm text-white/50">{asset.fileSizeFormatted || '—'}</span>
      </div>

      {/* Modified Date */}
      <div className="col-span-1 flex items-center">
        <span className="text-sm text-white/50">{formatDate(asset.updatedAt || asset.createdAt)}</span>
      </div>

      {/* Actions */}
      <div className="col-span-1 flex items-center justify-end gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          title="View"
        >
          <Eye className="w-4 h-4 text-white/60 hover:text-white" />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          title="Download"
        >
          <Download className="w-4 h-4 text-white/60 hover:text-white" />
        </button>
      </div>
    </div>
  );
}
