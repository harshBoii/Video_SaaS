'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Link2, 
  Loader2,
  GitBranch,
  Upload,
  Eye,
  Edit,
  Send,
  Archive,
  AlertCircle,
  Video,
  Image as ImageIcon,
  FileText,
  File,
  Layers,
  Cog,
  Wand2,
  Scissors,
  Palette,
  Music,
  Type,
  CheckCircle2,
  XCircle,
  Users,
  PlayCircle,
  Split,
  Settings
} from 'lucide-react';
import { showSuccess, showError, showConfirm, showLoading, closeSwal } from '@/app/lib/swal';

// Execution modes
const EXECUTION_MODES = {
  SEQUENTIAL: { id: 'SEQUENTIAL', label: 'Sequential', icon: PlayCircle, description: 'Steps run one after another' },
  PARALLEL: { id: 'PARALLEL', label: 'Parallel', icon: Split, description: 'All steps run simultaneously' },
  CONDITIONAL: { id: 'CONDITIONAL', label: 'Conditional', icon: GitBranch, description: 'Steps run based on conditions' }
};

// Approval policies
const APPROVAL_POLICIES = {
  ALL_MUST_APPROVE: { id: 'ALL_MUST_APPROVE', label: 'All Must Approve', description: 'Every assigned role must approve' },
  ANY_CAN_APPROVE: { id: 'ANY_CAN_APPROVE', label: 'Any Can Approve', description: 'First approval passes the step' },
  MAJORITY_MUST_APPROVE: { id: 'MAJORITY_MUST_APPROVE', label: 'Majority Must Approve', description: '50%+ of roles must approve' }
};

const WORKFLOW_ACTIONS = {
  UPLOAD: { id: 'UPLOAD', label: 'Upload', icon: Upload, color: 'blue' },
  REVIEW: { id: 'REVIEW', label: 'Review', icon: Eye, color: 'yellow' },
  EDIT: { id: 'EDIT', label: 'Edit', icon: Edit, color: 'orange' },
  PROCESS: { id: 'PROCESS', label: 'Process', icon: Cog, color: 'purple' },
  ENHANCE: { id: 'ENHANCE', label: 'Enhance', icon: Wand2, color: 'pink' },
  CUT: { id: 'CUT', label: 'Cut/Trim', icon: Scissors, color: 'teal' },
  COLOR_GRADE: { id: 'COLOR_GRADE', label: 'Color Grade', icon: Palette, color: 'indigo' },
  ADD_AUDIO: { id: 'ADD_AUDIO', label: 'Add Audio', icon: Music, color: 'cyan' },
  ADD_TEXT: { id: 'ADD_TEXT', label: 'Add Text', icon: Type, color: 'lime' },
  PUBLISH: { id: 'PUBLISH', label: 'Publish', icon: Send, color: 'green' },
  ARCHIVE: { id: 'ARCHIVE', label: 'Archive', icon: Archive, color: 'gray' }
};

const ASSET_TYPES = {
  VIDEO: { id: 'VIDEO', label: 'Videos', icon: Video },
  IMAGE: { id: 'IMAGE', label: 'Images', icon: ImageIcon },
  DOCUMENT: { id: 'DOCUMENT', label: 'Documents', icon: FileText },
  SCRIPT: { id: 'SCRIPT', label: 'Scripts', icon: File },
  ALL_ASSETS: { id: 'ALL_ASSETS', label: 'All Assets', icon: Layers }
};

export default function EditFlowchainModal({ flowChainId, onClose, onSuccess }) {
  const [roles, setRoles] = useState([]);
  const [chainName, setChainName] = useState('');
  const [chainDesc, setChainDesc] = useState('');
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);
  
  const [showStepModal, setShowStepModal] = useState(false);
  const [currentStageId, setCurrentStageId] = useState(null);
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [transitionType, setTransitionType] = useState('step');
  const [transitionFromId, setTransitionFromId] = useState(null);

  useEffect(() => {
    loadData();
  }, [flowChainId]);

