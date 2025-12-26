'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiType, FiSquare, FiCircle, FiTriangle, FiImage,
  FiStar, FiHeart, FiHexagon, FiOctagon, FiMinus,
  FiChevronDown, FiDroplet, FiGrid
} from 'react-icons/fi';

// Font families available
const fontFamilies = [
  'Inter', 'Arial', 'Helvetica', 'Georgia', 'Times New Roman',
  'Verdana', 'Trebuchet MS', 'Courier New', 'Impact', 'Comic Sans MS',
  'Roboto', 'Open Sans', 'Montserrat', 'Poppins', 'Playfair Display'
];

// Shape options
const shapes = [
  { id: 'rectangle', name: 'Rectangle', icon: FiSquare },
  { id: 'circle', name: 'Circle', icon: FiCircle },
  { id: 'triangle', name: 'Triangle', icon: FiTriangle },
  { id: 'star', name: 'Star', icon: FiStar },
  { id: 'heart', name: 'Heart', icon: FiHeart },
  { id: 'hexagon', name: 'Hexagon', icon: FiHexagon },
  { id: 'line', name: 'Line', icon: FiMinus },
];

// Color palette
const colorPalette = [
  '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da',
  '#000000', '#212529', '#495057', '#6c757d', '#adb5bd',
  '#ff6b6b', '#f06595', '#cc5de8', '#845ef7', '#5c7cfa',
  '#339af0', '#22b8cf', '#20c997', '#51cf66', '#94d82d',
  '#fcc419', '#ff922b', '#fd7e14', '#e64980', '#be4bdb',
  '#7950f2', '#4c6ef5', '#228be6', '#15aabf', '#12b886',
];

// Text presets
const textPresets = [
  { id: 'heading', name: 'Heading', fontSize: 48, fontWeight: 700 },
  { id: 'subheading', name: 'Subheading', fontSize: 32, fontWeight: 600 },
  { id: 'body', name: 'Body Text', fontSize: 18, fontWeight: 400 },
  { id: 'caption', name: 'Caption', fontSize: 14, fontWeight: 400 },
  { id: 'title', name: 'Title', fontSize: 64, fontWeight: 800 },
];

