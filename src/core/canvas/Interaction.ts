/**
 * Mouse and keyboard interaction handling for the canvas
 */

import { Camera } from './Camera';
import { Graph, Node, CanvasMode, MouseEvent as CanvasMouseEvent, DragEvent, WheelEvent as CanvasWheelEvent, WorldSelectionRectangle } from '../types';

export interface InteractionCallbacks {
  onNodeSelect?: (nodeId: string, addToSelection: boolean) => void;
  onNodeHover?: (nodeId: string | null) => void;
  onNodeDrag?: (nodeId: string, deltaX: number, deltaY: number) => void;
  onBoundaryDrag?: (boundaryId: string, deltaX: number, deltaY: number) => void;
  onMultiEntityDrag?: (entityIds: string[], deltaX: number, deltaY: number) => void;
  onDragEnd?: () => void;
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
  onSelectionRectangleUpdate?: (rect: WorldSelectionRectangle) => void;
  onSelectionRectangleComplete?: (rect: WorldSelectionRectangle) => void;
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
  private draggedBoundaryId: string | null = null;
  
  // Multi-selection dragging
  private isDraggingMultiple: boolean = false;
  private selectedEntities: Set<string> = new Set();
  
  // Edge drawing state
  private edgeSourceNodeId: string | null = null;
  private isDrawingEdge: boolean = false;
  
  // Boundary drawing state
  private isDrawingBoundary: boolean = false;
  private boundaryStartX: number = 0;
  private boundaryStartY: number = 0;
  
  // Selection rectangle state
  private isDrawingSelection: boolean = false;
  private selectionStartWorldX: number = 0;
  private selectionStartWorldY: number = 0;
  
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
          if (this.isDraggingMultiple) {
            // Drag multiple selected entities
            const currentWorldPos = this.camera.screenToWorld(this.mouseX, this.mouseY);
            const worldDeltaX = currentWorldPos.x - this.dragStartWorldX;
            const worldDeltaY = currentWorldPos.y - this.dragStartWorldY;
            this.handleMultiEntityDrag(worldDeltaX, worldDeltaY);
          } else if (this.draggedNodeId) {
            // Drag single node - use world coordinate delta
            const currentWorldPos = this.camera.screenToWorld(this.mouseX, this.mouseY);
            const worldDeltaX = currentWorldPos.x - this.dragStartWorldX;
            const worldDeltaY = currentWorldPos.y - this.dragStartWorldY;
            this.callbacks.onNodeDrag?.(this.draggedNodeId, worldDeltaX, worldDeltaY);
          } else if (this.draggedBoundaryId) {
            // Drag single boundary
            const currentWorldPos = this.camera.screenToWorld(this.mouseX, this.mouseY);
            const worldDeltaX = currentWorldPos.x - this.dragStartWorldX;
            const worldDeltaY = currentWorldPos.y - this.dragStartWorldY;
            this.callbacks.onBoundaryDrag?.(this.draggedBoundaryId, worldDeltaX, worldDeltaY);
          } else if (this.isDrawingSelection) {
            // Update rectangular selection
            const currentWorldPos = this.camera.screenToWorld(this.mouseX, this.mouseY);
            this.callbacks.onSelectionRectangleUpdate?.({
              startWorldX: this.selectionStartWorldX,
              startWorldY: this.selectionStartWorldY,
              endWorldX: currentWorldPos.x,
              endWorldY: currentWorldPos.y,
              isActive: true
            });
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
      
      // Handle rectangular selection completion
      if (this.isDrawingSelection && event.button === 0) {
        const currentWorldPos = this.camera.screenToWorld(this.mouseX, this.mouseY);
        
        // Only complete selection if the rectangle has meaningful size
        const width = Math.abs(currentWorldPos.x - this.selectionStartWorldX);
        const height = Math.abs(currentWorldPos.y - this.selectionStartWorldY);
        
        if (width > 10 && height > 10) { // Minimum 10 world units
          this.callbacks.onSelectionRectangleComplete?.({
            startWorldX: this.selectionStartWorldX,
            startWorldY: this.selectionStartWorldY,
            endWorldX: currentWorldPos.x,
            endWorldY: currentWorldPos.y,
            isActive: false
          });
        } else {
          // Clear selection rectangle if too small
          this.callbacks.onSelectionRectangleUpdate?.({
            startWorldX: 0,
            startWorldY: 0,
            endWorldX: 0,
            endWorldY: 0,
            isActive: false
          });
        }
        
        this.isDrawingSelection = false;
      }
    }

    // Notify drag end if we were dragging
    if (this.isDragging && (this.draggedNodeId || this.draggedBoundaryId || this.isDraggingMultiple)) {
      this.callbacks.onDragEnd?.();
    }

    this.mouseDown = false;
    this.isDragging = false;
    this.draggedNodeId = null;
    this.draggedBoundaryId = null;
    this.isDraggingMultiple = false;
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
    this.draggedBoundaryId = null;
    this.isDraggingMultiple = false;
    this.hoveredNodeId = null;
    this.hoveredEdgeId = null;
    this.hoveredBoundaryId = null;
    this.isDrawingBoundary = false;
    this.isDrawingSelection = false;
    this.callbacks.onNodeHover?.(null);
    this.callbacks.onEdgeHover?.(null);
    this.callbacks.onBoundaryHover?.(null);
    this.callbacks.onSelectionRectangleUpdate?.({
      startWorldX: 0,
      startWorldY: 0,
      endWorldX: 0,
      endWorldY: 0,
      isActive: false
    });
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
    const boundaryId = !nodeId ? this.getBoundaryAtPosition(worldPos.x, worldPos.y) : null;
    
