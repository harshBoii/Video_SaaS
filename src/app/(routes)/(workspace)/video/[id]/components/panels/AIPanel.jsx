'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSend, FiChevronDown, FiZap, FiImage, FiFilm,
  FiType, FiMusic, FiSliders
} from 'react-icons/fi';
import { HiSparkles, HiOutlineTranslate } from 'react-icons/hi';
import { MdOutlineAutoAwesome, MdOutlineSubtitles } from 'react-icons/md';

const aiModels = [
  { id: 'sora', name: 'Sora', description: 'OpenAI video generation' },
  { id: 'runway', name: 'Runway Gen-3', description: 'High quality video' },
  { id: 'pika', name: 'Pika Labs', description: 'Fast video generation' },
  { id: 'stable-video', name: 'Stable Video', description: 'Open source model' },
];

const qualityOptions = [
  { id: '720p', name: '720p', description: 'HD Quality' },
  { id: '1080p', name: '1080p', description: 'Full HD' },
  { id: '4k', name: '4K', description: 'Ultra HD' },
];

const aiEffects = [
  { id: 'enhance', name: 'Enhance Video', icon: MdOutlineAutoAwesome, description: 'AI upscaling & enhancement' },
  { id: 'denoise', name: 'Remove Noise', icon: FiZap, description: 'Clean up audio & video' },
  { id: 'stabilize', name: 'Stabilize', icon: FiFilm, description: 'Remove camera shake' },
  { id: 'colorgrade', name: 'Color Grade', icon: FiSliders, description: 'AI color correction' },
];

const captionStyles = [
  { id: 'minimal', name: 'Minimal', preview: 'Simple white text' },
  { id: 'bold', name: 'Bold', preview: 'Large bold captions' },
  { id: 'boxed', name: 'Boxed', preview: 'Text with background' },
  { id: 'animated', name: 'Animated', preview: 'Word-by-word animation' },
  { id: 'karaoke', name: 'Karaoke', preview: 'Highlighted text' },
];

