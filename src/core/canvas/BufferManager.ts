/**
 * Efficient WebGL buffer management for instanced rendering
 */

import { BufferInfo } from '../types';
import { Node, Edge, Boundary, NodeType } from '../types';

export class BufferManager {
  private gl: WebGL2RenderingContext;
  private buffers: Map<string, BufferInfo> = new Map();
  
  // Static geometry for different shapes
  private nodeGeometry!: Float32Array;
  private edgeGeometry!: Float32Array;
  private boundaryGeometry!: Float32Array;
  private selectionRectGeometry!: Float32Array;
  
  // Debug logging state
  private _lastEdgeCount?: number;
  private _lastValidEdgeCount?: number;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.initializeGeometry();
  }

  /**
   * Initialize static geometry for rendering
   */
  private initializeGeometry(): void {
    // Node geometry: quad vertices (-1 to 1)
    this.nodeGeometry = new Float32Array([
      -1, -1,  // bottom-left
       1, -1,  // bottom-right
      -1,  1,  // top-left
       1,  1   // top-right
    ]);

    // Edge geometry: line segment (0 to 1 along line, -1 to 1 across width)
    this.edgeGeometry = new Float32Array([
      0, -1,  // start bottom
      1, -1,  // end bottom
      0,  1,  // start top
      1,  1   // end top
    ]);

    // Boundary geometry: rectangle outline
    this.boundaryGeometry = new Float32Array([
      0, 0,  // bottom-left
      1, 0,  // bottom-right
      0, 1,  // top-left
      1, 1   // top-right
    ]);

    // Selection rectangle geometry: quad for selection box
    this.selectionRectGeometry = new Float32Array([
      0, 0,  // bottom-left
      1, 0,  // bottom-right
      0, 1,  // top-left
      1, 1   // top-right
    ]);
  }

  /**
   * Create or update a buffer
   */
  createBuffer(name: string, data: Float32Array, attributeSize: number): BufferInfo {
    let bufferInfo = this.buffers.get(name);
    
    if (!bufferInfo) {
      const buffer = this.gl.createBuffer();
      if (!buffer) {
        throw new Error(`Failed to create buffer: ${name}`);
      }
      
      bufferInfo = {
        buffer,
        attributeSize,
        count: 0,
        isDirty: true
      };
      
      this.buffers.set(name, bufferInfo);
    }

    // Update buffer data
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferInfo.buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.DYNAMIC_DRAW);
    
    bufferInfo.count = data.length / attributeSize;
    bufferInfo.isDirty = false;

    return bufferInfo;
  }

  /**
   * Generate node instance data for rendering
   */
  generateNodeInstanceData(nodes: Node[], selectedIds: Set<string>): Float32Array {
    
    const instanceData = new Float32Array(nodes.length * 8); // 8 floats per instance
    
    let offset = 0;
    for (const node of nodes) {
      // Position (2 floats)
      instanceData[offset++] = node.position.x;
      instanceData[offset++] = node.position.y;
      
      // Node type (1 float)
      instanceData[offset++] = this.getNodeTypeIndex(node.type);
      
      // Color (3 floats)
      const color = this.getNodeColor(node.type);
      instanceData[offset++] = color[0];
      instanceData[offset++] = color[1];
      instanceData[offset++] = color[2];
      
      // Scale (1 float)
      const scale = node.properties?.scale || 1.0;
      instanceData[offset++] = scale;
      
      // Selected (1 float)
      instanceData[offset++] = selectedIds.has(node.id) ? 1.0 : 0.0;
      
    }
    
    return instanceData;
  }

  /**
   * Generate edge instance data for rendering
   */
  generateEdgeInstanceData(edges: Edge[], nodes: Node[], selectedIds: Set<string>): Float32Array {
    
    const validEdges = edges.filter(edge => 
      nodes.some(n => n.id === edge.source) && 
      edge.targets.some(t => nodes.some(n => n.id === t))
    );
    
    
    // Calculate total segments (each edge can have multiple targets)
    let totalSegments = 0;
    for (const edge of validEdges) {
      totalSegments += edge.targets.length;
    }
    
    const instanceData = new Float32Array(totalSegments * 9); // 9 floats per segment
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    let offset = 0;
    for (const edge of validEdges) {
      const sourceNode = nodeMap.get(edge.source);
      if (!sourceNode) continue;
      
      for (const targetId of edge.targets) {
        const targetNode = nodeMap.get(targetId);
        if (!targetNode) continue;
        
        // Start position (2 floats)
        instanceData[offset++] = sourceNode.position.x;
        instanceData[offset++] = sourceNode.position.y;
        
        // End position (2 floats)
        instanceData[offset++] = targetNode.position.x;
        instanceData[offset++] = targetNode.position.y;
        
        // Color (3 floats)
        const color = this.getEdgeColor(edge.type);
        instanceData[offset++] = color[0];
        instanceData[offset++] = color[1];
        instanceData[offset++] = color[2];
        
        // Thickness (1 float)
        const thickness = edge.properties.thickness || 2.0;
        instanceData[offset++] = thickness;
        
        
        // Selected (1 float)
        instanceData[offset++] = selectedIds.has(edge.id) ? 1.0 : 0.0;
      }
    }
    
    return instanceData;
  }

  /**
   * Generate boundary instance data for rendering
   */
  generateBoundaryInstanceData(boundaries: Boundary[], selectedIds: Set<string>): Float32Array {
    const instanceData = new Float32Array(boundaries.length * 8); // 8 floats per instance
    
    let offset = 0;
    for (const boundary of boundaries) {
      // Position (2 floats)
      instanceData[offset++] = boundary.position.x;
      instanceData[offset++] = boundary.position.y;
      
      // Size (2 floats)
      instanceData[offset++] = boundary.bounds.width;
      instanceData[offset++] = boundary.bounds.height;
      
      // Color (3 floats)
      const color = this.getBoundaryColor(boundary.type);
      instanceData[offset++] = color[0];
      instanceData[offset++] = color[1];
      instanceData[offset++] = color[2];
      
      // Selected (1 float)
      instanceData[offset++] = selectedIds.has(boundary.id) ? 1.0 : 0.0;
    }
    
    return instanceData;
  }

  /**
   * Get static geometry for nodes
   */
  getNodeGeometry(): Float32Array {
    return this.nodeGeometry;
  }

  /**
   * Get static geometry for edges
   */
  getEdgeGeometry(): Float32Array {
    return this.edgeGeometry;
  }

  /**
   * Get static geometry for boundaries
   */
  getBoundaryGeometry(): Float32Array {
    return this.boundaryGeometry;
  }

  /**
   * Get static geometry for selection rectangle
   */
  getSelectionRectGeometry(): Float32Array {
    return this.selectionRectGeometry;
  }

  /**
   * Generate selection rectangle instance data for rendering
   */
  generateSelectionRectInstanceData(startX: number, startY: number, endX: number, endY: number): Float32Array {
    // Calculate rectangle position and size in world coordinates
    const minX = Math.min(startX, endX);
    const minY = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    const instanceData = new Float32Array(4); // 4 floats per instance
    
    // Position (2 floats) - bottom-left corner
    instanceData[0] = minX;
    instanceData[1] = minY;
    
    // Size (2 floats)
    instanceData[2] = width;
    instanceData[3] = height;
    
    return instanceData;
  }

  /**
   * Get buffer by name
   */
  getBuffer(name: string): BufferInfo | undefined {
    return this.buffers.get(name);
  }

  /**
   * Clean up all buffers
   */
  dispose(): void {
    for (const bufferInfo of this.buffers.values()) {
      this.gl.deleteBuffer(bufferInfo.buffer);
    }
    this.buffers.clear();
  }

  /**
   * Get node type index for shader
   */
  private getNodeTypeIndex(type: NodeType): number {
    switch (type) {
      case NodeType.PROCESS: return 0;
      case NodeType.DATASTORE: return 1;
      case NodeType.EXTERNAL_ENTITY: return 2;
      case NodeType.SERVICE: return 3;
      default: return 0;
    }
  }

  /**
   * Get node color based on type
   */
  private getNodeColor(type: NodeType): [number, number, number] {
    // All nodes are primary blue (#3b82f6)
    return [0.231, 0.510, 0.965]; // blue-500
  }

  /**
   * Get edge color based on type
   */
  private getEdgeColor(type: string): [number, number, number] {
    // All edges are amber (#FF9F00)
    return [1.0, 0.624, 0.0]; // amber
  }

  /**
   * Get boundary color based on type
   */
  private getBoundaryColor(type: string): [number, number, number] {
    // All boundaries are dark red (#CB0404)
    return [0.796, 0.016, 0.016]; // dark red
  }
}