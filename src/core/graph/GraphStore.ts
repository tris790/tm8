/**
 * Core graph state management for TM8 threat modeling
 * Handles CRUD operations with high performance for 1000+ nodes
 */

import { Node, Edge, Boundary, Graph, Position } from '../types/graph';
import { NodeType } from '../types/enums';
import { SpatialIndex } from './SpatialIndex';
import { GraphHistory } from './GraphHistory';
import { GraphValidator } from './GraphValidator';

export interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SearchOptions {
  query: string;
  fuzzyMatch: boolean;
  searchFields: ('name' | 'properties')[];
  nodeTypes: NodeType[];
}

export interface VisibilityState {
  hiddenNodes: Set<string>;
  focusedNodes: Set<string>;
  showOnlyConnected: boolean;
}

export interface GraphBatch {
  addNodes: Node[];
  updateNodes: { id: string; updates: Partial<Node> }[];
  deleteNodes: string[];
  addEdges: Edge[];
  updateEdges: { id: string; updates: Partial<Edge> }[];
  deleteEdges: string[];
  addBoundaries: Boundary[];
  updateBoundaries: { id: string; updates: Partial<Boundary> }[];
  deleteBoundaries: string[];
}

/**
 * High-performance graph store with spatial indexing and history management
 */
export class GraphStore {
  private nodes = new Map<string, Node>();
  private edges = new Map<string, Edge>();
  private boundaries = new Map<string, Boundary>();
  private spatialIndex: SpatialIndex;
  private history: GraphHistory;
  private validator: GraphValidator;
  
  // Performance optimizations
  private nodesByType = new Map<NodeType, Set<string>>();
  private edgesBySource = new Map<string, Set<string>>();
  private edgesByTarget = new Map<string, Set<string>>();
  
  // Change listeners for reactive updates
  private changeListeners = new Set<(changeType: 'node' | 'edge' | 'boundary', id: string, operation: 'add' | 'update' | 'delete') => void>();

  constructor() {
    this.spatialIndex = new SpatialIndex();
    this.history = new GraphHistory();
    this.validator = new GraphValidator();
    
    // Initialize node type tracking
    Object.values(NodeType).forEach(type => {
      this.nodesByType.set(type, new Set());
    });
  }

  // =================
  // NODE OPERATIONS
  // =================

  addNode(node: Node): void {
    if (this.validator.validateNode(node)) {
      this.history.snapshot(this.getGraph());
      
      this.nodes.set(node.id, { ...node });
      this.spatialIndex.insert(node);
      this.nodesByType.get(node.type)?.add(node.id);
      
      this.notifyChange('node', node.id, 'add');
    }
  }

  updateNode(id: string, updates: Partial<Node>): void {
    const existing = this.nodes.get(id);
    if (!existing) return;

    const updated = { ...existing, ...updates };
    if (this.validator.validateNode(updated)) {
      this.history.snapshot(this.getGraph());
      
      // Handle type changes
      if (updates.type && updates.type !== existing.type) {
        this.nodesByType.get(existing.type)?.delete(id);
        this.nodesByType.get(updates.type)?.add(id);
      }
      
      // Handle position changes for spatial index
      if (updates.position) {
        this.spatialIndex.remove(id);
        this.spatialIndex.insert(updated);
      }
      
      this.nodes.set(id, updated);
      this.notifyChange('node', id, 'update');
    }
  }

  deleteNode(id: string): void {
    const node = this.nodes.get(id);
    if (!node) return;

    this.history.snapshot(this.getGraph());
    
    // Remove from spatial index
    this.spatialIndex.remove(id);
    
    // Remove from type tracking
    this.nodesByType.get(node.type)?.delete(id);
    
    // Remove connected edges
    const connectedEdges = this.getConnectedEdges(id);
    connectedEdges.forEach(edge => this.deleteEdge(edge.id));
    
    this.nodes.delete(id);
    this.notifyChange('node', id, 'delete');
  }

  getNode(id: string): Node | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  getNodesByType(type: NodeType): Node[] {
    const nodeIds = this.nodesByType.get(type) || new Set();
    return Array.from(nodeIds).map(id => this.nodes.get(id)!).filter(Boolean);
  }

