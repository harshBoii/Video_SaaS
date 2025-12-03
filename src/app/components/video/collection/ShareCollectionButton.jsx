'use client';
import { Share2, Loader2 } from 'lucide-react';
import { useState, useTransition, Suspense } from 'react';
import { motion } from 'framer-motion';
import { lazy } from 'react';

const ShareButtonWithContext = lazy(() =>
  import('@/app/context/ShareButtonWithContext')
);

export default function ShareCollectionButton({ campaignId, preSelectedVideos = [] }) {
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => {
      setShowModal(true);
    });
  };

  const glassButton =
    "relative overflow-hidden text-blue-700 font-semibold border shadow-xl rounded-lg p-2 transition-all duration-200 group flex items-center justify-center h-10 w-10 flex-shrink-0";

  const highlight =
    "absolute inset-0 pointer-events-none rounded-lg bg-gradient-to-r from-blue-500/20 to-indigo-500/20 scale-0 group-hover:scale-100 transition-transform";

  return (
    <motion.div className="flex-shrink-0 relative">
      {/* Single Share Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        disabled={isPending || showModal}
        className={glassButton}
        title="Share Collection"
      >
        <span className={highlight} />
        <span className="relative z-10">
          {isPending || showModal ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <Share2 className="w-4 h-4 text-blue-700" />
          )}
        </span>
      </motion.button>

      {/* Full Screen Modal - Lazy Loaded */}
      {showModal && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="w-12 h-12 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl flex items-center justify-center border border-gray-200">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            </div>
          }
        >
          <ShareButtonWithContext 
            campaignId={campaignId} 
            preSelectedVideos={preSelectedVideos}
            onClose={() => {
              setShowModal(false);
            }}
          />
        </Suspense>
      )}
    </motion.div>
  );
}
