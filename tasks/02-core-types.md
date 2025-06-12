# Task 02: Core Type Definitions

## 🎯 Objective
Implement the core TypeScript type definitions for the TM8 threat modeling application based on the plan specifications.

## 📋 Deliverables
1. `src/core/types/graph.ts` - Node, Edge, Boundary interfaces
2. `src/core/types/enums.ts` - NodeType, EdgeType, BoundaryType enums
3. `src/core/types/canvas.ts` - Canvas and rendering types
4. `src/core/types/index.ts` - Central type exports

## 🔧 Technical Requirements

### Core Data Models
Based on plan specifications:

```typescript
// enums.ts
enum NodeType {
  PROCESS = 'process',
  DATASTORE = 'datastore',
  EXTERNAL_ENTITY = 'external-entity',
  SERVICE = 'service'
}

enum EdgeType {
  HTTPS = 'https',
  GRPC = 'grpc'
}

enum BoundaryType {
  TRUST_BOUNDARY = 'trust-boundary',
  NETWORK_ZONE = 'network-zone'
}

// graph.ts
interface Node {
  id: string;
  type: NodeType;
  name: string;
  position: { x: number; y: number };
  properties: Record<string, any>; // "repo", "team", "role", "avatar", etc.
}

interface Edge {
  id: string;
  type: EdgeType;
  source: string;
  targets: string[];
  properties: Record<string, any>; // "encrypted", "routes", etc.
}

interface Boundary {
  id: string;
  type: BoundaryType;
  name: string;
  position: { x: number; y: number };
  bounds: { width: number; height: number };
  properties: Record<string, any>;
}

interface Graph {
  nodes: Node[];
  edges: Edge[];
  boundaries: Boundary[];
  metadata: {
    name: string;
    version: string;
    created: Date;
    modified: Date;
  };
}
```

### Canvas Types
```typescript
// canvas.ts
interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  selection: string[];
  mode: CanvasMode;
}

enum CanvasMode {
  SELECT = 'select',
  PAN = 'pan',
  DRAW_NODE = 'draw-node',
  DRAW_EDGE = 'draw-edge',
  DRAW_BOUNDARY = 'draw-boundary'
}

interface ViewportBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface RenderContext {
  gl: WebGLRenderingContext;
  viewport: ViewportBounds;
  canvasState: CanvasState;
}
```

### Extensibility Support
Types must support:
- User-defined node types (extending base enums)
- Custom properties per entity type
- Plugin system for future extensions

## ✅ Acceptance Criteria
- [x] All interfaces match plan specifications exactly
- [x] Enums are extensible for user-defined types
- [x] Types compile without errors
- [x] Properties system supports arbitrary key-value pairs
- [x] Canvas types support WebGL rendering context
- [x] Proper TypeScript strict mode compliance

## 🔗 Dependencies
- Task 01: Project Setup (directory structure)

## ⚡ Performance Notes
- Use enums for type safety and performance
- Keep interfaces lightweight for large graphs
- Prepare for WebGL rendering optimizations