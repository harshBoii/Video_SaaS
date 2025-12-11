import React from 'react';
import { motion } from 'framer-motion';
import { FaRocket, FaCalendarAlt, FaSave } from 'react-icons/fa';

const GlobalSchedule = ({ formData, onChange }) => {
  return (
    <div className="space-y-6">
      {/* Schedule Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            onChange('publishNow', true);
            onChange('isDraft', false);
            onChange('scheduledFor', '');
          }}
          className={`p-6 border-2 rounded-2xl transition-all ${
            formData.publishNow
              ? 'border-green-500 bg-green-50 shadow-lg'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FaRocket className="text-white text-2xl" />
          </div>
          <h4 className="font-bold text-gray-900 mb-2">Publish Now</h4>
          <p className="text-sm text-gray-500">Post immediately to all selected platforms</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            onChange('publishNow', false);
            onChange('isDraft', false);
          }}
          className={`p-6 border-2 rounded-2xl transition-all ${
            !formData.publishNow && !formData.isDraft
              ? 'border-blue-500 bg-blue-50 shadow-lg'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FaCalendarAlt className="text-white text-2xl" />
          </div>
          <h4 className="font-bold text-gray-900 mb-2">Schedule</h4>
          <p className="text-sm text-gray-500">Choose a specific date and time</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            onChange('isDraft', true);
            onChange('publishNow', false);
            onChange('scheduledFor', '');
          }}
          className={`p-6 border-2 rounded-2xl transition-all ${
            formData.isDraft
              ? 'border-gray-500 bg-gray-50 shadow-lg'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FaSave className="text-white text-2xl" />
          </div>
          <h4 className="font-bold text-gray-900 mb-2">Save Draft</h4>
          <p className="text-sm text-gray-500">Finalize and publish later</p>
        </motion.button>
      </div>

      {/* Date & Time Picker for Scheduled Posts */}
      {!formData.publishNow && !formData.isDraft && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Schedule Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledFor}
              onChange={(e) => onChange('scheduledFor', e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Timezone</label>
            <select
              value={formData.timezone}
              onChange={(e) => onChange('timezone', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="Asia/Kolkata">IST (India Standard Time)</option>
              <option value="Europe/London">GMT (London)</option>
              <option value="America/New_York">EST (New York)</option>
              <option value="America/Los_Angeles">PST (Los Angeles)</option>
              <option value="America/Chicago">CST (Chicago)</option>
              <option value="Europe/Paris">CET (Paris)</option>
              <option value="Asia/Tokyo">JST (Tokyo)</option>
              <option value="Australia/Sydney">AEDT (Sydney)</option>
            </select>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GlobalSchedule;
