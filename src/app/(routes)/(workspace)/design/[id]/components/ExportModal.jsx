'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiDownload, FiImage, FiFile } from 'react-icons/fi';
import html2canvas from 'html2canvas';

const fileTypes = [
  { id: 'png', label: 'PNG', icon: FiImage, badge: 'Suggested', description: 'Best for web and social media' },
  { id: 'jpg', label: 'JPG', icon: FiImage, description: 'Smaller file size' },
  { id: 'svg', label: 'SVG', icon: FiFile, description: 'Vector format' },
  { id: 'pdf', label: 'PDF', icon: FiFile, description: 'Print ready' },
];

export default function ExportModal({ 
  isOpen, 
  onClose, 
  canvasState,
  projectName 
}) {
  const [selectedType, setSelectedType] = useState('png');
  const [sizeMultiplier, setSizeMultiplier] = useState(1);
  const [limitFileSize, setLimitFileSize] = useState(false);
  const [compressFile, setCompressFile] = useState(false);
  const [transparentBg, setTransparentBg] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const exportWidth = Math.round(canvasState.width * sizeMultiplier);
  const exportHeight = Math.round(canvasState.height * sizeMultiplier);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const canvasElement = document.querySelector('.canvas-bg')?.parentElement;
      if (!canvasElement) {
        throw new Error('Canvas not found');
      }

      // Use html2canvas to capture the canvas
      const canvas = await html2canvas(canvasElement, {
        backgroundColor: transparentBg ? null : canvasState.backgroundColor,
        scale: sizeMultiplier,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      // Convert to blob
      canvas.toBlob((blob) => {
        if (!blob) return;

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${projectName.replace(/\s+/g, '_')}.${selectedType}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setIsExporting(false);
        onClose();
      }, `image/${selectedType}`, compressFile ? 0.7 : 0.95);

    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md glass-card rounded-2xl shadow-2xl p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Download</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* File Type */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-3 block">File type</label>
            <div className="space-y-2">
              {fileTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`w-full p-3 rounded-xl border-2 transition-all text-left flex items-center gap-3
                    ${selectedType === type.id 
                      ? 'border-primary bg-primary/10' 
                      : 'border-[var(--glass-border)] hover:border-primary/50'
                    }`}
                >
                  <type.icon className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{type.label}</span>
                      {type.badge && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                          {type.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                  {selectedType === type.id && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Size ×</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={sizeMultiplier}
                  onChange={(e) => setSizeMultiplier(Math.max(0.5, Math.min(3, parseFloat(e.target.value) || 1)))}
                  step="0.5"
                  min="0.5"
                  max="3"
                  className="w-16 px-2 py-1 text-sm text-center rounded-lg bg-[var(--glass-hover)] 
                           border border-[var(--glass-border)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <span className="text-sm text-primary font-medium">👑</span>
              </div>
            </div>
            
            <input
              type="range"
              value={sizeMultiplier}
              onChange={(e) => setSizeMultiplier(parseFloat(e.target.value))}
              min="0.5"
              max="3"
              step="0.5"
              className="w-full accent-primary"
            />
            
            <div className="text-xs text-muted-foreground mt-2">
              {exportWidth} × {exportHeight} px
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={limitFileSize}
                onChange={(e) => setLimitFileSize(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--glass-border)] text-primary 
                         focus:ring-2 focus:ring-primary/50"
              />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm">Limit file size</span>
                <span className="text-sm text-primary">👑</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={compressFile}
                onChange={(e) => setCompressFile(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--glass-border)] text-primary 
                         focus:ring-2 focus:ring-primary/50"
              />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm">Compress file (lower quality)</span>
                <span className="text-sm text-primary">👑</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={transparentBg}
                onChange={(e) => setTransparentBg(e.target.checked)}
                disabled={selectedType === 'jpg'}
                className="w-4 h-4 rounded border-[var(--glass-border)] text-primary 
                         focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm">Transparent background</span>
                <span className="text-sm text-primary">👑</span>
              </div>
            </label>
          </div>

          {/* Empty Design Warning */}
          {canvasState.pages[0]?.elements?.length === 0 && (
            <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Your design is empty. Try adding some elements first before downloading.
              </p>
            </div>
          )}

          {/* Download Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            disabled={isExporting || canvasState.pages[0]?.elements?.length === 0}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-violet-500 
                     text-primary-foreground font-semibold shadow-lg 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all
                     flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FiDownload className="w-5 h-5" />
                Download
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
