'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiCopy, FiTrash2, FiChevronLeft, FiChevronRight,
  FiMoreHorizontal, FiZoomIn, FiZoomOut, FiChevronUp, FiChevronDown,
  FiMaximize2
} from 'react-icons/fi';

export default function VideoFooter({
  canvasState,
  setCanvasState,
  currentPage,
  setCurrentPage,
  zoom,
  setZoom
}) {
  const [showPageMenu, setShowPageMenu] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [zoomInput, setZoomInput] = useState(zoom.toString());

  const pages = canvasState.pages || [];

  useEffect(() => {
    setZoomInput(zoom.toString());
  }, [zoom]);

  const handleAddPage = () => {
    const newPage = {
      id: `page-${Date.now()}`,
      elements: []
    };
    setCanvasState(prev => ({
      ...prev,
      pages: [...prev.pages, newPage]
    }));
    setCurrentPage(pages.length);
  };

  const handleDeletePage = (index) => {
    if (pages.length <= 1) return;
    
    setCanvasState(prev => ({
      ...prev,
      pages: prev.pages.filter((_, idx) => idx !== index)
    }));
    
    if (currentPage >= index && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
    setShowPageMenu(null);
  };

  const handleDuplicatePage = (index) => {
    const pageToDuplicate = pages[index];
    const newPage = {
      ...pageToDuplicate,
      id: `page-${Date.now()}`,
      elements: pageToDuplicate.elements.map(el => ({
        ...el,
        id: `${el.id}-copy-${Date.now()}`
      }))
    };
    
    setCanvasState(prev => ({
      ...prev,
      pages: [...prev.pages.slice(0, index + 1), newPage, ...prev.pages.slice(index + 1)]
    }));
    setShowPageMenu(null);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(200, prev + 10));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(25, prev - 10));
  };

  const handleZoomInputChange = (e) => {
    setZoomInput(e.target.value);
  };

  const handleZoomInputBlur = () => {
    const numValue = parseInt(zoomInput);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(25, Math.min(200, numValue));
      setZoom(clampedValue);
      setZoomInput(clampedValue.toString());
    } else {
      setZoomInput(zoom.toString());
    }
  };

  const handleZoomInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleZoomInputBlur();
      e.target.blur();
    }
  };

  const handleFitToScreen = () => {
    if (typeof window !== 'undefined') {
      const container = document.querySelector('.flex-1.overflow-auto');
      if (container) {
        const containerWidth = container.clientWidth - 64;
        const containerHeight = container.clientHeight - 64;
        const scaleX = containerWidth / canvasState.width;
        const scaleY = containerHeight / canvasState.height;
        const scale = Math.min(scaleX, scaleY, 1) * 100;
        setZoom(Math.round(scale));
      }
    }
  };

  useEffect(() => {
    handleFitToScreen();
  }, [canvasState.width, canvasState.height]);

  return (
    <div className="relative">
      {/* Collapse/Expand Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 w-8 h-8 rounded-t-lg
                 glass-card border border-b-0 border-[var(--glass-border)]
                 flex items-center justify-center hover:bg-[var(--glass-hover)] transition-colors"
      >
        {isCollapsed ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
      </motion.button>

      {/* Footer Content */}
      <motion.div
        initial={false}
        animate={{ height: isCollapsed ? 0 : 80, opacity: isCollapsed ? 0 : 1 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="h-20 glass-card border-t border-[var(--glass-border)] flex items-center px-4">
          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="p-2 rounded-lg hover:bg-[var(--glass-hover)] transition-colors disabled:opacity-50"
            >
              <FiChevronLeft className="w-4 h-4" />
            </motion.button>

            {/* Page Thumbnails */}
            <div className="flex items-center gap-2 overflow-x-auto max-w-[400px] px-2">
              {pages.map((page, index) => (
                <div key={page.id} className="relative group">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(index)}
                    className={`w-16 h-12 rounded-lg border-2 transition-all flex items-center justify-center
                      ${currentPage === index 
                        ? 'border-primary bg-primary/10' 
                        : 'border-[var(--glass-border)] hover:border-primary/50 bg-[var(--glass-hover)]'
                      }`}
                  >
                    <span className="text-xs font-medium">{index + 1}</span>
                  </motion.button>

                  {/* Page Menu Button */}
                  <button
                    onClick={() => setShowPageMenu(showPageMenu === index ? null : index)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-muted 
                             opacity-0 group-hover:opacity-100 transition-opacity
                             flex items-center justify-center hover:bg-primary hover:text-primary-foreground"
                  >
                    <FiMoreHorizontal className="w-3 h-3" />
                  </button>

                  {/* Page Menu Dropdown */}
                  <AnimatePresence>
                    {showPageMenu === index && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full mb-2 left-0 z-50 glass-card rounded-lg shadow-xl py-1 min-w-[120px]"
                      >
                        <button
                          onClick={() => handleDuplicatePage(index)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--glass-hover)] 
                                   transition-colors flex items-center gap-2"
                        >
                          <FiCopy className="w-4 h-4" />
                          Duplicate
                        </button>
                        {pages.length > 1 && (
                          <button
                            onClick={() => handleDeletePage(index)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-red-500/10 text-red-500
                                     transition-colors flex items-center gap-2"
                          >
                            <FiTrash2 className="w-4 h-4" />
                            Delete
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {/* Add Page Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddPage}
                className="w-16 h-12 rounded-lg border-2 border-dashed border-[var(--glass-border)] 
                         hover:border-primary hover:bg-primary/5 transition-all
                         flex items-center justify-center"
              >
                <FiPlus className="w-5 h-5" />
              </motion.button>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(prev => Math.min(pages.length - 1, prev + 1))}
              disabled={currentPage === pages.length - 1}
              className="p-2 rounded-lg hover:bg-[var(--glass-hover)] transition-colors disabled:opacity-50"
            >
              <FiChevronRight className="w-4 h-4" />
            </motion.button>
          </div>

          <div className="flex-1" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleZoomOut}
              className="p-2 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
              title="Zoom Out"
            >
              <FiZoomOut className="w-4 h-4" />
            </motion.button>

            <input
              type="text"
              value={zoomInput}
              onChange={handleZoomInputChange}
              onBlur={handleZoomInputBlur}
              onKeyDown={handleZoomInputKeyDown}
              className="w-14 px-2 py-1 text-sm font-medium text-center rounded-lg
                       bg-[var(--glass-hover)] border border-[var(--glass-border)]
                       focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <span className="text-sm text-muted-foreground">%</span>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleZoomIn}
              className="p-2 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
              title="Zoom In"
            >
              <FiZoomIn className="w-4 h-4" />
            </motion.button>

            <div className="w-px h-6 bg-[var(--glass-border)] mx-1" />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFitToScreen}
              className="p-2 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
              title="Fit to Screen"
            >
              <FiMaximize2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
