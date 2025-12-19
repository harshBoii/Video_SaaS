// components/asset-library/AssetLibrary.jsx
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AssetFilters from './AssetFilter';
import AssetSearch from './AssetSearch';
import AssetSort from './AssetSort';
import AssetGrid from './AssetGrid';
import ViewToggle from './ViewToggle';
import UploadButton from './UploadButton';
import VisibilityModal from './VisibilityModal';
import AssetViewerModal from '../../nonVideoAssets/AssetViewer';
import VideoPlayer from '../../video/VideoPlayer';
import { CampaignPermissionsProvider } from '@/app/context/permissionContext';

export default function AssetLibrary({ userRole = 'employee', userId, companyId }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);

  // Modal states for viewing assets
  const [playingVideo, setPlayingVideo] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    assetType: 'all',
    campaignId: 'all',
    status: 'all',
    dateRange: 'all',
    search: ''
  });

  // Sort state
  const [sortBy, setSortBy] = useState('createdAt-desc');

  // Separate assets by type for navigation
  const { videos, images, documents } = useMemo(() => {
    return {
      videos: assets.filter(asset => asset.assetType === 'VIDEO'),
      images: assets.filter(asset => asset.assetType === 'IMAGE'),
      documents: assets.filter(asset => asset.assetType === 'DOCUMENT')
    };
  }, [assets]);

  // Fetch assets
  useEffect(() => {
    fetchAssets();
  }, [filters, sortBy]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        sortBy,
        userId,
        companyId,
        userRole
      });

      const response = await fetch(`/api/assets?${queryParams}`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAssets(data.assets || []);
      } else {
        console.error('Failed to fetch assets:', data.error);
        setAssets([]);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleVisibilityClick = (asset) => {
    setSelectedAsset(asset);
    setShowVisibilityModal(true);
  };

  // Handle asset click to open appropriate modal
  const handleAssetClick = (asset) => {
    if (asset.assetType === 'VIDEO') {
      setPlayingVideo(asset);
    } else if (asset.assetType === 'IMAGE') {
      setViewingImage(asset);
    } else if (asset.assetType === 'DOCUMENT') {
      setViewingDocument(asset);
    }
  };

  // Download handlers
  const downloadImage = async (assetId, title) => {
    try {
      const response = await fetch(`/api/assets/${assetId}/download`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = title;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const downloadDocument = async (assetId, title) => {
    try {
      const response = await fetch(`/api/assets/${assetId}/download`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = title;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  // Navigation helpers for images
  const currentImageIndex = images.findIndex(img => img.id === viewingImage?.id);
  const handleNextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setViewingImage(images[currentImageIndex + 1]);
    }
  };
  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setViewingImage(images[currentImageIndex - 1]);
    }
  };

  // Navigation helpers for documents
  const currentDocumentIndex = documents.findIndex(doc => doc.id === viewingDocument?.id);
  const handleNextDocument = () => {
    if (currentDocumentIndex < documents.length - 1) {
      setViewingDocument(documents[currentDocumentIndex + 1]);
    }
  };
  const handlePrevDocument = () => {
    if (currentDocumentIndex > 0) {
      setViewingDocument(documents[currentDocumentIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-[1920px] mx-auto p-6 lg:p-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Asset Library
              </h1>
              <p className="text-slate-600 mt-2">
                Manage your videos, documents, and media files
              </p>
            </div>
            <UploadButton onUploadComplete={fetchAssets} />
          </div>

          {/* Search and Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 w-full lg:max-w-2xl">
              <AssetSearch
                value={filters.search}
                onChange={(value) => handleFilterChange('search', value)}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <AssetSort value={sortBy} onChange={setSortBy} />
              <ViewToggle view={view} onChange={setView} />
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:w-72 shrink-0"
          >
            <AssetFilters
              filters={filters}
              onChange={handleFilterChange}
              userRole={userRole}
              companyId={companyId}
              userId={userId}
            />
          </motion.aside>

          {/* Asset Grid */}
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-1 min-w-0"
          >
            <AssetGrid
              assets={assets}
              loading={loading}
              view={view}
              userRole={userRole}
              onVisibilityClick={handleVisibilityClick}
              onRefresh={fetchAssets}
              onAssetClick={handleAssetClick}
            />
          </motion.main>
        </div>
      </div>

      {/* Visibility Modal */}
      <AnimatePresence>
        {showVisibilityModal && selectedAsset && (
          <VisibilityModal
            asset={selectedAsset}
            onClose={() => {
              setShowVisibilityModal(false);
              setSelectedAsset(null);
            }}
            onSave={() => {
              fetchAssets();
              setShowVisibilityModal(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Video Player Modal */}
      {playingVideo && (
        <CampaignPermissionsProvider campaignId={playingVideo.campaignId}>
          <VideoPlayer
            video={playingVideo}
            onClose={() => setPlayingVideo(null)}
          />
        </CampaignPermissionsProvider>
      )}

      {/* Image Viewer Modal */}
      <AssetViewerModal
        asset={viewingImage}
        isOpen={!!viewingImage}
        onClose={() => setViewingImage(null)}
        onDownload={(asset) => downloadImage(asset.id, asset.title)}
        showDownload={true}
        showNavigation={images.length > 1}
        onNext={handleNextImage}
        onPrev={handlePrevImage}
        hasNext={currentImageIndex < images.length - 1}
        hasPrev={currentImageIndex > 0}
      />

      {/* Document Viewer Modal */}
      <AssetViewerModal
        asset={viewingDocument}
        isOpen={!!viewingDocument}
        onClose={() => setViewingDocument(null)}
        onDownload={(asset) => downloadDocument(asset.id, asset.title)}
        showDownload={true}
        showNavigation={documents.length > 1}
        onNext={handleNextDocument}
        onPrev={handlePrevDocument}
        hasNext={currentDocumentIndex < documents.length - 1}
        hasPrev={currentDocumentIndex > 0}
      />
    </div>
  );
}
