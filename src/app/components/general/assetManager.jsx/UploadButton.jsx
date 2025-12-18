// components/asset-library/UploadButton.jsx
import { motion } from 'framer-motion';

export default function UploadButton({ onUploadComplete }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        // Open upload modal or navigate to upload page
        window.location.href = '/upload';
      }}
      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold shadow-lg transition-all flex items-center gap-2"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Upload Asset
    </motion.button>
  );
}
