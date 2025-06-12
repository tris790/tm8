# Task 03: WebGL Canvas Engine

## 🎯 Objective
Build a high-performance WebGL-based canvas engine for rendering and interacting with threat model graphs at scale (1000+ nodes).

## 📋 Deliverables
1. `src/core/canvas/WebGLRenderer.ts` - Core WebGL rendering engine
2. `src/core/canvas/Camera.ts` - Viewport, zoom, and pan controls
3. `src/core/canvas/Interaction.ts` - Mouse/keyboard interaction handling
4. `src/core/canvas/Shaders.ts` - GLSL shader programs for nodes/edges
5. `src/core/canvas/BufferManager.ts` - Efficient vertex buffer management

## 🔧 Technical Requirements

### WebGL Renderer Architecture
```typescript
class WebGLRenderer {
  private gl: WebGLRenderingContext;
  private shaderProgram: WebGLProgram;
  private vertexBuffer: WebGLBuffer;
  private camera: Camera;
  
  constructor(canvas: HTMLCanvasElement);
  render(graph: Graph, camera: Camera): void;
  dispose(): void;
}
```

### Performance Targets
- **Render 1000+ nodes**: 60 FPS minimum
- **Zoom/Pan**: Buttery smooth interaction
- **Memory**: Efficient buffer reuse
- **Startup**: Instant initialization

### Shader Programs
Create optimized GLSL shaders for:
- **Node Rendering**: Instanced quads with different shapes per type
- **Edge Rendering**: Anti-aliased lines with varying thickness
- **Boundary Rendering**: Dashed/dotted rectangles
- **Selection**: Highlight overlays

### Camera System
```typescript
class Camera {
  zoom: number;
  panX: number;
  panY: number;
  
  screenToWorld(screenX: number, screenY: number): {x: number, y: number};
  worldToScreen(worldX: number, worldY: number): {x: number, y: number};
  getViewMatrix(): Float32Array;
  getProjectionMatrix(): Float32Array;
}
```

### Interaction Handling
- **Mouse Events**: Click, drag, wheel for zoom/pan/selection
- **Keyboard**: Arrow keys for navigation, shortcuts for tools
- **Touch**: Basic touch support for tablets
- **Hit Testing**: Efficient spatial queries for selection

### Optimization Techniques
1. **Instanced Rendering**: Draw many similar objects in one call
2. **Frustum Culling**: Only render visible nodes
3. **Level of Detail**: Reduce complexity at high zoom levels
4. **Batch Updates**: Minimize WebGL state changes

## 🎨 Visual Requirements
Match the dark theme from plan:
- Background: `#0f172a` (slate-900)
- Node colors based on type with `#3b82f6` primary
- Edge colors with proper alpha blending
- Selection highlights with `#10b981` accent

### Node Rendering
Different shapes per NodeType:
- **Process**: Rounded rectangle
- **Datastore**: Cylinder-like shape
- **External Entity**: Rectangle
- **Service**: Hexagon

## ✅ Acceptance Criteria
- [x] Renders 1000+ nodes at 60 FPS
- [x] Smooth zoom (0.1x to 10x range)
- [x] Smooth pan with mouse drag
- [x] Accurate hit testing for selection
- [x] Different visual styles per node type
- [x] Anti-aliased edges and boundaries
- [x] Proper alpha blending
- [x] Memory efficient (no leaks)

## 🔗 Dependencies
- Task 02: Core Types (Graph, Node, Edge interfaces)

## ⚡ Performance Notes
- Use WebGL2 if available for better performance
- Implement object pooling for frequent allocations
- Profile with large datasets (use samples/big.tm7)
- Consider Web Workers for heavy computations