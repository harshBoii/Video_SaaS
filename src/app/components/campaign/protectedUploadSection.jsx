'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  FileVideo,
  Lock,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus,
  X
} from 'lucide-react';
import { useCampaignPermissions } from '@/app/context/permissionContext';

// Helper function to convert permission names to title case
function toTitleCase(str = '') {
  return str
    .replace(/^[-_]*(.)/, (_, c) => c.toUpperCase())
    .replace(/[-_]+(.)/g, (_, c) => ' ' + c.toUpperCase());
}

export function ProtectedUploadSection({ 
  campaign, 
  loading, 
  uploadQueue = [], 
  onFileUpload, 
  onClearQueue,
  onRemoveFromQueue ,
  acceptedFileTypes = "video/*",  // Customizable: "image/*", ".pdf,.doc,.docx", etc.
  uploadButtonText = "Upload Videos", // Customizable button text
  assetType = "video"  // 'video', 'image', or 'document'
}) {
  const { permissionsData, loading: permissionsLoading } = useCampaignPermissions();
  const MAX_FILES = 5;

  if (permissionsLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Video</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!permissionsData) {
    return null;
  }

  // Check permissions
  const isAdmin = permissionsData.isAdmin === true;
  const isSuperAdmin = permissionsData.role?.toLowerCase() === 'superadmin' || 
                       permissionsData.role?.toLowerCase() === 'admin';
  const hasSuperAdminPermission = permissionsData.permissions?.some(p => 
    toTitleCase(p).toLowerCase() === 'superadmin all'
  );

  const permissions = permissionsData.permissions || [];
  const standardized = permissions.map(toTitleCase);
  const requiredPermissions = ['Upload Video'];
  const hasPermission = requiredPermissions.some(perm => standardized.includes(perm));

  const allowed = isAdmin || isSuperAdmin || hasSuperAdminPermission || hasPermission;

  const getAssetConfig = () => {
    switch(assetType) {
      case 'image':
        return {
          icon: <ImageIcon className="w-12 h-12 text-blue-500 mx-auto mb-3" />,
          fileIcon: <ImageIcon className="w-10 h-10 text-gray-400 flex-shrink-0 mt-0.5" />,
          title: 'Upload Images',
          description: 'JPG, PNG, GIF, WEBP, SVG up to 50MB',
          types: 'images'
        };
      case 'document':
        return {
          icon: <FileText className="w-12 h-12 text-blue-500 mx-auto mb-3" />,
          fileIcon: <FileText className="w-10 h-10 text-gray-400 flex-shrink-0 mt-0.5" />,
          title: 'Upload Documents',
          description: 'PDF, DOC, DOCX, XLS, XLSX, PPT, TXT, CSV up to 100MB',
          types: 'documents'
        };
      default: // video
        return {
          icon: <FileVideo className="w-12 h-12 text-blue-500 mx-auto mb-3" />,
          fileIcon: <FileVideo className="w-10 h-10 text-gray-400 flex-shrink-0 mt-0.5" />,
          title: 'Upload Videos',
          description: 'MP4, MOV, AVI, MKV, WEBM up to 100GB',
          types: 'videos'
        };
    }
  };

  const assetConfig = getAssetConfig();

  // If no permission, show restricted message
  if (!allowed) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Video</h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-lg font-medium text-gray-600 mb-1">
            Upload Restricted
          </p>
          <p className="text-sm text-gray-500">
            You don't have permission to upload {assetConfig.types} to this campaign
          </p>
        </div>
      </div>
    );
  }

  const isUploading = uploadQueue.some(item => item.status === 'uploading');
  const hasFiles = uploadQueue.length > 0;

  // Calculate stats
  const completedCount = uploadQueue.filter(item => item.status === 'completed').length;
  const failedCount = uploadQueue.filter(item => item.status === 'failed').length;
  const uploadingCount = uploadQueue.filter(item => item.status === 'uploading').length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Upload New {assetConfig.title}</h3>
        {hasFiles && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {completedCount}/{uploadQueue.length} completed
            </span>
            {!isUploading && (
              <button
                onClick={onClearQueue}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Upload Drop Zone */}
      {!hasFiles && (
        <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors bg-blue-50/50">
          <label className="cursor-pointer block">
            {assetConfig.icon}
            <p className="text-lg font-medium text-gray-900 mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-sm text-gray-600 mb-2">
             {assetConfig.description}
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Upload multiple files at once
            </p>
            <input
              type="file"
              accept={acceptedFileTypes}
              multiple
              onChange={onFileUpload}
              className="hidden"
              disabled={loading}
            />
            <div className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              {uploadButtonText}
            </div>
          </label>
        </div>
      )}

      {/* Upload Queue */}
      {hasFiles && (
        <div className="space-y-3">
          {/* Summary Stats */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 text-sm">
            <div className="flex items-center gap-4">
              {uploadingCount > 0 && (
                <span className="flex items-center gap-1.5 text-blue-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  {uploadingCount} uploading
                </span>
              )}
              {completedCount > 0 && (
                <span className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  {completedCount} completed
                </span>
              )}
              {failedCount > 0 && (
                <span className="flex items-center gap-1.5 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {failedCount} failed
                </span>
              )}
            </div>

            {/* Add more files button */}
            {uploadQueue.length < MAX_FILES && (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept={acceptedFileTypes}
                  multiple
                  onChange={onFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <span className="text-blue-600 hover:text-blue-700 flex items-center gap-1.5 text-sm font-medium">
                  <Plus className="w-4 h-4" />
                  Add More
                </span>
              </label>
            )}
          </div>

          {/* Upload Items */}
          {uploadQueue.map(item => (
            <UploadQueueItem
              key={item.id}
              item={item}
              onRemove={onRemoveFromQueue}
              disabled={item.status === 'uploading'}
              icon={assetConfig.fileIcon}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Individual Upload Item Component
export function UploadQueueItem({ item, onRemove, disabled }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'uploading': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      case 'uploading': return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
         {icon || <FileVideo className="w-10 h-10 text-gray-400 flex-shrink-0 mt-0.5" />}
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate" title={item.file.name}>
              {item.file.name}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-500">
                {(item.file.size / 1024 / 1024).toFixed(2)} MB
              </span>
              {item.status === 'uploading' && (
                <span className="text-xs text-blue-600 font-medium">
                  {item.progress}%
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-3">
          {/* Status Badge */}
          <span className={`px-2 py-1 text-xs rounded-md border flex items-center gap-1.5 ${getStatusColor(item.status)}`}>
            {getStatusIcon(item.status)}
            {item.status}
          </span>

          {/* Remove Button */}
          {!disabled && (
            <button
              onClick={() => onRemove(item.id)}
              className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
              title="Remove"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {item.status === 'uploading' && (
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${item.progress}%` }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
          />
        </div>
      )}

      {/* Error Message */}
      {item.status === 'failed' && item.error && (
        <div className="mt-2 flex items-start gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{item.error}</span>
        </div>
      )}

      {/* Success Message */}
      {item.status === 'completed' && (
        <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>Upload complete and queued for processing</span>
        </div>
      )}
    </div>
  );
}
