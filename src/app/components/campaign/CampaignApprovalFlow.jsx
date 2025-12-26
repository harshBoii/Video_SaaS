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
  CheckCircle,
  XCircle
} from 'lucide-react';
import { showSuccess, showError, showConfirm, showLoading, closeSwal } from '@/app/lib/swal';

// ✅ Workflow actions represent actual WORK activities
const WORKFLOW_ACTIONS = {
  UPLOAD: {
    id: 'UPLOAD',
    label: 'Upload',
    icon: Upload,
    color: 'blue',
    description: 'Upload new asset files',
    allowedTransitions: ['REVIEW', 'EDIT', 'PROCESS']
  },
  REVIEW: {
    id: 'REVIEW',
    label: 'Review',
    icon: Eye,
    color: 'yellow',
    description: 'Review and provide feedback on assets',
    allowedTransitions: ['UPLOAD', 'EDIT', 'PROCESS', 'PUBLISH', 'ARCHIVE']
  },
  EDIT: {
    id: 'EDIT',
    label: 'Edit',
    icon: Edit,
    color: 'orange',
    description: 'Make edits or revisions to the asset',
    allowedTransitions: ['REVIEW', 'PROCESS', 'PUBLISH']
  },
  PROCESS: {
    id: 'PROCESS',
    label: 'Process',
    icon: Cog,
    color: 'purple',
    description: 'Process asset (transcode, compress, optimize)',
    allowedTransitions: ['REVIEW', 'EDIT', 'PUBLISH']
  },
  ENHANCE: {
    id: 'ENHANCE',
    label: 'Enhance',
    icon: Wand2,
    color: 'pink',
    description: 'Apply enhancements (filters, effects, AI improvements)',
    allowedTransitions: ['REVIEW', 'EDIT', 'PROCESS', 'PUBLISH']
  },
  CUT: {
    id: 'CUT',
    label: 'Cut/Trim',
    icon: Scissors,
    color: 'teal',
    description: 'Cut, trim, or splice video segments',
    allowedTransitions: ['REVIEW', 'EDIT', 'PROCESS', 'PUBLISH']
  },
  COLOR_GRADE: {
    id: 'COLOR_GRADE',
    label: 'Color Grade',
    icon: Palette,
    color: 'indigo',
    description: 'Color correction and grading',
    allowedTransitions: ['REVIEW', 'EDIT', 'PUBLISH']
  },
  ADD_AUDIO: {
    id: 'ADD_AUDIO',
    label: 'Add Audio',
    icon: Music,
    color: 'cyan',
    description: 'Add or edit audio tracks, music, voiceover',
    allowedTransitions: ['REVIEW', 'EDIT', 'PUBLISH']
  },
  ADD_TEXT: {
    id: 'ADD_TEXT',
    label: 'Add Text/Graphics',
    icon: Type,
    color: 'lime',
    description: 'Add text overlays, subtitles, or graphics',
    allowedTransitions: ['REVIEW', 'EDIT', 'PUBLISH']
  },
  PUBLISH: {
    id: 'PUBLISH',
    label: 'Publish',
    icon: Send,
    color: 'green',
    description: 'Finalize and publish the asset',
    allowedTransitions: ['ARCHIVE', 'EDIT', 'REVIEW']
  },
  ARCHIVE: {
    id: 'ARCHIVE',
    label: 'Archive',
    icon: Archive,
    color: 'gray',
    description: 'Archive the asset',
    allowedTransitions: []
  }
};

// ✅ Asset types
const ASSET_TYPES = {
  VIDEO: {
    id: 'VIDEO',
    label: 'Videos',
    icon: Video,
    color: 'blue',
    description: 'Video files'
  },
  IMAGE: {
    id: 'IMAGE',
    label: 'Images',
    icon: ImageIcon,
    color: 'green',
    description: 'Image files'
  },
  DOCUMENT: {
    id: 'DOCUMENT',
    label: 'Documents',
    icon: FileText,
    color: 'red',
    description: 'PDF, Word, Excel files'
  },
  SCRIPT: {
    id: 'SCRIPT',
    label: 'Scripts',
    icon: File,
    color: 'purple',
    description: 'Script files'
  },
  ALL_ASSETS: {
    id: 'ALL_ASSETS',
    label: 'All Assets',
    icon: Layers,
    color: 'indigo',
    description: 'All asset types'
  }
};

