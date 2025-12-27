'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Plus, Trash2, Save, Link2, Loader2, GitBranch, Upload, Eye, Edit,
  Send, Archive, AlertCircle, Video, Image as ImageIcon, FileText, File,
  Layers, Cog, Wand2, Scissors, Palette, Music, Type, CheckCircle, XCircle,
  Users, PlayCircle, Split, Settings
} from 'lucide-react';
import { showSuccess, showError, showConfirm, showLoading, closeSwal } from '@/app/lib/swal';

// ✅ Execution modes for stages
const EXECUTION_MODES = {
  SEQUENTIAL: { id: 'SEQUENTIAL', label: 'Sequential', icon: PlayCircle, description: 'Steps run one after another' },
  PARALLEL: { id: 'PARALLEL', label: 'Parallel', icon: Split, description: 'All steps run simultaneously' },
  CONDITIONAL: { id: 'CONDITIONAL', label: 'Conditional', icon: GitBranch, description: 'Steps run based on conditions' }
};

// ✅ Approval policies
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

export default function FlowchainBuilderModal({ campaignId, onClose, onSuccess }) {
  const [roles, setRoles] = useState([]);
  const [chainName, setChainName] = useState('');
  const [chainDesc, setChainDesc] = useState('');
  const [stages, setStages] = useState([]); // Changed from steps to stages
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);
  const [setAsDefault, setSetAsDefault] = useState(false);
  
  // Modals
  const [showStepModal, setShowStepModal] = useState(false);
  const [currentStageId, setCurrentStageId] = useState(null);
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [transitionType, setTransitionType] = useState('step'); // 'step' or 'stage'
  const [transitionFromId, setTransitionFromId] = useState(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setRolesLoading(true);
    try {
      const authRes = await fetch('/api/auth/me', { credentials: 'include' });
      const authData = await authRes.json();
      setCompanyId(authData.employee?.companyId);

      const response = await fetch(`/api/admin/companies/${authData.employee?.companyId}/roles`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load roles');
      const result = await response.json();
      setRoles(result.data);
    } catch (error) {
      await showError('Load Failed', 'Failed to load roles');
    } finally {
      setRolesLoading(false);
    }
  };

  // ============ STAGE MANAGEMENT ============
  const addStage = () => {
    const newStage = {
      id: crypto.randomUUID(),
      name: `Stage ${stages.length + 1}`,
      executionMode: 'SEQUENTIAL',
      order: stages.length + 1,
      steps: [],
      transitions: [] // Stage-level transitions
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

  // ============ STEP MANAGEMENT ============
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
      assignedRoles: stepData.assignedRoles, // Array of { roleId, required }
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

  // ============ TRANSITION MANAGEMENT ============
  const addTransition = (type, fromId) => {
    setTransitionType(type);
    setTransitionFromId(fromId);
    setShowTransitionModal(true);
  };

  const handleAddTransition = (transitionData) => {
    if (transitionType === 'step') {
      // Add step-to-step transition
      setStages(prev => prev.map(stage => ({
        ...stage,
        steps: stage.steps.map(step => 
          step.id === transitionFromId 
            ? { ...step, transitions: [...step.transitions, transitionData] }
            : step
        )
      })));
    } else {
      // Add stage-to-stage transition
      setStages(prev => prev.map(stage =>
        stage.id === transitionFromId
          ? { ...stage, transitions: [...stage.transitions, transitionData] }
          : stage
      ));
    }
    setShowTransitionModal(false);
  };

  // ============ SUBMIT ============
  const handleSubmit = async () => {
    if (!chainName.trim()) return showError('Validation Error', 'Please enter a workflow name');
    if (stages.length === 0) return showError('Validation Error', 'Please add at least one stage');
    
    // Validate steps have roles
    const stepsWithoutRoles = stages.flatMap(s => s.steps).filter(step => step.assignedRoles.length === 0);
    if (stepsWithoutRoles.length > 0) {
      return showError('Validation Error', 'All steps must have at least one assigned role');
    }

    setLoading(true);
    showLoading('Creating workflow...', 'Please wait');

    try {
      const response = await fetch('/api/flowchains', {
        method: 'POST',
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
              assignedRoles: step.assignedRoles, // [{ roleId, required }]
              transitions: step.transitions
            })),
            transitions: stage.transitions // Stage-level transitions
          }))
        }),
      });

      if (!response.ok) throw new Error('Failed to create workflow');

      const result = await response.json();
      const flowChainId = result.data.id;

      await fetch(`/api/admin/campaigns/${campaignId}/flows`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flowChainId, isDefault: setAsDefault }),
      });

      closeSwal();
      await showSuccess('Success!', 'Advanced workflow created');
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
                  <h2 className="text-2xl font-bold text-gray-900">Advanced Workflow Builder</h2>
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
            {rolesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
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

                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <input
                    type="checkbox"
                    id="setAsDefault"
                    checked={setAsDefault}
                    onChange={(e) => setSetAsDefault(e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="setAsDefault" className="text-sm text-gray-700">Set as default workflow</label>
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
                    <p className="text-gray-600 mb-2">No stages added yet</p>
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
                                      
                                      {/* Multi-role display */}
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
                                      
                                      {step.transitions.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                          <p className="text-xs text-gray-500 mb-1">{step.transitions.length} transition(s)</p>
                                        </div>
                                      )}
                                      
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

                          {/* Stage Transitions */}
                          {stage.transitions.length > 0 && (
                            <div className="ml-12 mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-xs font-medium text-blue-900 mb-2">Stage Transitions:</p>
                              {stage.transitions.map((t, idx) => (
                                <div key={idx} className="text-xs text-blue-700">
                                  {t.condition} → Stage {stages.findIndex(s => s.id === t.toStageId) + 1}
                                </div>
                              ))}
                            </div>
                          )}
                          
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
                {loading ? 'Saving...' : 'Create Workflow'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Step Creation Modal */}
      {showStepModal && (
        <StepModal
          roles={roles}
          onClose={() => setShowStepModal(false)}
          onCreate={createStep}
        />
      )}

      {/* Transition Modal */}
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

// ============ STEP CREATION MODAL ============
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

// ============ TRANSITION MODAL ============
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
