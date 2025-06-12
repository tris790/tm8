import React from 'react';
import { CanvasMode } from '../../types/placeholder';

interface ToolButtonProps {
  mode: CanvasMode;
  activeMode: CanvasMode;
  onSelect: (mode: CanvasMode) => void;
  shortcut?: string;
  icon: React.ReactNode;
  tooltip: string;
  disabled?: boolean;
}

export const ToolButton: React.FC<ToolButtonProps> = ({ 
  mode, 
  activeMode, 
  onSelect, 
  shortcut, 
  icon, 
  tooltip,
  disabled = false
}) => {
  const isActive = mode === activeMode;
  
  const handleClick = () => {
    if (!disabled) {
      onSelect(mode);
    }
  };

  return (
    <button 
      className={`tool-button ${isActive ? 'tool-button--active' : ''} ${disabled ? 'tool-button--disabled' : ''}`}
      onClick={handleClick}
      title={`${tooltip}${shortcut ? ` (${shortcut})` : ''}`}
      disabled={disabled}
    >
      <span className="tool-button__icon">
        {icon}
      </span>
      {shortcut && <span className="tool-button__shortcut">{shortcut}</span>}
    </button>
  );
};