'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import DesignCanvas from './components/DesignCanvas';
import DesignHeader from './components/DesignHeader';
import DesignSidebar from './components/DesignSidebar';
import DesignFooter from './components/DesignFooter';
import ExportModal from './components/ExportModal';

// Initial canvas state structure
const createInitialState = () => ({
  width: 1080,
  height: 1080,
  backgroundColor: '#ffffff',
  pages: [
    {
      id: 'page-1',
      elements: []
    }
  ]
});

export default function ImageDesignCanvas() {
  const { id } = useParams();
  
  // Main canvas state - stored as JSON
  const [canvasState, setCanvasState] = useState(createInitialState);
  const [selectedElement, setSelectedElement] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [activeTab, setActiveTab] = useState('home');
  const [projectName, setProjectName] = useState('Untitled Design');
  const [showExportModal, setShowExportModal] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    if (id) {
      const savedState = localStorage.getItem(`design-${id}`);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          setCanvasState(parsed.canvasState || createInitialState());
          setProjectName(parsed.projectName || 'Untitled Design');
        } catch (e) {
          console.error('Failed to load design state:', e);
        }
      }
    }
  }, [id]);

  // Save state to localStorage on change
  useEffect(() => {
    if (id) {
      const stateToSave = {
        canvasState,
        projectName,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(`design-${id}`, JSON.stringify(stateToSave));
    }
  }, [id, canvasState, projectName]);

  // Add element to current page
  const addElement = useCallback((element) => {
    setCanvasState(prev => ({
      ...prev,
      pages: prev.pages.map((page, idx) =>
        idx === currentPage
          ? { ...page, elements: [...page.elements, element] }
          : page
      )
    }));
  }, [currentPage]);

  // Update element
  const updateElement = useCallback((elementId, updates) => {
    setCanvasState(prev => ({
      ...prev,
      pages: prev.pages.map((page, idx) =>
        idx === currentPage
          ? {
              ...page,
              elements: page.elements.map(el =>
                el.id === elementId ? { ...el, ...updates } : el
              )
            }
          : page
      )
    }));

    // Update selected element reference if it's the one being updated
    setSelectedElement(prev => {
      if (prev?.id === elementId) {
        return { ...prev, element: { ...prev.element, ...updates } };
      }
      return prev;
    });
  }, [currentPage]);

  // Delete element
  const deleteElement = useCallback((elementId) => {
    setCanvasState(prev => ({
      ...prev,
      pages: prev.pages.map((page, idx) =>
        idx === currentPage
          ? { ...page, elements: page.elements.filter(el => el.id !== elementId) }
          : page
      )
    }));
  }, [currentPage]);

  // Export canvas state as JSON
  const exportAsJSON = () => {
    const dataStr = JSON.stringify(canvasState, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${projectName.replace(/\s+/g, '_')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <DesignHeader 
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        selectedElement={selectedElement}
        updateElement={updateElement}
        projectName={projectName}
        setProjectName={setProjectName}
        onExport={() => setShowExportModal(true)}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <DesignSidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          canvasState={canvasState}
          setCanvasState={setCanvasState}
          selectedElement={selectedElement}
          setSelectedElement={setSelectedElement}
          addElement={addElement}
          updateElement={updateElement}
          deleteElement={deleteElement}
          currentPage={currentPage}
        />

        {/* Canvas Area */}
        <DesignCanvas 
          canvasState={canvasState}
          setCanvasState={setCanvasState}
          selectedElement={selectedElement}
          setSelectedElement={setSelectedElement}
          currentPage={currentPage}
          zoom={zoom}
        />
      </div>

      {/* Footer */}
      <DesignFooter 
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        zoom={zoom}
        setZoom={setZoom}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        canvasState={canvasState}
        projectName={projectName}
      />
    </div>
  );
}
