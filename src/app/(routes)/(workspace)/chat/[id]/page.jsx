'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSend, FiPaperclip, FiMic, FiCopy, FiImage,
  FiRefreshCw, FiShare2, FiMoreVertical, FiLink,
  FiClock, FiSearch, FiCheckCircle, FiLoader
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';

export default function PerplexityChat() {
  const { id } = useParams();
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStage, setSearchStage] = useState('');
  const [activeTab, setActiveTab] = useState('answer');
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState([
    { id: 1, title: 'Design principles overview', time: '2 hours ago' },
    { id: 2, title: 'Marketing strategies 2024', time: '5 hours ago' },
    { id: 3, title: 'UX best practices', time: '1 day ago' },
    { id: 4, title: 'Content creation tips', time: '2 days ago' },
  ]);

  const mockSources = [
    { id: 1, title: 'Design Principles Guide', url: '#', domain: 'uxdesign.cc' },
    { id: 2, title: 'Visual Hierarchy Best Practices', url: '#', domain: 'smashingmagazine.com' },
    { id: 3, title: 'UI/UX Fundamentals', url: '#', domain: 'nngroup.com' },
    { id: 4, title: 'Design System Documentation', url: '#', domain: 'material.io' },
  ];

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!prompt.trim() || isSearching) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: prompt,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsSearching(true);

    // Stage 1: Searching
    setSearchStage('Searching the web...');
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Stage 2: Reviewing sources
    setSearchStage('Reviewing 10 sources...');
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Stage 3: Analyzing
    setSearchStage('Analyzing information...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Stage 4: Generating response
    setSearchStage('Generating response...');
    await new Promise(resolve => setTimeout(resolve, 800));

    // Add AI response
    const aiMessage = {
      id: Date.now() + 1,
      type: 'assistant',
      content: `Here's a concise overview of design principles to guide visual composition and user experience.

**What design principles are**

Design principles are general rules that help create clear, effective, and aesthetically pleasing layouts.

• They help ensure consistency, readability, and a meaningful visual hierarchy across media and platforms.
• They can be applied to graphic design, UI/UX, product design, and communication design.

**Core principles you'll encounter**

1. **Balance** - Distribution of visual weight to create stability
2. **Contrast** - Using differences in color, size, or shape to create emphasis
3. **Hierarchy** - Organizing elements to guide the viewer's attention
4. **Alignment** - Creating visual connections between elements
5. **Proximity** - Grouping related items together
6. **Repetition** - Using consistent elements to create unity
7. **White Space** - Strategic use of empty space to improve readability

**Practical application**

These principles work together to create effective designs. For example, using contrast to establish hierarchy while maintaining balance through proper alignment and white space.

The key is understanding when and how to apply each principle based on your specific design goals and audience needs.`,
      timestamp: new Date(),
      sources: mockSources,
      reviewedCount: 10
    };

    setMessages(prev => [...prev, aiMessage]);
    setIsSearching(false);
    setSearchStage('');
  };

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Fixed Header - Perplexity Style */}
        <div className="fixed w-full top-0 backdrop-blur-xl bg-white/80 dark:bg-black/80 border-b border-[var(--glass-border)]">
          <div className="max-w-4xl mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between h-14">
              {/* Tabs */}
              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('answer')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'answer'
                    ? 'text-foreground bg-[var(--glass-hover)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-[var(--glass-hover)]/50'
                    }`}
                >
                  <HiSparkles className="w-4 h-4" />
                  <span>Answer</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('links')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'links'
                    ? 'text-foreground bg-[var(--glass-hover)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-[var(--glass-hover)]/50'
                    }`}
                >
                  <FiLink className="w-4 h-4" />
                  <span>Links</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('images')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'images'
                    ? 'text-foreground bg-[var(--glass-hover)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-[var(--glass-hover)]/50'
                    }`}
                >
                  <FiImage className="w-4 h-4" />
                  <span>Images</span>
                </motion.button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
                >
                  <FiMoreVertical className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-sm font-medium"
                >
                  <FiShare2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 md:p-6">
            {/* Welcome State */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center min-h-[60vh]"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary to-violet-500 flex items-center justify-center mb-6">
                  <HiSparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 text-center">
                  What can I help you discover?
                </h1>
                <p className="text-muted-foreground text-center max-w-md">
                  Ask me anything and I'll search the web to give you comprehensive answers
                </p>
              </motion.div>
            )}

            {/* Messages */}
            <div className="space-y-8 mt-8">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    {message.type === 'user' ? (
                      <div className="flex justify-end mb-4">
                        <div className="max-w-3xl backdrop-blur-xl bg-[var(--glass-hover)] border border-[var(--glass-border)] rounded-2xl px-6 py-4">
                          <p className="text-foreground text-lg">{message.content}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Sources reviewed badge */}
                        {message.reviewedCount && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <FiCheckCircle className="w-4 h-4 text-green-500" />
                            <span>Reviewed {message.reviewedCount} sources</span>
                          </motion.div>
                        )}

                        {/* Answer content */}
                        <div className="prose prose-sm md:prose-base max-w-none">
                          <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </div>
                        </div>

                        {/* Sources */}
                        {message.sources && activeTab === 'answer' && (
                          <div className="mt-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-3">Sources</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {message.sources.map((source) => (
                                <motion.a
                                  key={source.id}
                                  href={source.url}
                                  whileHover={{ scale: 1.02 }}
                                  className="backdrop-blur-xl bg-white/5 dark:bg-black/20 border border-[var(--glass-border)] rounded-xl p-4 hover:border-primary/50 transition-all group"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--glass-hover)] flex items-center justify-center flex-shrink-0">
                                      <span className="text-xs font-bold text-primary">{source.id}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                        {source.title}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">{source.domain}</p>
                                    </div>
                                  </div>
                                </motion.a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCopy(message.content)}
                            className="p-2 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
                            title="Copy"
                          >
                            <FiCopy className="w-4 h-4 text-muted-foreground" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
                            title="Regenerate"
                          >
                            <FiRefreshCw className="w-4 h-4 text-muted-foreground" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
                            title="Share"
                          >
                            <FiShare2 className="w-4 h-4 text-muted-foreground" />
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Agent Search Animation */}
              {isSearching && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-violet-500 flex items-center justify-center">
                        <FiLoader className="w-4 h-4 text-white animate-spin" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FiSearch className="w-4 h-4 text-primary animate-pulse" />
                        <p className="text-sm font-medium text-foreground">{searchStage}</p>
                      </div>
                      <div className="mt-2 h-1 bg-[var(--glass-hover)] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-violet-500"
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 1.5, ease: 'easeInOut' }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>
        </div>
        {/* Input Area - Fixed at bottom */}
        <div className="fixed w-full bottom-0 backdrop-blur-xl bg-white/80 dark:bg-black/80 border-t border-[var(--glass-border)] p-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <div className="backdrop-blur-xl bg-white/50 dark:bg-black/50 border border-[var(--glass-border)] rounded-2xl focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask a follow-up..."
                  disabled={isSearching}
                  className="w-full px-5 py-4 pr-36 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />

                {/* Input Actions */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2.5 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
                    title="Search"
                  >
                    <FiSearch className="w-4 h-4 text-muted-foreground" />
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2.5 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
                    title="Attach"
                  >
                    <FiPaperclip className="w-4 h-4 text-muted-foreground" />
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2.5 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
                    title="Voice"
                  >
                    <FiMic className="w-4 h-4 text-muted-foreground" />
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!prompt.trim() || isSearching}
                    className="p-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-1"
                    title="Send"
                  >
                    <FiSend className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>


      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-80 border-l border-[var(--glass-border)] backdrop-blur-xl bg-white/80 dark:bg-black/80 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">History</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowHistory(false)}
                  className="p-2 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
                >
                  <FiMoreVertical className="w-4 h-4" />
                </motion.button>
              </div>

              <div className="space-y-2">
                {historyItems.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ x: 4 }}
                    className="p-3 rounded-xl hover:bg-[var(--glass-hover)] cursor-pointer transition-all group"
                  >
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating History Toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowHistory(!showHistory)}
        className="fixed right-6 top-20 z-50 p-3 rounded-xl backdrop-blur-xl bg-white/80 dark:bg-black/80 border border-[var(--glass-border)] shadow-lg hover:shadow-xl transition-all"
        title="Toggle History"
      >
        <FiClock className="w-5 h-5 text-foreground" />
      </motion.button>
    </div>

  );
}
