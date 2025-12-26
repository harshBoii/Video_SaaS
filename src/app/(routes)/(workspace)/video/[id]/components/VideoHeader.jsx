'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiArrowLeft, FiDownload, FiShare2, FiChevronDown,
  FiType, FiBold, FiItalic, FiUnderline, FiAlignLeft,
  FiAlignCenter, FiAlignRight, FiClock
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';

// Font families available
const fontFamilies = [
  'Inter', 'Arial', 'Helvetica', 'Georgia', 'Times New Roman',
  'Verdana', 'Trebuchet MS', 'Courier New', 'Impact', 'Comic Sans MS'
];

// Font sizes
const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 96];

// Canvas presets for video
const canvasPresets = [
  { name: 'YouTube (16:9)', width: 1920, height: 1080 },
  { name: 'Instagram Reel', width: 1080, height: 1920 },
  { name: 'TikTok', width: 1080, height: 1920 },
  { name: 'Instagram Post', width: 1080, height: 1080 },
  { name: 'YouTube Shorts', width: 1080, height: 1920 },
  { name: 'Twitter Video', width: 1280, height: 720 },
  { name: 'Facebook Video', width: 1280, height: 720 },
  { name: '4K Ultra HD', width: 3840, height: 2160 },
  { name: 'Custom', width: null, height: null },
];

