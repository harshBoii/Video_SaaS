'use client';
import { X, Download, MessageSquare, Command, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import CommentSection from './CommentSection';
import { motion, AnimatePresence } from "framer-motion";
import DescriptionViewer from './DescriptionViewer';
import PublicVersionSelector from './PublicVersionSelector';
import PublicVersionComparison from './PublicVersionComparison';

// --- CTA Display Component ---
const CTAOverlay = ({ cta, onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className={`absolute z-30 p-6 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200 max-w-sm w-full ${
      cta.position === 'top-right' ? 'top-8 right-8' : 
      cta.position === 'bottom-right' ? 'bottom-20 right-8' : 
      'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
    }`}
  >
    <h4 className="text-lg font-bold text-gray-900 mb-3 text-center">{cta.text}</h4>
    <a
      href={cta.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full text-center text-white py-3 rounded-lg font-bold shadow-md hover:opacity-90 transition-opacity"
      style={{ backgroundColor: cta.color }}
    >
      Open Link
    </a>
    <button 
      onClick={onDismiss} 
      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
    >
      <X className="w-4 h-4" />
    </button>
  </motion.div>
);

export default function PublicVideoPlayer({ video, allowDownload, allowComments, shareId }) {
  console.log('🎥 PublicVideoPlayer rendered with:', { video, allowDownload, allowComments, shareId });
  useEffect(() => {
    console.log('[PUBLIC VIDEO PLAYER] Video object:', {
      id: video.id,
      title: video.title,
      currentVersion: video.currentVersion,
      streamId: video.streamId
    });
  }, []);

  const [currentTime, setCurrentTime] = useState(0);
  const [ctas, setCtas] = useState([]);
  const [ctasLoaded, setCtasLoaded] = useState(false);
  const [activeCta, setActiveCta] = useState(null);
  const [showMobileComments, setShowMobileComments] = useState(false);
  
  // ✅ Version states
  const [currentVersion, setCurrentVersion] = useState(video.currentVersion);
  const [activeStreamId, setActiveStreamId] = useState(video.streamId);
  const [activeThumbnail, setActiveThumbnail] = useState(video.thumbnailUrl);
  const [loadingVersion, setLoadingVersion] = useState(false);
  
  // ✅ Comparison states
  const [showComparison, setShowComparison] = useState(false);
  const [compareVersionIds, setCompareVersionIds] = useState([]);
  
  const iframeRef = useRef(null);
  const playerRef = useRef(null);

  // Fetch CTAs FIRST
  useEffect(() => {
    if (video?.id) {
      console.log('📥 Fetching CTAs for video:', video.id);
      fetch(`/api/videos/${video.id}/cta`)
        .then(res => res.json())
        .then(data => {
          console.log('✅ CTAs loaded:', data);
          setCtas(data.ctas || []);
          setCtasLoaded(true);
        })
        .catch(err => {
          console.error('❌ Failed to load CTAs:', err);
          setCtasLoaded(true);
        });
    } else {
      setCtasLoaded(true);
    }
  }, [video?.id]);

  // ✅ Handle version change (view only, doesn't persist to DB)
  const handleVersionChange = async (versionNumber, versionStreamId, versionThumbnail) => {
    setLoadingVersion(true);
    try {
      setCurrentVersion(versionNumber);
      setActiveStreamId(versionStreamId);
      setActiveThumbnail(versionThumbnail);
      
      // ✅ Reload iframe with new stream
      if (iframeRef.current && versionStreamId) {
        iframeRef.current.src = `https://customer-5f6vfk6lgnhsk276.cloudflarestream.com/${versionStreamId}/iframe?api=true&preload=true`;
      }
      
      console.log(`[VERSION SWITCH] Viewing version ${versionNumber}, StreamID: ${versionStreamId}`);
    } catch (error) {
      console.error('Failed to switch version:', error);
    } finally {
      setLoadingVersion(false);
    }
  };

  // ✅ Handle comparison request
  const handleCompare = (versionIds) => {
    setCompareVersionIds(versionIds);
    setShowComparison(true);
  };

  // Initialize SDK after CTAs loaded
  useEffect(() => {
    if (!activeStreamId || !ctasLoaded) {
      console.log('⏳ Waiting for CTAs to load before initializing player...');
      return;
    }

    console.log('🎬 CTAs loaded, initializing SDK for streamId:', activeStreamId);

    const loadSDK = async () => {
      if (!window.Stream) {
        console.log('📦 Loading Cloudflare SDK...');
        const script = document.createElement('script');
        script.src = 'https://embed.videodelivery.net/embed/sdk.latest.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
        console.log('✅ SDK loaded');
      }

      if (iframeRef.current && window.Stream) {
        console.log('🔗 Connecting to player...');
        const player = window.Stream(iframeRef.current);
        playerRef.current = player;

        player.addEventListener('timeupdate', () => {
          const time = player.currentTime;
          setCurrentTime(time);

          const matchingCta = ctas.find(c => Math.floor(c.time) === Math.floor(time));
          if (matchingCta && activeCta?.id !== matchingCta.id) {
            console.log('🎯 Showing CTA:', matchingCta);
            setActiveCta(matchingCta);
          }
        });

        console.log('✅ Player connected with', ctas.length, 'CTAs');
      }
    };

    loadSDK();
  }, [ctasLoaded, activeStreamId, ctas]);

  const handleSeek = (time) => {
    if (playerRef.current) {
      playerRef.current.currentTime = time;
      playerRef.current.play();
    }
  };

  // Helper to get iframe URL
  const getIframeUrl = () => {
    if (activeStreamId) {
      return `https://customer-5f6vfk6lgnhsk276.cloudflarestream.com/${activeStreamId}/iframe?api=true&preload=true`;
    }
    if (video?.url) {
      const match = video.url.match(/cloudflarestream\.com\/([a-zA-Z0-9]+)\//);
      if (match) {
        return `https://iframe.videodelivery.net/${match[1]}?api=true&preload=true`;
      }
    }
    return null;
  };

  const iframeUrl = getIframeUrl();

  // Validation
  if (!video) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-2">Error: No video data</p>
        </div>
      </div>
    );
  }

  if (!iframeUrl && !video.url) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-2">Error: Invalid video URL</p>
        </div>
      </div>
    );
  }

  // Show loading screen while CTAs are being fetched
  if (!ctasLoaded) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-gray-400">Preparing interactive content...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ✅ Conditionally render normal player or comparison */}
      {!showComparison ? (
        <div className="h-screen bg-black flex flex-col lg:flex-row overflow-hidden font-sans">
          
          {/* Left Side: Video Player */}
          <div className={`flex-1 flex flex-col relative ${allowComments ? 'lg:w-[70%]' : 'w-full'} h-full`}>
            
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
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-lg md:text-2xl font-bold text-white line-clamp-1">
                      {video.title || 'Untitled Video'}
                    </h1>
                    
                    {/* ✅ Public Version Selector */}
                    <PublicVersionSelector 
                      videoId={video.id}
                      shareToken={shareId}
                      currentVersion={currentVersion}
                      onVersionChange={handleVersionChange}
                      onCompare={handleCompare}
                      loading={loadingVersion}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-3 pointer-events-auto">
                  {allowComments && (
                    <button 
                      onClick={() => setShowMobileComments(!showMobileComments)}
                      className="lg:hidden p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all relative"
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border border-black"></span>
                    </button>
                  )}

                  {allowDownload && video.url && (
                     <a 
                       href={video.url} 
                       download 
                       className="p-2.5 bg-emerald-600 hover:bg-emerald-700 backdrop-blur-md rounded-full text-white transition-all flex items-center gap-2 group"
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
              {/* ✅ Loading overlay while switching versions */}
              {loadingVersion && (
                <div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg font-medium">Loading version {currentVersion}...</p>
                  </div>
                </div>
              )}

              <div className="w-full h-full relative">
                {iframeUrl ? (
                  <iframe
                    ref={iframeRef}
                    src={iframeUrl}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                    allowFullScreen
                    title={video.title || 'Video'}
                  />
                ) : video.url ? (
                  <video 
                    src={video.url} 
                    controls 
                    className="w-full h-full object-contain" 
                    controlsList={!allowDownload ? "nodownload" : undefined}
                  />
                ) : null}
                
                {/* Display Active CTA */}
                <AnimatePresence>
                  {activeCta && <CTAOverlay cta={activeCta} onDismiss={() => setActiveCta(null)} />}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ✅ Right Side: Comments + Description Section */}
          {allowComments && (
            <>
              {/* Desktop Sidebar */}
              <div className="hidden lg:flex w-[400px] bg-white border-l border-gray-200 flex-col h-full shadow-2xl z-30 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50 flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900">Discussion</h3>
                  <span className="ml-auto text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                    Public
                  </span>
                </div>
                
                {/* ✅ Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto">
                  <div className="h-120">
                    <CommentSection 
                      videoId={video.id || shareId}
                      currentTime={currentTime}
                      onSeek={handleSeek}
                      isPublic={true}
                      currentVersion={currentVersion}
                    />
                  </div>
                  {/* ✅ Description Viewer below comments */}
                  <DescriptionViewer 
                    videoId={video.id || shareId}
                    onSeek={handleSeek}
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
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-semibold text-gray-900">Discussion</h3>
                      </div>
                      <button 
                        onClick={() => setShowMobileComments(false)}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                    
                    {/* ✅ Mobile Scrollable Content */}
                    <div className="flex-1 overflow-y-auto">
                      <CommentSection 
                        videoId={video.id || shareId}
                        currentTime={currentTime}
                        onSeek={handleSeek}
                        isPublic={true}
                        currentVersion={currentVersion}
                      />
                      
                      <DescriptionViewer 
                        videoId={video.id || shareId}
                        onSeek={handleSeek}
                      />
                    </div>
                  </motion.div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* ✅ Public Version Comparison View */
        <PublicVersionComparison
          videoId={video.id}
          shareToken={shareId}
          versionIds={compareVersionIds}
          onClose={() => setShowComparison(false)}
          currentVersion={currentVersion}
        />
      )}
    </>
  );
}
