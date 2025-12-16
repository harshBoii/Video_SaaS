'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Download, 
  Trash2, 
  Eye,
  RefreshCw,
  HardDrive,
  Search,
  X,
  Layers,
  Star,
  Share2,
  File,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';
import { showSuccess, showError, showConfirm } from '@/app/lib/swal';
import ProtectedButton from '../general/protectedButton';
import { CampaignPermissionsProvider } from '@/app/context/permissionContext';
import { ProtectedUploadSection } from './protectedUploadSection';
import AssetViewerModal from '../nonVideoAssets/AssetViewer';

// Helper function
function toTitleCase(str = '') {
  return str
    .replace(/^[-_]*(.)/, (_, c) => c.toUpperCase())
    .replace(/[-_]+(.)/g, (_, c) => ' ' + c.toUpperCase());
}

// Get file icon based on extension
function getFileIcon(filename) {
  const extension = filename?.split('.').pop()?.toLowerCase();
  
  switch(extension) {
    case 'pdf':
      return <FileText className="w-8 h-8 text-red-500" />;
    case 'doc':
    case 'docx':
      return <FileText className="w-8 h-8 text-blue-500" />;
    case 'xls':
    case 'xlsx':
    case 'csv':
      return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
    case 'txt':
    case 'md':
      return <FileCode className="w-8 h-8 text-gray-500" />;
    case 'ppt':
    case 'pptx':
      return <FileText className="w-8 h-8 text-orange-500" />;
    default:
      return <File className="w-8 h-8 text-gray-400" />;
  }
}

// Get file type badge color
function getFileTypeBadge(filename) {
  const extension = filename?.split('.').pop()?.toUpperCase();
  
  const colors = {
    'PDF': 'bg-red-100 text-red-800 border-red-200',
    'DOC': 'bg-blue-100 text-blue-800 border-blue-200',
    'DOCX': 'bg-blue-100 text-blue-800 border-blue-200',
    'XLS': 'bg-green-100 text-green-800 border-green-200',
    'XLSX': 'bg-green-100 text-green-800 border-green-200',
    'CSV': 'bg-green-100 text-green-800 border-green-200',
    'TXT': 'bg-gray-100 text-gray-800 border-gray-200',
    'MD': 'bg-purple-100 text-purple-800 border-purple-200',
    'PPT': 'bg-orange-100 text-orange-800 border-orange-200',
    'PPTX': 'bg-orange-100 text-orange-800 border-orange-200',
  };
  
  return colors[extension] || 'bg-gray-100 text-gray-800 border-gray-200';
}

// Loading Skeleton Component
function DocumentTableSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <tr key={i} className="border-b border-gray-200">
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

