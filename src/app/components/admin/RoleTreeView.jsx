import React, { useCallback, useMemo, useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getLayoutedElements, rolesToNodesAndEdges } from '@/app/utils/layoutUtil';
import RoleNode from './RoleNode';
import useRoleStore from '@/app/stores/roleStore';

const nodeTypes = {
  roleNode: RoleNode,
};

const RoleTreeView = () => {
  const { roles, expandedNodes, moveRole } = useRoleStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Convert roles to nodes and edges, then layout
  useEffect(() => {
    if (roles.length > 0) {
      const { nodes: rawNodes, edges: rawEdges } = rolesToNodesAndEdges(roles, expandedNodes);
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        rawNodes, 
        rawEdges
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
  }, [roles, expandedNodes, setNodes, setEdges]);

  const onNodeDragStop = useCallback((event, node) => {
    // Handle drag and drop to reorder hierarchy
    console.log('Node dropped:', node);
  }, []);

  return (
    <div className="w-full h-full bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
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
          nodeColor={(node) => '#3b82f6'}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
};

export default RoleTreeView;
