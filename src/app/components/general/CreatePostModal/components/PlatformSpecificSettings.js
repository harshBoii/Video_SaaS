import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { platformsConfig } from '../utils/platformConfig';
import TikTokSettings from './platform-settings/TikTokSettings';
import InstagramSettings from './platform-settings/InstagramSettings';
import FacebookSettings from './platform-settings/FacebookSettings';
import YouTubeSettings from './platform-settings/YouTubeSettings';
import LinkedInSettings from './platform-settings/LinkedInSettings';

const PlatformSpecificSettings = ({ selectedPlatforms, platformConfigs, onUpdatePlatform }) => {
  const [expandedPlatforms, setExpandedPlatforms] = useState({});

  const togglePlatform = (platform) => {
    setExpandedPlatforms((prev) => ({
      ...prev,
      [platform]: !prev[platform],
    }));
  };

  const handleSettingChange = (platform, field, value) => {
    onUpdatePlatform(platform, 'platformSpecificData', {
      ...(platformConfigs.find((p) => p.platform === platform)?.platformSpecificData || {}),
      [field]: value,
    });
  };

  const renderPlatformSettings = (platform, settings) => {
    switch (platform) {
      case 'tiktok':
        return (
          <TikTokSettings
            settings={settings}
            onChange={(field, value) => handleSettingChange(platform, field, value)}
          />
        );
      case 'instagram':
        return (
          <InstagramSettings
            settings={settings}
            onChange={(field, value) => handleSettingChange(platform, field, value)}
          />
        );
      case 'facebook':
        return (
          <FacebookSettings
            settings={settings}
            onChange={(field, value) => handleSettingChange(platform, field, value)}
          />
        );
      case 'youtube':
        return (
          <YouTubeSettings
            settings={settings}
            onChange={(field, value) => handleSettingChange(platform, field, value)}
          />
        );
      case 'linkedin':
        return (
          <LinkedInSettings
            settings={settings}
            onChange={(field, value) => handleSettingChange(platform, field, value)}
          />
        );
      default:
        return null;
    }
  };

  if (selectedPlatforms.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-gray-900">Platform-Specific Settings</h4>
        <p className="text-sm text-gray-500">Customize settings for each platform</p>
      </div>

      {selectedPlatforms.map((selected) => {
        const platformConfig = platformsConfig.find((p) => p.value === selected.platform);
        const config = platformConfigs.find((p) => p.platform === selected.platform) || {};
        const Icon = platformConfig?.icon;
        const isExpanded = expandedPlatforms[selected.platform];

        return (
          <div key={selected.platform} className="border-2 border-gray-200 rounded-2xl overflow-hidden">
            <button
              onClick={() => togglePlatform(selected.platform)}
              className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {Icon && (
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${platformConfig.gradient} flex items-center justify-center`}
                  >
                    <Icon className="text-white text-lg" />
                  </div>
                )}
                <div className="text-left">
                  <h5 className="font-bold text-gray-900">{platformConfig?.name}</h5>
                  <p className="text-xs text-gray-500">
                    {isExpanded ? 'Click to collapse' : 'Click to expand settings'}
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <FaChevronUp className="text-gray-600" />
              ) : (
                <FaChevronDown className="text-gray-600" />
              )}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-4">
                    {renderPlatformSettings(selected.platform, config.platformSpecificData || {})}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default PlatformSpecificSettings;
