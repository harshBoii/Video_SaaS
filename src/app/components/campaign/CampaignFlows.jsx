import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitBranch, 
  Plus, 
  Star,
  ChevronRight,
  Layers,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  X,
  FileVideo,
  Image as ImageIcon,
  FileText,
  Tag,
  Check,
  AlertCircle,
  Users,
  Clock,
  FastForward,
  Filter,
  Search,
  TrendingUp,
  PlayCircle, 
  Split
} from 'lucide-react';
import { showSuccess, showError, showConfirm, showLoading, closeSwal } from '@/app/lib/swal';
import FlowchainBuilderModal from './CampaignApprovalFlow';
import EditFlowchainModal from './EditFlowchainModal';

export default function CampaignFlows({ campaignId, permissions }) {
  const [flowsData, setFlowsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [showFlowBuilder, setShowFlowBuilder] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFlowChainId, setEditingFlowChainId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [showAssignWorkflowModal, setShowAssignWorkflowModal] = useState(false);
  const [showManualApprovalModal, setShowManualApprovalModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const canManageWorkflow = 
    permissions?.isAdmin || 
    permissions?.permissions?.includes('Manage Workflow');

  useEffect(() => {
    loadFlows();
  }, [campaignId]);

  useEffect(() => {
    if (activeTab === 'assets') {
      loadAssets();
    }
  }, [activeTab, campaignId]);

  const loadFlows = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/flows`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to load flows');

      const result = await response.json();
      setFlowsData(result.data);
      
      if (result.data.defaultFlow) {
        setSelectedFlow(result.data.defaultFlow.flowChain.id);
      }
    } catch (error) {
      console.error('Error loading flows:', error);
      await showError('Load Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async () => {
    setLoadingAssets(true);
    try {
      const [videosRes, docsRes] = await Promise.all([
        fetch(`/api/videos?campaignId=${campaignId}`, { credentials: 'include' }),
        fetch(`/api/documents?campaignId=${campaignId}`, { credentials: 'include' })
      ]);

      if (!videosRes.ok || !docsRes.ok) {
        throw new Error('Failed to load assets');
      }

      const [videosData, docsData] = await Promise.all([
        videosRes.json(),
        docsRes.json()
      ]);

      const videos = (videosData.data?.videos || []).map(v => ({
        ...v,
        type: 'VIDEO',
        displayType: 'VIDEO',
        icon: FileVideo,
        assetId: v.id
      }));

      const allDocs = docsData.data || [];
      
      const images = allDocs
        .filter(d => d.documentType === 'IMAGE')
        .map(i => ({
          ...i,
          type: 'DOCUMENT',
          displayType: 'IMAGE',
          icon: ImageIcon,
          assetId: i.id
        }));

      const documents = allDocs
        .filter(d => d.documentType !== 'IMAGE')
        .map(d => ({
          ...d,
          type: 'DOCUMENT',
          displayType: 'DOCUMENT',
          icon: FileText,
          assetId: d.id
        }));

      const allAssets = [...videos, ...images, ...documents];
      setAssets(allAssets);

    } catch (error) {
      console.error('Error loading assets:', error);
      await showError('Load Failed', 'Failed to load assets');
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleFlowCreated = () => {
    setShowFlowBuilder(false);
    loadFlows();
  };

  const handleEditFlow = (flowChainId) => {
    setEditingFlowChainId(flowChainId);
    setShowEditModal(true);
  };

  const handleFlowEdited = () => {
    setShowEditModal(false);
    setEditingFlowChainId(null);
    loadFlows();
  };

  const handleSetDefault = async (flowId) => {
    showLoading('Setting as default...', 'Please wait');

    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/flows/${flowId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      closeSwal();
      await showSuccess('Success!', 'Default workflow updated');
      loadFlows();
    } catch (error) {
      closeSwal();
      await showError('Update Failed', error.message);
    }
  };

  const handleDeleteFlow = async (flowId, flowName) => {
    const result = await showConfirm(
      'Remove Workflow?',
      `Are you sure you want to remove "${flowName}" from this campaign?`,
      'Yes, Remove',
      'Cancel'
    );

    if (!result.isConfirmed) return;

    showLoading('Removing workflow...', 'Please wait');

    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/flows/${flowId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      closeSwal();
      await showSuccess('Removed!', 'Workflow removed from campaign');
      
      if (selectedFlow === flowId) {
        setSelectedFlow(null);
      }
      
      loadFlows();
    } catch (error) {
      closeSwal();
      await showError('Removal Failed', error.message);
    }
  };

  const handleAssignWorkflow = (asset) => {
    setSelectedAsset(asset);
    setShowAssignWorkflowModal(true);
  };

  const handleManualApproval = (asset) => {
    setSelectedAsset(asset);
    setShowManualApprovalModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Workflows
            </div>
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'assets'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Asset Workflows
              {assets.length > 0 && (
                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs">
                  {assets.length}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Workflows</h3>
              {canManageWorkflow && (
                <button 
                  onClick={() => setShowFlowBuilder(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Flow
                </button>
              )}
            </div>

            {flowsData?.flows.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No workflows assigned yet</p>
                {canManageWorkflow && (
                  <button 
                    onClick={() => setShowFlowBuilder(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Create your first workflow
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {flowsData?.flows.map((flow) => (
                  <motion.div
                    key={flow.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative"
                  >
                    <button
                      onClick={() => setSelectedFlow(flow.flowChain.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        selectedFlow === flow.flowChain.id
                          ? 'bg-blue-50 border-blue-500'
                          : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                            <GitBranch className="w-4 h-4 text-white" />
                          </div>
                          <h4 className="font-semibold text-gray-900">
                            {flow.flowChain.name}
                          </h4>
                        </div>
                        {flow.isDefault && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            <Star className="w-3 h-3 fill-current" />
                            Default
                          </span>
                        )}
                      </div>
                      
                      {flow.flowChain.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {flow.flowChain.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {flow.flowChain.totalStages > 0 && (
                            <span className="text-gray-500">
                              {flow.flowChain.totalStages} stage{flow.flowChain.totalStages !== 1 ? 's' : ''}
                            </span>
                          )}
                          <span className="text-gray-500">
                            {flow.flowChain.totalSteps} step{flow.flowChain.totalSteps !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-colors ${
                          selectedFlow === flow.flowChain.id ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                      </div>
                    </button>

                    {canManageWorkflow && (
                      <button
                        onClick={() => handleDeleteFlow(flow.id, flow.flowChain.name)}
                        className="absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove workflow"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="col-span-8">
            {selectedFlow ? (
              <FlowVisualization 
                flow={flowsData.flows.find(f => f.flowChain.id === selectedFlow)} 
                onSetDefault={handleSetDefault}
                onEdit={handleEditFlow}
                canManageWorkflow={canManageWorkflow}
              />
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center h-full flex items-center justify-center">
                <div>
                  <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Select a workflow to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <AssetWorkflowsView
          assets={assets}
          loadingAssets={loadingAssets}
          flows={flowsData?.flows || []}
          onAssignWorkflow={handleAssignWorkflow}
          onManualApproval={handleManualApproval}
          onRefresh={loadAssets}
          canManageWorkflow={canManageWorkflow}
        />
      )}

      {showFlowBuilder && (
        <FlowchainBuilderModal
          campaignId={campaignId}
          onClose={() => setShowFlowBuilder(false)}
          onSuccess={handleFlowCreated}
        />
      )}

      {showEditModal && (
        <EditFlowchainModal
          flowChainId={editingFlowChainId}
          onClose={() => {
            setShowEditModal(false);
            setEditingFlowChainId(null);
          }}
          onSuccess={handleFlowEdited}
        />
      )}

      {showAssignWorkflowModal && (
        <AssignWorkflowModal
          asset={selectedAsset}
          flows={flowsData?.flows || []}
          campaignId={campaignId}
          onClose={() => {
            setShowAssignWorkflowModal(false);
            setSelectedAsset(null);
          }}
          onSuccess={() => {
            setShowAssignWorkflowModal(false);
            setSelectedAsset(null);
            loadAssets();
          }}
        />
      )}

      {showManualApprovalModal && (
        <ManualApprovalModal
          asset={selectedAsset}
          flows={flowsData?.flows || []}  
          onClose={() => {
            setShowManualApprovalModal(false);
            setSelectedAsset(null);
          }}
          onSuccess={() => {
            setShowManualApprovalModal(false);
            setSelectedAsset(null);
            loadAssets();
          }}
        />
      )}
    </>
  );
}

// ============ FLOW VISUALIZATION (REFACTORED) ============
function FlowVisualization({ flow, onSetDefault, onEdit, canManageWorkflow }) {
  if (!flow) return null;

  const hasStages = flow.flowChain.stages && flow.flowChain.stages.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {flow.flowChain.name}
            </h3>
            {flow.flowChain.description && (
              <p className="text-sm text-gray-600">{flow.flowChain.description}</p>
            )}
          </div>
          {flow.isDefault && (
            <span className="flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
              <Star className="w-4 h-4 fill-current" />
              Default Workflow
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
          {hasStages && (
            <>
              <span className="flex items-center gap-1">
                <Layers className="w-4 h-4" />
                {flow.flowChain.totalStages} stage{flow.flowChain.totalStages !== 1 ? 's' : ''}
              </span>
              <span>•</span>
            </>
          )}
          <span className="flex items-center gap-1">
            <GitBranch className="w-4 h-4" />
            {flow.flowChain.totalSteps} step{flow.flowChain.totalSteps !== 1 ? 's' : ''}
          </span>
          <span>•</span>
          <span>Created {new Date(flow.flowChain.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="p-6">
        {hasStages ? (
          <StageBasedView flow={flow} />
        ) : (
          <LegacyFlatView flow={flow} />
        )}
      </div>

      {canManageWorkflow && (
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            {!flow.isDefault && (
              <button 
                onClick={() => onSetDefault(flow.id)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium text-sm"
              >
                Set as Default
              </button>
            )}
            <button 
              onClick={() => onEdit(flow.flowChain.id)}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Edit Workflow
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ STAGE-BASED VIEW (NEW) ============
function StageBasedView({ flow }) {
  const getExecutionIcon = (mode) => {
    const icons = {
      SEQUENTIAL: PlayCircle,
      PARALLEL: Split,
      CONDITIONAL: GitBranch
    };
    return icons[mode] || PlayCircle;
  };

  const getExecutionColor = (mode) => {
    const colors = {
      SEQUENTIAL: 'from-blue-500 to-blue-600',
      PARALLEL: 'from-green-500 to-green-600',
      CONDITIONAL: 'from-purple-500 to-purple-600'
    };
    return colors[mode] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="space-y-6">
      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
        <Layers className="w-5 h-5 text-purple-600" />
        Workflow Stages
      </h4>

      {flow.flowChain.stages.map((stage, stageIndex) => {
        const ExecutionIcon = getExecutionIcon(stage.executionMode);
        const executionColor = getExecutionColor(stage.executionMode);

        return (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stageIndex * 0.1 }}
            className="relative"
          >
            {stageIndex < flow.flowChain.stages.length - 1 && (
              <div className="absolute left-8 top-full h-6 w-0.5 bg-gradient-to-b from-purple-300 to-transparent z-0" />
            )}

            <div className="relative border-2 border-purple-200 rounded-xl bg-gradient-to-br from-purple-50/50 to-blue-50/50 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 px-6 py-4 border-b border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${executionColor} rounded-xl flex items-center justify-center text-white font-bold shadow-lg`}>
                      {stageIndex + 1}
                    </div>
                    <div>
                      <h5 className="text-lg font-bold text-gray-900">{stage.name}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <ExecutionIcon className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">
                          {stage.executionMode.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          • {stage.steps.length} step{stage.steps.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {stage.executionMode === 'PARALLEL' && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <Split className="w-3.5 h-3.5" />
                      All steps run simultaneously
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className={`grid gap-4 ${
                  stage.executionMode === 'PARALLEL' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {stage.steps.map((step, stepIndex) => (
                    <StepCard 
                      key={step.id} 
                      step={step} 
                      stepNumber={stepIndex + 1}
                      isParallel={stage.executionMode === 'PARALLEL'}
                      showConnector={stage.executionMode === 'SEQUENTIAL' && stepIndex < stage.steps.length - 1}
                    />
                  ))}
                </div>
              </div>

              {stage.transitions && stage.transitions.length > 0 && (
                <div className="px-6 pb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" />
                      Stage Transitions
                    </p>
                    <div className="space-y-2">
                      {stage.transitions.map((transition, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-blue-800">
                          {transition.condition === 'all_approved' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span>
                            When {transition.condition.replace('_', ' ')} → <strong>{transition.toStage.name}</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ============ STEP CARD COMPONENT (NEW) ============
function StepCard({ step, stepNumber, isParallel, showConnector }) {
  const [showDetails, setShowDetails] = useState(false);

  const getApprovalPolicyBadge = (policy) => {
    const configs = {
      ALL_MUST_APPROVE: { text: 'All Approve', color: 'bg-red-100 text-red-700', icon: '🔴' },
      ANY_CAN_APPROVE: { text: 'Any Approve', color: 'bg-green-100 text-green-700', icon: '🟢' },
      MAJORITY_MUST_APPROVE: { text: 'Majority', color: 'bg-yellow-100 text-yellow-700', icon: '🟡' }
    };
    return configs[policy] || configs.ALL_MUST_APPROVE;
  };

  const policyConfig = getApprovalPolicyBadge(step.approvalPolicy);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      {showConnector && (
        <div className="absolute left-6 top-full h-4 w-0.5 bg-gray-300 z-0" />
      )}

      <div className={`relative bg-white rounded-lg border-2 ${
        isParallel ? 'border-green-200' : 'border-gray-200'
      } p-4 hover:shadow-md transition-all`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 ${
              isParallel ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gradient-to-br from-blue-500 to-purple-500'
            } rounded-lg flex items-center justify-center text-white font-bold text-sm shadow`}>
              {stepNumber}
            </div>
            <div className="min-w-0">
              <h6 className="font-semibold text-gray-900 text-sm truncate">
                {step.name}
              </h6>
              <p className="text-xs text-gray-500">Order: {step.orderInStage}</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {step.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {step.description}
          </p>
        )}

        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Users className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs font-medium text-gray-700">
              {step.assignedRoles.length} Role(s)
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {step.assignedRoles.slice(0, 3).map((ar, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium"
                title={ar.required ? 'Required approver' : 'Optional approver'}
              >
                {ar.roleName}
                {ar.required && <span className="text-red-500">*</span>}
              </span>
            ))}
            {step.assignedRoles.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                +{step.assignedRoles.length - 3}
              </span>
            )}
          </div>
        </div>

        <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${policyConfig.color}`}>
          <span>{policyConfig.icon}</span>
          <span>{policyConfig.text}</span>
        </div>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 pt-3 border-t border-gray-200 space-y-2"
            >
              {step.assignedRoles.length > 3 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">All Assigned Roles:</p>
                  <div className="space-y-1">
                    {step.assignedRoles.map((ar, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700">{ar.roleName}</span>
                        <span className={`px-1.5 py-0.5 rounded ${
                          ar.required ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {ar.required ? 'Required' : 'Optional'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step.transitions && step.transitions.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Transitions:</p>
                  <div className="space-y-1">
                    {step.transitions.map((transition, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-600">
                        {transition.condition === 'SUCCESS' ? (
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-600" />
                        )}
                        <span>
                          {transition.condition} → {transition.toStep.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ============ LEGACY FLAT VIEW ============
function LegacyFlatView({ flow }) {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-900">Workflow Steps</h4>
      {flow.flowChain.steps.map((step, index) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="relative">
            {index < flow.flowChain.steps.length - 1 && (
              <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gray-200 -mb-3" />
            )}
            
            <div className="relative bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold text-gray-900 mb-1">
                    {step.name}
                  </h5>
                  {step.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {step.description}
                    </p>
                  )}
                  
                  {step.assignedRoles && step.assignedRoles.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {step.assignedRoles.map((ar, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium"
                        >
                          {ar.roleName}{ar.required ? ' *' : ''}
                        </span>
                      ))}
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {step.approvalPolicy?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ) : step.role ? (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        Role: {step.role.name}
                      </span>
                    </div>
                  ) : null}
                  
                  {step.transitions && step.transitions.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {step.transitions.map((transition) => (
                        <div
                          key={transition.id}
                          className="flex items-center gap-2 text-xs"
                        >
                          {transition.condition === 'SUCCESS' ? (
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-600" />
                          )}
                          <span className="text-gray-600">
                            On {transition.condition.toLowerCase()} → {transition.toStep.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ============ ASSET WORKFLOWS VIEW ============
function AssetWorkflowsView({ assets, loadingAssets, flows, onAssignWorkflow, onManualApproval, onRefresh, canManageWorkflow }) {
  const [filterWorkflow, setFilterWorkflow] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssets = assets.filter(asset => {
    if (filterWorkflow !== 'all') {
      if (!asset.workflow || asset.workflow.flowChain.id !== filterWorkflow) return false;
    }
    if (filterStatus !== 'all') {
      if (!asset.workflow || asset.workflow.status !== filterStatus) return false;
    }
    if (filterType !== 'all' && asset.displayType !== filterType) return false;
    if (searchQuery && !asset.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getStatusColor = (status) => {
    const colors = {
      'in_progress': 'bg-blue-100 text-blue-700',
      'awaiting_review': 'bg-yellow-100 text-yellow-700',
      'approved': 'bg-green-100 text-green-700',
      'rejected': 'bg-red-100 text-red-700',
      'changes_requested': 'bg-orange-100 text-orange-700',
      'completed': 'bg-purple-100 text-purple-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getTypeColor = (type) => {
    const colors = {
      'VIDEO': 'bg-blue-100 text-blue-700',
      'IMAGE': 'bg-green-100 text-green-700',
      'DOCUMENT': 'bg-purple-100 text-purple-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  if (loadingAssets) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const stats = {
    total: filteredAssets.length,
    withWorkflow: filteredAssets.filter(a => a.workflow).length,
    withoutWorkflow: filteredAssets.filter(a => !a.workflow).length,
    inProgress: filteredAssets.filter(a => a.workflow?.status === 'in_progress').length,
    completed: filteredAssets.filter(a => a.workflow?.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Layers className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">With Workflow</p>
              <p className="text-2xl font-bold text-blue-600">{stats.withWorkflow}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">No Workflow</p>
              <p className="text-2xl font-bold text-gray-600">{stats.withoutWorkflow}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="VIDEO">Videos</option>
            <option value="IMAGE">Images</option>
            <option value="DOCUMENT">Documents</option>
          </select>

          <select
            value={filterWorkflow}
            onChange={(e) => setFilterWorkflow(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Workflows</option>
            {flows.map(flow => (
              <option key={flow.flowChain.id} value={flow.flowChain.id}>
                {flow.flowChain.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="in_progress">In Progress</option>
            <option value="awaiting_review">Awaiting Review</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
          </select>

          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Workflow</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Step</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
                {canManageWorkflow && (
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={canManageWorkflow ? "7" : "6"} className="px-4 py-12 text-center">
                    <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">No assets found</p>
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => {
                  const Icon = asset.icon;
                  return (
                    <tr key={`${asset.type}-${asset.id}`} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2" title={asset.filename}>
                          <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 max-w-[200px]">
                            <p className="text-sm font-medium text-gray-900 truncate">{asset.title}</p>
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${getTypeColor(asset.displayType)}`}>
                              {asset.displayType}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {asset.workflow ? (
                          <div className="flex items-center gap-1.5" title={asset.workflow.flowChain.name}>
                            <GitBranch className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                            <span className="text-sm text-gray-900 truncate max-w-[150px]">
                              {asset.workflow.flowChain.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {asset.workflow?.currentStep ? (
                          <div className="group/step relative">
                            <p className="text-sm text-gray-900 truncate max-w-[120px]">
                              {asset.workflow.currentStep.name}
                            </p>
                            {asset.workflow.currentStep.description && (
                              <div className="hidden group-hover/step:block absolute z-10 bottom-full left-0 mb-2 p-2 bg-gray-900 text-white text-xs rounded shadow-lg max-w-[200px]">
                                {asset.workflow.currentStep.description}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {asset.workflow?.status ? (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(asset.workflow.status)}`}>
                            {asset.workflow.status.replace(/_/g, ' ')}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {asset.workflow?.progress ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5 min-w-[60px]">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full transition-all"
                                style={{ width: `${asset.workflow.progress.percentage}%` }}
                                title={`${asset.workflow.progress.percentage}%`}
                              />
                            </div>
                            <span className="text-xs text-gray-600 whitespace-nowrap">
                              {asset.workflow.progress.currentStep}/{asset.workflow.progress.totalSteps}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {asset.workflow?.assignedTo ? (
                          <div className="group/assigned relative flex items-center gap-2">
                            {asset.workflow.assignedTo.avatarUrl ? (
                              <img 
                                src={asset.workflow.assignedTo.avatarUrl} 
                                alt=""
                                className="w-6 h-6 rounded-full"
                                title={asset.workflow.assignedTo.name}
                              />
                            ) : (
                              <Users className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-sm text-gray-900 truncate max-w-[100px]">
                              {asset.workflow.assignedTo.name.split(' ')[0]}
                            </span>
                            <div className="hidden group-hover/assigned:block absolute z-10 bottom-full left-0 mb-2 p-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap">
                              <p>{asset.workflow.assignedTo.name}</p>
                              {asset.workflow.assignedToRole && (
                                <p className="text-gray-300">{asset.workflow.assignedToRole.name}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Unassigned</span>
                        )}
                      </td>

                      {canManageWorkflow && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onAssignWorkflow(asset)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Assign/Change Workflow"
                            >
                              <Tag className="w-3.5 h-3.5" />
                            </button>
                            {asset.workflow && (
                              <button
                                onClick={() => onManualApproval(asset)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Manual Approval"
                              >
                                <FastForward className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============ MODALS (Keeping existing implementations) ============
function AssignWorkflowModal({ asset, flows, campaignId, onClose, onSuccess }) {
  const [selectedFlowId, setSelectedFlowId] = useState('');
  const [assignToAll, setAssignToAll] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!selectedFlowId) {
      return showError('Validation Error', 'Please select a workflow');
    }

    setLoading(true);
    showLoading('Assigning workflow...', 'Please wait');

    try {
      const endpoint = assignToAll 
        ? `/api/workflows/assign-bulk`
        : `/api/workflows/assign`;

      const body = assignToAll
        ? {
            campaignId: campaignId,
            assetType: asset.type,
            flowChainId: selectedFlowId
          }
        : {
            assetId: asset.id,
            assetType: asset.type,
            flowChainId: selectedFlowId
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign workflow');
      }

      closeSwal();
      await showSuccess('Success!', assignToAll ? 'Workflow assigned to all assets' : 'Workflow assigned successfully');
      onSuccess();
    } catch (error) {
      closeSwal();
      await showError('Assignment Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Assign Workflow</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              {React.createElement(asset.icon, { className: "w-8 h-8 text-blue-600" })}
              <div>
                <p className="font-medium text-gray-900">{asset.title}</p>
                <p className="text-sm text-gray-600">{asset.displayType} • {asset.filename}</p>
              </div>
            </div>
          </div>

          {asset.workflow && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-900">
                <strong>Current Workflow:</strong> {asset.workflow.flowChain.name}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Assigning a new workflow will replace the current one
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Workflow *
            </label>
            <select
              value={selectedFlowId}
              onChange={(e) => setSelectedFlowId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a workflow...</option>
              {flows.map(flow => (
                <option key={flow.flowChain.id} value={flow.flowChain.id}>
                  {flow.flowChain.name} {flow.isDefault ? '★ Default' : ''} ({flow.flowChain.totalSteps} steps)
                </option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={assignToAll}
                onChange={(e) => setAssignToAll(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Apply to all {asset.displayType.toLowerCase()}s in this campaign
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  This will assign the selected workflow to all {asset.displayType.toLowerCase()} assets
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading || !selectedFlowId}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <Tag className="w-4 h-4" />
                Assign Workflow
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ManualApprovalModal({ asset, flows=[], onClose, onSuccess }) {
  const [selectedStepId, setSelectedStepId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const fullWorkflow = flows.find(f => f.flowChain.id === asset.workflow?.flowChain?.id);
  const allSteps = fullWorkflow?.flowChain?.steps || [];
  const currentStepId = asset.workflow?.currentStep?.id;
  const currentStepIndex = allSteps.findIndex(s => s.id === currentStepId);
  const nextSteps = currentStepIndex >= 0 ? allSteps.slice(currentStepIndex + 1) : [];

  const handleApprove = async () => {
    if (!selectedStepId) {
      return showError('Validation Error', 'Please select a target step');
    }

    if (!reason.trim()) {
      return showError('Validation Error', 'Please provide a reason for manual approval');
    }

    setLoading(true);
    showLoading('Processing approval...', 'Please wait');

    try {
      const response = await fetch(`/api/workflows/manual-approve`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: asset.id,
          assetType: asset.type,
          workflowId: asset.workflow.id,
          targetStepId: selectedStepId,
          reason: reason
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve');
      }

      closeSwal();
      await showSuccess('Approved!', 'Asset workflow state updated successfully');
      onSuccess();
    } catch (error) {
      closeSwal();
      await showError('Approval Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <FastForward className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Manual Approval</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-900">
              <p className="font-medium mb-1">⚠️ Manual Override</p>
              <p>This will bypass the normal workflow process and move the asset to the selected step.</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-3">
              {React.createElement(asset.icon, { className: "w-6 h-6 text-gray-600" })}
              <div>
                <p className="font-medium text-gray-900">{asset.title}</p>
                <p className="text-sm text-gray-600">{asset.displayType}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200 space-y-1">
              <p className="text-sm text-gray-600">
                <strong>Workflow:</strong> {asset.workflow.flowChain.name}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Current Step:</strong> {asset.workflow.currentStep.name}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Advance to Step *
            </label>
            {nextSteps.length === 0 ? (
              <div className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3 border border-amber-200">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                No subsequent steps available. This asset is at the final step.
              </div>
            ) : (
              <select
                value={selectedStepId}
                onChange={(e) => setSelectedStepId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select target step...</option>
                {nextSteps.map((step, index) => (
                  <option key={step.id} value={step.id}>
                    Step {currentStepIndex + index + 2}: {step.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {nextSteps.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Manual Approval *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this manual approval is needed..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4}
              />
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={loading || !selectedStepId || !reason.trim() || nextSteps.length === 0}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Approve & Advance
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
