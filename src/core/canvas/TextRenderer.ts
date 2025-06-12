/**
 * WebGL-based text rendering using canvas 2D for texture generation
 */

import { Node as GraphNode, Edge, Boundary } from '../types';
import { Camera } from './Camera';

interface TextInfo {
  nodeId: string;
  text: string;
  x: number;
  y: number;
  scale: number;
  selected: boolean;
}

export class TextRenderer {
  private gl: WebGL2RenderingContext;
  private camera: Camera;
  private canvas2D: HTMLCanvasElement;
  private ctx2D: CanvasRenderingContext2D;
  private textTexture: WebGLTexture | null = null;
  private textProgram: WebGLProgram | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private textureBuffer: WebGLBuffer | null = null;
  private instanceBuffer: WebGLBuffer | null = null;
  
  // Text rendering parameters
  private readonly FONT_SIZE = 32;
  private readonly TEXTURE_SIZE = 2048;
  private readonly CHARACTER_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .-_()[]{}';
  private characterMap: Map<string, { x: number; y: number; width: number; height: number }> = new Map();
  
  constructor(gl: WebGL2RenderingContext, camera: Camera) {
    this.gl = gl;
    this.camera = camera;
    
    // Create 2D canvas for text rendering
    this.canvas2D = document.createElement('canvas');
    this.canvas2D.width = this.TEXTURE_SIZE;
    this.canvas2D.height = this.TEXTURE_SIZE;
    this.ctx2D = this.canvas2D.getContext('2d')!;
    
    this.initializeTextSystem();
  }
  
  private initializeTextSystem(): void {
    this.createTextTexture();
    this.createTextShaders();
    this.createTextBuffers();
  }
  
  private createTextTexture(): void {
    const gl = this.gl;
    const ctx = this.ctx2D;
    
    // Configure 2D context for text rendering
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.TEXTURE_SIZE, this.TEXTURE_SIZE);
    ctx.fillStyle = '#ffffff';
    ctx.font = `${this.FONT_SIZE}px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Render character set and build character map
    let x = 0;
    let y = 0;
    const lineHeight = this.FONT_SIZE + 4;
    
    for (const char of this.CHARACTER_SET) {
      const metrics = ctx.measureText(char);
      const charWidth = Math.ceil(metrics.width);
      const charHeight = lineHeight;
      
      // Check if we need to wrap to next line
      if (x + charWidth > this.TEXTURE_SIZE) {
        x = 0;
        y += lineHeight;
      }
      
      // Render character
      ctx.fillText(char, x, y);
      
      // Store character position in texture
      this.characterMap.set(char, {
        x: x / this.TEXTURE_SIZE,
        y: y / this.TEXTURE_SIZE,
        width: charWidth / this.TEXTURE_SIZE,
        height: charHeight / this.TEXTURE_SIZE
      });
      
      x += charWidth + 2; // Small padding
    }
    
    // Create WebGL texture
    this.textTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.textTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
  }
  
  private createTextShaders(): void {
    const gl = this.gl;
    
    const vertexShaderSource = `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      in vec2 a_instancePosition;
      in vec2 a_instanceTexCoord;
      in vec2 a_instanceTexSize;
      in float a_instanceScale;
      in float a_selected;
      
      uniform mat3 u_viewMatrix;
      uniform mat3 u_projectionMatrix;
      uniform float u_time;
      
      out vec2 v_texCoord;
      out float v_selected;
      out float v_alpha;
      
      void main() {
        // Calculate character quad position - fixed size
        vec2 charSize = vec2(3.0, 4.0); // Fixed character size in world units
        vec2 scaledPos = a_position * charSize * a_instanceScale;
        vec2 worldPos = a_instancePosition + scaledPos;
        
        // Apply camera transforms
        vec3 viewPos = u_viewMatrix * vec3(worldPos, 1.0);
        vec3 projPos = u_projectionMatrix * vec3(viewPos.xy, 1.0);
        
        gl_Position = vec4(projPos.xy, 0.0, 1.0);
        
        // Pass texture coordinates
        v_texCoord = a_instanceTexCoord + a_texCoord * a_instanceTexSize;
        v_selected = a_selected;
        
        // Show text at all zoom levels with constant opacity
        v_alpha = 1.0;
      }
    `;
    
    const fragmentShaderSource = `#version 300 es
      precision highp float;
      
      in vec2 v_texCoord;
      in float v_selected;
      in float v_alpha;
      
      uniform sampler2D u_textTexture;
      uniform float u_time;
      
      out vec4 fragColor;
      
