'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiType, FiSquare, FiCircle, FiTriangle, FiStar,
  FiHexagon, FiMinus, FiPlus, FiSearch
} from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';

// Shape elements
const shapes = [
  { id: 'rectangle', icon: FiSquare, label: 'Rectangle', shape: 'rectangle' },
  { id: 'circle', icon: FiCircle, label: 'Circle', shape: 'circle' },
  { id: 'triangle', icon: FiTriangle, label: 'Triangle', shape: 'triangle' },
  { id: 'star', icon: FiStar, label: 'Star', shape: 'star' },
  { id: 'hexagon', icon: FiHexagon, label: 'Hexagon', shape: 'hexagon' },
  { id: 'line', icon: FiMinus, label: 'Line', shape: 'line' },
];

// Color palette
const colorPalette = [
  '#000000', '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6',
  '#ff6b6b', '#f06595', '#cc5de8', '#845ef7', '#5c7cfa',
  '#339af0', '#22b8cf', '#20c997', '#51cf66', '#94d82d',
  '#fcc419', '#ff922b', '#fd7e14', '#e64980', '#be4bdb',
  '#7950f2', '#4c6ef5', '#228be6', '#15aabf', '#12b886',
  '#40c057', '#82c91e', '#fab005', '#f76707', '#fa5252',
];

// Font options
const fonts = [
  { name: 'Inter', style: 'Sans-serif' },
  { name: 'Arial', style: 'Sans-serif' },
  { name: 'Georgia', style: 'Serif' },
  { name: 'Times New Roman', style: 'Serif' },
  { name: 'Courier New', style: 'Monospace' },
  { name: 'Impact', style: 'Display' },
  { name: 'Comic Sans MS', style: 'Casual' },
  { name: 'Trebuchet MS', style: 'Sans-serif' },
  { name: 'Verdana', style: 'Sans-serif' },
  { name: 'Helvetica', style: 'Sans-serif' },
];

// Text presets
const textPresets = [
  { label: 'Heading', fontSize: 48, fontWeight: 700 },
  { label: 'Subheading', fontSize: 32, fontWeight: 600 },
  { label: 'Body', fontSize: 18, fontWeight: 400 },
  { label: 'Caption', fontSize: 14, fontWeight: 400 },
];

