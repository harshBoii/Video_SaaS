"use client"
import React, { useState, useEffect,useMemo } from 'react';
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
  Share2,
  Video
} from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import CampaignOverview from '@/app/components/campaign/CampaignOverview';
import CampaignTeam from '@/app/components/campaign/CampaignTeam';
import CampaignFlows from '@/app/components/campaign/CampaignFlows';
import CampaignCalendar from '@/app/components/campaign/CampaignCalendar';
import CampaignSettings from '@/app/components/campaign/CampaignSettings';
import CampaignVideo from '@/app/components/campaign/CampaignVideo';
import { showSuccess, showError, showConfirm } from '@/app/lib/swal';

const ALL_TABS = [
  { id: 'overview', label: 'Overview', icon: TrendingUp, requiredPermission: null },
  { id: 'team',     label: 'Team',     icon: Users, requiredPermission: 'Assign Team' },
  { id: 'flows',    label: 'Flows',    icon: GitBranch, requiredPermission: 'Manage Workflow' },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon, requiredPermission: null },
  { id: 'settings', label: 'Settings', icon: Settings, requiredPermission: null },
  { id: 'videos',   label: 'Videos',   icon: Video, requiredPermission: null }
];

// Skeleton Components
const Skeleton = ({ className = "" }) => (
  <motion.div
    initial={{ opacity: 0.6 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
    className={`bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded ${className}`}
    style={{
      animation: "shimmer 1.5s ease-in-out infinite"
    }}
  />
);

const HeaderSkeleton = () => (
  <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
    <div className="max-w-7xl mx-auto px-6 py-4">
      {/* Back button skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="w-32 h-4" />
        </div>
        <Skeleton className="w-10 h-10 rounded-lg" />
      </div>

      {/* Title skeleton */}
      <div className="mb-6">
        <Skeleton className="w-64 h-9 mb-3" />
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-40 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="w-24 h-4" />
          </div>
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Skeleton className="w-24 h-4 mb-2" />
                <Skeleton className="w-16 h-8" />
              </div>
              <Skeleton className="w-12 h-12 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="w-16 h-4" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ContentSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="space-y-6"
  >
    {/* Content cards skeleton */}
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <Skeleton className="w-48 h-6 mb-4" />
      <div className="space-y-3">
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-5/6 h-4" />
        <Skeleton className="w-4/6 h-4" />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200">
          <Skeleton className="w-32 h-6 mb-4" />
          <div className="space-y-3">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-3/4 h-4" />
          </div>
        </div>
      ))}
    </div>

    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <Skeleton className="w-40 h-6 mb-4" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-1/3 h-4" />
              <Skeleton className="w-2/3 h-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

export default function CampaignPage({ campaignId }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [permissions, setPermissions] = useState(null);
  const tabFromUrl = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showActions, setShowActions] = useState(false);
  
  useEffect(() => {
    const tab = searchParams.get('tab') || 'overview';
    setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    loadCampaignData();
  }, [campaignId]);

  const loadCampaignData = async () => {
    setLoading(true);
    try {
      const [response,permissionsRes] =await Promise.all([
      fetch(`/api/admin/campaigns/${campaignId}`, { credentials: 'include' }),
      fetch(`/api/auth/campaign?campaignId=${campaignId}`, { credentials: 'include' })
    ]);

      if (!response.ok) {
        throw new Error('Failed to load campaign');
      }

      const result = await response.json();
      setCampaign(result.data);

      if (permissionsRes.ok) {
        const permData = await permissionsRes.json();
        setPermissions(permData);
      } else {
        setPermissions({ permissions: [], isAdmin: false, role: null });
      }

    } 
    catch (error) {
      console.error('Error loading campaign:', error);
      await showError('Load Failed', error.message);
    } 
    finally {
      setLoading(false);
    }
  };

  const allowedTabs = useMemo(() => {
  if (!permissions) return ALL_TABS.filter(tab => !tab.requiredPermission);
  
  const { isAdmin, permissions: userPermissions } = permissions;


  if (isAdmin) return ALL_TABS;

  // Filter based on permissions
  return ALL_TABS.filter(tab => {
    // Tabs with null permission are always visible
    if (!tab.requiredPermission) return true;
    
    // Check if user has the required permission
    return userPermissions.includes(tab.requiredPermission);
  });
}, [permissions]);


  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
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

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderSkeleton />
        <div className="max-w-7xl mx-auto px-6 py-6">
          <ContentSkeleton />
        </div>
      </div>
    );
  }
  const getBackRoute = () => {
    if (permissions?.isAdmin) return '/admin';
    return '/employee';
  };

  // Not Found State
  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowLeft className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Campaign Not Found</h2>
          <p className="text-gray-600 mb-4">The campaign you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push(getBackRoute())}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go back to DashBoard
          </button>
        </motion.div>
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
              onClick={() => router.push(getBackRoute())}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Dashboard</span>
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
          <div className="mb-6 w-full">
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
              {permissions && (
                  <div className="px-2 sticky right-0 py-1 bg-black text-white border-2 border-yellow-500 text-xs font-semibold rounded-2xl">
                    Your Role : {permissions.isAdmin ? 'Admin' : permissions.role}
                  </div>
                )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200"
            >
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200"
            >
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200"
            >
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
            </motion.div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {allowedTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
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
            {activeTab === 'videos' && (
              <CampaignVideo campaign={campaign} onUpdate={loadCampaignData} campaignId={campaignId} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
