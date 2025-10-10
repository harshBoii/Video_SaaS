'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSend, FiEdit3, FiLoader, FiSave, FiInfo } from 'react-icons/fi';
import Swal from 'sweetalert2';
import dynamic from 'next/dynamic';
import { marked } from 'marked'; // ✅ Add this import
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(async () => (await import('react-quill-new')).default, {
  ssr: false,
});

export default function AgencyLetterReviewModal({
  isOpen,
  onClose,
  apiResponse,
  onLetterFinalized,
}) {
  const [editedLetter, setEditedLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);

useEffect(() => {
  if (apiResponse?.tenure_template) {
    // Configure marked for better HTML output
    marked.setOptions({
      breaks: true, // Convert \n to <br>
      gfm: true, // GitHub Flavored Markdown
    });
    
    const htmlContent = marked(apiResponse.tenure_template);
    setEditedLetter(htmlContent);
  }
}, [apiResponse]);

if (!isOpen) return null;

  const handleApprove = async () => {
    if (!editedLetter.trim()) {
      return Swal.fire(
        'Empty Letter',
        'Please review or modify the content before continuing.',
        'warning'
      );
    }

    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:8000/resume-letter-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: apiResponse.sessionId,
          checkpoint_id: apiResponse.checkpointId,
          edited_letter: editedLetter, // This will now be HTML
        }),
      });

      if (!res.ok) throw new Error('Failed to finalize letter.');
      const result = await res.json();

      Swal.fire({
        title: '✅ Letter Finalized!',
        text: 'Email draft and PDF are being prepared.',
        icon: 'success',
        timer: 1000,
        showConfirmButton: false,
      });

      onLetterFinalized(result.next_state);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to finalize the letter.', 'error');
    } finally {
      setSubmitting(false);
    }
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
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full p-6 overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center border-b pb-3 mb-5">
              <div className="flex items-center gap-3">
                <FiEdit3 className="text-indigo-600 text-xl" />
                <h2 className="text-xl font-semibold text-gray-800">
                  Review & Edit Offer Letter
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-800 transition"
                title="Close"
              >
                <FiX size={22} />
              </button>
            </div>

            <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 text-indigo-700 p-3 rounded-lg mb-4 text-sm">
              <FiInfo className="text-indigo-500 flex-shrink-0" />
              <span>
                <strong>Tip:</strong> You can modify any part of the letter below.
                Use <b>bold</b>, <i>italic</i>, bullet lists, and more. Once ready,
                click <b>"Approve & Generate PDF"</b> to finalize.
              </span>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden mb-6">
              <ReactQuill
                value={editedLetter}
                onChange={setEditedLetter}
                theme="snow"
                className="min-h-[65vh] text-gray-800"
                placeholder="Edit the generated offer letter..."
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ align: [] }],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['blockquote', 'code-block'],
                    ['link'],
                    ['clean'],
                  ],
                }}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={handleApprove}
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center gap-2 font-semibold shadow hover:shadow-lg disabled:opacity-60"
                title="Finalize and generate PDF + email"
              >
                {submitting ? (
                  <>
                    <FiLoader className="animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <FiSend /> Approve & Generate PDF
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
