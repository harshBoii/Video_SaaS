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
  ArrowRight
} from 'lucide-react';
import { showSuccess, showError, showConfirm } from '@/app/lib/swal';

export default function CampaignFlows({ campaignId }) {
  const [flowsData, setFlowsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFlow, setSelectedFlow] = useState(null);

  useEffect(() => {
    loadFlows();
  }, [campaignId]);

  const loadFlows = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/flows`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to load flows');

      const result = await response.json();
      setFlowsData(result.data);
      
      // Auto-select default flow if exists
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Flow List - Left Side */}
      <div className="col-span-4 space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Workflows</h3>
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            Add Flow
          </button>
        </div>

        {flowsData?.flows.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No workflows assigned yet</p>
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              Create your first workflow
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {flowsData?.flows.map((flow) => (
              <motion.button
                key={flow.id}
                onClick={() => setSelectedFlow(flow.flowChain.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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
                  <span className="text-gray-500">
                    {flow.flowChain.totalSteps} steps
                  </span>
                  <ChevronRight className={`w-4 h-4 transition-colors ${
                    selectedFlow === flow.flowChain.id ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Flow Details - Right Side */}
      <div className="col-span-8">
        {selectedFlow ? (
          <FlowVisualization 
            flow={flowsData.flows.find(f => f.flowChain.id === selectedFlow)} 
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
  );
}

// Flow Visualization Component
function FlowVisualization({ flow }) {
  if (!flow) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
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
          <span>{flow.flowChain.totalSteps} steps</span>
          <span>•</span>
          <span>Created {new Date(flow.flowChain.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Flow Steps */}
      <div className="p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Workflow Steps</h4>
        <div className="space-y-3">
          {flow.flowChain.steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="relative">
                {/* Connector Line */}
                {index < flow.flowChain.steps.length - 1 && (
                  <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gray-200 -mb-3" />
                )}
                
                {/* Step Card */}
                <div className="relative bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Step Number */}
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
                      
                      {/* Role Assignment */}
                      {step.role && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            Role: {step.role.name}
                          </span>
                        </div>
                      )}
                      
                      {/* Transitions */}
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
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-3">
          {!flow.isDefault && (
            <button className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium text-sm">
              Set as Default
            </button>
          )}
          <button className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
            Edit Workflow
          </button>
        </div>
      </div>
    </div>
  );
}
