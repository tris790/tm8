/**
 * Canvas overlay component for UI elements on top of the WebGL canvas
 */

import React from 'react';
import { CanvasMode } from '@/core/types';

export interface CanvasOverlayProps {
  selection: string[];
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
                <h4>Navigation:</h4>
                <ul>
                  <li><kbd>Mouse Wheel</kbd> - Zoom</li>
                  <li><kbd>Middle Click + Drag</kbd> - Pan</li>
                  <li><kbd>Space + Drag</kbd> - Pan</li>
                </ul>
              </div>
              <div className="instruction-group">
                <h4>Selection:</h4>
                <ul>
                  <li><kbd>Click</kbd> - Select</li>
                  <li><kbd>Ctrl + Click</kbd> - Multi-select</li>
                  <li><kbd>Ctrl + A</kbd> - Select All</li>
                  <li><kbd>Esc</kbd> - Clear Selection</li>
                </ul>
              </div>
              <div className="instruction-group">
                <h4>Tools:</h4>
                <ul>
                  <li><kbd>V</kbd> - Select Mode</li>
                  <li><kbd>N</kbd> - Node Tool</li>
                  <li><kbd>E</kbd> - Edge Tool</li>
                  <li><kbd>B</kbd> - Boundary Tool</li>
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