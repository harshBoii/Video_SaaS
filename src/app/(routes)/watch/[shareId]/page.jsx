'use client';
import React, { useState, useEffect, useRef } from 'react';
import { FiLock } from 'react-icons/fi';
import Hls from 'hls.js'; // ✅ Import HLS

export default function PublicVideoPage({ params }) {
  const { shareId } = React.use(params); // Next.js 15 params unwrapping

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState('');

  // Refs for video player
  const videoRef = useRef(null);

  // 1. Check Access
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch(`/api/public/video/${shareId}`);
        const data = await res.json();

        if (res.status === 403 && data.reason === 'PASSWORD_REQUIRED') {
          setNeedsPassword(true);
          setLoading(false);
        } else if (res.ok) {
          setVideoData(data);
          setIsAuthorized(true);
          setLoading(false);
        } else {
          setError('Video not found or link expired.');
          setLoading(false);
        }
      } catch (err) {
        setError('Connection error.');
        setLoading(false);
      }
    };
    if (shareId) checkAccess();
  }, [shareId]);

  // 2. Initialize Player (HLS Support)
  useEffect(() => {
    if (isAuthorized && videoData && videoRef.current) {
      const videoSrc = videoData.url;

      // Case A: HLS supported natively (Safari, iOS)
      if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = videoSrc;
      }
      // Case B: HLS.js needed (Chrome, Firefox, Edge)
      else if (Hls.isSupported() && videoSrc.includes('.m3u8')) {
        const hls = new Hls();
        hls.loadSource(videoSrc);
        hls.attachMedia(videoRef.current);
      }
      // Case C: Standard MP4 fallback
      else {
        videoRef.current.src = videoSrc;
      }
    }
  }, [isAuthorized, videoData]);

  // 3. Unlock Handler
  const handleUnlock = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`/api/public/video/${shareId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });

      if (res.ok) {
        const data = await res.json();
        setVideoData(data);
        setIsAuthorized(true);
      } else {
        setError('Incorrect password.');
      }
    } catch (err) {
      setError('Validation failed.');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>;

  // Render Password Gate
  if (!isAuthorized && needsPassword) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiLock size={30} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Protected Content</h2>
          <p className="text-gray-500 mb-6">This video is password protected.</p>
          <form onSubmit={handleUnlock}>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Enter Password"
            />
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition">
              Unlock Video
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render Video
  if (isAuthorized && videoData) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="w-full max-w-5xl aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-2xl relative">
           {/* ✅ VIDEO TAG WITH REF */}
           <video 
             ref={videoRef}
             controls 
             autoPlay
             controlsList={!videoData.allowDownload ? "nodownload" : undefined}
             className="w-full h-full" 
           />
        </div>
        <div className="mt-6 text-white text-center">
          <h1 className="text-3xl font-bold">{videoData.title}</h1>
          {videoData.allowComments && (
            <div className="mt-8 bg-white/10 p-4 rounded-lg max-w-2xl mx-auto">
              <p>Comments Section Enabled</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <div className="text-center mt-20">{error}</div>;
}