export default function EditPanel({ canvasState, setCanvasState, selectedElement, addElement, updateElement, currentPage }) {
  const [activeSection, setActiveSection] = useState('elements');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');

  // Add text element
  const handleAddText = (preset) => {
    const newElement = {
      id: uuidv4(),
      type: 'text',
      x: 100,
      y: 100,
      width: 300,
      height: 60,
      content: preset ? preset.label : 'Add text',
      fontSize: preset?.fontSize || 24,
      fontWeight: preset?.fontWeight || 400,
      fontFamily: 'Inter',
      fontStyle: 'normal',
      color: '#000000',
      textAlign: 'left',
      zIndex: (canvasState.pages[currentPage]?.elements?.length || 0) + 1,
    };
    addElement(newElement);
  };

  // Add shape element
  const handleAddShape = (shape) => {
    const newElement = {
      id: uuidv4(),
      type: 'shape',
      shape: shape.shape,
      x: 100,
      y: 100,
      width: 150,
      height: shape.shape === 'line' ? 4 : 150,
      fill: selectedColor,
      stroke: null,
      strokeWidth: 0,
      borderRadius: shape.shape === 'rectangle' ? 8 : 0,
      zIndex: (canvasState.pages[currentPage]?.elements?.length || 0) + 1,
    };
    addElement(newElement);
  };

  const sections = [
    { id: 'elements', label: 'Elements' },
    { id: 'text', label: 'Text' },
    { id: 'colors', label: 'Colors' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--glass-border)]">
        <h2 className="text-lg font-semibold">Edit</h2>
        <p className="text-xs text-muted-foreground mt-1">Add elements to your design</p>
      </div>

      {/* Section Tabs */}
      <div className="flex border-b border-[var(--glass-border)]">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex-1 py-2 text-sm font-medium transition-colors
              ${activeSection === section.id 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-muted-foreground hover:text-foreground'
              }
            `}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Elements Section */}
        {activeSection === 'elements' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search elements..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--glass-border)] 
                         bg-[var(--glass-hover)] text-sm placeholder:text-muted-foreground 
                         focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Shapes */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Shapes</label>
              <div className="grid grid-cols-3 gap-2">
                {shapes.map((shape) => (
                  <motion.button
                    key={shape.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddShape(shape)}
                    className="aspect-square rounded-xl bg-[var(--glass-hover)] hover:bg-primary/10 
                             transition-colors flex flex-col items-center justify-center gap-1 p-2"
                  >
                    <shape.icon className="w-6 h-6" style={{ color: selectedColor }} />
                    <span className="text-xs text-muted-foreground">{shape.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quick Color for Shapes */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Shape Color</label>
              <div className="flex flex-wrap gap-1.5">
                {colorPalette.slice(0, 10).map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-6 h-6 rounded-lg border-2 transition-transform hover:scale-110
                      ${selectedColor === color ? 'border-primary scale-110' : 'border-transparent'}
                    `}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Graphics Library Placeholder */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Graphics</label>
              <div className="grid grid-cols-2 gap-2">
                {['Icons', 'Stickers', 'Illustrations', 'Photos'].map((item) => (
                  <button
                    key={item}
                    className="p-4 rounded-xl bg-[var(--glass-hover)] hover:bg-primary/10 
                             transition-colors text-sm text-center"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Text Section */}
        {activeSection === 'text' && (
          <div className="space-y-4">
            {/* Add Text Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAddText(null)}
              className="w-full py-3 rounded-xl bg-primary/10 hover:bg-primary/20 
                       transition-colors flex items-center justify-center gap-2"
            >
              <FiType className="w-5 h-5" />
              <span className="font-medium">Add Text</span>
            </motion.button>

            {/* Text Presets */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Text Presets</label>
              <div className="space-y-2">
                {textPresets.map((preset) => (
                  <motion.button
                    key={preset.label}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAddText(preset)}
                    className="w-full p-3 rounded-xl bg-[var(--glass-hover)] hover:bg-primary/10 
                             transition-colors text-left"
                  >
                    <span 
                      style={{ 
                        fontSize: Math.min(preset.fontSize, 24), 
                        fontWeight: preset.fontWeight 
                      }}
                    >
                      {preset.label}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {preset.fontSize}px
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Font Families */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Fonts</label>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {fonts.map((font) => (
                  <button
                    key={font.name}
                    onClick={() => {
                      if (selectedElement?.type === 'text') {
                        updateElement(selectedElement.id, { fontFamily: font.name });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg hover:bg-[var(--glass-hover)] 
                             transition-colors text-left flex justify-between items-center"
                    style={{ fontFamily: font.name }}
                  >
                    <span>{font.name}</span>
                    <span className="text-xs text-muted-foreground">{font.style}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Colors Section */}
        {activeSection === 'colors' && (
          <div className="space-y-4">
            {/* Color Picker */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Custom Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border border-[var(--glass-border)]"
                />
                <input
                  type="text"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-[var(--glass-border)] 
                           bg-[var(--glass-hover)] text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Color Palette */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Color Palette</label>
              <div className="grid grid-cols-5 gap-2">
                {colorPalette.map((color) => (
                  <motion.button
                    key={color}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedColor(color);
                      if (selectedElement?.type === 'text') {
                        updateElement(selectedElement.id, { color: color });
                      } else if (selectedElement?.type === 'shape') {
                        updateElement(selectedElement.id, { fill: color });
                      }
                    }}
                    className={`aspect-square rounded-lg border-2 transition-all
                      ${selectedColor === color ? 'border-primary ring-2 ring-primary/50' : 'border-transparent'}
                    `}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Gradient Presets */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Gradients</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                ].map((gradient, idx) => (
                  <button
                    key={idx}
                    className="h-12 rounded-lg border border-[var(--glass-border)] 
                             hover:ring-2 hover:ring-primary/50 transition-all"
                    style={{ background: gradient }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