// ✅ Helper to get step display name
const getStepDisplayName = (action, assetType) => {
  const actionLabel = WORKFLOW_ACTIONS[action]?.label || action;
  const assetLabel = ASSET_TYPES[assetType]?.label || assetType;
  return `${actionLabel} ${assetLabel}`;
};

// ✅ Helper to get action color
const getActionColor = (action) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    yellow: 'from-yellow-500 to-yellow-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    gray: 'from-gray-500 to-gray-600',
    indigo: 'from-indigo-500 to-indigo-600',
    pink: 'from-pink-500 to-pink-600',
    teal: 'from-teal-500 to-teal-600',
    cyan: 'from-cyan-500 to-cyan-600',
    lime: 'from-lime-500 to-lime-600'
  };
  const actionData = WORKFLOW_ACTIONS[action];
  return colors[actionData?.color] || colors.blue;
};

export default function FlowchainBuilderModal({ campaignId, onClose, onSuccess }) {
  const [roles, setRoles] = useState([]);
  const [chainName, setChainName] = useState('');
  const [chainDesc, setChainDesc] = useState('');
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);
  const [setAsDefault, setSetAsDefault] = useState(false);
  
  // Transition modal state
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [transitionStepId, setTransitionStepId] = useState(null);
  const [transitionData, setTransitionData] = useState({
    condition: 'SUCCESS',
    toStepId: '',
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setRolesLoading(true);
    try {
      const authRes = await fetch('/api/auth/me', { credentials: 'include' });
      const authData = await authRes.json();
      const userCompanyId = authData.employee?.companyId;
      setCompanyId(userCompanyId);

      const response = await fetch(`/api/admin/companies/${userCompanyId}/roles`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to load roles');

      const result = await response.json();
      setRoles(result.data);
    } catch (error) {
      console.error('Error loading roles:', error);
      await showError('Load Failed', 'Failed to load roles');
    } finally {
      setRolesLoading(false);
    }
  };

  const addStep = () => {
    const newStep = {
      id: crypto.randomUUID(),
      action: 'UPLOAD',
      assetType: 'VIDEO',
      description: '',
      roleId: '',
      transitions: [],
      autoAdvance: false,
    };
    setSteps([...steps, newStep]);
  };

  const deleteStep = async (id) => {
    const result = await showConfirm(
      'Delete Step?',
      'Are you sure you want to remove this step?',
      'Yes, Delete',
      'Cancel'
    );

    if (result.isConfirmed) {
      setSteps((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const updateStep = (id, field, value) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const addTransition = (fromStepId) => {
    const currentStep = steps.find(s => s.id === fromStepId);
    const otherSteps = steps.filter((s) => s.id !== fromStepId);
    
    if (otherSteps.length === 0) {
      return showError('No Steps Available', 'Add more steps before creating transitions');
    }

    // Get allowed transitions for current action
    const allowedActions = WORKFLOW_ACTIONS[currentStep.action]?.allowedTransitions || [];
    const validNextSteps = otherSteps.filter(s => allowedActions.includes(s.action));

    if (validNextSteps.length === 0) {
      return showError(
        'No Valid Transitions', 
        `The "${WORKFLOW_ACTIONS[currentStep.action]?.label}" action cannot transition to any existing steps. Add steps with these actions: ${allowedActions.map(a => WORKFLOW_ACTIONS[a]?.label).join(', ')}`
      );
    }

    setTransitionStepId(fromStepId);
    setTransitionData({
      condition: 'SUCCESS',
      toStepId: validNextSteps[0]?.id || '',
    });
    setShowTransitionModal(true);
  };

  const handleAddTransition = () => {
    const targetStep = steps.find(s => s.id === transitionData.toStepId);
    
    setSteps((prev) =>
      prev.map((s) =>
        s.id === transitionStepId
          ? {
              ...s,
              transitions: [...s.transitions, {
                condition: transitionData.condition,
                toStepId: transitionData.toStepId,
                toStepName: getStepDisplayName(targetStep.action, targetStep.assetType)
              }],
            }
          : s
      )
    );
    setShowTransitionModal(false);
    setTransitionStepId(null);
  };

  const handleSubmit = async () => {
    if (!chainName.trim()) {
      return showError('Validation Error', 'Please enter a workflow name');
    }

    if (steps.length === 0) {
      return showError('Validation Error', 'Please add at least one step');
    }

    // Validate that each step has a role assigned
    const stepsWithoutRoles = steps.filter(s => !s.roleId);
    if (stepsWithoutRoles.length > 0) {
      return showError('Validation Error', 'Please assign roles to all steps');
    }

    setLoading(true);
    showLoading('Creating workflow...', 'Please wait');

    try {
      console.log('📝 Creating workflow...');
      const flowchainResponse = await fetch('/api/flowchains', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: chainName,
          description: chainDesc,
          companyId: companyId,
          steps: steps.map((s, index) => ({
            name: getStepDisplayName(s.action, s.assetType),
            description: s.description || WORKFLOW_ACTIONS[s.action]?.description,
            roleId: s.roleId || null,
            action: s.action,
            assetType: s.assetType,
            order: index + 1,
            autoAdvance: s.autoAdvance,
            transitions: s.transitions,
          })),
        }),
      });

      if (!flowchainResponse.ok) {
        const error = await flowchainResponse.json();
        throw new Error(error.error || 'Failed to create workflow');
      }

      const flowchainResult = await flowchainResponse.json();
      const flowChainId = flowchainResult.data.id;
      
      console.log('✅ Workflow created:', flowChainId);

      console.log('🔗 Linking workflow to campaign...');
      const linkResponse = await fetch(`/api/admin/campaigns/${campaignId}/flows`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowChainId: flowChainId,
          isDefault: setAsDefault,
        }),
      });

      if (!linkResponse.ok) {
        const error = await linkResponse.json();
        throw new Error(error.error || 'Workflow created but failed to link to campaign');
      }

      console.log('✅ Workflow linked to campaign');

      closeSwal();
      await showSuccess('Success!', 'Workflow created and linked to campaign');
      onSuccess();
    } catch (err) {
      closeSwal();
      console.error('❌ Error:', err);
      await showError('Error!', err.message || 'Failed to create workflow');
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
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <GitBranch className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Production Workflow Builder</h2>
                  <p className="text-sm text-gray-600">Design workflows with production activities and conditional transitions</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Info Banner */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">How It Works</p>
                <p className="text-blue-700">
                  • Each step is an <strong>activity</strong> (Upload, Review, Edit, etc.)<br />
                  • Add <strong>transitions</strong> to define what happens on success/failure<br />
                  • Example: Review → Success = Publish, Failure = Edit
                </p>
              </div>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Workflow Name *
                    </label>
                    <input
                      value={chainName}
                      onChange={(e) => setChainName(e.target.value)}
                      placeholder="e.g., Video Production Pipeline"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      value={chainDesc}
                      onChange={(e) => setChainDesc(e.target.value)}
                      placeholder="Brief description..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Set as Default Checkbox */}
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <input
                    type="checkbox"
                    id="setAsDefault"
                    checked={setAsDefault}
                    onChange={(e) => setSetAsDefault(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="setAsDefault" className="text-sm text-gray-700 cursor-pointer">
                    Set as default workflow for this campaign
                  </label>
                </div>

                {/* Add Step Button */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Production Steps</h3>
                  <button
                    onClick={addStep}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Add Step
                  </button>
                </div>

                {/* Steps Grid */}
                {steps.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">No steps added yet</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Build your workflow with production activities like Upload, Review, Edit, Process, etc.
                    </p>
                    <button
                      onClick={addStep}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Add your first step
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {steps.map((step, index) => {
                        const ActionIcon = WORKFLOW_ACTIONS[step.action]?.icon || Upload;
                        const AssetIcon = ASSET_TYPES[step.assetType]?.icon || File;
                        const actionColor = getActionColor(step.action);

                        return (
                          <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:border-purple-300"
                          >
                            {/* Step Header */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-10 h-10 bg-gradient-to-br ${actionColor} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <ActionIcon className="w-4 h-4 text-gray-600" />
                                    <AssetIcon className="w-4 h-4 text-gray-500" />
                                  </div>
                                  <p className="text-xs font-semibold text-gray-900 mt-0.5">
                                    {getStepDisplayName(step.action, step.assetType)}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => deleteStep(step.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Action Selection */}
                            <div className="mb-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Activity Type *
                              </label>
                              <select
                                value={step.action}
                                onChange={(e) => updateStep(step.id, 'action', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-purple-500"
                              >
                                {Object.values(WORKFLOW_ACTIONS).map((action) => (
                                  <option key={action.id} value={action.id}>
                                    {action.label}
                                  </option>
                                ))}
                              </select>
                              <p className="text-xs text-gray-500 mt-1">
                                {WORKFLOW_ACTIONS[step.action]?.description}
                              </p>
                            </div>

                            {/* Asset Type Selection */}
                            <div className="mb-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Asset Type *
                              </label>
                              <select
                                value={step.assetType}
                                onChange={(e) => updateStep(step.id, 'assetType', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-purple-500"
                              >
                                {Object.values(ASSET_TYPES).map((asset) => (
                                  <option key={asset.id} value={asset.id}>
                                    {asset.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Optional Description */}
                            <div className="mb-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Instructions (Optional)
                              </label>
                              <textarea
                                placeholder="Add specific instructions for this step..."
                                value={step.description}
                                onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                                className="w-full text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-purple-300 outline-none resize-none"
                                rows={2}
                              />
                            </div>

                            {/* Role Assignment */}
                            <div className="mb-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Assigned Role *
                              </label>
                              <select
                                value={step.roleId}
                                onChange={(e) => updateStep(step.id, 'roleId', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="">Select Role</option>
                                {roles.map((role) => (
                                  <option key={role.id} value={role.id}>
                                    {role.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Auto-advance Option */}
                            <div className="mb-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-2">
                              <input
                                type="checkbox"
                                id={`auto-${step.id}`}
                                checked={step.autoAdvance}
                                onChange={(e) => updateStep(step.id, 'autoAdvance', e.target.checked)}
                                className="w-3.5 h-3.5 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                              />
                              <label htmlFor={`auto-${step.id}`} className="text-xs text-green-900 cursor-pointer">
                                Auto-advance on success
                              </label>
                            </div>

                            {/* Transitions */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Transitions (What happens next?)
                              </label>
                              <div className="space-y-1.5 mb-2">
                                {step.transitions.map((t, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 px-2.5 py-2 rounded-lg border border-purple-200 text-xs"
                                  >
                                    <span className="font-medium text-purple-900 flex items-center gap-1.5">
                                      {t.condition === 'SUCCESS' ? (
                                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                      ) : (
                                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                                      )}
                                      <span className="text-[10px] text-gray-600">
                                        {t.condition === 'SUCCESS' ? 'Success' : 'Failure'}
                                      </span>
                                      → {t.toStepName}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setSteps(prev =>
                                          prev.map(s =>
                                            s.id === step.id
                                              ? { ...s, transitions: s.transitions.filter((_, idx) => idx !== i) }
                                              : s
                                          )
                                        );
                                      }}
                                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-100 rounded"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={() => addTransition(step.id)}
                                className="w-full text-purple-600 text-xs flex items-center justify-center gap-1.5 hover:bg-purple-50 py-2 rounded-lg transition-colors border border-purple-200"
                              >
                                <Link2 className="w-3.5 h-3.5" />
                                Add Transition
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
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
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || steps.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Create Workflow'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Transition Modal */}
      {showTransitionModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
          onClick={() => setShowTransitionModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">Add Transition</h3>
            <p className="text-sm text-gray-600 mb-4">
              Define what happens when this step succeeds or fails
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  When this step...
                </label>
                <select
                  value={transitionData.condition}
                  onChange={(e) => setTransitionData({ ...transitionData, condition: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="SUCCESS">✅ Succeeds (approved/completed)</option>
                  <option value="FAILURE">❌ Fails (rejected/needs revision)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Go to this step
                </label>
                <select
                  value={transitionData.toStepId}
                  onChange={(e) => setTransitionData({ ...transitionData, toStepId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {steps
                    .filter((s) => {
                      const currentStep = steps.find(st => st.id === transitionStepId);
                      const allowedActions = WORKFLOW_ACTIONS[currentStep?.action]?.allowedTransitions || [];
                      return s.id !== transitionStepId && allowedActions.includes(s.action);
                    })
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {getStepDisplayName(s.action, s.assetType)}
                      </option>
                    ))}
                </select>
              </div>

              {/* Example */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-900">
                  <strong>Example:</strong> If Review succeeds → Publish<br />
                  If Review fails → Edit
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTransitionModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTransition}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium"
              >
                Add Transition
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
