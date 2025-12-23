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
    "relative overflow-hidden text-primary font-semibold border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl shadow-lg rounded-lg p-2 transition-all duration-200 group flex items-center justify-center h-10 w-10 flex-shrink-0";

  const highlight =
    "absolute inset-0 pointer-events-none rounded-lg bg-gradient-to-r from-primary/20 to-primary/10 scale-0 group-hover:scale-100 transition-transform";

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
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <Share2 className="w-4 h-4 text-primary" />
          )}
        </span>
      </motion.button>

      {/* Full Screen Modal - Lazy Loaded */}
      {showModal && (
        <Suspense
          fallback={
            <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md" style={{ zIndex: 99999 }}>
              <div className="w-12 h-12 glass-card rounded-2xl shadow-2xl flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
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