export default function EditPanel({
  canvasState,
  setCanvasState,
  selectedElement,
  setSelectedElement,
  addElement,
  updateElement,
  deleteElement,
  currentPage
}) {
  const [activeSection, setActiveSection] = useState('elements');
  const [selectedColor, setSelectedColor] = useState('#ffffff');

  const handleAddText = (preset) => {
    const newText = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: preset.name,
      x: 100,
      y: 100,
      width: 300,
      height: preset.fontSize * 2,
      fontFamily: 'Inter',
      fontSize: preset.fontSize,
      fontWeight: preset.fontWeight,
      fontStyle: 'normal',
      color: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.4,
      letterSpacing: 0,
      zIndex: (canvasState.pages[currentPage]?.elements?.length || 0) + 1,
      startTime: 0,
      duration: 5,
    };
    addElement(newText);
  };

  const handleAddShape = (shape) => {
    const newShape = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      shape: shape.id,
      x: 100,
      y: 100,
      width: 150,
      height: shape.id === 'line' ? 4 : 150,
      fill: selectedColor,
      stroke: '',
      strokeWidth: 0,
      borderRadius: shape.id === 'rectangle' ? 8 : 0,
      zIndex: (canvasState.pages[currentPage]?.elements?.length || 0) + 1,
      startTime: 0,
      duration: 5,
    };
    addElement(newShape);
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    if (selectedElement?.id) {
      if (selectedElement.type === 'text' || selectedElement.type === 'caption') {
        updateElement(selectedElement.id, { color });
      } else if (selectedElement.type === 'shape') {
        updateElement(selectedElement.id, { fill: color });
      }
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Section Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--glass-hover)]">
        <button
          onClick={() => setActiveSection('elements')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
            ${activeSection === 'elements' 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'hover:bg-[var(--glass-hover)]'
            }`}
        >
          Elements
        </button>
        <button
          onClick={() => setActiveSection('text')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
            ${activeSection === 'text' 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'hover:bg-[var(--glass-hover)]'
            }`}
        >
          Text
        </button>
        <button
          onClick={() => setActiveSection('colors')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
            ${activeSection === 'colors' 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'hover:bg-[var(--glass-hover)]'
            }`}
        >
          Colors
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSection === 'elements' && (
          <motion.div
            key="elements"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Shapes */}
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-3">
                <FiSquare className="w-4 h-4 text-primary" />
                Shapes
              </label>
              <div className="grid grid-cols-4 gap-2">
                {shapes.map((shape) => (
                  <motion.button
                    key={shape.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddShape(shape)}
                    className="aspect-square rounded-xl bg-[var(--glass-hover)] border border-[var(--glass-border)]
                             hover:border-primary/50 hover:bg-primary/10 transition-all
                             flex flex-col items-center justify-center gap-1"
                  >
                    <shape.icon className="w-6 h-6" />
                    <span className="text-[10px] text-muted-foreground">{shape.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Graphics */}
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-3">
                <FiImage className="w-4 h-4 text-primary" />
                Graphics Library
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Arrows', 'Icons', 'Stickers', 'Frames', 'Lines', 'Charts'].map((item) => (
                  <motion.button
                    key={item}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-3 rounded-xl bg-[var(--glass-hover)] border border-[var(--glass-border)]
                             hover:border-primary/50 hover:bg-primary/10 transition-all text-center"
                  >
                    <div className="w-full aspect-square rounded-lg bg-muted/30 mb-2 flex items-center justify-center">
                      <FiGrid className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <span className="text-xs">{item}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'text' && (
          <motion.div
            key="text"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Text Presets */}
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-3">
                <FiType className="w-4 h-4 text-primary" />
                Add Text
              </label>
              <div className="space-y-2">
                {textPresets.map((preset) => (
                  <motion.button
                    key={preset.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAddText(preset)}
                    className="w-full p-3 rounded-xl bg-[var(--glass-hover)] border border-[var(--glass-border)]
                             hover:border-primary/50 hover:bg-primary/10 transition-all text-left"
                  >
                    <span 
                      style={{ 
                        fontSize: Math.min(preset.fontSize / 2, 24), 
                        fontWeight: preset.fontWeight 
                      }}
                    >
                      {preset.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Font Families */}
            <div>
              <label className="text-sm font-medium mb-3 block">Font Families</label>
              <div className="space-y-1 max-h-48 overflow-y-auto rounded-xl border border-[var(--glass-border)]">
                {fontFamilies.map((font) => (
                  <button
                    key={font}
                    onClick={() => {
                      if (selectedElement?.id && (selectedElement.type === 'text' || selectedElement.type === 'caption')) {
                        updateElement(selectedElement.id, { fontFamily: font });
                      }
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-[var(--glass-hover)] transition-colors"
                    style={{ fontFamily: font }}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'colors' && (
          <motion.div
            key="colors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Current Color */}
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-3">
                <FiDroplet className="w-4 h-4 text-primary" />
                Current Color
              </label>
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl border-2 border-[var(--glass-border)]"
                  style={{ backgroundColor: selectedColor }}
                />
                <input
                  type="text"
                  value={selectedColor}
                  onChange={(e) => handleColorSelect(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-hover)] 
                           border border-[var(--glass-border)] focus:outline-none
                           focus:ring-2 focus:ring-primary/50 text-sm font-mono"
                />
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => handleColorSelect(e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Color Palette */}
            <div>
              <label className="text-sm font-medium mb-3 block">Color Palette</label>
              <div className="grid grid-cols-6 gap-2">
                {colorPalette.map((color) => (
                  <motion.button
                    key={color}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleColorSelect(color)}
                    className={`w-full aspect-square rounded-lg border-2 transition-all
                      ${selectedColor === color 
                        ? 'border-primary ring-2 ring-primary/50' 
                        : 'border-transparent hover:border-[var(--glass-border)]'
                      }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Gradient Presets */}
            <div>
              <label className="text-sm font-medium mb-3 block">Gradients</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                ].map((gradient, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="aspect-video rounded-lg border border-[var(--glass-border)]
                             hover:border-primary/50 transition-all"
                    style={{ background: gradient }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
