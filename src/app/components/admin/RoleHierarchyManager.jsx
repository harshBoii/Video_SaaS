"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getLayoutedElements, rolesToNodesAndEdges } from '@/app/utils/layoutUtil';
import RoleNode from './RoleNode';
import RoleDetailsDrawer from './RoleDrawer';
import { roleApi } from '@/app/lib/roleApi';
import { showSuccess, showError, showConfirm, showLoading, closeSwal } from '@/app/lib/swal';

const nodeTypes = {
  roleNode: RoleNode,
};

const RoleHierarchyPage = () => {
  const [companyId, setCompanyId] = useState(null);
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { fitView } = useReactFlow();

  useEffect(() => {
    const fetchUserCompany = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Authentication failed');
        }

        const data = await response.json();
        const employee = data.employee || data;
        
        if (employee?.companyId) {
          setCompanyId(employee.companyId);
        } else {
          setError('Company not found in user data');
        }
      } catch (err) {
        console.error('Error fetching company:', err);
        setError(err.message || 'Failed to load company information');
      } finally {
        setLoading(false);
      }
    };

    fetchUserCompany();
  }, []);

  useEffect(() => {
    if (companyId) {
      loadRoles();
    }
  }, [companyId]);

  const loadRoles = async () => {
    if (!companyId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedRoles = await roleApi.fetchRoles(companyId);
      setRoles(fetchedRoles);
      updateHierarchyView(fetchedRoles);
    } catch (error) {
      console.error('Failed to load roles:', error);
      setError(error.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const updateHierarchyView = (rolesData) => {
    if (!rolesData || rolesData.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const { nodes: rawNodes, edges: rawEdges } = rolesToNodesAndEdges(rolesData);
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      rawNodes, 
      rawEdges
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    setTimeout(() => fitView({ padding: 0.2 }), 0);
  };

  const onNodeClick = useCallback((event, node) => {
    setSelectedRoleId(node.id);
  }, []);
const onConnect = useCallback(async (connection) => {
  const sourceNode = nodes.find(n => n.id === connection.source);
  const targetNode = nodes.find(n => n.id === connection.target);

  if (!sourceNode || !targetNode) return;

  // REVERSED LOGIC: source (bottom handle) becomes PARENT of target (top handle)
  // Connecting from bottom of A to top of B means: B reports to A
  const result = await showConfirm(
    'Update Hierarchy?',
    `Set "${sourceNode.data.role.name}" as parent of "${targetNode.data.role.name}"?\n\nThis means "${targetNode.data.role.name}" will report to "${sourceNode.data.role.name}".`,
    'Yes, Update',
    'Cancel'
  );

  if (result.isConfirmed) {
    showLoading('Updating hierarchy...', 'Please wait while we save your changes');
    
    try {
      // target becomes child of source (reversed)
      await roleApi.updateRoleParent(connection.target, connection.source);
      await loadRoles();
      closeSwal();
      
      await showSuccess(
        'Hierarchy Updated!',
        `"${targetNode.data.role.name}" now reports to "${sourceNode.data.role.name}"`
      );
    } catch (error) {
      closeSwal();
      await showError(
        'Update Failed',
        error.message || 'Failed to update hierarchy. Please try again.'
      );
    }
  }
}, [nodes]);


  if (loading && !companyId) {
    return (
      <div className="w-full h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading role hierarchy...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-semibold mb-2">Error Loading Hierarchy</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (roles.length === 0 && !loading) {
    return (
      <div className="w-full h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-blue-800 font-semibold mb-2">No Roles Found</h3>
            <p className="text-blue-600 text-sm">
              This company doesn't have any roles yet. Create roles to build your hierarchy.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-50 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
        }}
      >
        <Background color="#e2e8f0" gap={16} />
        <Controls className="bg-white rounded-lg shadow-lg" />
        <MiniMap 
          className="bg-white rounded-lg shadow-lg"
          nodeColor={(node) => 
            node.id === selectedRoleId ? '#3b82f6' : '#94a3b8'
          }
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>

      {selectedRoleId && (
        <RoleDetailsDrawer
          roleId={selectedRoleId}
          onClose={() => setSelectedRoleId(null)}
          allRoles={roles}
          onHierarchyChange={loadRoles}
        />
      )}
    </div>
  );
};

import { ReactFlowProvider } from '@xyflow/react';

const RoleHierarchyPageWrapper = () => (
  <ReactFlowProvider>
    <RoleHierarchyPage />
  </ReactFlowProvider>
);

export default RoleHierarchyPageWrapper;
