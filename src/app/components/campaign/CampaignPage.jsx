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
  BoxIcon,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  PlayCircle,
  Split,
  Loader2,
  ScanHeartIcon,
  HandHeart
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

const EXECUTION_MODE_ICONS = {
  SEQUENTIAL: PlayCircle,
  PARALLEL: Split,
  CONDITIONAL: GitBranch
};

// Workflow status configurations
const WORKFLOW_STATUS_CONFIG = {
  NOT_STARTED: { label: 'Not Started', color: 'bg-gray-500', textColor: 'text-gray-700', icon: Circle },
  AWAITING_ASSETS: { label: 'Awaiting Assets', color: 'bg-amber-500', textColor: 'text-amber-700', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-500', textColor: 'text-blue-700', icon: Loader2 },
  IN_REVIEW: { label: 'In Review', color: 'bg-purple-500', textColor: 'text-purple-700', icon: AlertCircle },
  CHANGES_NEEDED: { label: 'Changes Needed', color: 'bg-orange-500', textColor: 'text-orange-700', icon: AlertCircle },
  READY_TO_PUBLISH: { label: 'Ready to Publish', color: 'bg-green-500', textColor: 'text-green-700', icon: CheckCircle2 },
  PUBLISHED: { label: 'Published', color: 'bg-emerald-500', textColor: 'text-emerald-700', icon: CheckCircle2 },
  COMPLETED: { label: 'Completed', color: 'bg-green-600', textColor: 'text-green-800', icon: CheckCircle2 },
  ON_HOLD: { label: 'On Hold', color: 'bg-gray-400', textColor: 'text-gray-600', icon: Circle },
};


// Skeleton Components (keeping existing ones)
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="w-32 h-4" />
        </div>
        <Skeleton className="w-10 h-10 rounded-lg" />
      </div>
      <div className="mb-6">
        <Skeleton className="w-64 h-9 mb-3" />
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-40 h-4" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-4">
            <Skeleton className="w-full h-20" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ContentSkeleton = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <div className="glass-card p-6">
      <Skeleton className="w-48 h-6 mb-4" />
      <div className="space-y-3">
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-5/6 h-4" />
      </div>
    </div>
  </motion.div>
);


