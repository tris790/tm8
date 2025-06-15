/**
 * Canvas overlay component for UI elements on top of the WebGL canvas
 */

import React from 'react';
import { CanvasMode } from '@/core/types';
import { SelectionState } from '@/core/graph/SelectionManager';

export interface CanvasOverlayProps {
  selection: SelectionState;
  hoveredId: string | null;
  hoveredEdgeId: string | null;
  hoveredBoundaryId: string | null;
  mode: CanvasMode;
  isReady: boolean;
  error?: string | null;
  zoom?: number;
}

const CanvasOverlay: React.FC<CanvasOverlayProps> = ({
  selection,
  hoveredId,
  hoveredEdgeId,
  hoveredBoundaryId,
  mode,
  isReady,
  error,
  zoom
}) => {
  // Mode indicator
  const getModeDisplayName = (mode: CanvasMode): string => {
    switch (mode) {
      case CanvasMode.SELECT: return 'Select';
      case CanvasMode.PAN: return 'Pan';
      case CanvasMode.DRAW_NODE: return 'Draw Node';
      case CanvasMode.DRAW_EDGE: return 'Draw Edge';
      case CanvasMode.DRAW_BOUNDARY: return 'Draw Boundary';
      default: return mode;
    }
  };

  return (
    <div className="canvas-overlay">
      {/* Loading indicator */}
      {!isReady && !error && (
        <div className="canvas-loading">
          <div className="loading-spinner"></div>
          <p>Initializing Canvas...</p>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="canvas-error">
          <div className="error-icon">⚠️</div>
          <h3>Canvas Error</h3>
          <p>{error}</p>
          <p className="error-hint">
            This application requires WebGL2 support. Please ensure your browser is up to date.
          </p>
        </div>
      )}

      {/* Canvas is ready */}
      {isReady && !error && (
        <>
          {/* Mode indicator */}
          <div className="mode-indicator">
            <span className="mode-label">Mode:</span>
            <span className={`mode-value mode-${mode.toLowerCase().replace('_', '-')}`}>
              {getModeDisplayName(mode)}
            </span>
          </div>


          {/* Hover info */}
          {(hoveredId || hoveredEdgeId || hoveredBoundaryId) && (
            <div className="hover-info">
              {hoveredId && (
                <>
                  <span className="hover-label">Node:</span>
                  <span className="hover-id">{hoveredId}</span>
                </>
              )}
              {hoveredEdgeId && (
                <>
                  <span className="hover-label">Edge:</span>
                  <span className="hover-id">{hoveredEdgeId}</span>
                </>
              )}
              {hoveredBoundaryId && (
                <>
                  <span className="hover-label">Boundary:</span>
                  <span className="hover-id">{hoveredBoundaryId}</span>
                </>
              )}
            </div>
          )}

          {/* Zoom level display */}
          {zoom !== undefined && (
            <div className="zoom-info">
              <span className="zoom-label">Zoom:</span>
              <span className="zoom-value">x{zoom.toFixed(3)}</span>
            </div>
          )}

          {/* Help trigger */}
          <div className="canvas-help-trigger" title="Hover for instructions">
            <div className="help-icon">?</div>
            <div className="help-tooltip">
              <div className="instruction-group">
                <h4>Tools:</h4>
                <ul>
                  <li><kbd>V</kbd> - Select Mode</li>
                  <li><kbd>H</kbd> - Pan Mode</li>
                  <li><kbd>L</kbd> - Data Flow Tool</li>
                  <li><kbd>B</kbd> - Boundary Tool</li>
                </ul>
              </div>
              <div className="instruction-group">
                <h4>Create Nodes:</h4>
                <ul>
                  <li><kbd>P</kbd> - Add Process</li>
                  <li><kbd>D</kbd> - Add Data Store</li>
                  <li><kbd>E</kbd> - Add External Entity</li>
                  <li><kbd>S</kbd> - Add Service</li>
                </ul>
              </div>
              <div className="instruction-group">
                <h4>Editing:</h4>
                <ul>
                  <li><kbd>Delete</kbd> - Delete Selected</li>
                  <li><kbd>Ctrl + Z</kbd> - Undo</li>
                  <li><kbd>Ctrl + Y</kbd> - Redo</li>
                  <li><kbd>Ctrl + A</kbd> - Select All</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CanvasOverlay;