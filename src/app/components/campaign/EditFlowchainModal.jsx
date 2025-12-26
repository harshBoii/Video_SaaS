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
  AlertCircle,
  CheckCircle2,
  XCircle,
  Upload,
  Eye,
  Edit,
  Cog,
  Wand2,
  Scissors,
  Palette,
  Music,
  Type,
  Send,
  Archive,
  Video,
  Image as ImageIcon,
  FileText,
  File,
  Layers
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

const getActionColor = (actionId) => {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    yellow: 'from-yellow-500 to-yellow-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    pink: 'from-pink-500 to-pink-600',
    teal: 'from-teal-500 to-teal-600',
    indigo: 'from-indigo-500 to-indigo-600',
    cyan: 'from-cyan-500 to-cyan-600',
    lime: 'from-lime-500 to-lime-600',
    green: 'from-green-500 to-green-600',
    gray: 'from-gray-500 to-gray-600',
  };
  const action = WORKFLOW_ACTIONS[actionId];
  return action ? colorMap[action.color] || 'from-gray-500 to-gray-600' : 'from-gray-500 to-gray-600';
};

const getAssetTypeColor = (typeId) => {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  };
  const assetType = ASSET_TYPES[typeId];
  return assetType ? colorMap[assetType.color] || 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-gray-100 text-gray-700 border-gray-200';
};

export default function EditFlowchainModal({ flowChainId, onClose, onSuccess }) {
  const [roles, setRoles] = useState([]);
  const [chainName, setChainName] = useState('');
  const [chainDesc, setChainDesc] = useState('');
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);
  
  // Transition modal state
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [transitionStepId, setTransitionStepId] = useState(null);
  const [transitionData, setTransitionData] = useState({
    condition: 'SUCCESS',
    toStepId: '',
  });

  useEffect(() => {
    loadData();
  }, [flowChainId]);

