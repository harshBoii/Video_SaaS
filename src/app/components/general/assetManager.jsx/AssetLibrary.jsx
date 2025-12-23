// components/asset-library/AssetLibrary.jsx
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Image, FileText, Upload, FolderOpen, Search, 
  LayoutGrid, LayoutList, SlidersHorizontal, Sparkles,
  Video, File, Filter, Clock, Star, MoreHorizontal
} from 'lucide-react';
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

// Category icons for quick navigation
const CATEGORY_ITEMS = [
  { id: 'all', label: 'All Files', icon: FolderOpen, color: 'from-violet-500 to-purple-600' },
  { id: 'VIDEO', label: 'Videos', icon: Play, color: 'from-rose-500 to-pink-600' },
  { id: 'IMAGE', label: 'Images', icon: Image, color: 'from-amber-500 to-orange-600' },
  { id: 'DOCUMENT', label: 'Documents', icon: FileText, color: 'from-emerald-500 to-teal-600' },
];

export default function AssetLibrary({ userRole = 'employee', userId, companyId }) {
  const [assets, setAssets] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campaignsLoading, setCampaignsLoading] = useState(true); // ✅ Added this
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

  // Fetch campaigns once on mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Fetch assets when filters or sort change
  useEffect(() => {
    fetchAssets();
  }, [filters, sortBy]);

  const fetchCampaigns = async () => {
    setCampaignsLoading(true);
    try {
      const response = await fetch('/api/campaigns', {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (result.success && result.data?.campaigns) {
        setCampaigns(result.data.campaigns);
      } else {
        console.error('Failed to fetch campaigns');
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
    } finally {
      setCampaignsLoading(false);
    }
  };

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

  // Get counts for each category
  const categoryCounts = useMemo(() => ({
    all: assets.length,
    VIDEO: videos.length,
    IMAGE: images.length,
    DOCUMENT: documents.length
  }), [assets, videos, images, documents]);

  return (
    <div className="min-h-screen">
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-primary/10 to-cyan-500/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        {/* Floating Shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-primary/30 to-violet-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative max-w-6xl mx-auto px-6 pt-8 pb-12">
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              <span className="bg-gradient-to-r from-primary via-violet-500 to-cyan-500 bg-clip-text text-transparent">
                What will you create
              </span>
              <span className="text-foreground"> today?</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Manage and organize all your creative assets in one place
            </p>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-2 mb-8"
          >
            <button
              onClick={() => handleFilterChange('assetType', 'all')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                filters.assetType === 'all'
                  ? 'bg-foreground text-background shadow-lg'
                  : 'glass-card hover:bg-[var(--glass-hover)] text-foreground'
              }`}
            >
              <FolderOpen className="w-4 h-4 inline-block mr-2" />
              Your Assets
            </button>
            <button
              onClick={() => handleFilterChange('assetType', 'VIDEO')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                filters.assetType === 'VIDEO'
                  ? 'bg-foreground text-background shadow-lg'
                  : 'glass-card hover:bg-[var(--glass-hover)] text-foreground'
              }`}
            >
              <Play className="w-4 h-4 inline-block mr-2" />
              Videos
            </button>
            <button
              onClick={() => handleFilterChange('assetType', 'IMAGE')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                filters.assetType === 'IMAGE'
                  ? 'bg-foreground text-background shadow-lg'
                  : 'glass-card hover:bg-[var(--glass-hover)] text-foreground'
              }`}
            >
              <Image className="w-4 h-4 inline-block mr-2" />
              Images
            </button>
            <button
              onClick={() => handleFilterChange('assetType', 'DOCUMENT')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                filters.assetType === 'DOCUMENT'
                  ? 'bg-foreground text-background shadow-lg'
                  : 'glass-card hover:bg-[var(--glass-hover)] text-foreground'
              }`}
            >
              <FileText className="w-4 h-4 inline-block mr-2" />
              Documents
            </button>
          </motion.div>

          {/* Search Bar - Canva Style */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto mb-10"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-violet-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative glass-card rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search your assets..."
                  className="w-full pl-14 pr-14 py-5 bg-transparent text-lg text-foreground placeholder:text-muted-foreground outline-none rounded-2xl"
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-[var(--glass-hover)] rounded-xl transition-colors">
                  <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Category Icons Row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-4 md:gap-8 flex-wrap"
          >
            {CATEGORY_ITEMS.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleFilterChange('assetType', item.id)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200 ${
                  filters.assetType === item.id ? 'ring-4 ring-primary/30' : ''
                }`}>
                  <item.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <span className="text-xs md:text-sm font-medium text-foreground">{item.label}</span>
                <span className="text-xs text-muted-foreground">{categoryCounts[item.id]}</span>
              </motion.button>
            ))}
            
            {/* Upload Button */}
            <UploadButton 
              onUploadComplete={fetchAssets} 
              campaigns={campaigns}
              campaignsLoading={campaignsLoading}
              variant="canva"
            />
            
            {/* More Options */}
            <motion.button
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[var(--glass-hover)] border-2 border-dashed border-[var(--glass-border)] flex items-center justify-center group-hover:border-primary/50 transition-all duration-200">
                <MoreHorizontal className="w-7 h-7 md:w-8 md:h-8 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-xs md:text-sm font-medium text-foreground">More</span>
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1920px] mx-auto px-6 py-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {filters.assetType === 'all' ? 'All Assets' : 
               filters.assetType === 'VIDEO' ? 'Videos' :
               filters.assetType === 'IMAGE' ? 'Images' : 'Documents'}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {categoryCounts[filters.assetType]} items
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Campaign Filter */}
            <select
              value={filters.campaignId}
              onChange={(e) => handleFilterChange('campaignId', e.target.value)}
              className="px-4 py-2.5 bg-[var(--glass-hover)] border border-[var(--glass-border)] rounded-xl text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all text-foreground"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
            
            <AssetSort value={sortBy} onChange={setSortBy} />
            <ViewToggle view={view} onChange={setView} />
          </div>
        </motion.div>

        {/* Asset Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
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
        </motion.div>
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
