/**
 * Keyboard shortcut help modal for TM8 application
 * Displays organized list of available keyboard shortcuts
 */

import React, { useState, useEffect } from 'react';
import './ShortcutHelp.css';

export interface ShortcutItem {
  key: string;
  description: string;
}

export interface ShortcutCategory {
  category: string;
  items: ShortcutItem[];
}

export interface ShortcutHelpProps {
  shortcuts?: ShortcutCategory[];
  isOpen?: boolean;
  onClose?: () => void;
}

const defaultShortcuts: ShortcutCategory[] = [
  {
    category: 'General',
    items: [
      { key: 'Ctrl+O', description: 'Open file' },
      { key: 'Ctrl+S', description: 'Save file' },
      { key: 'Ctrl+Shift+S', description: 'Save as...' },
      { key: 'Ctrl+E', description: 'Export' },
      { key: 'Ctrl+F', description: 'Focus search' },
      { key: 'Ctrl+,', description: 'Open preferences' },
      { key: '?', description: 'Show this help' },
    ]
  },
  {
    category: 'Tools',
    items: [
      { key: 'V', description: 'Select tool' },
      { key: 'H', description: 'Pan tool' },
      { key: 'P', description: 'Add process' },
      { key: 'D', description: 'Add data store' },
      { key: 'E', description: 'Add external entity' },
      { key: 'S', description: 'Add service' },
      { key: 'B', description: 'Add boundary' },
      { key: 'L', description: 'Add data flow' },
    ]
  },
  {
    category: 'Editing',
    items: [
      { key: 'Delete', description: 'Delete selected' },
      { key: 'Backspace', description: 'Delete selected' },
      { key: 'Ctrl+Z', description: 'Undo' },
      { key: 'Ctrl+Y', description: 'Redo' },
      { key: 'Ctrl+Shift+Z', description: 'Redo' },
      { key: 'Ctrl+A', description: 'Select all' },
      { key: 'Escape', description: 'Clear selection' },
      { key: 'Ctrl+D', description: 'Duplicate selected' },
      { key: 'Ctrl+G', description: 'Group selected' },
    ]
  },
  {
    category: 'Navigation',
    items: [
      { key: 'Space+Drag', description: 'Pan canvas' },
      { key: 'Mouse Wheel', description: 'Zoom in/out' },
      { key: 'Ctrl+Mouse Wheel', description: 'Fine zoom' },
      { key: 'Ctrl+0', description: 'Fit to screen' },
      { key: 'Ctrl+1', description: 'Zoom to 100%' },
      { key: 'Ctrl++', description: 'Zoom in' },
      { key: 'Ctrl+-', description: 'Zoom out' },
    ]
  },
  {
    category: 'View',
    items: [
      { key: 'Ctrl+1', description: 'Show nodes only' },
      { key: 'Ctrl+2', description: 'Show edges only' },
      { key: 'Ctrl+3', description: 'Show boundaries only' },
      { key: 'Ctrl+4', description: 'Show all' },
      { key: 'Tab', description: 'Toggle properties panel' },
      { key: 'Shift+Tab', description: 'Toggle toolbar' },
      { key: 'F11', description: 'Toggle fullscreen' },
    ]
  }
];

export const ShortcutHelp: React.FC<ShortcutHelpProps> = ({
  shortcuts = defaultShortcuts,
  isOpen: controlledIsOpen,
  onClose
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const handleClose = onClose || (() => setInternalIsOpen(false));

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        if (controlledIsOpen === undefined) {
          setInternalIsOpen(true);
        }
      }
      
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose, controlledIsOpen]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="shortcut-help-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcut-help-title"
    >
      <div className="shortcut-help">
        <div className="shortcut-help__header">
          <h2 id="shortcut-help-title" className="shortcut-help__title">
            Keyboard Shortcuts
          </h2>
          <button 
            className="shortcut-help__close"
            onClick={handleClose}
            aria-label="Close help"
          >
            ×
          </button>
        </div>
        
        <div className="shortcut-help__content">
          <div className="shortcut-help__grid">
            {shortcuts.map(category => (
              <div key={category.category} className="shortcut-category">
                <h3 className="shortcut-category__title">
                  {category.category}
                </h3>
                <div className="shortcut-list">
                  {category.items.map(item => (
                    <div key={`${item.key}-${item.description}`} className="shortcut-item">
                      <kbd className="shortcut-key">
                        {item.key}
                      </kbd>
                      <span className="shortcut-description">
                        {item.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="shortcut-help__footer">
          <p className="shortcut-help__tip">
            Press <kbd>?</kbd> to show/hide this help, or <kbd>Escape</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShortcutHelp;