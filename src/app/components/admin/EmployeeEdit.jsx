'use client';

import { useState, useEffect } from 'react';
import { FiX, FiSave, FiUser } from 'react-icons/fi';
import Swal from 'sweetalert2';

export default function EditEmployeeModal({ isOpen, onClose, employee, onSuccess }) {
  const [form, setForm] = useState(employee || {});
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !employee) return;
    setForm(employee);
    (async () => {
      const res = await fetch('/api/admin/roles');
      const data = await res.json();
      setRoles(data.data || []);
    })();
  }, [isOpen, employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Update failed');
      Swal.fire('✅ Updated!', 'Employee details updated successfully.', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire('❌ Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 backdrop-blur-2xl bg-black/30 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-2xl relative animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FiUser className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Edit Employee</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="text"
              name="firstName"
              value={form.firstName || ''}
              onChange={handleChange}
              placeholder="First Name"
              className="px-4 py-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="lastName"
              value={form.lastName || ''}
              onChange={handleChange}
              placeholder="Last Name"
              className="px-4 py-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
            />
            <select
              name="roleId"
              value={form.roleId || ''}
              onChange={handleChange}
              className="col-span-2 px-4 py-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <select
              name="status"
              value={form.status || 'ACTIVE'}
              onChange={handleChange}
              className="col-span-2 px-4 py-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            {/* iPhone-style Admin Toggle */}
            <div className="col-span-2 flex items-center justify-between bg-gray-50 px-4 py-3 border rounded-lg">
              <label className="text-gray-700 font-medium">Admin Access</label>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, is_admin: !prev.is_admin }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.is_admin ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.is_admin ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
