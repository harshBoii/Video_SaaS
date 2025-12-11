import React from 'react';
import { SiTiktok } from 'react-icons/si';

const TikTokSettings = ({ settings, onChange }) => {
  return (
    <div className="bg-gradient-to-r from-black to-[#69C9D0] p-6 rounded-2xl text-white">
      <div className="flex items-center gap-3 mb-4">
        <SiTiktok className="text-2xl" />
        <h4 className="text-lg font-bold">TikTok Settings</h4>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Privacy level *</label>
          <select
            value={settings.privacy_level || ''}
            onChange={(e) => onChange('privacy_level', e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-white/50"
          >
            <option value="">Select privacy...</option>
            <option value="PUBLIC_TO_EVERYONE">Public to everyone</option>
            <option value="MUTUAL_FOLLOW_FRIENDS">Friends only</option>
            <option value="SELF_ONLY">Private</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allow_comment || false}
              onChange={(e) => onChange('allow_comment', e.target.checked)}
              className="w-5 h-5 rounded accent-white"
            />
            <span className="text-sm">Allow comments</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allow_duet || false}
              onChange={(e) => onChange('allow_duet', e.target.checked)}
              className="w-5 h-5 rounded accent-white"
            />
            <span className="text-sm">Allow duet</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allow_stitch || false}
              onChange={(e) => onChange('allow_stitch', e.target.checked)}
              className="w-5 h-5 rounded accent-white"
            />
            <span className="text-sm">Allow stitch</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default TikTokSettings;
