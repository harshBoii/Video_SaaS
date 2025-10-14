import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Users, Search, GitBranch, Trash2 } from 'lucide-react';
import { roleApi } from '@/app/lib/roleApi';
import { showSuccess, showError, showConfirm, showLoading, closeSwal } from '@/app/lib/swal';

const RoleDetailsDrawer = ({ roleId, onClose, allRoles, onHierarchyChange }) => {
  const [roleDetails, setRoleDetails] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingParent, setUpdatingParent] = useState(false);

  useEffect(() => {
    if (roleId) {
      loadRoleDetails();
    }
  }, [roleId]);

  const loadRoleDetails = async () => {
    setLoading(true);
    try {
      const data = await roleApi.getRoleDetails(roleId);
      setRoleDetails(data);
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Failed to load role details:', error);
      await showError('Load Failed', error.message || 'Failed to load role details');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const results = await roleApi.searchEmployees(roleId, query);
        setEmployees(results);
      } catch (error) {
        console.error('Search failed:', error);
      }
    } else {
      setEmployees(roleDetails?.employees || []);
    }
  };

  const handleParentChange = async (newParentId) => {
    const newParentRole = allRoles.find(r => r.id === newParentId);
    const currentName = roleDetails?.name;
    const parentName = newParentRole?.name || 'Top Level';

    const result = await showConfirm(
      'Change Hierarchy?',
      newParentId 
        ? `Set "${parentName}" as parent of "${currentName}"?\n\nThis means "${currentName}" will report to "${parentName}".`
        : `Remove parent and make "${currentName}" a top-level role?`,
      'Yes, Update',
      'Cancel'
    );

    if (!result.isConfirmed) return;

    setUpdatingParent(true);
    showLoading('Updating hierarchy...', 'Please wait while we save your changes');
    
    try {
      if (newParentId) {
        await roleApi.updateRoleParent(roleId, newParentId);
      } else {
        await roleApi.removeRoleParent(roleId);
      }
      
      await loadRoleDetails();
      
      if (onHierarchyChange) {
        onHierarchyChange();
      }
      
      closeSwal();
      await showSuccess(
        'Hierarchy Updated!',
        newParentId 
          ? `"${currentName}" now reports to "${parentName}"`
          : `"${currentName}" is now a top-level role`
      );
    } catch (error) {
      closeSwal();
      await showError(
        'Update Failed',
        error.message || 'Failed to update hierarchy'
      );
    } finally {
      setUpdatingParent(false);
    }
  };

  const handleRemoveParent = async () => {
    const currentName = roleDetails?.name;
    const parentName = roleDetails?.parent?.name;

    const result = await showConfirm(
      'Remove Parent?',
      `Remove "${parentName}" as parent of "${currentName}"?\n\nThis will make "${currentName}" a top-level role.`,
      'Yes, Remove',
      'Cancel'
    );

    if (!result.isConfirmed) return;

    setUpdatingParent(true);
    showLoading('Removing parent...', 'Please wait');
    
    try {
      await roleApi.removeRoleParent(roleId);
      await loadRoleDetails();
      
      if (onHierarchyChange) {
        onHierarchyChange();
      }
      
      closeSwal();
      await showSuccess(
        'Parent Removed!',
        `"${currentName}" is now a top-level role`
      );
    } catch (error) {
      closeSwal();
      await showError(
        'Removal Failed',
        error.message || 'Failed to remove parent'
      );
    } finally {
      setUpdatingParent(false);
    }
  };

  if (!roleId) return null;

  // Filter out current role and its descendants from parent options
  const availableParents = allRoles?.filter(role => {
    if (role.id === roleId) return false;
    return true;
  }) || [];

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/20 z-40"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-[500px] bg-white shadow-2xl z-50 overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-800">Role Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {loading ? (
          <div className="p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Role Information */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Role Information
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Name</label>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {roleDetails?.name}
                  </p>
                </div>
                {roleDetails?.description && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Description</label>
                    <p className="text-sm text-gray-700 mt-1">
                      {roleDetails.description}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Hierarchy Management */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Hierarchy
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                {/* Current Parent */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-2 block">
                    Current Parent
                  </label>
                  {roleDetails?.parent ? (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <GitBranch className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {roleDetails.parent.name}
                          </p>
                          <p className="text-xs text-gray-500">Parent Role</p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveParent}
                        disabled={updatingParent}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-lg border border-dashed border-gray-300">
                      <p className="text-sm text-gray-500 italic text-center">
                        No parent (Top level role)
                      </p>
                    </div>
                  )}
                </div>

                {/* Change Parent Dropdown */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-2 block">
                    Change Parent Role
                  </label>
                  <select
                    onChange={(e) => handleParentChange(e.target.value)}
                    disabled={updatingParent}
                    value={roleDetails?.parent?.id || ''}
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">-- No Parent (Top Level) --</option>
                    {availableParents.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  {updatingParent && (
                    <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                      Updating hierarchy...
                    </p>
                  )}
                </div>

                {/* Child Roles */}
                {roleDetails?.children && roleDetails.children.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-2 block">
                      Child Roles ({roleDetails.children.length})
                    </label>
                    <div className="space-y-2">
                      {roleDetails.children.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                            <GitBranch className="w-3.5 h-3.5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">{child.name}</p>
                            <p className="text-xs text-gray-500">
                              {child.employeeCount || 0} employee{child.employeeCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Permissions */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Permissions ({roleDetails?.permissions?.length || 0})
              </h3>
              
              {roleDetails?.permissionsByGroup && Object.keys(roleDetails.permissionsByGroup).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(roleDetails.permissionsByGroup).map(([group, perms]) => (
                    <div key={group}>
                      <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        {group}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {perms.map((permission) => (
                          <span
                            key={permission.id}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200 font-medium"
                            title={permission.description}
                          >
                            {permission.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-sm text-gray-500 italic text-center">
                    No permissions assigned to this role
                  </p>
                </div>
              )}
            </section>

            {/* Employees List */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Employees ({employees.length})
              </h3>

              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search employees by name..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Employees */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                      {employee.firstName?.[0]}{employee.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{employee.email}</p>
                      {employee.department && (
                        <p className="text-xs text-gray-400">{employee.department.name}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      employee.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-700' 
                        : employee.status === 'INACTIVE'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {employee.status}
                    </span>
                  </div>
                ))}
                {employees.length === 0 && (
                  <div className="p-8 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 italic">
                      {searchQuery ? 'No employees found matching your search' : 'No employees assigned to this role'}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default RoleDetailsDrawer;
