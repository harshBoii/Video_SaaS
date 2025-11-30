'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Play, Pause, SkipBack, SkipForward, Volume2, 
  VolumeX, MessageSquare, User, Clock, Calendar, 
  FileVideo, ArrowLeftRight, Loader2, Maximize2,
  CheckCircle, AlertCircle, Sparkles
} from 'lucide-react';
import { showError } from '@/app/lib/swal';

export default function VersionComparison({ videoId, versionIds, onClose }) {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [playersReady, setPlayersReady] = useState(false);

  const iframeRef1 = useRef(null);
  const iframeRef2 = useRef(null);
  const playerRef1 = useRef(null);
  const playerRef2 = useRef(null);

  useEffect(() => {
    loadComparison();
  }, [videoId, versionIds]);

  useEffect(() => {
    if (comparison) {
      initializePlayers();
    }
    
    return () => {
      // Cleanup players
      playerRef1.current = null;
      playerRef2.current = null;
    };
  }, [comparison]);

  const loadComparison = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/versions/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ versionIds })
      });

      const data = await res.json();
      if (data.success) {
        setComparison(data.comparison);
      } else {
        showError('Error', data.error);
        onClose();
      }
    } catch (error) {
      showError('Error', 'Failed to load comparison');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const initializePlayers = async () => {
    // Load Cloudflare Stream SDK if not already loaded
    if (!window.Stream) {
      const script = document.createElement('script');
      script.src = 'https://embed.videodelivery.net/embed/sdk.latest.js';
      script.async = true;
      document.body.appendChild(script);
      await new Promise(resolve => script.onload = resolve);
    }

    // Wait for iframes to load
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (iframeRef1.current && iframeRef2.current && window.Stream) {
      try {
        // Initialize players
        const player1 = window.Stream(iframeRef1.current);
        const player2 = window.Stream(iframeRef2.current);
        
        playerRef1.current = player1;
        playerRef2.current = player2;

        console.log('✅ Stream SDK initialized');

        // Wait for metadata to load
        await Promise.all([
          new Promise((resolve) => {
            player1.addEventListener('loadedmetadata', () => {
              console.log('Player 1 metadata loaded');
              resolve();
            });
          }),
          new Promise((resolve) => {
            player2.addEventListener('loadedmetadata', () => {
              console.log('Player 2 metadata loaded');
              resolve();
            });
          })
        ]);

        // Set initial duration from player 1
        if (player1.duration) {
          setDuration(player1.duration);
          console.log('Duration set:', player1.duration);
        }

        // ✅ Listen to timeupdate event - access currentTime as property
        player1.addEventListener('timeupdate', () => {
          const time = player1.currentTime;
          setCurrentTime(time || 0);
          
          // ✅ Sync player 2 with player 1
          if (player2 && Math.abs(player2.currentTime - time) > 0.5) {
            player2.currentTime = time;
          }
        });

        // ✅ Listen to play/pause events
        player1.addEventListener('play', () => {
          console.log('Player 1 playing');
          setPlaying(true);
          // Also play player 2
          if (player2) player2.play();
        });

        player1.addEventListener('pause', () => {
          console.log('Player 1 paused');
          setPlaying(false);
          // Also pause player 2
          if (player2) player2.pause();
        });

        player1.addEventListener('ended', () => {
          console.log('Playback ended');
          setPlaying(false);
        });

        // Set initial volume and muted state
        player1.volume = volume;
        player2.volume = volume;
        player1.muted = muted;
        player2.muted = muted;

        setPlayersReady(true);
        console.log('✅ Players ready');
      } catch (error) {
        console.error('Failed to initialize players:', error);
        showError('Error', 'Failed to initialize video players');
      }
    }
  };

  const handlePlayPause = () => {
    if (!playersReady || !playerRef1.current || !playerRef2.current) {
      console.warn('Players not ready yet');
      return;
    }

    try {
      if (playing) {
        playerRef1.current.pause();
        playerRef2.current.pause();
        setPlaying(false);
      } else {
        playerRef1.current.play();
        playerRef2.current.play();
        setPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  const handleSeek = (seconds) => {
    if (!playersReady || !playerRef1.current || !playerRef2.current) return;

    try {
      const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
      playerRef1.current.currentTime = newTime;
      playerRef2.current.currentTime = newTime;
      setCurrentTime(newTime);
    } catch (error) {
      console.error('Seek error:', error);
    }
  };

  const handleVolumeToggle = () => {
    if (!playersReady) return;

    const newMuted = !muted;
    try {
      if (playerRef1.current) playerRef1.current.muted = newMuted;
      if (playerRef2.current) playerRef2.current.muted = newMuted;
      setMuted(newMuted);
    } catch (error) {
      console.error('Volume toggle error:', error);
    }
  };

  const handleVolumeChange = (e) => {
    if (!playersReady) return;

    const newVolume = parseFloat(e.target.value);
    try {
      if (playerRef1.current) playerRef1.current.volume = newVolume;
      if (playerRef2.current) playerRef2.current.volume = newVolume;
      setVolume(newVolume);
      setMuted(newVolume === 0);
    } catch (error) {
      console.error('Volume change error:', error);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    const gb = parseFloat(bytes) / (1024 ** 3);
    return `${gb.toFixed(2)} GB`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white text-lg font-medium"
          >
            Loading comparison...
          </motion.p>
        </div>
      </motion.div>
    );
  }

  if (!comparison) return null;

  const [version1, version2] = comparison.versions;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Header */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 shadow-xl"
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            <ArrowLeftRight className="w-6 h-6 text-blue-400" />
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {comparison.videoTitle}
              <Sparkles className="w-5 h-5 text-yellow-400" />
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Version {version1.version} vs Version {version2.version}
            </p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </motion.button>
      </motion.div>

      {/* Video Players - Side by Side */}
      <div className="flex-1 flex overflow-hidden">
        {/* Version 1 */}
        <motion.div 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex flex-col border-r border-gray-700"
        >
          <div className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 border-b border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <FileVideo className="w-5 h-5 text-blue-400" />
                </motion.div>
                <h3 className="text-lg font-bold text-white">Version {version1.version}</h3>
              </div>
              
              <motion.span 
                whileHover={{ scale: 1.05 }}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                  version1.isActive 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-gray-700 text-gray-400 border border-gray-600'
                }`}
              >
                {version1.isActive && <CheckCircle className="w-3 h-3" />}
                {version1.isActive ? 'Active' : 'Inactive'}
              </motion.span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2"
              >
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-300 truncate">{version1.uploaderName}</span>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2"
              >
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-300 truncate">{formatDate(version1.createdAt)}</span>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2"
              >
                <FileVideo className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-300">{formatFileSize(version1.fileSize)}</span>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2"
              >
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400 font-medium">{version1.status}</span>
              </motion.div>
            </div>
            
            {version1.versionNote && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"
              >
                <p className="text-sm text-blue-300 italic">"{version1.versionNote}"</p>
              </motion.div>
            )}
          </div>
          
          <div className="flex-1 bg-black flex items-center justify-center p-4">
            {version1.streamId ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full h-full"
              >
                <iframe
                  ref={iframeRef1}
                  src={`https://customer-5f6vfk6lgnhsk276.cloudflarestream.com/${version1.streamId}/iframe?api=true`}
                  className="w-full h-full border-0 rounded-lg"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                  allowFullScreen
                />
              </motion.div>
            ) : (
              <div className="text-center">
                <Loader2 className="w-16 h-16 text-gray-600 mx-auto mb-3 animate-spin" />
                <p className="text-gray-500">Processing video...</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Version 2 */}
        <motion.div 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex flex-col"
        >
          <div className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 border-b border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  <FileVideo className="w-5 h-5 text-purple-400" />
                </motion.div>
                <h3 className="text-lg font-bold text-white">Version {version2.version}</h3>
              </div>
              
              <motion.span 
                whileHover={{ scale: 1.05 }}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                  version2.isActive 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-gray-700 text-gray-400 border border-gray-600'
                }`}
              >
                {version2.isActive && <CheckCircle className="w-3 h-3" />}
                {version2.isActive ? 'Active' : 'Inactive'}
              </motion.span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2"
              >
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-300 truncate">{version2.uploaderName}</span>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2"
              >
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-300 truncate">{formatDate(version2.createdAt)}</span>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2"
              >
                <FileVideo className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-300">{formatFileSize(version2.fileSize)}</span>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2"
              >
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400 font-medium">{version2.status}</span>
              </motion.div>
            </div>
            
            {version2.versionNote && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg"
              >
                <p className="text-sm text-purple-300 italic">"{version2.versionNote}"</p>
              </motion.div>
            )}
          </div>
          
          <div className="flex-1 bg-black flex items-center justify-center p-4">
            {version2.streamId ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full h-full"
              >
                <iframe
                  ref={iframeRef2}
                  src={`https://customer-5f6vfk6lgnhsk276.cloudflarestream.com/${version2.streamId}/iframe?api=true`}
                  className="w-full h-full border-0 rounded-lg"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                  allowFullScreen
                />
              </motion.div>
            ) : (
              <div className="text-center">
                <Loader2 className="w-16 h-16 text-gray-600 mx-auto mb-3 animate-spin" />
                <p className="text-gray-500">Processing video...</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Synchronized Controls */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-gray-700 p-4 shadow-2xl"
      >
        <div className="max-w-6xl mx-auto">
          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-6 mb-4">
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSeek(-10)}
              disabled={!playersReady}
              className="p-3 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SkipBack className="w-5 h-5 text-white" />
            </motion.button>

            <motion.button
              whileHover={{ scale: playersReady ? 1.15 : 1 }}
              whileTap={{ scale: playersReady ? 0.9 : 1 }}
              onClick={handlePlayPause}
              disabled={!playersReady}
              className="p-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed relative"
            >
              {!playersReady ? (
                <Loader2 className="w-7 h-7 text-white animate-spin" />
              ) : playing ? (
                <Pause className="w-7 h-7 text-white" />
              ) : (
                <Play className="w-7 h-7 text-white ml-0.5" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSeek(10)}
              disabled={!playersReady}
              className="p-3 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SkipForward className="w-5 h-5 text-white" />
            </motion.button>
          </div>

          {/* Time and Volume */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-mono text-white min-w-[60px]">
              {formatTime(currentTime)}
            </span>

            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                style={{ 
                  width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%'
                }}
                transition={{ duration: 0.1 }}
              />
            </div>

            <span className="text-sm font-mono text-white min-w-[60px]">
              {formatTime(duration)}
            </span>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleVolumeToggle}
                disabled={!playersReady}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
              >
                {muted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </motion.button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                disabled={!playersReady}
                className="w-24 accent-blue-500 disabled:opacity-50"
              />
            </div>

            {comparison.comments && comparison.comments.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowComments(!showComments)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors relative"
              >
                <MessageSquare className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {comparison.comments.length}
                </span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Comments Panel */}
      <AnimatePresence>
        {showComments && comparison.comments && comparison.comments.length > 0 && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="absolute bottom-24 right-4 w-96 max-h-[500px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">
                  Comments ({comparison.comments.length})
                </h3>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowComments(false)}
                className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </motion.button>
            </div>
            
            <div className="overflow-y-auto max-h-[400px] p-4 space-y-3">
              {comparison.comments.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-white">
                      {comment.employee ? 
                        `${comment.employee.firstName} ${comment.employee.lastName}` : 
                        comment.guestName || 'Anonymous'
                      }
                    </span>
                    {comment.timestamp !== null && (
                      <span className="text-xs text-blue-400 font-mono ml-auto">
                        {formatTime(comment.timestamp)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{comment.content}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
