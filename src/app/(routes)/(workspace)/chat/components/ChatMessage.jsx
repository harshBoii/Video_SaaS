'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiCopy,
  FiThumbsUp,
  FiThumbsDown,
  FiRefreshCw,
  FiMoreHorizontal,
  FiCheck,
  FiUser,
  FiZap,
} from 'react-icons/fi';

const CodeBlock = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden bg-[#1e1e1e] dark:bg-black/50">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] dark:bg-white/5 border-b border-white/10">
        <span className="text-xs font-medium text-gray-400">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          {copied ? <FiCheck className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="text-gray-300">{code}</code>
      </pre>
    </div>
  );
};

const MessageActions = ({ isAI, onCopy, onRegenerate }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1 mt-2"
    >
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        {copied ? <FiCheck className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      {isAI && (
        <>
          <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <FiThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <FiThumbsDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <FiRefreshCw className="w-3.5 h-3.5" />
            Regenerate
          </button>
        </>
      )}
    </motion.div>
  );
};

const ChatMessage = ({ message, showActions = true }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isAI = message.role === 'assistant';

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex gap-4 py-6 px-4 md:px-8 ${isAI ? 'bg-clipfox-surface/50 dark:bg-white/[0.02]' : ''}`}
    >
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
        ${isAI 
          ? 'bg-gradient-to-br from-primary to-clipfox-accent text-white' 
          : 'bg-muted text-muted-foreground'
        }
      `}>
        {isAI ? <FiZap className="w-4 h-4" /> : <FiUser className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-semibold text-foreground">
            {isAI ? 'ClipFox AI' : 'You'}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          {message.content.split('\n').map((paragraph, index) => {
            // Check if it's a code block
            if (paragraph.startsWith('```')) {
              const language = paragraph.replace('```', '').trim();
              const codeEndIndex = message.content.indexOf('```', message.content.indexOf(paragraph) + paragraph.length);
              if (codeEndIndex !== -1) {
                const code = message.content.substring(
                  message.content.indexOf(paragraph) + paragraph.length + 1,
                  codeEndIndex
                );
                return <CodeBlock key={index} code={code.trim()} language={language || 'text'} />;
              }
            }
            
            // Regular paragraph
            if (paragraph.trim()) {
              return (
                <p key={index} className="text-sm text-foreground/90 leading-relaxed mb-2">
                  {paragraph}
                </p>
              );
            }
            return null;
          })}
        </div>

        {/* Actions */}
        {showActions && isHovered && (
          <MessageActions
            isAI={isAI}
            onCopy={() => navigator.clipboard.writeText(message.content)}
            onRegenerate={() => {}}
          />
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage;
