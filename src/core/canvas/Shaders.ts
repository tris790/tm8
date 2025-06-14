/**
 * GLSL shader programs for WebGL rendering
 */

export interface ShaderSource {
  vertex: string;
  fragment: string;
}

/**
 * Node rendering shaders with instanced rendering support
 */
export const nodeShaders: ShaderSource = {
  vertex: `
    attribute vec2 a_position;
    attribute vec2 a_instancePosition;
    attribute float a_instanceType;
    attribute vec3 a_instanceColor;
    attribute float a_instanceScale;
    attribute float a_selected;

    uniform mat3 u_viewMatrix;
    uniform mat3 u_projectionMatrix;
    uniform float u_pixelRatio;

    varying vec3 v_color;
    varying float v_nodeType;
    varying float v_selected;
    varying vec2 v_localPos;

    void main() {
      v_color = a_instanceColor;
      v_nodeType = a_instanceType;
      v_selected = a_selected;
      v_localPos = a_position;

      // Scale the base shape by instance scale (make nodes larger for visibility)
      vec2 scaledPos = a_position * a_instanceScale * 20.0;
      
      // Translate to instance position
      vec2 worldPos = scaledPos + a_instancePosition;
      
      // Apply camera transforms
      vec3 viewPos = u_viewMatrix * vec3(worldPos, 1.0);
      vec3 clipPos = u_projectionMatrix * viewPos;
      
      gl_Position = vec4(clipPos.xy, 0.0, 1.0);
    }
  `,
  fragment: `
    precision highp float;

    varying vec3 v_color;
    varying float v_nodeType;
    varying float v_selected;
    varying vec2 v_localPos;

    uniform float u_time;

    // Node type constants
    const float PROCESS = 0.0;
    const float DATASTORE = 1.0;
    const float EXTERNAL_ENTITY = 2.0;
    const float SERVICE = 3.0;

    float roundedRect(vec2 pos, vec2 size, float radius) {
      vec2 d = abs(pos) - size + radius;
      return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - radius;
    }

    float circle(vec2 pos, float radius) {
      return length(pos) - radius;
    }

    float diamond(vec2 pos, float size) {
      pos = abs(pos);
      return max(pos.x + pos.y, 0.0) - size;
    }

    float cylinder(vec2 pos, vec2 size) {
      float top = abs(pos.y) - size.y;
      float bottom = length(vec2(max(abs(pos.x) - size.x, 0.0), max(top, 0.0))) + min(top, 0.0);
      return bottom;
    }

    void main() {
      vec2 pos = v_localPos;
      float alpha = 1.0;
      
      // Shape based on node type
      float dist = 0.0;
      if (v_nodeType == PROCESS) {
        // Rounded rectangle for process
        dist = roundedRect(pos, vec2(0.8, 0.6), 0.1);
      } else if (v_nodeType == DATASTORE) {
        // Cylinder-like shape for datastore
        dist = cylinder(pos, vec2(0.7, 0.4));
      } else if (v_nodeType == EXTERNAL_ENTITY) {
        // Diamond for external entity
        dist = diamond(pos, 0.8);
      } else if (v_nodeType == SERVICE) {
        // Circle for service
        dist = circle(pos, 0.7);
      }

      // Anti-aliasing
      alpha = 1.0 - smoothstep(-0.02, 0.02, dist);
      
      // Selection highlight (simplified to match working edge/boundary approach)
      if (v_selected > 0.5) {
        float pulse = sin(u_time * 4.0) * 0.3 + 0.7;
        gl_FragColor = vec4(0.314, 0.784, 0.471, alpha * pulse); // emerald green
        return;
      }

      gl_FragColor = vec4(v_color, alpha);
      
      // Discard transparent pixels
      if (alpha < 0.01) {
        discard;
      }
    }
  `
};

/**
 * Edge rendering shaders with anti-aliased lines
 */
export const edgeShaders: ShaderSource = {
  vertex: `
    attribute vec2 a_position;
    attribute vec2 a_startPos;
    attribute vec2 a_endPos;
    attribute vec3 a_color;
    attribute float a_thickness;
    attribute float a_selected;

    uniform mat3 u_viewMatrix;
    uniform mat3 u_projectionMatrix;

    varying vec3 v_color;
    varying float v_selected;
    varying float v_thickness;
    varying vec2 v_localPos;

    void main() {
      v_color = a_color;
      v_selected = a_selected;
      v_thickness = a_thickness;
      v_localPos = a_position;

      // Calculate line direction and normal
      vec2 direction = normalize(a_endPos - a_startPos);
      vec2 normal = vec2(-direction.y, direction.x);
      
      // Expand line to quad
      vec2 offset = normal * a_thickness * a_position.y;
      vec2 worldPos = mix(a_startPos, a_endPos, a_position.x) + offset;
      
      // Apply camera transforms
      vec3 viewPos = u_viewMatrix * vec3(worldPos, 1.0);
      vec3 clipPos = u_projectionMatrix * viewPos;
      
      gl_Position = vec4(clipPos.xy, 0.0, 1.0);
    }
  `,
  fragment: `
    precision highp float;

    varying vec3 v_color;
    varying float v_selected;
    varying float v_thickness;
    varying vec2 v_localPos;

    uniform float u_time;

    void main() {
      // Anti-aliased line
      float alpha = 1.0 - smoothstep(0.7, 1.0, abs(v_localPos.y));
      
      // Selection highlight
      if (v_selected > 0.5) {
        float pulse = sin(u_time * 4.0) * 0.3 + 0.7;
        gl_FragColor = vec4(0.314, 0.784, 0.471, alpha * pulse); // emerald green
      } else {
        gl_FragColor = vec4(v_color, alpha);
      }
      
      if (alpha < 0.01) {
        discard;
      }
    }
  `
};

