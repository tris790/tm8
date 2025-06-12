# Task 05: Graph Data Structures & Algorithms

## 🎯 Objective
Implement efficient graph data structures and algorithms for managing threat model graphs with high performance at scale.

## 📋 Deliverables
1. `src/core/graph/GraphStore.ts` - Core graph state management
2. `src/core/graph/SpatialIndex.ts` - Spatial indexing for fast queries
3. `src/core/graph/GraphAlgorithms.ts` - Graph traversal and analysis
4. `src/core/graph/GraphHistory.ts` - Undo/redo functionality
5. `src/core/graph/GraphValidator.ts` - Data integrity validation

## 🔧 Technical Requirements

### Graph Store Architecture
```typescript
class GraphStore {
  private nodes: Map<string, Node>;
  private edges: Map<string, Edge>;
  private boundaries: Map<string, Boundary>;
  private spatialIndex: SpatialIndex;
  private history: GraphHistory;
  
  // CRUD operations
  addNode(node: Node): void;
  updateNode(id: string, updates: Partial<Node>): void;
  deleteNode(id: string): void;
  
  // Queries
  getNodesInRegion(bounds: ViewportBounds): Node[];
  findNodesByName(query: string): Node[];
  getConnectedNodes(nodeId: string): Node[];
}
```

### Spatial Indexing
For efficient viewport queries and hit testing:
```typescript
class SpatialIndex {
  private quadTree: QuadTree<Node>;
  
  insert(node: Node): void;
  remove(nodeId: string): void;
  query(bounds: ViewportBounds): Node[];
  nearest(point: {x: number, y: number}, maxDistance: number): Node[];
}
```

### Performance Optimizations

#### Quadtree Implementation
- Spatial partitioning for O(log n) queries
- Dynamic rebalancing as nodes move
- Efficient viewport culling

#### Memory Management
- Object pooling for frequent operations
- Immutable updates where beneficial
- Weak references for temporary objects

#### Batch Operations
```typescript
interface GraphBatch {
  addNodes: Node[];
  updateNodes: {id: string, updates: Partial<Node>}[];
  deleteNodes: string[];
}

applyBatch(batch: GraphBatch): void;
```

### Graph Algorithms
Essential algorithms for threat modeling:

```typescript
class GraphAlgorithms {
  // Traversal
  static depthFirstSearch(graph: Graph, startId: string): string[];
  static breadthFirstSearch(graph: Graph, startId: string): string[];
  
  // Analysis
  static findDataFlowPaths(graph: Graph, fromId: string, toId: string): Edge[][];
  static detectCycles(graph: Graph): Edge[][];
  static findIsolatedNodes(graph: Graph): Node[];
  
  // Clustering
  static groupByTrustBoundary(graph: Graph): Map<string, Node[]>;
  static findConnectedComponents(graph: Graph): Node[][];
}
```

### History Management
Undo/redo with efficient memory usage:
```typescript
class GraphHistory {
  private undoStack: GraphSnapshot[];
  private redoStack: GraphSnapshot[];
  private maxHistorySize: number = 50;
  
  snapshot(): void;
  undo(): Graph | null;
  redo(): Graph | null;
  canUndo(): boolean;
  canRedo(): boolean;
}
```

## 🎨 Integration Features

### Search & Filtering
```typescript
interface SearchOptions {
  query: string;
  fuzzyMatch: boolean;
  searchFields: ('name' | 'properties')[];
  nodeTypes: NodeType[];
}

searchNodes(options: SearchOptions): Node[];
```

### Focus/Hide Functionality
```typescript
interface VisibilityState {
  hiddenNodes: Set<string>;
  focusedNodes: Set<string>;
  showOnlyConnected: boolean;
}

applyVisibilityFilter(state: VisibilityState): Node[];
```

## ✅ Acceptance Criteria
- [x] Handles 1000+ nodes efficiently
- [x] Viewport queries in <1ms
- [x] Undo/redo works for all operations
- [x] Search is instant with fuzzy matching
- [x] Spatial index updates automatically
- [x] Memory usage stays constant during operations
- [x] All graph algorithms are correct and tested

## 🔗 Dependencies
- Task 02: Core Types (Graph, Node, Edge interfaces)

## ⚡ Performance Notes
- Profile with samples/big.tm7 for realistic datasets
- Use benchmarks for critical path operations
- Consider Web Workers for heavy algorithms
- Implement lazy loading for large property sets