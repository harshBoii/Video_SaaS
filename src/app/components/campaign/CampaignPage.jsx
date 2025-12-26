"use client"
import React, { useState, useEffect, useMemo } from 'react';
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
  Video,
  Image,
  FileText,
  ChevronDown,
  BoxIcon
} from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import CampaignOverview from '@/app/components/campaign/CampaignOverview';
import CampaignTeam from '@/app/components/campaign/CampaignTeam';
import CampaignFlows from '@/app/components/campaign/CampaignFlows';
import CampaignCalendar from '@/app/components/campaign/CampaignCalendar';
import CampaignSettings from '@/app/components/campaign/CampaignSettings';
import CampaignVideo from '@/app/components/campaign/CampaignVideo';
import CampaignImages from '@/app/components/campaign/CampaignImages';
import CampaignScripts from '@/app/components/campaign/CampaignScripts';
import { showSuccess, showError, showConfirm } from '@/app/lib/swal';

const ALL_TABS = [
  { id: 'overview', label: 'Overview', icon: TrendingUp, requiredPermission: null },
  { id: 'team', label: 'Team', icon: Users, requiredPermission: 'Assign Team' },
  { id: 'flows', label: 'Flows', icon: GitBranch, requiredPermission: 'Manage Workflow' },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon, requiredPermission: null },
  { id: 'settings', label: 'Settings', icon: Settings, requiredPermission: null },
  { id: 'assets', label: 'Assets', icon: BoxIcon, requiredPermission: null }
];

const ASSET_TYPES = [
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'images', label: 'Images', icon: Image },
  { id: 'scripts', label: 'Scripts', icon: FileText }
];

