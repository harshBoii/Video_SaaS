import React from 'react';
import { FaInstagram } from 'react-icons/fa';

const InstagramSettings = ({ settings, onChange }) => {
  const isStory = settings.contentType === 'story';

  return (
    <div className="bg-gradient-to-r from-[#E4405F] via-[#DD2A7B] to-[#9C27B0] p-6 rounded-2xl text-white">
      <div className="flex items-center gap-3 mb-4">
        <FaInstagram className="text-2xl" />
        <h4 className="text-lg font-bold">Instagram Settings</h4>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Content Type</label>
          <select
            value={settings.contentType || ''}
            onChange={(e) => {
              const newType = e.target.value || null;
              onChange('contentType', newType);
              
              // ✅ FIX: Auto-clear shareToFeed when switching to Story
              if (newType === 'story') {
                onChange('shareToFeed', undefined); // Remove the field
              }
            }}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-white/50"
          >
            <option value="">Regular Post / Reel</option>
            <option value="story">Story (24h)</option>
          </select>
        </div>
        
        {/* ✅ FIX: Only show shareToFeed for Reels, NOT for Stories */}
        {!isStory && (
          <>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.shareToFeed !== false}
                onChange={(e) => onChange('shareToFeed', e.target.checked)}
                className="w-5 h-5 rounded accent-white"
              />
              <span className="text-sm">Share Reel to feed (visible on profile)</span>
            </label>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Collaborators (max 3 usernames)
              </label>
              <input
                type="text"
                value={(settings.collaborators || []).join(', ')}
                onChange={(e) => onChange('collaborators', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-white/50"
                placeholder="@user1, @user2, @user3"
              />
            </div>
            
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
          </>
        )}

        {/* ✅ For Stories, show a helpful message */}
        {isStory && (
          <div className="bg-white/10 border border-white/30 rounded-xl p-4">
            <p className="text-sm text-white/90">
              📌 Instagram Stories are 24-hour ephemeral content. Collaborators and first comments are not available for Stories.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstagramSettings;
