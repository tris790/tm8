/**
 * Graph data validation for ensuring data integrity
 * Validates nodes, edges, boundaries and graph consistency
 */

import { Node, Edge, Boundary, Graph, Position } from '../types/graph';
import { NodeType, EdgeType, BoundaryType } from '../types/enums';
import { GraphStore } from './GraphStore';

export interface ValidationError {
  type: 'error' | 'warning';
  code: string;
  message: string;
  entityId?: string;
  entityType?: 'node' | 'edge' | 'boundary';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Comprehensive graph validation system
 */
export class GraphValidator {
  private readonly nodeValidators: Array<(node: Node) => ValidationError[]>;
  private readonly edgeValidators: Array<(edge: Edge, store?: GraphStore) => ValidationError[]>;
  private readonly boundaryValidators: Array<(boundary: Boundary) => ValidationError[]>;
  private readonly graphValidators: Array<(graph: Graph) => ValidationError[]>;

  constructor() {
    this.nodeValidators = [
      this.validateNodeBasics.bind(this),
      this.validateNodePosition.bind(this),
      this.validateNodeProperties.bind(this),
      this.validateNodeType.bind(this)
    ];

    this.edgeValidators = [
      this.validateEdgeBasics.bind(this),
      this.validateEdgeTargets.bind(this),
      this.validateEdgeProperties.bind(this),
      this.validateEdgeType.bind(this),
      this.validateEdgeConnections.bind(this)
    ];

    this.boundaryValidators = [
      this.validateBoundaryBasics.bind(this),
      this.validateBoundaryPosition.bind(this),
      this.validateBoundarySize.bind(this),
      this.validateBoundaryProperties.bind(this),
      this.validateBoundaryType.bind(this)
    ];

    this.graphValidators = [
      this.validateGraphStructure.bind(this),
      this.validateGraphConnectivity.bind(this),
      this.validateGraphConsistency.bind(this)
    ];
  }

  // =================
  // PUBLIC VALIDATION METHODS
  // =================

  /**
   * Validate a single node
   */
  validateNode(node: Node): boolean {
    const errors = this.runValidators(this.nodeValidators, node);
    return errors.filter(e => e.type === 'error').length === 0;
  }

  /**
   * Validate a single edge
   */
  validateEdge(edge: Edge, store?: GraphStore): boolean {
    const errors = this.runValidators(this.edgeValidators, edge, store);
    return errors.filter(e => e.type === 'error').length === 0;
  }

  /**
   * Validate a single boundary
   */
  validateBoundary(boundary: Boundary): boolean {
    const errors = this.runValidators(this.boundaryValidators, boundary);
    return errors.filter(e => e.type === 'error').length === 0;
  }

