import React from 'react';
import { Plus, Maximize2, Minimize2, Grid3x3, Network } from 'lucide-react';
import useRoleStore from '@/app/stores/roleStore';

const TopBar = () => {
  const { 
    selectedCompany, 
    expandAll, 
    collapseAll, 
    openModal, 
    viewMode, 
    setViewMode 
  } = useRoleStore();

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      {/* Left: Company Info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
          {selectedCompany?.name?.[0] || 'C'}
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-800">
            {selectedCompany?.name || 'Company'} - Role Hierarchy
          </h1>
          <p className="text-xs text-gray-500">Manage organizational structure</p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* View Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'tree'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Network className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
        </div>

        {/* Expand/Collapse */}
        <button
          onClick={expandAll}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
          Expand All
        </button>
        <button
          onClick={collapseAll}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Minimize2 className="w-4 h-4" />
          Collapse All
        </button>

        {/* Add New Role */}
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add New Role
        </button>
      </div>
    </div>
  );
};

export default TopBar;
