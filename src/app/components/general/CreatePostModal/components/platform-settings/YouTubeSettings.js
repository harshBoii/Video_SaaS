import React from 'react';
import { FaYoutube } from 'react-icons/fa';

const YouTubeSettings = ({ settings, onChange }) => {
  return (
    <div className="bg-gradient-to-r from-[#FF0000] to-[#cc0000] p-6 rounded-2xl text-white">
      <div className="flex items-center gap-3 mb-4">
        <FaYoutube className="text-2xl" />
        <h4 className="text-lg font-bold">YouTube Settings</h4>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Video Title (max 100 chars)
          </label>
          <input
            type="text"
            value={settings.title || ''}
            onChange={(e) => onChange('title', e.target.value)}
            maxLength={100}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-white/50"
            placeholder="Defaults to first line of content"
          />
          <p className="text-xs text-white/70 mt-1 text-right">
            {(settings.title || '').length}/100
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Visibility</label>
          <select
            value={settings.visibility || 'public'}
            onChange={(e) => onChange('visibility', e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-white/50"
          >
            <option value="public">Public (searchable)</option>
            <option value="unlisted">Unlisted (link only)</option>
            <option value="private">Private (you + shared users)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            First Comment (max 10,000 chars)
          </label>
          <textarea
            value={settings.firstComment || ''}
            onChange={(e) => onChange('firstComment', e.target.value)}
            rows={3}
            maxLength={10000}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 resize-none focus:ring-2 focus:ring-white/50"
            placeholder="Add a pinned first comment..."
          />
        </div>
      </div>
    </div>
  );
};

export default YouTubeSettings;

