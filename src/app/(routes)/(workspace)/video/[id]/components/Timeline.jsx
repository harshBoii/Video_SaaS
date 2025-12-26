'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlay, FiPause, FiEye, FiEyeOff, FiLock, FiUnlock,
  FiTrash2, FiChevronUp, FiChevronDown, FiPlus, FiVolume2, FiVolumeX
} from 'react-icons/fi';

export default function Timeline({
  canvasState,
  setCanvasState,
  selectedElement,
  setSelectedElement,
  currentPage,
  updateElement,
  deleteElement
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [resizingClip, setResizingClip] = useState(null);
  const [draggingClip, setDraggingClip] = useState(null);
  const timelineRef = useRef(null);
  const tracksContainerRef = useRef(null);

  const currentPageData = canvasState.pages[currentPage] || { elements: [] };
  const elements = [...(currentPageData.elements || [])].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

  const handleLayerSelect = (element) => {
    setSelectedElement({ type: element.type, id: element.id, element });
  };

  const handleToggleVisibility = (elementId, currentVisibility) => {
    updateElement(elementId, { visible: currentVisibility === false ? true : false });
  };

  const handleToggleLock = (elementId, currentLock) => {
    updateElement(elementId, { locked: !currentLock });
  };

  const handleMoveLayer = (elementId, direction) => {
    const elementIndex = elements.findIndex(el => el.id === elementId);
    if (elementIndex === -1) return;

    const element = elements[elementIndex];
    const currentZIndex = element.zIndex || 1;
    
    if (direction === 'up') {
      // Move up in visual order = increase zIndex
      const higherElement = elements[elementIndex - 1];
      if (higherElement) {
        const higherZIndex = higherElement.zIndex || 1;
        updateElement(elementId, { zIndex: higherZIndex + 1 });
      }
    } else {
      // Move down in visual order = decrease zIndex
      const lowerElement = elements[elementIndex + 1];
      if (lowerElement) {
        const lowerZIndex = lowerElement.zIndex || 1;
        updateElement(elementId, { zIndex: Math.max(0, lowerZIndex - 1) });
      }
    }
  };

  const handleDeleteLayer = (elementId) => {
    deleteElement(elementId);
    if (selectedElement?.id === elementId) {
      setSelectedElement(null);
    }
  };

  const getLayerIcon = (type) => {
    switch (type) {
      case 'text':
        return '𝐓';
      case 'image':
        return '🖼';
      case 'video':
        return '🎬';
      case 'shape':
        return '◼';
      case 'caption':
        return '💬';
      default:
        return '◻';
    }
  };

  const getLayerName = (element) => {
    switch (element.type) {
      case 'text':
        return element.content?.substring(0, 20) || 'Text';
      case 'image':
        return 'Image';
      case 'video':
        return 'Video';
      case 'shape':
        return element.shape || 'Shape';
      case 'caption':
        return element.content?.substring(0, 20) || 'Caption';
      default:
        return 'Layer';
    }
  };

  const handleClipResize = (elementId, edge, e) => {
    e.stopPropagation();
    const startX = e.clientX;
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    const startTime = element.startTime || 0;
    const startDuration = element.duration || 5;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaTime = deltaX / 80;

      if (edge === 'left') {
        const newStartTime = Math.max(0, startTime + deltaTime);
        const newDuration = Math.max(0.5, startDuration - deltaTime);
        updateElement(elementId, { startTime: newStartTime, duration: newDuration });
      } else {
        const newDuration = Math.max(0.5, startDuration + deltaTime);
        updateElement(elementId, { duration: newDuration });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setResizingClip(null);
    };

    setResizingClip(elementId);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleClipDrag = (elementId, e) => {
    e.stopPropagation();
    const startX = e.clientX;
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    const startTime = element.startTime || 0;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaTime = deltaX / 80;
      const newStartTime = Math.max(0, startTime + deltaTime);
      updateElement(elementId, { startTime: newStartTime });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setDraggingClip(null);
    };

    setDraggingClip(elementId);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let animationFrame;
    if (isPlaying) {
      const animate = () => {
        setPlayheadPosition(prev => {
          const next = prev + 0.016;
          return next > 20 ? 0 : next;
        });
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);
    }
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isPlaying]);

  return (
    <div className="border-t border-[var(--glass-border)] bg-[#1a1a1a]">
      {/* Timeline Header */}
      <div className="h-10 glass-card border-b border-[var(--glass-border)] flex items-center px-4">
        <div className="flex items-center gap-3 flex-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <FiPause className="w-4 h-4" /> : <FiPlay className="w-4 h-4" />}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPlayheadPosition(prev => Math.max(0, prev - 30))}
            className="p-1.5 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
            title="Rewind 30s"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
            </svg>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPlayheadPosition(prev => Math.min(20, prev + 30))}
            className="p-1.5 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
            title="Forward 30s"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
            </svg>
          </motion.button>
          
          <span className="text-xs text-muted-foreground font-mono">{formatTime(playheadPosition)}</span>
          <div className="w-px h-4 bg-[var(--glass-border)]" />
          <span className="text-xs text-muted-foreground">Layers ({elements.length})</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
        >
          {isCollapsed ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
        </motion.button>
      </div>

      {/* Timeline Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex h-48">
              {/* Layer List */}
              <div className="w-64 border-r border-[var(--glass-border)] flex flex-col">
                <div className="flex-1 overflow-y-auto">
                {elements.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No layers yet. Add elements from the Edit panel.
                  </div>
                ) : (
                  elements.map((element, index) => (
                    <motion.div
                      key={element.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleLayerSelect(element)}
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-[var(--glass-border)]
                        ${selectedElement?.id === element.id 
                          ? 'bg-primary/20 border-l-2 border-l-primary' 
                          : 'hover:bg-[var(--glass-hover)]'
                        }
                        ${element.visible === false ? 'opacity-50' : ''}
                      `}
                    >
                      {/* Layer Icon */}
                      <span className="w-6 text-center text-sm">{getLayerIcon(element.type)}</span>
                      
                      {/* Layer Name */}
                      <span className="flex-1 text-sm truncate">{getLayerName(element)}</span>

                      {/* Layer Controls */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleVisibility(element.id, element.visible);
                          }}
                          className="p-1 rounded hover:bg-[var(--glass-hover)] transition-colors"
                          title={element.visible === false ? 'Show' : 'Hide'}
                        >
                          {element.visible === false ? (
                            <FiEyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                          ) : (
                            <FiEye className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleLock(element.id, element.locked);
                          }}
                          className="p-1 rounded hover:bg-[var(--glass-hover)] transition-colors"
                          title={element.locked ? 'Unlock' : 'Lock'}
                        >
                          {element.locked ? (
                            <FiLock className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <FiUnlock className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveLayer(element.id, 'up');
                          }}
                          disabled={index === 0}
                          className="p-1 rounded hover:bg-[var(--glass-hover)] transition-colors disabled:opacity-30"
                          title="Move Up"
                        >
                          <FiChevronUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveLayer(element.id, 'down');
                          }}
                          disabled={index === elements.length - 1}
                          className="p-1 rounded hover:bg-[var(--glass-hover)] transition-colors disabled:opacity-30"
                          title="Move Down"
                        >
                          <FiChevronDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLayer(element.id);
                          }}
                          className="p-1 rounded hover:bg-red-500/20 text-red-500 transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
                </div>
              </div>

              {/* Timeline Tracks */}
              <div ref={timelineRef} className="flex-1 bg-[#0d0d0d] flex flex-col overflow-hidden">
                {/* Time Ruler */}
                <div className="h-6 border-b border-[var(--glass-border)] flex items-end sticky top-0 bg-[#0d0d0d] z-10">
                  {[...Array(20)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-20 flex-shrink-0 border-l border-[var(--glass-border)] px-1"
                    >
                      <span className="text-[10px] text-muted-foreground">{i}s</span>
                    </div>
                  ))}
                </div>

                {/* Tracks Container */}
                <div ref={tracksContainerRef} className="relative flex-1 overflow-x-auto overflow-y-auto">
                  {/* Playhead */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                    style={{ left: `${playheadPosition * 80}px` }}
                  >
                    <div className="w-3 h-3 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1" />
                  </div>

                  {/* Track Rows */}
                  {elements.map((element) => (
                    <div 
                      key={element.id}
                      className={`h-12 border-b border-[var(--glass-border)] relative
                        ${selectedElement?.id === element.id ? 'bg-primary/5' : ''}
                      `}
                    >
                      {/* Track Clip */}
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        onMouseDown={(e) => {
                          if (e.target === e.currentTarget || e.target.closest('.clip-content')) {
                            handleClipDrag(element.id, e);
                          }
                        }}
                        onClick={() => handleLayerSelect(element)}
                        className={`absolute top-1 h-10 rounded-lg cursor-move overflow-hidden
                          ${selectedElement?.id === element.id 
                            ? 'ring-2 ring-primary' 
                            : ''
                          }
                          ${element.type === 'text' ? 'bg-gradient-to-r from-blue-500/80 to-cyan-500/80' :
                            element.type === 'image' ? 'bg-gradient-to-r from-green-500/80 to-emerald-500/80' :
                            element.type === 'video' ? 'bg-gradient-to-r from-purple-500/80 to-pink-500/80' :
                            element.type === 'shape' ? 'bg-gradient-to-r from-orange-500/80 to-amber-500/80' :
                            element.type === 'caption' ? 'bg-gradient-to-r from-red-500/80 to-rose-500/80' :
                            'bg-gradient-to-r from-gray-500/80 to-slate-500/80'
                          }
                        `}
                        style={{
                          left: `${(element.startTime || 0) * 80}px`,
                          width: `${(element.duration || 5) * 80}px`,
                        }}
                      >
                        <div className="clip-content px-2 py-1 h-full flex items-center pointer-events-none">
                          <span className="text-xs font-medium text-white truncate">
                            {getLayerName(element)}
                          </span>
                        </div>
                        
                        {/* Resize Handles */}
                        <div 
                          onMouseDown={(e) => handleClipResize(element.id, 'left', e)}
                          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 z-10" 
                        />
                        <div 
                          onMouseDown={(e) => handleClipResize(element.id, 'right', e)}
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 z-10" 
                        />
                      </motion.div>
                    </div>
                  ))}

                  {/* Empty State */}
                  {elements.length === 0 && (
                    <div className="h-24 flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">
                        Timeline tracks will appear here
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
