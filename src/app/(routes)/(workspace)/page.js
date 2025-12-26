'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FiImage, FiVideo, FiMessageSquare,
  FiMic, FiPaperclip, FiGlobe, FiCalendar,
  FiFileText, FiTrendingUp
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { v4 as uuidv4 } from 'uuid';
import { FaLightbulb } from 'react-icons/fa';
import { BsLightbulbOffFill } from 'react-icons/bs';
import { LightbulbIcon } from 'lucide-react';
import { BiBulb } from 'react-icons/bi';

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState('brainstorm');
  const [hoveredMode, setHoveredMode] = useState(null);

  const [prompt, setPrompt] = useState('');

  const modes = [
    {
      id: 'brainstorm',
      label: 'Brainstorm',
      icon: LightbulbIcon,
      placeholder: 'Ask anything. Type @ for mentions and / for shortcuts.',
      message: 'Chat with Clipfox for brainstorming and problem-solving',
      route: 'chat'
    },
    {
      id: 'images',
      label: 'Images',
      icon: FiImage,
      placeholder: 'Describe the image you want to create...',
      href: '/design/c04bf91f-d67d-41b4-a75f-bb5dfbc3ac53',
      message: 'Create stunning images with AI',

    },
    {
      id: 'videos',
      label: 'Videos',
      icon: FiVideo,
      placeholder: 'Describe the video you want to create...',
      href: '/video/c04bf91f-d67d-41b4-a75f-bb5dfbc3ac53',
      message: 'Generate videos from text descriptions',
    }
  ];

  const currentMode = modes.find(m => m.id === mode);

  const handleModeClick = (m) => {
    if (m.href) {
      // Navigate to the href page
      window.location.href = m.href;
    } else {
      // Set the mode for current page
      setMode(m.id);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!prompt.trim()) return;

    const newSessionId = uuidv4();
    router.push(`/${currentMode.route}/${newSessionId}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-semibold text-foreground mb-2">
            Clipfox
          </h1>
        </motion.div>

        {/* Search Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative rounded-2xl border   border-[var(--glass-border)] bg-background 
                          shadow-sm hover:shadow-md transition-shadow">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={currentMode.placeholder}
                className="w-full min-h-[120px] max-h-[200px] px-4 py-4 pr-32 rounded-2xl 
                         bg-transparent text-foreground placeholder:text-muted-foreground 
                         focus:outline-none resize-none"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />

              {/* Left Icons */}
              <div className="absolute left-4 bottom-3 flex items-center gap-1">

                <div className="flex items-center justify-center relative">
          <div className="inline-flex items-center bg-primary/10 rounded-xl p-1.5 gap-1">
            {modes.map((m) => (
              <div key={m.id} className="relative">
                <button
                  onClick={() => handleModeClick(m)}
                  onMouseEnter={() => setHoveredMode(m.id)}
                  onMouseLeave={() => setHoveredMode(null)}
                  className={`flex items-center justify-center w-7 h-7 rounded-lg text-sm font-medium
                           transition-all duration-200 relative
                    ${mode === m.id 
                      ? 'bg-primary/90 text-background shadow-sm border border-gray-200' 
                      : 'bg-transparent text-gray-600 hover:bg-white/50 hover:text-gray-900'
                    }
                  `}
                >
                  <m.icon className="w-4 h-4" />
                </button>

                {/* Hover Tooltip */}
                {hoveredMode === m.id && m.message && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 z-50">
                    <div className="bg-gray-900 text-white text-sm rounded-lg p-3 shadow-xl">
                      <div className="font-medium mb-1">{m.label}</div>
                      <div className="text-gray-300 text-xs">{m.message}</div>
                      {m.href && (
                        <div className="text-cyan-400 text-xs mt-1">Click to open →</div>
                      )}
                      {/* Arrow */}
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>



              </div>

              {/* Right Icons */}
              <div className="absolute right-4 bottom-3 flex items-center gap-1">
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
                >
                  <FiGlobe className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
                >
                  <FiCalendar className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
                >
                  <FiPaperclip className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
                >
                  <FiMic className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  type="submit"
                  disabled={!prompt.trim()}
                  className="p-1.5 rounded-lg bg-primary text-primary-foreground 
                           hover:bg-primary/90 transition-colors disabled:opacity-50 
                           disabled:cursor-not-allowed"
                >
                  <HiSparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Quick Action Buttons - Perplexity Style */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-2"
        >

          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                           border border-[var(--glass-border)] hover:border-foreground/50 
                           bg-background text-foreground transition-all">
            <BiBulb className="w-3.5 h-3.5" />
            Creative Concepts
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                           border border-[var(--glass-border)] hover:border-foreground/50 
                           bg-background text-foreground transition-all">
            <FiTrendingUp className="w-3.5 h-3.5" />
            Trending Campaign ideas
          </button>

          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                           border border-[var(--glass-border)] hover:border-foreground/50 
                           bg-background text-foreground transition-all">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Performance Metrics
          </button>
        </motion.div>
      </div>
    </div>
  );
}
