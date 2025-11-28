'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiLock, FiGlobe, FiCopy, FiCheck } from 'react-icons/fi';
import Swal from 'sweetalert2';

export default function ProtectedShareModal({ isOpen, onClose, videoId }) {
  const [accessType, setAccessType] = useState('PUBLIC'); // 'PUBLIC' or 'PASSWORD'
  const [password, setPassword] = useState('');
  const [allowComments, setAllowComments] = useState(true);
  const [allowDownload, setAllowDownload] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateLink = async () => {
    if (accessType === 'PASSWORD' && password.length < 4) {
      return Swal.fire('Error', 'Password must be at least 4 characters', 'warning');
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessType,
          password, 
          permissions: { allowComments, allowDownload }
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setGeneratedLink(data.link);
      Swal.fire('Success', 'Link is ready to share!', 'success');
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Could not create link', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FiLock className="text-indigo-500" /> Protected Share
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Section 1: Access Control */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Access Type</label>
              <div className="relative">
                <select
                  value={accessType}
                  onChange={(e) => setAccessType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                >
                  <option value="PUBLIC">Anyone with the link (Public)</option>
                  <option value="PASSWORD">Restricted (Password Required)</option>
                </select>
                <div className="absolute right-3 top-3.5 text-gray-400 pointer-events-none">
                  {accessType === 'PUBLIC' ? <FiGlobe /> : <FiLock />}
                </div>
              </div>

              {/* Password Input */}
              <motion.div 
                initial={false}
                animate={{ height: accessType === 'PASSWORD' ? 'auto' : 0, opacity: accessType === 'PASSWORD' ? 1 : 0.5 }}
                className="overflow-hidden mt-3"
              >
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Set Password</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={accessType !== 'PASSWORD'}
                  placeholder="Enter secure password..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </motion.div>
            </div>

            {/* Section 2: Permissions */}
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <h4 className="text-sm font-medium text-indigo-900 mb-3">Viewer Permissions</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={allowComments}
                    onChange={(e) => setAllowComments(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="text-gray-700 text-sm">Allow Comments</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={allowDownload}
                    onChange={(e) => setAllowDownload(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="text-gray-700 text-sm">Allow Video Download</span>
                </label>
              </div>
            </div>

            {/* Generated Link */}
            {generatedLink && (
              <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg flex items-center justify-between">
                <div className="truncate text-sm text-green-800 flex-1 mr-2">
                  {generatedLink}
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="text-green-600 hover:text-green-700 p-2 hover:bg-green-100 rounded-full transition"
                >
                  {copied ? <FiCheck /> : <FiCopy />}
                </button>
              </div>
            )}

            <button
              onClick={handleGenerateLink}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-70"
            >
              {loading ? 'Saving...' : generatedLink ? 'Update Link Settings' : 'Generate Share Link'}
            </button>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
