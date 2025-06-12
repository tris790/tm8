/**
 * Graph history management for undo/redo functionality
 * Efficient memory usage with compressed snapshots
 */

import { Graph, Node, Edge, Boundary } from '../types/graph';

export interface GraphSnapshot {
  nodes: Node[];
  edges: Edge[];
  boundaries: Boundary[];
  timestamp: number;
}

export interface HistoryStats {
  undoStackSize: number;
  redoStackSize: number;
  memoryUsage: number; // Rough estimate in bytes
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Manages graph history with efficient undo/redo functionality
 */
export class GraphHistory {
  private undoStack: GraphSnapshot[] = [];
  private redoStack: GraphSnapshot[] = [];
  private readonly maxHistorySize: number;
  private readonly compressionThreshold: number;
  
  // Performance optimizations
  private lastSnapshot: GraphSnapshot | null = null;
  private snapshotCount = 0;

  constructor(maxHistorySize: number = 50, compressionThreshold: number = 10) {
    this.maxHistorySize = maxHistorySize;
    this.compressionThreshold = compressionThreshold;
  }

  /**
   * Create a snapshot of the current graph state
   */
  snapshot(graph?: Graph): void {
    if (!graph) {
      // If no graph provided, this is called before an operation
      // We'll store the current state when the actual graph is passed
      return;
    }

    const snapshot: GraphSnapshot = {
      nodes: this.deepCloneArray(graph.nodes),
      edges: this.deepCloneArray(graph.edges),
      boundaries: this.deepCloneArray(graph.boundaries),
      timestamp: Date.now()
    };

    // Only add if different from last snapshot (avoid duplicate snapshots)
    if (!this.isSnapshotIdentical(snapshot, this.lastSnapshot)) {
      this.undoStack.push(snapshot);
      this.lastSnapshot = this.deepCloneSnapshot(snapshot);
      this.snapshotCount++;
      
      // Clear redo stack when new action is performed
      this.redoStack = [];
      
      // Manage memory by removing old snapshots
      this.trimHistory();
      
      // Compress history periodically for memory efficiency
      if (this.snapshotCount % this.compressionThreshold === 0) {
        this.compressHistory();
      }
    }
  }

  /**
   * Undo the last operation
   */
  undo(): GraphSnapshot | null {
    if (this.undoStack.length === 0) {
      return null;
    }

    const currentSnapshot = this.undoStack.pop()!;
    this.redoStack.push(currentSnapshot);
    
    // Return the previous state (or null if no more history)
    const previousSnapshot = this.undoStack.length > 0 
      ? this.undoStack[this.undoStack.length - 1] 
      : this.createEmptySnapshot();
    
    this.lastSnapshot = this.deepCloneSnapshot(previousSnapshot);
    return previousSnapshot;
  }

