'use client';

import { useEffect, useState } from 'react';
import { FiX, FiSave, FiTarget, FiUser } from 'react-icons/fi';
import Swal from 'sweetalert2';

export default function AddCampaignModal({ isOpen, onClose, onSuccess, companyId }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    adminId: '',
    teamId: '',
    budget: '',
    status: 'ACTIVE',
  });
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const res = await fetch(`/api/admin/employees?companyId=${companyId}&role=ADMIN&is_admin=true`);
      const data = await res.json();
      setAdmins(data.data || []);
    })();
  }, [isOpen, companyId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, companyId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to create campaign');

      Swal.fire('✅ Success', 'New campaign created!', 'success');
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
    <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl relative animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FiTarget className="text-purple-600" size={24} />
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Add New Campaign</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input name="name" placeholder="Campaign Name*" required onChange={handleChange} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500" />
            <input
              name="budget"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Budget (optional)"
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                e.target.value = value;
                handleChange(e);
            }}className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"/>
            <textarea name="description" placeholder="Description" rows="3" onChange={handleChange} className="col-span-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="block">
              <span className="block text-sm font-medium text-gray-600 mb-2">Assign Admin*</span>
            <select
              name="adminId"
              required
              disabled={admins.length === 0}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500"
            >
              <option value="">
                {admins.length === 0 ? 'Loading admins...' : 'Select Admin'}
              </option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.firstName} {a.lastName} 
                </option>
              ))}
            </select>
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-600 mb-2">Status</span>
              <select name="status" onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500">
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </label>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 mt-6">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50">
              <FiSave /> {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
