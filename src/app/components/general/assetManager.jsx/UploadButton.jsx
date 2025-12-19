// components/asset-library/UploadButton.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UploadButton({ onUploadComplete, campaigns, campaignsLoading }) {
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

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleUploadClick}
        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold shadow-lg transition-all flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Upload Asset
      </motion.button>

      {/* Upload Progress Indicator */}
      {uploadingFile && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-xl p-4 w-80 z-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-900 truncate mr-2">
              Uploading {uploadingFile.name}
            </span>
            <span className="text-sm text-slate-600 font-medium">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">Upload Asset</h2>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-slate-600 mt-2">Choose where to upload your asset</p>
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
                      className="w-full p-5 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center group-hover:from-blue-100 group-hover:to-blue-200 transition-colors flex-shrink-0">
                          <svg className="w-7 h-7 text-amber-600 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 text-lg mb-1">Company Asset</h3>
                          <p className="text-sm text-slate-600">Available to all campaigns</p>
                        </div>
                        <svg className="w-6 h-6 text-slate-400 group-hover:text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </motion.button>

                    {/* Campaign Asset Option */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleUploadTypeSelect('campaign')}
                      className="w-full p-5 border-2 border-slate-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center group-hover:from-purple-200 group-hover:to-purple-300 transition-colors flex-shrink-0">
                          <svg className="w-7 h-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 text-lg mb-1">Add to Campaign</h3>
                          <p className="text-sm text-slate-600">Upload to specific campaign</p>
                        </div>
                        <svg className="w-6 h-6 text-slate-400 group-hover:text-purple-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </motion.button>
                  </div>
                ) : uploadType === 'campaign' ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => handleUploadTypeSelect(null)}
                      className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4 -mt-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>

                    <h3 className="font-semibold text-slate-900 text-lg mb-4">Select Campaign</h3>

                    {campaignsLoading ? (
                      <div className="text-center py-12 text-slate-500">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                        <p className="text-sm">Loading campaigns...</p>
                      </div>
                    ) : campaigns.length === 0 ? (
                      <div className="text-center py-12 text-slate-500">
                        <svg className="w-16 h-16 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <p className="text-sm font-medium">No campaigns available</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {campaigns.map((campaign) => (
                          <motion.button
                            key={campaign.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              handleCampaignSelect(campaign.id);
                              triggerFileInput();
                            }}
                            className="w-full p-4 border-2 border-slate-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-slate-900 truncate mb-1">{campaign.name}</h4>
                                <p className="text-xs text-slate-500">
                                  {campaign.videoCount || 0} assets
                                </p>
                              </div>
                              <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
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
                <div className="p-6 border-t border-slate-200 bg-slate-50">
                  <div className="flex gap-3">
                    <button
                      onClick={handleCloseModal}
                      className="flex-1 px-5 py-2.5 border-2 border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-white hover:border-slate-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={triggerFileInput}
                      className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-md hover:shadow-lg"
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
    </>
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