  /**
   * Validate an entire graph
   */
  validateGraph(graph: Graph): ValidationResult {
    const allErrors: ValidationError[] = [];

    // Validate individual nodes
    for (const node of graph.nodes) {
      const nodeErrors = this.runValidators(this.nodeValidators, node);
      allErrors.push(...nodeErrors);
    }

    // Validate individual edges
    for (const edge of graph.edges) {
      const edgeErrors = this.runValidators(this.edgeValidators, edge);
      allErrors.push(...edgeErrors);
    }

    // Validate individual boundaries
    for (const boundary of graph.boundaries) {
      const boundaryErrors = this.runValidators(this.boundaryValidators, boundary);
      allErrors.push(...boundaryErrors);
    }

    // Validate graph-level constraints
    const graphErrors = this.runValidators(this.graphValidators, graph);
    allErrors.push(...graphErrors);

    const errors = allErrors.filter(e => e.type === 'error');
    const warnings = allErrors.filter(e => e.type === 'warning');

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get detailed validation report for a graph
   */
  getValidationReport(graph: Graph): {
    summary: { totalErrors: number; totalWarnings: number; isValid: boolean };
    nodeIssues: { nodeId: string; issues: ValidationError[] }[];
    edgeIssues: { edgeId: string; issues: ValidationError[] }[];
    boundaryIssues: { boundaryId: string; issues: ValidationError[] }[];
    graphIssues: ValidationError[];
  } {
    const nodeIssues: { nodeId: string; issues: ValidationError[] }[] = [];
    const edgeIssues: { edgeId: string; issues: ValidationError[] }[] = [];
    const boundaryIssues: { boundaryId: string; issues: ValidationError[] }[] = [];

    // Validate nodes
    for (const node of graph.nodes) {
      const issues = this.runValidators(this.nodeValidators, node);
      if (issues.length > 0) {
        nodeIssues.push({ nodeId: node.id, issues });
      }
    }

    // Validate edges
    for (const edge of graph.edges) {
      const issues = this.runValidators(this.edgeValidators, edge);
      if (issues.length > 0) {
        edgeIssues.push({ edgeId: edge.id, issues });
      }
    }

    // Validate boundaries
    for (const boundary of graph.boundaries) {
      const issues = this.runValidators(this.boundaryValidators, boundary);
      if (issues.length > 0) {
        boundaryIssues.push({ boundaryId: boundary.id, issues });
      }
    }

    // Validate graph-level
    const graphIssues = this.runValidators(this.graphValidators, graph);

    const allIssues = [
      ...nodeIssues.flatMap(n => n.issues),
      ...edgeIssues.flatMap(e => e.issues),
      ...boundaryIssues.flatMap(b => b.issues),
      ...graphIssues
    ];

    return {
      summary: {
        totalErrors: allIssues.filter(i => i.type === 'error').length,
        totalWarnings: allIssues.filter(i => i.type === 'warning').length,
        isValid: allIssues.filter(i => i.type === 'error').length === 0
      },
      nodeIssues,
      edgeIssues,
      boundaryIssues,
      graphIssues
    };
  }

  // =================
  // NODE VALIDATORS
  // =================

  private validateNodeBasics(node: Node): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!node.id || typeof node.id !== 'string' || node.id.trim() === '') {
      errors.push({
        type: 'error',
        code: 'NODE_INVALID_ID',
        message: 'Node must have a valid non-empty ID',
        entityId: node.id,
        entityType: 'node'
      });
    }

    if (!node.name || typeof node.name !== 'string' || node.name.trim() === '') {
      errors.push({
        type: 'error',
        code: 'NODE_INVALID_NAME',
        message: 'Node must have a valid non-empty name',
        entityId: node.id,
        entityType: 'node'
      });
    }

    if (node.name && node.name.length > 100) {
      errors.push({
        type: 'warning',
        code: 'NODE_NAME_TOO_LONG',
        message: 'Node name is unusually long (>100 characters)',
        entityId: node.id,
        entityType: 'node'
      });
    }

    return errors;
  }

