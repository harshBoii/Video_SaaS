// components/asset-library/UploadButton.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, ChevronRight, ChevronLeft, Building2, FolderOpen, Loader2 } from 'lucide-react';

export default function UploadButton({ onUploadComplete, campaigns, campaignsLoading, variant = 'default' }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [uploadType, setUploadType] = useState(null); // 'company' or 'campaign'
  const [uploadingFile, setUploadingFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUploadClick = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCampaign(null);
    setUploadType(null);
  };

  const handleUploadTypeSelect = (type) => {
    setUploadType(type);
  };

  const handleCampaignSelect = (campaignId) => {
    setSelectedCampaign(campaignId);
  };

  const triggerFileInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*,image/*,.pdf,.doc,.docx,.txt';
    input.multiple = false;
    input.onchange = (e) => handleFileUpload(e, uploadType === 'campaign' ? selectedCampaign : null);
    input.click();
  };

  const handleFileUpload = async (event, campaignId) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Detect file type
    const fileType = detectFileType(file);
    if (!fileType) {
      await showError('Invalid File', 'Please select a valid file (video, image, or document).');
      return;
    }

    setUploadingFile(file);
    setUploadProgress(0);
    handleCloseModal();

    try {
      console.log('[UPLOAD] Starting upload for:', file.name, 'Type:', fileType, 'Campaign:', campaignId);
      
      // Get metadata based on file type
      const metadata = await getFileMetadata(file, fileType);

      const startRes = await fetch('/api/upload/start', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          assetType: fileType,
          campaignId,
          metadata: {
            title: file.name.replace(/\.[^/.]+$/, ''),
            description: 'Uploaded from asset library',
            ...metadata,
          },
        }),
      });

      if (!startRes.ok) {
        const errorData = await startRes.json();
        throw new Error(errorData.error || 'Failed to start upload');
      }

      const startData = await startRes.json();
      if (!startData.success || !startData.upload || !startData.urls) {
        throw new Error('Invalid response from server');
      }

      const { upload, urls } = startData;
      console.log('[UPLOAD] Upload initialized:', {
        uploadId: upload.uploadId,
        totalParts: upload.totalParts,
      });

      const partSize = upload.partSize;
      const uploadedParts = [];

      // Upload file in chunks
      for (let i = 0; i < urls.length; i++) {
        const start = i * partSize;
        const end = Math.min(start + partSize, file.size);
        const chunk = file.slice(start, end);

        console.log(`[UPLOAD] Uploading part ${i + 1}/${urls.length}`);

        let retries = 3;
        let uploadRes = null;
        
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

      console.log('[UPLOAD] All parts uploaded, completing...');

      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId: upload.uploadId,
          key: upload.key,
          parts: uploadedParts,
          assetType: fileType,
          ...metadata,
        }),
      });

      if (!completeRes.ok) {
        const errorData = await completeRes.json();
        throw new Error(errorData.error || 'Failed to complete upload');
      }

      const result = await completeRes.json();
      if (result.success) {
        console.log('[UPLOAD] Upload completed successfully');
        await showSuccess('Upload Complete', `${fileType} uploaded successfully!`);
        onUploadComplete?.();
      }
    } catch (error) {
      console.error('[UPLOAD ERROR]', error);
      await showError('Upload Failed', error.message || 'An unexpected error occurred during upload.');
    } finally {
      setUploadingFile(null);
      setUploadProgress(0);
    }
  };

  // Canva-style icon button for category row
  if (variant === 'canva') {
    return (
      <>
        <motion.button
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleUploadClick}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
            <Upload className="w-7 h-7 md:w-8 md:h-8 text-white" />
          </div>
          <span className="text-xs md:text-sm font-medium text-foreground">Upload</span>
        </motion.button>

        {/* Upload Progress Indicator */}
        {uploadingFile && (
          <div className="fixed bottom-6 right-6 glass-card p-4 w-80 z-50 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground truncate mr-2">
                Uploading {uploadingFile.name}
              </span>
              <span className="text-sm text-muted-foreground font-medium">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-[var(--glass-hover)] rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-violet-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload Modal */}
        <UploadModal 
          showModal={showModal}
          handleCloseModal={handleCloseModal}
          uploadType={uploadType}
          handleUploadTypeSelect={handleUploadTypeSelect}
          campaigns={campaigns}
          campaignsLoading={campaignsLoading}
          handleCampaignSelect={handleCampaignSelect}
          triggerFileInput={triggerFileInput}
        />
      </>
    );
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleUploadClick}
        className="px-6 py-3 bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 text-primary-foreground rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2"
      >
        <Upload className="w-5 h-5" />
        Upload Asset
      </motion.button>

      {/* Upload Progress Indicator */}
      {uploadingFile && (
        <div className="fixed bottom-6 right-6 glass-card p-4 w-80 z-50 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-foreground truncate mr-2">
              Uploading {uploadingFile.name}
            </span>
            <span className="text-sm text-muted-foreground font-medium">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-[var(--glass-hover)] rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary to-violet-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal 
        showModal={showModal}
        handleCloseModal={handleCloseModal}
        uploadType={uploadType}
        handleUploadTypeSelect={handleUploadTypeSelect}
        campaigns={campaigns}
        campaignsLoading={campaignsLoading}
        handleCampaignSelect={handleCampaignSelect}
        triggerFileInput={triggerFileInput}
      />
    </>
  );
}