// Main Component
export default function CampaignScripts({ campaign, onUpdate, campaignId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDocuments, setFetchingDocuments] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('');
  const [viewingDocument, setViewingDocument] = useState(null);
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState(0);
  const [versionUploadModal, setVersionUploadModal] = useState(null);
  const [versionNote, setVersionNote] = useState('');
  const [showVersionModal, setShowVersionModal] = useState(false);
  const MAX_CONCURRENT_UPLOADS = 2;
  const MAX_FILES = 5;
  const [uploadQueue, setUploadQueue] = useState([]);

  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, [campaign.id]);

  const openVersionUploadModal = (document) => {
    setVersionUploadModal(document);
    setShowVersionModal(true);
  };

  const handleVersionUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!versionUploadModal) {
      showError('Error', 'No document selected');
      return;
    }

    const documentId = versionUploadModal.id;

    if (!versionNote.trim()) {
      showError('Error', 'Please provide a version note');
      return;
    }

    setUploadingFile(file);
    setLoading(true);
    setUploadProgress(0);

    try {
      console.log('[VERSION UPLOAD] Starting upload for:', file.name);

      const startRes = await fetch(`/api/statics/${documentId}/versions?filetype=doc`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionNote: versionNote,
          fileSize: file.size,
          fileName: file.name,
          fileType: file.type,
        })
      });

      if (!startRes.ok) {
        const errorData = await startRes.json();
        throw new Error(errorData.error || 'Failed to start version upload');
      }

      const startData = await startRes.json();
      
      if (!startData.success || !startData.upload || !startData.urls) {
        throw new Error('Invalid response from server');
      }

      const { upload, urls, version } = startData;
      
      console.log('[VERSION UPLOAD] Upload initialized:', {
        versionId: version.id,
        versionNumber: version.version,
        uploadId: upload.uploadId,
        totalParts: upload.totalParts,
      });

      const partSize = upload.partSize;
      const uploadedParts = [];

      for (let i = 0; i < urls.length; i++) {
        const start = i * partSize;
        const end = Math.min(start + partSize, file.size);
        const chunk = file.slice(start, end);

        console.log(`[VERSION UPLOAD] Uploading part ${i + 1}/${urls.length}`);

        let retries = 3;
        let uploadRes;
        
        while (retries > 0) {
          try {
            uploadRes = await fetch(urls[i].url, {
              method: 'PUT',
              body: chunk,
              headers: { 'Content-Type': file.type },
            });

            if (uploadRes.ok) break;
            retries--;
            if (retries === 0) throw new Error(`Failed to upload part ${i + 1}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            retries--;
            if (retries === 0) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        const etag = uploadRes.headers.get('ETag');
        if (!etag) throw new Error(`Part ${i + 1} missing ETag`);

        uploadedParts.push({
          PartNumber: urls[i].partNumber,
          ETag: etag.replace(/"/g, ''),
        });

        setUploadProgress(Math.round(((i + 1) / urls.length) * 100));
      }

      console.log('[VERSION UPLOAD] All parts uploaded, completing...');

      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId: upload.uploadId,
          key: upload.key,
          parts: uploadedParts,
          versionId: version.id,
        })
      });

      if (!completeRes.ok) {
        const errorData = await completeRes.json();
        throw new Error(errorData.error || 'Failed to complete upload');
      }

      const result = await completeRes.json();
      
      if (result.success) {
        console.log('[VERSION UPLOAD] Upload completed:', result);
        await showSuccess('Version Uploaded', `Version ${version.version} uploaded successfully`);
        setShowVersionModal(false);
        setVersionNote('');
        setVersionUploadModal(null);
        fetchDocuments();
        fetchStats();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('[VERSION UPLOAD ERROR]', error);
      await showError('Upload Failed', error.message);
    } finally {
      setLoading(false);
      setUploadingFile(null);
      setUploadProgress(0);
    }
  };

  const fetchDocuments = async () => {
    setFetchingDocuments(true);
    try {
      const response = await fetch(
        `/api/statics/list?projectId=${campaign.id}&filetype=doc&limit=50`,
        { credentials: 'include' }
      );

      const data = await response.json();
      if (data.success) {
        setDocuments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setFetchingDocuments(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `/api/statics/list?projectId=${campaign.id}&filetype=doc&limit=1`,
        { credentials: 'include' }
      );

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;
    
    const currentQueueLength = uploadQueue.length;
    const availableSlots = MAX_FILES - currentQueueLength;
    
    if (files.length > availableSlots) {
      await showError(
        'Too Many Files', 
        `You can only upload ${MAX_FILES} documents at once. You have ${availableSlots} slot(s) remaining.`
      );
      return;
    }

    // Initialize queue with all selected files
    const newQueue = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      progress: 0,
      status: 'pending',
      error: null,
      documentId: null,
    }));

    setUploadQueue(prev => [...prev, ...newQueue]);
    
    // Start processing queue
    processUploadQueue(newQueue);
  };

  const handleClearQueue = () => {
    // Only clear completed/failed items, not uploading ones
    setUploadQueue(prev => 
      prev.filter(item => item.status === 'uploading')
    );
  };

  const handleRemoveFromQueue = (id) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id));
  };

  const processUploadQueue = async (queue) => {
    // Process uploads with concurrency limit
    const chunks = [];
    for (let i = 0; i < queue.length; i += MAX_CONCURRENT_UPLOADS) {
      chunks.push(queue.slice(i, i + MAX_CONCURRENT_UPLOADS));
    }

    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(item => uploadSingleFile(item))
      );
    }

    fetchDocuments();
    fetchStats();
    if (onUpdate) onUpdate();
  };

  const uploadSingleFile = async (queueItem) => {
    const { id, file } = queueItem;

    try {
      // Update status to uploading
      updateQueueItem(id, { status: 'uploading' });

      console.log(`[UPLOAD] Starting upload for: ${file.name}`);

      // Start upload
      const startRes = await fetch('/api/upload/start', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          campaignId: campaign.id,
          metadata: {
            title: file.name.replace(/\.[^/.]+$/, ''),
            description: `Uploaded to ${campaign.name}`,
          }
        })
      });

      if (!startRes.ok) {
        const errorData = await startRes.json();
        throw new Error(errorData.error || 'Failed to start upload');
      }

      const startData = await startRes.json();
      const { upload, urls } = startData;

      // Upload parts
      const partSize = upload.partSize;
      const uploadedParts = [];

      for (let i = 0; i < urls.length; i++) {
        const start = i * partSize;
        const end = Math.min(start + partSize, file.size);
        const chunk = file.slice(start, end);

        let retries = 3;
        let uploadRes;

        while (retries > 0) {
          try {
            uploadRes = await fetch(urls[i].url, {
              method: 'PUT',
              body: chunk,
              headers: { 'Content-Type': file.type },
            });

            if (uploadRes.ok) break;

            retries--;
            if (retries === 0) throw new Error(`Failed to upload part ${i + 1}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (fetchError) {
            retries--;
            if (retries === 0) throw fetchError;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        const etag = uploadRes.headers.get('ETag');
        if (!etag) throw new Error(`Part ${i + 1} uploaded but no ETag received`);

        uploadedParts.push({
          PartNumber: urls[i].partNumber,
          ETag: etag.replace(/"/g, ''),
        });

        // Update progress for this specific file
        const progress = Math.round(((i + 1) / urls.length) * 100);
        updateQueueItem(id, { progress });
      }

      // Complete upload
      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId: upload.uploadId,
          key: upload.key,
          parts: uploadedParts,
        })
      });

      if (!completeRes.ok) {
        const errorData = await completeRes.json();
        throw new Error(errorData.error || 'Failed to complete upload');
      }

      const result = await completeRes.json();

      // Mark as completed
      updateQueueItem(id, {
        status: 'completed',
        progress: 100,
        documentId: result.document?.id,
      });

      console.log(`[UPLOAD] ✅ Completed: ${file.name}`);

    } catch (error) {
      console.error(`[UPLOAD ERROR] ${file.name}:`, error);
      updateQueueItem(id, {
        status: 'failed',
        error: error.message,
      });
    }
  };

  // Helper to update individual queue item
  const updateQueueItem = (id, updates) => {
    setUploadQueue(prev =>
      prev.map(item => item.id === id ? { ...item, ...updates } : item)
    );
  };

  const downloadDocument = async (documentId, title) => {
    try {
      const response = await fetch(`/api/statics/${documentId}/raw?filetype=doc&expiresIn=3600`, {
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        window.open(data.download.url, '_blank');
        await showSuccess('Download Started', `Downloading ${title}`);
      }
    } catch (error) {
      await showError('Download Failed', error.message);
    }
  };

  const viewDocument = (document, index) => {
    setViewingDocument(document);
    setCurrentDocumentIndex(index);
  };

  const handleNextDocument = () => {
    const filteredList = getFilteredDocuments();
    if (currentDocumentIndex < filteredList.length - 1) {
      const nextIndex = currentDocumentIndex + 1;
      setCurrentDocumentIndex(nextIndex);
      setViewingDocument(filteredList[nextIndex]);
    }
  };

  const handlePrevDocument = () => {
    if (currentDocumentIndex > 0) {
      const filteredList = getFilteredDocuments();
      const prevIndex = currentDocumentIndex - 1;
      setCurrentDocumentIndex(prevIndex);
      setViewingDocument(filteredList[prevIndex]);
    }
  };

  const deleteDocument = async (documentId, title) => {
    const result = await showConfirm(
      'Delete Document?',
      `Are you sure you want to delete "${title}"? This will remove it from R2 storage.`,
      'Yes, Delete',
      'Cancel'
    );

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/statics/${documentId}/delete?filetype=doc`, {
          method: 'DELETE',
          credentials: 'include'
        });

        const data = await response.json();
        if (data.success) {
          await showSuccess('Document Deleted', 'Document removed successfully');
          fetchDocuments();
          fetchStats();
          if (onUpdate) onUpdate();
        }
      } catch (error) {
        await showError('Delete Failed', error.message);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'uploading': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready': return <CheckCircle className="w-4 h-4" />;
      case 'uploading': return <Upload className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getFilteredDocuments = () => {
    return documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || doc.status === statusFilter;
      
      let matchesFileType = true;
      if (fileTypeFilter) {
        const extension = doc.filename?.split('.').pop()?.toLowerCase();
        matchesFileType = extension === fileTypeFilter.toLowerCase();
      }
      
      return matchesSearch && matchesStatus && matchesFileType;
    });
  };

  const filteredDocuments = getFilteredDocuments();

  // Get unique file types from documents
  const fileTypes = [...new Set(documents.map(doc => 
    doc.filename?.split('.').pop()?.toUpperCase()
  ))].filter(Boolean);

  return (
    <CampaignPermissionsProvider campaignId={campaignId}>
      <div className="space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Documents</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{stats.totalDocuments || 0}</p>
                </div>
                <div className="bg-blue-500 p-3 rounded-lg group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-white drop-shadow-md" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Ready</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">
                    {stats.statusBreakdown?.ready || 0}
                  </p>
                </div>
                <div className="bg-green-500 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Uploading</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-1">
                    {stats.statusBreakdown?.uploading || 0}
                  </p>
                </div>
                <div className="bg-yellow-500 p-3 rounded-lg">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Total Size</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">
                    {stats.totalSizeFormatted || '0 MB'}
                  </p>
                </div>
                <div className="bg-purple-500 p-3 rounded-lg">
                  <HardDrive className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {uploadQueue.filter(item => item.status === 'uploading').length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Upload className="w-6 h-6 animate-bounce" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                </div>
                <div>
                  <p className="font-semibold">
                    Uploading {uploadQueue.filter(item => item.status === 'uploading').length} document(s)
                  </p>
                  <p className="text-sm opacity-90">
                    Please wait while your documents are being processed...
                  </p>
                </div>
              </div>
              <RefreshCw className="w-5 h-5 animate-spin opacity-75" />
            </div>
          </motion.div>
        )}

        {/* Protected Upload Section */}
        <ProtectedUploadSection
          campaign={campaign}
          loading={loading}
          uploadQueue={uploadQueue}
          onFileUpload={handleFileUpload}
          onClearQueue={handleClearQueue}
          onRemoveFromQueue={handleRemoveFromQueue}
          acceptedFileTypes=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.md"
          uploadButtonText="Upload Documents"
        />

        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {fileTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="ready">Ready</option>
              <option value="uploading">Uploading</option>
              <option value="error">Error</option>
            </select>

            <button
              onClick={() => {
                fetchDocuments();
                fetchStats();
              }}
              disabled={fetchingDocuments}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${fetchingDocuments ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Document
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Versions
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Size
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Uploaded
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {fetchingDocuments ? (
                  <DocumentTableSkeleton />
                ) : filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium mb-1">
                        {searchQuery || statusFilter || fileTypeFilter
                          ? 'No documents match your filters'
                          : 'No documents uploaded yet'
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        {!(searchQuery || statusFilter || fileTypeFilter) && 'Upload your first document to get started!'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc, index) => (
                    <motion.tr
                      key={doc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 transition-all duration-200 border-l-2 border-transparent hover:border-blue-500"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                            {getFileIcon(doc.filename)}
                          </div>
                          <div className="max-w-xs">
                            <p className="font-medium text-gray-900 truncate">{doc.title}</p>
                            <p className="text-sm text-gray-500 truncate">{doc.filename}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getFileTypeBadge(doc.filename)}`}>
                          {doc.filename?.split('.').pop()?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(doc.status)}`}>
                            {getStatusIcon(doc.status)}
                            <span className="capitalize">{doc.status}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
                            <Layers className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold">
                              {doc.versionCount || 1}
                            </span>
                          </div>
                          {doc.currentVersion && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg border border-green-200">
                              <Star className="w-3 h-3 fill-current" />
                              <span className="text-xs font-semibold">
                                v{doc.currentVersion}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {doc.fileSizeFormatted}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5 flex-wrap">
                          <ProtectedButton
                            onClick={() => viewDocument(doc, index)}
                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                            title="View Document"
                            requiredPermissions={['Preview Video']}
                          >
                            <Eye className="w-4 h-4" />
                          </ProtectedButton>
                          <ProtectedButton
                            onClick={() => downloadDocument(doc.id, doc.title)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Download"
                            requiredPermissions={['Download Original']}
                          >
                            <Download className="w-4 h-4" />
                          </ProtectedButton>
                          <ProtectedButton
                            onClick={() => deleteDocument(doc.id, doc.title)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="Delete"
                            requiredPermissions={['Delete Video']}
                          >
                            <Trash2 className="w-4 h-4" />
                          </ProtectedButton>
                          <ProtectedButton
                            onClick={() => openVersionUploadModal(doc)}
                            className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                            title="Upload New Version"
                            requiredPermissions={['Upload Video', 'Version Control']}
                          >
                            <Upload className="w-4 h-4" />
                          </ProtectedButton>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Version Upload Modal */}
        <AnimatePresence>
          {showVersionModal && versionUploadModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => {
                  setShowVersionModal(false);
                  setVersionNote('');
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-white rounded-2xl max-w-md w-full p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                      Upload New Version
                    </h3>
                    <button
                      onClick={() => {
                        setShowVersionModal(false);
                        setVersionNote('');
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Uploading new version for: <span className="font-semibold">{versionUploadModal.title}</span>
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Version Note *
                    </label>
                    <textarea
                      value={versionNote}
                      onChange={(e) => setVersionNote(e.target.value)}
                      placeholder="What changed in this version?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      rows={3}
                    />
                  </div>

                  <label className="block">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.md"
                      onChange={handleVersionUpload}
                      disabled={!versionNote.trim() || loading}
                      className="hidden"
                    />
                    <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      versionNote.trim() && !loading
                        ? 'border-blue-400 bg-blue-50 hover:bg-blue-100'
                        : 'border-gray-300 bg-gray-50 cursor-not-allowed'
                    }`}>
                      <Upload className="w-10 h-10 mx-auto mb-2 text-blue-500" />
                      <p className="text-sm font-medium text-gray-900">
                        {loading ? 'Uploading...' : 'Click to select document file'}
                      </p>
                      {loading && (
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{uploadProgress}%</p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Asset Viewer Modal */}
        <AssetViewerModal
          asset={viewingDocument}
          isOpen={!!viewingDocument}
          onClose={() => setViewingDocument(null)}
          onDownload={(asset) => downloadDocument(asset.id, asset.title)}
          showDownload={true}
          showNavigation={filteredDocuments.length > 1}
          onNext={handleNextDocument}
          onPrev={handlePrevDocument}
          hasNext={currentDocumentIndex < filteredDocuments.length - 1}
          hasPrev={currentDocumentIndex > 0}
        />
      </div>
    </CampaignPermissionsProvider>
  );
}
