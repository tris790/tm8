/**
 * Mouse and keyboard interaction handling for the canvas
 */

import { Camera } from './Camera';
import { Graph, Node, CanvasMode, MouseEvent as CanvasMouseEvent, DragEvent, WheelEvent as CanvasWheelEvent } from '../types';

export interface InteractionCallbacks {
  onNodeSelect?: (nodeId: string, addToSelection: boolean) => void;
  onNodeHover?: (nodeId: string | null) => void;
  onNodeDrag?: (nodeId: string, deltaX: number, deltaY: number) => void;
  onEdgeSelect?: (edgeId: string, addToSelection: boolean) => void;
  onEdgeHover?: (edgeId: string | null) => void;
  onBoundarySelect?: (boundaryId: string, addToSelection: boolean) => void;
  onBoundaryHover?: (boundaryId: string | null) => void;
  onCanvasPan?: (deltaX: number, deltaY: number) => void;
  onCanvasZoom?: (zoom: number, centerX: number, centerY: number) => void;
  onModeChange?: (mode: CanvasMode) => void;
  onNodeCreate?: (x: number, y: number) => void;
  onEdgeCreate?: (sourceNodeId: string, targetNodeId: string) => void;
  onEdgePreview?: (sourceNodeId: string | null, targetX?: number, targetY?: number) => void;
  onBoundaryCreate?: (x: number, y: number, width: number, height: number) => void;
  onDeselectAll?: () => void;
}

export class InteractionHandler {
  private canvas: HTMLCanvasElement;
  private camera: Camera;
  private callbacks: InteractionCallbacks;
  private graph: Graph | null = null;
  
  // Interaction state
  private mode: CanvasMode = CanvasMode.SELECT;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private dragStartWorldX: number = 0;
  private dragStartWorldY: number = 0;
  private dragStartCameraPanX: number = 0;
  private dragStartCameraPanY: number = 0;
  private hoveredNodeId: string | null = null;
  private hoveredEdgeId: string | null = null;
  private hoveredBoundaryId: string | null = null;
  private draggedNodeId: string | null = null;
  
  // Edge drawing state
  private edgeSourceNodeId: string | null = null;
  private isDrawingEdge: boolean = false;
  
  // Boundary drawing state
  private isDrawingBoundary: boolean = false;
  private boundaryStartX: number = 0;
  private boundaryStartY: number = 0;
  
  // Mouse state
  private mouseX: number = 0;
  private mouseY: number = 0;
  private mouseDown: boolean = false;
  private mouseButton: number = 0;

  constructor(canvas: HTMLCanvasElement, camera: Camera, callbacks: InteractionCallbacks = {}) {
    this.canvas = canvas;
    this.camera = camera;
    this.callbacks = callbacks;
    
    this.setupEventListeners();
  }

  /**
   * Setup mouse and keyboard event listeners
   */
  private setupEventListeners(): void {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    
    // Context menu
    this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    
    // Keyboard events (on document for global shortcuts)
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Prevent default behaviors
    this.canvas.style.touchAction = 'none';
  }

  /**
   * Handle mouse down events
   */
  private handleMouseDown(event: MouseEvent): void {

    this.mouseDown = true;
    this.mouseButton = event.button;
    this.updateMousePosition(event);
    
    const worldPos = this.camera.screenToWorld(this.mouseX, this.mouseY);
    this.dragStartX = this.mouseX;
    this.dragStartY = this.mouseY;
    this.dragStartWorldX = worldPos.x;
    this.dragStartWorldY = worldPos.y;
    this.dragStartCameraPanX = this.camera.panX;
    this.dragStartCameraPanY = this.camera.panY;

    // Handle different modes
    switch (this.mode) {
      case CanvasMode.SELECT:
        this.handleSelectMouseDown(event);
        break;
      case CanvasMode.PAN:
        this.isDragging = true;
        this.canvas.style.cursor = 'grabbing';
        break;
      case CanvasMode.DRAW_NODE:
        if (event.button === 0) { // Left click only
          const worldPos = this.camera.screenToWorld(this.mouseX, this.mouseY);
          this.callbacks.onNodeCreate?.(worldPos.x, worldPos.y);
          this.setMode(CanvasMode.SELECT);
        }
        break;
      case CanvasMode.DRAW_EDGE:
        if (event.button === 0) { // Left click only
          this.handleEdgeDrawing();
        }
        break;
      case CanvasMode.DRAW_BOUNDARY:
        if (event.button === 0) { // Left click only
          const worldPos = this.camera.screenToWorld(this.mouseX, this.mouseY);
          this.isDrawingBoundary = true;
          this.boundaryStartX = worldPos.x;
          this.boundaryStartY = worldPos.y;
          this.isDragging = true;
        }
        break;
    }

    event.preventDefault();
  }

