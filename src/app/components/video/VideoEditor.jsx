'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crop,
  Scissors,
  Maximize2,
  X,
  Play,
  Pause,
  RotateCcw,
  Save,
  Loader2,
} from 'lucide-react';
import { showSuccess, showError } from '@/app/lib/swal';

export default function VideoEditor({ video, onClose, onSaveComplete }) {

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Edit mode
  const [editMode, setEditMode] = useState('crop');

  // Video dimensions
  const [videoDimensions, setVideoDimensions] = useState({ width: 1920, height: 1080 });
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 });

  // Crop state
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 1920, height: 1080 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragHandle, setDragHandle] = useState(null);

  // Resize state
  const [resizeDimensions, setResizeDimensions] = useState({ width: 1920, height: 1080 });
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);

  // Trim state
  const [trimRange, setTrimRange] = useState({ start: 0, end: 0 });

  // Save state
  const [versionNote, setVersionNote] = useState('');
  const [processingAction, setProcessingAction] = useState(null); // 'download' | 'upload' | null
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');


  // Aspect ratio presets
  const aspectRatios = [
    { name: '16:9', ratio: 16/9, width: 1920, height: 1080 },
    { name: '9:16', ratio: 9/16, width: 1080, height: 1920 },
    { name: '1:1', ratio: 1, width: 1080, height: 1080 },
    { name: '4:5', ratio: 4/5, width: 1080, height: 1350 },
    { name: '4:3', ratio: 4/3, width: 1280, height: 960 },
    { name: '21:9', ratio: 21/9, width: 2560, height: 1080 },
  ];

  // ... (all previous useEffect hooks remain the same - load metadata, display dimensions, draw crop overlay)

  // Load video metadata
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handleLoadedMetadata = () => {
      const w = videoEl.videoWidth;
      const h = videoEl.videoHeight;
      const d = videoEl.duration;

      setVideoDimensions({ width: w, height: h });
      setDuration(d);
      setTrimRange({ start: 0, end: d });
      setCropBox({ x: 0, y: 0, width: w, height: h });
      setResizeDimensions({ width: w, height: h });
      setVideoLoaded(true);

      console.log('[VIDEO] Loaded:', { width: w, height: h, duration: d });
    };

    const handleTimeUpdate = () => {
      setCurrentTime(videoEl.currentTime);
    };

    videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoEl.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoEl.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  // Calculate display dimensions
  useEffect(() => {
    if (!videoLoaded || !containerRef.current) return;

    const updateDisplaySize = () => {
      const container = containerRef.current;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      const videoAspect = videoDimensions.width / videoDimensions.height;
      const containerAspect = containerWidth / containerHeight;

      let displayWidth, displayHeight;

      if (containerAspect > videoAspect) {
        displayHeight = containerHeight;
        displayWidth = displayHeight * videoAspect;
      } else {
        displayWidth = containerWidth;
        displayHeight = displayWidth / videoAspect;
      }

      setDisplayDimensions({ width: displayWidth, height: displayHeight });
    };

    updateDisplaySize();
    window.addEventListener('resize', updateDisplaySize);
    return () => window.removeEventListener('resize', updateDisplaySize);
  }, [videoLoaded, videoDimensions]);

  // Draw crop overlay
  useEffect(() => {
    if (!canvasRef.current || editMode !== 'crop' || !videoLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = displayDimensions.width;
    canvas.height = displayDimensions.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = displayDimensions.width / videoDimensions.width;
    const scaleY = displayDimensions.height / videoDimensions.height;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cropX = cropBox.x * scaleX;
    const cropY = cropBox.y * scaleY;
    const cropWidth = cropBox.width * scaleX;
    const cropHeight = cropBox.height * scaleY;

    ctx.clearRect(cropX, cropY, cropWidth, cropHeight);

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX, cropY, cropWidth, cropHeight);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cropX + cropWidth / 3, cropY);
    ctx.lineTo(cropX + cropWidth / 3, cropY + cropHeight);
    ctx.moveTo(cropX + (cropWidth * 2) / 3, cropY);
    ctx.lineTo(cropX + (cropWidth * 2) / 3, cropY + cropHeight);
    ctx.moveTo(cropX, cropY + cropHeight / 3);
    ctx.lineTo(cropX + cropWidth, cropY + cropHeight / 3);
    ctx.moveTo(cropX, cropY + (cropHeight * 2) / 3);
    ctx.lineTo(cropX + cropWidth, cropY + (cropHeight * 2) / 3);
    ctx.stroke();

    const handleSize = 12;
    ctx.fillStyle = '#3b82f6';
    
    const handles = [
      { x: cropX, y: cropY },
      { x: cropX + cropWidth, y: cropY },
      { x: cropX, y: cropY + cropHeight },
      { x: cropX + cropWidth, y: cropY + cropHeight },
      { x: cropX + cropWidth / 2, y: cropY },
      { x: cropX + cropWidth / 2, y: cropY + cropHeight },
      { x: cropX, y: cropY + cropHeight / 2 },
      { x: cropX + cropWidth, y: cropY + cropHeight / 2 },
    ];

    handles.forEach(handle => {
      ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
    });

    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(cropX, cropY - 30, 150, 25);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.fillText(`${Math.round(cropBox.width)} × ${Math.round(cropBox.height)}`, cropX + 8, cropY - 12);

  }, [cropBox, displayDimensions, editMode, videoLoaded, videoDimensions]);


  const handleMouseDown = (e) => {
    if (editMode !== 'crop' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scaleX = displayDimensions.width / videoDimensions.width;
    const scaleY = displayDimensions.height / videoDimensions.height;

    const cropX = cropBox.x * scaleX;
    const cropY = cropBox.y * scaleY;
    const cropWidth = cropBox.width * scaleX;
    const cropHeight = cropBox.height * scaleY;

    const handleSize = 12;

    const handles = {
      nw: { x: cropX, y: cropY },
      ne: { x: cropX + cropWidth, y: cropY },
      sw: { x: cropX, y: cropY + cropHeight },
      se: { x: cropX + cropWidth, y: cropY + cropHeight },
      n: { x: cropX + cropWidth / 2, y: cropY },
      s: { x: cropX + cropWidth / 2, y: cropY + cropHeight },
      w: { x: cropX, y: cropY + cropHeight / 2 },
      e: { x: cropX + cropWidth, y: cropY + cropHeight / 2 },
    };

    for (const [key, handle] of Object.entries(handles)) {
      if (
        mouseX >= handle.x - handleSize &&
        mouseX <= handle.x + handleSize &&
        mouseY >= handle.y - handleSize &&
        mouseY <= handle.y + handleSize
      ) {
        setDragHandle(key);
        setIsDragging(true);
        setDragStart({ x: mouseX, y: mouseY });
        return;
      }
    }

    if (
      mouseX >= cropX &&
      mouseX <= cropX + cropWidth &&
      mouseY >= cropY &&
      mouseY <= cropY + cropHeight
    ) {
      setDragHandle('move');
      setIsDragging(true);
      setDragStart({ x: mouseX, y: mouseY });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scaleX = videoDimensions.width / displayDimensions.width;
    const scaleY = videoDimensions.height / displayDimensions.height;

    const deltaX = (mouseX - dragStart.x) * scaleX;
    const deltaY = (mouseY - dragStart.y) * scaleY;

    setCropBox(prev => {
      let newBox = { ...prev };

      if (dragHandle === 'move') {
        newBox.x = Math.max(0, Math.min(videoDimensions.width - prev.width, prev.x + deltaX));
        newBox.y = Math.max(0, Math.min(videoDimensions.height - prev.height, prev.y + deltaY));
      } else if (dragHandle === 'nw') {
        newBox.x = Math.max(0, prev.x + deltaX);
        newBox.y = Math.max(0, prev.y + deltaY);
        newBox.width = Math.max(50, prev.width - deltaX);
        newBox.height = Math.max(50, prev.height - deltaY);
      } else if (dragHandle === 'ne') {
        newBox.y = Math.max(0, prev.y + deltaY);
        newBox.width = Math.max(50, Math.min(videoDimensions.width - prev.x, prev.width + deltaX));
        newBox.height = Math.max(50, prev.height - deltaY);
      } else if (dragHandle === 'sw') {
        newBox.x = Math.max(0, prev.x + deltaX);
        newBox.width = Math.max(50, prev.width - deltaX);
        newBox.height = Math.max(50, Math.min(videoDimensions.height - prev.y, prev.height + deltaY));
      } else if (dragHandle === 'se') {
        newBox.width = Math.max(50, Math.min(videoDimensions.width - prev.x, prev.width + deltaX));
        newBox.height = Math.max(50, Math.min(videoDimensions.height - prev.y, prev.height + deltaY));
      } else if (dragHandle === 'n') {
        newBox.y = Math.max(0, prev.y + deltaY);
        newBox.height = Math.max(50, prev.height - deltaY);
      } else if (dragHandle === 's') {
        newBox.height = Math.max(50, Math.min(videoDimensions.height - prev.y, prev.height + deltaY));
      } else if (dragHandle === 'w') {
        newBox.x = Math.max(0, prev.x + deltaX);
        newBox.width = Math.max(50, prev.width - deltaX);
      } else if (dragHandle === 'e') {
        newBox.width = Math.max(50, Math.min(videoDimensions.width - prev.x, prev.width + deltaX));
      }

      return newBox;
    });

    setDragStart({ x: mouseX, y: mouseY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragHandle(null);
  };

  const applyAspectRatio = (preset) => {
    if (editMode === 'crop') {
      const targetRatio = preset.ratio;
      const centerX = cropBox.x + cropBox.width / 2;
      const centerY = cropBox.y + cropBox.height / 2;

      let newWidth, newHeight;

      if (cropBox.width / cropBox.height > targetRatio) {
        newHeight = cropBox.height;
        newWidth = newHeight * targetRatio;
      } else {
        newWidth = cropBox.width;
        newHeight = newWidth / targetRatio;
      }

      setCropBox({
        x: Math.max(0, Math.min(videoDimensions.width - newWidth, centerX - newWidth / 2)),
        y: Math.max(0, Math.min(videoDimensions.height - newHeight, centerY - newHeight / 2)),
        width: newWidth,
        height: newHeight,
      });
    } else if (editMode === 'resize') {
      setResizeDimensions({ width: preset.width, height: preset.height });
    }
  };

  const resetToOriginal = () => {
    setCropBox({ x: 0, y: 0, width: videoDimensions.width, height: videoDimensions.height });
    setResizeDimensions({ width: videoDimensions.width, height: videoDimensions.height });
    setTrimRange({ start: 0, end: duration });
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ✅ NEW: POST request with all parameters
const handleSave = async () => {
  if (!versionNote.trim()) {
    showError('Missing Note', 'Please provide a version note');
    return;
  }

  setProcessingAction('download');
  setProgress(0);
  setProgressMessage('Processing video...');

  try {
    const videoUrl = `${process.env.MICROSERVICE_API_URL}/api/videos/${video.id}/raw?expiresIn=3600`;

    const requestBody = {
      crop_x: Math.round(cropBox.x),
      crop_y: Math.round(cropBox.y),
      crop_w: Math.round(cropBox.width),
      crop_h: Math.round(cropBox.height),
      resize_w: Math.round(resizeDimensions.width),
      resize_h: Math.round(resizeDimensions.height),
      trim_start: parseFloat(trimRange.start.toFixed(2)),
      trim_end: parseFloat(trimRange.end.toFixed(2)),
      video_url: videoUrl,
      version_note: versionNote.trim(),
      edit_mode: editMode,
    };

    setProgress(30);
    setProgressMessage('Processing video...');

    const response = await fetch('http://localhost:8000/process-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Processing request failed');
    }

    setProgress(60);
    setProgressMessage('Downloading processed video...');

    const blob = await response.blob();
    
    setProgress(90);
    setProgressMessage('Saving file...');

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `processed_${versionNote.trim().replace(/\s+/g, '_')}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    setProgress(100);
    setProgressMessage('Download complete!');

    await showSuccess('Success!', 'Your video has been processed and downloaded.');

    if (onSaveComplete) onSaveComplete({ success: true });

    onClose();

  } catch (error) {
    console.error('[EDITOR ERROR]', error);
    showError('Processing Failed', error.message || 'Failed to process video');
    setProcessingAction(null);
    setProgress(0);
    setProgressMessage('');
  }
};

const handleVersionUpload = async () => {
  if (!versionNote.trim()) {
    showError('Missing Note', 'Please provide a version note');
    return;
  }

  setProcessingAction('upload');
  setProgress(0);
  setProgressMessage('Processing video...');

  try {
    const videoUrl = `https://createos.vercel.app/api/videos/${video.id}/raw?expiresIn=3600`;

    const requestBody = {
      crop_x: Math.round(cropBox.x),
      crop_y: Math.round(cropBox.y),
      crop_w: Math.round(cropBox.width),
      crop_h: Math.round(cropBox.height),
      resize_w: Math.round(resizeDimensions.width),
      resize_h: Math.round(resizeDimensions.height),
      trim_start: parseFloat(trimRange.start.toFixed(2)),
      trim_end: parseFloat(trimRange.end.toFixed(2)),
      video_url: videoUrl,
      version_note: versionNote.trim(),
      edit_mode: editMode,
    };

    setProgress(20);
    setProgressMessage('Processing video...');

    const response = await fetch('http://localhost:8000/process-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Processing request failed');
    }

    setProgress(40);
    setProgressMessage('Receiving processed video...');

    const blob = await response.blob();
    
    const processedFile = new File(
      [blob], 
      `processed_${versionNote.trim().replace(/\s+/g, '_')}.mp4`,
      { type: 'video/mp4' }
    );

    setProgress(50);
    setProgressMessage('Starting upload...');

    const calculatedDuration = trimRange.end - trimRange.start;

    await uploadProcessedVideoAsVersion(processedFile, calculatedDuration);

    setProgress(100);
    setProgressMessage('Complete!');

    await showSuccess('Success!', 'Video processed and uploaded as new version.');

    if (onSaveComplete) onSaveComplete({ success: true });

    onClose();

  } catch (error) {
    console.error('[EDITOR ERROR]', error);
    showError('Upload Failed', error.message || 'Failed to upload video');
    setProcessingAction(null);
    setProgress(0);
    setProgressMessage('');
  }
};

// ✅ Reuse your existing upload logic
const uploadProcessedVideoAsVersion = async (file, videoDuration) => {
  const videoId = video.id;

  try {
    console.log('[VERSION UPLOAD] Starting upload for:', file.name);

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
    
    const partSize = upload.partSize;
    const uploadedParts = [];

    for (let i = 0; i < urls.length; i++) {
      const start = i * partSize;
      const end = Math.min(start + partSize, file.size);
      const chunk = file.slice(start, end);

      setProgressMessage(`Uploading part ${i + 1}/${urls.length}...`);
      
      const uploadProgress = 50 + Math.round(((i + 1) / urls.length) * 45);
      setProgress(uploadProgress);

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
    }

    setProgress(95);
    setProgressMessage('Completing upload...');

    const completeRes = await fetch('/api/upload/complete', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId: upload.uploadId,
        key: upload.key,
        parts: uploadedParts,
        duration: videoDuration,
        versionId: version.id,
      })
    });

    if (!completeRes.ok) {
      const errorData = await completeRes.json();
      throw new Error(errorData.error || 'Failed to complete upload');
    }

    const result = await completeRes.json();
    
    if (!result.success) {
      throw new Error('Upload completion failed');
    }

    console.log('[VERSION UPLOAD] ✅ Complete:', result);

  } catch (error) {
    console.error('[VERSION UPLOAD ERROR]', error);
    throw error;
  }
};

  // ... (return JSX remains the same as before)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600">
            <div className="flex items-center gap-3 text-white">
              <Scissors className="w-6 h-6" />
              <div>
                <h2 className="text-lg font-bold">{video.title}</h2>
                <p className="text-xs opacity-90">Video Editor</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Video Preview */}
            <div className="flex-1 flex flex-col bg-gray-900 p-4">
              <div
                ref={containerRef}
                className="flex-1 relative rounded-lg overflow-hidden bg-black flex items-center justify-center"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: isDragging ? 'grabbing' : 'default' }}
              >
                <video
                  ref={videoRef}
                  src={video.playbackUrl}
                  className="max-w-full max-h-full object-contain"
                  onEnded={() => setIsPlaying(false)}
                />
                
                {editMode === 'crop' && videoLoaded && (
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 m-auto pointer-events-auto"
                    style={{
                      width: displayDimensions.width,
                      height: displayDimensions.height,
                    }}
                  />
                )}

                {!isPlaying && videoLoaded && (
                  <button
                    onClick={togglePlayPause}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                  >
                    <div className="w-20 h-20 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Play className="w-10 h-10 text-white ml-2" />
                    </div>
                  </button>
                )}
              </div>

              {/* Controls */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 text-white">
                  <button
                    onClick={togglePlayPause}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <span className="text-sm font-mono">{formatTime(currentTime)}</span>
                  <div
                    className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const percent = (e.clientX - rect.left) / rect.width;
                      if (videoRef.current) {
                        videoRef.current.currentTime = percent * duration;
                      }
                    }}
                  >
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono">{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            {/* Controls Panel */}
            <div className="w-80 border-l bg-gray-50 p-4 overflow-y-auto space-y-4">
              {/* Mode Selector */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-gray-200 rounded-lg">
                <button
                  onClick={() => setEditMode('crop')}
                  className={`flex flex-col items-center gap-1 py-3 rounded-md transition-all ${
                    editMode === 'crop' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                  }`}
                >
                  <Crop className="w-5 h-5" />
                  <span className="text-xs font-semibold">Crop</span>
                </button>
                <button
                  onClick={() => setEditMode('resize')}
                  className={`flex flex-col items-center gap-1 py-3 rounded-md transition-all ${
                    editMode === 'resize' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                  }`}
                >
                  <Maximize2 className="w-5 h-5" />
                  <span className="text-xs font-semibold">Resize</span>
                </button>
                <button
                  onClick={() => setEditMode('trim')}
                  className={`flex flex-col items-center gap-1 py-3 rounded-md transition-all ${
                    editMode === 'trim' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                  }`}
                >
                  <Scissors className="w-5 h-5" />
                  <span className="text-xs font-semibold">Trim</span>
                </button>
              </div>

              {/* Presets */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quick Presets</label>
                <div className="grid grid-cols-3 gap-2">
                  {aspectRatios.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyAspectRatio(preset)}
                      className="px-3 py-2 bg-white border-2 border-gray-200 hover:border-blue-500 hover:text-blue-600 rounded-lg text-sm font-medium transition-all"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Specific Controls */}
              {editMode === 'crop' && (
                <div className="space-y-3 p-3 bg-white rounded-lg border">
                  <h3 className="font-semibold text-gray-900">Crop Settings</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <label className="block text-gray-600 mb-1">X</label>
                      <input
                        type="number"
                        value={Math.round(cropBox.x)}
                        onChange={(e) => setCropBox(prev => ({ ...prev, x: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Y</label>
                      <input
                        type="number"
                        value={Math.round(cropBox.y)}
                        onChange={(e) => setCropBox(prev => ({ ...prev, y: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Width</label>
                      <input
                        type="number"
                        value={Math.round(cropBox.width)}
                        onChange={(e) => setCropBox(prev => ({ ...prev, width: Math.max(50, parseInt(e.target.value) || 50) }))}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Height</label>
                      <input
                        type="number"
                        value={Math.round(cropBox.height)}
                        onChange={(e) => setCropBox(prev => ({ ...prev, height: Math.max(50, parseInt(e.target.value) || 50) }))}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editMode === 'resize' && (
                <div className="space-y-3 p-3 bg-white rounded-lg border">
                  <h3 className="font-semibold text-gray-900">Resize Settings</h3>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={maintainAspectRatio}
                      onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Lock Aspect Ratio</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <label className="block text-gray-600 mb-1">Width</label>
                      <input
                        type="number"
                        value={resizeDimensions.width}
                        onChange={(e) => {
                          const w = parseInt(e.target.value) || 100;
                          if (maintainAspectRatio) {
                            const ratio = videoDimensions.width / videoDimensions.height;
                            setResizeDimensions({ width: w, height: Math.round(w / ratio) });
                          } else {
                            setResizeDimensions(prev => ({ ...prev, width: w }));
                          }
                        }}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Height</label>
                      <input
                        type="number"
                        value={resizeDimensions.height}
                        onChange={(e) => {
                          const h = parseInt(e.target.value) || 100;
                          if (maintainAspectRatio) {
                            const ratio = videoDimensions.width / videoDimensions.height;
                            setResizeDimensions({ width: Math.round(h * ratio), height: h });
                          } else {
                            setResizeDimensions(prev => ({ ...prev, height: h }));
                          }
                        }}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editMode === 'trim' && (
                <div className="space-y-3 p-3 bg-white rounded-lg border">
                  <h3 className="font-semibold text-gray-900">Trim Settings</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <label className="block text-gray-600 mb-1">Start (seconds)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={trimRange.start.toFixed(1)}
                        onChange={(e) => setTrimRange(prev => ({ ...prev, start: Math.max(0, parseFloat(e.target.value) || 0) }))}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">End (seconds)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={trimRange.end.toFixed(1)}
                        onChange={(e) => setTrimRange(prev => ({ ...prev, end: Math.min(duration, parseFloat(e.target.value) || duration) }))}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <p className="text-gray-600">
                      Duration: {formatTime(trimRange.end - trimRange.start)}
                    </p>
                  </div>
                </div>
              )}

              {/* Reset */}
              <button
                onClick={resetToOriginal}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>

              {/* Version Note */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Version Note *</label>
                <textarea
                  value={versionNote}
                  onChange={(e) => setVersionNote(e.target.value)}
                  placeholder="Describe your changes (e.g., 'Cropped to 9:16 for Instagram Reels')"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Progress */}
              {processingAction && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{progressMessage}</span>
                    <span className="font-semibold text-blue-600">{progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={processingAction !== null || !versionNote.trim()}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-white transition-all ${
                  processingAction !== null || !versionNote.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg'
                }`}
              >
                {processingAction === 'download' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {progressMessage}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Download Processed
                  </>
                )}
              </button>
              
              <button
                onClick={handleVersionUpload}
                disabled={processingAction !== null || !versionNote.trim()}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-white transition-all ${
                  processingAction !== null || !versionNote.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-teal-600 hover:shadow-lg'
                }`}
              >
                {processingAction === 'upload' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {progressMessage}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Upload as Version
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
