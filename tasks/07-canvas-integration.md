# Task 07: Canvas Integration & React Hooks

## 🎯 Objective
Integrate the WebGL canvas engine with React components using custom hooks for state management and user interactions.

## 📋 Deliverables
1. `src/components/canvas/CanvasContainer.tsx` - Main canvas React component
2. `src/hooks/useCanvas.ts` - Canvas lifecycle management hook
3. `src/hooks/useGraphState.ts` - Graph data state management
4. `src/hooks/useCanvasInteraction.ts` - Mouse/keyboard interaction handling
5. `src/components/canvas/CanvasOverlay.tsx` - UI overlays on canvas

## 🔧 Technical Requirements

### Canvas Component Architecture
```typescript
// CanvasContainer.tsx
interface CanvasContainerProps {
  graph: Graph;
  onNodeSelect: (nodeId: string) => void;
  onNodeUpdate: (nodeId: string, updates: Partial<Node>) => void;
}

const CanvasContainer: React.FC<CanvasContainerProps> = ({ 
  graph, 
  onNodeSelect, 
  onNodeUpdate 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { renderer, camera } = useCanvas(canvasRef);
  const { selection, mode } = useCanvasInteraction(canvasRef, graph);
  
  return (
    <div className="canvas-container">
      <canvas ref={canvasRef} />
      <CanvasOverlay selection={selection} mode={mode} />
    </div>
  );
};
```

### Canvas Lifecycle Hook
```typescript
// useCanvas.ts
interface UseCanvasResult {
  renderer: WebGLRenderer | null;
  camera: Camera;
  isReady: boolean;
}

export const useCanvas = (canvasRef: RefObject<HTMLCanvasElement>): UseCanvasResult => {
  const [renderer, setRenderer] = useState<WebGLRenderer | null>(null);
  const [camera] = useState(() => new Camera());
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if (canvasRef.current) {
      const newRenderer = new WebGLRenderer(canvasRef.current);
      setRenderer(newRenderer);
      setIsReady(true);
      
      return () => {
        newRenderer.dispose();
      };
    }
  }, [canvasRef]);
  
  return { renderer, camera, isReady };
};
```

### Graph State Management
```typescript
// useGraphState.ts
interface UseGraphStateResult {
  graph: Graph;
  selectedNodes: string[];
  visibilityState: VisibilityState;
  addNode: (node: Node) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  deleteNode: (id: string) => void;
  selectNodes: (nodeIds: string[]) => void;
  undo: () => void;
  redo: () => void;
}

export const useGraphState = (initialGraph?: Graph): UseGraphStateResult => {
  const [graphStore] = useState(() => new GraphStore(initialGraph));
  const [graph, setGraph] = useState(() => graphStore.getGraph());
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  
  // Implementation with proper React state management
};
```

### Interaction Handling Hook
```typescript
// useCanvasInteraction.ts
interface UseCanvasInteractionResult {
  selection: string[];
  mode: CanvasMode;
  setMode: (mode: CanvasMode) => void;
}

export const useCanvasInteraction = (
  canvasRef: RefObject<HTMLCanvasElement>,
  graph: Graph
): UseCanvasInteractionResult => {
  const [selection, setSelection] = useState<string[]>([]);
  const [mode, setMode] = useState<CanvasMode>(CanvasMode.SELECT);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleMouseDown = (e: MouseEvent) => {
      // Handle mouse interactions based on current mode
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      // Handle drag operations
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      // Complete interactions
    };
    
    const handleWheel = (e: WheelEvent) => {
      // Zoom functionality
    };
    
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [canvasRef, graph, mode]);
  
  return { selection, mode, setMode };
};
```

## 🎨 Canvas Overlay System

### Overlay Component
```typescript
// CanvasOverlay.tsx
interface CanvasOverlayProps {
  selection: string[];
  mode: CanvasMode;
}

const CanvasOverlay: React.FC<CanvasOverlayProps> = ({ selection, mode }) => {
  return (
    <div className="canvas-overlay">
      {/* Selection indicators */}
      {/* Mode-specific UI elements */}
      {/* Context menus */}
      {/* Tool tips */}
    </div>
  );
};
```

### Performance Optimizations
- Use `useMemo` for expensive calculations
- Implement `useCallback` for event handlers
- Debounce rapid updates (resize, zoom)
- RAF (requestAnimationFrame) for smooth rendering

## 🎯 Integration Points

### State Synchronization
- React state ↔ WebGL renderer
- Canvas events → React state updates
- Graph changes → Canvas re-render

### Event Handling
- Mouse events: select, drag, zoom, pan
- Keyboard shortcuts: delete, copy, paste, undo/redo
- Context menus for right-click actions
- Tool mode switching

## ✅ Acceptance Criteria
- [x] Canvas renders inside React component
- [x] Mouse interactions work smoothly
- [x] Selection state syncs between React and WebGL
- [x] Graph updates trigger canvas re-render
- [x] Undo/redo works with React state
- [x] Performance remains smooth during interactions
- [x] Memory leaks are prevented (proper cleanup)
- [x] Canvas resizes properly with window

## 🔗 Dependencies
- Task 03: WebGL Canvas Engine
- Task 05: Graph Data Structures
- Task 06: UI Components (for overlay styling)

## ⚡ Performance Notes
- Batch React state updates where possible
- Use refs for frequently accessed DOM elements
- Implement proper cleanup in useEffect
- Profile canvas rendering performance