/**
 * Canvas interaction handling hook
 */

import { useEffect, useState, useCallback, RefObject } from 'react';
import { CanvasMode, Graph } from '@/core/types';
import { Camera, InteractionHandler, InteractionCallbacks } from '@/core/canvas';

export interface UseCanvasInteractionResult {
  selection: string[];
  hoveredId: string | null;
  hoveredEdgeId: string | null;
  hoveredBoundaryId: string | null;
  mode: CanvasMode;
  setMode: (mode: CanvasMode) => void;
  setSelection: (selection: string[]) => void;
  clearSelection: () => void;
}

export interface UseCanvasInteractionProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  camera: Camera;
  graph?: Graph;
  mode?: CanvasMode;
  onNodeSelect?: (nodeId: string, addToSelection: boolean) => void;
  onNodeDrag?: (nodeId: string, deltaX: number, deltaY: number) => void;
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
  graph,
  mode: externalMode,
  onNodeSelect,
  onNodeDrag,
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
  const [selection, setSelection] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [hoveredBoundaryId, setHoveredBoundaryId] = useState<string | null>(null);
  const [mode, setMode] = useState<CanvasMode>(externalMode || CanvasMode.SELECT);
  const [interactionHandler, setInteractionHandler] = useState<InteractionHandler | null>(null);

  // Sync external mode changes
  useEffect(() => {
    if (externalMode && externalMode !== mode) {
      setMode(externalMode);
      interactionHandler?.setMode(externalMode);
    }
  }, [externalMode, mode, interactionHandler]);

  // Callback for node selection
  const handleNodeSelect = useCallback((nodeId: string, addToSelection: boolean) => {
    if (addToSelection) {
      setSelection(prev => 
        prev.includes(nodeId) 
          ? prev.filter(id => id !== nodeId)
          : [...prev, nodeId]
      );
    } else {
      setSelection([nodeId]);
    }
    onNodeSelect?.(nodeId, addToSelection);
  }, [onNodeSelect]);

  // Callback for node hover
  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredId(nodeId);
  }, []);

  // Callback for edge selection
  const handleEdgeSelect = useCallback((edgeId: string, addToSelection: boolean) => {
    if (addToSelection) {
      setSelection(prev => 
        prev.includes(edgeId) 
          ? prev.filter(id => id !== edgeId)
          : [...prev, edgeId]
      );
    } else {
      setSelection([edgeId]);
    }
    onEdgeSelect?.(edgeId, addToSelection);
  }, [onEdgeSelect]);

  // Callback for edge hover
  const handleEdgeHover = useCallback((edgeId: string | null) => {
    setHoveredEdgeId(edgeId);
  }, []);

  // Callback for boundary selection
  const handleBoundarySelect = useCallback((boundaryId: string, addToSelection: boolean) => {
    if (addToSelection) {
      setSelection(prev => 
        prev.includes(boundaryId) 
          ? prev.filter(id => id !== boundaryId)
          : [...prev, boundaryId]
      );
    } else {
      setSelection([boundaryId]);
    }
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
    setSelection([]);
    onDeselectAll?.();
  }, [onDeselectAll]);

  // Initialize interaction handler
  useEffect(() => {
    if (!canvasRef.current || !camera) return;

    const callbacks: InteractionCallbacks = {
      onNodeSelect: handleNodeSelect,
      onNodeHover: handleNodeHover,
      onNodeDrag: handleNodeDrag,
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
      onDeselectAll: handleDeselectAll
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
        onDeselectAll: handleDeselectAll
      };
      interactionHandler.updateCallbacks(callbacks);
    }
  }, [interactionHandler, handleNodeSelect, handleNodeHover, handleNodeDrag, handleEdgeSelect, handleEdgeHover, handleBoundarySelect, handleBoundaryHover, handleCanvasPan, handleCanvasZoom, handleModeChange, handleNodeCreate, handleEdgeCreate, handleEdgePreview, handleBoundaryCreate, handleDeselectAll]);

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

  // Clear selection function
  const clearSelection = useCallback(() => {
    setSelection([]);
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
            // Select all entities (nodes, edges, boundaries)
            if (graph) {
              const allIds = [
                ...graph.nodes.map(node => node.id),
                ...graph.edges.map(edge => edge.id),
                ...graph.boundaries.map(boundary => boundary.id)
              ];
              setSelection(allIds);
            }
            event.preventDefault();
          }
          break;
        case 'Delete':
        case 'Backspace':
          if (selection.length > 0) {
            // Handle deletion (would need callback)
            console.log('Delete selected:', selection);
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
    setSelection,
    clearSelection
  };
};