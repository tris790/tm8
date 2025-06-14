import React from 'react';
import { Button } from '../ui/Button';
import PropertiesPanel from '../properties/PropertiesPanel';
import { Node, Edge, Boundary } from '../../types/placeholder';
import { Graph } from '../../core/types/graph';
import { SelectionState } from '../../core/graph/SelectionManager';
import '../../styles/components/sidebar.css';

interface SidebarProps {
  selection: SelectionState;
  graph: Graph | null;
  onUpdateNode: (id: string, updates: Partial<Node>) => void;
  onUpdateEdge: (id: string, updates: Partial<Edge>) => void;
  onUpdateBoundary: (id: string, updates: Partial<Boundary>) => void;
}

// Convert Graph array format to Record format for PropertiesPanel
const convertGraphToRecords = (graph: Graph | null) => {
  if (!graph) {
    return { nodes: {}, edges: {}, boundaries: {} };
  }
  
  const nodes: Record<string, Node> = {};
  const edges: Record<string, Edge> = {};
  const boundaries: Record<string, Boundary> = {};
  
  graph.nodes.forEach(node => {
    nodes[node.id] = node;
  });
  
  graph.edges.forEach(edge => {
    edges[edge.id] = edge;
  });
  
  graph.boundaries.forEach(boundary => {
    boundaries[boundary.id] = boundary;
  });
  
  return { nodes, edges, boundaries };
};

export const Sidebar: React.FC<SidebarProps> = ({ 
  selection, 
  graph,
  onUpdateNode,
  onUpdateEdge,
  onUpdateBoundary
}) => {
  // Combine all selections into a single array for PropertiesPanel
  const allSelected = [...selection.selectedNodes, ...selection.selectedEdges, ...selection.selectedBoundaries];
  const graphRecords = convertGraphToRecords(graph);

  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">Properties</h2>
      <hr className="sidebar-divider" />
      <div className="sidebar-content">
        <div className="properties-panel">
          <PropertiesPanel
            selection={allSelected}
            graph={graphRecords}
            onUpdateNode={onUpdateNode}
            onUpdateEdge={onUpdateEdge}
            onUpdateBoundary={onUpdateBoundary}
          />
        </div>
      </div>
    </aside>
  );
};