'use client';

import { motion } from 'framer-motion';
import { HiSparkles } from 'react-icons/hi';
import { FiEdit3, FiUpload } from 'react-icons/fi';
import AIPanel from './panels/AIPanel';
import EditPanel from './panels/EditPanel';
import UploadPanel from './panels/UploadPanel';

const navItems = [
  { id: 'ai', label: 'AI', icon: HiSparkles },
  { id: 'edit', label: 'Edit', icon: FiEdit3 },
  { id: 'upload', label: 'Upload', icon: FiUpload },
];

export default function VideoSidebar({
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
  const renderPanel = () => {
    switch (activeTab) {
      case 'ai':
        return (
          <AIPanel 
            canvasState={canvasState}
            setCanvasState={setCanvasState}
            addElement={addElement}
            currentPage={currentPage}
          />
        );
      case 'edit':
        return (
          <EditPanel 
            canvasState={canvasState}
            setCanvasState={setCanvasState}
            selectedElement={selectedElement}
            setSelectedElement={setSelectedElement}
            addElement={addElement}
            updateElement={updateElement}
            deleteElement={deleteElement}
            currentPage={currentPage}
          />
        );
      case 'upload':
        return (
          <UploadPanel 
            addElement={addElement}
            currentPage={currentPage}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      {/* Nav Bar */}
      <div className="w-16 glass-card border-r border-[var(--glass-border)] flex flex-col items-center py-4 gap-2">
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(item.id)}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all
              ${activeTab === item.id 
                ? 'bg-primary text-primary-foreground shadow-lg' 
                : 'hover:bg-[var(--glass-hover)] text-muted-foreground hover:text-foreground'
              }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Panel Content */}
      <div className="w-80 glass-card border-r border-[var(--glass-border)] overflow-hidden">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full overflow-y-auto"
        >
          {renderPanel()}
        </motion.div>
      </div>
    </div>
  );
}
