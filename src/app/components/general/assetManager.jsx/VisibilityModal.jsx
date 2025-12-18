// components/asset-library/VisibilityModal.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Modal from './ui/button';
import Badge from './ui/badge';

export default function VisibilityModal({ asset, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState('COMPANY');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currentVisibility, setCurrentVisibility] = useState([]);

  useEffect(() => {
    fetchData();
  }, [asset.id]);

  const fetchData = async () => {
    try {
      // ✅ Fetch current visibility settings
      const visResponse = await fetch(`/api/assets/${asset.id}/visibility`, {
        credentials: 'include'
      });
      const visData = await visResponse.json();
      
      if (visData.success) {
        setCurrentVisibility(visData.visibility || []);
      }

      // ✅ Fetch roles - Your API returns array directly
      const rolesResponse = await fetch('/api/roles', {
        credentials: 'include'
      });
      const rolesData = await rolesResponse.json();
      
      // Your API returns array directly, not wrapped
      if (Array.isArray(rolesData)) {
        setRoles(rolesData);
      }

      // ✅ Fetch employees - Your API returns { success, employees, campaigns }
      const empResponse = await fetch('/api/employees', {
        credentials: 'include'
      });
      const empData = await empResponse.json();
      
      if (empData.success && empData.employees) {
        setEmployees(empData.employees);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const visibility = [];

      if (scope === 'COMPANY') {
        visibility.push({
          scope: 'COMPANY',
          assetId: asset.id,
          assetType: asset.assetType,
          companyId: asset.companyId
        });
      } else if (scope === 'ROLE') {
        selectedRoles.forEach(roleId => {
          visibility.push({
            scope: 'ROLE',
            roleId,
            assetId: asset.id,
            assetType: asset.assetType,
            companyId: asset.companyId
          });
        });
      } else if (scope === 'EMPLOYEE') {
        selectedEmployees.forEach(employeeId => {
          visibility.push({
            scope: 'EMPLOYEE',
            employeeId,
            assetId: asset.id,
            assetType: asset.assetType,
            companyId: asset.companyId
          });
        });
      }

      const response = await fetch(`/api/assets/${asset.id}/visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          visibility,
          assetType: asset.assetType 
        })
      });

      const result = await response.json();
      
      if (result.success) {
        onSave();
      } else {
        console.error('Failed to save visibility:', result.error);
        alert('Failed to save visibility: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving visibility:', error);
      alert('Failed to save visibility');
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (roleId) => {
    setSelectedRoles(prev =>
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const toggleEmployee = (employeeId) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId) ? prev.filter(id => id !== employeeId) : [...prev, employeeId]
    );
  };

  return (
    <Modal onClose={onClose} title="Manage Asset Visibility">
      <div className="space-y-6">
        {/* Current Visibility */}
        {currentVisibility.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Current Visibility</h4>
            <div className="flex flex-wrap gap-2">
              {currentVisibility.map((vis, idx) => (
                <Badge key={idx} variant="blue">
                  {vis.scope === 'COMPANY' && 'Entire Company'}
                  {vis.scope === 'ROLE' && vis.role?.name}
                  {vis.scope === 'EMPLOYEE' && `${vis.employee?.firstName} ${vis.employee?.lastName}`}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Scope Selection */}
        <div>
          <label className="block font-medium text-slate-900 mb-3">Who can access this asset?</label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="radio"
                checked={scope === 'COMPANY'}
                onChange={() => setScope('COMPANY')}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <div className="font-medium">Entire Company</div>
                <div className="text-sm text-slate-600">All employees can access this asset</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="radio"
                checked={scope === 'ROLE'}
                onChange={() => setScope('ROLE')}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <div className="font-medium">Specific Roles</div>
                <div className="text-sm text-slate-600">Only selected roles can access</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="radio"
                checked={scope === 'EMPLOYEE'}
                onChange={() => setScope('EMPLOYEE')}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <div className="font-medium">Specific Employees</div>
                <div className="text-sm text-slate-600">Only selected employees can access</div>
              </div>
            </label>
          </div>
        </div>

        {/* Role Selection */}
        {scope === 'ROLE' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <label className="block font-medium text-slate-900 mb-3">Select Roles</label>
            <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
              {roles.length === 0 ? (
                <div className="text-sm text-slate-500">No roles available</div>
              ) : (
                roles.map((role) => (
                  <label key={role.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <div className="font-medium">{role.name}</div>
                      {role.description && (
                        <div className="text-xs text-slate-500">{role.description}</div>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Employee Selection */}
        {scope === 'EMPLOYEE' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <label className="block font-medium text-slate-900 mb-3">Select Employees</label>
            <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
              {employees.length === 0 ? (
                <div className="text-sm text-slate-500">No employees available</div>
              ) : (
                employees.map((employee) => (
                  <label key={employee.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => toggleEmployee(employee.id)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="text-xs text-slate-500">{employee.email}</div>
                      {employee.role && (
                        <div className="text-xs text-slate-400">{employee.role.name}</div>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