  /**
   * Redo the last undone operation
   */
  redo(): GraphSnapshot | null {
    if (this.redoStack.length === 0) {
      return null;
    }

    const redoSnapshot = this.redoStack.pop()!;
    this.undoStack.push(redoSnapshot);
    
    this.lastSnapshot = this.deepCloneSnapshot(redoSnapshot);
    return redoSnapshot;
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Get current history statistics
   */
  getStats(): HistoryStats {
    return {
      undoStackSize: this.undoStack.length,
      redoStackSize: this.redoStack.length,
      memoryUsage: this.estimateMemoryUsage(),
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    };
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.lastSnapshot = null;
    this.snapshotCount = 0;
  }

  /**
   * Get the current snapshot without modifying history
   */
  getCurrentSnapshot(): GraphSnapshot | null {
    return this.lastSnapshot ? this.deepCloneSnapshot(this.lastSnapshot) : null;
  }

  /**
   * Set a custom snapshot (useful for loading saved files)
   */
  setCurrentSnapshot(snapshot: GraphSnapshot): void {
    this.lastSnapshot = this.deepCloneSnapshot(snapshot);
    this.undoStack.push(snapshot);
    this.redoStack = [];
  }

  /**
   * Get a specific snapshot from history by index
   */
  getSnapshot(index: number): GraphSnapshot | null {
    if (index < 0 || index >= this.undoStack.length) {
      return null;
    }
    return this.deepCloneSnapshot(this.undoStack[index]);
  }

  /**
   * Get all snapshots (for debugging/analysis)
   */
  getAllSnapshots(): GraphSnapshot[] {
    return this.undoStack.map(snapshot => this.deepCloneSnapshot(snapshot));
  }

  // =================
  // PRIVATE METHODS
  // =================

  private deepCloneArray<T>(array: T[]): T[] {
    return array.map(item => ({ ...item }));
  }

  private deepCloneSnapshot(snapshot: GraphSnapshot): GraphSnapshot {
    return {
      nodes: this.deepCloneArray(snapshot.nodes),
      edges: this.deepCloneArray(snapshot.edges),
      boundaries: this.deepCloneArray(snapshot.boundaries),
      timestamp: snapshot.timestamp
    };
  }

  private isSnapshotIdentical(snapshot1: GraphSnapshot, snapshot2: GraphSnapshot | null): boolean {
    if (!snapshot2) return false;

    // Quick length check
    if (snapshot1.nodes.length !== snapshot2.nodes.length ||
        snapshot1.edges.length !== snapshot2.edges.length ||
        snapshot1.boundaries.length !== snapshot2.boundaries.length) {
      return false;
    }

    // Check nodes
    for (let i = 0; i < snapshot1.nodes.length; i++) {
      if (!this.areNodesEqual(snapshot1.nodes[i], snapshot2.nodes[i])) {
        return false;
      }
    }

    // Check edges
    for (let i = 0; i < snapshot1.edges.length; i++) {
      if (!this.areEdgesEqual(snapshot1.edges[i], snapshot2.edges[i])) {
        return false;
      }
    }

    // Check boundaries
    for (let i = 0; i < snapshot1.boundaries.length; i++) {
      if (!this.areBoundariesEqual(snapshot1.boundaries[i], snapshot2.boundaries[i])) {
        return false;
      }
    }

    return true;
  }

  private areNodesEqual(node1: Node, node2: Node): boolean {
    return node1.id === node2.id &&
           node1.type === node2.type &&
           node1.name === node2.name &&
           node1.position.x === node2.position.x &&
           node1.position.y === node2.position.y &&
           JSON.stringify(node1.properties) === JSON.stringify(node2.properties);
  }

  private areEdgesEqual(edge1: Edge, edge2: Edge): boolean {
    return edge1.id === edge2.id &&
           edge1.type === edge2.type &&
           edge1.source === edge2.source &&
           JSON.stringify(edge1.targets.sort()) === JSON.stringify(edge2.targets.sort()) &&
           JSON.stringify(edge1.properties) === JSON.stringify(edge2.properties);
  }

  private areBoundariesEqual(boundary1: Boundary, boundary2: Boundary): boolean {
    return boundary1.id === boundary2.id &&
           boundary1.type === boundary2.type &&
           boundary1.name === boundary2.name &&
           boundary1.position.x === boundary2.position.x &&
           boundary1.position.y === boundary2.position.y &&
           boundary1.bounds.width === boundary2.bounds.width &&
           boundary1.bounds.height === boundary2.bounds.height &&
           JSON.stringify(boundary1.properties) === JSON.stringify(boundary2.properties);
  }

  private trimHistory(): void {
    // Remove oldest snapshots if we exceed max size
    while (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }

    // Also trim redo stack if needed
    while (this.redoStack.length > this.maxHistorySize / 2) {
      this.redoStack.shift();
    }
  }

  private compressHistory(): void {
    // Simple compression: remove every other snapshot from the middle of history
    // This keeps recent and old snapshots while reducing memory usage
    if (this.undoStack.length > this.maxHistorySize * 0.8) {
      const keepCount = Math.floor(this.maxHistorySize * 0.6);
      const recentCount = Math.floor(keepCount * 0.3);
      const oldCount = keepCount - recentCount;

      // Keep the most recent snapshots
      const recentSnapshots = this.undoStack.slice(-recentCount);
      
      // Keep some of the oldest snapshots (every nth)
      const oldSnapshots: GraphSnapshot[] = [];
      const step = Math.max(1, Math.floor((this.undoStack.length - recentCount) / oldCount));
      
      for (let i = 0; i < this.undoStack.length - recentCount; i += step) {
        oldSnapshots.push(this.undoStack[i]);
        if (oldSnapshots.length >= oldCount) break;
      }

      this.undoStack = [...oldSnapshots, ...recentSnapshots];
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in bytes
    let totalSize = 0;

    const estimateObjectSize = (obj: any): number => {
      return JSON.stringify(obj).length * 2; // Rough estimate (UTF-16)
    };

    for (const snapshot of this.undoStack) {
      totalSize += estimateObjectSize(snapshot);
    }

    for (const snapshot of this.redoStack) {
      totalSize += estimateObjectSize(snapshot);
    }

    return totalSize;
  }

  private createEmptySnapshot(): GraphSnapshot {
    return {
      nodes: [],
      edges: [],
      boundaries: [],
      timestamp: Date.now()
    };
  }

  // =================
  // ADVANCED FEATURES
  // =================

  /**
   * Create a named checkpoint in history
   */
  createCheckpoint(name: string, graph: Graph): void {
    const snapshot: GraphSnapshot & { checkpointName?: string } = {
      nodes: this.deepCloneArray(graph.nodes),
      edges: this.deepCloneArray(graph.edges),
      boundaries: this.deepCloneArray(graph.boundaries),
      timestamp: Date.now(),
      checkpointName: name
    };

    this.undoStack.push(snapshot as GraphSnapshot);
    this.lastSnapshot = this.deepCloneSnapshot(snapshot);
    this.redoStack = [];
  }

  /**
   * Find and restore to a named checkpoint
   */
  restoreToCheckpoint(name: string): GraphSnapshot | null {
    for (let i = this.undoStack.length - 1; i >= 0; i--) {
      const snapshot = this.undoStack[i] as GraphSnapshot & { checkpointName?: string };
      if (snapshot.checkpointName === name) {
        // Move everything after this checkpoint to redo stack
        const afterCheckpoint = this.undoStack.splice(i + 1);
        this.redoStack = [...afterCheckpoint, ...this.redoStack];
        
        this.lastSnapshot = this.deepCloneSnapshot(snapshot);
        return snapshot;
      }
    }
    return null;
  }

  /**
   * Get list of all checkpoints
   */
  getCheckpoints(): Array<{ name: string; timestamp: number; index: number }> {
    const checkpoints: Array<{ name: string; timestamp: number; index: number }> = [];
    
    for (let i = 0; i < this.undoStack.length; i++) {
      const snapshot = this.undoStack[i] as GraphSnapshot & { checkpointName?: string };
      if (snapshot.checkpointName) {
        checkpoints.push({
          name: snapshot.checkpointName,
          timestamp: snapshot.timestamp,
          index: i
        });
      }
    }
    
    return checkpoints;
  }
}