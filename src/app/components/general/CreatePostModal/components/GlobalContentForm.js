import React from 'react';
import { FaTag, FaHashtag, FaAt } from 'react-icons/fa';

const GlobalContentForm = ({ formData, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Title (optional)
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => onChange('title', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Give your post a catchy title..."
          maxLength={100}
        />
        <p className="text-xs text-gray-500 mt-1 text-right">
          {formData.title.length}/100
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Content *
        </label>
        <textarea
          value={formData.content}
          onChange={(e) => onChange('content', e.target.value)}
          rows={6}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
          placeholder="Write your main caption or message..."
          maxLength={2200}
        />
        <p className="text-xs text-gray-500 mt-1 text-right">
          {formData.content.length}/2200
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <FaTag className="text-blue-600" /> Tags
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => onChange('tags', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="tag1, tag2, tag3"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <FaHashtag className="text-purple-600" /> Hashtags
          </label>
          <input
            type="text"
            value={formData.hashtags}
            onChange={(e) => onChange('hashtags', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="#trending, #viral"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <FaAt className="text-green-600" /> Mentions
          </label>
          <input
            type="text"
            value={formData.mentions}
            onChange={(e) => onChange('mentions', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            placeholder="@user1, @user2"
          />
        </div>
      </div>
    </div>
  );
};

export default GlobalContentForm;
