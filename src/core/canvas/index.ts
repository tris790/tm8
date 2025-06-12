/**
 * Canvas engine exports
 */

export { WebGLRenderer } from './WebGLRenderer';
export { Camera } from './Camera';
export { BufferManager } from './BufferManager';
export { InteractionHandler } from './Interaction';
export type { InteractionCallbacks } from './Interaction';
export { 
  nodeShaders, 
  edgeShaders, 
  boundaryShaders, 
  createProgram, 
  compileShader 
} from './Shaders';
export type { ShaderSource } from './Shaders';