// ✅ NEW: Workflow Stage Tracker Component
const WorkflowStageTracker = ({ workflow, progress }) => {
  const [hoveredStage, setHoveredStage] = useState(null);

  if (!workflow) {
    return (
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium text-muted-foreground">No workflow assigned to this campaign</span>
          </div>
        </div>
      </div>
    );
  }

  const stages = workflow.stages || [];
  const totalStages = stages.length;

  // Calculate stage completion
  const getStageStatus = (stage) => {
    const totalStepsInStage = stage.steps.length;
    const assetsInStage = stage.steps.reduce((sum, step) => sum + step.assetCount, 0);
    
    if (assetsInStage === 0) return 'pending';
    
    // Check if all assets have moved past this stage
    const allCompleted = stage.steps.every(step => step.assetCount === 0);
    if (allCompleted) return 'completed';
    
    return 'active';
  };

  return (
    <div className="glass-card p-6 mb-6">
      {/* Workflow Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{workflow.name}</h3>
            <p className="text-xs text-muted-foreground">
              {totalStages} stages • {workflow.totalSteps} steps • {workflow.totalAssetsInWorkflow} assets in workflow
            </p>
          </div>
        </div>
        
        {/* Progress Percentage */}
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">{progress.percentage}%</div>
          <div className="text-xs text-muted-foreground">Complete</div>
        </div>
      </div>

      {/* Stage Timeline */}
      <div className="relative">
        {/* Progress Bar Background */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-[var(--glass-hover)] rounded-full" />
        
        {/* Active Progress Bar */}
        <div 
          className="absolute top-6 left-0 h-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${progress.percentage}%` }}
        />

        {/* Stages */}
        <div className="relative flex justify-between">
          {stages.map((stage, index) => {
            const status = getStageStatus(stage);
            const isHovered = hoveredStage === stage.id;
            const ExecutionIcon = EXECUTION_MODE_ICONS[stage.executionMode] || PlayCircle;
            
            return (
              <div
                key={stage.id}
                className="relative flex flex-col items-center"
                style={{ width: `${100 / totalStages}%` }}
                onMouseEnter={() => setHoveredStage(stage.id)}
                onMouseLeave={() => setHoveredStage(null)}
              >
                {/* Stage Circle */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all z-10 ${
                    status === 'completed' 
                      ? 'bg-green-500 shadow-lg shadow-green-500/50' 
                      : status === 'active'
                      ? 'bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/50 animate-pulse'
                      : 'bg-[var(--glass-hover)] border-2 border-[var(--glass-border)]'
                  }`}
                >
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  ) : status === 'active' ? (
                    <ExecutionIcon className="w-6 h-6 text-white" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground" />
                  )}
                </motion.div>

                {/* Stage Name */}
                <div className="mt-3 text-center">
                  <p className={`text-xs font-semibold ${
                    status === 'completed' ? 'text-green-600' 
                    : status === 'active' ? 'text-primary' 
                    : 'text-muted-foreground'
                  }`}>
                    Stage {stage.order}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-24 truncate">
                    {stage.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stage.steps.reduce((sum, step) => sum + step.assetCount, 0)} assets
                  </p>
                </div>

                {/* Hover Popup - Steps Details */}
                <AnimatePresence>
                  {isHovered && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-16 z-50 w-80 glass-dropdown rounded-xl p-4 shadow-2xl"
                        style={{ left: index === stages.length - 1 ? 'auto' : '50%', right: index === stages.length - 1 ? '0' : 'auto', transform: index === stages.length - 1 ? 'none' : 'translateX(-50%)' }}
                      >
                        {/* Arrow */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-[var(--glass)] border-l border-t border-[var(--glass-border)]" 
                             style={{ left: index === stages.length - 1 ? 'auto' : '50%', right: index === stages.length - 1 ? '1rem' : 'auto' }} />
                        
                        {/* Stage Header */}
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[var(--glass-border)]">
                          <ExecutionIcon className="w-5 h-5 text-primary" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{stage.name}</h4>
                            <p className="text-xs text-muted-foreground">{stage.executionMode} execution</p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            status === 'completed' ? 'bg-green-100 text-green-700' 
                            : status === 'active' ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-600'
                          }`}>
                            {status === 'completed' ? 'Done' : status === 'active' ? 'Active' : 'Pending'}
                          </div>
                        </div>

                        {/* Steps List */}
                        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                          {stage.steps.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No steps in this stage</p>
                          ) : (
                            stage.steps.map((step, stepIndex) => (
                              <div
                                key={step.id}
                                className="flex items-start gap-3 p-2 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
                              >
                                {/* Step Number */}
                                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                                  {stepIndex + 1}
                                </div>

                                {/* Step Details */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{step.name}</p>
                                  
                                  {/* Assigned Roles */}
                                  {step.assignedRoles.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {step.assignedRoles.map((ar, idx) => (
                                        <span
                                          key={idx}
                                          className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded"
                                        >
                                          {ar.role.name}{ar.required ? '*' : ''}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Asset Count */}
                                  {step.assetCount > 0 && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                      <span className="text-xs text-blue-600 font-medium">
                                        {step.assetCount} asset{step.assetCount > 1 ? 's' : ''} here
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Approval Policy */}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {step.approvalPolicy === 'ALL_MUST_APPROVE' && '✓ All must approve'}
                                    {step.approvalPolicy === 'ANY_CAN_APPROVE' && '✓ Any can approve'}
                                    {step.approvalPolicy === 'MAJORITY_MUST_APPROVE' && '✓ Majority must approve'}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


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
    } catch (error) {
      console.error('Error loading campaign:', error);
      await showError('Load Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const allowedTabs = useMemo(() => {
    if (!permissions) return ALL_TABS.filter(tab => !tab.requiredPermission);
    const { isAdmin, permissions: userPermissions } = permissions;
    if (isAdmin) return ALL_TABS;
    return ALL_TABS.filter(tab => !tab.requiredPermission || userPermissions.includes(tab.requiredPermission));
  }, [permissions]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
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

  // ✅ Get workflow status config
  const workflowStatusConfig = WORKFLOW_STATUS_CONFIG[campaign.progress?.status] || WORKFLOW_STATUS_CONFIG.NOT_STARTED;
  const StatusIcon = workflowStatusConfig.icon;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass-card rounded-none border-x-0 border-t-0 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Campaign Title and Stats */}
          <div className="mb-6 w-full">
            <div className="flex items-start justify-between">
              <div className="flex-1">
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
                    <div className="px-2 py-1 bg-primary/10 text-primary border border-primary/30 text-xs font-semibold rounded-2xl">
                      Your Role: {permissions.isAdmin ? 'Admin' : permissions.role}
                    </div>
                  )}
                  
                  {/* ✅ Workflow Status Badge */}
                  <div className={`flex items-center gap-1.5 px-3 py-1 ${workflowStatusConfig.color}/10 border border-${workflowStatusConfig.color}/30 rounded-full`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${workflowStatusConfig.color.replace('bg-', 'text-')} ${workflowStatusConfig.icon === Loader2 ? 'animate-spin' : ''}`} />
                    <span className={`text-xs font-semibold ${workflowStatusConfig.textColor}`}>
                      {workflowStatusConfig.label}
                    </span>
                  </div>
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
                      <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 mt-2 w-48 glass-dropdown rounded-lg py-1 z-20"
                      >
                        <button onClick={() => { setShowActions(false); }} className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-[var(--glass-hover)] flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          Edit Campaign
                        </button>
                        <button onClick={() => { setShowActions(false); }} className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-[var(--glass-hover)] flex items-center gap-2">
                          <Share2 className="w-4 h-4" />
                          Share
                        </button>
                        <div className="border-t border-[var(--glass-border)] my-1" />
                        <button onClick={() => { setShowActions(false); handleDeleteCampaign(); }} className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          Delete Campaign
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
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
                  <p className="text-2xl font-bold text-foreground mt-1">{campaign.assets.stats.overall.total}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </motion.div>



              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.4 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-white to-yellow-50/80 p-6 border-l-4 border-l-amber-500 shadow-2xl shadow-amber-200/40"
              >
                {/* Temple-inspired gradient overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-100/30 via-transparent to-yellow-100/20 pointer-events-none" />
                
                {/* Decorative golden accent dots (inspired by temple kolam) */}
                <div className="absolute top-3 right-3 flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-amber-400/60" />
                  <div className="w-1 h-1 rounded-full bg-yellow-400/60" />
                  <div className="w-1 h-1 rounded-full bg-amber-400/60" />
                </div>
                
                <div className="relative flex items-center gap-6">
                  {/* Icon container with golden temple aesthetic */}
                  <div className="shrink-0 w-16 h-16 bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-100 rounded-2xl flex items-center justify-center border-2 border-amber-300/40 shadow-lg shadow-amber-300/30 ring-1 ring-amber-200/50">
                    <HandHeart className="w-8 h-8 text-amber-600" />
                  </div>
                  
                  {/* Content section with traditional styling */}
                  <div className="flex-1 space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-600 bg-clip-text text-transparent [text-shadow:_0_1px_2px_rgb(251_191_36_/_10%)]">
                      Vadakkam!
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-amber-900/70 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/60" />
                      <span>Welcome Back • {new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span>
                    </div>
                  </div>

                  {/* Status indicator with temple gold */}
                  <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 border border-amber-300/50 flex items-center justify-center shadow-md">
                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                  </div>
                </div>

                {/* Bottom accent with temple gopuram inspired pattern */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                <div className="absolute bottom-1 left-0 right-0 h-px bg-gradient-to-r from-amber-300/40 via-yellow-400/40 to-amber-300/40" />
              </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-4 border-l-4 border-l-green-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Completion</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{campaign.progress?.percentage || 0}%</p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </motion.div>
          </div>


          <WorkflowStageTracker workflow={campaign.workflow} progress={campaign.progress} />

          {/* Tabs Navigation */}
          <div className="flex gap-1 bg-[var(--glass-hover)] p-1 rounded-lg">
            {allowedTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

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
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                        isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <BoxIcon className="w-4 h-4" />
                      <span>Assets</span>
                      <span>{currentAssetType?.label || 'Assets'}</span>
                      <ChevronDown
                        className={`w-4 h-4 ml-1 cursor-pointer transition-transform ${showAssetDropdown ? 'rotate-180' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAssetDropdown(!showAssetDropdown);
                        }}
                      />
                    </button>

                    <AnimatePresence>
                      {isActive && showAssetDropdown && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowAssetDropdown(false)} />
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
                                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                                    assetType === asset.id ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-[var(--glass-hover)]'
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

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(`${tab.id}`)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                    isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
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
            {activeTab === 'overview' && <CampaignOverview campaign={campaign} onRefresh={loadCampaignData} />}
            {activeTab === 'team' && <CampaignTeam campaignId={campaignId} />}
            {activeTab === 'flows' && <CampaignFlows campaignId={campaignId} permissions={permissions} />}
            {activeTab === 'calendar' && <CampaignCalendar campaignId={campaignId} />}
            {activeTab === 'settings' && <CampaignSettings campaign={campaign} onUpdate={loadCampaignData} />}
            {activeTab === 'assets' && (
              <>
                {assetType === 'videos' && <CampaignVideo campaign={campaign} onUpdate={loadCampaignData} campaignId={campaignId} />}
                {assetType === 'images' && <CampaignImages campaign={campaign} onUpdate={loadCampaignData} campaignId={campaignId} />}
                {assetType === 'scripts' && <CampaignScripts campaign={campaign} onUpdate={loadCampaignData} campaignId={campaignId} />}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
