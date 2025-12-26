'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

export default function VideoCanvas({
  canvasState,
  setCanvasState,
  selectedElement,
  setSelectedElement,
  currentPage,
  zoom
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const videoRefs = useRef({});
  const audioRefs = useRef({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [videoStates, setVideoStates] = useState({});
  const [audioStates, setAudioStates] = useState({});

  const currentPageData = canvasState.pages[currentPage] || { elements: [] };
  const elements = currentPageData.elements || [];

  // Handle canvas click (deselect or select canvas)
  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current || e.target.classList.contains('canvas-bg')) {
      setSelectedElement({ type: 'canvas', id: null });
    }
  };

  // Handle element selection
  const handleElementClick = (e, element) => {
    e.stopPropagation();
    setSelectedElement({ type: element.type, id: element.id, element });
  };

  // Handle element drag start
  const handleDragStart = (e, element) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - element.x,
      y: e.clientY - element.y
    });
    setSelectedElement({ type: element.type, id: element.id, element });
  };

  // Handle element drag
  const handleDrag = useCallback((e) => {
    if (!isDragging || !selectedElement?.id) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    setCanvasState(prev => ({
      ...prev,
      pages: prev.pages.map((page, idx) =>
        idx === currentPage
          ? {
              ...page,
              elements: page.elements.map(el =>
                el.id === selectedElement.id
                  ? { ...el, x: newX, y: newY }
                  : el
              )
            }
          : page
      )
    }));
  }, [isDragging, selectedElement, dragStart, currentPage, setCanvasState]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // Handle resize start
  const handleResizeStart = (e, element, handle) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setSelectedElement({ type: element.type, id: element.id, element });
  };

  // Handle resize
  const handleResize = useCallback((e) => {
    if (!isResizing || !selectedElement?.id || !resizeHandle) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setCanvasState(prev => ({
      ...prev,
      pages: prev.pages.map((page, idx) =>
        idx === currentPage
          ? {
              ...page,
              elements: page.elements.map(el => {
                if (el.id !== selectedElement.id) return el;

                let newWidth = el.width;
                let newHeight = el.height;
                let newX = el.x;
                let newY = el.y;

                if (resizeHandle.includes('e')) newWidth = Math.max(20, el.width + deltaX);
                if (resizeHandle.includes('w')) {
                  newWidth = Math.max(20, el.width - deltaX);
                  newX = el.x + deltaX;
                }
                if (resizeHandle.includes('s')) newHeight = Math.max(20, el.height + deltaY);
                if (resizeHandle.includes('n')) {
                  newHeight = Math.max(20, el.height - deltaY);
                  newY = el.y + deltaY;
                }

                return { ...el, width: newWidth, height: newHeight, x: newX, y: newY };
              })
            }
          : page
      )
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isResizing, selectedElement, resizeHandle, dragStart, currentPage, setCanvasState]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
    }
    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('mousemove', handleResize);
    };
  }, [isDragging, isResizing, handleDrag, handleResize, handleDragEnd]);

  // Render element based on type
  const renderElement = (element) => {
    const isSelected = selectedElement?.id === element.id;
    const baseStyle = {
      position: 'absolute',
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      cursor: isDragging ? 'grabbing' : isResizing ? 'default' : 'move',
      zIndex: element.zIndex || 1,
    };

    const getCursorForHandle = (handle) => {
      if (handle === 'nw' || handle === 'se') return 'nwse-resize';
      if (handle === 'ne' || handle === 'sw') return 'nesw-resize';
      if (handle === 'n' || handle === 's') return 'ns-resize';
      if (handle === 'e' || handle === 'w') return 'ew-resize';
      return 'default';
    };

    const selectionBox = isSelected && (
      <>
        <div className="absolute inset-0 border-[3px] border-primary pointer-events-none" 
             style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.5)' }} />
        {/* Resize handles */}
        {['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'].map(handle => (
          <div
            key={handle}
            onMouseDown={(e) => handleResizeStart(e, element, handle)}
            className="absolute w-4 h-4 bg-white border-[3px] border-primary rounded-sm hover:scale-125 transition-transform"
            style={{
              cursor: getCursorForHandle(handle),
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              ...(handle === 'nw' && { top: -8, left: -8 }),
              ...(handle === 'ne' && { top: -8, right: -8 }),
              ...(handle === 'sw' && { bottom: -8, left: -8 }),
              ...(handle === 'se' && { bottom: -8, right: -8 }),
              ...(handle === 'n' && { top: -8, left: '50%', transform: 'translateX(-50%)' }),
              ...(handle === 's' && { bottom: -8, left: '50%', transform: 'translateX(-50%)' }),
              ...(handle === 'e' && { right: -8, top: '50%', transform: 'translateY(-50%)' }),
              ...(handle === 'w' && { left: -8, top: '50%', transform: 'translateY(-50%)' }),
            }}
          />
        ))}
      </>
    );

    switch (element.type) {
      case 'text':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              fontFamily: element.fontFamily || 'Inter',
              fontSize: element.fontSize || 24,
              fontWeight: element.fontWeight || 400,
              fontStyle: element.fontStyle || 'normal',
              color: element.color || '#ffffff',
              textAlign: element.textAlign || 'left',
              lineHeight: element.lineHeight || 1.4,
              letterSpacing: element.letterSpacing || 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: element.textAlign === 'center' ? 'center' : 
                             element.textAlign === 'right' ? 'flex-end' : 'flex-start',
            }}
            onClick={(e) => handleElementClick(e, element)}
            onMouseDown={(e) => handleDragStart(e, element)}
          >
            <span className="select-none whitespace-pre-wrap">{element.content || 'Text'}</span>
            {selectionBox}
          </div>
        );

      case 'image':
        return (
          <div
            key={element.id}
            style={baseStyle}
            onClick={(e) => handleElementClick(e, element)}
            onMouseDown={(e) => handleDragStart(e, element)}
          >
            <img
              src={element.src}
              alt=""
              className="w-full h-full object-cover pointer-events-none"
              style={{ borderRadius: element.borderRadius || 0 }}
            />
            {selectionBox}
          </div>
        );

      case 'video':
        return (
          <div
            key={element.id}
            style={baseStyle}
            onClick={(e) => handleElementClick(e, element)}
            onMouseDown={(e) => handleDragStart(e, element)}
            className="group"
          >
            <video
              ref={(el) => {
                if (el) videoRefs.current[element.id] = el;
              }}
              src={element.src}
              className="w-full h-full object-cover pointer-events-auto"
              style={{ borderRadius: element.borderRadius || 0 }}
              onLoadedMetadata={(e) => {
                const duration = e.target.duration;
                if (duration && !element.videoDuration) {
                  setCanvasState(prev => ({
                    ...prev,
                    pages: prev.pages.map((page, idx) =>
                      idx === currentPage
                        ? {
                            ...page,
                            elements: page.elements.map(el =>
                              el.id === element.id
                                ? { ...el, videoDuration: duration, duration: duration }
                                : el
                            )
                          }
                        : page
                    )
                  }));
                }
              }}
              playsInline
              preload="metadata"
              controls={false}
            />
            {isSelected && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const video = videoRefs.current[element.id];
                    if (video) {
                      if (video.paused) {
                        video.play();
                        setVideoStates(prev => ({ ...prev, [element.id]: 'playing' }));
                      } else {
                        video.pause();
                        setVideoStates(prev => ({ ...prev, [element.id]: 'paused' }));
                      }
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                >
                  {videoStates[element.id] === 'playing' ? (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const video = videoRefs.current[element.id];
                    if (video) {
                      video.pause();
                      video.currentTime = 0;
                      setVideoStates(prev => ({ ...prev, [element.id]: 'stopped' }));
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                </button>
                <input
                  type="range"
                  min="0"
                  max={videoRefs.current[element.id]?.duration || 100}
                  value={videoRefs.current[element.id]?.currentTime || 0}
                  onChange={(e) => {
                    e.stopPropagation();
                    const video = videoRefs.current[element.id];
                    if (video) {
                      video.currentTime = parseFloat(e.target.value);
                    }
                  }}
                  className="w-24 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #fff 0%, #fff ${(videoRefs.current[element.id]?.currentTime / videoRefs.current[element.id]?.duration * 100) || 0}%, rgba(255,255,255,0.3) ${(videoRefs.current[element.id]?.currentTime / videoRefs.current[element.id]?.duration * 100) || 0}%, rgba(255,255,255,0.3) 100%)`
                  }}
                />
                <span className="text-xs text-white font-mono">
                  {Math.floor(videoRefs.current[element.id]?.currentTime || 0)}s
                </span>
              </div>
            )}
            {selectionBox}
          </div>
        );

      case 'shape':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: element.fill || '#3b82f6',
              borderRadius: element.shape === 'circle' ? '50%' : element.borderRadius || 0,
              border: element.stroke ? `${element.strokeWidth || 2}px solid ${element.stroke}` : 'none',
            }}
            onClick={(e) => handleElementClick(e, element)}
            onMouseDown={(e) => handleDragStart(e, element)}
          >
            {selectionBox}
          </div>
        );

      case 'caption':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: element.bgColor || 'rgba(0,0,0,0.7)',
              padding: '8px 16px',
              borderRadius: element.borderRadius || 8,
            }}
            onClick={(e) => handleElementClick(e, element)}
            onMouseDown={(e) => handleDragStart(e, element)}
          >
            <span 
              className="select-none"
              style={{
                fontFamily: element.fontFamily || 'Inter',
                fontSize: element.fontSize || 18,
                fontWeight: element.fontWeight || 500,
                color: element.color || '#ffffff',
              }}
            >
              {element.content || 'Caption'}
            </span>
            {selectionBox}
          </div>
        );

      case 'audio':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              border: '2px solid rgba(139, 92, 246, 0.5)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={(e) => handleElementClick(e, element)}
            onMouseDown={(e) => handleDragStart(e, element)}
            className="group"
          >
            <audio
              ref={(el) => {
                if (el) audioRefs.current[element.id] = el;
              }}
              src={element.src}
              onLoadedMetadata={(e) => {
                const duration = e.target.duration;
                if (duration && !element.audioDuration) {
                  setCanvasState(prev => ({
                    ...prev,
                    pages: prev.pages.map((page, idx) =>
                      idx === currentPage
                        ? {
                            ...page,
                            elements: page.elements.map(el =>
                              el.id === element.id
                                ? { ...el, audioDuration: duration, duration: duration }
                                : el
                            )
                          }
                        : page
                    )
                  }));
                }
              }}
              preload="metadata"
            />
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
              <span className="text-xs text-violet-400 font-medium">Audio Track</span>
            </div>
            {isSelected && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const audio = audioRefs.current[element.id];
                    if (audio) {
                      if (audio.paused) {
                        audio.play();
                        setAudioStates(prev => ({ ...prev, [element.id]: 'playing' }));
                      } else {
                        audio.pause();
                        setAudioStates(prev => ({ ...prev, [element.id]: 'paused' }));
                      }
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                >
                  {audioStates[element.id] === 'playing' ? (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const audio = audioRefs.current[element.id];
                    if (audio) {
                      audio.pause();
                      audio.currentTime = 0;
                      setAudioStates(prev => ({ ...prev, [element.id]: 'stopped' }));
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                </button>
                <span className="text-xs text-white font-mono">
                  {Math.floor(audioRefs.current[element.id]?.currentTime || 0)}s
                </span>
              </div>
            )}
            {selectionBox}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-auto bg-[#1a1a1a] flex items-center justify-center p-8"
    >
      <motion.div
        ref={canvasRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          width: canvasState.width * (zoom / 100),
          height: canvasState.height * (zoom / 100),
          backgroundColor: canvasState.backgroundColor || '#000000',
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'center center',
        }}
        className="relative shadow-2xl rounded-lg overflow-hidden cursor-default"
        onClick={handleCanvasClick}
      >
        {/* Canvas content wrapper */}
        <div 
          className="absolute inset-0 canvas-bg"
          style={{ 
            width: canvasState.width,
            height: canvasState.height,
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left'
          }}
        >
          {elements.map(renderElement)}
        </div>
      </motion.div>
    </div>
  );
}
