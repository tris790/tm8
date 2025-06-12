/**
 * Core graph data structures for TM8 threat modeling
 */

import { NodeType, EdgeType, BoundaryType } from './enums';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Node {
  id: string;
  type: NodeType;
  name: string;
  position: Position;
  properties: Record<string, any>; // "repo", "team", "role", "avatar", etc.
}

export interface Edge {
  id: string;
  type: EdgeType;
  source: string;
  targets: string[];
  properties: Record<string, any>; // "encrypted", "routes", etc.
}

export interface Boundary {
  id: string;
  type: BoundaryType;
  name: string;
  position: Position;
  bounds: Size;
  properties: Record<string, any>;
}

export interface GraphMetadata {
  name: string;
  version: string;
  created: Date;
  modified: Date;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
  boundaries: Boundary[];
  metadata: GraphMetadata;
}

/**
 * Visibility state for filtering
 */
export interface VisibilityState {
  nodeTypes: Set<NodeType>;
  edgeTypes: Set<EdgeType>;
  boundaryTypes: Set<BoundaryType>;
  searchQuery: string;
}

/**
 * Selection state
 */
export interface SelectionState {
  nodes: Set<string>;
  edges: Set<string>;
  boundaries: Set<string>;
}