  // =================
  // EDGE OPERATIONS
  // =================

  addEdge(edge: Edge): void {
    if (this.validator.validateEdge(edge, this)) {
      this.history.snapshot(this.getGraph());
      
      this.edges.set(edge.id, { ...edge });
      
      // Update edge mappings
      const sourceEdges = this.edgesBySource.get(edge.source) || new Set();
      sourceEdges.add(edge.id);
      this.edgesBySource.set(edge.source, sourceEdges);
      
      edge.targets.forEach(target => {
        const targetEdges = this.edgesByTarget.get(target) || new Set();
        targetEdges.add(edge.id);
        this.edgesByTarget.set(target, targetEdges);
      });
      
      this.notifyChange('edge', edge.id, 'add');
    }
  }

  updateEdge(id: string, updates: Partial<Edge>): void {
    const existing = this.edges.get(id);
    if (!existing) return;

    const updated = { ...existing, ...updates };
    if (this.validator.validateEdge(updated, this)) {
      this.history.snapshot(this.getGraph());
      
      // Handle source/target changes
      if (updates.source || updates.targets) {
        this.removeEdgeFromMappings(existing);
        this.addEdgeToMappings(updated);
      }
      
      this.edges.set(id, updated);
      this.notifyChange('edge', id, 'update');
    }
  }

  deleteEdge(id: string): void {
    const edge = this.edges.get(id);
    if (!edge) return;

    this.history.snapshot(this.getGraph());
    
    this.removeEdgeFromMappings(edge);
    this.edges.delete(id);
    this.notifyChange('edge', id, 'delete');
  }

  getEdge(id: string): Edge | undefined {
    return this.edges.get(id);
  }

  getAllEdges(): Edge[] {
    return Array.from(this.edges.values());
  }

  // =================
  // BOUNDARY OPERATIONS
  // =================

  addBoundary(boundary: Boundary): void {
    if (this.validator.validateBoundary(boundary)) {
      this.history.snapshot(this.getGraph());
      this.boundaries.set(boundary.id, { ...boundary });
      this.notifyChange('boundary', boundary.id, 'add');
    }
  }

  updateBoundary(id: string, updates: Partial<Boundary>): void {
    const existing = this.boundaries.get(id);
    if (!existing) return;

    const updated = { ...existing, ...updates };
    if (this.validator.validateBoundary(updated)) {
      this.history.snapshot(this.getGraph());
      this.boundaries.set(id, updated);
      this.notifyChange('boundary', id, 'update');
    }
  }

  deleteBoundary(id: string): void {
    if (this.boundaries.has(id)) {
      this.history.snapshot(this.getGraph());
      this.boundaries.delete(id);
      this.notifyChange('boundary', id, 'delete');
    }
  }

  getBoundary(id: string): Boundary | undefined {
    return this.boundaries.get(id);
  }

  getAllBoundaries(): Boundary[] {
    return Array.from(this.boundaries.values());
  }

  // =================
  // SPATIAL QUERIES
  // =================

  getNodesInRegion(bounds: ViewportBounds): Node[] {
    return this.spatialIndex.query(bounds);
  }

  findNearestNode(point: Position, maxDistance: number): Node | null {
    const nearest = this.spatialIndex.nearest(point, maxDistance);
    return nearest.length > 0 ? nearest[0] : null;
  }

  // =================
  // GRAPH QUERIES
  // =================

  getConnectedNodes(nodeId: string): Node[] {
    const connectedIds = new Set<string>();
    
    // Get outgoing connections
    const outgoingEdges = this.edgesBySource.get(nodeId) || new Set();
    outgoingEdges.forEach(edgeId => {
      const edge = this.edges.get(edgeId);
      if (edge) {
        edge.targets.forEach(target => connectedIds.add(target));
      }
    });
    
    // Get incoming connections
    const incomingEdges = this.edgesByTarget.get(nodeId) || new Set();
    incomingEdges.forEach(edgeId => {
      const edge = this.edges.get(edgeId);
      if (edge) {
        connectedIds.add(edge.source);
      }
    });
    
    return Array.from(connectedIds).map(id => this.nodes.get(id)!).filter(Boolean);
  }

