import React from 'react';
import { motion } from 'framer-motion';
import { FaFolder, FaUsers, FaVideo, FaCheckCircle } from 'react-icons/fa';

const Step1CampaignSelect = ({
  campaigns,
  selectedCampaign,
  onSelectCampaign,
  loading,
}) => {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Select a Campaign</h3>
        <p className="text-gray-500">Choose which campaign's content you want to share</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
          />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20">
          <FaFolder className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No campaigns found</p>
          <p className="text-gray-400 text-sm">You need to be assigned to a campaign first</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((c) => (
            <motion.div
              key={c.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectCampaign(c)}
              className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedCampaign?.id === c.id
                  ? 'border-blue-600 bg-blue-50 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {selectedCampaign?.id === c.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-blue-600 rounded-full p-2"
                >
                  <FaCheckCircle className="text-white" />
                </motion.div>
              )}

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FaFolder className="text-white text-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-lg mb-1 truncate">{c.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <FaUsers className="text-gray-400" />
                      {c.members} members
                    </span>
                    <span className="flex items-center gap-1">
                      <FaVideo className="text-gray-400" />
                      {c.videos} videos
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Step1CampaignSelect;
