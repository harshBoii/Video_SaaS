import React, { useState } from 'react';
import { 
  Settings as SettingsIcon,
  Save,
  Trash2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { showSuccess, showError, showConfirm, showLoading, closeSwal } from '@/lib/swal';

export default function CampaignSettings({ campaign, onUpdate }) {
  const [formData, setFormData] = useState({
    name: campaign.name,
    description: campaign.description || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    showLoading('Saving changes...', 'Please wait');

    try {
      // Implement update API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      closeSwal();
      await showSuccess('Settings Saved!', 'Campaign settings updated successfully');
      onUpdate();
    } catch (error) {
      closeSwal();
      await showError('Save Failed', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    const result = await showConfirm(
      'Archive Campaign?',
      'This will move the campaign to archived status. You can restore it later.',
      'Yes, Archive',
      'Cancel'
    );

    if (result.isConfirmed) {
      // Implement archive logic
      await showSuccess('Campaign Archived', 'The campaign has been archived');
    }
  };

  const handleDelete = async () => {
    const result = await showConfirm(
      'Delete Campaign?',
      'This action cannot be undone. All data associated with this campaign will be permanently deleted.',
      'Yes, Delete',
      'Cancel'
    );

    if (result.isConfirmed) {
      // Implement delete logic
    }
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            General Settings
          </h3>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Add a description for this campaign..."
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Campaign Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Campaign ID</p>
            <p className="font-mono text-sm text-gray-900">{campaign.id}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Created</p>
            <p className="text-sm text-gray-900">
              {new Date(campaign.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Last Updated</p>
            <p className="text-sm text-gray-900">
              {new Date(campaign.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Company</p>
            <p className="text-sm text-gray-900">{campaign.company.name}</p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border-2 border-red-200 overflow-hidden">
        <div className="p-6 bg-red-50 border-b border-red-200">
          <h3 className="text-lg font-semibold text-red-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </h3>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Archive Campaign</h4>
              <p className="text-sm text-gray-600">
                Move this campaign to archived status. Can be restored later.
              </p>
            </div>
            <button
              onClick={handleArchive}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Archive
            </button>
          </div>

          <div className="flex items-start justify-between p-4 border-2 border-red-200 rounded-lg bg-red-50">
            <div>
              <h4 className="font-semibold text-red-900 mb-1">Delete Campaign</h4>
              <p className="text-sm text-red-700">
                Permanently delete this campaign and all associated data. This cannot be undone.
              </p>
            </div>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
