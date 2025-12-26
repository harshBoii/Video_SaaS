'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiEdit2, FiLayers, FiUpload } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import HomePanel from './panels/HomePanel';
import EditPanel from './panels/EditPanel';
import LayersPanel from './panels/LayersPanel';
import UploadPanel from './panels/UploadPanel';

const navItems = [
  { id: 'home', icon: HiSparkles, label: 'AI' },
  { id: 'edit', icon: FiEdit2, label: 'Edit' },
  { id: 'layers', icon: FiLayers, label: 'Layers' },
  { id: 'upload', icon: FiUpload, label: 'Upload' },
];

export default function DesignSidebar({ 
  activeTab, 
  setActiveTab,
  canvasState,
  setCanvasState,
  selectedElement,
  setSelectedElement,
  addElement,
  updateElement,
  deleteElement,
  currentPage
}) {
  return (
    <div className="flex h-full">
      {/* Icon Navigation */}
      <div className="w-16 glass-card border-r border-[var(--glass-border)] flex flex-col items-center py-4">
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(item.id)}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 mb-2
                       transition-all duration-200
              ${activeTab === item.id 
                ? 'bg-primary text-primary-foreground shadow-lg' 
                : 'hover:bg-[var(--glass-hover)] text-muted-foreground hover:text-foreground'
              }
            `}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Panel Content */}
      <div className="w-72 glass-card border-r border-[var(--glass-border)] overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <HomePanel 
                canvasState={canvasState}
                setCanvasState={setCanvasState}
                addElement={addElement}
                currentPage={currentPage}
              />
            </motion.div>
          )}

          {activeTab === 'edit' && (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <EditPanel 
                canvasState={canvasState}
                setCanvasState={setCanvasState}
                selectedElement={selectedElement}
                addElement={addElement}
                updateElement={updateElement}
                currentPage={currentPage}
              />
            </motion.div>
          )}

          {activeTab === 'layers' && (
            <motion.div
              key="layers"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <LayersPanel 
                canvasState={canvasState}
                setCanvasState={setCanvasState}
                selectedElement={selectedElement}
                setSelectedElement={setSelectedElement}
                deleteElement={deleteElement}
                currentPage={currentPage}
              />
            </motion.div>
          )}

          {activeTab === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <UploadPanel 
                addElement={addElement}
                currentPage={currentPage}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
