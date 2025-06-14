/**
 * Centralized selection management for TM8
 * Handles unified selection state across all entity types
 */

import { Graph, EntityType } from '../types';

export interface SelectionState {
  selectedIds: Set<string>;
  selectedNodes: string[];
  selectedEdges: string[];
  selectedBoundaries: string[];
}

export type SelectionChangeCallback = (state: SelectionState) => void;

export class SelectionManager {
  private selectedIds: Set<string> = new Set();
  private callbacks: Set<SelectionChangeCallback> = new Set();
  private graph: Graph | null = null;

  /**
   * Set the graph reference for entity type checking
   */
  setGraph(graph: Graph): void {
    this.graph = graph;
  }

  /**
   * Add a callback for selection changes
   */
  subscribe(callback: SelectionChangeCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Get current selection state
   */
  getState(): SelectionState {
    return {
      selectedIds: new Set(this.selectedIds),
      selectedNodes: this.getSelectedByType('node'),
      selectedEdges: this.getSelectedByType('edge'),
      selectedBoundaries: this.getSelectedByType('boundary')
    };
  }

  /**
   * Get all selected entity IDs
   */
  getSelectedIds(): Set<string> {
    return new Set(this.selectedIds);
  }

  /**
   * Get selected entities by type
   */
  private getSelectedByType(type: EntityType): string[] {
    if (!this.graph) return [];
    
    return Array.from(this.selectedIds).filter(id => {
      switch (type) {
        case 'node':
          return this.graph!.nodes.some(n => n.id === id);
        case 'edge':
          return this.graph!.edges.some(e => e.id === id);
        case 'boundary':
          return this.graph!.boundaries.some(b => b.id === id);
        default:
          return false;
      }
    });
  }

  /**
   * Select a single entity (clears previous selection)
   */
  select(entityId: string): void {
    this.selectedIds.clear();
    this.selectedIds.add(entityId);
    this.notifyChange();
  }

  /**
   * Add entity to selection (multi-select)
   */
  addToSelection(entityId: string): void {
    this.selectedIds.add(entityId);
    this.notifyChange();
  }

  /**
   * Remove entity from selection
   */
  removeFromSelection(entityId: string): void {
    this.selectedIds.delete(entityId);
    this.notifyChange();
  }

  /**
   * Toggle entity selection
   */
  toggleSelection(entityId: string): void {
    if (this.selectedIds.has(entityId)) {
      this.removeFromSelection(entityId);
    } else {
      this.addToSelection(entityId);
    }
  }

  /**
   * Set multiple entities as selected (replaces current selection)
   */
  setSelection(entityIds: string[]): void {
    this.selectedIds.clear();
    entityIds.forEach(id => this.selectedIds.add(id));
    this.notifyChange();
  }

  /**
   * Add multiple entities to selection
   */
  addMultipleToSelection(entityIds: string[]): void {
    entityIds.forEach(id => this.selectedIds.add(id));
    this.notifyChange();
  }

  /**
   * Clear all selection
   */
  clearSelection(): void {
    this.selectedIds.clear();
    this.notifyChange();
  }

  /**
   * Select all entities in the graph
   */
  selectAll(): void {
    if (!this.graph) return;
    
    this.selectedIds.clear();
    this.graph.nodes.forEach(node => this.selectedIds.add(node.id));
    this.graph.edges.forEach(edge => this.selectedIds.add(edge.id));
    this.graph.boundaries.forEach(boundary => this.selectedIds.add(boundary.id));
    this.notifyChange();
  }

  /**
   * Check if entity is selected
   */
  isSelected(entityId: string): boolean {
    return this.selectedIds.has(entityId);
  }

  /**
   * Get selection count
   */
  getSelectionCount(): number {
    return this.selectedIds.size;
  }

  /**
   * Check if there's any selection
   */
  hasSelection(): boolean {
    return this.selectedIds.size > 0;
  }

  /**
   * Handle single vs multi-select logic
   */
  handleEntitySelect(entityId: string, addToSelection: boolean): void {
    if (addToSelection) {
      this.toggleSelection(entityId);
    } else {
      this.select(entityId);
    }
  }

  /**
   * Notify all callbacks of selection change
   */
  private notifyChange(): void {
    const state = this.getState();
    this.callbacks.forEach(callback => callback(state));
  }
}

/**
 * Global selection manager instance
 */
export const selectionManager = new SelectionManager();