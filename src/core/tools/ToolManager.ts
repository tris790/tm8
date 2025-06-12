import { CanvasMode, NodeType, EdgeType } from '../../types/placeholder';

export interface ToolConfig {
  mode: CanvasMode;
  activeNodeType: NodeType;
  activeEdgeType: EdgeType;
  selectedNodes: string[];
  isMultiSelectMode: boolean;
}

export class ToolManager {
  private currentMode: CanvasMode = CanvasMode.SELECT;
  private activeNodeType: NodeType = NodeType.SERVICE;
  private activeEdgeType: EdgeType = EdgeType.HTTPS;
  private selectedNodes: string[] = [];
  private isMultiSelectMode: boolean = false;
  private listeners: Array<(config: ToolConfig) => void> = [];

  setMode(mode: CanvasMode): void {
    if (this.currentMode !== mode) {
      this.currentMode = mode;
      this.notifyListeners();
    }
  }

  getMode(): CanvasMode {
    return this.currentMode;
  }

  setActiveNodeType(type: NodeType): void {
    if (this.activeNodeType !== type) {
      this.activeNodeType = type;
      this.notifyListeners();
    }
  }

  getActiveNodeType(): NodeType {
    return this.activeNodeType;
  }

  setActiveEdgeType(type: EdgeType): void {
    if (this.activeEdgeType !== type) {
      this.activeEdgeType = type;
      this.notifyListeners();
    }
  }

  getActiveEdgeType(): EdgeType {
    return this.activeEdgeType;
  }

  setSelectedNodes(nodeIds: string[]): void {
    this.selectedNodes = [...nodeIds];
    this.notifyListeners();
  }

  getSelectedNodes(): string[] {
    return [...this.selectedNodes];
  }

  addSelectedNode(nodeId: string): void {
    if (!this.selectedNodes.includes(nodeId)) {
      this.selectedNodes.push(nodeId);
      this.notifyListeners();
    }
  }

  removeSelectedNode(nodeId: string): void {
    const index = this.selectedNodes.indexOf(nodeId);
    if (index !== -1) {
      this.selectedNodes.splice(index, 1);
      this.notifyListeners();
    }
  }

  clearSelection(): void {
    if (this.selectedNodes.length > 0) {
      this.selectedNodes = [];
      this.notifyListeners();
    }
  }

  toggleMultiSelectMode(enabled: boolean): void {
    this.isMultiSelectMode = enabled;
    this.notifyListeners();
  }

  getToolConfig(): ToolConfig {
    return {
      mode: this.currentMode,
      activeNodeType: this.activeNodeType,
      activeEdgeType: this.activeEdgeType,
      selectedNodes: [...this.selectedNodes],
      isMultiSelectMode: this.isMultiSelectMode
    };
  }

  // Event listener system for state changes
  subscribe(listener: (config: ToolConfig) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    const config = this.getToolConfig();
    this.listeners.forEach(listener => listener(config));
  }

  // Utility methods
  isSelectionMode(): boolean {
    return this.currentMode === CanvasMode.SELECT;
  }

  isPanMode(): boolean {
    return this.currentMode === CanvasMode.PAN;
  }

  isDrawingMode(): boolean {
    return this.currentMode === CanvasMode.DRAW_NODE || 
           this.currentMode === CanvasMode.DRAW_EDGE || 
           this.currentMode === CanvasMode.DRAW_BOUNDARY;
  }

  hasSelection(): boolean {
    return this.selectedNodes.length > 0;
  }

  getSelectionCount(): number {
    return this.selectedNodes.length;
  }
}

// Global instance
export const toolManager = new ToolManager();