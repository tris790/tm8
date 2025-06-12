/**
 * Core enums for the TM8 threat modeling application
 */

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