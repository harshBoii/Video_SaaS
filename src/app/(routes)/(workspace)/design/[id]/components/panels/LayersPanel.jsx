'use client';

import { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { 
  FiEye, FiEyeOff, FiLock, FiUnlock, FiTrash2,
  FiCopy, FiChevronUp, FiChevronDown, FiType,
  FiSquare, FiImage, FiMoreVertical
} from 'react-icons/fi';

export default function LayersPanel({ 
  canvasState, 
  setCanvasState, 
  selectedElement, 
  setSelectedElement,
  deleteElement,
  currentPage 
}) {
  const [hoveredLayer, setHoveredLayer] = useState(null);

  const currentPageData = canvasState.pages[currentPage] || { elements: [] };
  const elements = [...(currentPageData.elements || [])].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

  // Get icon based on element type
  const getElementIcon = (type) => {
    switch (type) {
      case 'text': return FiType;
      case 'image': return FiImage;
      case 'shape': return FiSquare;
      default: return FiSquare;
    }
  };

  // Get element label
  const getElementLabel = (element) => {
    switch (element.type) {
      case 'text': return element.content?.substring(0, 20) || 'Text';
      case 'image': return 'Image';
      case 'shape': return element.shape || 'Shape';
      default: return 'Element';
    }
  };

  // Toggle element visibility
  const toggleVisibility = (elementId) => {
    setCanvasState(prev => ({
      ...prev,
      pages: prev.pages.map((page, idx) =>
        idx === currentPage
          ? {
              ...page,
              elements: page.elements.map(el =>
                el.id === elementId ? { ...el, visible: !el.visible } : el
              )
            }
          : page
      )
    }));
  };

  // Toggle element lock
  const toggleLock = (elementId) => {
    setCanvasState(prev => ({
      ...prev,
      pages: prev.pages.map((page, idx) =>
        idx === currentPage
          ? {
              ...page,
              elements: page.elements.map(el =>
                el.id === elementId ? { ...el, locked: !el.locked } : el
              )
            }
          : page
      )
    }));
  };

  // Move element up in layer order
  const moveUp = (elementId) => {
    setCanvasState(prev => {
      const pageElements = [...prev.pages[currentPage].elements];
      const currentIndex = pageElements.findIndex(el => el.id === elementId);
      const currentZIndex = pageElements[currentIndex].zIndex || 0;
      
      // Find element with next higher zIndex
      const higherElements = pageElements.filter(el => (el.zIndex || 0) > currentZIndex);
      if (higherElements.length === 0) return prev;
      
      const nextHigher = higherElements.reduce((min, el) => 
        (el.zIndex || 0) < (min.zIndex || 0) ? el : min
      );
      
      // Swap zIndex values
      const updatedElements = pageElements.map(el => {
        if (el.id === elementId) return { ...el, zIndex: nextHigher.zIndex };
        if (el.id === nextHigher.id) return { ...el, zIndex: currentZIndex };
        return el;
      });

      return {
        ...prev,
        pages: prev.pages.map((page, idx) =>
          idx === currentPage ? { ...page, elements: updatedElements } : page
        )
      };
    });
  };

  // Move element down in layer order
  const moveDown = (elementId) => {
    setCanvasState(prev => {
      const pageElements = [...prev.pages[currentPage].elements];
      const currentIndex = pageElements.findIndex(el => el.id === elementId);
      const currentZIndex = pageElements[currentIndex].zIndex || 0;
      
      // Find element with next lower zIndex
      const lowerElements = pageElements.filter(el => (el.zIndex || 0) < currentZIndex);
      if (lowerElements.length === 0) return prev;
      
      const nextLower = lowerElements.reduce((max, el) => 
        (el.zIndex || 0) > (max.zIndex || 0) ? el : max
      );
      
      // Swap zIndex values
      const updatedElements = pageElements.map(el => {
        if (el.id === elementId) return { ...el, zIndex: nextLower.zIndex };
        if (el.id === nextLower.id) return { ...el, zIndex: currentZIndex };
        return el;
      });

      return {
        ...prev,
        pages: prev.pages.map((page, idx) =>
          idx === currentPage ? { ...page, elements: updatedElements } : page
        )
      };
    });
  };

  // Duplicate element
  const duplicateElement = (element) => {
    const newElement = {
      ...element,
      id: `${element.id}-copy-${Date.now()}`,
      x: element.x + 20,
      y: element.y + 20,
      zIndex: (elements.length || 0) + 1,
    };

    setCanvasState(prev => ({
      ...prev,
      pages: prev.pages.map((page, idx) =>
        idx === currentPage
          ? { ...page, elements: [...page.elements, newElement] }
          : page
      )
    }));
  };

  // Handle reorder
  const handleReorder = (newOrder) => {
    // Update zIndex based on new order (reversed because higher zIndex = front)
    const updatedElements = newOrder.map((el, idx) => ({
      ...el,
      zIndex: newOrder.length - idx
    }));

    setCanvasState(prev => ({
      ...prev,
      pages: prev.pages.map((page, idx) =>
        idx === currentPage ? { ...page, elements: updatedElements } : page
      )
    }));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--glass-border)]">
        <h2 className="text-lg font-semibold">Layers</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {elements.length} layer{elements.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-2">
        {elements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No layers yet. Add elements from the Edit panel.
          </div>
        ) : (
          <Reorder.Group 
            axis="y" 
            values={elements} 
            onReorder={handleReorder}
            className="space-y-1"
          >
            {elements.map((element) => {
              const Icon = getElementIcon(element.type);
              const isSelected = selectedElement?.id === element.id;
              const isHovered = hoveredLayer === element.id;
              const isVisible = element.visible !== false;
              const isLocked = element.locked === true;

              return (
                <Reorder.Item
                  key={element.id}
                  value={element}
                  className={`group relative rounded-lg cursor-pointer transition-all
                    ${isSelected 
                      ? 'bg-primary/20 border border-primary' 
                      : 'bg-[var(--glass-hover)] border border-transparent hover:border-[var(--glass-border)]'
                    }
                  `}
                  onMouseEnter={() => setHoveredLayer(element.id)}
                  onMouseLeave={() => setHoveredLayer(null)}
                  onClick={() => setSelectedElement({ type: element.type, id: element.id, element })}
                >
                  <div className="flex items-center gap-2 p-2">
                    {/* Drag Handle */}
                    <div className="w-4 h-4 flex flex-col justify-center items-center gap-0.5 cursor-grab opacity-50">
                      <div className="w-3 h-0.5 bg-current rounded" />
                      <div className="w-3 h-0.5 bg-current rounded" />
                    </div>

                    {/* Element Preview */}
                    <div 
                      className="w-8 h-8 rounded flex items-center justify-center"
                      style={{ 
                        backgroundColor: element.type === 'shape' ? element.fill : 'var(--glass-hover)',
                        opacity: isVisible ? 1 : 0.4
                      }}
                    >
                      {element.type === 'image' ? (
                        <img src={element.src} alt="" className="w-full h-full object-cover rounded" />
                      ) : (
                        <Icon className="w-4 h-4" style={{ 
                          color: element.type === 'text' ? element.color : 'white' 
                        }} />
                      )}
                    </div>

                    {/* Element Info */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${!isVisible ? 'opacity-50' : ''}`}>
                        {getElementLabel(element)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {element.type} • z:{element.zIndex || 0}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className={`flex items-center gap-1 ${isHovered || isSelected ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVisibility(element.id);
                        }}
                        className="p-1 rounded hover:bg-[var(--glass-hover)] transition-colors"
                        title={isVisible ? 'Hide' : 'Show'}
                      >
                        {isVisible ? <FiEye className="w-3.5 h-3.5" /> : <FiEyeOff className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLock(element.id);
                        }}
                        className="p-1 rounded hover:bg-[var(--glass-hover)] transition-colors"
                        title={isLocked ? 'Unlock' : 'Lock'}
                      >
                        {isLocked ? <FiLock className="w-3.5 h-3.5" /> : <FiUnlock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Actions when Selected */}
                  {isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="border-t border-[var(--glass-border)] px-2 py-2 flex items-center gap-1"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveUp(element.id);
                        }}
                        className="flex-1 py-1.5 rounded text-xs hover:bg-[var(--glass-hover)] 
                                 transition-colors flex items-center justify-center gap-1"
                        title="Bring Forward"
                      >
                        <FiChevronUp className="w-3.5 h-3.5" />
                        Up
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveDown(element.id);
                        }}
                        className="flex-1 py-1.5 rounded text-xs hover:bg-[var(--glass-hover)] 
                                 transition-colors flex items-center justify-center gap-1"
                        title="Send Backward"
                      >
                        <FiChevronDown className="w-3.5 h-3.5" />
                        Down
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateElement(element);
                        }}
                        className="flex-1 py-1.5 rounded text-xs hover:bg-[var(--glass-hover)] 
                                 transition-colors flex items-center justify-center gap-1"
                        title="Duplicate"
                      >
                        <FiCopy className="w-3.5 h-3.5" />
                        Copy
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteElement(element.id);
                          setSelectedElement(null);
                        }}
                        className="flex-1 py-1.5 rounded text-xs hover:bg-red-500/20 text-red-500 
                                 transition-colors flex items-center justify-center gap-1"
                        title="Delete"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </motion.div>
                  )}
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-[var(--glass-border)]">
        <div className="flex gap-2">
          <button
            onClick={() => {
              // Select all elements
              if (elements.length > 0) {
                setSelectedElement({ type: 'multi', ids: elements.map(el => el.id) });
              }
            }}
            className="flex-1 py-2 rounded-lg text-xs bg-[var(--glass-hover)] 
                     hover:bg-primary/10 transition-colors"
          >
            Select All
          </button>
          <button
            onClick={() => setSelectedElement(null)}
            className="flex-1 py-2 rounded-lg text-xs bg-[var(--glass-hover)] 
                     hover:bg-primary/10 transition-colors"
          >
            Deselect
          </button>
        </div>
      </div>
    </div>
  );
}