  /**
   * Handle mouse move events
   */
  private handleMouseMove(event: MouseEvent): void {
    this.updateMousePosition(event);
    
    const worldPos = this.camera.screenToWorld(this.mouseX, this.mouseY);
    
    if (this.mouseDown && this.isDragging) {
      const deltaX = this.mouseX - this.dragStartX;
      const deltaY = this.mouseY - this.dragStartY;

      switch (this.mode) {
        case CanvasMode.SELECT:
          if (this.draggedNodeId) {
            // Drag node - use world coordinate delta
            const currentWorldPos = this.camera.screenToWorld(this.mouseX, this.mouseY);
            const worldDeltaX = currentWorldPos.x - this.dragStartWorldX;
            const worldDeltaY = currentWorldPos.y - this.dragStartWorldY;
            this.callbacks.onNodeDrag?.(this.draggedNodeId, worldDeltaX, worldDeltaY);
          } else {
            // Pan canvas - SIMPLE: direct pixel-to-world conversion
            this.handleSimplePan(deltaX, deltaY);
          }
          break;
        case CanvasMode.PAN:
          // Pan canvas - SIMPLE: direct pixel-to-world conversion  
          this.handleSimplePan(deltaX, deltaY);
          break;
        case CanvasMode.DRAW_BOUNDARY:
          // Boundary drawing - no special handling during drag, just visual feedback
          break;
      }
    } else {
      // Update hover state
      this.updateHoverState(worldPos.x, worldPos.y);
      
      // Update edge drawing preview
      if (this.mode === CanvasMode.DRAW_EDGE && this.isDrawingEdge) {
        this.callbacks.onEdgePreview?.(this.edgeSourceNodeId, worldPos.x, worldPos.y);
      }
    }

    event.preventDefault();
  }

  /**
   * Handle mouse up events
   */
  private handleMouseUp(event: MouseEvent): void {
    if (this.mouseDown) {
      const deltaX = Math.abs(this.mouseX - this.dragStartX);
      const deltaY = Math.abs(this.mouseY - this.dragStartY);
      const isClick = deltaX < 5 && deltaY < 5; // 5px tolerance for click

      if (isClick && this.mode === CanvasMode.SELECT && event.button === 0) {
        // Handle click selection - check for entities in order of priority
        const worldPos = this.camera.screenToWorld(this.mouseX, this.mouseY);
        const nodeId = this.getNodeAtPosition(worldPos.x, worldPos.y);
        const edgeId = !nodeId ? this.getEdgeAtPosition(worldPos.x, worldPos.y) : null;
        const boundaryId = !nodeId && !edgeId ? this.getBoundaryAtPosition(worldPos.x, worldPos.y) : null;
        
        if (nodeId) {
          this.callbacks.onNodeSelect?.(nodeId, event.ctrlKey || event.metaKey);
        } else if (edgeId) {
          this.callbacks.onEdgeSelect?.(edgeId, event.ctrlKey || event.metaKey);
        } else if (boundaryId) {
          this.callbacks.onBoundarySelect?.(boundaryId, event.ctrlKey || event.metaKey);
        } else {
          // Clicked on empty space - deselect all unless holding Ctrl/Cmd
          if (!(event.ctrlKey || event.metaKey)) {
            this.callbacks.onDeselectAll?.();
          }
        }
      }
      
      // Handle boundary creation completion
      if (this.mode === CanvasMode.DRAW_BOUNDARY && this.isDrawingBoundary && event.button === 0) {
        const worldPos = this.camera.screenToWorld(this.mouseX, this.mouseY);
        const width = Math.abs(worldPos.x - this.boundaryStartX);
        const height = Math.abs(worldPos.y - this.boundaryStartY);
        
        // Only create boundary if it has meaningful size (minimum 20x20 world units)
        if (width > 20 && height > 20) {
          const x = Math.min(this.boundaryStartX, worldPos.x);
          const y = Math.min(this.boundaryStartY, worldPos.y);
          this.callbacks.onBoundaryCreate?.(x, y, width, height);
          this.setMode(CanvasMode.SELECT);
        }
        
        this.isDrawingBoundary = false;
      }
    }

    this.mouseDown = false;
    this.isDragging = false;
    this.draggedNodeId = null;
    this.canvas.style.cursor = this.getCursorForMode();

    event.preventDefault();
  }