// Extracted Modal Component for reuse
function UploadModal({ showModal, handleCloseModal, uploadType, handleUploadTypeSelect, campaigns, campaignsLoading, handleCampaignSelect, triggerFileInput }) {
  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          style={{ zIndex: 99999 }}
          onClick={handleCloseModal}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-[var(--glass-border)]">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Upload Asset</h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-[var(--glass-hover)] rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <p className="text-muted-foreground mt-2">Choose where to upload your asset</p>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
              {!uploadType ? (
                <div className="space-y-4">
                  {/* Company Asset Option */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleUploadTypeSelect('company')}
                    className="w-full p-5 glass-card hover:border-primary/50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <Building2 className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-lg mb-1">Company Asset</h3>
                        <p className="text-sm text-muted-foreground">Available to all campaigns</p>
                      </div>
                      <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                    </div>
                  </motion.button>

                  {/* Campaign Asset Option */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleUploadTypeSelect('campaign')}
                    className="w-full p-5 glass-card hover:border-primary/50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <FolderOpen className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-lg mb-1">Add to Campaign</h3>
                        <p className="text-sm text-muted-foreground">Upload to specific campaign</p>
                      </div>
                      <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                    </div>
                  </motion.button>
                </div>
              ) : uploadType === 'campaign' ? (
                <div className="space-y-4">
                  <button
                    onClick={() => handleUploadTypeSelect(null)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 -mt-2 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>

                  <h3 className="font-semibold text-foreground text-lg mb-4">Select Campaign</h3>

                  {campaignsLoading ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-primary" />
                      <p className="text-sm">Loading campaigns...</p>
                    </div>
                  ) : campaigns.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FolderOpen className="w-16 h-16 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">No campaigns available</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                      {campaigns.map((campaign) => (
                        <motion.button
                          key={campaign.id}
                          whileHover={{ scale: 0.98 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            handleCampaignSelect(campaign.id);
                            triggerFileInput();
                          }}
                          className="w-full p-4 glass-card hover:border-primary/50 transition-all text-left"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground truncate mb-1">{campaign.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {campaign.videoCount || 0} assets
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            {uploadType === 'company' && (
              <div className="p-6 border-t border-[var(--glass-border)] bg-[var(--glass-hover)]">
                <div className="flex gap-3">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 px-5 py-2.5 border border-[var(--glass-border)] rounded-xl text-foreground font-medium hover:bg-[var(--glass-active)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={triggerFileInput}
                    className="flex-1 px-5 py-2.5 bg-gradient-to-r from-primary to-violet-500 text-primary-foreground rounded-xl hover:from-primary/90 hover:to-violet-500/90 transition-all font-semibold shadow-lg hover:shadow-xl"
                  >
                    Choose File
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Helper functions
function detectFileType(file) {
  const mimeType = file.type.toLowerCase();
  const extension = file.name.split('.').pop().toLowerCase();

  // Video types
  if (mimeType.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension)) {
    return 'VIDEO';
  }

  // Image types
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
    return 'IMAGE';
  }

  // Document types
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('text') ||
    mimeType.includes('word') ||
    ['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension)
  ) {
    return 'DOCUMENT';
  }

  return null;
}

async function getFileMetadata(file, fileType) {
  const metadata = {};

  if (fileType === 'VIDEO') {
    // Get video duration
    const duration = await new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => resolve(null);
      video.src = URL.createObjectURL(file);
    });
    metadata.duration = duration;
  } else if (fileType === 'IMAGE') {
    // Get image dimensions
    const dimensions = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        window.URL.revokeObjectURL(img.src);
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(file);
    });
    metadata.dimensions = dimensions;
  }

  return metadata;
}

async function showSuccess(title, message) {
  // Implement your success notification here
  console.log(`SUCCESS: ${title} - ${message}`);
  alert(`${title}\n${message}`);
}

async function showError(title, message) {
  // Implement your error notification here
  console.error(`ERROR: ${title} - ${message}`);
  alert(`${title}\n${message}`);
}