// Skeleton Components
const Skeleton = ({ className = "" }) => (
  <motion.div
    initial={{ opacity: 0.6 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
    className={`bg-[var(--glass-hover)] rounded ${className}`}
  />
);

const HeaderSkeleton = () => (
  <div className="glass-card rounded-none border-x-0 border-t-0 sticky top-0 z-10">
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
          <div key={i} className="glass-card p-4">
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
      <div className="flex gap-1 bg-[var(--glass-hover)] p-1 rounded-lg">
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
    <div className="glass-card p-6">
      <Skeleton className="w-48 h-6 mb-4" />
      <div className="space-y-3">
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-5/6 h-4" />
        <Skeleton className="w-4/6 h-4" />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      {[1, 2].map((i) => (
        <div key={i} className="glass-card p-6">
          <Skeleton className="w-32 h-6 mb-4" />
          <div className="space-y-3">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-3/4 h-4" />
          </div>
        </div>
      ))}
    </div>

    <div className="glass-card p-6">
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
  const assetFromUrl = searchParams.get('asset') || 'videos';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [assetType, setAssetType] = useState(assetFromUrl);
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab') || 'overview';
    const asset = searchParams.get('asset') || 'videos';
    setActiveTab(tab);
    setAssetType(asset);
  }, [searchParams]);

  useEffect(() => {
    loadCampaignData();
  }, [campaignId]);

  const loadCampaignData = async () => {
    setLoading(true);
    try {
      const [response, permissionsRes] = await Promise.all([
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

    // Reset to default asset type when switching to assets tab
    if (tabId === 'assets' && !searchParams.get('asset')) {
      params.set('asset', 'videos');
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleAssetTypeChange = (type) => {
    setAssetType(type);
    setShowAssetDropdown(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set('asset', type);
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

  const getBackRoute = () => {
    if (permissions?.isAdmin) return '/admin';
    return '/employee';
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen">
        <HeaderSkeleton />
        <div className="max-w-7xl mx-auto px-6 py-6">
          <ContentSkeleton />
        </div>
      </div>
    );
  }

  // Not Found State
  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center glass-card p-8"
        >
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowLeft className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Campaign Not Found</h2>
          <p className="text-muted-foreground mb-4">The campaign you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push(getBackRoute())}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass-card rounded-none border-x-0 border-t-0 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Top Row - Back button and Actions */}
          <div className="flex items-start mt-5 justify-between mb-4">




            {/* Campaign Title and Stats */}
            <div className="mb-6 w-full">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {campaign.name}
              </h1>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-xs font-semibold">
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
                  <div className="px-2 sticky right-0 py-1 bg-primary/10 text-primary border border-primary/30 text-xs font-semibold rounded-2xl">
                    Your Role : {permissions.isAdmin ? 'Admin' : permissions.role}
                  </div>
                )}
              </div>
            </div>

            {/* Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 hover:bg-[var(--glass-hover)] rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-muted-foreground" />
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
                      className="absolute right-0 mt-2 w-48 glass-dropdown rounded-lg py-1 z-20"
                    >
                      <button
                        onClick={() => {
                          setShowActions(false);
                          // Handle edit
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-[var(--glass-hover)] flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Campaign
                      </button>
                      <button
                        onClick={() => {
                          setShowActions(false);
                          // Handle share
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-[var(--glass-hover)] flex items-center gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                      <div className="border-t border-[var(--glass-border)] my-1" />
                      <button
                        onClick={() => {
                          setShowActions(false);
                          handleDeleteCampaign();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
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


          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-4 border-l-4 border-l-primary"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Team Members</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {campaign.stats.totalAssignments}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-4 border-l-4 border-l-purple-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Active Flows</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {campaign.stats.totalFlows}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <GitBranch className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-4 border-l-4 border-l-green-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Scheduled Events</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {campaign.stats.totalSchedules}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex gap-1 bg-[var(--glass-hover)] p-1 rounded-lg">
            {allowedTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              // Special handling for Assets tab with dropdown
              if (tab.id === 'assets') {
                const currentAssetType = ASSET_TYPES.find(a => a.id === assetType);
                const AssetIcon = currentAssetType?.icon || BoxIcon;

                return (
                  <div key={tab.id} className="flex-1 relative">
                    <button
                      onClick={() => {
                        handleTabChange('assets');
                        setShowAssetDropdown(prev => !prev);
                      }}

                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${isActive
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      <BoxIcon className="w-4 h-4" />
                      <span>Assets</span>
                      <span>{currentAssetType?.label || 'Assets'}</span>
                      {(
                        <ChevronDown
                          className={`w-4 h-4 ml-1 cursor-pointer transition-transform ${showAssetDropdown ? 'rotate-180' : ''
                            }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAssetDropdown(!showAssetDropdown);
                          }}
                        />
                      )}
                    </button>

                    {/* Asset Dropdown */}
                    <AnimatePresence>
                      {isActive && showAssetDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowAssetDropdown(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-2 glass-dropdown rounded-lg py-1 z-20"
                          >
                            {ASSET_TYPES.map((asset) => {
                              const AssetTypeIcon = asset.icon;
                              return (
                                <button
                                  key={asset.id}
                                  onClick={() => handleAssetTypeChange(asset.id)}
                                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${assetType === asset.id
                                      ? 'bg-primary/10 text-primary font-medium'
                                      : 'text-foreground hover:bg-[var(--glass-hover)]'
                                    }`}
                                >
                                  <AssetTypeIcon className="w-4 h-4" />
                                  {asset.label}
                                </button>
                              );
                            })}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              // Regular tabs
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    handleTabChange(`${tab.id}`);
                    // setShowAssetDropdown(prev => !prev);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${isActive
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
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
            key={activeTab + assetType}
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
              <CampaignFlows campaignId={campaignId} permissions={permissions} />
            )}
            {activeTab === 'calendar' && (
              <CampaignCalendar campaignId={campaignId} />
            )}
            {activeTab === 'settings' && (
              <CampaignSettings campaign={campaign} onUpdate={loadCampaignData} />
            )}
            {activeTab === 'assets' && (
              <>
                {assetType === 'videos' && (
                  <CampaignVideo campaign={campaign} onUpdate={loadCampaignData} campaignId={campaignId} />
                )}
                {assetType === 'images' && (
                  <CampaignImages campaign={campaign} onUpdate={loadCampaignData} campaignId={campaignId} />
                )}
                {assetType === 'scripts' && (
                  <CampaignScripts campaign={campaign} onUpdate={loadCampaignData} campaignId={campaignId} />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