  /**
   * Handle mouse wheel events (zoom)
   */
  private handleWheel(event: WheelEvent): void {
    this.updateMousePosition(event);
    
    const worldPos = this.camera.screenToWorld(this.mouseX, this.mouseY);
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    
    this.camera.zoomAt(zoomFactor, worldPos.x, worldPos.y);
    this.callbacks.onCanvasZoom?.(this.camera.zoom, worldPos.x, worldPos.y);

    event.preventDefault();
  }

  /**
   * Handle mouse leave events
   */
  private handleMouseLeave(): void {
    this.mouseDown = false;
    this.isDragging = false;
    this.draggedNodeId = null;
    this.hoveredNodeId = null;
    this.hoveredEdgeId = null;
    this.hoveredBoundaryId = null;
    this.isDrawingBoundary = false;
    this.callbacks.onNodeHover?.(null);
    this.callbacks.onEdgeHover?.(null);
    this.callbacks.onBoundaryHover?.(null);
    this.canvas.style.cursor = 'default';
  }

  /**
   * Handle context menu (right-click)
   */
  private handleContextMenu(event: MouseEvent): void {
    // Prevent default context menu
    event.preventDefault();
    
    // Switch to pan mode temporarily or show custom context menu
    if (this.mode !== CanvasMode.PAN) {
      this.setMode(CanvasMode.PAN);
    }
  }

