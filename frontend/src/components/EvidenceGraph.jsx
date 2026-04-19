import React, { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  {
    id: 'fir',
    type: 'default',
    data: { label: 'FIR 102/2026\n(Theft & Attempted Murder)' },
    position: { x: 250, y: 50 },
    style: { background: '#1C2541', color: '#D4AF37', border: '1px solid #3A506B', borderRadius: '8px', padding: '10px', width: 200 }
  },
  {
    id: 'witness1',
    data: { label: 'Witness: Guard (Rahul)' },
    position: { x: 100, y: 150 },
    style: { background: '#0B132B', color: '#EAEAEA', border: '1px solid #3A506B', borderRadius: '8px' }
  },
  {
    id: 'cctv',
    data: { label: 'Evidence: CCTV Footage' },
    position: { x: 400, y: 150 },
    style: { background: '#0B132B', color: '#EAEAEA', border: '1px solid #3A506B', borderRadius: '8px' }
  },
  {
    id: 'suspect',
    data: { label: 'Suspect (Unidentified)' },
    position: { x: 250, y: 250 },
    style: { background: '#3A506B', color: '#FFF', border: '1px solid #D4AF37', borderRadius: '8px' }
  },
  {
    id: 'missing_link',
    data: { label: 'Missing Link: Weapon' },
    position: { x: 100, y: 350 },
    style: { background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px border-dashed border-red-500', borderRadius: '8px' }
  }
];

const initialEdges = [
  { id: 'e1-2', source: 'fir', target: 'witness1', markerEnd: { type: MarkerType.ArrowClosed, color: '#3A506B' }, style: { stroke: '#3A506B', strokeWidth: 2 } },
  { id: 'e1-3', source: 'fir', target: 'cctv', markerEnd: { type: MarkerType.ArrowClosed, color: '#3A506B' }, style: { stroke: '#3A506B', strokeWidth: 2 } },
  { id: 'e2-4', source: 'witness1', target: 'suspect', animated: true, label: 'Identified', style: { stroke: '#D4AF37', strokeWidth: 2 } },
  { id: 'e3-4', source: 'cctv', target: 'suspect', animated: true, label: 'Matches', style: { stroke: '#D4AF37', strokeWidth: 2 } },
  { id: 'e4-5', source: 'suspect', target: 'missing_link', style: { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '5 5' } }
];

const EvidenceGraph = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="h-[600px] w-full glass-card border-none overflow-hidden rounded-xl">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        colorMode="dark"
      >
        <Controls className="bg-legal-dark border border-legal-teal/30 fill-legal-light" />
        <MiniMap nodeColor="#3A506B" maskColor="rgba(6, 11, 25, 0.8)" className="bg-legal-darker border border-legal-teal/30" />
        <Background color="#3A506B" gap={16} />
      </ReactFlow>
    </div>
  );
};

export default EvidenceGraph;
