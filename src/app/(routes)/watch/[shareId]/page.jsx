'use client';
import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  AlertCircle, 
  Download, 
  MessageSquare, 
  Loader2,
  Command // Using Command icon as a placeholder logo for CreateOS
} from 'lucide-react';
import { motion } from 'framer-motion';
import ProtectedCommentSection from '@/app/components/video/ProtectedCommentSection';

export default function PublicVideoPage({ params }) {
  // 1. Unwrap Params (Next.js 15 safe)
  const { shareId } = React.use(params);

  // 2. State
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [showMobileComments, setShowMobileComments] = useState(false);

  // 3. Initial Fetch
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
        setError('Connection failed. Please try again.');
        setLoading(false);
      }
    };
    if (shareId) checkAccess();
  }, [shareId]);

  // 4. Password Handler
  const handleUnlock = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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
        setNeedsPassword(false);
      } else {
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
        setError('Incorrect password. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Helper: Extract Iframe URL
  const getIframeUrl = (url) => {
    if (!url) return '';
    const match = url.match(/cloudflarestream\.com\/([a-zA-Z0-9]+)\//);
    const id = match ? match[1] : null;
    if (id) return `https://iframe.videodelivery.net/${id}?preload=true&autoplay=true`;
    return url; 
  };

  // ================= RENDER LOADING =================
  if (loading && !videoData && !needsPassword) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white space-y-4 font-sans">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full"></div>
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 relative z-10" />
        </div>
        <p className="text-gray-400 font-medium animate-pulse tracking-wide">
          Loading Secure Content via <span className="text-indigo-400 font-semibold">CreateOS</span>
        </p>
      </div>
    );
  }

  // ================= RENDER PASSWORD GATE =================
  if (needsPassword && !isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* CreateOS Branding */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 mb-3">
              <Command className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">CreateOS</h2>
            <p className="text-sm text-gray-500">Secure Video Sharing</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8 text-center">
              <h1 className="text-xl font-bold text-gray-900 mb-2">Restricted Access</h1>
              <p className="text-gray-500 mb-6 text-sm">
                This content is password protected by the owner.
              </p>

              <form onSubmit={handleUnlock} className="space-y-4">
                <motion.div 
                  animate={shaking ? { x: [-10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Enter password"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400"
                      autoFocus
                    />
                  </div>
                </motion.div>

                {error && (
                  <div className="flex items-center justify-center gap-2 text-red-600 text-sm bg-red-50 p-2.5 rounded-lg font-medium">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !passwordInput}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-70 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Unlock Content'}
                </button>
              </form>
            </div>
            
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
              <Lock className="w-3 h-3" />
              <span>End-to-End Encrypted</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ================= RENDER ERROR =================
  if (error && !needsPassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 max-w-md mb-8">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-all shadow-sm hover:shadow-md"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  // ================= RENDER PLAYER (AUTHORIZED) =================
  if (isAuthorized && videoData) {
    const iframeSrc = getIframeUrl(videoData.url);

    return (
      <div className="h-screen bg-black flex flex-col lg:flex-row overflow-hidden font-sans">
        
        {/* Left Side: Video Player */}
        <div className={`flex-1 flex flex-col relative ${videoData.allowComments ? 'lg:w-[70%]' : 'w-full'} h-full`}>
          
          {/* Floating Header */}
          <div className="absolute top-0 left-0 right-0 z-20 p-4 md:p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none transition-opacity duration-300">
            <div className="flex items-start justify-between">
              <div className="pointer-events-auto">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
                    <Command className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-bold text-indigo-300 tracking-wider uppercase">CreateOS</span>
                </div>
                <h1 className="text-lg md:text-2xl font-bold text-white line-clamp-1 max-w-[80vw]">
                  {videoData.title}
                </h1>
              </div>
              
              <div className="flex items-center gap-3 pointer-events-auto">
                {/* Mobile Comment Toggle */}
                {videoData.allowComments && (
                  <button 
                    onClick={() => setShowMobileComments(!showMobileComments)}
                    className="lg:hidden p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all relative"
                  >
                    <MessageSquare className="w-5 h-5" />
                    {/* Indicator dot */}
                    <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border border-black"></span>
                  </button>
                )}

                {videoData.allowDownload && (
                   <a 
                     href={videoData.url} 
                     download 
                     className="p-2.5 bg-emerald-600 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all flex items-center gap-2 group"
                     title="Download Video"
                   >
                     <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                   </a>
                )}
              </div>
            </div>
          </div>

          {/* Player Container */}
          <div className="flex-1 flex items-center justify-center bg-black relative">
             <div className="w-full h-full relative">
               {iframeSrc.includes('iframe.videodelivery.net') ? (
                  <iframe
                    src={iframeSrc}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                    allowFullScreen
                    title={videoData.title}
                  />
               ) : (
                  <video 
                    src={videoData.url} 
                    controls 
                    className="w-full h-full object-contain" 
                    controlsList={!videoData.allowDownload ? "nodownload" : undefined}
                  />
               )}
             </div>
          </div>
        </div>

        {/* Right Side: Comments Section */}
        {videoData.allowComments && (
          <>
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex w-[400px] bg-white border-l border-gray-200 flex-col h-full shadow-2xl z-30">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">Discussion</h3>
                <span className="ml-auto text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                  Public
                </span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <ProtectedCommentSection 
                      videoId={videoData.id || shareId}
                      isPublicView={true}              
                      allowPublicComments={videoData.allowComments}
                  />
              </div>
            </div>

            {/* Mobile Slide-over / Sheet */}
            {showMobileComments && (
              <div className="lg:hidden fixed inset-0 z-50 flex flex-col">
                <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileComments(false)} />
                <motion.div 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  className="bg-white h-[75vh] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-semibold text-gray-900">Discussion</h3>
                    </div>
                    <button 
                      onClick={() => setShowMobileComments(false)}
                      className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <span className="sr-only">Close</span>
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <ProtectedCommentSection 
                        videoId={videoData.id || shareId}
                        isPublicView={true}              
                        allowPublicComments={videoData.allowComments}
                    />
                  </div>
                </motion.div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return null;
}
