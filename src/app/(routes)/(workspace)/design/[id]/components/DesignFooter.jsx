'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiCopy, FiTrash2, FiChevronLeft, FiChevronRight,
  FiMoreHorizontal, FiZoomIn, FiZoomOut, FiChevronUp, FiChevronDown,
  FiMaximize2
} from 'react-icons/fi';

export default function DesignFooter({ 
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

  // Add new page
  const addPage = () => {
    const newPage = {
      id: `page-${Date.now()}`,
      elements: [],
    };

    setCanvasState(prev => ({
      ...prev,
      pages: [...prev.pages, newPage]
    }));

    // Navigate to new page
    setCurrentPage(pages.length);
  };

  // Duplicate page
  const duplicatePage = (pageIndex) => {
    const pageToDuplicate = pages[pageIndex];
    const duplicatedPage = {
      ...pageToDuplicate,
      id: `page-${Date.now()}`,
      elements: pageToDuplicate.elements.map(el => ({
        ...el,
        id: `${el.id}-copy-${Date.now()}`
      }))
    };

    setCanvasState(prev => ({
      ...prev,
      pages: [
        ...prev.pages.slice(0, pageIndex + 1),
        duplicatedPage,
        ...prev.pages.slice(pageIndex + 1)
      ]
    }));

    setShowPageMenu(null);
  };

  // Delete page
  const deletePage = (pageIndex) => {
    if (pages.length <= 1) return;

    setCanvasState(prev => ({
      ...prev,
      pages: prev.pages.filter((_, idx) => idx !== pageIndex)
    }));

    // Adjust current page if needed
    if (currentPage >= pageIndex && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }

    setShowPageMenu(null);
  };

  // Navigate pages
  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Update zoom input when zoom changes
  useEffect(() => {
    setZoomInput(zoom.toString());
  }, [zoom]);

  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 25));
  };

  const handleZoomInputChange = (e) => {
    const value = e.target.value;
    setZoomInput(value);
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

  // Auto-fit zoom to screen
  const handleFitToScreen = () => {
    if (typeof window !== 'undefined') {
      const container = document.querySelector('.flex-1.overflow-auto');
      if (container) {
        const containerWidth = container.clientWidth - 64; // padding
        const containerHeight = container.clientHeight - 64;
        const scaleX = containerWidth / canvasState.width;
        const scaleY = containerHeight / canvasState.height;
        const scale = Math.min(scaleX, scaleY, 1) * 100;
        setZoom(Math.round(scale));
      }
    }
  };

  // Auto-fit on mount and canvas size change
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
      <div className="flex items-center gap-2 mr-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={goToPrevPage}
          disabled={currentPage === 0}
          className="p-2 rounded-lg hover:bg-[var(--glass-hover)] transition-colors 
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiChevronLeft className="w-4 h-4" />
        </motion.button>

        <span className="text-sm font-medium min-w-[60px] text-center">
          {currentPage + 1} / {pages.length}
        </span>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={goToNextPage}
          disabled={currentPage === pages.length - 1}
          className="p-2 rounded-lg hover:bg-[var(--glass-hover)] transition-colors 
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiChevronRight className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Page Thumbnails */}
      <div className="flex-1 flex items-center gap-2 overflow-x-auto py-2 px-2">
        {pages.map((page, index) => (
          <div key={page.id} className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentPage(index)}
              className={`relative w-16 h-12 rounded-lg border-2 transition-all flex-shrink-0
                         overflow-hidden bg-white
                ${currentPage === index 
                  ? 'border-primary shadow-lg' 
                  : 'border-[var(--glass-border)] hover:border-primary/50'
                }
              `}
            >
              {/* Mini preview of page */}
              <div 
                className="absolute inset-0"
                style={{ backgroundColor: canvasState.backgroundColor }}
              >
                {/* Simplified element preview */}
                {page.elements?.slice(0, 5).map((el, i) => (
                  <div
                    key={el.id}
                    className="absolute"
                    style={{
                      left: `${(el.x / canvasState.width) * 100}%`,
                      top: `${(el.y / canvasState.height) * 100}%`,
                      width: `${(el.width / canvasState.width) * 100}%`,
                      height: `${(el.height / canvasState.height) * 100}%`,
                      backgroundColor: el.type === 'shape' ? el.fill : 
                                      el.type === 'text' ? 'transparent' : '#eee',
                      borderRadius: el.type === 'shape' && el.shape === 'circle' ? '50%' : '2px',
                    }}
                  />
                ))}
              </div>

              {/* Page Number */}
              <span className="absolute bottom-0.5 right-1 text-[8px] font-bold 
                             bg-black/50 text-white px-1 rounded">
                {index + 1}
              </span>
            </motion.button>

            {/* Page Menu Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPageMenu(showPageMenu === index ? null : index);
              }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-background 
                       border border-[var(--glass-border)] flex items-center justify-center
                       opacity-0 hover:opacity-100 transition-opacity"
            >
              <FiMoreHorizontal className="w-3 h-3" />
            </button>

            {/* Page Context Menu */}
            <AnimatePresence>
              {showPageMenu === index && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute bottom-full mb-1 left-0 z-50 glass-card rounded-lg 
                           shadow-xl overflow-hidden min-w-[120px]"
                >
                  <button
                    onClick={() => duplicatePage(index)}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--glass-hover)] 
                             transition-colors flex items-center gap-2"
                  >
                    <FiCopy className="w-3 h-3" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => deletePage(index)}
                    disabled={pages.length <= 1}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-red-500/10 
                             text-red-500 transition-colors flex items-center gap-2
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiTrash2 className="w-3 h-3" />
                    Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {/* Add Page Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={addPage}
          className="w-16 h-12 rounded-lg border-2 border-dashed border-[var(--glass-border)]
                   hover:border-primary/50 hover:bg-primary/5 transition-all flex-shrink-0
                   flex items-center justify-center"
        >
          <FiPlus className="w-5 h-5 text-muted-foreground" />
        </motion.button>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-2 ml-4">
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
