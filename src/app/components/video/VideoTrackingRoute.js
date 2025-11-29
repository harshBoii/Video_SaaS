// 'use client';
// import { useEffect, useRef, useState } from 'react';

// export default function useVideoTracking(videoId, playerRef) {
//   const [viewId, setViewId] = useState(null);
//   const watchedSegments = useRef(new Set());
//   const lastUpdateTime = useRef(Date.now());
//   const totalWatchTime = useRef(0);
//   const trackingInterval = useRef(null);

//   // Detect device info
//   const getDeviceInfo = () => {
//     const ua = navigator.userAgent;
//     let deviceType = 'desktop';
//     let browser = 'unknown';
//     let os = 'unknown';

//     // Device type
//     if (/mobile/i.test(ua)) deviceType = 'mobile';
//     else if (/tablet|ipad/i.test(ua)) deviceType = 'tablet';

//     // Browser
//     if (ua.includes('Chrome')) browser = 'Chrome';
//     else if (ua.includes('Firefox')) browser = 'Firefox';
//     else if (ua.includes('Safari')) browser = 'Safari';
//     else if (ua.includes('Edge')) browser = 'Edge';

//     // OS
//     if (ua.includes('Windows')) os = 'Windows';
//     else if (ua.includes('Mac')) os = 'macOS';
//     else if (ua.includes('Linux')) os = 'Linux';
//     else if (ua.includes('Android')) os = 'Android';
//     else if (ua.includes('iOS')) os = 'iOS';

//     return { deviceType, browser, os };
//   };

//   // Send tracking data
//   const sendTrackingData = async (segments = []) => {
//     if (!videoId) return;

//     const player = playerRef.current;
//     if (!player) return;

//     try {
//       const duration = player.duration || 0;
//       const percentage = duration > 0 ? (totalWatchTime.current / duration * 100) : 0;
//       const completed = percentage >= 90; // Consider 90% as completed

//       const deviceInfo = getDeviceInfo();

//       const response = await fetch(`/api/videos/${videoId}/track`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         credentials: 'include',
//         body: JSON.stringify({
//           viewId,
//           watchedSegments: segments,
//           watchDuration: Math.floor(totalWatchTime.current),
//           percentage: Math.min(percentage, 100),
//           completed,
//           ...deviceInfo
//         })
//       });

//       const data = await response.json();
//       if (data.success && !viewId) {
//         setViewId(data.viewId);
//       }
//     } catch (error) {
//       console.error('Failed to send tracking data:', error);
//     }
//   };

//   // Track video progress
//   useEffect(() => {
//     if (!videoId || !playerRef.current) return;

//     const player = playerRef.current;
//     let currentSegmentStart = null;

//     const handleTimeUpdate = () => {
//       const currentTime = player.currentTime;
//       const now = Date.now();
//       const timeDiff = (now - lastUpdateTime.current) / 1000;

//       // Update watch time (only if playing)
//       if (!player.paused && timeDiff < 2) { // Ignore if more than 2 seconds (user might have seeked)
//         totalWatchTime.current += timeDiff;
//       }

//       lastUpdateTime.current = now;

//       // Track current segment
//       const segmentKey = Math.floor(currentTime / 5) * 5; // 5-second segments
//       if (!watchedSegments.current.has(segmentKey)) {
//         watchedSegments.current.add(segmentKey);
//         currentSegmentStart = segmentKey;
//       }
//     };

//     const handlePlay = () => {
//       lastUpdateTime.current = Date.now();
      
//       // Send update every 10 seconds while playing
//       trackingInterval.current = setInterval(() => {
//         const segments = Array.from(watchedSegments.current).map(start => ({
//           start,
//           end: start + 5
//         }));
//         sendTrackingData(segments);
//         watchedSegments.current.clear(); // Clear after sending
//       }, 10000);
//     };

//     const handlePause = () => {
//       if (trackingInterval.current) {
//         clearInterval(trackingInterval.current);
//       }
      
//       // Send update on pause
//       const segments = Array.from(watchedSegments.current).map(start => ({
//         start,
//         end: start + 5
//       }));
//       sendTrackingData(segments);
//     };

//     const handleSeeked = () => {
//       lastUpdateTime.current = Date.now();
//     };

//     // Attach listeners
//     player.addEventListener('timeupdate', handleTimeUpdate);
//     player.addEventListener('play', handlePlay);
//     player.addEventListener('playing', handlePlay);
//     player.addEventListener('pause', handlePause);
//     player.addEventListener('seeked', handleSeeked);

//     // Initial tracking call
//     sendTrackingData([]);

//     // Cleanup
//     return () => {
//       player.removeEventListener('timeupdate', handleTimeUpdate);
//       player.removeEventListener('play', handlePlay);
//       player.removeEventListener('playing', handlePlay);
//       player.removeEventListener('pause', handlePause);
//       player.removeEventListener('seeked', handleSeeked);
      
//       if (trackingInterval.current) {
//         clearInterval(trackingInterval.current);
//       }

//       // Final update before unmount
//       const segments = Array.from(watchedSegments.current).map(start => ({
//         start,
//         end: start + 5
//       }));
//       sendTrackingData(segments);
//     };
//   }, [videoId, playerRef.current]);

//   return { viewId };
// }
