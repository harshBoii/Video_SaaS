// components/video/VideoPlayer.jsx
import { X } from "lucide-react";
import { useState } from "react";
import ProtectedCommentSection from "./ProtectedCommentSection";

export default function VideoPlayer({ video, onClose }) {
  const [currentTime, setCurrentTime] = useState(0);

  if (!video.streamId) {
    return null;
  }

  const iframeUrl = `https://customer-5f6vfk6lgnhsk276.cloudflarestream.com/${video.streamId}/iframe`;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black flex items-center justify-center p-0"
      onClick={onClose}
    >
      <div 
        className="w-full h-full flex"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video Section - Full width or 70% depending on comments permission */}
        <div className="flex-[7] flex flex-col bg-black">
          <div className="flex items-center justify-between px-6 py-4 bg-black/50">
            <h3 className="text-xl font-bold text-white truncate">{video.title}</h3>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-6xl">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                <iframe
                  src={iframeUrl}
                  className="absolute inset-0 w-full h-full border-0"
                  loading="lazy"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                  allowFullScreen
                  title={video.title}
                />
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-wrap gap-4 text-sm text-gray-300">
              <span>{video.filename}</span>
              <span>•</span>
              <span>{video.durationFormatted}</span>
              <span>•</span>
              <span>{video.originalSizeFormatted}</span>
            </div>
          </div>
        </div>

        {/* Protected Comments Section - Only shows if user has permission */}
        <ProtectedCommentSection videoId={video.id} currentTime={currentTime} />
      </div>
    </div>
  );
}
