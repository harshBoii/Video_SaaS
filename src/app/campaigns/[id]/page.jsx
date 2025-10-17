"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  GitBranch, 
  Calendar as CalendarIcon, 
  Settings, 
  TrendingUp,
  ArrowLeft,
  MoreVertical,
  Edit,
  Trash2,
  Share2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import CampaignOverview from '@/app/components/campaign/CampaignOverview';
import CampaignTeam from '@/app/components/campaign/CampaignTeam';
import CampaignFlows from '@/app/components/campaign/CampaignFlows';
import CampaignCalendar from '@/app/components/campaign/CampaignCalendar';
import CampaignSettings from '@/app/components/campaign/CampaignSettings';
import { showSuccess, showError, showConfirm } from '@/app/lib/swal';


const tabs = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'flows', label: 'Flows', icon: GitBranch },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function CampaignDetailPage({ params }) {
  const router = useRouter();
  const campaignId = params.id;
  
  const [activeTab, setActiveTab] = useState('overview');
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    loadCampaignData();
  }, [campaignId]);

  const loadCampaignData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load campaign');
      }

      const result = await response.json();
      setCampaign(result.data);
    } catch (error) {
      console.error('Error loading campaign:', error);
      await showError('Load Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = async () => {
    const result = await showConfirm(
      'Delete Campaign?',
      `Are you sure you want to delete "${campaign?.name}"? This action cannot be undone.`,
      'Yes, Delete',
      'Cancel'
    );

    if (result.isConfirmed) {
      // Implement delete API call
      router.push('/campaigns');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Campaign Not Found</h2>
          <button
            onClick={() => router.push('/campaigns')}
            className="text-blue-600 hover:text-blue-700"
          >
            Go back to campaigns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Top Row - Back button and Actions */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/campaigns')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Campaigns</span>
            </button>

            {/* Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>

              <AnimatePresence>
                {showActions && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowActions(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
                    >
                      <button
                        onClick={() => {
                          setShowActions(false);
                          // Handle edit
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Campaign
                      </button>
                      <button
                        onClick={() => {
                          setShowActions(false);
                          // Handle share
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={() => {
                          setShowActions(false);
                          handleDeleteCampaign();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Campaign
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Campaign Title and Stats */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {campaign.name}
            </h1>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                  {campaign.admin.firstName[0]}{campaign.admin.lastName[0]}
                </div>
                <span>Managed by {campaign.admin.fullName}</span>
              </div>
              {campaign.team && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{campaign.team.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Team Members</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {campaign.stats.totalAssignments}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Active Flows</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">
                    {campaign.stats.totalFlows}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <GitBranch className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Scheduled Events</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {campaign.stats.totalSchedules}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <CampaignOverview campaign={campaign} onRefresh={loadCampaignData} />
            )}
            {activeTab === 'team' && (
              <CampaignTeam campaignId={campaignId} />
            )}
            {activeTab === 'flows' && (
              <CampaignFlows campaignId={campaignId} />
            )}
            {activeTab === 'calendar' && (
              <CampaignCalendar campaignId={campaignId} />
            )}
            {activeTab === 'settings' && (
              <CampaignSettings campaign={campaign} onUpdate={loadCampaignData} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
