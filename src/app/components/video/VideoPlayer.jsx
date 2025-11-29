'use client';
import { X, ExternalLink, PlusCircle, Link as LinkIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import ProtectedCommentSection from "./ProtectedCommentSection";
import { motion, AnimatePresence } from "framer-motion";
import ProtectedButton from "../general/protectedButton";

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

// --- CTA Creator Form ---
const CTACreator = ({ currentTime, onSave, onCancel }) => {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [position, setPosition] = useState("center");

  return (
    <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-96">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-blue-600" /> Add Interactive Button
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Button Text</label>
            <input 
              type="text" 
              value={text} 
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g., Book a Meeting" 
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Link URL</label>
            <input 
              type="url" 
              value={url} 
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..." 
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Color</label>
              <input 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-9 mt-1 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Position</label>
              <select 
                value={position} 
                onChange={(e) => setPosition(e.target.value)}
                className="w-full mt-1 px-2 py-2 border rounded-lg text-sm"
              >
                <option value="center">Center</option>
                <option value="top-right">Top Right</option>
                <option value="bottom-right">Bottom Right</option>
              </select>
            </div>
          </div>

          <div className="pt-2 text-xs text-gray-500 text-center">
            Will appear at <span className="font-mono font-bold">{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={onCancel}
              className="flex-1 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button 
              onClick={() => onSave({ text, url, color, position, time: currentTime })}
              disabled={!text || !url}
              className="flex-1 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              Add Button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function VideoPlayer({ video, onClose }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [ctas, setCtas] = useState([]);
  const [activeCta, setActiveCta] = useState(null);
  const [isCreatingCta, setIsCreatingCta] = useState(false);
  const iframeRef = useRef(null);
  const playerRef = useRef(null); // Reference for the Stream Player instance

  // Fetch CTAs
  useEffect(() => {
    if (video?.id) {
      fetch(`/api/videos/${video.id}/cta`)
        .then(res => res.json())
        .then(data => setCtas(data.ctas || []));
    }
  }, [video?.id]);

  // Initialize Cloudflare Stream SDK
  useEffect(() => {
    const loadSDK = async () => {
      if (!window.Stream) {
        const script = document.createElement('script');
        script.src = 'https://embed.videodelivery.net/embed/sdk.latest.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
      }

      if (iframeRef.current && window.Stream) {
        const player = window.Stream(iframeRef.current);
        playerRef.current = player;

        // Listen for time updates (RELIABLE)
        player.addEventListener('timeupdate', () => {
          const time = player.currentTime;
          setCurrentTime(time);

          // Check for CTAs
          const matchingCta = ctas.find(c => Math.floor(c.time) === Math.floor(time));
          if (matchingCta && activeCta?.id !== matchingCta.id) {
            setActiveCta(matchingCta);
          }
        });

        // Optional: Listen for other events
        player.addEventListener('play', () => console.log('Video playing'));
      }
    };

    loadSDK();

    // Cleanup
    return () => {
      // Cloudflare SDK doesn't have a strict destroy method for the wrapper, 
      // but removing the iframe cleans up listeners attached to it.
    };
  }, [video?.streamId, ctas, activeCta]);

  // Create CTA Handler
  const handleCreateCta = async (ctaData) => {
    try {
      const res = await fetch(`/api/videos/${video.id}/cta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ctaData, type: 'BUTTON' })
      });
      const data = await res.json();
      if (data.success) {
        setCtas([...ctas, data.cta]);
        setIsCreatingCta(false);
      }
    } catch (error) {
      console.error("Failed to create CTA", error);
    }
  };

  // ✅ RELIABLE SEEKING USING SDK
  const handleSeek = (time) => {
    if (playerRef.current) {
      playerRef.current.currentTime = time; // SDK setter
      playerRef.current.play(); // Optional: auto-play after seek
    }
  };

  if (!video?.streamId) return null;
  
  // URL doesn't strictly need ?api=true when using the SDK wrapper, 
  // but keeping it is good practice.
  const iframeUrl = `https://customer-5f6vfk6lgnhsk276.cloudflarestream.com/${video.streamId}/iframe?api=true`;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={onClose}>
      <div className="w-full h-full flex" onClick={(e) => e.stopPropagation()}>
        {/* Video Area */}
        <div className="flex-[7] flex flex-col bg-black relative group">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <h3 className="text-xl font-bold text-white">{video.title}</h3>
            
            <div className="flex items-center gap-4">
              {/* Add CTA Button */}
              <ProtectedButton requiredPermissions={['Edit Video']}>
                <button 
                  onClick={() => setIsCreatingCta(true)}
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <LinkIcon className="w-4 h-4" /> Add Button
                </button>
              </ProtectedButton>

              <button onClick={onClose} className="text-white hover:text-gray-300">
                <X className="w-8 h-8" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-6 relative">
            <div className="w-full max-w-6xl relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
              <iframe
                ref={iframeRef}
                src={iframeUrl}
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
              />
              
              {/* Display Active CTA */}
              <AnimatePresence>
                {activeCta && <CTAOverlay cta={activeCta} onDismiss={() => setActiveCta(null)} />}
              </AnimatePresence>

              {/* Display CTA Creator Modal */}
              {isCreatingCta && (
                <CTACreator 
                  currentTime={currentTime} 
                  onSave={handleCreateCta} 
                  onCancel={() => setIsCreatingCta(false)} 
                />
              )}
            </div>
          </div>
        </div>

        {/* Comments */}
        <ProtectedCommentSection videoId={video.id} currentTime={currentTime} onSeek={handleSeek} />
      </div>
    </div>
  );
}
