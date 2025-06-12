# Task 08: Toolbar & Tools System

## 🎯 Objective
Implement the toolbar and tools system for creating, editing, and manipulating threat model elements with keyboard shortcuts and intuitive UI.

## 📋 Deliverables
1. `src/components/toolbar/Toolbar.tsx` - Main toolbar component
2. `src/components/toolbar/ToolButton.tsx` - Individual tool buttons
3. `src/components/toolbar/NodeCreationTool.tsx` - Node creation tools
4. `src/components/toolbar/EdgeCreationTool.tsx` - Edge creation tools
5. `src/hooks/useKeyboardShortcuts.ts` - Keyboard shortcut handling
6. `src/core/tools/ToolManager.ts` - Tool state management

## 🔧 Technical Requirements

### Toolbar Architecture
```typescript
// Toolbar.tsx
interface ToolbarProps {
  activeMode: CanvasMode;
  onModeChange: (mode: CanvasMode) => void;
  selectedNodes: string[];
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  activeMode, 
  onModeChange, 
  selectedNodes 
}) => {
  return (
    <div className="toolbar">
      <div className="tool-group">
        <ToolButton 
          mode={CanvasMode.SELECT} 
          activeMode={activeMode}
          onSelect={onModeChange}
          shortcut="V"
        />
        <ToolButton 
          mode={CanvasMode.PAN} 
          activeMode={activeMode}
          onSelect={onModeChange}
          shortcut="H"
        />
      </div>
      
      <div className="tool-group">
        <NodeCreationTool onModeChange={onModeChange} />
        <EdgeCreationTool onModeChange={onModeChange} />
      </div>
    </div>
  );
};
```

### Tool Button Component
```typescript
// ToolButton.tsx
interface ToolButtonProps {
  mode: CanvasMode;
  activeMode: CanvasMode;
  onSelect: (mode: CanvasMode) => void;
  shortcut?: string;
  icon: React.ReactNode;
  tooltip: string;
}

const ToolButton: React.FC<ToolButtonProps> = ({ 
  mode, 
  activeMode, 
  onSelect, 
  shortcut, 
  icon, 
  tooltip 
}) => {
  const isActive = mode === activeMode;
  
  return (
    <button 
      className={`tool-button ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(mode)}
      title={`${tooltip} ${shortcut ? `(${shortcut})` : ''}`}
    >
      {icon}
      {shortcut && <span className="shortcut">{shortcut}</span>}
    </button>
  );
};
```

### Node Creation Tools
```typescript
// NodeCreationTool.tsx
interface NodeCreationToolProps {
  onModeChange: (mode: CanvasMode) => void;
}

const NodeCreationTool: React.FC<NodeCreationToolProps> = ({ onModeChange }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  const nodeTypes = [
    { type: NodeType.PROCESS, label: 'Process', shortcut: 'P' },
    { type: NodeType.DATASTORE, label: 'Data Store', shortcut: 'D' },
    { type: NodeType.EXTERNAL_ENTITY, label: 'External Entity', shortcut: 'E' },
    { type: NodeType.SERVICE, label: 'Service', shortcut: 'S' }
  ];
  
  return (
    <div className="node-creation-tool">
      <ToolButton 
        mode={CanvasMode.DRAW_NODE}
        icon={<PlusIcon />}
        tooltip="Add Node"
        onClick={() => setShowDropdown(!showDropdown)}
      />
      
      {showDropdown && (
        <div className="node-type-dropdown">
          {nodeTypes.map(({ type, label, shortcut }) => (
            <button
              key={type}
              onClick={() => {
                onModeChange(CanvasMode.DRAW_NODE);
                // Set active node type
                setShowDropdown(false);
              }}
            >
              {label} <span className="shortcut">{shortcut}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Tool Manager
```typescript
// ToolManager.ts
class ToolManager {
  private currentMode: CanvasMode = CanvasMode.SELECT;
  private activeNodeType: NodeType = NodeType.PROCESS;
  private activeEdgeType: EdgeType = EdgeType.HTTPS;
  
  setMode(mode: CanvasMode): void;
  getMode(): CanvasMode;
  
  setActiveNodeType(type: NodeType): void;
  getActiveNodeType(): NodeType;
  
  setActiveEdgeType(type: EdgeType): void;
  getActiveEdgeType(): EdgeType;
  
  // Tool-specific state
  getToolConfig(): ToolConfig;
}
```

## ⌨️ Keyboard Shortcuts System

### Shortcut Hook
```typescript
// useKeyboardShortcuts.ts
interface ShortcutConfig {
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
```

### Default Shortcuts
```typescript
const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  { key: 'v', action: () => setMode(CanvasMode.SELECT), description: 'Select tool' },
  { key: 'h', action: () => setMode(CanvasMode.PAN), description: 'Pan tool' },
  { key: 'p', action: () => createNode(NodeType.PROCESS), description: 'Add process' },
  { key: 'd', action: () => createNode(NodeType.DATASTORE), description: 'Add data store' },
  { key: 'e', action: () => createNode(NodeType.EXTERNAL_ENTITY), description: 'Add external entity' },
  { key: 's', action: () => createNode(NodeType.SERVICE), description: 'Add service' },
  { key: 'Delete', action: () => deleteSelected(), description: 'Delete selected' },
  { key: 'z', ctrlKey: true, action: () => undo(), description: 'Undo' },
  { key: 'y', ctrlKey: true, action: () => redo(), description: 'Redo' },
  { key: 'a', ctrlKey: true, action: () => selectAll(), description: 'Select all' },
];
```

## 🎨 Visual Design

### Toolbar Styling
```css
.toolbar {
  background: var(--bg-surface);
  border-right: 1px solid var(--color-border);
  padding: var(--spacing-sm);
}

.tool-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.tool-button {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: var(--radius);
  background: transparent;
  color: var(--color-text);
  position: relative;
}

.tool-button.active {
  background: var(--color-primary);
  color: white;
}

.shortcut {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 10px;
  opacity: 0.7;
}
```

## ✅ Acceptance Criteria
- [x] All tools accessible via toolbar buttons
- [x] Keyboard shortcuts work for all tools
- [x] Visual feedback for active tool
- [x] Node creation dropdown shows all types
- [x] Edge creation works between nodes
- [x] Tools integrate with canvas interaction
- [x] Shortcuts don't conflict with browser defaults
- [x] Tooltips show shortcut keys

## 🔗 Dependencies
- Task 06: UI Components (Button styling)
- Task 07: Canvas Integration (CanvasMode)
- Task 02: Core Types (NodeType, EdgeType)

## ⚡ Performance Notes
- Debounce rapid tool switching
- Use event delegation for shortcut handling
- Minimize re-renders with proper React optimization