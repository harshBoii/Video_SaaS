import React from 'react';
import { FaLinkedin } from 'react-icons/fa';

const LinkedInSettings = ({ settings, onChange }) => {
  return (
    <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] p-6 rounded-2xl text-white">
      <div className="flex items-center gap-3 mb-4">
        <FaLinkedin className="text-2xl" />
        <h4 className="text-lg font-bold">LinkedIn Settings</h4>
      </div>
      
      <div className="space-y-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.disableLinkPreview || false}
            onChange={(e) => onChange('disableLinkPreview', e.target.checked)}
            className="w-5 h-5 rounded accent-white"
          />
          <span className="text-sm">Disable link preview for URLs</span>
        </label>
        
        <div>
          <label className="block text-sm font-medium mb-2">First Comment</label>
          <textarea
            value={settings.firstComment || ''}
            onChange={(e) => onChange('firstComment', e.target.value)}
            rows={2}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 resize-none focus:ring-2 focus:ring-white/50"
            placeholder="Add a first comment after posting..."
          />
        </div>
      </div>
    </div>
  );
};

export default LinkedInSettings;

