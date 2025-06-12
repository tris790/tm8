// Placeholder types until Task 02 is completed
// These will be replaced with the actual types from src/core/types/

export enum NodeType {
  PROCESS = 'process',
  DATASTORE = 'datastore',
  EXTERNAL_ENTITY = 'external-entity',
  SERVICE = 'service'
}

export enum EdgeType {
  HTTPS = 'https',
  GRPC = 'grpc'
}

export enum BoundaryType {
  TRUST_BOUNDARY = 'trust-boundary',
  NETWORK_ZONE = 'network-zone'
}

export enum CanvasMode {
  SELECT = 'select',
  PAN = 'pan',
  DRAW_NODE = 'draw-node',
  DRAW_EDGE = 'draw-edge',
  DRAW_BOUNDARY = 'draw-boundary'
}

export interface Position {
  x: number;
  y: number;
}

export interface Node {
  id: string;
  type: NodeType;
  name: string;
  position: Position;
  properties: Record<string, any>;
}

export interface Edge {
  id: string;
  type: EdgeType;
  source: string;
  targets: string[];
  properties: Record<string, any>;
}

export interface Boundary {
  id: string;
  type: BoundaryType;
  name: string;
  position: Position;
  bounds: { width: number; height: number };
  properties: Record<string, any>;
}