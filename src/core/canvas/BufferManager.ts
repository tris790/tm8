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
        instanceData[offset++] = edge.properties.thickness || 2.0;
        
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
    switch (type) {
      case NodeType.PROCESS: return [0.231, 0.510, 0.965]; // blue-500
      case NodeType.DATASTORE: return [0.132, 0.651, 0.368]; // green-500
      case NodeType.EXTERNAL_ENTITY: return [0.910, 0.361, 0.361]; // red-500
      case NodeType.SERVICE: return [0.645, 0.365, 0.925]; // purple-500
      default: return [0.5, 0.5, 0.5]; // gray
    }
  }

  /**
   * Get edge color based on type
   */
  private getEdgeColor(type: string): [number, number, number] {
    switch (type) {
      case 'https': return [0.067, 0.725, 0.506]; // emerald-500
      case 'grpc': return [0.251, 0.631, 0.894]; // sky-500
      default: return [0.475, 0.569, 0.698]; // slate-400
    }
  }

  /**
   * Get boundary color based on type
   */
  private getBoundaryColor(type: string): [number, number, number] {
    switch (type) {
      case 'trust-boundary': return [0.956, 0.396, 0.129]; // orange-500
      case 'network-zone': return [0.792, 0.243, 0.957]; // violet-500
      default: return [0.6, 0.6, 0.6]; // gray
    }
  }
}