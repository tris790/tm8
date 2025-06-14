/**
 * Main canvas container component that integrates WebGL rendering with React
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Graph, Node, CanvasMode } from '@/core/types';
import { Camera } from '@/core/canvas';
import { useCanvas } from '@/hooks/useCanvas';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';
import CanvasOverlay from './CanvasOverlay';

export interface CanvasContainerProps {
  graph?: Graph;
  mode?: CanvasMode;
  onNodeSelect?: (nodeId: string, addToSelection: boolean) => void;
  onEdgeSelect?: (edgeId: string, addToSelection: boolean) => void;
  onBoundarySelect?: (boundaryId: string, addToSelection: boolean) => void;
  onDeselectAll?: () => void;
  onNodeUpdate?: (nodeId: string, updates: Partial<Node>) => void;
  onNodeUpdateSilent?: (nodeId: string, updates: Partial<Node>) => void; // Silent update during drag
  onBoundaryUpdate?: (boundaryId: string, updates: Partial<any>) => void;
  onBoundaryUpdateSilent?: (boundaryId: string, updates: Partial<any>) => void; // Silent update during drag
  onMultiEntityUpdate?: (nodeUpdates: {id: string, updates: Partial<Node>}[], boundaryUpdates: {id: string, updates: Partial<any>}[]) => void;
  onMultiEntityUpdateSilent?: (nodeUpdates: {id: string, updates: Partial<Node>}[], boundaryUpdates: {id: string, updates: Partial<any>}[]) => void; // Silent update during drag
  onNodeCreate?: (x: number, y: number) => void;
  onEdgeCreate?: (sourceNodeId: string, targetNodeId: string) => void;
  onEdgePreview?: (sourceNodeId: string | null, targetX?: number, targetY?: number) => void;
  onBoundaryCreate?: (x: number, y: number, width: number, height: number) => void;
  onModeChange?: (mode: CanvasMode) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onCameraReady?: (camera: Camera) => void;
  className?: string;
}

const CanvasContainer: React.FC<CanvasContainerProps> = ({
  graph,
  mode,
  onNodeSelect,
  onEdgeSelect,
  onBoundarySelect,
  onDeselectAll,
  onNodeUpdate,
  onNodeUpdateSilent,
  onBoundaryUpdate,
  onBoundaryUpdateSilent,
  onMultiEntityUpdate,
  onMultiEntityUpdateSilent,
  onNodeCreate,
  onEdgeCreate,
  onEdgePreview,
  onBoundaryCreate,
  onModeChange,
  onDragStart,
  onDragEnd,
  onCameraReady,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const { renderer, camera, isReady, error } = useCanvas(canvasRef);
  const [currentZoom, setCurrentZoom] = useState<number>(0);
  
  // Store original positions for proper delta handling
  const dragStartPositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  const isDragStarted = useRef(false);


  // Handle node drag
  const handleNodeDrag = useCallback((nodeId: string, deltaX: number, deltaY: number) => {
    if (!graph || !onNodeUpdateSilent) return;
    
    // Check if this is the start of a drag operation
    const isFirstDrag = !dragStartPositions.current.has(nodeId);
    if (isFirstDrag) {
      const node = graph.nodes.find(n => n.id === nodeId);
      if (node) {
        dragStartPositions.current.set(nodeId, { x: node.position.x, y: node.position.y });
        // Signal drag start only once per drag session
        if (!isDragStarted.current) {
          isDragStarted.current = true;
          onDragStart?.();
        }
      }
    }
    
    // Use absolute positioning
    const startPos = dragStartPositions.current.get(nodeId);
    if (startPos) {
      const updates: Partial<Node> = {
        position: {
          x: startPos.x + deltaX,
          y: startPos.y + deltaY
        }
      };
      // ALWAYS use silent update during drag - never create history
      onNodeUpdateSilent(nodeId, updates);
    }
  }, [graph, onNodeUpdateSilent, onDragStart]);

  // Handle canvas pan
  const handleCanvasPan = useCallback((deltaX: number, deltaY: number) => {
    // Pan is handled directly by the camera in the interaction handler
    // This callback is mainly for external state synchronization if needed
  }, []);

  // Handle canvas zoom
  const handleCanvasZoom = useCallback((zoom: number, centerX: number, centerY: number) => {
    // Zoom is handled directly by the camera in the interaction handler
    // This callback is mainly for external state synchronization if needed
  }, []);

  const {
    selection,
    hoveredId,
    hoveredEdgeId,
    hoveredBoundaryId,
    mode: currentMode,
    setMode,
    clearSelection
  } = useCanvasInteraction({
    canvasRef,
    camera,
    renderer: renderer || undefined,
    graph,
    mode,
    onNodeSelect,
    onEdgeSelect,
    onBoundarySelect,
    onDeselectAll,
    onNodeDrag: handleNodeDrag,
    onBoundaryDrag: (boundaryId, deltaX, deltaY) => {
      if (!graph || !onBoundaryUpdateSilent) return;
      
      // Check if this is the start of a drag operation
      const isFirstDrag = !dragStartPositions.current.has(boundaryId);
      if (isFirstDrag) {
        const boundary = graph.boundaries.find(b => b.id === boundaryId);
        if (boundary) {
          dragStartPositions.current.set(boundaryId, { x: boundary.position.x, y: boundary.position.y });
          // Signal drag start only once per drag session
          if (!isDragStarted.current) {
            isDragStarted.current = true;
            onDragStart?.();
          }
        }
      }
      
      // Use absolute positioning
      const startPos = dragStartPositions.current.get(boundaryId);
      if (startPos) {
        const updates = {
          position: {
            x: startPos.x + deltaX,
            y: startPos.y + deltaY
          }
        };
        // ALWAYS use silent update during drag - never create history
        onBoundaryUpdateSilent(boundaryId, updates);
      }
    },
    onMultiEntityDrag: (entityIds, deltaX, deltaY) => {
      if (!graph) return;
      
      // Check if this is the start of a drag operation
      const isFirstDrag = dragStartPositions.current.size === 0;
      if (isFirstDrag) {
        dragStartPositions.current.clear();
        entityIds.forEach(id => {
          const node = graph.nodes.find(n => n.id === id);
          const boundary = graph.boundaries.find(b => b.id === id);
          if (node) {
            dragStartPositions.current.set(id, { x: node.position.x, y: node.position.y });
          } else if (boundary) {
            dragStartPositions.current.set(id, { x: boundary.position.x, y: boundary.position.y });
          }
        });
        // Signal drag start only once per drag session
        if (!isDragStarted.current) {
          isDragStarted.current = true;
          onDragStart?.();
        }
      }
      
      if (onMultiEntityUpdateSilent) {
        // Use silent batched update callback - NEVER create history during drag
        const nodeUpdates: {id: string, updates: Partial<Node>}[] = [];
        const boundaryUpdates: {id: string, updates: Partial<any>}[] = [];
        
        entityIds.forEach(id => {
          const startPos = dragStartPositions.current.get(id);
          if (startPos) {
            const newPosition = {
              x: startPos.x + deltaX,
              y: startPos.y + deltaY
            };
            
            if (graph.nodes.some(n => n.id === id)) {
              nodeUpdates.push({
                id,
                updates: { position: newPosition }
              });
            } else if (graph.boundaries.some(b => b.id === id)) {
              boundaryUpdates.push({
                id,
                updates: { position: newPosition }
              });
            }
          }
        });
        
        onMultiEntityUpdateSilent(nodeUpdates, boundaryUpdates);
      } else if (onNodeUpdateSilent && onBoundaryUpdateSilent) {
        // Fallback to individual silent updates - NEVER create history during drag
        const nodeIds = entityIds.filter(id => graph.nodes.some(n => n.id === id));
        const boundaryIds = entityIds.filter(id => graph.boundaries.some(b => b.id === id));
        
        nodeIds.forEach(nodeId => {
          const startPos = dragStartPositions.current.get(nodeId);
          if (startPos) {
            const updates = {
              position: {
                x: startPos.x + deltaX,
                y: startPos.y + deltaY
              }
            };
            onNodeUpdateSilent(nodeId, updates);
          }
        });
        
        boundaryIds.forEach(boundaryId => {
          const startPos = dragStartPositions.current.get(boundaryId);
          if (startPos) {
            const updates = {
              position: {
                x: startPos.x + deltaX,
                y: startPos.y + deltaY
              }
            };
            onBoundaryUpdateSilent(boundaryId, updates);
          }
        });
      }
    },
    onDragEnd: () => {
      // Clear stored positions when drag ends
      dragStartPositions.current.clear();
      // Reset drag state
      isDragStarted.current = false;
      // Signal drag end
      onDragEnd?.();
    },
    onCanvasPan: handleCanvasPan,
    onCanvasZoom: handleCanvasZoom,
    onNodeCreate,
    onEdgeCreate,
    onEdgePreview,
    onBoundaryCreate,
    onModeChange
  });


  // Render the graph when renderer is ready and graph data changes
  useEffect(() => {
    if (!renderer || !graph || !isReady) return;

    // Selection is automatically synced via SelectionManager subscription in renderer
    // No need to manually call renderer.setSelection() here

    // Render the graph
    try {
      renderer.render(graph);
    } catch (err) {
      console.error('Render error:', err);
    }
  }, [renderer, graph, selection, isReady]);

  // Animation loop for continuous rendering (for animations like selection pulse)
  useEffect(() => {
    if (!renderer || !graph || !isReady) return;

    let animationId: number;
    
    const animate = () => {
      try {
        renderer.render(graph);
        animationId = requestAnimationFrame(animate);
      } catch (err) {
        console.error('Animation render error:', err);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [renderer, graph, isReady]);

  // Update zoom state for UI display
  useEffect(() => {
    if (!camera) return;

    let animationId: number;
    
    const updateZoom = () => {
      const newZoom = camera.zoom;
      setCurrentZoom(newZoom);
      animationId = requestAnimationFrame(updateZoom);
    };

    animationId = requestAnimationFrame(updateZoom);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [camera]);

  // Notify parent when camera is ready
  useEffect(() => {
    if (camera && isReady && onCameraReady) {
      onCameraReady(camera);
    }
  }, [camera, isReady, onCameraReady]);

  // Handle canvas resize
  useEffect(() => {
    if (!canvasRef.current || !renderer) return;

    const canvas = canvasRef.current;
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      renderer.resize(rect.width, rect.height);
    };

    // Set initial size
    resizeCanvas();

    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [renderer]);

  // Handler to blur any focused input when canvas is interacted with
  const handleCanvasInteraction = useCallback(() => {
    // Remove focus from any active input elements (like search)
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      (activeElement as HTMLElement).blur();
    }
  }, []);

  return (
    <div className={`canvas-container ${className}`}>
      <canvas 
        ref={canvasRef}
        onMouseDown={handleCanvasInteraction}
        onTouchStart={handleCanvasInteraction}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
      <CanvasOverlay
        selection={selection}
        hoveredId={hoveredId}
        hoveredEdgeId={hoveredEdgeId}
        hoveredBoundaryId={hoveredBoundaryId}
        mode={currentMode}
        isReady={isReady}
        error={error}
        zoom={currentZoom}
      />
    </div>
  );
};

export default CanvasContainer;