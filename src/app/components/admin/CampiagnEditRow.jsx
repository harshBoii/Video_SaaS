'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiEdit3, FiTrash2, FiUser, FiUsers, FiCalendar, FiClock, FiMoreVertical } from 'react-icons/fi';
import CampaignEditModal from './CampiagnEditModal';

export default function EditCampaignRow({ campaign, onUpdated, index, companyId }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${campaign.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete campaign');
      }

      onUpdated();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Failed to delete campaign. Please try again.');
    }
  };

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ delay: index * 0.02 }}
        className="group hover:bg-blue-50/30 transition-colors duration-150 border-b border-gray-100 last:border-0"
      >
        {/* Campaign Name */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {campaign.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {campaign.name}
              </p>
              <p className="text-xs text-gray-500">ID: {campaign.id.slice(0, 8)}...</p>
            </div>
          </div>
        </td>

        {/* Admin */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FiUser className="text-blue-600" size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {campaign.admin?.firstName} {campaign.admin?.lastName}
              </p>
              {campaign.admin?.email && (
                <p className="text-xs text-gray-500 truncate">{campaign.admin.email}</p>
              )}
            </div>
          </div>
        </td>

        {/* Team */}
        <td className="px-6 py-4">
          {campaign.team ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
              <FiUsers size={14} />
              <span className="text-sm font-medium">{campaign.team.name}</span>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 bg-gray-50 rounded-full border border-gray-200">
              <FiUsers size={12} />
              <span>No team</span>
            </span>
          )}
        </td>

        {/* Created Date */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiCalendar size={14} className="text-gray-400" />
            <span>{formatDate(campaign.createdAt)}</span>
          </div>
        </td>

        {/* Updated Date */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiClock size={14} className="text-gray-400" />
            <span className="font-medium">{formatDateTime(campaign.updatedAt)}</span>
          </div>
        </td>

        {/* Actions */}
        <td className="px-6 py-4">
          <div className="flex items-center justify-end gap-2">
            {/* Quick Edit Button */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 shadow-sm hover:shadow"
              title="Edit campaign"
            >
              <FiEdit3 size={14} />
              <span>Edit</span>
            </button>

            {/* More Actions Dropdown */}
            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="More actions"
              >
                <FiMoreVertical size={18} className="text-gray-600" />
              </button>

              {/* Dropdown Menu */}
              {showActions && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowActions(false)}
                  />
                  
                  {/* Menu */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
                  >
                    <button
                      onClick={() => {
                        setIsEditModalOpen(true);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2 transition-colors"
                    >
                      <FiEdit3 size={14} />
                      Edit Campaign
                    </button>
                    <button
                      onClick={() => {
                        handleDelete();
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <FiTrash2 size={14} />
                      Delete Campaign
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </td>
      </motion.tr>

      {/* Edit Modal */}
      <CampaignEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        campaign={campaign}
        onSuccess={onUpdated}
        companyId={companyId}
      />
    </>
  );
}
