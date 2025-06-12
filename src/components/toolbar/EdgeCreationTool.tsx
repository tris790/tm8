import React, { useState } from 'react';
import { CanvasMode, EdgeType } from '../../types/placeholder';
import { ToolButton } from './ToolButton';

interface EdgeCreationToolProps {
  onModeChange: (mode: CanvasMode) => void;
  onEdgeTypeChange: (type: EdgeType) => void;
  activeMode: CanvasMode;
  activeEdgeType: EdgeType;
}

export const EdgeCreationTool: React.FC<EdgeCreationToolProps> = ({ 
  onModeChange, 
  onEdgeTypeChange,
  activeMode,
  activeEdgeType
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  const edgeTypes = [
    { 
      type: EdgeType.HTTPS, 
      label: 'HTTPS', 
      shortcut: 'Shift+H',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 8h12M10 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="4" cy="8" r="1" fill="currentColor"/>
        </svg>
      )
    },
    { 
      type: EdgeType.GRPC, 
      label: 'gRPC', 
      shortcut: 'Shift+G',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 8h12M10 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 6h4M4 10h4" stroke="currentColor" strokeWidth="1"/>
        </svg>
      )
    }
  ];

  const activeEdgeTypeConfig = edgeTypes.find(e => e.type === activeEdgeType) || edgeTypes[0];
  const isEdgeDrawingMode = activeMode === CanvasMode.DRAW_EDGE;

  const handleMainButtonClick = () => {
    onModeChange(CanvasMode.DRAW_EDGE);
  };

  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const handleEdgeTypeSelect = (type: EdgeType) => {
    onEdgeTypeChange(type);
    onModeChange(CanvasMode.DRAW_EDGE);
    setShowDropdown(false);
  };

  return (
    <div className="edge-creation-tool">
      <div className="edge-creation-tool__main">
        <ToolButton 
          mode={CanvasMode.DRAW_EDGE}
          activeMode={activeMode}
          onSelect={handleMainButtonClick}
          icon={activeEdgeTypeConfig.icon}
          tooltip={`Add ${activeEdgeTypeConfig.label} Connection`}
          shortcut={activeEdgeTypeConfig.shortcut}
        />
        <button 
          className={`edge-creation-tool__dropdown-toggle ${isEdgeDrawingMode ? 'active' : ''}`}
          onClick={handleDropdownToggle}
          title="Choose connection type"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      
      {showDropdown && (
        <div className="edge-creation-tool__dropdown">
          {edgeTypes.map(({ type, label, shortcut, icon }) => (
            <button
              key={type}
              className={`edge-type-option ${type === activeEdgeType ? 'active' : ''}`}
              onClick={() => handleEdgeTypeSelect(type)}
            >
              <span className="edge-type-option__icon">{icon}</span>
              <span className="edge-type-option__label">{label}</span>
              <span className="edge-type-option__shortcut">{shortcut}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};