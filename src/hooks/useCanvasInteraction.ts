/**
 * Canvas interaction handling hook
 */

import { useEffect, useState, useCallback, RefObject } from 'react';
import { CanvasMode, Graph, WorldSelectionRectangle } from '@/core/types';
import { Camera, InteractionHandler, InteractionCallbacks, WebGLRenderer } from '@/core/canvas';
import { selectionManager, SelectionState } from '@/core/graph/SelectionManager';

export interface UseCanvasInteractionResult {
  selection: SelectionState;
  hoveredId: string | null;
  hoveredEdgeId: string | null;
  hoveredBoundaryId: string | null;
  mode: CanvasMode;
  setMode: (mode: CanvasMode) => void;
  clearSelection: () => void;
}

export interface UseCanvasInteractionProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  camera: Camera;
  renderer?: WebGLRenderer; // For controlling selection rectangle rendering
  graph?: Graph;
  mode?: CanvasMode;
  onNodeSelect?: (nodeId: string, addToSelection: boolean) => void;
  onNodeDrag?: (nodeId: string, deltaX: number, deltaY: number) => void;
  onBoundaryDrag?: (boundaryId: string, deltaX: number, deltaY: number) => void;
  onMultiEntityDrag?: (entityIds: string[], deltaX: number, deltaY: number) => void;
  onDragEnd?: () => void; // Called when any drag operation ends
  onEdgeSelect?: (edgeId: string, addToSelection: boolean) => void;
  onBoundarySelect?: (boundaryId: string, addToSelection: boolean) => void;
  onDeselectAll?: () => void;
  onCanvasPan?: (deltaX: number, deltaY: number) => void;
  onCanvasZoom?: (zoom: number, centerX: number, centerY: number) => void;
  onNodeCreate?: (x: number, y: number) => void;
  onEdgeCreate?: (sourceNodeId: string, targetNodeId: string) => void;
  onEdgePreview?: (sourceNodeId: string | null, targetX?: number, targetY?: number) => void;
  onBoundaryCreate?: (x: number, y: number, width: number, height: number) => void;
  onModeChange?: (mode: CanvasMode) => void;
}