export default function VideoHeader({ 
  canvasState, 
  setCanvasState, 
  selectedElement,
  updateElement,
  projectName,
  setProjectName,
  onExport
}) {
  const router = useRouter();
  const [showResizeDropdown, setShowResizeDropdown] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [customWidth, setCustomWidth] = useState(canvasState.width);
  const [customHeight, setCustomHeight] = useState(canvasState.height);

  const isTextSelected = selectedElement?.type === 'text' || selectedElement?.type === 'caption';
  const isCanvasSelected = selectedElement?.type === 'canvas';
  const isShapeSelected = selectedElement?.type === 'shape';
  const isElementSelected = selectedElement?.id && selectedElement?.element;
  const selectedTextElement = isTextSelected ? selectedElement.element : null;
  const selectedShapeElement = isShapeSelected ? selectedElement.element : null;

  // Handle canvas resize
  const handleResize = (preset) => {
    if (preset.width && preset.height) {
      setCanvasState(prev => ({
        ...prev,
        width: preset.width,
        height: preset.height
      }));
      setCustomWidth(preset.width);
      setCustomHeight(preset.height);
    }
    setShowResizeDropdown(false);
  };

  // Handle custom resize
  const handleCustomResize = () => {
    const w = parseInt(customWidth) || 1920;
    const h = parseInt(customHeight) || 1080;
    setCanvasState(prev => ({
      ...prev,
      width: Math.max(100, Math.min(5000, w)),
      height: Math.max(100, Math.min(5000, h))
    }));
  };

  // Handle background color change
  const handleBackgroundColor = (color) => {
    setCanvasState(prev => ({
      ...prev,
      backgroundColor: color
    }));
  };

  // Handle text style change
  const handleTextStyle = (property, value) => {
    if (!isTextSelected) return;
    updateElement(selectedElement.id, { [property]: value });
  };

  // Common colors for quick selection
  const quickColors = [
    '#000000', '#1a1a1a', '#2d2d2d', '#404040', '#525252',
    '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da',
    '#ff6b6b', '#f06595', '#cc5de8', '#845ef7', '#5c7cfa',
    '#339af0', '#22b8cf', '#20c997', '#51cf66', '#94d82d',
    '#fcc419', '#ff922b', '#ff6b6b', '#e64980', '#be4bdb',
  ];

  return (
    <div className="h-14 glass-card border-b border-[var(--glass-border)] flex items-center justify-between px-4">
      {/* Left Section - Back & Project Name */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/')}
          className="p-2 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
        </motion.button>
        
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-transparent hover:bg-[var(--glass-hover)] 
                   focus:bg-[var(--glass-hover)] focus:outline-none font-medium text-sm
                   border border-transparent focus:border-[var(--glass-border)] transition-all"
          placeholder="Untitled Video"
        />
      </div>

      {/* Center Section - Context Tools */}
      <div className="flex items-center gap-2">
        {/* Element Size Display */}
        {isElementSelected && !isCanvasSelected && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--glass-hover)] text-xs">
            <span className="text-muted-foreground">W:</span>
            <input
              type="number"
              value={Math.round(selectedElement.element.width)}
              onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 1 })}
              className="w-14 px-1 py-0.5 rounded bg-background border border-[var(--glass-border)] 
                       focus:outline-none focus:ring-1 focus:ring-primary/50 text-center"
            />
            <span className="text-muted-foreground">H:</span>
            <input
              type="number"
              value={Math.round(selectedElement.element.height)}
              onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 1 })}
              className="w-14 px-1 py-0.5 rounded bg-background border border-[var(--glass-border)] 
                       focus:outline-none focus:ring-1 focus:ring-primary/50 text-center"
            />
          </div>
        )}

        {/* Shape Selected - Show Color & Transparency */}
        {isShapeSelected && selectedShapeElement && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Fill:</span>
            <input
              type="color"
              value={selectedShapeElement.fill || '#3b82f6'}
              onChange={(e) => updateElement(selectedElement.id, { fill: e.target.value })}
              className="w-8 h-8 rounded-lg cursor-pointer border border-[var(--glass-border)]"
            />
            
            <button
              onClick={() => updateElement(selectedElement.id, { fill: 'transparent' })}
              className="px-2 py-1 text-xs rounded-lg hover:bg-[var(--glass-hover)] transition-colors
                       border border-[var(--glass-border)]"
            >
              None
            </button>

            <div className="w-px h-6 bg-[var(--glass-border)] mx-1" />

            <span className="text-xs text-muted-foreground">Stroke:</span>
            <input
              type="color"
              value={selectedShapeElement.stroke || '#000000'}
              onChange={(e) => updateElement(selectedElement.id, { stroke: e.target.value })}
              className="w-8 h-8 rounded-lg cursor-pointer border border-[var(--glass-border)]"
            />
            
            <input
              type="number"
              value={selectedShapeElement.strokeWidth || 0}
              onChange={(e) => updateElement(selectedElement.id, { strokeWidth: parseInt(e.target.value) || 0 })}
              className="w-12 px-1 py-1 text-xs rounded-lg bg-background border border-[var(--glass-border)] 
                       focus:outline-none focus:ring-1 focus:ring-primary/50 text-center"
              min="0"
              max="20"
            />
          </div>
        )}

        {/* Canvas Selected - Show Background Color */}
        {isCanvasSelected && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Background:</span>
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--glass-hover)] 
                         hover:bg-primary/10 transition-colors"
              >
                <div 
                  className="w-5 h-5 rounded border border-[var(--glass-border)]"
                  style={{ backgroundColor: canvasState.backgroundColor }}
                />
                <FiChevronDown className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showColorPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 left-0 z-50 glass-card p-3 rounded-xl shadow-xl min-w-[240px]"
                  >
                    <div className="mb-3">
                      <label className="text-xs text-muted-foreground mb-1 block">Current Color</label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-10 h-10 rounded-lg border border-[var(--glass-border)]"
                          style={{ backgroundColor: canvasState.backgroundColor }}
                        />
                        <input
                          type="text"
                          value={canvasState.backgroundColor}
                          onChange={(e) => handleBackgroundColor(e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg bg-[var(--glass-hover)] text-sm
                                   border border-[var(--glass-border)] focus:outline-none"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-1.5">
                      {quickColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleBackgroundColor(color)}
                          className="w-8 h-8 rounded-lg border border-[var(--glass-border)] 
                                   hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    <div className="mt-3">
                      <input
                        type="color"
                        value={canvasState.backgroundColor}
                        onChange={(e) => handleBackgroundColor(e.target.value)}
                        className="w-full h-8 rounded-lg cursor-pointer"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Text Selected - Show Text Formatting */}
        {isTextSelected && selectedTextElement && (
          <div className="flex items-center gap-1">
            {/* Font Family */}
            <div className="relative">
              <button
                onClick={() => setShowFontDropdown(!showFontDropdown)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--glass-hover)] 
                         hover:bg-primary/10 transition-colors text-sm min-w-[120px]"
              >
                <span className="truncate">{selectedTextElement.fontFamily || 'Inter'}</span>
                <FiChevronDown className="w-3 h-3 flex-shrink-0" />
              </button>

              <AnimatePresence>
                {showFontDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-1 left-0 z-50 glass-card rounded-xl shadow-xl 
                             max-h-60 overflow-y-auto min-w-[160px]"
                  >
                    {fontFamilies.map((font) => (
                      <button
                        key={font}
                        onClick={() => {
                          handleTextStyle('fontFamily', font);
                          setShowFontDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--glass-hover)] 
                                 transition-colors first:rounded-t-xl last:rounded-b-xl"
                        style={{ fontFamily: font }}
                      >
                        {font}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Font Size */}
            <div className="relative">
              <button
                onClick={() => setShowSizeDropdown(!showSizeDropdown)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--glass-hover)] 
                         hover:bg-primary/10 transition-colors text-sm min-w-[60px]"
              >
                <span>{selectedTextElement.fontSize || 24}</span>
                <FiChevronDown className="w-3 h-3" />
              </button>

              <AnimatePresence>
                {showSizeDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-1 left-0 z-50 glass-card rounded-xl shadow-xl 
                             max-h-48 overflow-y-auto min-w-[80px]"
                  >
                    {fontSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          handleTextStyle('fontSize', size);
                          setShowSizeDropdown(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-[var(--glass-hover)] 
                                 transition-colors"
                      >
                        {size}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-6 bg-[var(--glass-border)] mx-1" />

            {/* Bold */}
            <button
              onClick={() => handleTextStyle('fontWeight', selectedTextElement.fontWeight === 700 ? 400 : 700)}
              className={`p-2 rounded-lg transition-colors ${
                selectedTextElement.fontWeight === 700 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-[var(--glass-hover)]'
              }`}
            >
              <FiBold className="w-4 h-4" />
            </button>

            {/* Italic */}
            <button
              onClick={() => handleTextStyle('fontStyle', selectedTextElement.fontStyle === 'italic' ? 'normal' : 'italic')}
              className={`p-2 rounded-lg transition-colors ${
                selectedTextElement.fontStyle === 'italic' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-[var(--glass-hover)]'
              }`}
            >
              <FiItalic className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-[var(--glass-border)] mx-1" />

            {/* Text Align */}
            <button
              onClick={() => handleTextStyle('textAlign', 'left')}
              className={`p-2 rounded-lg transition-colors ${
                selectedTextElement.textAlign === 'left' || !selectedTextElement.textAlign
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-[var(--glass-hover)]'
              }`}
            >
              <FiAlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleTextStyle('textAlign', 'center')}
              className={`p-2 rounded-lg transition-colors ${
                selectedTextElement.textAlign === 'center' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-[var(--glass-hover)]'
              }`}
            >
              <FiAlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleTextStyle('textAlign', 'right')}
              className={`p-2 rounded-lg transition-colors ${
                selectedTextElement.textAlign === 'right' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-[var(--glass-hover)]'
              }`}
            >
              <FiAlignRight className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-[var(--glass-border)] mx-1" />

            {/* Text Color */}
            <input
              type="color"
              value={selectedTextElement.color || '#ffffff'}
              onChange={(e) => handleTextStyle('color', e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border border-[var(--glass-border)]"
            />
          </div>
        )}

        {/* Resize Button */}
        <div className="relative ml-4">
          <button
            onClick={() => setShowResizeDropdown(!showResizeDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--glass-hover)] 
                     hover:bg-primary/10 transition-colors text-sm"
          >
            <span>{canvasState.width} × {canvasState.height}</span>
            <FiChevronDown className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {showResizeDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-2 right-0 z-50 glass-card p-3 rounded-xl shadow-xl min-w-[240px]"
              >
                <div className="mb-3">
                  <label className="text-xs text-muted-foreground mb-2 block">Custom Size</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      className="w-20 px-2 py-1.5 rounded-lg bg-[var(--glass-hover)] text-sm
                               border border-[var(--glass-border)] focus:outline-none"
                      placeholder="Width"
                    />
                    <span className="text-muted-foreground">×</span>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      className="w-20 px-2 py-1.5 rounded-lg bg-[var(--glass-hover)] text-sm
                               border border-[var(--glass-border)] focus:outline-none"
                      placeholder="Height"
                    />
                    <button
                      onClick={handleCustomResize}
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div className="border-t border-[var(--glass-border)] pt-3">
                  <label className="text-xs text-muted-foreground mb-2 block">Presets</label>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {canvasPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handleResize(preset)}
                        className="w-full px-3 py-2 rounded-lg text-left text-sm hover:bg-[var(--glass-hover)] 
                                 transition-colors flex items-center justify-between"
                      >
                        <span>{preset.name}</span>
                        {preset.width && (
                          <span className="text-xs text-muted-foreground">
                            {preset.width} × {preset.height}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[var(--glass-hover)] 
                   hover:bg-primary/10 transition-colors text-sm"
        >
          <FiShare2 className="w-4 h-4" />
          Share
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-primary to-violet-500 
                   text-primary-foreground text-sm font-medium shadow-lg"
        >
          <FiDownload className="w-4 h-4" />
          Export
        </motion.button>
      </div>
    </div>
  );
}
