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
  AlertCircle
} from 'lucide-react';
import { showSuccess, showError, showConfirm, showLoading, closeSwal } from '@/app/lib/swal';

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
    toStepName: '',
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

      setRoles(rolesData.data);
      
      // Set flowchain data
      setChainName(flowchainData.data.name);
      setChainDesc(flowchainData.data.description || '');
      
      // Transform steps with transitions
      const transformedSteps = flowchainData.data.steps.map(step => ({
        id: step.id,
        name: step.name,
        description: step.description || '',
        roleId: step.roleId || '',
        transitions: step.transitions.map(t => ({
          id: t.id,
          condition: t.condition,
          toStepName: t.toStep.name,
          toStepId: t.toStep.id,
        })),
        isExisting: true, // Mark as existing to handle updates vs creates
      }));
      
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
    const newStep = {
      id: crypto.randomUUID(),
      name: `Step ${steps.length + 1}`,
      description: '',
      roleId: '',
      transitions: [],
      isExisting: false, // New step
    };
    setSteps([...steps, newStep]);
  };

  const deleteStep = async (id) => {
    const result = await showConfirm(
      'Delete Step?',
      'Are you sure you want to remove this step? This will also remove any transitions to/from this step.',
      'Yes, Delete',
      'Cancel'
    );

    if (result.isConfirmed) {
      setSteps((prev) => {
        // Remove the step and any transitions pointing to it
        const stepToDelete = prev.find(s => s.id === id);
        return prev
          .filter((s) => s.id !== id)
          .map(s => ({
            ...s,
            transitions: s.transitions.filter(t => t.toStepName !== stepToDelete.name)
          }));
      });
    }
  };

  const updateStep = (id, field, value) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const addTransition = (fromStepId) => {
    const otherSteps = steps.filter((s) => s.id !== fromStepId);
    if (otherSteps.length === 0) {
      return showError('No Steps Available', 'Add more steps before creating transitions');
    }

    setTransitionStepId(fromStepId);
    setTransitionData({
      condition: 'SUCCESS',
      toStepName: otherSteps[0]?.name || '',
    });
    setShowTransitionModal(true);
  };

  const handleAddTransition = () => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === transitionStepId
          ? {
              ...s,
              transitions: [...s.transitions, { ...transitionData, id: crypto.randomUUID() }],
            }
          : s
      )
    );
    setShowTransitionModal(false);
    setTransitionStepId(null);
  };

  const handleSubmit = async () => {
    if (!chainName.trim()) {
      return showError('Validation Error', 'Please enter a flowchain name');
    }

    if (steps.length === 0) {
      return showError('Validation Error', 'Please add at least one step');
    }

    setLoading(true);
    showLoading('Updating flowchain...', 'Please wait');

    try {
      const response = await fetch(`/api/flowchains/${flowChainId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: chainName,
          description: chainDesc,
          steps: steps.map((s) => ({
            id: s.isExisting ? s.id : undefined, // Include ID only for existing steps
            name: s.name,
            description: s.description,
            roleId: s.roleId || null,
            transitions: s.transitions,
          })),
        }),
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
                    <p className="font-semibold mb-1">Editing Active Workflow</p>
                    <p>Changes will affect all campaigns using this workflow. Make sure to review before saving.</p>
                  </div>
                </div>

                {/* Flow Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Flowchain Name *
                    </label>
                    <input
                      value={chainName}
                      onChange={(e) => setChainName(e.target.value)}
                      placeholder="e.g., Approval Workflow"
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

                {/* Add Step Button */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Workflow Steps</h3>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {steps.map((step, index) => (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                          {/* Step Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 flex-1">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {index + 1}
                              </div>
                              <input
                                value={step.name}
                                onChange={(e) => updateStep(step.id, 'name', e.target.value)}
                                className="text-sm font-semibold bg-transparent border-b border-transparent focus:border-blue-300 outline-none text-gray-800 w-full"
                              />
                            </div>
                            <button
                              onClick={() => deleteStep(step.id)}
                              className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Step Description */}
                          <textarea
                            placeholder="Step description..."
                            value={step.description}
                            onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                            className="w-full text-xs text-gray-600 bg-white/50 border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-300 outline-none mb-3 resize-none"
                            rows={2}
                          />

                          {/* Role Assignment */}
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Assigned Role
                            </label>
                            <select
                              value={step.roleId}
                              onChange={(e) => updateStep(step.id, 'roleId', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-700 focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Role</option>
                              {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                  {role.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Transitions */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Transitions
                            </label>
                            <div className="space-y-1 mb-2">
                              {step.transitions.map((t, i) => (
                                <div
                                  key={t.id || i}
                                  className="flex items-center justify-between bg-white px-2 py-1.5 rounded-lg border border-blue-200 text-xs"
                                >
                                  <span className="font-medium text-blue-700">
                                    {t.condition === 'SUCCESS' ? '✅' : '⚠️'} → {t.toStepName}
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
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => addTransition(step.id)}
                              className="w-full text-blue-600 text-xs flex items-center justify-center gap-1 hover:bg-blue-100 py-1.5 rounded-lg transition-colors"
                            >
                              <Link2 className="w-3 h-3" />
                              Add Transition
                            </button>
                          </div>
                        </motion.div>
                      ))}
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
                disabled={loading || dataLoading || steps.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Changes'}
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
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Transition</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  value={transitionData.condition}
                  onChange={(e) => setTransitionData({ ...transitionData, condition: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SUCCESS">✅ Success</option>
                  <option value="FAILURE">⚠️ Failure</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Step
                </label>
                <select
                  value={transitionData.toStepName}
                  onChange={(e) => setTransitionData({ ...transitionData, toStepName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {steps
                    .filter((s) => s.id !== transitionStepId)
                    .map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                </select>
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
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
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
