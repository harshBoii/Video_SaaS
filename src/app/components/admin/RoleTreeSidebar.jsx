import React from 'react';
import { Search, Building2, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import useRoleStore from '@/app/stores/roleStore';

const RoleTreeSidebar = () => {
  const { 
    selectedCompany, 
    searchQuery, 
    setSearchQuery, 
    filters, 
    updateFilters 
  } = useRoleStore();

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="w-80 bg-white border-r border-gray-200 p-6 flex flex-col gap-6 h-full overflow-y-auto"
    >
      {/* Company Switcher */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Company
        </label>
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <Building2 className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-800">
            {selectedCompany?.name || 'Select Company'}
          </span>
        </div>
      </div>

      {/* Search */}
      <div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roles or employees..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Filters */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-600" />
          <h3 className="font-medium text-gray-800">Filters</h3>
        </div>
        
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.showActiveOnly}
              onChange={(e) => updateFilters({ showActiveOnly: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900">
              Show only active roles
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.showEmptyRoles}
              onChange={(e) => updateFilters({ showEmptyRoles: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900">
              Show empty roles (no employees)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.showInheritance}
              onChange={(e) => updateFilters({ showInheritance: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900">
              Show permission inheritance
            </span>
          </label>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-auto pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">12</div>
            <div className="text-xs text-blue-600">Total Roles</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">45</div>
            <div className="text-xs text-green-600">Employees</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RoleTreeSidebar;
