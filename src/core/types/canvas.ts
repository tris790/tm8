/**
 * Canvas and rendering type definitions for WebGL-based rendering
 */

import { CanvasMode } from './enums';

export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  selection: string[];
  mode: CanvasMode;
}

export interface ViewportBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface RenderContext {
  gl: WebGL2RenderingContext;
  viewport: ViewportBounds;
  canvasState: CanvasState;
}

/**
 * Camera transforms for 2D rendering
 */
export interface CameraTransform {
  zoom: number;
  panX: number;
  panY: number;
  viewMatrix: Float32Array;
  projectionMatrix: Float32Array;
}

/**
 * Rendering statistics for performance monitoring
 */
export interface RenderStats {
  frameTime: number;
  drawCalls: number;
  vertexCount: number;
  visibleNodes: number;
  visibleEdges: number;
}

/**
 * WebGL buffer management
 */
export interface BufferInfo {
  buffer: WebGLBuffer;
  attributeSize: number;
  count: number;
  isDirty: boolean;
}

/**
 * Shader program information
 */
export interface ShaderProgram {
  program: WebGLProgram;
  attributes: Record<string, number>;
  uniforms: Record<string, WebGLUniformLocation>;
}

/**
 * Interaction event types
 */
export interface MouseEvent {
  x: number;
  y: number;
  worldX: number;
  worldY: number;
  button: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
}

export interface WheelEvent extends MouseEvent {
  deltaY: number;
}

export interface DragEvent extends MouseEvent {
  startX: number;
  startY: number;
  startWorldX: number;
  startWorldY: number;
  deltaX: number;
  deltaY: number;
  worldDeltaX: number;
  worldDeltaY: number;
}