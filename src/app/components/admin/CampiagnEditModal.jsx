'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUser, FiUsers, FiLoader, FiAlertCircle } from 'react-icons/fi';

export default function CampaignEditModal({ isOpen, onClose, campaign, onSuccess, companyId }) {
  const [form, setForm] = useState({
    name: '',
    adminId: '',
    teamId: '',
  });
  const [admins, setAdmins] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Load admins, teams, and populate form when modal opens
  useEffect(() => {
    if (isOpen && campaign) {
      loadFormData();
    }
  }, [isOpen, campaign]);

  const loadFormData = async () => {
    setLoadingData(true);
    setError(null);

    try {
      // Fetch admins and teams in parallel
      const [adminsRes, teamsRes] = await Promise.all([
        fetch(`/api/admin/employees?companyId=${companyId}&status=ACTIVE`),
        fetch(`/api/admin/teams?companyId=${companyId}`),
      ]);

      if (!adminsRes.ok || !teamsRes.ok) {
        throw new Error('Failed to load form data');
      }

      const [adminsData, teamsData] = await Promise.all([
        adminsRes.json(),
        teamsRes.json(),
      ]);

      setAdmins(adminsData.data || []);
      setTeams(teamsData.data || []);

      // Populate form with campaign data
      setForm({
        name: campaign.name || '',
        adminId: campaign.adminId || '',
        teamId: campaign.teamId || '',
      });
    } catch (err) {
      console.error('Error loading form data:', err);
      setError('Failed to load form data. Please try again.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Clear field-specific error when user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    setError(null);
  };

  const validateForm = () => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = 'Campaign name is required';
    } else if (form.name.trim().length < 3) {
      errors.name = 'Campaign name must be at least 3 characters';
    }

    if (!form.adminId) {
      errors.adminId = 'Please select an admin';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          adminId: form.adminId,
          teamId: form.teamId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update campaign');
      }

      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Error updating campaign:', err);
      setError(err.message || 'Failed to update campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setForm({ name: '', adminId: '', teamId: '' });
      setError(null);
      setFieldErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <FiUser className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Edit Campaign</h2>
                <p className="text-blue-100 text-sm">Update campaign details</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-white/80 hover:text-white transition-colors disabled:opacity-50 p-1"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {loadingData ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FiLoader className="text-blue-600 animate-spin mb-3" size={32} />
                <p className="text-gray-600">Loading campaign data...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Alert */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
                  >
                    <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900">Error</p>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </motion.div>
                )}

                {/* Campaign Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Campaign Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g., Summer Sale 2025"
                    disabled={loading}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.name
                        ? 'border-red-300 bg-red-50 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                    } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                  />
                  {fieldErrors.name && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <FiAlertCircle size={14} />
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                {/* Admin Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Campaign Admin <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <FiUser size={18} />
                    </div>
                    <select
                      name="adminId"
                      value={form.adminId}
                      onChange={handleChange}
                      disabled={loading}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all appearance-none bg-white ${
                        fieldErrors.adminId
                          ? 'border-red-300 bg-red-50 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                      } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    >
                      <option value="">Select an admin...</option>
                      {admins.map((admin) => (
                        <option key={admin.id} value={admin.id}>
                          {admin.firstName} {admin.lastName} ({admin.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  {fieldErrors.adminId && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <FiAlertCircle size={14} />
                      {fieldErrors.adminId}
                    </p>
                  )}
                </div>

                {/* Team Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Team <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <FiUsers size={18} />
                    </div>
                    <select
                      name="teamId"
                      value={form.teamId}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">No team</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Changes will be saved immediately and reflected across the system.
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          {!loadingData && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading || loadingData}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[120px] justify-center"
              >
                {loading ? (
                  <>
                    <FiLoader className="animate-spin" size={18} />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