const loadData = async () => {
  setDataLoading(true);
  try {
    // Get user's company
    const authRes = await fetch('/api/auth/me', { credentials: 'include' });
    const authData = await authRes.json();
    const userCompanyId = authData.employee?.companyId;
    setCompanyId(userCompanyId);

    // Load roles and flowchain data in parallel
    const [rolesRes, flowchainRes] = await Promise.all([
      fetch(`/api/admin/companies/${userCompanyId}/roles`, {
        credentials: 'include',
      }),
      fetch(`/api/flowchains/${flowChainId}`, {
        credentials: 'include',
      }),
    ]);

    if (!rolesRes.ok || !flowchainRes.ok) {
      throw new Error('Failed to load data');
    }

    const rolesData = await rolesRes.json();
    const flowchainData = await flowchainRes.json();

    setRoles(rolesData.data || []);
    
    // Set flowchain data
    setChainName(flowchainData.data.name || '');
    setChainDesc(flowchainData.data.description || '');
    
    // ✅ Helper function to parse action from step name
    const parseActionFromName = (stepName) => {
      const nameParts = stepName.split(' ');
      const firstWord = nameParts[0]?.toUpperCase();
      
      // Try to match first word to an action
      for (const [key, action] of Object.entries(WORKFLOW_ACTIONS)) {
        if (action.label.toUpperCase() === firstWord || key === firstWord) {
          return key;
        }
      }
      
      // Special cases for multi-word actions
      if (firstWord === 'COLOR' && nameParts[1]?.toUpperCase() === 'GRADE') {
        return 'COLOR_GRADE';
      }
      if (firstWord === 'ADD') {
        if (nameParts[1]?.toUpperCase() === 'AUDIO') return 'ADD_AUDIO';
        if (nameParts[1]?.toUpperCase() === 'TEXT') return 'ADD_TEXT';
      }
      if (firstWord === 'CUT') {
        return 'CUT';
      }
      
      return 'REVIEW'; // Default
    };

    // ✅ Helper function to parse asset types from step name
    const parseAssetTypesFromName = (stepName, actionLength) => {
      const nameParts = stepName.split(' ');
      
      // Get the remaining words after action
      const remainingWords = nameParts.slice(actionLength).join(' ').trim();
      
      if (!remainingWords) return ['ALL_ASSETS'];
      
      const assetTypes = [];
      
      // Check for each asset type
      if (remainingWords.toLowerCase().includes('all assets') || 
          remainingWords.toLowerCase().includes('all asset')) {
        return ['ALL_ASSETS'];
      }
      
      if (remainingWords.toLowerCase().includes('video')) {
        assetTypes.push('VIDEO');
      }
      if (remainingWords.toLowerCase().includes('image')) {
        assetTypes.push('IMAGE');
      }
      if (remainingWords.toLowerCase().includes('document')) {
        assetTypes.push('DOCUMENT');
      }
      if (remainingWords.toLowerCase().includes('script')) {
        assetTypes.push('SCRIPT');
      }
      
      return assetTypes.length > 0 ? assetTypes : ['ALL_ASSETS'];
    };
    
    // ✅ Transform steps with parsed action and asset types
    const transformedSteps = (flowchainData.data.steps || []).map(step => {
      let action = 'REVIEW';
      let assetTypes = ['ALL_ASSETS'];
      
      // Try to get from existing fields first
      if (step.action) {
        action = step.action;
      } else if (step.name) {
        // Parse from name
        action = parseActionFromName(step.name);
      }
      
      if (step.assetTypes) {
        if (typeof step.assetTypes === 'string') {
          try {
            assetTypes = JSON.parse(step.assetTypes);
          } catch {
            assetTypes = [step.assetTypes];
          }
        } else if (Array.isArray(step.assetTypes) && step.assetTypes.length > 0) {
          assetTypes = step.assetTypes;
        }
      } else if (step.name) {
        // Parse from name
        const actionObj = WORKFLOW_ACTIONS[action];
        const actionWords = actionObj ? actionObj.label.split(' ').length : 1;
        assetTypes = parseAssetTypesFromName(step.name, actionWords);
      }

      return {
        id: step.id,
        tempId: step.id,
        name: step.name || 'Unnamed Step',
        description: step.description || '',
        action: action,
        assetTypes: assetTypes,
        roleId: step.roleId || '',
        transitions: Array.isArray(step.transitions) 
          ? step.transitions.map(t => ({
              id: t.id,
              condition: t.condition || 'SUCCESS',
              toStepId: t.toStepId || t.toStep?.id,
            })).filter(t => t.toStepId)
          : [],
        isExisting: true,
      };
    });
    
    console.log('✅ Transformed steps:', transformedSteps);
    setSteps(transformedSteps);

  } catch (error) {
    console.error('Error loading data:', error);
    await showError('Load Failed', 'Failed to load flowchain data');
    onClose();
  } finally {
    setDataLoading(false);
  }
};

  const addStep = () => {
    const newTempId = `temp-${Date.now()}-${Math.random()}`;
    const newStep = {
      id: null,
      tempId: newTempId,
      name: 'Review',
      description: 'Review and provide feedback on assets',
      action: 'REVIEW',
      assetTypes: ['ALL_ASSETS'],
      roleId: '',
      transitions: [],
      isExisting: false,
    };
    setSteps([...steps, newStep]);
  };

  const deleteStep = async (tempId) => {
    const result = await showConfirm(
      'Delete Step?',
      'Are you sure you want to remove this step? This will also remove any transitions to/from this step.',
      'Yes, Delete',
      'Cancel'
    );

    if (result.isConfirmed) {
      setSteps((prev) => {
        return prev
          .filter((s) => s.tempId !== tempId)
          .map(s => ({
            ...s,
            transitions: (s.transitions || []).filter(t => t.toStepId !== tempId)
          }));
      });
    }
  };

  const updateStep = (tempId, field, value) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.tempId === tempId) {
          const updated = { ...s, [field]: value };
          
          // Auto-update name when action changes
          if (field === 'action') {
            const actionDef = WORKFLOW_ACTIONS[value];
            if (actionDef) {
              updated.name = actionDef.label;
              updated.description = actionDef.description;
            }
          }
          
          return updated;
        }
        return s;
      })
    );
  };

  const toggleAssetType = (tempId, typeId) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.tempId !== tempId) return s;
        
        // ✅ Ensure assetTypes is always an array
        let newTypes = Array.isArray(s.assetTypes) ? [...s.assetTypes] : ['ALL_ASSETS'];
        
        if (typeId === 'ALL_ASSETS') {
          // If selecting ALL_ASSETS, clear others
          newTypes = ['ALL_ASSETS'];
        } else {
          // Remove ALL_ASSETS if selecting specific type
          newTypes = newTypes.filter(t => t !== 'ALL_ASSETS');
          
          if (newTypes.includes(typeId)) {
            newTypes = newTypes.filter(t => t !== typeId);
          } else {
            newTypes.push(typeId);
          }
          
          // If no types selected, default to ALL_ASSETS
          if (newTypes.length === 0) {
            newTypes = ['ALL_ASSETS'];
          }
        }
        
        return { ...s, assetTypes: newTypes };
      })
    );
  };

  const addTransition = (fromStepTempId) => {
    const currentStep = steps.find(s => s.tempId === fromStepTempId);
    if (!currentStep) return;
    
    const currentAction = WORKFLOW_ACTIONS[currentStep.action];
    if (!currentAction) return;
    
    // Filter steps based on allowed transitions
    const allowedSteps = steps.filter((s) => {
      if (s.tempId === fromStepTempId) return false;
      return currentAction.allowedTransitions.includes(s.action);
    });
    
    if (allowedSteps.length === 0) {
      return showError(
        'No Valid Transitions', 
        `The "${currentAction.label}" action cannot transition to any of the existing steps. Add steps with these actions: ${currentAction.allowedTransitions.join(', ')}`
      );
    }

    setTransitionStepId(fromStepTempId);
    setTransitionData({
      condition: 'SUCCESS',
      toStepId: allowedSteps[0]?.tempId || '',
    });
    setShowTransitionModal(true);
  };

  const handleAddTransition = () => {
    if (!transitionData.toStepId) {
      return showError('Validation Error', 'Please select a target step');
    }

    setSteps((prev) =>
      prev.map((s) =>
        s.tempId === transitionStepId
          ? {
              ...s,
              transitions: [
                ...(s.transitions || []), 
                { 
                  id: null,
                  condition: transitionData.condition, 
                  toStepId: transitionData.toStepId 
                }
              ],
            }
          : s
      )
    );
    setShowTransitionModal(false);
    setTransitionStepId(null);
  };

  const removeTransition = (stepTempId, transitionIndex) => {
    setSteps(prev =>
      prev.map(s =>
        s.tempId === stepTempId
          ? { ...s, transitions: (s.transitions || []).filter((_, idx) => idx !== transitionIndex) }
          : s
      )
    );
  };

  const handleSubmit = async () => {
    if (!chainName.trim()) {
      return showError('Validation Error', 'Please enter a flowchain name');
    }

    if (steps.length === 0) {
      return showError('Validation Error', 'Please add at least one step');
    }

    // Validate all steps have actions
    const invalidSteps = steps.filter(s => !s.action);
    if (invalidSteps.length > 0) {
      return showError('Validation Error', 'All steps must have an action assigned');
    }

    setLoading(true);
    showLoading('Updating flowchain...', 'Please wait');

    try {
      const payload = {
        name: chainName,
        description: chainDesc,
        steps: steps.map((s, index) => ({
          id: s.isExisting ? s.id : undefined,
          tempId: s.tempId,
          name: s.name,
          description: s.description,
          action: s.action,
          assetTypes: s.assetTypes || ['ALL_ASSETS'],
          roleId: s.roleId || null,
          order: index,
          transitions: (s.transitions || []).map(t => ({
            id: t.id,
            condition: t.condition,
            toStepId: t.toStepId,
          })),
        })),
      };

      const response = await fetch(`/api/flowchains/${flowChainId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update');
      }

      closeSwal();
      await showSuccess('Success!', 'Flowchain updated successfully');
      onSuccess();
    } catch (err) {
      closeSwal();
      console.error(err);
      await showError('Error!', err.message || 'Failed to update flowchain');
    } finally {
      setLoading(false);
    }
  };

  // Get allowed transition targets for a step
  const getAllowedTransitionTargets = (fromStepTempId) => {
    const currentStep = steps.find(s => s.tempId === fromStepTempId);
    if (!currentStep) return [];
    
    const currentAction = WORKFLOW_ACTIONS[currentStep.action];
    if (!currentAction) return [];
    
    return steps.filter((s) => {
      if (s.tempId === fromStepTempId) return false;
      return currentAction.allowedTransitions.includes(s.action);
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <GitBranch className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit Workflow</h2>
                  <p className="text-sm text-gray-600">Update your workflow configuration</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {dataLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                <p className="text-gray-600">Loading workflow data...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Warning Banner */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">⚠️ Editing Active Workflow</p>
                    <p>Changes will affect all campaigns using this workflow. Existing asset workflows will be updated to reflect the new structure.</p>
                  </div>
                </div>

                {/* Flow Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Workflow Name *
                    </label>
                    <input
                      value={chainName}
                      onChange={(e) => setChainName(e.target.value)}
                      placeholder="e.g., Video Production Workflow"
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
                      placeholder="Brief description of this workflow..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Add Step Button */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Workflow Steps</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Define action-based steps for your workflow ({steps.length} steps)
                    </p>
                  </div>
                  <button
                    onClick={addStep}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Add Step
                  </button>
                </div>

                {/* Steps Grid */}
                {steps.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">No steps in this workflow</p>
                    <button
                      onClick={addStep}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Add your first step
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {steps.map((step, index) => {
                        const ActionIcon = WORKFLOW_ACTIONS[step.action]?.icon || Eye;
                        const actionColor = getActionColor(step.action);
                        const stepAssetTypes = Array.isArray(step.assetTypes) ? step.assetTypes : ['ALL_ASSETS'];
                        
                        return (
                          <motion.div
                            key={step.tempId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:border-blue-300"
                          >
                            {/* Step Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className={`w-10 h-10 bg-gradient-to-br ${actionColor} rounded-lg flex items-center justify-center flex-shrink-0 shadow-md`}>
                                  <ActionIcon className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-500">#{index + 1}</span>
                                    {step.isExisting && (
                                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                        Existing
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm font-bold text-gray-900 truncate">{step.name}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => deleteStep(step.tempId)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0 ml-2"
                                title="Delete step"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Action Selection */}
                            <div className="mb-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Action *
                              </label>
                              <select
                                value={step.action}
                                onChange={(e) => updateStep(step.tempId, 'action', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 bg-white font-medium"
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

                            {/* Asset Types */}
                            <div className="mb-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Asset Types *
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {Object.values(ASSET_TYPES).map((assetType) => {
                                  const TypeIcon = assetType.icon;
                                  const isSelected = stepAssetTypes.includes(assetType.id);
                                  
                                  return (
                                    <button
                                      key={assetType.id}
                                      onClick={() => toggleAssetType(step.tempId, assetType.id)}
                                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all ${
                                        isSelected
                                          ? getAssetTypeColor(assetType.id)
                                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                      }`}
                                      title={assetType.description}
                                    >
                                      <TypeIcon className="w-3 h-3" />
                                      {assetType.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Role Assignment */}
                            <div className="mb-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Assigned Role
                              </label>
                              <select
                                value={step.roleId}
                                onChange={(e) => updateStep(step.tempId, 'roleId', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:ring-2 focus:ring-blue-500 bg-white"
                              >
                                <option value="">No role assigned</option>
                                {roles.map((role) => (
                                  <option key={role.id} value={role.id}>
                                    {role.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Transitions */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Transitions ({(step.transitions || []).length})
                              </label>
                              <div className="space-y-1.5 mb-2">
                                {(step.transitions || []).length === 0 ? (
                                  <div className="text-xs text-gray-500 text-center py-2 bg-gray-50 rounded border border-dashed border-gray-300">
                                    No transitions yet
                                  </div>
                                ) : (
                                  (step.transitions || []).map((t, i) => {
                                    const targetStep = steps.find(s => s.tempId === t.toStepId);
                                    const TargetIcon = targetStep ? WORKFLOW_ACTIONS[targetStep.action]?.icon : null;
                                    
                                    return (
                                      <div
                                        key={`${step.tempId}-transition-${i}`}
                                        className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 px-2 py-1.5 rounded-lg border border-blue-200 text-xs group hover:border-blue-400 transition-colors"
                                      >
                                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                          {t.condition === 'SUCCESS' ? (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                                          ) : (
                                            <XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                          )}
                                          {TargetIcon && <TargetIcon className="w-3 h-3 text-gray-600 flex-shrink-0" />}
                                          <span className="font-medium text-gray-700 truncate">
                                            {targetStep ? targetStep.name : 'Unknown'}
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => removeTransition(step.tempId, i)}
                                          className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1"
                                          title="Remove transition"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                              <button
                                onClick={() => addTransition(step.tempId)}
                                disabled={steps.length <= 1}
                                className="w-full text-blue-600 text-xs flex items-center justify-center gap-1 hover:bg-blue-50 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                              >
                                <Link2 className="w-3 h-3" />
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
                disabled={loading}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || dataLoading || steps.length === 0 || !chainName.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Transition Modal */}
      <AnimatePresence>
        {showTransitionModal && (() => {
          const currentStep = steps.find(s => s.tempId === transitionStepId);
          const allowedTargets = getAllowedTransitionTargets(transitionStepId);
          
          return (
            <div 
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
              onClick={() => setShowTransitionModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Add Transition</h3>
                  <button
                    onClick={() => setShowTransitionModal(false)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* From Step Info */}
                  {currentStep && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-600 font-medium mb-1">From Step:</p>
                      <p className="text-sm font-semibold text-gray-900">{currentStep.name}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Condition *
                    </label>
                    <select
                      value={transitionData.condition}
                      onChange={(e) => setTransitionData({ ...transitionData, condition: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="SUCCESS">✅ On Success</option>
                      <option value="FAILURE">❌ On Failure</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {transitionData.condition === 'SUCCESS' 
                        ? 'Transition when step is approved/completed'
                        : 'Transition when step is rejected/failed'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Step *
                    </label>
                    {allowedTargets.length === 0 ? (
                      <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <AlertCircle className="w-4 h-4 inline mr-2" />
                        No valid transition targets. Add compatible action steps.
                      </div>
                    ) : (
                      <>
                        <select
                          value={transitionData.toStepId}
                          onChange={(e) => setTransitionData({ ...transitionData, toStepId: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select target step...</option>
                          {allowedTargets.map((s) => (
                            <option key={s.tempId} value={s.tempId}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Only showing steps allowed by the "{WORKFLOW_ACTIONS[currentStep?.action]?.label}" action
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowTransitionModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTransition}
                    disabled={!transitionData.toStepId || allowedTargets.length === 0}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Transition
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </>
  );
}
