import React from 'react';
import { motion } from 'framer-motion';
import { FaClock } from 'react-icons/fa';
import { platformsConfig } from '../utils/platformConfig';

const PerPlatformSchedule = ({ selectedPlatforms, platformConfigs, onUpdatePlatform }) => {
  const handleScheduleChange = (platform, value) => {
    onUpdatePlatform(platform, 'scheduledFor', value);
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <FaClock className="text-blue-600 text-xl mt-1" />
          <div>
            <h5 className="font-bold text-blue-900 mb-1">Advanced Scheduling</h5>
            <p className="text-sm text-blue-700">
              Set different publish times for each platform. Leave empty to use the global schedule
              above.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {selectedPlatforms.map((selected) => {
          const platformConfig = platformsConfig.find((p) => p.value === selected.platform);
          const config = platformConfigs.find((p) => p.platform === selected.platform) || {};
          const Icon = platformConfig?.icon;

          return (
            <motion.div
              key={selected.platform}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-2 border-gray-200 rounded-xl p-4 bg-white hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                {Icon && (
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${platformConfig.gradient} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className="text-white text-lg" />
                  </div>
                )}
                <div className="flex-1">
                  <h5 className="font-bold text-gray-900">{platformConfig?.name}</h5>
                  <p className="text-xs text-gray-500">Custom schedule (optional)</p>
                </div>
              </div>

              <input
                type="datetime-local"
                value={config.scheduledFor || ''}
                onChange={(e) => handleScheduleChange(selected.platform, e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Use global schedule"
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default PerPlatformSchedule;
