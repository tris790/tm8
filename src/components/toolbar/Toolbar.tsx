import React, { useState, useEffect } from 'react';
import { CanvasMode, NodeType, EdgeType } from '../../types/placeholder';
import { ToolButton } from './ToolButton';
import { NodeCreationTool } from './NodeCreationTool';
import { EdgeCreationTool } from './EdgeCreationTool';
import { useKeyboardShortcuts, createDefaultShortcuts } from '../../hooks/useKeyboardShortcuts';
import { toolManager } from '../../core/tools/ToolManager';
import '../../styles/components/toolbar.css';

interface ToolbarProps {
  activeMode: CanvasMode;
  onModeChange: (mode: CanvasMode) => void;
  selectedNodes: string[];
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onDeleteSelected?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  activeMode, 
  onModeChange, 
  selectedNodes,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onDeleteSelected
}) => {
  const [activeNodeType, setActiveNodeType] = useState<NodeType>(NodeType.SERVICE);
  const [activeEdgeType, setActiveEdgeType] = useState<EdgeType>(EdgeType.HTTPS);

  // Keyboard shortcuts
  const shortcuts = createDefaultShortcuts({
    setMode: (mode: string) => onModeChange(mode as CanvasMode),
    createNode: (type: string) => {
      setActiveNodeType(type as NodeType);
      onModeChange(CanvasMode.DRAW_NODE);
    },
    deleteSelected: () => {
      if (selectedNodes.length > 0) {
        console.log('Delete selected nodes:', selectedNodes);
        // TODO: Implement actual deletion when graph manager is available
      }
    },
    undo: () => onUndo?.(),
    redo: () => onRedo?.(),
    selectAll: () => console.log('Select all nodes'),
  });

  useKeyboardShortcuts(shortcuts);

  // Sync with tool manager
  useEffect(() => {
    const unsubscribe = toolManager.subscribe((config) => {
      if (config.mode !== activeMode) {
        onModeChange(config.mode);
      }
      setActiveNodeType(config.activeNodeType);
      setActiveEdgeType(config.activeEdgeType);
    });

    return unsubscribe;
  }, [activeMode, onModeChange]);

  const handleModeChange = (mode: CanvasMode) => {
    toolManager.setMode(mode);
    onModeChange(mode);
  };

  const handleNodeTypeChange = (type: NodeType) => {
    toolManager.setActiveNodeType(type);
    setActiveNodeType(type);
  };

  const handleEdgeTypeChange = (type: EdgeType) => {
    toolManager.setActiveEdgeType(type);
    setActiveEdgeType(type);
  };

  return (
    <div className="toolbar">
      {/* Selection Tools */}
      <div className="toolbar__group">
        <ToolButton 
          mode={CanvasMode.SELECT} 
          activeMode={activeMode}
          onSelect={handleModeChange}
          shortcut="V"
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2L6 14L8 8L14 6L2 2Z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          }
          tooltip="Select Tool"
        />
        <ToolButton 
          mode={CanvasMode.PAN} 
          activeMode={activeMode}
          onSelect={handleModeChange}
          shortcut="H"
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          }
          tooltip="Pan Tool"
        />
      </div>

      {/* History Tools */}
      <div className="toolbar__group">
        <div className="toolbar__button-container">
          <button 
            className={`toolbar__button ${!canUndo ? 'toolbar__button--disabled' : ''}`}
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M3 8l3-3M3 8l3 3" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
          <span className="toolbar__button-shortcut">Ctrl+Z</span>
        </div>
        <div className="toolbar__button-container">
          <button 
            className={`toolbar__button ${!canRedo ? 'toolbar__button--disabled' : ''}`}
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13 8H3M13 8l-3-3M13 8l-3 3" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
          <span className="toolbar__button-shortcut">Ctrl+Y</span>
        </div>
      </div>
      
      {/* Creation Tools */}
      <div className="toolbar__group">
        <NodeCreationTool 
          onModeChange={handleModeChange}
          onNodeTypeChange={handleNodeTypeChange}
          activeMode={activeMode}
          activeNodeType={activeNodeType}
        />
        <EdgeCreationTool
          onModeChange={handleModeChange}
          onEdgeTypeChange={handleEdgeTypeChange}
          activeMode={activeMode}
          activeEdgeType={activeEdgeType}
        />
      </div>

      {/* Boundary Tool */}
      <div className="toolbar__group">
        <ToolButton 
          mode={CanvasMode.DRAW_BOUNDARY} 
          activeMode={activeMode}
          onSelect={handleModeChange}
          shortcut="B"
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
            </svg>
          }
          tooltip="Draw Boundary"
        />
      </div>

      {/* Spacer to push delete button to the end */}
      <div className="toolbar__spacer"></div>

      {/* Delete Selected - positioned at the end */}
      {selectedNodes.length > 0 && (
        <div className="toolbar__group toolbar__group--end">
          <button 
            className="toolbar__button toolbar__button--danger"
            onClick={onDeleteSelected}
            title={`Delete ${selectedNodes.length} selected item${selectedNodes.length > 1 ? 's' : ''} (Delete)`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 2h4M2 4h12M3 4l1 10h8l1-10M6 6v6M10 6v6" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
        </div>
      )}

    </div>
  );
};