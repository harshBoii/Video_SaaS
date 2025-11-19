import { X } from "lucide-react";
export default function VideoPlayer({ video, onClose }) {
  if (!video.streamId) {
    return null;
  }

  // Use the customer subdomain format instead
  const iframeUrl = `https://customer-5f6vfk6lgnhsk276.cloudflarestream.com/${video.streamId}/iframe`;
  console.log("Stream ID is:",video.streamId)
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-6xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-14 right-0 text-white hover:text-gray-300 z-10"
        >
          <X className="w-10 h-10" />
        </button>

        <div className="bg-black rounded-lg overflow-hidden shadow-2xl">
          <div className="relative aspect-video">
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

        <div className="mt-6 text-white">
          <h3 className="text-2xl font-bold mb-2">{video.title}</h3>
          <div className="flex flex-wrap gap-4 text-sm text-gray-300">
            <span>{video.filename}</span>
            <span>•</span>
            <span>{video.durationFormatted}</span>
            <span>•</span>
            <span>{video.originalSizeFormatted}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
