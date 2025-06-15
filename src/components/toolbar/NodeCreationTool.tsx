import React, { useState, useEffect, useRef } from 'react';
import { CanvasMode, NodeType } from '../../types/placeholder';
import { ToolButton } from './ToolButton';

interface NodeCreationToolProps {
  onModeChange: (mode: CanvasMode) => void;
  onNodeTypeChange: (type: NodeType) => void;
  activeMode: CanvasMode;
  activeNodeType: NodeType;
}

export const NodeCreationTool: React.FC<NodeCreationToolProps> = ({ 
  onModeChange, 
  onNodeTypeChange,
  activeMode,
  activeNodeType
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);
  
  const nodeTypes = [
    { 
      type: NodeType.SERVICE, 
      label: 'Service', 
      shortcut: 'S',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      )
    },
    { 
      type: NodeType.PROCESS, 
      label: 'Process', 
      shortcut: 'P',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="6" width="12" height="4" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      )
    },
    { 
      type: NodeType.DATASTORE, 
      label: 'Data Store', 
      shortcut: 'D',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <ellipse cx="8" cy="4" rx="6" ry="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M2 4v8c0 1.1 2.7 2 6 2s6-.9 6-2V4" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      )
    },
    { 
      type: NodeType.EXTERNAL_ENTITY, 
      label: 'External Entity', 
      shortcut: 'E',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2L14 8L8 14L2 8L8 2Z" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      )
    }
  ];

  const activeNodeTypeConfig = nodeTypes.find(n => n.type === activeNodeType) || nodeTypes[0];
  const isNodeDrawingMode = activeMode === CanvasMode.DRAW_NODE;

  const handleMainButtonClick = () => {
    onModeChange(CanvasMode.DRAW_NODE);
  };

  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const handleNodeTypeSelect = (type: NodeType) => {
    onNodeTypeChange(type);
    onModeChange(CanvasMode.DRAW_NODE);
    setShowDropdown(false);
  };

  return (
    <div className="node-creation-tool" ref={dropdownRef}>
      <div className="node-creation-tool__main">
        <ToolButton 
          mode={CanvasMode.DRAW_NODE}
          activeMode={activeMode}
          onSelect={handleMainButtonClick}
          icon={activeNodeTypeConfig.icon}
          tooltip={`Add ${activeNodeTypeConfig.label}`}
          shortcut={activeNodeTypeConfig.shortcut}
        />
        <button 
          className={`node-creation-tool__dropdown-toggle ${isNodeDrawingMode ? 'active' : ''}`}
          onClick={handleDropdownToggle}
          title="Choose node type"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      
      {showDropdown && (
        <div className="node-creation-tool__dropdown">
          {nodeTypes.map(({ type, label, shortcut, icon }) => (
            <button
              key={type}
              className={`node-type-option ${type === activeNodeType ? 'active' : ''}`}
              onClick={() => handleNodeTypeSelect(type)}
            >
              <span className="node-type-option__icon">{icon}</span>
              <span className="node-type-option__label">{label}</span>
              <span className="node-type-option__shortcut">{shortcut}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};