'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiChevronDown, FiSettings, FiImage, FiRefreshCw
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { v4 as uuidv4 } from 'uuid';

// AI Models available
const aiModels = [
  { id: 'stable-diffusion-xl', name: 'Stable Diffusion XL', description: 'High quality, detailed images' },
  { id: 'midjourney-v6', name: 'Midjourney V6', description: 'Artistic and creative styles' },
  { id: 'dall-e-3', name: 'DALL-E 3', description: 'Precise prompt following' },
  { id: 'flux-pro', name: 'Flux Pro', description: 'Fast generation, good quality' },
];

export default function HomePanel({ canvasState, setCanvasState, addElement, currentPage }) {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(aiModels[0]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Advanced settings
  const [negativePrompt, setNegativePrompt] = useState('');
  const [steps, setSteps] = useState(30);
  const [guidance, setGuidance] = useState(7.5);
  const [seed, setSeed] = useState('');

  // Handle generate image
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate AI generation (UI only)
    setTimeout(() => {
      // Add placeholder image element to canvas
      const newElement = {
        id: uuidv4(),
        type: 'image',
        x: 100,
        y: 100,
        width: 400,
        height: 400,
        src: `https://via.placeholder.com/400x400?text=AI+Generated`,
        zIndex: (canvasState.pages[currentPage]?.elements?.length || 0) + 1,
        prompt: prompt,
        model: selectedModel.id,
      };
      
      addElement(newElement);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--glass-border)]">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <HiSparkles className="w-5 h-5 text-primary" />
          AI Image Generation
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Create images with AI</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Prompt Input with Model Dropdown */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Prompt</label>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to create..."
              className="w-full min-h-[100px] px-3 py-2 rounded-xl border border-[var(--glass-border)] 
                       bg-[var(--glass-hover)] text-sm placeholder:text-muted-foreground 
                       focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            
            {/* Model Selector inside prompt area */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <div className="relative">
                <button
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-background/80 
                           backdrop-blur-sm text-xs hover:bg-[var(--glass-hover)] transition-colors
                           border border-[var(--glass-border)]"
                >
                  <FiImage className="w-3 h-3" />
                  <span>{selectedModel.name}</span>
                  <FiChevronDown className="w-3 h-3" />
                </button>

                <AnimatePresence>
                  {showModelDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute bottom-full mb-1 left-0 z-50 glass-card rounded-xl 
                               shadow-xl min-w-[200px] overflow-hidden"
                    >
                      {aiModels.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model);
                            setShowModelDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--glass-hover)] 
                                   transition-colors ${selectedModel.id === model.id ? 'bg-primary/10' : ''}`}
                        >
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs text-muted-foreground">{model.description}</div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Settings Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground 
                   transition-colors"
        >
          <FiSettings className="w-4 h-4" />
          Advanced Settings
          <FiChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {/* Advanced Settings Panel */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 overflow-hidden"
            >
              {/* Negative Prompt */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Negative Prompt</label>
                <textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="What to avoid in the image..."
                  className="w-full min-h-[60px] px-3 py-2 rounded-lg border border-[var(--glass-border)] 
                           bg-[var(--glass-hover)] text-sm placeholder:text-muted-foreground 
                           focus:outline-none resize-none"
                />
              </div>

              {/* Steps */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-muted-foreground">Steps</label>
                  <span className="text-xs text-muted-foreground">{steps}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={steps}
                  onChange={(e) => setSteps(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              {/* Guidance Scale */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-muted-foreground">Guidance Scale</label>
                  <span className="text-xs text-muted-foreground">{guidance}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={guidance}
                  onChange={(e) => setGuidance(parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              {/* Seed */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Seed (optional)</label>
                <input
                  type="text"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Random if empty"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--glass-border)] 
                           bg-[var(--glass-hover)] text-sm placeholder:text-muted-foreground 
                           focus:outline-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-violet-500 
                   text-primary-foreground font-medium shadow-lg disabled:opacity-50 
                   disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <FiRefreshCw className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <HiSparkles className="w-4 h-4" />
              Generate Image
            </>
          )}
        </motion.button>

        {/* Quick Prompts */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Quick Prompts</label>
          <div className="flex flex-wrap gap-2">
            {[
              'Product photography',
              'Social media graphic',
              'Abstract background',
              'Portrait photo',
              'Landscape scene',
            ].map((quickPrompt) => (
              <button
                key={quickPrompt}
                onClick={() => setPrompt(quickPrompt)}
                className="px-2 py-1 rounded-lg text-xs bg-[var(--glass-hover)] 
                         hover:bg-primary/10 transition-colors"
              >
                {quickPrompt}
              </button>
            ))}
          </div>
        </div>

        {/* AI Features */}
        <div className="space-y-2 pt-4 border-t border-[var(--glass-border)]">
          <label className="text-xs font-medium text-muted-foreground">AI Enhance</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Remove BG', icon: '🎭' },
              { label: 'Upscale 4K', icon: '📐' },
              { label: 'Face Fix', icon: '👤' },
              { label: 'Auto Color', icon: '🎨' },
            ].map((feature) => (
              <button
                key={feature.label}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--glass-hover)] 
                         hover:bg-primary/10 transition-colors text-sm"
              >
                <span>{feature.icon}</span>
                <span>{feature.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
