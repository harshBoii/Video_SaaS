import dagre from '@dagrejs/dagre';

const NODE_WIDTH = 280;
const NODE_HEIGHT = 120;

export const getLayoutedElements = (nodes, edges) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir: 'TB',
    nodesep: 80,
    ranksep: 120,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export const rolesToNodesAndEdges = (roles) => {
  const nodes = roles.map((role) => ({
    id: role.id,
    type: 'roleNode',
    data: { role },
    position: { x: 0, y: 0 },
  }));

  const edges = roles
    .filter((role) => role.parentId)
    .map((role) => ({
      id: `e-${role.parentId}-${role.id}`,
      source: role.parentId,
      target: role.id,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#94a3b8', strokeWidth: 2 },
    }));

  return { nodes, edges };
};