/**
 * Boundary rendering shaders with dashed lines
 */
export const boundaryShaders: ShaderSource = {
  vertex: `
    attribute vec2 a_position;
    attribute vec2 a_boundaryPos;
    attribute vec2 a_boundarySize;
    attribute vec3 a_color;
    attribute float a_selected;

    uniform mat3 u_viewMatrix;
    uniform mat3 u_projectionMatrix;

    varying vec3 v_color;
    varying float v_selected;
    varying vec2 v_localPos;
    varying vec2 v_worldPos;

    void main() {
      v_color = a_color;
      v_selected = a_selected;
      v_localPos = a_position;
      
      // Position within boundary rectangle
      vec2 worldPos = a_boundaryPos + a_position * a_boundarySize;
      v_worldPos = worldPos;
      
      // Apply camera transforms
      vec3 viewPos = u_viewMatrix * vec3(worldPos, 1.0);
      vec3 clipPos = u_projectionMatrix * viewPos;
      
      gl_Position = vec4(clipPos.xy, 0.0, 1.0);
    }
  `,
  fragment: `
    precision highp float;

    varying vec3 v_color;
    varying float v_selected;
    varying vec2 v_localPos;
    varying vec2 v_worldPos;

    uniform float u_time;
    uniform float u_dashSize;

    void main() {
      // Calculate distance from edge for dashed border
      vec2 border = min(v_localPos, 1.0 - v_localPos);
      float borderDist = min(border.x, border.y);
      
      // Dashed pattern
      float dashPattern = mod(v_worldPos.x + v_worldPos.y + u_time * 20.0, u_dashSize * 2.0);
      float dash = step(u_dashSize, dashPattern);
      
      // Border thickness
      float borderWidth = 0.02;
      float alpha = (1.0 - smoothstep(borderWidth - 0.01, borderWidth, borderDist)) * dash;
      
      // Selection highlight
      if (v_selected > 0.5) {
        float pulse = sin(u_time * 4.0) * 0.3 + 0.7;
        alpha *= pulse;
        gl_FragColor = vec4(0.314, 0.784, 0.471, alpha); // emerald green
      } else {
        gl_FragColor = vec4(v_color, alpha);
      }
      
      if (alpha < 0.01) {
        discard;
      }
    }
  `
};

/**
 * Selection rectangle rendering shaders for multi-select operations
 */
export const selectionRectShaders: ShaderSource = {
  vertex: `
    attribute vec2 a_position;
    attribute vec2 a_rectPos;
    attribute vec2 a_rectSize;

    uniform mat3 u_viewMatrix;
    uniform mat3 u_projectionMatrix;

    varying vec2 v_localPos;
    varying vec2 v_rectSize;

    void main() {
      v_localPos = a_position;
      v_rectSize = a_rectSize;
      
      // Position within selection rectangle
      vec2 worldPos = a_rectPos + a_position * a_rectSize;
      
      // Apply camera transforms
      vec3 viewPos = u_viewMatrix * vec3(worldPos, 1.0);
      vec3 clipPos = u_projectionMatrix * viewPos;
      
      gl_Position = vec4(clipPos.xy, 0.0, 1.0);
    }
  `,
  fragment: `
    precision highp float;

    varying vec2 v_localPos;
    varying vec2 v_rectSize;

    uniform float u_time;

    void main() {
      // Calculate distance from edge for border
      vec2 border = min(v_localPos, 1.0 - v_localPos);
      float borderDist = min(border.x, border.y);
      
      // Border thickness (adaptive to rectangle size)
      float borderWidth = max(0.005, min(0.02, min(v_rectSize.x, v_rectSize.y) * 0.01));
      
      // Create dashed border effect
      float dashLength = max(10.0, min(v_rectSize.x, v_rectSize.y) * 0.1);
      vec2 worldCoord = v_localPos * v_rectSize;
      float dashPattern = mod((worldCoord.x + worldCoord.y) * 2.0 + u_time * 100.0, dashLength * 2.0);
      float dash = step(dashLength, dashPattern);
      
      // Border alpha with smooth anti-aliasing
      float borderAlpha = (1.0 - smoothstep(borderWidth - 0.002, borderWidth + 0.002, borderDist)) * dash;
      
      // Fill alpha (very subtle)
      float fillAlpha = 0.05;
      
      // Combine border and fill
      float totalAlpha = max(borderAlpha * 0.8, fillAlpha);
      
      // Animated selection color (blue-500 with some transparency)
      float pulse = sin(u_time * 3.0) * 0.2 + 0.8;
      vec3 selectionColor = vec3(0.239, 0.525, 0.976); // blue-500
      
      gl_FragColor = vec4(selectionColor, totalAlpha * pulse);
      
      if (totalAlpha < 0.01) {
        discard;
      }
    }
  `
};

/**
 * Utility function to compile a shader
 */
export function compileShader(gl: WebGL2RenderingContext, source: string, type: number): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Failed to create shader');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compilation error: ${error}`);
  }

  return shader;
}

/**
 * Utility function to create a shader program
 */
export function createProgram(gl: WebGL2RenderingContext, shaderSource: ShaderSource): WebGLProgram {
  const vertexShader = compileShader(gl, shaderSource.vertex, gl.VERTEX_SHADER);
  const fragmentShader = compileShader(gl, shaderSource.fragment, gl.FRAGMENT_SHADER);

  const program = gl.createProgram();
  if (!program) {
    throw new Error('Failed to create shader program');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error(`Program linking error: ${error}`);
  }

  // Clean up shaders (they're now part of the program)
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}