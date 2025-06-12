/**
 * High-performance WebGL renderer for threat model graphs
 */

import { Graph, RenderStats, ShaderProgram, Node as GraphNode, Edge, Boundary } from '../types';
import { Camera } from './Camera';
import { BufferManager } from './BufferManager';
import { nodeShaders, edgeShaders, boundaryShaders, createProgram } from './Shaders';
import { TextRenderer } from './TextRenderer';

export class WebGLRenderer {
  private gl: WebGL2RenderingContext;
  private camera: Camera;
  private bufferManager: BufferManager;
  private textRenderer: TextRenderer;
  
  // Shader programs
  private nodeProgram: ShaderProgram | null = null;
  private edgeProgram: ShaderProgram | null = null;
  private boundaryProgram: ShaderProgram | null = null;
  
  // Rendering state
  private selectedIds: Set<string> = new Set();
  private stats: RenderStats = {
    frameTime: 0,
    drawCalls: 0,
    vertexCount: 0,
    visibleNodes: 0,
    visibleEdges: 0
  };
  
  // Animation
  private startTime: number = Date.now();
  private animationFrame: number = 0;
  
  // Debug logging throttling
  private lastLogTime: number = 0;

  constructor(canvas: HTMLCanvasElement, camera?: Camera) {
    // Get WebGL2 context
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: true,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    });

    if (!gl) {
      throw new Error('WebGL2 not supported');
    }

    this.gl = gl;
    this.camera = camera || new Camera();
    this.bufferManager = new BufferManager(gl);
    this.textRenderer = new TextRenderer(gl, this.camera);

    this.initializeWebGL();
    this.createShaderPrograms();
    this.setupEventListeners(canvas);
  }

  /**
   * Initialize WebGL state
   */
  private initializeWebGL(): void {
    const gl = this.gl;

    // Set clear color to match CSS background
    gl.clearColor(0.059, 0.090, 0.165, 1.0); // slate-900

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Disable depth testing (2D rendering)
    gl.disable(gl.DEPTH_TEST);

    // Enable face culling for performance
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
  }

  /**
   * Create all shader programs
   */
  private createShaderPrograms(): void {
    const gl = this.gl;

    // Node shader program
    const nodeProgram = createProgram(gl, nodeShaders);
    this.nodeProgram = {
      program: nodeProgram,
      attributes: {
        a_position: gl.getAttribLocation(nodeProgram, 'a_position'),
        a_instancePosition: gl.getAttribLocation(nodeProgram, 'a_instancePosition'),
        a_instanceType: gl.getAttribLocation(nodeProgram, 'a_instanceType'),
        a_instanceColor: gl.getAttribLocation(nodeProgram, 'a_instanceColor'),
        a_instanceScale: gl.getAttribLocation(nodeProgram, 'a_instanceScale'),
        a_selected: gl.getAttribLocation(nodeProgram, 'a_selected')
      },
      uniforms: {
        u_viewMatrix: gl.getUniformLocation(nodeProgram, 'u_viewMatrix')!,
        u_projectionMatrix: gl.getUniformLocation(nodeProgram, 'u_projectionMatrix')!,
        u_pixelRatio: gl.getUniformLocation(nodeProgram, 'u_pixelRatio')!,
        u_time: gl.getUniformLocation(nodeProgram, 'u_time')!
      }
    };

    // Edge shader program
    const edgeProgram = createProgram(gl, edgeShaders);
    this.edgeProgram = {
      program: edgeProgram,
      attributes: {
        a_position: gl.getAttribLocation(edgeProgram, 'a_position'),
        a_startPos: gl.getAttribLocation(edgeProgram, 'a_startPos'),
        a_endPos: gl.getAttribLocation(edgeProgram, 'a_endPos'),
        a_color: gl.getAttribLocation(edgeProgram, 'a_color'),
        a_thickness: gl.getAttribLocation(edgeProgram, 'a_thickness'),
        a_selected: gl.getAttribLocation(edgeProgram, 'a_selected')
      },
      uniforms: {
        u_viewMatrix: gl.getUniformLocation(edgeProgram, 'u_viewMatrix')!,
        u_projectionMatrix: gl.getUniformLocation(edgeProgram, 'u_projectionMatrix')!,
        u_time: gl.getUniformLocation(edgeProgram, 'u_time')!
      }
    };

    // Boundary shader program
    const boundaryProgram = createProgram(gl, boundaryShaders);
    this.boundaryProgram = {
      program: boundaryProgram,
      attributes: {
        a_position: gl.getAttribLocation(boundaryProgram, 'a_position'),
        a_boundaryPos: gl.getAttribLocation(boundaryProgram, 'a_boundaryPos'),
        a_boundarySize: gl.getAttribLocation(boundaryProgram, 'a_boundarySize'),
        a_color: gl.getAttribLocation(boundaryProgram, 'a_color'),
        a_selected: gl.getAttribLocation(boundaryProgram, 'a_selected')
      },
      uniforms: {
        u_viewMatrix: gl.getUniformLocation(boundaryProgram, 'u_viewMatrix')!,
        u_projectionMatrix: gl.getUniformLocation(boundaryProgram, 'u_projectionMatrix')!,
        u_time: gl.getUniformLocation(boundaryProgram, 'u_time')!,
        u_dashSize: gl.getUniformLocation(boundaryProgram, 'u_dashSize')!
      }
    };
  }

  /**
   * Setup canvas event listeners for resize
   */
  private setupEventListeners(canvas: HTMLCanvasElement): void {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.resize(width, height);
      }
    });

    resizeObserver.observe(canvas);
  }

  /**
   * Resize the canvas and update camera
   */
  resize(width: number, height: number): void {
    const gl = this.gl;
    const pixelRatio = window.devicePixelRatio || 1;
    
    // Set canvas size
    gl.canvas.width = width * pixelRatio;
    gl.canvas.height = height * pixelRatio;
    
    // Set viewport
    gl.viewport(0, 0, width * pixelRatio, height * pixelRatio);
    
    // Update camera
    this.camera.setCanvasSize(width, height);
  }

  /**
   * Render the graph
   */
  render(graph: Graph): void {
    const startTime = performance.now();
    const gl = this.gl;


    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT);


    // Reset stats
    this.stats.drawCalls = 0;
    this.stats.vertexCount = 0;
    this.stats.visibleNodes = graph.nodes.length;
    this.stats.visibleEdges = graph.edges.length;

    // Update time uniform
    const currentTime = (Date.now() - this.startTime) / 1000.0;

    // Get camera matrices
    const viewMatrix = this.camera.getViewMatrix();
    const projectionMatrix = this.camera.getProjectionMatrix();
    
    

    // Render boundaries first (background)
    this.renderBoundaries(graph.boundaries, viewMatrix, projectionMatrix, currentTime);

    // Render edges
    this.renderEdges(graph.edges, graph.nodes, viewMatrix, projectionMatrix, currentTime);

    // Render nodes (foreground)
    this.renderNodes(graph.nodes, viewMatrix, projectionMatrix, currentTime);

    // Render text labels on top of everything
    this.textRenderer.renderEntityLabels(graph.nodes, graph.edges, graph.boundaries, this.selectedIds);

    // Update stats
    this.stats.frameTime = performance.now() - startTime;
  }

  /**
   * Render nodes with instanced rendering
   */
  private renderNodes(nodes: GraphNode[], viewMatrix: Float32Array, projectionMatrix: Float32Array, time: number): void {
    if (nodes.length === 0 || !this.nodeProgram) return;

    const gl = this.gl;
    const program = this.nodeProgram;

    // Use node shader program
    gl.useProgram(program.program);

    // Set uniforms
    if (program.uniforms.u_viewMatrix) {
      gl.uniformMatrix3fv(program.uniforms.u_viewMatrix, false, viewMatrix);
    }
    if (program.uniforms.u_projectionMatrix) {
      gl.uniformMatrix3fv(program.uniforms.u_projectionMatrix, false, projectionMatrix);
    }
    if (program.uniforms.u_pixelRatio) {
      gl.uniform1f(program.uniforms.u_pixelRatio, window.devicePixelRatio || 1);
    }
    if (program.uniforms.u_time) {
      gl.uniform1f(program.uniforms.u_time, time);
    }

    // Set up vertex buffer (static quad geometry)
    const positionBuffer = this.bufferManager.createBuffer(
      'nodePosition',
      this.bufferManager.getNodeGeometry(),
      2
    );
    
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer.buffer);
    if (program.attributes.a_position >= 0) {
      gl.enableVertexAttribArray(program.attributes.a_position);
      gl.vertexAttribPointer(program.attributes.a_position, 2, gl.FLOAT, false, 0, 0);
    }

    // Set up instance data buffer
    const instanceData = this.bufferManager.generateNodeInstanceData(nodes, this.selectedIds);
    const instanceBuffer = this.bufferManager.createBuffer('nodeInstances', instanceData, 8);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer.buffer);

    // Instance position (2 floats starting at offset 0)
    if (program.attributes.a_instancePosition >= 0) {
      gl.enableVertexAttribArray(program.attributes.a_instancePosition);
      gl.vertexAttribPointer(program.attributes.a_instancePosition, 2, gl.FLOAT, false, 32, 0);
      gl.vertexAttribDivisor(program.attributes.a_instancePosition, 1);
    }

    // Instance type (1 float starting at offset 8 bytes = 2 floats)
    if (program.attributes.a_instanceType >= 0) {
      gl.enableVertexAttribArray(program.attributes.a_instanceType);
      gl.vertexAttribPointer(program.attributes.a_instanceType, 1, gl.FLOAT, false, 32, 8);
      gl.vertexAttribDivisor(program.attributes.a_instanceType, 1);
    }

    // Instance color (3 floats starting at offset 12 bytes = 3 floats)
    if (program.attributes.a_instanceColor >= 0) {
      gl.enableVertexAttribArray(program.attributes.a_instanceColor);
      gl.vertexAttribPointer(program.attributes.a_instanceColor, 3, gl.FLOAT, false, 32, 12);
      gl.vertexAttribDivisor(program.attributes.a_instanceColor, 1);
    }

    // Instance scale (1 float starting at offset 24 bytes = 6 floats)
    if (program.attributes.a_instanceScale >= 0) {
      gl.enableVertexAttribArray(program.attributes.a_instanceScale);
      gl.vertexAttribPointer(program.attributes.a_instanceScale, 1, gl.FLOAT, false, 32, 24);
      gl.vertexAttribDivisor(program.attributes.a_instanceScale, 1);
    }

    // Selected flag (1 float starting at offset 28 bytes = 7 floats)
    if (program.attributes.a_selected >= 0) {
      gl.enableVertexAttribArray(program.attributes.a_selected);
      gl.vertexAttribPointer(program.attributes.a_selected, 1, gl.FLOAT, false, 32, 28);
      gl.vertexAttribDivisor(program.attributes.a_selected, 1);
    }

    // Draw instanced
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, nodes.length);

    // Clean up
    this.cleanupVertexAttribs(program);
    this.stats.drawCalls++;
    this.stats.vertexCount += nodes.length * 4;
  }

  /**
   * Render edges
   */
  private renderEdges(edges: Edge[], nodes: GraphNode[], viewMatrix: Float32Array, projectionMatrix: Float32Array, time: number): void {
    if (edges.length === 0 || !this.edgeProgram) return;

    const gl = this.gl;
    const program = this.edgeProgram;

    gl.useProgram(program.program);

    // Set uniforms
    gl.uniformMatrix3fv(program.uniforms.u_viewMatrix, false, viewMatrix);
    gl.uniformMatrix3fv(program.uniforms.u_projectionMatrix, false, projectionMatrix);
    gl.uniform1f(program.uniforms.u_time, time);

    // Generate edge instance data
    const instanceData = this.bufferManager.generateEdgeInstanceData(edges, nodes, this.selectedIds);
    if (instanceData.length === 0) return;

    const instanceCount = instanceData.length / 9;

    // Set up vertex buffer
    const positionBuffer = this.bufferManager.createBuffer(
      'edgePosition',
      this.bufferManager.getEdgeGeometry(),
      2
    );
    
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer.buffer);
    gl.enableVertexAttribArray(program.attributes.a_position);
    gl.vertexAttribPointer(program.attributes.a_position, 2, gl.FLOAT, false, 0, 0);

    // Set up instance data
    const instanceBuffer = this.bufferManager.createBuffer('edgeInstances', instanceData, 9);
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer.buffer);

    // Instance attributes (9 floats per instance = 36 bytes stride)
    gl.enableVertexAttribArray(program.attributes.a_startPos);
    gl.vertexAttribPointer(program.attributes.a_startPos, 2, gl.FLOAT, false, 36, 0);
    gl.vertexAttribDivisor(program.attributes.a_startPos, 1);

    gl.enableVertexAttribArray(program.attributes.a_endPos);
    gl.vertexAttribPointer(program.attributes.a_endPos, 2, gl.FLOAT, false, 36, 8);
    gl.vertexAttribDivisor(program.attributes.a_endPos, 1);

    gl.enableVertexAttribArray(program.attributes.a_color);
    gl.vertexAttribPointer(program.attributes.a_color, 3, gl.FLOAT, false, 36, 16);
    gl.vertexAttribDivisor(program.attributes.a_color, 1);

    gl.enableVertexAttribArray(program.attributes.a_thickness);
    gl.vertexAttribPointer(program.attributes.a_thickness, 1, gl.FLOAT, false, 36, 28);
    gl.vertexAttribDivisor(program.attributes.a_thickness, 1);

    gl.enableVertexAttribArray(program.attributes.a_selected);
    gl.vertexAttribPointer(program.attributes.a_selected, 1, gl.FLOAT, false, 36, 32);
    gl.vertexAttribDivisor(program.attributes.a_selected, 1);

    // Draw instanced
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, instanceCount);

    this.cleanupVertexAttribs(program);
    this.stats.drawCalls++;
    this.stats.vertexCount += instanceCount * 4;
  }

  /**
   * Render boundaries
   */
  private renderBoundaries(boundaries: Boundary[], viewMatrix: Float32Array, projectionMatrix: Float32Array, time: number): void {
    if (boundaries.length === 0 || !this.boundaryProgram) return;

    const gl = this.gl;
    const program = this.boundaryProgram;

    gl.useProgram(program.program);

    // Set uniforms
    gl.uniformMatrix3fv(program.uniforms.u_viewMatrix, false, viewMatrix);
    gl.uniformMatrix3fv(program.uniforms.u_projectionMatrix, false, projectionMatrix);
    gl.uniform1f(program.uniforms.u_time, time);
    gl.uniform1f(program.uniforms.u_dashSize, 10.0);

    // Generate boundary instance data
    const instanceData = this.bufferManager.generateBoundaryInstanceData(boundaries, this.selectedIds);

    // Set up vertex buffer
    const positionBuffer = this.bufferManager.createBuffer(
      'boundaryPosition',
      this.bufferManager.getBoundaryGeometry(),
      2
    );
    
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer.buffer);
    gl.enableVertexAttribArray(program.attributes.a_position);
    gl.vertexAttribPointer(program.attributes.a_position, 2, gl.FLOAT, false, 0, 0);

    // Set up instance data
    const instanceBuffer = this.bufferManager.createBuffer('boundaryInstances', instanceData, 8);
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer.buffer);

    // Instance attributes
    gl.enableVertexAttribArray(program.attributes.a_boundaryPos);
    gl.vertexAttribPointer(program.attributes.a_boundaryPos, 2, gl.FLOAT, false, 32, 0);
    gl.vertexAttribDivisor(program.attributes.a_boundaryPos, 1);

    gl.enableVertexAttribArray(program.attributes.a_boundarySize);
    gl.vertexAttribPointer(program.attributes.a_boundarySize, 2, gl.FLOAT, false, 32, 8);
    gl.vertexAttribDivisor(program.attributes.a_boundarySize, 1);

    gl.enableVertexAttribArray(program.attributes.a_color);
    gl.vertexAttribPointer(program.attributes.a_color, 3, gl.FLOAT, false, 32, 16);
    gl.vertexAttribDivisor(program.attributes.a_color, 1);

    gl.enableVertexAttribArray(program.attributes.a_selected);
    gl.vertexAttribPointer(program.attributes.a_selected, 1, gl.FLOAT, false, 32, 28);
    gl.vertexAttribDivisor(program.attributes.a_selected, 1);

    // Draw instanced
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, boundaries.length);

    this.cleanupVertexAttribs(program);
    this.stats.drawCalls++;
    this.stats.vertexCount += boundaries.length * 4;
  }

  /**
   * Clean up vertex attribute arrays
   */
  private cleanupVertexAttribs(program: ShaderProgram): void {
    const gl = this.gl;
    
    for (const attribute of Object.values(program.attributes)) {
      if (attribute >= 0) {
        gl.disableVertexAttribArray(attribute);
        gl.vertexAttribDivisor(attribute, 0);
      }
    }
  }

  /**
   * Get the camera instance
   */
  getCamera(): Camera {
    return this.camera;
  }

  /**
   * Set selected entities
   */
  setSelection(selectedIds: Set<string>): void {
    this.selectedIds = selectedIds;
  }

  /**
   * Get rendering statistics
   */
  getStats(): RenderStats {
    return { ...this.stats };
  }

  /**
   * Clean up WebGL resources
   */
  dispose(): void {
    const gl = this.gl;

    // Delete shader programs
    if (this.nodeProgram) gl.deleteProgram(this.nodeProgram.program);
    if (this.edgeProgram) gl.deleteProgram(this.edgeProgram.program);
    if (this.boundaryProgram) gl.deleteProgram(this.boundaryProgram.program);

    // Clean up buffers
    this.bufferManager.dispose();

    // Clean up text renderer
    this.textRenderer.dispose();

    // Cancel animation frame
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}