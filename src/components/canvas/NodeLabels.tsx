/**
 * Node labels overlay component that renders node names as HTML text
 * positioned using camera transforms
 * 
 * NOTE: This component is kept for fallback scenarios.
 * Text rendering is primarily handled by WebGL TextRenderer.
 */

import React from 'react';
import { Node } from '@/core/types';
import { Camera } from '@/core/canvas/Camera';

export interface NodeLabelsProps {
  nodes: Node[];
  camera: Camera;
  selection: string[];
  hoveredId: string | null;
}

const NodeLabels: React.FC<NodeLabelsProps> = ({
  nodes,
  camera,
  selection,
  hoveredId
}) => {
  // Hide labels when zoomed out too far for performance
  const minZoomForLabels = 0.05;
  const showLabels = camera.zoom >= minZoomForLabels;

  return (
    <div className="node-labels">
      {/* WebGL TextRenderer handles all text rendering now */}
      {/* This component is kept as fallback only */}
    </div>
  );
};

export default NodeLabels;