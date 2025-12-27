"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  GitBranch, 
  Clock, 
  Target,
  TrendingUp,
  Video,
  FileText,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Package,
  Eye,
  Edit,
  Send,
  BarChart3,
  Activity,
  Zap
} from 'lucide-react';

// Asset status color configurations
const STATUS_COLORS = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  PENDING_REVIEW: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  UNDER_REVIEW: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  CHANGES_REQUESTED: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  PARTIALLY_APPROVED: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  PUBLISHED: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  COMPLETED: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
  ARCHIVED: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
};

export default function CampaignOverview({ campaign, onRefresh }) {
  if (!campaign) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No campaign data available</p>
        </div>
      </div>
    );
  }

  const stats = campaign.assets?.stats || { videos: { total: 0 }, documents: { total: 0 }, overall: {} };
  const workflow = campaign.workflow;
  const progress = campaign.progress || { total: 0, completed: 0, percentage: 0 };

  // Calculate workflow insights
  const getActiveStage = () => {
    if (!workflow?.stages) return null;
    return workflow.stages.find(stage => 
      stage.steps.some(step => step.assetCount > 0)
    );
  };

  const activeStage = getActiveStage();

  // Get top bottleneck step
  const getBottleneckStep = () => {
    if (!workflow?.stages) return null;
    let maxAssets = 0;
    let bottleneckStep = null;

    workflow.stages.forEach(stage => {
      stage.steps.forEach(step => {
        if (step.assetCount > maxAssets) {
          maxAssets = step.assetCount;
          bottleneckStep = { ...step, stageName: stage.name };
        }
      });
    });

    return bottleneckStep;
  };

  const bottleneck = getBottleneckStep();

  // Calculate team productivity
  const getTeamActivity = () => {
    const totalAssets = progress.total;
    const completedAssets = progress.completed;
    const inProgress = stats.overall.inReview || 0;
    
    return {
      active: inProgress,
      completed: completedAssets,
      pending: totalAssets - completedAssets - inProgress
    };
  };

  const teamActivity = getTeamActivity();

  return (
    <div className="space-y-6">
      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Assets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5 border-l-4 border-l-purple-500"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{progress.total}</p>
          <p className="text-sm text-muted-foreground">Total Assets</p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
            {stats.videos.total} videos • {stats.documents.total} docs
          </p>
        </motion.div>

        {/* In Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5 border-l-4 border-l-blue-500"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{teamActivity.active}</p>
          <p className="text-sm text-muted-foreground">In Review</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            {teamActivity.pending} pending
          </p>
        </motion.div>

        {/* Completed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5 border-l-4 border-l-green-500"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-xs font-semibold text-green-600 dark:text-green-400">
              {progress.percentage}%
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{progress.completed}</p>
          <p className="text-sm text-muted-foreground">Completed</p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </motion.div>

        {/* Team Members */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-5 border-l-4 border-l-primary"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{campaign.assignments?.length || 0}</p>
          <p className="text-sm text-muted-foreground">Team Members</p>
          <p className="text-xs text-primary mt-2">
            {campaign.team?.memberCount || 0} in team
          </p>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Campaign Details */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Campaign Details</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start justify-between py-3 border-b border-[var(--glass-border)]">
              <span className="text-sm text-muted-foreground font-medium">Company</span>
              <span className="text-sm font-semibold text-foreground text-right">
                {campaign.company?.name || 'N/A'}
              </span>
            </div>
            
            <div className="flex items-start justify-between py-3 border-b border-[var(--glass-border)]">
              <span className="text-sm text-muted-foreground font-medium">Campaign Admin</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-xs font-bold">
                  {campaign.admin?.firstName?.[0]}{campaign.admin?.lastName?.[0]}
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {campaign.admin?.fullName || 'N/A'}
                </span>
              </div>
            </div>
            
            {campaign.team && (
              <div className="flex items-start justify-between py-3 border-b border-[var(--glass-border)]">
                <span className="text-sm text-muted-foreground font-medium">Assigned Team</span>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{campaign.team.name}</p>
                  <p className="text-xs text-muted-foreground">{campaign.team.memberCount} members</p>
                </div>
              </div>
            )}
            
            <div className="flex items-start justify-between py-3 border-b border-[var(--glass-border)]">
              <span className="text-sm text-muted-foreground font-medium">Status</span>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                {campaign.status || 'Active'}
              </span>
            </div>
            
            <div className="flex items-start justify-between py-3 border-b border-[var(--glass-border)]">
              <span className="text-sm text-muted-foreground font-medium">Created</span>
              <span className="text-sm font-semibold text-foreground">
                {new Date(campaign.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            
            <div className="flex items-start justify-between py-3">
              <span className="text-sm text-muted-foreground font-medium">Last Updated</span>
              <span className="text-sm font-semibold text-foreground">
                {new Date(campaign.updatedAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Workflow Status */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Workflow Status</h3>
          </div>

          {workflow ? (
            <div className="space-y-4">
              {/* Active Workflow */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">{workflow.name}</p>
                  {workflow.isDefault && (
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {workflow.totalStages} stages • {workflow.totalSteps} steps • {workflow.totalAssetsInWorkflow} assets
                </p>
              </div>

              {/* Current Stage */}
              {activeStage && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Current Stage</p>
                  </div>
                  <p className="text-base font-bold text-foreground mb-1">{activeStage.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Stage {activeStage.order} of {workflow.totalStages} • {activeStage.steps.reduce((sum, s) => sum + s.assetCount, 0)} assets here
                  </p>
                </div>
              )}

              {/* Bottleneck Alert */}
              {bottleneck && bottleneck.assetCount > 3 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Bottleneck Detected</p>
                  </div>
                  <p className="text-sm font-bold text-foreground mb-1">{bottleneck.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {bottleneck.assetCount} assets waiting • in {bottleneck.stageName}
                  </p>
                </div>
              )}

              {/* Workflow Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-[var(--glass-hover)] rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{workflow.totalStages}</p>
                  <p className="text-xs text-muted-foreground mt-1">Stages</p>
                </div>
                <div className="text-center p-3 bg-[var(--glass-hover)] rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{workflow.totalSteps}</p>
                  <p className="text-xs text-muted-foreground mt-1">Steps</p>
                </div>
                <div className="text-center p-3 bg-[var(--glass-hover)] rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{workflow.totalAssetsInWorkflow}</p>
                  <p className="text-xs text-muted-foreground mt-1">In Flow</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No workflow assigned</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Asset Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Asset Breakdown</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Videos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-foreground">Videos ({stats.videos.total})</h4>
              </div>
            </div>
            <div className="space-y-2">
              {Object.entries(stats.videos.byStatus || {}).map(([status, count]) => {
                if (count === 0) return null;
                const config = STATUS_COLORS[status] || STATUS_COLORS.DRAFT;
                return (
                  <div key={status} className="flex items-center justify-between py-2 px-3 bg-[var(--glass-hover)] rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${config.bg.replace('100', '500')}`} />
                      <span className="text-sm text-foreground">
                        {status.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                      </span>
                    </div>
                    <span className={`text-sm font-bold px-2 py-0.5 ${config.bg} ${config.text} rounded-full`}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Documents */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-foreground">Documents ({stats.documents.total})</h4>
              </div>
            </div>
            <div className="space-y-2">
              {Object.entries(stats.documents.byStatus || {}).map(([status, count]) => {
                if (count === 0) return null;
                const config = STATUS_COLORS[status] || STATUS_COLORS.DRAFT;
                return (
                  <div key={status} className="flex items-center justify-between py-2 px-3 bg-[var(--glass-hover)] rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${config.bg.replace('100', '500')}`} />
                      <span className="text-sm text-foreground">
                        {status.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                      </span>
                    </div>
                    <span className={`text-sm font-bold px-2 py-0.5 ${config.bg} ${config.text} rounded-full`}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Team Assignments */}
      {campaign.assignments && campaign.assignments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Team Assignments</h3>
            </div>
            <span className="text-sm text-muted-foreground">
              {campaign.assignments.length} member{campaign.assignments.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaign.assignments.slice(0, 6).map((assignment, index) => (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center gap-3 p-3 bg-[var(--glass-hover)] rounded-lg hover:bg-[var(--glass)] border border-transparent hover:border-[var(--glass-border)] transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {assignment.employee?.firstName?.[0]}{assignment.employee?.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {assignment.employee?.fullName || 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {assignment.role?.name || 'No role'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {campaign.assignments.length > 6 && (
            <div className="mt-4 text-center">
              <button className="text-sm text-primary hover:underline font-medium">
                View all {campaign.assignments.length} members →
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