  private validateNodePosition(node: Node): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!node.position || typeof node.position !== 'object') {
      errors.push({
        type: 'error',
        code: 'NODE_INVALID_POSITION',
        message: 'Node must have a valid position object',
        entityId: node.id,
        entityType: 'node'
      });
      return errors;
    }

    if (typeof node.position.x !== 'number' || !isFinite(node.position.x)) {
      errors.push({
        type: 'error',
        code: 'NODE_INVALID_X',
        message: 'Node position.x must be a finite number',
        entityId: node.id,
        entityType: 'node'
      });
    }

    if (typeof node.position.y !== 'number' || !isFinite(node.position.y)) {
      errors.push({
        type: 'error',
        code: 'NODE_INVALID_Y',
        message: 'Node position.y must be a finite number',
        entityId: node.id,
        entityType: 'node'
      });
    }

    // Check for extreme positions that might cause rendering issues
    const maxCoordinate = 1000000;
    if (Math.abs(node.position.x) > maxCoordinate || Math.abs(node.position.y) > maxCoordinate) {
      errors.push({
        type: 'warning',
        code: 'NODE_EXTREME_POSITION',
        message: 'Node position is extremely far from origin, may cause rendering issues',
        entityId: node.id,
        entityType: 'node'
      });
    }

    return errors;
  }

  private validateNodeProperties(node: Node): ValidationError[] {
    const errors: ValidationError[] = [];

    if (node.properties && typeof node.properties !== 'object') {
      errors.push({
        type: 'error',
        code: 'NODE_INVALID_PROPERTIES',
        message: 'Node properties must be an object',
        entityId: node.id,
        entityType: 'node'
      });
    }

    if (node.properties) {
      const propertyCount = Object.keys(node.properties).length;
      if (propertyCount > 50) {
        errors.push({
          type: 'warning',
          code: 'NODE_TOO_MANY_PROPERTIES',
          message: `Node has ${propertyCount} properties, which may impact performance`,
          entityId: node.id,
          entityType: 'node'
        });
      }

      // Check for very large property values
      for (const [key, value] of Object.entries(node.properties)) {
        const valueStr = JSON.stringify(value);
        if (valueStr.length > 10000) {
          errors.push({
            type: 'warning',
            code: 'NODE_LARGE_PROPERTY',
            message: `Property '${key}' is very large (${valueStr.length} chars)`,
            entityId: node.id,
            entityType: 'node'
          });
        }
      }
    }

    return errors;
  }

  private validateNodeType(node: Node): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!Object.values(NodeType).includes(node.type)) {
      errors.push({
        type: 'error',
        code: 'NODE_INVALID_TYPE',
        message: `Invalid node type: ${node.type}. Must be one of: ${Object.values(NodeType).join(', ')}`,
        entityId: node.id,
        entityType: 'node'
      });
    }

    return errors;
  }

  // =================
  // EDGE VALIDATORS
  // =================

  private validateEdgeBasics(edge: Edge): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!edge.id || typeof edge.id !== 'string' || edge.id.trim() === '') {
      errors.push({
        type: 'error',
        code: 'EDGE_INVALID_ID',
        message: 'Edge must have a valid non-empty ID',
        entityId: edge.id,
        entityType: 'edge'
      });
    }

    if (!edge.source || typeof edge.source !== 'string' || edge.source.trim() === '') {
      errors.push({
        type: 'error',
        code: 'EDGE_INVALID_SOURCE',
        message: 'Edge must have a valid source node ID',
        entityId: edge.id,
        entityType: 'edge'
      });
    }

    return errors;
  }

  private validateEdgeTargets(edge: Edge): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!Array.isArray(edge.targets)) {
      errors.push({
        type: 'error',
        code: 'EDGE_INVALID_TARGETS',
        message: 'Edge targets must be an array',
        entityId: edge.id,
        entityType: 'edge'
      });
      return errors;
    }

    if (edge.targets.length === 0) {
      errors.push({
        type: 'error',
        code: 'EDGE_NO_TARGETS',
        message: 'Edge must have at least one target',
        entityId: edge.id,
        entityType: 'edge'
      });
    }

    if (edge.targets.length > 10) {
      errors.push({
        type: 'warning',
        code: 'EDGE_MANY_TARGETS',
        message: `Edge has ${edge.targets.length} targets, which may be unusually complex`,
        entityId: edge.id,
        entityType: 'edge'
      });
    }

    for (const target of edge.targets) {
      if (!target || typeof target !== 'string' || target.trim() === '') {
        errors.push({
          type: 'error',
          code: 'EDGE_INVALID_TARGET',
          message: 'All edge targets must be valid non-empty node IDs',
          entityId: edge.id,
          entityType: 'edge'
        });
      }
    }

    // Check for duplicate targets
    const uniqueTargets = new Set(edge.targets);
    if (uniqueTargets.size !== edge.targets.length) {
      errors.push({
        type: 'warning',
        code: 'EDGE_DUPLICATE_TARGETS',
        message: 'Edge has duplicate targets',
        entityId: edge.id,
        entityType: 'edge'
      });
    }

    // Check for self-loops
    if (edge.targets.includes(edge.source)) {
      errors.push({
        type: 'warning',
        code: 'EDGE_SELF_LOOP',
        message: 'Edge creates a self-loop (source equals target)',
        entityId: edge.id,
        entityType: 'edge'
      });
    }

    return errors;
  }

  private validateEdgeProperties(edge: Edge): ValidationError[] {
    const errors: ValidationError[] = [];

    if (edge.properties && typeof edge.properties !== 'object') {
      errors.push({
        type: 'error',
        code: 'EDGE_INVALID_PROPERTIES',
        message: 'Edge properties must be an object',
        entityId: edge.id,
        entityType: 'edge'
      });
    }

    return errors;
  }

  private validateEdgeType(edge: Edge): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!Object.values(EdgeType).includes(edge.type)) {
      errors.push({
        type: 'error',
        code: 'EDGE_INVALID_TYPE',
        message: `Invalid edge type: ${edge.type}. Must be one of: ${Object.values(EdgeType).join(', ')}`,
        entityId: edge.id,
        entityType: 'edge'
      });
    }

    return errors;
  }

  private validateEdgeConnections(edge: Edge, store?: GraphStore): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!store) return errors; // Can't validate connections without store

    // Check if source node exists
    if (!store.getNode(edge.source)) {
      errors.push({
        type: 'error',
        code: 'EDGE_SOURCE_NOT_FOUND',
        message: `Edge source node '${edge.source}' not found`,
        entityId: edge.id,
        entityType: 'edge'
      });
    }

    // Check if target nodes exist
    for (const target of edge.targets) {
      if (!store.getNode(target)) {
        errors.push({
          type: 'error',
          code: 'EDGE_TARGET_NOT_FOUND',
          message: `Edge target node '${target}' not found`,
          entityId: edge.id,
          entityType: 'edge'
        });
      }
    }

    return errors;
  }

  // =================
  // BOUNDARY VALIDATORS
  // =================

  private validateBoundaryBasics(boundary: Boundary): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!boundary.id || typeof boundary.id !== 'string' || boundary.id.trim() === '') {
      errors.push({
        type: 'error',
        code: 'BOUNDARY_INVALID_ID',
        message: 'Boundary must have a valid non-empty ID',
        entityId: boundary.id,
        entityType: 'boundary'
      });
    }

    if (!boundary.name || typeof boundary.name !== 'string' || boundary.name.trim() === '') {
      errors.push({
        type: 'error',
        code: 'BOUNDARY_INVALID_NAME',
        message: 'Boundary must have a valid non-empty name',
        entityId: boundary.id,
        entityType: 'boundary'
      });
    }

    return errors;
  }

  private validateBoundaryPosition(boundary: Boundary): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!boundary.position || typeof boundary.position !== 'object') {
      errors.push({
        type: 'error',
        code: 'BOUNDARY_INVALID_POSITION',
        message: 'Boundary must have a valid position object',
        entityId: boundary.id,
        entityType: 'boundary'
      });
      return errors;
    }

    if (typeof boundary.position.x !== 'number' || !isFinite(boundary.position.x)) {
      errors.push({
        type: 'error',
        code: 'BOUNDARY_INVALID_X',
        message: 'Boundary position.x must be a finite number',
        entityId: boundary.id,
        entityType: 'boundary'
      });
    }

    if (typeof boundary.position.y !== 'number' || !isFinite(boundary.position.y)) {
      errors.push({
        type: 'error',
        code: 'BOUNDARY_INVALID_Y',
        message: 'Boundary position.y must be a finite number',
        entityId: boundary.id,
        entityType: 'boundary'
      });
    }

    return errors;
  }

  private validateBoundarySize(boundary: Boundary): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!boundary.bounds || typeof boundary.bounds !== 'object') {
      errors.push({
        type: 'error',
        code: 'BOUNDARY_INVALID_BOUNDS',
        message: 'Boundary must have a valid bounds object',
        entityId: boundary.id,
        entityType: 'boundary'
      });
      return errors;
    }

    if (typeof boundary.bounds.width !== 'number' || !isFinite(boundary.bounds.width) || boundary.bounds.width <= 0) {
      errors.push({
        type: 'error',
        code: 'BOUNDARY_INVALID_WIDTH',
        message: 'Boundary width must be a positive finite number',
        entityId: boundary.id,
        entityType: 'boundary'
      });
    }

    if (typeof boundary.bounds.height !== 'number' || !isFinite(boundary.bounds.height) || boundary.bounds.height <= 0) {
      errors.push({
        type: 'error',
        code: 'BOUNDARY_INVALID_HEIGHT',
        message: 'Boundary height must be a positive finite number',
        entityId: boundary.id,
        entityType: 'boundary'
      });
    }

    // Check for extremely large boundaries
    if (boundary.bounds.width > 100000 || boundary.bounds.height > 100000) {
      errors.push({
        type: 'warning',
        code: 'BOUNDARY_VERY_LARGE',
        message: 'Boundary is extremely large, may cause performance issues',
        entityId: boundary.id,
        entityType: 'boundary'
      });
    }

    return errors;
  }

  private validateBoundaryProperties(boundary: Boundary): ValidationError[] {
    const errors: ValidationError[] = [];

    if (boundary.properties && typeof boundary.properties !== 'object') {
      errors.push({
        type: 'error',
        code: 'BOUNDARY_INVALID_PROPERTIES',
        message: 'Boundary properties must be an object',
        entityId: boundary.id,
        entityType: 'boundary'
      });
    }

    return errors;
  }

  private validateBoundaryType(boundary: Boundary): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!Object.values(BoundaryType).includes(boundary.type)) {
      errors.push({
        type: 'error',
        code: 'BOUNDARY_INVALID_TYPE',
        message: `Invalid boundary type: ${boundary.type}. Must be one of: ${Object.values(BoundaryType).join(', ')}`,
        entityId: boundary.id,
        entityType: 'boundary'
      });
    }

    return errors;
  }

  // =================
  // GRAPH VALIDATORS
  // =================

  private validateGraphStructure(graph: Graph): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for duplicate IDs across all entities
    const allIds = new Set<string>();
    const duplicateIds = new Set<string>();

    for (const node of graph.nodes) {
      if (allIds.has(node.id)) {
        duplicateIds.add(node.id);
      }
      allIds.add(node.id);
    }

    for (const edge of graph.edges) {
      if (allIds.has(edge.id)) {
        duplicateIds.add(edge.id);
      }
      allIds.add(edge.id);
    }

    for (const boundary of graph.boundaries) {
      if (allIds.has(boundary.id)) {
        duplicateIds.add(boundary.id);
      }
      allIds.add(boundary.id);
    }

    for (const id of duplicateIds) {
      errors.push({
        type: 'error',
        code: 'GRAPH_DUPLICATE_ID',
        message: `Duplicate ID found: ${id}`,
        entityId: id
      });
    }

    return errors;
  }

  private validateGraphConnectivity(graph: Graph): ValidationError[] {
    const errors: ValidationError[] = [];

    const nodeIds = new Set(graph.nodes.map(n => n.id));

    // Check for orphaned edges (references to non-existent nodes)
    for (const edge of graph.edges) {
      if (!nodeIds.has(edge.source)) {
        errors.push({
          type: 'error',
          code: 'GRAPH_ORPHANED_EDGE',
          message: `Edge '${edge.id}' references non-existent source node '${edge.source}'`,
          entityId: edge.id,
          entityType: 'edge'
        });
      }

      for (const target of edge.targets) {
        if (!nodeIds.has(target)) {
          errors.push({
            type: 'error',
            code: 'GRAPH_ORPHANED_EDGE',
            message: `Edge '${edge.id}' references non-existent target node '${target}'`,
            entityId: edge.id,
            entityType: 'edge'
          });
        }
      }
    }

    return errors;
  }

  private validateGraphConsistency(graph: Graph): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for reasonable graph size
    if (graph.nodes.length > 10000) {
      errors.push({
        type: 'warning',
        code: 'GRAPH_VERY_LARGE',
        message: `Graph has ${graph.nodes.length} nodes, which may impact performance`,
      });
    }

    if (graph.edges.length > 50000) {
      errors.push({
        type: 'warning',
        code: 'GRAPH_MANY_EDGES',
        message: `Graph has ${graph.edges.length} edges, which may impact performance`,
      });
    }

    // Check for isolated components (warning only)
    const connectedNodes = new Set<string>();
    for (const edge of graph.edges) {
      connectedNodes.add(edge.source);
      edge.targets.forEach(target => connectedNodes.add(target));
    }

    const isolatedNodes = graph.nodes.filter(node => !connectedNodes.has(node.id));
    if (isolatedNodes.length > 0) {
      errors.push({
        type: 'warning',
        code: 'GRAPH_ISOLATED_NODES',
        message: `Found ${isolatedNodes.length} isolated nodes with no connections`,
      });
    }

    return errors;
  }

  // =================
  // HELPER METHODS
  // =================

  private runValidators<T>(validators: Array<(item: T, ...args: any[]) => ValidationError[]>, item: T, ...args: any[]): ValidationError[] {
    const allErrors: ValidationError[] = [];
    
    for (const validator of validators) {
      try {
        const errors = validator(item, ...args);
        allErrors.push(...errors);
      } catch (error) {
        // If a validator throws, treat it as a validation error
        allErrors.push({
          type: 'error',
          code: 'VALIDATOR_ERROR',
          message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    return allErrors;
  }
}