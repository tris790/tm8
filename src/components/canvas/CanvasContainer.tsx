/**
 * Main canvas container component that integrates WebGL rendering with React
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Graph, Node, CanvasMode } from '@/core/types';
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
  onNodeCreate?: (x: number, y: number) => void;
  onEdgeCreate?: (sourceNodeId: string, targetNodeId: string) => void;
  onEdgePreview?: (sourceNodeId: string | null, targetX?: number, targetY?: number) => void;
  onBoundaryCreate?: (x: number, y: number, width: number, height: number) => void;
  onModeChange?: (mode: CanvasMode) => void;
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
  onNodeCreate,
  onEdgeCreate,
  onEdgePreview,
  onBoundaryCreate,
  onModeChange,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const { renderer, camera, isReady, error } = useCanvas(canvasRef);
  const [currentZoom, setCurrentZoom] = useState<number>(0);


  // Handle node drag
  const handleNodeDrag = useCallback((nodeId: string, deltaX: number, deltaY: number) => {
    if (!graph) return;
    
    const node = graph.nodes.find(n => n.id === nodeId);
    if (node) {
      const updates: Partial<Node> = {
        position: {
          x: node.position.x + deltaX,
          y: node.position.y + deltaY
        }
      };
      onNodeUpdate?.(nodeId, updates);
    }
  }, [graph, onNodeUpdate]);

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
    setSelection,
    clearSelection
  } = useCanvasInteraction({
    canvasRef,
    camera,
    graph,
    mode,
    onNodeSelect,
    onEdgeSelect,
    onBoundarySelect,
    onDeselectAll,
    onNodeDrag: handleNodeDrag,
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

    // Set selected entities in renderer
    renderer.setSelection(new Set(selection));

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

  return (
    <div className={`canvas-container ${className}`}>
      <canvas 
        ref={canvasRef}
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