'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

export default function DesignCanvas({ 
  canvasState, 
  setCanvasState, 
  selectedElement, 
  setSelectedElement,
  currentPage,
  zoom 
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);

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
              color: element.color || '#000000',
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

      default:
        return null;
    }
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-auto bg-[#f0f1f5] flex items-center justify-center p-8"
    >
      <motion.div
        ref={canvasRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          width: canvasState.width * (zoom / 100),
          height: canvasState.height * (zoom / 100),
          backgroundColor: canvasState.backgroundColor || '#ffffff',
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