export const useCanvasInteraction = ({
  canvasRef,
  camera,
  renderer,
  graph,
  mode: externalMode,
  onNodeSelect,
  onNodeDrag,
  onBoundaryDrag,
  onMultiEntityDrag,
  onDragEnd,
  onEdgeSelect,
  onBoundarySelect,
  onDeselectAll,
  onCanvasPan,
  onCanvasZoom,
  onNodeCreate,
  onEdgeCreate,
  onEdgePreview,
  onBoundaryCreate,
  onModeChange
}: UseCanvasInteractionProps): UseCanvasInteractionResult => {
  const [selection, setSelection] = useState<SelectionState>({
    selectedIds: new Set(),
    selectedNodes: [],
    selectedEdges: [],
    selectedBoundaries: []
  });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [hoveredBoundaryId, setHoveredBoundaryId] = useState<string | null>(null);
  const [mode, setMode] = useState<CanvasMode>(externalMode || CanvasMode.SELECT);
  const [interactionHandler, setInteractionHandler] = useState<InteractionHandler | null>(null);
  
  // Sync with centralized selection manager
  useEffect(() => {
    const unsubscribe = selectionManager.subscribe((selectionState) => {
      setSelection(selectionState);
      // Renderer selection is auto-synced via its own SelectionManager subscription
      // Update interaction handler with new selection
      if (interactionHandler) {
        interactionHandler.setSelectedEntities(selectionState.selectedIds);
      }
    });
    return unsubscribe;
  }, [interactionHandler]);

  // Sync external mode changes
  useEffect(() => {
    if (externalMode && externalMode !== mode) {
      setMode(externalMode);
      interactionHandler?.setMode(externalMode);
    }
  }, [externalMode, mode, interactionHandler]);

  // Callback for node selection
  const handleNodeSelect = useCallback((nodeId: string, addToSelection: boolean) => {
    selectionManager.handleEntitySelect(nodeId, addToSelection);
    onNodeSelect?.(nodeId, addToSelection);
  }, [onNodeSelect]);

  // Callback for node hover
  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredId(nodeId);
  }, []);

  // Callback for edge selection
  const handleEdgeSelect = useCallback((edgeId: string, addToSelection: boolean) => {
    selectionManager.handleEntitySelect(edgeId, addToSelection);
    onEdgeSelect?.(edgeId, addToSelection);
  }, [onEdgeSelect]);

  // Callback for edge hover
  const handleEdgeHover = useCallback((edgeId: string | null) => {
    setHoveredEdgeId(edgeId);
  }, []);

  // Callback for boundary selection
  const handleBoundarySelect = useCallback((boundaryId: string, addToSelection: boolean) => {
    selectionManager.handleEntitySelect(boundaryId, addToSelection);
    onBoundarySelect?.(boundaryId, addToSelection);
  }, [onBoundarySelect]);

  // Callback for boundary hover
  const handleBoundaryHover = useCallback((boundaryId: string | null) => {
    setHoveredBoundaryId(boundaryId);
  }, []);

  // Callback for node drag
  const handleNodeDrag = useCallback((nodeId: string, deltaX: number, deltaY: number) => {
    onNodeDrag?.(nodeId, deltaX, deltaY);
  }, [onNodeDrag]);

  // Callback for boundary drag
  const handleBoundaryDrag = useCallback((boundaryId: string, deltaX: number, deltaY: number) => {
    onBoundaryDrag?.(boundaryId, deltaX, deltaY);
  }, [onBoundaryDrag]);

  // Callback for multi-entity drag
  const handleMultiEntityDrag = useCallback((entityIds: string[], deltaX: number, deltaY: number) => {
    onMultiEntityDrag?.(entityIds, deltaX, deltaY);
  }, [onMultiEntityDrag]);

  // Callback for drag end
  const handleDragEnd = useCallback(() => {
    onDragEnd?.();
  }, [onDragEnd]);

  // Callback for canvas pan
  const handleCanvasPan = useCallback((deltaX: number, deltaY: number) => {
    onCanvasPan?.(deltaX, deltaY);
  }, [onCanvasPan]);

  // Callback for canvas zoom
  const handleCanvasZoom = useCallback((zoom: number, centerX: number, centerY: number) => {
    onCanvasZoom?.(zoom, centerX, centerY);
  }, [onCanvasZoom]);

  // Callback for mode change
  const handleModeChange = useCallback((newMode: CanvasMode) => {
    setMode(newMode);
    onModeChange?.(newMode);
  }, [onModeChange]);

  // Callback for node creation
  const handleNodeCreate = useCallback((x: number, y: number) => {
    onNodeCreate?.(x, y);
  }, [onNodeCreate]);

  // Callback for edge creation
  const handleEdgeCreate = useCallback((sourceNodeId: string, targetNodeId: string) => {
    onEdgeCreate?.(sourceNodeId, targetNodeId);
  }, [onEdgeCreate]);

  // Callback for edge preview
  const handleEdgePreview = useCallback((sourceNodeId: string | null, targetX?: number, targetY?: number) => {
    onEdgePreview?.(sourceNodeId, targetX, targetY);
  }, [onEdgePreview]);

  // Callback for boundary creation
  const handleBoundaryCreate = useCallback((x: number, y: number, width: number, height: number) => {
    onBoundaryCreate?.(x, y, width, height);
  }, [onBoundaryCreate]);

  // Callback for deselecting all
  const handleDeselectAll = useCallback(() => {
    selectionManager.clearSelection();
    onDeselectAll?.();
  }, [onDeselectAll]);

  // Callback for selection rectangle updates
  const handleSelectionRectangleUpdate = useCallback((rect: WorldSelectionRectangle) => {
    // Update the renderer with the selection rectangle
    if (renderer) {
      renderer.setSelectionRectangle(rect.startWorldX, rect.startWorldY, rect.endWorldX, rect.endWorldY, rect.isActive);
    }
  }, [renderer]);

  // Callback for selection rectangle completion
  const handleSelectionRectangleComplete = useCallback((rect: WorldSelectionRectangle) => {
    // Clear the selection rectangle in the renderer
    if (renderer) {
      renderer.clearSelectionRectangle();
    }

    // Get entities within the rectangle
    if (interactionHandler && graph) {
      const selectedEntityIds = interactionHandler.getEntitiesInRectangle(
        rect.startWorldX, rect.startWorldY, rect.endWorldX, rect.endWorldY
      );
      
      if (selectedEntityIds.length > 0) {
        selectionManager.setSelection(selectedEntityIds);
      }
    }
  }, [renderer, interactionHandler, graph]);

  // Initialize interaction handler
  useEffect(() => {
    if (!canvasRef.current || !camera) return;

    const callbacks: InteractionCallbacks = {
      onNodeSelect: handleNodeSelect,
      onNodeHover: handleNodeHover,
      onNodeDrag: handleNodeDrag,
      onBoundaryDrag: handleBoundaryDrag,
      onMultiEntityDrag: handleMultiEntityDrag,
      onDragEnd: handleDragEnd,
      onEdgeSelect: handleEdgeSelect,
      onEdgeHover: handleEdgeHover,
      onBoundarySelect: handleBoundarySelect,
      onBoundaryHover: handleBoundaryHover,
      onCanvasPan: handleCanvasPan,
      onCanvasZoom: handleCanvasZoom,
      onModeChange: handleModeChange,
      onNodeCreate: handleNodeCreate,
      onEdgeCreate: handleEdgeCreate,
      onEdgePreview: handleEdgePreview,
      onBoundaryCreate: handleBoundaryCreate,
      onDeselectAll: handleDeselectAll,
      onSelectionRectangleUpdate: handleSelectionRectangleUpdate,
      onSelectionRectangleComplete: handleSelectionRectangleComplete
    };

    const handler = new InteractionHandler(canvasRef.current, camera, callbacks);
    setInteractionHandler(handler);

    // Set initial mode
    handler.setMode(mode);

    return () => {
      handler.dispose();
      setInteractionHandler(null);
    };
  }, [camera]);

  // Update callbacks when they change
  useEffect(() => {
    if (interactionHandler) {
      const callbacks: InteractionCallbacks = {
        onNodeSelect: handleNodeSelect,
        onNodeHover: handleNodeHover,
        onNodeDrag: handleNodeDrag,
        onBoundaryDrag: handleBoundaryDrag,
        onMultiEntityDrag: handleMultiEntityDrag,
        onDragEnd: handleDragEnd,
        onEdgeSelect: handleEdgeSelect,
        onEdgeHover: handleEdgeHover,
        onBoundarySelect: handleBoundarySelect,
        onBoundaryHover: handleBoundaryHover,
        onCanvasPan: handleCanvasPan,
        onCanvasZoom: handleCanvasZoom,
        onModeChange: handleModeChange,
        onNodeCreate: handleNodeCreate,
        onEdgeCreate: handleEdgeCreate,
        onEdgePreview: handleEdgePreview,
        onBoundaryCreate: handleBoundaryCreate,
        onDeselectAll: handleDeselectAll,
        onSelectionRectangleUpdate: handleSelectionRectangleUpdate,
        onSelectionRectangleComplete: handleSelectionRectangleComplete
      };
      interactionHandler.updateCallbacks(callbacks);
    }
  }, [interactionHandler, handleNodeSelect, handleNodeHover, handleNodeDrag, handleBoundaryDrag, handleMultiEntityDrag, handleDragEnd, handleEdgeSelect, handleEdgeHover, handleBoundarySelect, handleBoundaryHover, handleCanvasPan, handleCanvasZoom, handleModeChange, handleNodeCreate, handleEdgeCreate, handleEdgePreview, handleBoundaryCreate, handleDeselectAll, handleSelectionRectangleUpdate, handleSelectionRectangleComplete]);

  // Update graph data in interaction handler
  useEffect(() => {
    if (interactionHandler && graph) {
      interactionHandler.setGraph(graph);
    }
  }, [interactionHandler, graph]);

  // Update mode in interaction handler
  useEffect(() => {
    if (interactionHandler) {
      interactionHandler.setMode(mode);
    }
  }, [interactionHandler, mode]);

  // Initialize selection manager with graph
  useEffect(() => {
    if (graph) {
      selectionManager.setGraph(graph);
    }
  }, [graph]);

  // Clear selection function
  const clearSelection = useCallback(() => {
    selectionManager.clearSelection();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when no input is focused
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.code) {
        case 'Escape':
          clearSelection();
          event.preventDefault();
          break;
        case 'KeyA':
          if (event.ctrlKey || event.metaKey) {
            selectionManager.selectAll();
            event.preventDefault();
          }
          break;
        case 'Delete':
        case 'Backspace':
          if (selection.selectedIds.size > 0) {
            // Handle deletion (would need callback)
            event.preventDefault();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selection, graph, clearSelection]);

  return {
    selection,
    hoveredId,
    hoveredEdgeId,
    hoveredBoundaryId,
    mode,
    setMode,
    clearSelection
  };
};