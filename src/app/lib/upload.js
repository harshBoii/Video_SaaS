export const handleVersionUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!versionUploadModal) {
      showError('Error', 'No video selected');
      return;
    }

    const videoId = versionUploadModal.id;

    if (!versionNote.trim()) {
      showError('Error', 'Please provide a version note');
      return;
    }

    setUploadingFile(file);
    setLoading(true);
    setUploadProgress(0);

    try {
      console.log('[VERSION UPLOAD] Starting upload for:', file.name);
      
      const getVideoDuration = (file) => {
        return new Promise((resolve) => {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            resolve(video.duration);
          };
          video.onerror = () => resolve(null);
          video.src = URL.createObjectURL(file);
        });
      };

      const duration = await getVideoDuration(file);

      const startRes = await fetch(`/api/videos/${videoId}/versions`, {
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
          duration: duration,
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
        fetchVideos();
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

export const handleFileUpload = async (event, campaignId) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      await showError('Invalid File', 'Please select a valid video file.');
      return;
    }

    setUploadingFile(file);
    setUploadProgress(0);
    setUploadingProjectId(campaignId);

    try {
      console.log('[UPLOAD] Starting upload for:', file.name, 'to campaign:', campaignId);
      
      const getVideoDuration = (file) => {
        return new Promise((resolve) => {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            resolve(video.duration);
          };
          video.onerror = () => resolve(null);
          video.src = URL.createObjectURL(file);
        });
      };

      const duration = await getVideoDuration(file);

      const startRes = await fetch('/api/upload/start', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          campaignId,
          metadata: {
            title: file.name.replace(/\.[^/.]+$/, ''),
            description: 'Uploaded from dashboard',
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
          duration,
        }),
      });

      if (!completeRes.ok) {
        const errorData = await completeRes.json();
        throw new Error(errorData.error || 'Failed to complete upload');
      }

      const result = await completeRes.json();
      if (result.success) {
        console.log('[UPLOAD] Upload completed successfully');
        await showSuccess('Upload Complete', 'Video uploaded successfully and queued for processing!');
        loadDashboardData();
      }
    } catch (error) {
      console.error('[UPLOAD ERROR]', error);
      await showError('Upload Failed', error.message || 'An unexpected error occurred during upload.');
    } finally {
      setUploadingFile(null);
      setUploadProgress(0);
      setUploadingProjectId(null);
    }
  };