    if (nodeId && event.button === 0) {
      // Check if node is already selected for multi-drag
      if (this.selectedEntities.has(nodeId) && this.selectedEntities.size > 1) {
        // Start multi-entity drag
        this.isDraggingMultiple = true;
        this.isDragging = true;
        this.canvas.style.cursor = 'grabbing';
      } else {
        // Start single node drag
        this.draggedNodeId = nodeId;
        this.isDragging = true;
        this.canvas.style.cursor = 'grabbing';
      }
    } else if (boundaryId && event.button === 0) {
      // Check if boundary is already selected for multi-drag
      if (this.selectedEntities.has(boundaryId) && this.selectedEntities.size > 1) {
        // Start multi-entity drag
        this.isDraggingMultiple = true;
        this.isDragging = true;
        this.canvas.style.cursor = 'grabbing';
      } else {
        // Start single boundary drag
        this.draggedBoundaryId = boundaryId;
        this.isDragging = true;
        this.canvas.style.cursor = 'grabbing';
      }
    } else if (event.button === 0) {
      // Start rectangular selection or canvas pan
      this.isDrawingSelection = true;
      this.selectionStartWorldX = worldPos.x;
      this.selectionStartWorldY = worldPos.y;
      this.isDragging = true;
      this.canvas.style.cursor = 'crosshair';
    }
  }

  /**
   * Handle multi-entity dragging
   */
  private handleMultiEntityDrag(worldDeltaX: number, worldDeltaY: number): void {
    const entityIds = Array.from(this.selectedEntities);
    this.callbacks.onMultiEntityDrag?.(entityIds, worldDeltaX, worldDeltaY);
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
   * Update selected entities for multi-entity operations
   */
  setSelectedEntities(selectedIds: Set<string>): void {
    this.selectedEntities = new Set(selectedIds);
  }

  /**
   * Get entities within a world-coordinate rectangle
   */
  getEntitiesInRectangle(startX: number, startY: number, endX: number, endY: number): string[] {
    if (!this.graph) return [];

    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);

    const selectedIds: string[] = [];

    // Check nodes
    for (const node of this.graph.nodes) {
      const { x, y } = node.position;
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        selectedIds.push(node.id);
      }
    }

    // Check boundaries
    for (const boundary of this.graph.boundaries) {
      const { x, y } = boundary.position;
      const { width, height } = boundary.bounds;
      
      // Check if boundary overlaps with selection rectangle
      const boundaryMaxX = x + width;
      const boundaryMaxY = y + height;
      
      if (!(maxX < x || minX > boundaryMaxX || maxY < y || minY > boundaryMaxY)) {
        selectedIds.push(boundary.id);
      }
    }

    // Check edges (based on their endpoints)
    for (const edge of this.graph.edges) {
      const sourceNode = this.graph.nodes.find(n => n.id === edge.source);
      if (!sourceNode) continue;

      for (const targetId of edge.targets) {
        const targetNode = this.graph.nodes.find(n => n.id === targetId);
        if (!targetNode) continue;

        // Check if edge line intersects with selection rectangle
        if (this.lineIntersectsRectangle(
          sourceNode.position.x, sourceNode.position.y,
          targetNode.position.x, targetNode.position.y,
          minX, minY, maxX, maxY
        )) {
          selectedIds.push(edge.id);
          break; // Only add edge once even if multiple segments are selected
        }
      }
    }

    return selectedIds;
  }

  /**
   * Check if a line intersects with a rectangle
   */
  private lineIntersectsRectangle(x1: number, y1: number, x2: number, y2: number, 
                                  rectMinX: number, rectMinY: number, rectMaxX: number, rectMaxY: number): boolean {
    // Check if either endpoint is inside the rectangle
    if ((x1 >= rectMinX && x1 <= rectMaxX && y1 >= rectMinY && y1 <= rectMaxY) ||
        (x2 >= rectMinX && x2 <= rectMaxX && y2 >= rectMinY && y2 <= rectMaxY)) {
      return true;
    }

    // Check line-rectangle intersection using parametric line equation
    const dx = x2 - x1;
    const dy = y2 - y1;

    // Check intersection with each edge of the rectangle
    const edges = [
      { x: rectMinX, y: rectMinY, dx: rectMaxX - rectMinX, dy: 0 }, // bottom
      { x: rectMaxX, y: rectMinY, dx: 0, dy: rectMaxY - rectMinY }, // right
      { x: rectMaxX, y: rectMaxY, dx: rectMinX - rectMaxX, dy: 0 }, // top
      { x: rectMinX, y: rectMaxY, dx: 0, dy: rectMinY - rectMaxY }  // left
    ];

    for (const edge of edges) {
      const det = dx * edge.dy - dy * edge.dx;
      if (Math.abs(det) < 1e-10) continue; // Lines are parallel

      const t = ((edge.x - x1) * edge.dy - (edge.y - y1) * edge.dx) / det;
      const u = ((edge.x - x1) * dy - (edge.y - y1) * dx) / det;

      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return true; // Intersection found
      }
    }

    return false;
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