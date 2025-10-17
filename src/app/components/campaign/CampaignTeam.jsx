import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  UserPlus, 
  Mail,
  Building2,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { showSuccess, showError, showConfirm, showLoading, closeSwal } from '@/app/lib/swal';

export default function CampaignTeam({ campaignId }) {
  const [assignments, setAssignments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRoles, setExpandedRoles] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, [campaignId]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/assignments`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to load assignments');

      const result = await response.json();
      setAssignments(result.data);
      
      // Expand all roles by default
      const allRoleIds = new Set(result.data.assignmentsByRole.map(r => r.role.id));
      setExpandedRoles(allRoleIds);
    } catch (error) {
      console.error('Error loading assignments:', error);
      await showError('Load Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (roleId) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId);
    } else {
      newExpanded.add(roleId);
    }
    setExpandedRoles(newExpanded);
  };

  const filteredAssignments = assignments?.assignmentsByRole.filter(roleGroup => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      roleGroup.role.name.toLowerCase().includes(query) ||
      roleGroup.employees.some(emp => 
        emp.employee.fullName.toLowerCase().includes(query) ||
        emp.employee.email.toLowerCase().includes(query)
      )
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team members or roles..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Total Members</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {assignments?.totalAssignments || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Active Roles</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {assignments?.totalRoles || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Avg per Role</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {assignments?.totalRoles ? Math.round(assignments.totalAssignments / assignments.totalRoles) : 0}
          </p>
        </div>
      </div>

      {/* Team Members Grouped by Role */}
      <div className="space-y-3">
        {filteredAssignments?.map((roleGroup) => (
          <motion.div
            key={roleGroup.role.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            {/* Role Header */}
            <button
              onClick={() => toggleRole(roleGroup.role.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedRoles.has(roleGroup.role.id) ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">{roleGroup.role.name}</h3>
                  {roleGroup.role.description && (
                    <p className="text-sm text-gray-500">{roleGroup.role.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {roleGroup.role.parent && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Reports to {roleGroup.role.parent.name}
                  </span>
                )}
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {roleGroup.count} {roleGroup.count === 1 ? 'member' : 'members'}
                </span>
              </div>
            </button>

            {/* Employees List */}
            <AnimatePresence>
              {expandedRoles.has(roleGroup.role.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-gray-200 bg-gray-50"
                >
                  <div className="p-4 space-y-2">
                    {roleGroup.employees.map((assignment) => (
                      <div
                        key={assignment.assignmentId}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                            {assignment.employee.firstName[0]}{assignment.employee.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {assignment.employee.fullName}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Mail className="w-3 h-3" />
                                {assignment.employee.email}
                              </span>
                              {assignment.employee.department && (
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <Building2 className="w-3 h-3" />
                                  {assignment.employee.department.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            assignment.employee.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {assignment.employee.status}
                          </span>
                          <button
                            onClick={() => {
                              // Handle remove
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {filteredAssignments?.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">
              {searchQuery ? 'No members found matching your search' : 'No team members assigned yet'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Add your first member
            </button>
          </div>
        )}
      </div>

      {/* Add Member Modal - Implement separately */}
      {showAddModal && (
        <AddMemberModal
          campaignId={campaignId}
          onClose={() => setShowAddModal(false)}
          onSuccess={loadAssignments}
        />
      )}
    </div>
  );
}

// Add Member Modal Component
function AddMemberModal({ campaignId, onClose, onSuccess }) {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  // Load employees and roles on mount
  useEffect(() => {
    // Implement API calls to fetch available employees and roles
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/assignments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          roleId: selectedRole,
          note: note || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      await showSuccess('Member Added!', 'Team member assigned successfully');
      onSuccess();
      onClose();
    } catch (error) {
      await showError('Assignment Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add Team Member</h2>
          <p className="text-sm text-gray-600 mt-1">Assign an employee to this campaign</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose an employee...</option>
              {/* Map employees */}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a role...</option>
              {/* Map roles */}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Add any notes about this assignment..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
