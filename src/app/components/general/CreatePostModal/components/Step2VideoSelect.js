import React from 'react';
import { motion } from 'framer-motion';
import { FaVideo, FaPlay, FaCheckCircle, FaTrash } from 'react-icons/fa';

const Step2VideoSelect = ({
  availableVideos,
  selectedVideos,
  onToggleVideo,
  onRemoveVideo,
  onClearAll,
  campaignName,
  loading,
}) => {
  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Select Videos to Post</h3>
        <p className="text-gray-500">Choose from {campaignName || 'campaign'} videos</p>
        {selectedVideos.length > 0 && (
          <p className="text-blue-600 font-medium mt-2">
            {selectedVideos.length} video{selectedVideos.length > 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {selectedVideos.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Selected Videos</h4>
            <button
              onClick={onClearAll}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedVideos.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-blue-300"
              >
                <FaVideo className="text-blue-600" />
                <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                  {v.title}
                </span>
                <button
                  onClick={() => onRemoveVideo(v.id)}
                  className="p-1 hover:bg-red-100 rounded"
                >
                  <FaTrash className="text-xs text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
          />
        </div>
      ) : availableVideos.length === 0 ? (
        <div className="text-center py-20">
          <FaVideo className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No videos available</p>
          <p className="text-gray-400 text-sm">Upload videos to this campaign first</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {availableVideos.map((v) => {
            const isSelected = selectedVideos.some((sv) => sv.id === v.id);
            return (
              <motion.div
                key={v.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onToggleVideo(v)}
                className={`relative rounded-xl overflow-hidden cursor-pointer border-4 transition-all ${
                  isSelected
                    ? 'border-blue-600 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="aspect-video bg-gray-900 relative group">
                  {v.thumbnailUrl ? (
                    <img
                      src={v.thumbnailUrl}
                      alt={v.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaVideo className="text-4xl text-gray-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <FaPlay className="text-white text-3xl" />
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-blue-600 rounded-full p-2">
                      <FaCheckCircle className="text-white" />
                    </div>
                  )}
                </div>
                <div className="p-3 bg-white">
                  <p className="font-medium text-sm text-gray-900 truncate">{v.title}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default Step2VideoSelect;