export default function AIPanel({ canvasState, setCanvasState, addElement, currentPage }) {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(aiModels[0]);
  const [selectedQuality, setSelectedQuality] = useState(qualityOptions[1]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showQualityDropdown, setShowQualityDropdown] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSection, setActiveSection] = useState('generate');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      setIsGenerating(false);
      setPrompt('');
    }, 2000);
  };

  const handleAddCaption = (style) => {
    const newCaption = {
      id: `caption-${Date.now()}`,
      type: 'caption',
      content: 'Your caption here',
      x: canvasState.width / 2 - 150,
      y: canvasState.height - 100,
      width: 300,
      height: 50,
      fontFamily: 'Inter',
      fontSize: style.id === 'bold' ? 28 : 20,
      fontWeight: style.id === 'bold' ? 700 : 500,
      color: '#ffffff',
      bgColor: style.id === 'boxed' ? 'rgba(0,0,0,0.7)' : 'transparent',
      borderRadius: 8,
      zIndex: 100,
      startTime: 0,
      duration: 5,
      captionStyle: style.id,
    };
    addElement(newCaption);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Section Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--glass-hover)]">
        <button
          onClick={() => setActiveSection('generate')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
            ${activeSection === 'generate' 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'hover:bg-[var(--glass-hover)]'
            }`}
        >
          Generate
        </button>
        <button
          onClick={() => setActiveSection('effects')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
            ${activeSection === 'effects' 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'hover:bg-[var(--glass-hover)]'
            }`}
        >
          Effects
        </button>
        <button
          onClick={() => setActiveSection('captions')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
            ${activeSection === 'captions' 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'hover:bg-[var(--glass-hover)]'
            }`}
        >
          Captions
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSection === 'generate' && (
          <motion.div
            key="generate"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* AI Prompt Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <HiSparkles className="w-4 h-4 text-primary" />
                AI Video Generation
              </label>

              {/* Model & Quality Selectors */}
              <div className="flex gap-2">
                {/* Model Dropdown */}
                <div className="relative flex-1">
                  <button
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg
                             bg-[var(--glass-hover)] border border-[var(--glass-border)]
                             hover:border-primary/50 transition-colors text-sm"
                  >
                    <span>{selectedModel.name}</span>
                    <FiChevronDown className={`w-4 h-4 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showModelDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full mt-1 left-0 right-0 z-50 glass-card rounded-xl shadow-xl overflow-hidden"
                      >
                        {aiModels.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => {
                              setSelectedModel(model);
                              setShowModelDropdown(false);
                            }}
                            className={`w-full px-3 py-2 text-left hover:bg-[var(--glass-hover)] transition-colors
                              ${selectedModel.id === model.id ? 'bg-primary/10' : ''}`}
                          >
                            <div className="text-sm font-medium">{model.name}</div>
                            <div className="text-xs text-muted-foreground">{model.description}</div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Quality Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowQualityDropdown(!showQualityDropdown)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg
                             bg-[var(--glass-hover)] border border-[var(--glass-border)]
                             hover:border-primary/50 transition-colors text-sm"
                  >
                    <span>{selectedQuality.name}</span>
                    <FiChevronDown className={`w-4 h-4 transition-transform ${showQualityDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showQualityDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full mt-1 right-0 z-50 glass-card rounded-xl shadow-xl overflow-hidden min-w-[120px]"
                      >
                        {qualityOptions.map((quality) => (
                          <button
                            key={quality.id}
                            onClick={() => {
                              setSelectedQuality(quality);
                              setShowQualityDropdown(false);
                            }}
                            className={`w-full px-3 py-2 text-left hover:bg-[var(--glass-hover)] transition-colors
                              ${selectedQuality.id === quality.id ? 'bg-primary/10' : ''}`}
                          >
                            <div className="text-sm font-medium">{quality.name}</div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Prompt Input */}
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the video you want to create..."
                  className="w-full h-24 px-4 py-3 rounded-xl bg-[var(--glass-hover)] 
                           border border-[var(--glass-border)] focus:border-primary/50
                           focus:outline-none focus:ring-2 focus:ring-primary/20
                           resize-none text-sm placeholder:text-muted-foreground"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="absolute bottom-3 right-3 p-2 rounded-lg bg-primary text-primary-foreground
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiSend className="w-4 h-4" />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Quick Prompts */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Quick Prompts</label>
              <div className="flex flex-wrap gap-2">
                {['Cinematic scene', 'Product showcase', 'Talking head', 'B-roll footage'].map((quickPrompt) => (
                  <button
                    key={quickPrompt}
                    onClick={() => setPrompt(quickPrompt)}
                    className="px-3 py-1.5 rounded-lg bg-[var(--glass-hover)] text-xs
                             hover:bg-primary/10 transition-colors"
                  >
                    {quickPrompt}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'effects' && (
          <motion.div
            key="effects"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <label className="text-sm font-medium flex items-center gap-2">
              <FiZap className="w-4 h-4 text-primary" />
              AI Effects
            </label>

            <div className="grid grid-cols-1 gap-2">
              {aiEffects.map((effect) => (
                <motion.button
                  key={effect.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--glass-hover)]
                           hover:bg-primary/10 border border-[var(--glass-border)]
                           hover:border-primary/50 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <effect.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{effect.name}</div>
                    <div className="text-xs text-muted-foreground">{effect.description}</div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* AI Tools */}
            <div className="pt-4 border-t border-[var(--glass-border)]">
              <label className="text-sm font-medium flex items-center gap-2 mb-3">
                <HiOutlineTranslate className="w-4 h-4 text-primary" />
                AI Tools
              </label>

              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--glass-hover)]
                           hover:bg-primary/10 border border-[var(--glass-border)]
                           hover:border-primary/50 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <HiOutlineTranslate className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Auto Translate</div>
                    <div className="text-xs text-muted-foreground">Translate to 50+ languages</div>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--glass-hover)]
                           hover:bg-primary/10 border border-[var(--glass-border)]
                           hover:border-primary/50 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <FiMusic className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Generate Music</div>
                    <div className="text-xs text-muted-foreground">AI background music</div>
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'captions' && (
          <motion.div
            key="captions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <label className="text-sm font-medium flex items-center gap-2">
              <MdOutlineSubtitles className="w-4 h-4 text-primary" />
              Auto Captions
            </label>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-primary/20 to-violet-500/20
                       border border-primary/30 hover:border-primary/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/30 flex items-center justify-center">
                  <MdOutlineSubtitles className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Generate Auto Captions</div>
                  <div className="text-xs text-muted-foreground">AI transcription with timestamps</div>
                </div>
              </div>
            </motion.button>

            <div className="pt-4 border-t border-[var(--glass-border)]">
              <label className="text-sm font-medium mb-3 block">Caption Styles</label>
              <div className="grid grid-cols-1 gap-2">
                {captionStyles.map((style) => (
                  <motion.button
                    key={style.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAddCaption(style)}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--glass-hover)]
                             hover:bg-primary/10 border border-[var(--glass-border)]
                             hover:border-primary/50 transition-all"
                  >
                    <div>
                      <div className="text-sm font-medium text-left">{style.name}</div>
                      <div className="text-xs text-muted-foreground">{style.preview}</div>
                    </div>
                    <div className="w-16 h-8 rounded bg-black/50 flex items-center justify-center text-[10px] text-white">
                      Sample
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
