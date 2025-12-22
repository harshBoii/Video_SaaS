'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiLink,
  FiImage,
  FiCode,
  FiType,
  FiPlus,
  FiCheck,
  FiX,
  FiMoreHorizontal,
  FiChevronDown,
  FiHash,
  FiCheckSquare,
  FiMinus,
} from 'react-icons/fi';

const BlockTypeSelector = ({ currentType, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const blockTypes = [
    { id: 'paragraph', label: 'Text', icon: FiType },
    { id: 'heading1', label: 'Heading 1', icon: FiHash },
    { id: 'heading2', label: 'Heading 2', icon: FiHash },
    { id: 'heading3', label: 'Heading 3', icon: FiHash },
    { id: 'bullet', label: 'Bullet List', icon: FiList },
    { id: 'numbered', label: 'Numbered List', icon: FiList },
    { id: 'todo', label: 'To-do List', icon: FiCheckSquare },
    { id: 'code', label: 'Code Block', icon: FiCode },
    { id: 'divider', label: 'Divider', icon: FiMinus },
  ];

  const currentBlock = blockTypes.find(b => b.id === currentType) || blockTypes[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
      >
        <currentBlock.icon className="w-4 h-4" />
        <span className="text-sm">{currentBlock.label}</span>
        <FiChevronDown className="w-3.5 h-3.5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full left-0 mt-1 w-48 bg-background border border-border rounded-xl shadow-xl z-50 py-1 overflow-hidden"
          >
            {blockTypes.map(block => (
              <button
                key={block.id}
                onClick={() => {
                  onChange(block.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors ${
                  currentType === block.id ? 'text-primary bg-primary/5' : 'text-foreground'
                }`}
              >
                <block.icon className="w-4 h-4" />
                <span>{block.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FormatToolbar = ({ onFormat }) => {
  const tools = [
    { id: 'bold', icon: FiBold, shortcut: '⌘B' },
    { id: 'italic', icon: FiItalic, shortcut: '⌘I' },
    { id: 'underline', icon: FiUnderline, shortcut: '⌘U' },
    { id: 'divider', type: 'divider' },
    { id: 'link', icon: FiLink, shortcut: '⌘K' },
    { id: 'code', icon: FiCode, shortcut: '⌘E' },
  ];

  return (
    <div className="flex items-center gap-0.5">
      {tools.map((tool, index) => 
        tool.type === 'divider' ? (
          <div key={index} className="w-px h-5 bg-border mx-1" />
        ) : (
          <motion.button
            key={tool.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onFormat(tool.id)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={tool.shortcut}
          >
            <tool.icon className="w-4 h-4" />
          </motion.button>
        )
      )}
    </div>
  );
};

const EditorBlock = ({ block, isActive, onUpdate, onDelete, onAddBelow }) => {
  const [content, setContent] = useState(block.content || '');
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onAddBelow();
    }
    if (e.key === 'Backspace' && content === '' && block.type !== 'paragraph') {
      e.preventDefault();
      onDelete();
    }
  };

  const renderBlock = () => {
    switch (block.type) {
      case 'heading1':
        return (
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              onUpdate({ ...block, content: e.target.value });
            }}
            onKeyDown={handleKeyDown}
            placeholder="Heading 1"
            className="w-full bg-transparent text-4xl font-heading font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
        );
      case 'heading2':
        return (
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              onUpdate({ ...block, content: e.target.value });
            }}
            onKeyDown={handleKeyDown}
            placeholder="Heading 2"
            className="w-full bg-transparent text-2xl font-heading font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
        );
      case 'heading3':
        return (
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              onUpdate({ ...block, content: e.target.value });
            }}
            onKeyDown={handleKeyDown}
            placeholder="Heading 3"
            className="w-full bg-transparent text-xl font-heading font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
        );
      case 'bullet':
        return (
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground mt-1">•</span>
            <input
              ref={inputRef}
              type="text"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                onUpdate({ ...block, content: e.target.value });
              }}
              onKeyDown={handleKeyDown}
              placeholder="List item"
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            />
          </div>
        );
      case 'todo':
        return (
          <div className="flex items-start gap-3">
            <button
              onClick={() => onUpdate({ ...block, checked: !block.checked })}
              className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                block.checked
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {block.checked && <FiCheck className="w-3 h-3" />}
            </button>
            <input
              ref={inputRef}
              type="text"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                onUpdate({ ...block, content: e.target.value });
              }}
              onKeyDown={handleKeyDown}
              placeholder="To-do"
              className={`flex-1 bg-transparent placeholder:text-muted-foreground/50 focus:outline-none ${
                block.checked ? 'line-through text-muted-foreground' : 'text-foreground'
              }`}
            />
          </div>
        );
      case 'code':
        return (
          <div className="rounded-lg bg-[#1e1e1e] dark:bg-black/50 p-4 font-mono text-sm">
            <textarea
              ref={inputRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                onUpdate({ ...block, content: e.target.value });
              }}
              placeholder="Write code..."
              className="w-full bg-transparent text-gray-300 placeholder:text-gray-500 focus:outline-none resize-none min-h-[100px]"
            />
          </div>
        );
      case 'divider':
        return <hr className="border-border my-2" />;
      default:
        return (
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              onUpdate({ ...block, content: e.target.value });
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type '/' for commands..."
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none resize-none min-h-[24px]"
            rows={1}
          />
        );
    }
  };

  return (
    <div
      className={`group relative py-1 px-2 -mx-2 rounded-lg transition-colors ${
        isActive ? 'bg-primary/5' : 'hover:bg-muted/50'
      }`}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
    >
      {/* Block Actions */}
      <AnimatePresence>
        {showMenu && block.type !== 'divider' && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="absolute -left-10 top-1 flex items-center gap-0.5"
          >
            <button
              onClick={onAddBelow}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <FiPlus className="w-4 h-4" />
            </button>
            <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-grab">
              <FiMoreHorizontal className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {renderBlock()}
    </div>
  );
};

const DocumentEditor = ({ document, onChange }) => {
  const [title, setTitle] = useState(document?.title || 'Untitled');
  const [blocks, setBlocks] = useState(document?.blocks || [
    { id: '1', type: 'heading1', content: '' },
    { id: '2', type: 'paragraph', content: '' },
  ]);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [currentBlockType, setCurrentBlockType] = useState('paragraph');
  const editorRef = useRef(null);

  const handleUpdateBlock = (updatedBlock) => {
    setBlocks(prev => prev.map(b => b.id === updatedBlock.id ? updatedBlock : b));
  };

  const handleDeleteBlock = (blockId) => {
    if (blocks.length > 1) {
      setBlocks(prev => prev.filter(b => b.id !== blockId));
    }
  };

  const handleAddBlockBelow = (afterBlockId) => {
    const newBlock = {
      id: Date.now().toString(),
      type: currentBlockType,
      content: '',
    };
    
    const index = blocks.findIndex(b => b.id === afterBlockId);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
    setActiveBlockId(newBlock.id);
  };

  const handleFormat = (formatType) => {
    // Format handling would go here
    console.log('Format:', formatType);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <BlockTypeSelector
            currentType={currentBlockType}
            onChange={setCurrentBlockType}
          />
          <div className="w-px h-5 bg-border mx-1" />
          <FormatToolbar onFormat={handleFormat} />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Saved</span>
          <div className="w-2 h-2 rounded-full bg-green-500" />
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto">
        <div 
          ref={editorRef}
          className="max-w-3xl mx-auto px-6 md:px-12 py-8 md:py-16"
        >
          {/* Document Icon & Title */}
          <div className="mb-8">
            <button className="text-5xl mb-4 hover:scale-110 transition-transform cursor-pointer">
              {document?.icon || '📄'}
            </button>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              className="w-full bg-transparent text-4xl md:text-5xl font-heading font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none"
            />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {['#campaign', '#draft', '#q1-2024'].map((tag, index) => (
              <span
                key={index}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-colors"
              >
                {tag}
              </span>
            ))}
            <button className="px-2.5 py-1 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              + Add tag
            </button>
          </div>

          {/* Blocks */}
          <div className="space-y-1 pl-8">
            {blocks.map((block) => (
              <EditorBlock
                key={block.id}
                block={block}
                isActive={activeBlockId === block.id}
                onUpdate={handleUpdateBlock}
                onDelete={() => handleDeleteBlock(block.id)}
                onAddBelow={() => handleAddBlockBelow(block.id)}
              />
            ))}
          </div>

          {/* Add Block Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => handleAddBlockBelow(blocks[blocks.length - 1]?.id)}
            className="mt-4 ml-8 flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            <span className="text-sm">Add a block</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