      void main() {
        // Sample text texture
        vec4 texColor = texture(u_textTexture, v_texCoord);
        
        // Base text color
        vec3 textColor = vec3(0.94, 0.96, 0.98); // slate-100
        
        // Selection highlighting
        if (v_selected > 0.5) {
          float pulse = sin(u_time * 3.0) * 0.3 + 0.7;
          textColor = mix(textColor, vec3(0.38, 0.65, 1.0), 0.4 * pulse); // blue-400
        }
        
        // Use texture alpha as text mask
        float alpha = texColor.r * v_alpha * 0.9;
        
        fragColor = vec4(textColor, alpha);
      }
    `;
    
    // Compile shaders
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    // Create program
    this.textProgram = gl.createProgram()!;
    gl.attachShader(this.textProgram, vertexShader);
    gl.attachShader(this.textProgram, fragmentShader);
    gl.linkProgram(this.textProgram);
    
    if (!gl.getProgramParameter(this.textProgram, gl.LINK_STATUS)) {
      throw new Error('Text shader program link error: ' + gl.getProgramInfoLog(this.textProgram));
    }
    
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
  }
  
  private compileShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error('Shader compile error: ' + info);
    }
    
    return shader;
  }
  
  private createTextBuffers(): void {
    const gl = this.gl;
    
    // Quad vertices for text rendering
    const vertices = new Float32Array([
      -1, -1,  // bottom-left
       1, -1,  // bottom-right
      -1,  1,  // top-left
       1,  1   // top-right
    ]);
    
    // Texture coordinates
    const texCoords = new Float32Array([
      0, 1,  // bottom-left
      1, 1,  // bottom-right
      0, 0,  // top-left
      1, 0   // top-right
    ]);
    
    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    this.textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
  }
  
  public renderNodeLabels(nodes: GraphNode[], selectedIds: Set<string>): void {
    // Legacy method for backward compatibility
    this.renderEntityLabels(nodes, [], [], selectedIds);
  }
  
  public renderEntityLabels(nodes: GraphNode[], edges: Edge[], boundaries: Boundary[], selectedIds: Set<string>): void {
    if (!this.textProgram || !this.textTexture) return;
    if (nodes.length === 0 && edges.length === 0 && boundaries.length === 0) return;
    
    const gl = this.gl;
    
    // Check if text should be visible at current zoom level  
    const zoom = this.camera.zoom;
    if (zoom < 0.002) return; // Show text at much lower zoom levels
    
    // Generate instance data for all entities
    const instanceData: number[] = [];
    
    // Add node labels (centered)
    for (const node of nodes) {
      if (!node.name) continue;
      
      const text = node.name.substring(0, 20);
      const isSelected = selectedIds.has(node.id);
      const charSpacing = 4.5;
      let charX = node.position.x - (text.length * charSpacing * 0.5);
      
      for (const char of text) {
        const charInfo = this.characterMap.get(char);
        if (!charInfo) continue;
        
        instanceData.push(
          charX,
          node.position.y + 12,
          charInfo.x, charInfo.y,
          charInfo.width, charInfo.height,
          1.0,
          isSelected ? 1.0 : 0.0
        );
        
        charX += charSpacing;
      }
    }
    
    // Add boundary labels (top-left corner outside boundary)
    for (const boundary of boundaries) {
      if (!boundary.name) continue;
      
      const text = boundary.name.substring(0, 20);
      const isSelected = selectedIds.has(boundary.id);
      const charSpacing = 3.5; // Smaller spacing for boundaries
      
      // boundary.position is the BOTTOM-LEFT corner based on shader geometry
      const boundaryLeft = boundary.position.x;
      const boundaryTop = boundary.position.y + boundary.bounds.height;
      
      // Position text just outside the top-left corner
      const startX = boundaryLeft;
      const startY = boundaryTop + 6; // Just above the boundary
      let charX = startX;
      
      for (const char of text) {
        const charInfo = this.characterMap.get(char);
        if (!charInfo) continue;
        
        instanceData.push(
          charX,
          startY,
          charInfo.x, charInfo.y,
          charInfo.width, charInfo.height,
          0.7, // Smaller for boundaries
          isSelected ? 1.0 : 0.0
        );
        
        charX += charSpacing;
      }
    }
    
    // Add edge labels (centered on midpoint)
    for (const edge of edges) {
      const edgeName = edge.properties?.name || edge.type;
      if (!edgeName) continue;
      
      // Find source and first target nodes
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.targets[0]);
      if (!sourceNode || !targetNode) continue;
      
      const text = String(edgeName).substring(0, 15); // Shorter for edges
      const isSelected = selectedIds.has(edge.id);
      const charSpacing = 3.5; // Smaller spacing for edges
      
      // Calculate midpoint
      const midX = (sourceNode.position.x + targetNode.position.x) / 2;
      const midY = (sourceNode.position.y + targetNode.position.y) / 2;
      let charX = midX - (text.length * charSpacing * 0.5);
      
      for (const char of text) {
        const charInfo = this.characterMap.get(char);
        if (!charInfo) continue;
        
        instanceData.push(
          charX,
          midY - 5, // Slightly offset from edge line
          charInfo.x, charInfo.y,
          charInfo.width, charInfo.height,
          0.7, // Smaller scale for edges
          isSelected ? 1.0 : 0.0
        );
        
        charX += charSpacing;
      }
    }
    
    if (instanceData.length === 0) return;
    
    // Upload instance data
    if (!this.instanceBuffer) {
      this.instanceBuffer = gl.createBuffer();
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(instanceData), gl.DYNAMIC_DRAW);
    
    // Use text shader program
    gl.useProgram(this.textProgram);
    
    // Ensure proper blending for text
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // Set uniforms
    const viewMatrix = this.camera.getViewMatrix();
    const projectionMatrix = this.camera.getProjectionMatrix();
    const time = Date.now() / 1000.0;
    
    const viewMatrixLoc = gl.getUniformLocation(this.textProgram, 'u_viewMatrix');
    const projMatrixLoc = gl.getUniformLocation(this.textProgram, 'u_projectionMatrix');
    const timeLoc = gl.getUniformLocation(this.textProgram, 'u_time');
    const textureLoc = gl.getUniformLocation(this.textProgram, 'u_textTexture');
    
    gl.uniformMatrix3fv(viewMatrixLoc, false, viewMatrix);
    gl.uniformMatrix3fv(projMatrixLoc, false, projectionMatrix);
    gl.uniform1f(timeLoc, time);
    gl.uniform1i(textureLoc, 0);
    
    // Bind texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.textTexture);
    
    // Set up vertex attributes
    const positionLoc = gl.getAttribLocation(this.textProgram, 'a_position');
    const texCoordLoc = gl.getAttribLocation(this.textProgram, 'a_texCoord');
    const instancePosLoc = gl.getAttribLocation(this.textProgram, 'a_instancePosition');
    const instanceTexCoordLoc = gl.getAttribLocation(this.textProgram, 'a_instanceTexCoord');
    const instanceTexSizeLoc = gl.getAttribLocation(this.textProgram, 'a_instanceTexSize');
    const instanceScaleLoc = gl.getAttribLocation(this.textProgram, 'a_instanceScale');
    const selectedLoc = gl.getAttribLocation(this.textProgram, 'a_selected');
    
    // Vertex positions
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    
    // Texture coordinates
    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    
    // Instance data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    
    const stride = 8 * 4; // 8 floats * 4 bytes
    
    gl.enableVertexAttribArray(instancePosLoc);
    gl.vertexAttribPointer(instancePosLoc, 2, gl.FLOAT, false, stride, 0);
    gl.vertexAttribDivisor(instancePosLoc, 1);
    
    gl.enableVertexAttribArray(instanceTexCoordLoc);
    gl.vertexAttribPointer(instanceTexCoordLoc, 2, gl.FLOAT, false, stride, 8);
    gl.vertexAttribDivisor(instanceTexCoordLoc, 1);
    
    gl.enableVertexAttribArray(instanceTexSizeLoc);
    gl.vertexAttribPointer(instanceTexSizeLoc, 2, gl.FLOAT, false, stride, 16);
    gl.vertexAttribDivisor(instanceTexSizeLoc, 1);
    
    gl.enableVertexAttribArray(instanceScaleLoc);
    gl.vertexAttribPointer(instanceScaleLoc, 1, gl.FLOAT, false, stride, 24);
    gl.vertexAttribDivisor(instanceScaleLoc, 1);
    
    gl.enableVertexAttribArray(selectedLoc);
    gl.vertexAttribPointer(selectedLoc, 1, gl.FLOAT, false, stride, 28);
    gl.vertexAttribDivisor(selectedLoc, 1);
    
    // Render
    const instanceCount = instanceData.length / 8;
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, instanceCount);
    
    // Cleanup
    gl.disableVertexAttribArray(positionLoc);
    gl.disableVertexAttribArray(texCoordLoc);
    gl.disableVertexAttribArray(instancePosLoc);
    gl.disableVertexAttribArray(instanceTexCoordLoc);
    gl.disableVertexAttribArray(instanceTexSizeLoc);
    gl.disableVertexAttribArray(instanceScaleLoc);
    gl.disableVertexAttribArray(selectedLoc);
    
    gl.vertexAttribDivisor(instancePosLoc, 0);
    gl.vertexAttribDivisor(instanceTexCoordLoc, 0);
    gl.vertexAttribDivisor(instanceTexSizeLoc, 0);
    gl.vertexAttribDivisor(instanceScaleLoc, 0);
    gl.vertexAttribDivisor(selectedLoc, 0);
  }
  
  private calculateTextWidth(text: string): number {
    let width = 0;
    for (const char of text) {
      const charInfo = this.characterMap.get(char);
      if (charInfo) {
        width += charInfo.width * this.TEXTURE_SIZE;
      }
    }
    return width;
  }
  
  public dispose(): void {
    const gl = this.gl;
    
    if (this.textProgram) gl.deleteProgram(this.textProgram);
    if (this.textTexture) gl.deleteTexture(this.textTexture);
    if (this.vertexBuffer) gl.deleteBuffer(this.vertexBuffer);
    if (this.textureBuffer) gl.deleteBuffer(this.textureBuffer);
    if (this.instanceBuffer) gl.deleteBuffer(this.instanceBuffer);
  }
}