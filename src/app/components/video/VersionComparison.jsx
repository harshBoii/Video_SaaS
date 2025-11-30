'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Play, Pause, SkipBack, SkipForward, Volume2, 
  VolumeX, MessageSquare, User, Clock, Calendar, 
  FileVideo, ArrowLeftRight, Loader2, CheckCircle, Sparkles
} from 'lucide-react';
import { showError } from '@/app/lib/swal';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
function formatFileSize(bytes) {
  const gb = parseFloat(bytes) / (1024 ** 3);
  return `${gb.toFixed(2)} GB`;
}
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function useCloudflarePlayer(ref) {
  const sdk = useRef(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  // initialize player once ref ready
  useEffect(() => {
    let isMounted = true;

    async function initSdk() {
      if (!ref.current) return;
      if (!window.Stream) {
        const script = document.createElement('script');
        script.src = 'https://embed.videodelivery.net/embed/sdk.latest.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise(r => script.onload = r);
      }
      if (!isMounted) return;

      sdk.current = window.Stream(ref.current);
      sdk.current.addEventListener('loadedmetadata', () => {
        setDuration(sdk.current.duration || 0);
        setCurrentTime(sdk.current.currentTime || 0);
        setReady(true);
      });
      sdk.current.addEventListener('play', () => setPlaying(true));
      sdk.current.addEventListener('pause', () => setPlaying(false));
      sdk.current.addEventListener('ended', () => setPlaying(false));
      sdk.current.addEventListener('timeupdate', () => setCurrentTime(sdk.current.currentTime || 0));
      sdk.current.addEventListener('volumechange', () => {
        setVolume(sdk.current.volume);
        setMuted(sdk.current.muted);
      });
    }
    initSdk();

    return () => { isMounted = false; }
  }, [ref]);

  // controls
  const handlePlayPause = () => {
    if (!sdk.current) return;
    if (playing) sdk.current.pause();
    else sdk.current.play();
  };
  const handleSeek = (delta) => {
    if (!sdk.current) return;
    let newTime = Math.max(0, Math.min((sdk.current.currentTime || 0) + delta, duration));
    sdk.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  const handleVolumeToggle = () => {
    if (!sdk.current) return;
    sdk.current.muted = !sdk.current.muted;
  };
  const handleVolumeChange = ( e ) => {
    if (!sdk.current) return;
    let v = parseFloat(e.target.value);
    sdk.current.volume = v;
    setMuted(v === 0);
  };

  return {
    ready, playing, currentTime, duration, volume, muted,
    handlePlayPause, handleSeek, handleVolumeToggle, handleVolumeChange,
  };
}

export default function VersionComparison({ videoId, versionIds, onClose }) {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);

  const iframeRef1 = useRef(null), iframeRef2 = useRef(null);

  const player1 = useCloudflarePlayer(iframeRef1);
  const player2 = useCloudflarePlayer(iframeRef2);

  useEffect(() => {
    loadComparison();
    // eslint-disable-next-line
  }, [videoId, versionIds]);

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
      if (data.success) setComparison(data.comparison);
      else {
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

  if (loading) return (
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
  if (!comparison) return null;

  const [version1, version2] = comparison.versions;
  // Individual player controls, duplicated for both
  const playerControl = (player) => (
    <div className="flex flex-col px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border-t border-gray-700">
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.1}} whileTap={{ scale: 0.95 }}
          onClick={() => player.handleSeek(-10)}
          disabled={!player.ready}
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50">
          <SkipBack className="w-5 h-5"/>
        </motion.button>
        <motion.button
          whileHover={{ scale: player.ready ? 1.15 : 1 }} whileTap={{ scale: player.ready ? 0.9 : 1 }}
          onClick={player.handlePlayPause}
          disabled={!player.ready}
          className="p-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-50 relative"
        >
          {!player.ready
            ? <Loader2 className="w-6 h-6 animate-spin" />
            : player.playing
              ? <Pause className="w-6 h-6" />
              : <Play className="w-6 h-6" />
          }
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
          onClick={() => player.handleSeek(10)}
          disabled={!player.ready}
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50">
          <SkipForward className="w-5 h-5"/>
        </motion.button>
        <span className="text-sm font-mono text-gray-200 min-w-[48px]">
          {formatTime(player.currentTime)}/{formatTime(player.duration)}
        </span>
        <motion.button
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
          onClick={player.handleVolumeToggle}
          disabled={!player.ready}
          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50"
        >
          {player.muted ? <VolumeX className="w-5 h-5"/> : <Volume2 className="w-5 h-5"/>}
        </motion.button>
        <input
          type="range" min="0" max="1" step="0.01" value={player.volume}
          onChange={player.handleVolumeChange} disabled={!player.ready}
          className="w-20 accent-blue-500 disabled:opacity-50"
        />
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Header */}
      <motion.div 
        initial={{ y: -100 }} animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 shadow-xl"
      >
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}><ArrowLeftRight className="w-6 h-6 text-blue-400" /></motion.div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {comparison.videoTitle}<Sparkles className="w-5 h-5 text-yellow-400" />
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">Version {version1.version} vs Version {version2.version}</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </motion.button>
      </motion.div>

      <div className="flex-1 flex overflow-hidden">
        {/* Version 1 player/controls/infos */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex flex-col border-r border-gray-700"
        >
          <div className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 border-b border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileVideo className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">Version {version1.version}</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                version1.isActive 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-gray-700 text-gray-400 border border-gray-600'
              }`}>
                {version1.isActive && <CheckCircle className="w-3 h-3" />}
                {version1.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2"><User className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-300 truncate">{version1.uploaderName}</span></div>
              <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2"><Calendar className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-300 truncate">{formatDate(version1.createdAt)}</span></div>
              <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2"><FileVideo className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-300">{formatFileSize(version1.fileSize)}</span></div>
              <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2"><CheckCircle className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400 font-medium">{version1.status}</span></div>
            </div>
            {version1.versionNote && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"
              >
                <p className="text-sm text-blue-300 italic">"{version1.versionNote}"</p>
              </motion.div>
            )}
          </div>
          <div className="flex-1 bg-black flex items-center justify-center p-4">
            {version1.streamId ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="w-full h-full">
                <iframe
                  ref={iframeRef1}
                  src={`https://customer-5f6vfk6lgnhsk276.cloudflarestream.com/${version1.streamId}/iframe?api=true`}
                  className="w-full h-full border-0 rounded-lg"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                  allowFullScreen
                />
              </motion.div>
            ) : (
              <div className="text-center"><Loader2 className="w-16 h-16 text-gray-600 mx-auto mb-3 animate-spin" /><p className="text-gray-500">Processing video...</p></div>
            )}
          </div>
          {/* Controls for player1 */}
          {playerControl(player1)}
        </motion.div>

        {/* Version 2 player/controls/infos */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex flex-col"
        >
          <div className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 border-b border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileVideo className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Version {version2.version}</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                version2.isActive 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-gray-700 text-gray-400 border border-gray-600'
              }`}>
                {version2.isActive && <CheckCircle className="w-3 h-3" />}
                {version2.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2"><User className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-300 truncate">{version2.uploaderName}</span></div>
              <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2"><Calendar className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-300 truncate">{formatDate(version2.createdAt)}</span></div>
              <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2"><FileVideo className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-300">{formatFileSize(version2.fileSize)}</span></div>
              <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2"><CheckCircle className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400 font-medium">{version2.status}</span></div>
            </div>
            {version2.versionNote && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg"
              >
                <p className="text-sm text-purple-300 italic">"{version2.versionNote}"</p>
              </motion.div>
            )}
          </div>
          <div className="flex-1 bg-black flex items-center justify-center p-4">
            {version2.streamId ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="w-full h-full">
                <iframe
                  ref={iframeRef2}
                  src={`https://customer-5f6vfk6lgnhsk276.cloudflarestream.com/${version2.streamId}/iframe?api=true`}
                  className="w-full h-full border-0 rounded-lg"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                  allowFullScreen
                />
              </motion.div>
            ) : (
              <div className="text-center"><Loader2 className="w-16 h-16 text-gray-600 mx-auto mb-3 animate-spin" /><p className="text-gray-500">Processing video...</p></div>
            )}
          </div>
          {/* Controls for player2 */}
          {playerControl(player2)}
        </motion.div>
      </div>

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
                      {comment.employee ? `${comment.employee.firstName} ${comment.employee.lastName}` : comment.guestName || 'Anonymous'}
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
