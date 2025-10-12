'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiEdit3, FiSend, FiDownload, FiFileText, FiMail, FiExternalLink } from 'react-icons/fi';

export default function AgencyEmailModal({ isOpen, onClose, apiResponse }) {
  const [editableBody, setEditableBody] = useState('');
  const [subject, setSubject] = useState('');

  useEffect(() => {
    if (apiResponse) {
      const parsedData = parseApiResponse(apiResponse);
      setEditableBody(parsedData.body);
      setSubject(parsedData.subject);
    }
  }, [apiResponse]);

  if (!isOpen) return null;

  // Parse the API response JSON
  const parseApiResponse = (response) => {
    try {
      const jsonData = typeof response === 'string' ? JSON.parse(response) : response;
      const emailDraft = jsonData?.next_state?.email_draft || '';
      
      const subjectMatch = emailDraft.match(/^Subject:\s*(.*)$/m);
      const extractedSubject = subjectMatch ? subjectMatch[1].trim() : 'Offer Letter';
      
      const attachmentMatch = emailDraft.match(/\[Attachment:\s*(.+?)\]/);
      const pdfPath = attachmentMatch ? attachmentMatch[1].trim() : jsonData?.next_state?.pdf_path || '';
      
      const cleanedBody = emailDraft
        .replace(/^Subject:.*$/m, '')
        .replace(/\[Attachment:.*?\]/, '')
        .trim();

      return { 
        subject: extractedSubject, 
        body: cleanedBody, 
        pdfPath,
        agencyName: jsonData?.next_state?.agency_name || '',
        clientName: jsonData?.next_state?.client_name || ''
      };
    } catch (error) {
      console.error('Error parsing API response:', error);
      return { subject: '', body: '', pdfPath: '' };
    }
  };

  const parsedData = parseApiResponse(apiResponse);
  const { pdfPath, agencyName, clientName } = parsedData;

  const handleSave = () => {
    console.log('Edited email:', { subject, body: editableBody });
    onClose();
  };

  const handleOpenPdf = () => {
    if (pdfPath) {
      window.open(pdfPath, '_blank', 'noopener,noreferrer');
    }
  };

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { 
      y: -50, 
      opacity: 0,
      scale: 0.95 
    },
    visible: { 
      y: 0, 
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
        duration: 0.3
      }
    },
    exit: { 
      y: 50, 
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  const attachmentVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { delay: 0.2, duration: 0.3 }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 bg-gradient-to-br from-gray-900/70 via-indigo-900/50 to-gray-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden"
            style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
          >
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-8 py-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl">
                    <FiMail className="text-white text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Email Preview & Editor
                    </h2>
                    <p className="text-indigo-100 text-sm mt-0.5">
                      Review and customize your email before sending
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-colors"
                >
                  <FiX size={24} />
                </motion.button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="px-8 py-6 max-h-[calc(85vh-180px)] overflow-y-auto custom-scrollbar">
              {/* PDF Attachment Alert - Top Priority */}
              {pdfPath && (
                <motion.div
                  variants={attachmentVariants}
                  initial="hidden"
                  animate="visible"
                  className="mb-6"
                >
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-200 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl shadow-md flex-shrink-0">
                          <FiFileText className="text-white text-2xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-emerald-900 font-bold text-lg mb-1">
                            📎 Offer Letter Attached
                          </p>
                          <p className="text-emerald-700 text-sm mb-2">
                            Professional offer letter document ready for review
                          </p>
                          <p className="text-emerald-600 text-xs font-mono break-all bg-white/60 px-3 py-1.5 rounded-lg">
                            {pdfPath}
                          </p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleOpenPdf}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl px-5 py-3 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all flex-shrink-0"
                      >
                        <FiExternalLink className="text-lg" />
                        Open PDF
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Metadata Pills */}
              {(agencyName || clientName) && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {agencyName && (
                    <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium border border-indigo-100">
                      From: {agencyName}
                    </span>
                  )}
                  {clientName && (
                    <span className="bg-purple-50 text-purple-700 px-4 py-1.5 rounded-full text-sm font-medium border border-purple-100">
                      To: {clientName}
                    </span>
                  )}
                </div>
              )}

              {/* Subject Line */}
              <div className="mb-5">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  <FiEdit3 className="text-indigo-600" />
                  Email Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl text-gray-900 font-medium text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-gray-50 hover:bg-white"
                  placeholder="Enter email subject..."
                />
              </div>

              {/* Email Body Editor */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  <FiFileText className="text-purple-600" />
                  Email Message
                </label>
                <div className="relative">
                  <textarea
                    value={editableBody}
                    onChange={(e) => setEditableBody(e.target.value)}
                    className="w-full h-[45vh] px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-800 leading-relaxed focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none outline-none bg-gray-50 hover:bg-white"
                    placeholder="Compose your email message..."
                    style={{ fontSize: '15px', lineHeight: '1.7' }}
                  />
                  <div className="absolute bottom-4 right-4 text-xs text-gray-400 bg-white/80 backdrop-blur px-2 py-1 rounded">
                    {editableBody.length} characters
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 px-8 py-5 border-t border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                💡 <span className="font-medium">Tip:</span> Review all details before saving
              </p>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-white border-2 border-gray-300 hover:bg-gray-100 hover:border-gray-400 text-gray-700 font-semibold transition-all shadow-sm"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 text-white flex items-center gap-2 font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  <FiSend className="text-lg" />
                  Save & Continue
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Custom Scrollbar Styles */}
          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #f1f5f9;
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: linear-gradient(180deg, #6366f1, #8b5cf6);
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(180deg, #4f46e5, #7c3aed);
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
