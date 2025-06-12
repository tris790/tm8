import { useEffect } from 'react';

export interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const shortcut = shortcuts.find(s => 
        s.key.toLowerCase() === e.key.toLowerCase() &&
        !!s.ctrlKey === e.ctrlKey &&
        !!s.shiftKey === e.shiftKey &&
        !!s.altKey === e.altKey
      );
      
      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Default shortcuts for the application
export const createDefaultShortcuts = (handlers: {
  setMode: (mode: string) => void;
  createNode: (type: string) => void;
  deleteSelected: () => void;
  undo: () => void;
  redo: () => void;
  selectAll: () => void;
}): ShortcutConfig[] => [
  { key: 'v', action: () => handlers.setMode('select'), description: 'Select tool' },
  { key: 'h', action: () => handlers.setMode('pan'), description: 'Pan tool' },
  { key: 'p', action: () => handlers.createNode('process'), description: 'Add process' },
  { key: 'd', action: () => handlers.createNode('datastore'), description: 'Add data store' },
  { key: 'e', action: () => handlers.createNode('external-entity'), description: 'Add external entity' },
  { key: 's', action: () => handlers.createNode('service'), description: 'Add service' },
  { key: 'Delete', action: handlers.deleteSelected, description: 'Delete selected' },
  { key: 'Backspace', action: handlers.deleteSelected, description: 'Delete selected' },
  { key: 'z', ctrlKey: true, action: handlers.undo, description: 'Undo' },
  { key: 'y', ctrlKey: true, action: handlers.redo, description: 'Redo' },
  { key: 'z', ctrlKey: true, shiftKey: true, action: handlers.redo, description: 'Redo' },
  { key: 'a', ctrlKey: true, action: handlers.selectAll, description: 'Select all' },
];