  getConnectedEdges(nodeId: string): Edge[] {
    const edgeIds = new Set<string>();
    
    // Get outgoing edges
    const outgoing = this.edgesBySource.get(nodeId) || new Set();
    outgoing.forEach(id => edgeIds.add(id));
    
    // Get incoming edges
    const incoming = this.edgesByTarget.get(nodeId) || new Set();
    incoming.forEach(id => edgeIds.add(id));
    
    return Array.from(edgeIds).map(id => this.edges.get(id)!).filter(Boolean);
  }

  // =================
  // SEARCH & FILTERING
  // =================

  findNodesByName(query: string): Node[] {
    const searchTerm = query.toLowerCase();
    return this.getAllNodes().filter(node => 
      node.name.toLowerCase().includes(searchTerm)
    );
  }

  searchNodes(options: SearchOptions): Node[] {
    const { query, fuzzyMatch, searchFields, nodeTypes } = options;
    const searchTerm = query.toLowerCase();
    
    return this.getAllNodes().filter(node => {
      // Filter by node types
      if (nodeTypes.length > 0 && !nodeTypes.includes(node.type)) {
        return false;
      }
      
      // Search in specified fields
      let matches = false;
      
      if (searchFields.includes('name')) {
        if (fuzzyMatch) {
          matches = matches || this.fuzzyMatch(node.name.toLowerCase(), searchTerm);
        } else {
          matches = matches || node.name.toLowerCase().includes(searchTerm);
        }
      }
      
      if (searchFields.includes('properties')) {
        const propsString = JSON.stringify(node.properties).toLowerCase();
        if (fuzzyMatch) {
          matches = matches || this.fuzzyMatch(propsString, searchTerm);
        } else {
          matches = matches || propsString.includes(searchTerm);
        }
      }
      
      return matches;
    });
  }

  applyVisibilityFilter(state: VisibilityState): Node[] {
    let visibleNodes = this.getAllNodes();
    
    // Handle focused nodes
    if (state.focusedNodes.size > 0) {
      const focusedIds = state.focusedNodes;
      const connectedIds = new Set<string>();
      
      // Add all connected nodes if showOnlyConnected is true
      if (state.showOnlyConnected) {
        focusedIds.forEach(nodeId => {
          const connected = this.getConnectedNodes(nodeId);
          connected.forEach(node => connectedIds.add(node.id));
        });
      }
      
      visibleNodes = visibleNodes.filter(node => 
        focusedIds.has(node.id) || connectedIds.has(node.id)
      );
    }
    
    // Remove hidden nodes
    visibleNodes = visibleNodes.filter(node => 
      !state.hiddenNodes.has(node.id)
    );
    
    return visibleNodes;
  }

  // =================
  // BATCH OPERATIONS
  // =================

  applyBatch(batch: GraphBatch): void {
    this.history.snapshot();
    
    // Add operations
    batch.addNodes.forEach(node => {
      if (this.validator.validateNode(node)) {
        this.nodes.set(node.id, { ...node });
        this.spatialIndex.insert(node);
        this.nodesByType.get(node.type)?.add(node.id);
      }
    });
    
    batch.addEdges.forEach(edge => {
      if (this.validator.validateEdge(edge, this)) {
        this.edges.set(edge.id, { ...edge });
        this.addEdgeToMappings(edge);
      }
    });
    
    batch.addBoundaries.forEach(boundary => {
      if (this.validator.validateBoundary(boundary)) {
        this.boundaries.set(boundary.id, { ...boundary });
      }
    });
    
    // Update operations
    batch.updateNodes.forEach(({ id, updates }) => {
      const existing = this.nodes.get(id);
      if (existing) {
        const updated = { ...existing, ...updates };
        if (this.validator.validateNode(updated)) {
          if (updates.position) {
            this.spatialIndex.remove(id);
            this.spatialIndex.insert(updated);
          }
          this.nodes.set(id, updated);
        }
      }
    });
    
    // Delete operations (order matters - edges first, then nodes)
    batch.deleteEdges.forEach(id => {
      const edge = this.edges.get(id);
      if (edge) {
        this.removeEdgeFromMappings(edge);
        this.edges.delete(id);
      }
    });
    
    batch.deleteNodes.forEach(id => {
      const node = this.nodes.get(id);
      if (node) {
        this.spatialIndex.remove(id);
        this.nodesByType.get(node.type)?.delete(id);
        this.nodes.delete(id);
      }
    });
    
    batch.deleteBoundaries.forEach(id => {
      this.boundaries.delete(id);
    });
    
    // Notify all changes
    this.notifyChange('node', 'batch', 'update');
  }

  // =================
  // HISTORY MANAGEMENT
  // =================

  undo(): Graph | null {
    const previousState = this.history.undo();
    if (previousState) {
      this.loadGraph(previousState);
      return this.getGraph();
    }
    return null;
  }

  redo(): Graph | null {
    const nextState = this.history.redo();
    if (nextState) {
      this.loadGraph(nextState);
      return this.getGraph();
    }
    return null;
  }

  canUndo(): boolean {
    return this.history.canUndo();
  }

  canRedo(): boolean {
    return this.history.canRedo();
  }

  // =================
  // GRAPH SERIALIZATION
  // =================

  getGraph(): Graph {
    return {
      nodes: this.getAllNodes(),
      edges: this.getAllEdges(),
      boundaries: this.getAllBoundaries(),
      metadata: {
        name: 'Untitled',
        version: '1.0',
        created: new Date(),
        modified: new Date()
      }
    };
  }

  loadGraph(graph: Graph): void {
    // Clear existing data
    this.clear();
    
    // Load new data
    graph.nodes.forEach(node => this.addNode(node));
    graph.edges.forEach(edge => this.addEdge(edge));
    graph.boundaries.forEach(boundary => this.addBoundary(boundary));
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.boundaries.clear();
    this.spatialIndex = new SpatialIndex();
    this.edgesBySource.clear();
    this.edgesByTarget.clear();
    
    // Reset node type tracking
    Object.values(NodeType).forEach(type => {
      this.nodesByType.set(type, new Set());
    });
  }

  // =================
  // EVENT MANAGEMENT
  // =================

  addChangeListener(listener: (changeType: 'node' | 'edge' | 'boundary', id: string, operation: 'add' | 'update' | 'delete') => void): void {
    this.changeListeners.add(listener);
  }

  removeChangeListener(listener: (changeType: 'node' | 'edge' | 'boundary', id: string, operation: 'add' | 'update' | 'delete') => void): void {
    this.changeListeners.delete(listener);
  }

  // =================
  // PRIVATE HELPERS
  // =================

  private addEdgeToMappings(edge: Edge): void {
    const sourceEdges = this.edgesBySource.get(edge.source) || new Set();
    sourceEdges.add(edge.id);
    this.edgesBySource.set(edge.source, sourceEdges);
    
    edge.targets.forEach(target => {
      const targetEdges = this.edgesByTarget.get(target) || new Set();
      targetEdges.add(edge.id);
      this.edgesByTarget.set(target, targetEdges);
    });
  }

  private removeEdgeFromMappings(edge: Edge): void {
    this.edgesBySource.get(edge.source)?.delete(edge.id);
    edge.targets.forEach(target => {
      this.edgesByTarget.get(target)?.delete(edge.id);
    });
  }

  private notifyChange(changeType: 'node' | 'edge' | 'boundary', id: string, operation: 'add' | 'update' | 'delete'): void {
    this.changeListeners.forEach(listener => listener(changeType, id, operation));
  }

  private fuzzyMatch(text: string, query: string): boolean {
    // Simple fuzzy matching algorithm
    let textIndex = 0;
    let queryIndex = 0;
    
    while (textIndex < text.length && queryIndex < query.length) {
      if (text[textIndex] === query[queryIndex]) {
        queryIndex++;
      }
      textIndex++;
    }
    
    return queryIndex === query.length;
  }
}