const loadData = async () => {
  setDataLoading(true);
  try {
    const authRes = await fetch('/api/auth/me', { credentials: 'include' });
    const authData = await authRes.json();
    const userCompanyId = authData.employee?.companyId;
    setCompanyId(userCompanyId);

    const [rolesRes, flowchainRes] = await Promise.all([
      fetch(`/api/admin/companies/${userCompanyId}/roles`, { credentials: 'include' }),
      fetch(`/api/flowchains/${flowChainId}`, { credentials: 'include' }),
    ]);

    if (!rolesRes.ok || !flowchainRes.ok) throw new Error('Failed to load data');

    const rolesData = await rolesRes.json();
    const flowchainData = await flowchainRes.json();

    console.log('📥 Loaded flowchain data:', flowchainData.data); // Debug log

    setRoles(rolesData.data || []);
    setChainName(flowchainData.data.name || '');
    setChainDesc(flowchainData.data.description || '');

    // Transform existing data to match creation modal structure
    const hasStages = flowchainData.data.stages && flowchainData.data.stages.length > 0;

    if (hasStages) {
      // ✅ Advanced workflow with stages
      const transformedStages = flowchainData.data.stages.map(stage => ({
        id: crypto.randomUUID(),
        name: stage.name,
        executionMode: stage.executionMode || 'SEQUENTIAL',
        order: stage.order,
        steps: (stage.steps || []).map(step => ({
          id: crypto.randomUUID(),
          action: step.action || 'REVIEW',
          assetType: step.assetType || 'VIDEO',
          description: step.description || '',
          // ✅ Fix: Access nested role.id from assignedRoles
          assignedRoles: step.assignedRoles?.map(ar => ({
            roleId: ar.role?.id || ar.roleId, // Handle both structures
            required: ar.required !== undefined ? ar.required : true,
          })) || (step.roleId ? [{ roleId: step.roleId, required: true }] : []),
          approvalPolicy: step.approvalPolicy || 'ALL_MUST_APPROVE',
          transitions: (step.transitions || step.nextSteps || []).map(t => ({
            condition: t.condition || 'SUCCESS',
            toStepId: crypto.randomUUID(), // Will need to map this properly
          })),
          orderInStage: step.orderInStage,
        })),
        transitions: (stage.transitions || stage.transitionsFrom || []).map(t => ({
          condition: t.condition || 'all_approved',
          toStageId: crypto.randomUUID(), // Will need to map this properly
        }))
      }));

      console.log('✅ Transformed stages:', transformedStages); // Debug log
      setStages(transformedStages);
    } else {
      // ✅ Legacy flat workflow - convert to single stage
      const flatSteps = (flowchainData.data.steps || []);
      
      if (flatSteps.length > 0) {
        const transformedSteps = flatSteps.map(step => ({
          id: crypto.randomUUID(),
          action: step.action || 'REVIEW',
          assetType: step.assetType || 'VIDEO',
          description: step.description || '',
          // ✅ Handle both assignedRoles and legacy roleId
          assignedRoles: step.assignedRoles?.length > 0
            ? step.assignedRoles.map(ar => ({
                roleId: ar.role?.id || ar.roleId,
                required: ar.required !== undefined ? ar.required : true,
              }))
            : step.roleId 
              ? [{ roleId: step.roleId, required: true }]
              : step.role?.id
                ? [{ roleId: step.role.id, required: true }]
                : [],
          approvalPolicy: step.approvalPolicy || 'ALL_MUST_APPROVE',
          transitions: [],
          orderInStage: 1,
        }));

        const stageTempId = crypto.randomUUID();
        console.log('✅ Converted legacy steps to stage:', transformedSteps); // Debug log
        setStages([{
          id: stageTempId,
          name: 'Main Stage',
          order: 1,
          executionMode: 'SEQUENTIAL',
          steps: transformedSteps,
          transitions: []
        }]);
      } else {
        // ✅ Empty workflow - start with blank stage
        console.log('⚠️ No steps found, starting fresh');
        setStages([{
          id: crypto.randomUUID(),
          name: 'Stage 1',
          executionMode: 'SEQUENTIAL',
          order: 1,
          steps: [],
          transitions: []
        }]);
      }
    }

  } catch (error) {
    console.error('❌ Error loading data:', error);
    await showError('Load Failed', 'Failed to load flowchain data');
    onClose();
  } finally {
    setDataLoading(false);
  }
};


  // ============ STAGE MANAGEMENT (Same as creation modal) ============
  const addStage = () => {
    const newStage = {
      id: crypto.randomUUID(),
      name: `Stage ${stages.length + 1}`,
      executionMode: 'SEQUENTIAL',
      order: stages.length + 1,
      steps: [],
      transitions: []
    };
    setStages([...stages, newStage]);
  };

  const updateStage = (stageId, field, value) => {
    setStages(prev => prev.map(s => s.id === stageId ? { ...s, [field]: value } : s));
  };

  const deleteStage = async (stageId) => {
    const result = await showConfirm('Delete Stage?', 'This will delete all steps in this stage', 'Yes, Delete', 'Cancel');
    if (result.isConfirmed) {
      setStages(prev => prev.filter(s => s.id !== stageId));
    }
  };

  // ============ STEP MANAGEMENT (Same as creation modal) ============
  const addStepToStage = (stageId) => {
    setCurrentStageId(stageId);
    setShowStepModal(true);
  };

  const createStep = (stepData) => {
    const newStep = {
      id: crypto.randomUUID(),
      action: stepData.action,
      assetType: stepData.assetType,
      description: stepData.description,
      assignedRoles: stepData.assignedRoles,
      approvalPolicy: stepData.approvalPolicy,
      transitions: [],
      orderInStage: 0
    };

    setStages(prev => prev.map(stage => 
      stage.id === currentStageId 
        ? { ...stage, steps: [...stage.steps, { ...newStep, orderInStage: stage.steps.length + 1 }] }
        : stage
    ));
    setShowStepModal(false);
  };

  const deleteStep = async (stageId, stepId) => {
    const result = await showConfirm('Delete Step?', 'Are you sure?', 'Yes, Delete', 'Cancel');
    if (result.isConfirmed) {
      setStages(prev => prev.map(stage => 
        stage.id === stageId 
          ? { ...stage, steps: stage.steps.filter(s => s.id !== stepId) }
          : stage
      ));
    }
  };

  // ============ TRANSITION MANAGEMENT (Same as creation modal) ============
  const addTransition = (type, fromId) => {
    setTransitionType(type);
    setTransitionFromId(fromId);
    setShowTransitionModal(true);
  };

  const handleAddTransition = (transitionData) => {
    if (transitionType === 'step') {
      setStages(prev => prev.map(stage => ({
        ...stage,
        steps: stage.steps.map(step => 
          step.id === transitionFromId 
            ? { ...step, transitions: [...step.transitions, transitionData] }
            : step
        )
      })));
    } else {
      setStages(prev => prev.map(stage =>
        stage.id === transitionFromId
          ? { ...stage, transitions: [...stage.transitions, transitionData] }
          : stage
      ));
    }
    setShowTransitionModal(false);
  };

  // ============ SUBMIT (Update instead of Create) ============
  const handleSubmit = async () => {
    if (!chainName.trim()) return showError('Validation Error', 'Please enter a workflow name');
    if (stages.length === 0) return showError('Validation Error', 'Please add at least one stage');
    
    const stepsWithoutRoles = stages.flatMap(s => s.steps).filter(step => step.assignedRoles.length === 0);
    if (stepsWithoutRoles.length > 0) {
      return showError('Validation Error', 'All steps must have at least one assigned role');
    }

    setLoading(true);
    showLoading('Updating workflow...', 'Please wait');

    try {
      const response = await fetch(`/api/flowchains/${flowChainId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: chainName,
          description: chainDesc,
          companyId,
          stages: stages.map((stage, idx) => ({
            name: stage.name,
            order: idx + 1,
            executionMode: stage.executionMode,
            steps: stage.steps.map((step, stepIdx) => ({
              name: `${WORKFLOW_ACTIONS[step.action]?.label} ${ASSET_TYPES[step.assetType]?.label}`,
              description: step.description,
              action: step.action,
              assetType: step.assetType,
              orderInStage: stepIdx + 1,
              approvalPolicy: step.approvalPolicy,
              assignedRoles: step.assignedRoles,
              transitions: step.transitions
            })),
            transitions: stage.transitions
          }))
        }),
      });

      if (!response.ok) throw new Error('Failed to update workflow');

      closeSwal();
      await showSuccess('Success!', 'Workflow updated successfully');
      onSuccess();
    } catch (err) {
      closeSwal();
      await showError('Error!', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <GitBranch className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit Workflow</h2>
                  <p className="text-sm text-gray-600">Multi-stage workflows with parallel execution & multi-approver steps</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {dataLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Warning Banner */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">⚠️ Editing Active Workflow</p>
                    <p>Changes will affect all campaigns using this workflow.</p>
                  </div>
                </div>

                {/* Flow Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Workflow Name *</label>
                    <input
                      value={chainName}
                      onChange={(e) => setChainName(e.target.value)}
                      placeholder="e.g., Video Production Pipeline"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <input
                      value={chainDesc}
                      onChange={(e) => setChainDesc(e.target.value)}
                      placeholder="Brief description..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Stages */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Workflow Stages</h3>
                  <button
                    onClick={addStage}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Stage
                  </button>
                </div>

                {stages.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <button onClick={addStage} className="text-blue-600 hover:text-blue-700 font-medium">
                      Add your first stage
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {stages.map((stage, stageIdx) => {
                      const ExecutionIcon = EXECUTION_MODES[stage.executionMode]?.icon || PlayCircle;
                      
                      return (
                        <motion.div
                          key={stage.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border-2 border-purple-200 rounded-xl p-5 bg-gradient-to-br from-purple-50/50 to-blue-50/50"
                        >
                          {/* Stage Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                                {stageIdx + 1}
                              </div>
                              <div>
                                <input
                                  value={stage.name}
                                  onChange={(e) => updateStage(stage.id, 'name', e.target.value)}
                                  className="text-lg font-semibold bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-purple-500 outline-none"
                                />
                                <div className="flex items-center gap-2 mt-1">
                                  <ExecutionIcon className="w-4 h-4 text-gray-500" />
                                  <select
                                    value={stage.executionMode}
                                    onChange={(e) => updateStage(stage.id, 'executionMode', e.target.value)}
                                    className="text-xs text-gray-600 bg-white border border-gray-200 rounded px-2 py-1"
                                  >
                                    {Object.values(EXECUTION_MODES).map(mode => (
                                      <option key={mode.id} value={mode.id}>{mode.label}</option>
                                    ))}
                                  </select>
                                  <span className="text-xs text-gray-500">
                                    {EXECUTION_MODES[stage.executionMode]?.description}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => deleteStage(stage.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Steps in Stage */}
                          <div className="ml-12 space-y-3">
                            {stage.steps.length === 0 ? (
                              <div className="text-center py-6 bg-white/50 rounded-lg border border-dashed border-gray-300">
                                <p className="text-sm text-gray-500 mb-2">No steps in this stage</p>
                                <button
                                  onClick={() => addStepToStage(stage.id)}
                                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                                >
                                  Add Step
                                </button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {stage.steps.map((step) => {
                                  const ActionIcon = WORKFLOW_ACTIONS[step.action]?.icon;
                                  const AssetIcon = ASSET_TYPES[step.assetType]?.icon;
                                  
                                  return (
                                    <div key={step.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <ActionIcon className="w-5 h-5 text-purple-600" />
                                          <AssetIcon className="w-4 h-4 text-gray-500" />
                                        </div>
                                        <button
                                          onClick={() => deleteStep(stage.id, step.id)}
                                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                      
                                      <p className="text-sm font-semibold text-gray-900 mb-2">
                                        {WORKFLOW_ACTIONS[step.action]?.label} {ASSET_TYPES[step.assetType]?.label}
                                      </p>
                                      
                                      <div className="mb-2">
                                        <div className="flex items-center gap-1 mb-1">
                                          <Users className="w-3 h-3 text-gray-500" />
                                          <span className="text-xs font-medium text-gray-700">
                                            {step.assignedRoles.length} Role(s)
                                          </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {step.assignedRoles.map((ar, idx) => {
                                            const role = roles.find(r => r.id === ar.roleId);
                                            return (
                                              <span
                                                key={idx}
                                                className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded"
                                              >
                                                {role?.name}{ar.required ? '*' : ''}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      </div>
                                      
                                      <div className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                                        {APPROVAL_POLICIES[step.approvalPolicy]?.label}
                                      </div>
                                      
                                      <button
                                        onClick={() => addTransition('step', step.id)}
                                        className="w-full mt-2 text-xs text-purple-600 hover:bg-purple-50 py-1.5 rounded"
                                      >
                                        + Add Transition
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            
                            <button
                              onClick={() => addStepToStage(stage.id)}
                              className="w-full py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg border border-purple-200"
                            >
                              <Plus className="w-4 h-4 inline mr-1" />
                              Add Step to Stage
                            </button>
                          </div>

                          <button
                            onClick={() => addTransition('stage', stage.id)}
                            className="ml-12 mt-2 text-xs text-blue-600 hover:underline"
                          >
                            + Add Stage Transition
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || stages.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Updating...' : 'Update Workflow'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Step Creation Modal (Same as creation modal) */}
      {showStepModal && (
        <StepModal
          roles={roles}
          onClose={() => setShowStepModal(false)}
          onCreate={createStep}
        />
      )}

      {/* Transition Modal (Same as creation modal) */}
      {showTransitionModal && (
        <TransitionModal
          type={transitionType}
          stages={stages}
          fromId={transitionFromId}
          onClose={() => setShowTransitionModal(false)}
          onAdd={handleAddTransition}
        />
      )}
    </>
  );
}

// ============ STEP CREATION MODAL (Same as creation modal) ============
function StepModal({ roles, onClose, onCreate }) {
  const [action, setAction] = useState('UPLOAD');
  const [assetType, setAssetType] = useState('VIDEO');
  const [description, setDescription] = useState('');
  const [assignedRoles, setAssignedRoles] = useState([]);
  const [approvalPolicy, setApprovalPolicy] = useState('ALL_MUST_APPROVE');

  const addRole = () => {
    setAssignedRoles([...assignedRoles, { roleId: roles[0]?.id || '', required: true }]);
  };

  const updateRole = (idx, field, value) => {
    setAssignedRoles(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const removeRole = (idx) => {
    setAssignedRoles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreate = () => {
    if (assignedRoles.length === 0) {
      return showError('Validation Error', 'Assign at least one role');
    }
    onCreate({ action, assetType, description, assignedRoles, approvalPolicy });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4">Create Step</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
              <select value={action} onChange={(e) => setAction(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                {Object.values(WORKFLOW_ACTIONS).map(a => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Asset Type</label>
              <select value={assetType} onChange={(e) => setAssetType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                {Object.values(ASSET_TYPES).map(a => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={2}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Assigned Roles *</label>
              <button onClick={addRole} className="text-sm text-purple-600 hover:text-purple-700">
                + Add Role
              </button>
            </div>
            <div className="space-y-2">
              {assignedRoles.map((ar, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={ar.roleId}
                    onChange={(e) => updateRole(idx, 'roleId', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={ar.required}
                      onChange={(e) => updateRole(idx, 'required', e.target.checked)}
                      className="w-4 h-4"
                    />
                    Required
                  </label>
                  <button onClick={() => removeRole(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {assignedRoles.filter(ar => ar.required).length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Approval Policy</label>
              <select
                value={approvalPolicy}
                onChange={(e) => setApprovalPolicy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {Object.values(APPROVAL_POLICIES).map(p => (
                  <option key={p.id} value={p.id}>{p.label} - {p.description}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
          <button onClick={handleCreate} className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg">
            Create Step
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ============ TRANSITION MODAL (Same as creation modal) ============
function TransitionModal({ type, stages, fromId, onClose, onAdd }) {
  const [condition, setCondition] = useState('SUCCESS');
  const [toId, setToId] = useState('');

  const targets = type === 'stage' 
    ? stages.filter(s => s.id !== fromId)
    : stages.flatMap(s => s.steps).filter(step => step.id !== fromId);

  useEffect(() => {
    if (targets.length > 0) {
      setToId(targets[0].id);
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
      >
        <h3 className="text-lg font-bold mb-4">Add {type === 'stage' ? 'Stage' : 'Step'} Transition</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="SUCCESS">✅ Success</option>
              <option value="FAILURE">❌ Failure</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Go to {type === 'stage' ? 'Stage' : 'Step'}
            </label>
            <select value={toId} onChange={(e) => setToId(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              {targets.map(t => (
                <option key={t.id} value={t.id}>
                  {type === 'stage' ? t.name : `${WORKFLOW_ACTIONS[t.action]?.label} ${ASSET_TYPES[t.assetType]?.label}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
          <button
            onClick={() => onAdd({ condition, [type === 'stage' ? 'toStageId' : 'toStepId']: toId })}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg"
          >
            Add
          </button>
        </div>
      </motion.div>
    </div>
  );
}
