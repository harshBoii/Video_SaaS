import React from 'react';
import { FaFacebook } from 'react-icons/fa';

const FacebookSettings = ({ settings, onChange }) => {
  return (
    <div className="bg-gradient-to-r from-[#1877F2] to-[#0c5ecf] p-6 rounded-2xl text-white">
      <div className="flex items-center gap-3 mb-4">
        <FaFacebook className="text-2xl" />
        <h4 className="text-lg font-bold">Facebook Settings</h4>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Content Type</label>
          <select
            value={settings.contentType || ''}
            onChange={(e) => onChange('contentType', e.target.value || null)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-white/50"
          >
            <option value="">Regular Post</option>
            <option value="story">Page Story (24h)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Page ID (optional)</label>
          <input
            type="text"
            value={settings.pageId || ''}
            onChange={(e) => onChange('pageId', e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-white/50"
            placeholder="Leave empty to use default page"
          />
        </div>
        
        {settings.contentType !== 'story' && (
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
        )}
      </div>
    </div>
  );
};

export default FacebookSettings;
