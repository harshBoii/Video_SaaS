'use client';
import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiUserPlus, FiMail, FiBriefcase } from 'react-icons/fi';
import Swal from 'sweetalert2';

const AddEmployeeModal = ({ isOpen, onClose, onSuccess, companyId }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    roleId: '',
  });
  const [roles, setRoles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🧠 Fetch roles for the dropdown when modal opens
  useEffect(() => {
    if (isOpen) {
      fetch('/api/admin/roles')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setRoles(data.data);
        })
        .catch(() => Swal.fire('Error', 'Failed to fetch roles', 'error'));
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const body = { ...formData, companyId };
      const response = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to create employee.');
      }

      Swal.fire('✅ Success!', 'New employee has been added successfully.', 'success');
      onSuccess?.();
      onClose();
      setFormData({ firstName: '', lastName: '', email: '', password: '', roleId: '' });
    } catch (error) {
      Swal.fire('❌ Error!', error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 backdrop-blur-2xl bg-black/40 flex justify-center items-center z-50 p-4 font-sans"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-2xl relative animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FiUserPlus className="text-blue-600" size={24} />
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Add New Employee</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="block">
              <span className="block text-sm font-medium text-gray-600 mb-2">
                First Name*
              </span>
              <input
                type="text"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-600 mb-2">
                Last Name*
              </span>
              <input
                type="text"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </label>
          </div>

          {/* Email & Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="block">
              <span className="block text-sm font-medium text-gray-600 mb-2">
                Email*
              </span>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-600 mb-2">
                Password*
              </span>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </label>
          </div>

          {/* Role Dropdown */}
          <label className="block">
            <span className="block text-sm font-medium text-gray-600 mb-2">Assign Role*</span>
            <div className="relative">
              <FiBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                name="roleId"
                required
                value={formData.roleId}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              className="px-6 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSave /> {isSubmitting ? 'Creating...' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
