import React from 'react';
import { motion } from 'framer-motion';
import { FaCheck } from 'react-icons/fa';
import { platformsConfig } from '../utils/platformConfig';

const Step3PlatformSelect = ({
  selectedPlatforms,
  connectedAccounts,
  onTogglePlatform,
}) => {
  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Platforms</h3>
        <p className="text-gray-500">Select where you want to publish this content</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {platformsConfig.map((platform) => {
          const Icon = platform.icon;
          const account = connectedAccounts.find(
            (acc) => acc.platform.toLowerCase() === platform.value.toLowerCase()
          );
          const isConnected = !!account;
          const isSelected = selectedPlatforms.some((p) => p.platform === platform.value);

          return (
            <motion.button
              key={platform.value}
              whileHover={{ scale: isConnected ? 1.05 : 1 }}
              whileTap={{ scale: isConnected ? 0.95 : 1 }}
              onClick={() => onTogglePlatform(platform.value)}
              disabled={!isConnected}
              className={`relative p-4 rounded-2xl border-2 transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              } ${!isConnected && 'opacity-50 cursor-not-allowed'}`}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-blue-600 rounded-full p-1.5"
                >
                  <FaCheck className="text-white text-xs" />
                </motion.div>
              )}
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${platform.gradient} flex items-center justify-center mx-auto mb-3 shadow-lg`}
              >
                <Icon className="text-white text-2xl" />
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-1">{platform.name}</p>
              <p className="text-xs text-gray-500">{platform.description}</p>
              {!isConnected && (
                <div className="mt-2 text-xs text-red-500 font-medium">Not connected</div>
              )}
            </motion.button>
          );
        })}
      </div>

      {selectedPlatforms.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-blue-800 font-medium">
            {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''}{' '}
            selected
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default Step3PlatformSelect;
