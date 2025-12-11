import React from 'react';
import { motion } from 'framer-motion';
import GlobalContentForm from './GlobalContentForm';
import PlatformSpecificSettings from './PlatformSpecificSettings';

const Step4ContentCreation = ({
  formData,
  selectedPlatforms,
  platformConfigs,
  onUpdateGlobal,
  onUpdatePlatform,
}) => {
  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Create Your Post</h3>
        <p className="text-gray-500">Add engaging content for your audience</p>
      </div>

      {/* Global Content Form */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">
            1
          </span>
          Global Content
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          This content will be used across all platforms unless you customize it below
        </p>
        <GlobalContentForm formData={formData} onChange={onUpdateGlobal} />
      </div>

      {/* Platform-Specific Settings */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">
            2
          </span>
          Platform-Specific Customization
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          Optional: Customize settings for each platform individually
        </p>
        <PlatformSpecificSettings
          selectedPlatforms={selectedPlatforms}
          platformConfigs={platformConfigs}
          onUpdatePlatform={onUpdatePlatform}
        />
      </div>
    </motion.div>
  );
};

export default Step4ContentCreation;
