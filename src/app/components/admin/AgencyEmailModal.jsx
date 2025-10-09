'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiEdit3, FiSend, FiDownload } from 'react-icons/fi';

export default function AgencyEmailModal({ isOpen, onClose, apiResponse }) {
  const [editableBody, setEditableBody] = useState('');

  useEffect(() => {
    if (apiResponse) {
      setEditableBody(apiResponse);
    }
  }, [apiResponse]);

  if (!isOpen) return null;

  // Extract fields dynamically from the response
  const parseResponse = (response) => {
    const subjectMatch = response.match(/^Subject:\s*(.*)$/m);
    const subject = subjectMatch ? subjectMatch[1] : 'Offer Letter';

    const linkMatch = response.match(/➡️ (https?:\/\/[^\s]+)/);
    const link = linkMatch ? linkMatch[1] : '';

    const cleanedBody = response
      .replace(/^Subject:.*$/m, '')
      .replace(/➡️ https?:\/\/[^\s]+/, '')
      .trim();

    return { subject, link, body: cleanedBody };
  };

  const { subject, body, link } = parseResponse(apiResponse || '');

  const handleSave = () => {
    console.log('Edited email:', editableBody);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 overflow-y-auto max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <FiEdit3 className="text-indigo-600" /> Offer Letter Preview
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-800 transition"
              >
                <FiX size={22} />
              </button>
            </div>

            {/* Subject */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) =>
                  setEditableBody(
                    editableBody.replace(/^Subject:.*$/m, `Subject: ${e.target.value}`)
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Editable Email Body */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Email Content
              </label>
              <textarea
                value={editableBody}
                onChange={(e) => setEditableBody(e.target.value)}
                className="w-full h-[50vh] px-4 py-3 border border-gray-300 rounded-lg text-gray-800 font-mono focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {/* PDF Attachment Section */}
            {link && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100 flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-700">
                    <strong>Attachment:</strong> Offer Letter PDF
                  </p>
                  <a
                    href={link}
                    target="_blank"
                    className="text-indigo-600 text-sm hover:underline break-all"
                    rel="noopener noreferrer"
                  >
                    {link}
                  </a>
                </div>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-indigo-600 text-white rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-indigo-700"
                >
                  <FiDownload /> View PDF
                </a>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center gap-2 font-semibold shadow hover:shadow-lg"
              >
                <FiSend /> Save & Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
