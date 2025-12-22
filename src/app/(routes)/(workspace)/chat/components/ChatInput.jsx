'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSend,
  FiPaperclip,
  FiImage,
  FiMic,
  FiStopCircle,
  FiX,
  FiFile,
  FiVideo,
  FiZap,
} from 'react-icons/fi';

const AttachmentPreview = ({ file, onRemove }) => {
  const isImage = file.type?.startsWith('image/');
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border"
    >
      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
        {isImage ? (
          <FiImage className="w-4 h-4 text-primary" />
        ) : (
          <FiFile className="w-4 h-4 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
        <p className="text-[10px] text-muted-foreground">
          {(file.size / 1024).toFixed(1)} KB
        </p>
      </div>
      <button
        onClick={() => onRemove(file)}
        className="p-1 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
      >
        <FiX className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};

const SuggestionChip = ({ suggestion, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onClick(suggestion)}
    className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
  >
    {suggestion}
  </motion.button>
);

const ChatInput = ({ onSend, isLoading, suggestions = [] }) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const defaultSuggestions = [
    'Create a new campaign',
    'Generate video ideas',
    'Write marketing copy',
    'Analyze campaign performance',
  ];

  const activeSuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (message.trim() || attachments.length > 0) {
      onSend?.({
        content: message,
        attachments,
      });
      setMessage('');
      setAttachments([]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const handleRemoveAttachment = (file) => {
    setAttachments(prev => prev.filter(f => f !== file));
  };

  const handleSuggestionClick = (suggestion) => {
    setMessage(suggestion);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur-xl">
      {/* Suggestions */}
      {message.length === 0 && attachments.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 md:px-8 pt-4 pb-2"
        >
          <div className="flex flex-wrap gap-2">
            {activeSuggestions.map((suggestion, index) => (
              <SuggestionChip
                key={index}
                suggestion={suggestion}
                onClick={handleSuggestionClick}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Attachments Preview */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 md:px-8 pt-3"
          >
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <AttachmentPreview
                  key={index}
                  file={file}
                  onRemove={handleRemoveAttachment}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4 md:px-8">
        <div className="relative flex items-end gap-3 p-3 rounded-2xl bg-clipfox-surface dark:bg-white/5 border border-border focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          {/* Attachment Button */}
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background dark:hover:bg-white/10 transition-colors"
            >
              <FiPaperclip className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Text Input */}
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask ClipFox AI anything..."
              rows={1}
              className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              style={{ maxHeight: '200px' }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Voice Recording */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsRecording(!isRecording)}
              className={`p-2 rounded-lg transition-colors ${
                isRecording 
                  ? 'text-destructive bg-destructive/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-background dark:hover:bg-white/10'
              }`}
            >
              {isRecording ? (
                <FiStopCircle className="w-5 h-5" />
              ) : (
                <FiMic className="w-5 h-5" />
              )}
            </motion.button>

            {/* Send Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={isLoading || (!message.trim() && attachments.length === 0)}
              className={`
                p-2.5 rounded-xl transition-all
                ${message.trim() || attachments.length > 0
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
                }
              `}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <FiZap className="w-5 h-5" />
                </motion.div>
              ) : (
                <FiSend className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          ClipFox AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
