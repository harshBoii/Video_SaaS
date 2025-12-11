import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaToggleOn, FaToggleOff } from 'react-icons/fa';
import GlobalSchedule from './GlobalSchedule';
import PerPlatformSchedule from './PerPlatformSchedule';

const Step5Scheduling = ({
  formData,
  selectedPlatforms,
  platformConfigs,
  onUpdateGlobal,
  onUpdatePlatform,
}) => {
  const [advancedMode, setAdvancedMode] = useState(false);

  return (
    <motion.div
      key="step5"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">When to Publish?</h3>
        <p className="text-gray-500">Choose your publishing schedule</p>
      </div>

      {/* Global Schedule */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Global Schedule</h4>
        <GlobalSchedule formData={formData} onChange={onUpdateGlobal} />
      </div>

      {/* Advanced Mode Toggle */}
      {!formData.publishNow && !formData.isDraft && (
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold text-gray-900">Per-Platform Scheduling</h4>
              <p className="text-sm text-gray-600 mt-1">
                Schedule different times for each platform
              </p>
            </div>
            <button
              onClick={() => setAdvancedMode(!advancedMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                advancedMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {advancedMode ? (
                <>
                  <FaToggleOn className="text-xl" />
                  <span>Enabled</span>
                </>
              ) : (
                <>
                  <FaToggleOff className="text-xl" />
                  <span>Disabled</span>
                </>
              )}
            </button>
          </div>

          {advancedMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PerPlatformSchedule
                selectedPlatforms={selectedPlatforms}
                platformConfigs={platformConfigs}
                onUpdatePlatform={onUpdatePlatform}
              />
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default Step5Scheduling;