  /**
   * Handle keyboard events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // Only handle if canvas has focus or no input is focused
    if (document.activeElement && 
        (document.activeElement.tagName === 'INPUT' || 
         document.activeElement.tagName === 'TEXTAREA')) {
      return;
    }

    switch (event.code) {
      case 'Space':
        if (this.mode !== CanvasMode.PAN) {
          this.setMode(CanvasMode.PAN);
        }
        event.preventDefault();
        break;
      case 'KeyV':
        this.setMode(CanvasMode.SELECT);
        break;
      case 'KeyN':
        this.setMode(CanvasMode.DRAW_NODE);
        break;
      case 'KeyE':
        this.setMode(CanvasMode.DRAW_EDGE);
        break;
      case 'KeyB':
        this.setMode(CanvasMode.DRAW_BOUNDARY);
        break;
      case 'Escape':
        if (this.mode === CanvasMode.DRAW_EDGE && this.isDrawingEdge) {
          this.cancelEdgeDrawing();
        } else if (this.mode === CanvasMode.DRAW_BOUNDARY && this.isDrawingBoundary) {
          this.cancelBoundaryDrawing();
        } else {
          this.setMode(CanvasMode.SELECT);
        }
        break;
      case 'ArrowUp':
        this.camera.pan(0, 50 / this.camera.zoom);
        event.preventDefault();
        break;
      case 'ArrowDown':
        this.camera.pan(0, -50 / this.camera.zoom);
        event.preventDefault();
        break;
      case 'ArrowLeft':
        this.camera.pan(-50 / this.camera.zoom, 0);
        event.preventDefault();
        break;
      case 'ArrowRight':
        this.camera.pan(50 / this.camera.zoom, 0);
        event.preventDefault();
        break;
    }
  }

  /**
   * Handle key up events
   */
  private handleKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case 'Space':
        if (this.mode === CanvasMode.PAN) {
          this.setMode(CanvasMode.SELECT);
        }
        event.preventDefault();
        break;
    }
  }

  /**
   * Handle select mode mouse down
   */
  private handleSelectMouseDown(event: MouseEvent): void {
    const worldPos = this.camera.screenToWorld(this.mouseX, this.mouseY);
    const nodeId = this.getNodeAtPosition(worldPos.x, worldPos.y);
    
    if (nodeId && event.button === 0) {
      // Start dragging node
      this.draggedNodeId = nodeId;
      this.isDragging = true;
      this.canvas.style.cursor = 'grabbing';
    } else if (event.button === 0) {
      // Start panning canvas
      this.isDragging = true;
      this.canvas.style.cursor = 'grabbing';
    }
  }

  /**
   * SIMPLE panning: relative to original click position
   */
  private handleSimplePan(deltaX: number, deltaY: number): void {
    // Convert screen deltas to world deltas using same math as camera.screenToWorld
    const aspect = this.canvas.width / this.canvas.height;
    const worldDeltaX = (-deltaX / this.canvas.width) * 2 * aspect / this.camera.zoom;
    const worldDeltaY = (deltaY / this.canvas.height) * 2 / this.camera.zoom;
    
    // Set camera position relative to original drag start position
    const newPanX = this.dragStartCameraPanX + worldDeltaX;
    const newPanY = this.dragStartCameraPanY + worldDeltaY;
    
    this.camera.panX = newPanX;
    this.camera.panY = newPanY;
    
    // Notify callback
    this.callbacks.onCanvasPan?.(worldDeltaX, worldDeltaY);
  }


  /**
   * Update hover state
   */
  private updateHoverState(worldX: number, worldY: number): void {
    const nodeId = this.getNodeAtPosition(worldX, worldY);
    const edgeId = !nodeId ? this.getEdgeAtPosition(worldX, worldY) : null;
    const boundaryId = !nodeId && !edgeId ? this.getBoundaryAtPosition(worldX, worldY) : null;
    
    // Update node hover
    if (nodeId !== this.hoveredNodeId) {
      this.hoveredNodeId = nodeId;
      this.callbacks.onNodeHover?.(nodeId);
    }
    
    // Update edge hover
    if (edgeId !== this.hoveredEdgeId) {
      this.hoveredEdgeId = edgeId;
      this.callbacks.onEdgeHover?.(edgeId);
    }
    
    // Update boundary hover
    if (boundaryId !== this.hoveredBoundaryId) {
      this.hoveredBoundaryId = boundaryId;
      this.callbacks.onBoundaryHover?.(boundaryId);
    }
    
    // Update cursor based on what's being hovered
    const hasEntity = nodeId || edgeId || boundaryId;
    this.canvas.style.cursor = hasEntity ? 'pointer' : this.getCursorForMode();
  }

  /**
   * Update mouse position from event
   */
  private updateMousePosition(event: MouseEvent | WheelEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = event.clientX - rect.left;
    this.mouseY = event.clientY - rect.top;
  }

  /**
   * Get cursor style for current mode
   */
  private getCursorForMode(): string {
    switch (this.mode) {
      case CanvasMode.SELECT: return 'default';
      case CanvasMode.PAN: return 'grab';
      case CanvasMode.DRAW_NODE: return 'crosshair';
      case CanvasMode.DRAW_EDGE: return 'crosshair';
      case CanvasMode.DRAW_BOUNDARY: return 'crosshair';
      default: return 'default';
    }
  }

  /**
   * Get node at specific world position (hit testing)
   */
  private getNodeAtPosition(worldX: number, worldY: number): string | null {
    if (!this.graph) {
      return null;
    }
    
    const nodeRadius = 20; // Default node radius - could be made configurable
    
    // Check each node for collision
    for (const node of this.graph.nodes) {
      const dx = worldX - node.position.x;
      const dy = worldY - node.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check if click is within node bounds (considering scale)
      const scale = node.properties?.scale || 1.0;
      if (distance <= nodeRadius * scale) {
        return node.id;
      }
    }
    
    return null;
  }

  /**
   * Get edge at specific world position (hit testing)
   */
  private getEdgeAtPosition(worldX: number, worldY: number): string | null {
    if (!this.graph) {
      return null;
    }
    
    const clickTolerance = 8; // Distance from line to consider a hit
    
    // Check each edge for collision
    for (const edge of this.graph.edges) {
      const sourceNode = this.graph.nodes.find(n => n.id === edge.source);
      if (!sourceNode) continue;
      
      // Check line segments for each target
      for (const targetId of edge.targets) {
        const targetNode = this.graph.nodes.find(n => n.id === targetId);
        if (!targetNode) continue;
        
        const distance = this.distanceToLineSegment(
          worldX, worldY,
          sourceNode.position.x, sourceNode.position.y,
          targetNode.position.x, targetNode.position.y
        );
        
        if (distance <= clickTolerance) {
          return edge.id;
        }
      }
    }
    
    return null;
  }

  /**
   * Get boundary at specific world position (hit testing)
   */
  private getBoundaryAtPosition(worldX: number, worldY: number): string | null {
    if (!this.graph) {
      return null;
    }
    
    // Check each boundary for collision
    for (const boundary of this.graph.boundaries) {
      const left = boundary.position.x;
      const right = boundary.position.x + boundary.bounds.width;
      const top = boundary.position.y;
      const bottom = boundary.position.y + boundary.bounds.height;
      
      // Check if point is within boundary rectangle
      if (worldX >= left && worldX <= right && worldY >= top && worldY <= bottom) {
        return boundary.id;
      }
    }
    
    return null;
  }

  /**
   * Calculate distance from point to line segment
   */
  private distanceToLineSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) {
      // Line segment is a point
      return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    }
    
    // Calculate parameter t for closest point on line segment
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
    
    // Find closest point on line segment
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    
    // Return distance to closest point
    return Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY));
  }

  /**
   * Handle edge drawing clicks
   */
  private handleEdgeDrawing(): void {
    const worldPos = this.camera.screenToWorld(this.mouseX, this.mouseY);
    const nodeId = this.getNodeAtPosition(worldPos.x, worldPos.y);

    if (!this.isDrawingEdge) {
      // First click - select source node
      if (nodeId) {
        this.edgeSourceNodeId = nodeId;
        this.isDrawingEdge = true;
        this.callbacks.onEdgePreview?.(nodeId);
      }
    } else {
      // Second click - select target node and create edge
      if (nodeId && nodeId !== this.edgeSourceNodeId) {
        // Create edge between source and target
        this.callbacks.onEdgeCreate?.(this.edgeSourceNodeId!, nodeId);
        this.resetEdgeDrawing();
        this.setMode(CanvasMode.SELECT);
      } else if (!nodeId) {
        // Clicked on empty space - cancel edge drawing
        this.cancelEdgeDrawing();
      }
      // If clicked same node, ignore (could show error feedback)
    }
  }

  /**
   * Cancel edge drawing and reset state
   */
  private cancelEdgeDrawing(): void {
    this.callbacks.onEdgePreview?.(null);
    this.resetEdgeDrawing();
  }

  /**
   * Reset edge drawing state
   */
  private resetEdgeDrawing(): void {
    this.edgeSourceNodeId = null;
    this.isDrawingEdge = false;
  }

  /**
   * Cancel boundary drawing and reset state
   */
  private cancelBoundaryDrawing(): void {
    this.resetBoundaryDrawing();
  }

  /**
   * Reset boundary drawing state
   */
  private resetBoundaryDrawing(): void {
    this.isDrawingBoundary = false;
    this.boundaryStartX = 0;
    this.boundaryStartY = 0;
  }

  /**
   * Set interaction mode
   */
  setMode(mode: CanvasMode): void {
    if (mode !== this.mode) {
      // Reset edge drawing state when leaving DRAW_EDGE mode
      if (this.mode === CanvasMode.DRAW_EDGE) {
        this.cancelEdgeDrawing();
      }
      
      // Reset boundary drawing state when leaving DRAW_BOUNDARY mode
      if (this.mode === CanvasMode.DRAW_BOUNDARY) {
        this.cancelBoundaryDrawing();
      }
      
      this.mode = mode;
      this.canvas.style.cursor = this.getCursorForMode();
      this.callbacks.onModeChange?.(mode);
    }
  }

  /**
   * Get current interaction mode
   */
  getMode(): CanvasMode {
    return this.mode;
  }

  /**
   * Update callbacks
   */
  updateCallbacks(callbacks: InteractionCallbacks): void {
    this.callbacks = { ...callbacks };
  }

  /**
   * Set graph data for hit testing
   */
  setGraph(graph: Graph): void {
    this.graph = graph;
  }

  /**
   * Clean up event listeners
   */
  dispose(): void {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }
}