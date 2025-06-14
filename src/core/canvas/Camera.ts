/**
 * Camera system for 2D viewport transforms
 */

import { CameraTransform, ViewportBounds } from '../types';

export class Camera {
  private _zoom: number = 1.0;
  private _panX: number = 0.0;
  private _panY: number = 0.0;
  private _viewMatrix: Float32Array = new Float32Array(9);
  private _projectionMatrix: Float32Array = new Float32Array(9);
  private _isDirty: boolean = true;
  private _canvasWidth: number = 1;
  private _canvasHeight: number = 1;

  // Zoom constraints
  private readonly MIN_ZOOM = 0.001;
  private readonly MAX_ZOOM = 100.0;

  // Debug: unique instance ID
  public _instanceId: string = Math.random().toString(36).substr(2, 9);
  private lastPanLogTime: number = 0;

  // Animation state
  private _isAnimating: boolean = false;
  private _animationStartTime: number = 0;
  private _animationDuration: number = 500; // ms
  private _startZoom: number = 1;
  private _startPanX: number = 0;
  private _startPanY: number = 0;
  private _targetZoom: number = 1;
  private _targetPanX: number = 0;
  private _targetPanY: number = 0;
  private _onAnimationUpdate?: () => void;

  constructor() {
    // Initialize with very zoomed out view and center on demo graph
    this._zoom = 0.002; // Start very zoomed out
    this._panX = 400;  // Center on demo graph (nodes at 100-700)
    this._panY = 200;  // Center on demo graph (nodes at 50-400)
    this.updateMatrices();
  }

  /**
   * Set canvas dimensions for proper aspect ratio
   */
  setCanvasSize(width: number, height: number): void {
    this._canvasWidth = width;
    this._canvasHeight = height;
    this._isDirty = true;
  }

  /**
   * Get current zoom level
   */
  get zoom(): number {
    return this._zoom;
  }

  /**
   * Set zoom level with constraints
   */
  set zoom(value: number) {
    const newZoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, value));
    if (newZoom !== this._zoom) {
      this._zoom = newZoom;
      this._isDirty = true;
    }
  }

  /**
   * Get pan X offset
   */
  get panX(): number {
    return this._panX;
  }

  /**
   * Set pan X offset
   */
  set panX(value: number) {
    if (value !== this._panX) {
      this._panX = value;
      this._isDirty = true;
    }
  }

  /**
   * Get pan Y offset
   */
  get panY(): number {
    return this._panY;
  }

  /**
   * Set pan Y offset
   */
  set panY(value: number) {
    if (value !== this._panY) {
      this._panY = value;
      this._isDirty = true;
    }
  }

  /**
   * Pan by delta values
   */
  pan(deltaX: number, deltaY: number): void {
    const oldPanX = this._panX;
    const oldPanY = this._panY;
    this._panX += deltaX;
    this._panY += deltaY;
    this._isDirty = true;
  }

  /**
   * Zoom by factor around a specific point
   */
  zoomAt(factor: number, centerX: number, centerY: number): void {
    const oldZoom = this._zoom;
    this.zoom = oldZoom * factor;
    
    if (this._zoom !== oldZoom) {
      // Adjust pan to zoom around the center point
      const zoomRatio = this._zoom / oldZoom;
      this._panX = centerX + (this._panX - centerX) * zoomRatio;
      this._panY = centerY + (this._panY - centerY) * zoomRatio;
      this._isDirty = true;
    }
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    // Convert screen coordinates to normalized device coordinates (-1 to 1)
    const ndcX = (screenX / this._canvasWidth) * 2 - 1;
    const ndcY = -(screenY / this._canvasHeight) * 2 + 1; // Flip Y

    // Apply inverse camera transform
    const aspect = this._canvasWidth / this._canvasHeight;
    const worldX = (ndcX * aspect) / this._zoom + this._panX;
    const worldY = ndcY / this._zoom + this._panY;

    return { x: worldX, y: worldY };
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    // Apply camera transform
    const viewX = (worldX - this._panX) * this._zoom;
    const viewY = (worldY - this._panY) * this._zoom;

    // Convert to screen coordinates
    const aspect = this._canvasWidth / this._canvasHeight;
    const ndcX = viewX / aspect;
    const ndcY = viewY;
    
    const screenX = ((ndcX + 1) / 2) * this._canvasWidth;
    const screenY = ((-ndcY + 1) / 2) * this._canvasHeight;

    return { x: screenX, y: screenY };
  }

  /**
   * Get the current viewport bounds in world coordinates
   */
  getViewportBounds(): ViewportBounds {
    const aspect = this._canvasWidth / this._canvasHeight;
    const halfWidth = aspect / this._zoom;
    const halfHeight = 1 / this._zoom;

    return {
      left: this._panX - halfWidth,
      right: this._panX + halfWidth,
      top: this._panY + halfHeight,
      bottom: this._panY - halfHeight
    };
  }

  /**
   * Get the view matrix for rendering
   */
  getViewMatrix(): Float32Array {
    if (this._isDirty) {
      this.updateMatrices();
    }
    return this._viewMatrix;
  }

  /**
   * Get the projection matrix for rendering
   */
  getProjectionMatrix(): Float32Array {
    if (this._isDirty) {
      this.updateMatrices();
    }
    return this._projectionMatrix;
  }

  /**
   * Get complete camera transform
   */
  getTransform(): CameraTransform {
    if (this._isDirty) {
      this.updateMatrices();
    }

    return {
      zoom: this._zoom,
      panX: this._panX,
      panY: this._panY,
      viewMatrix: this._viewMatrix,
      projectionMatrix: this._projectionMatrix
    };
  }

  /**
   * Fit the camera to show a specific bounding box
   */
  fitBounds(left: number, top: number, right: number, bottom: number, padding: number = 0.1): void {
    const boundsWidth = right - left;
    const boundsHeight = top - bottom;
    const boundsAspect = boundsWidth / boundsHeight;
    const canvasAspect = this._canvasWidth / this._canvasHeight;

    // Calculate zoom to fit bounds
    let fitZoom: number;
    if (boundsAspect > canvasAspect) {
      // Fit to width
      fitZoom = (canvasAspect / boundsWidth) * (1 - padding);
    } else {
      // Fit to height
      fitZoom = (1 / boundsHeight) * (1 - padding);
    }

    // Center on bounds
    this._zoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, fitZoom));
    this._panX = (left + right) / 2;
    this._panY = (top + bottom) / 2;
    this._isDirty = true;
  }

  /**
   * Reset camera to default position
   */
  reset(): void {
    this._zoom = 0.002;
    this._panX = 400;  // Center on demo graph
    this._panY = 200;  // Center on demo graph
    this._isDirty = true;
  }

  /**
   * Easing function for smooth animations
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Stop any current animation
   */
  stopAnimation(): void {
    this._isAnimating = false;
  }

  /**
   * Check if camera is currently animating
   */
  get isAnimating(): boolean {
    return this._isAnimating;
  }

  /**
   * Set animation update callback (called by WebGL renderer)
   */
  setAnimationUpdateCallback(callback: () => void): void {
    this._onAnimationUpdate = callback;
  }

  /**
   * Animate camera to a specific position and zoom level
   */
  animateTo(targetPanX: number, targetPanY: number, targetZoom?: number, duration: number = 500): void {
    this.stopAnimation();

    this._startZoom = this._zoom;
    this._startPanX = this._panX;
    this._startPanY = this._panY;
    this._targetZoom = targetZoom !== undefined ? Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, targetZoom)) : this._zoom;
    this._targetPanX = targetPanX;
    this._targetPanY = targetPanY;
    this._animationDuration = duration;
    this._animationStartTime = performance.now();
    this._isAnimating = true;
  }

  /**
   * Animate camera to focus on a specific world position
   */
  animateToPosition(worldX: number, worldY: number, targetZoom?: number, duration: number = 500): void {
    const zoom = targetZoom !== undefined ? targetZoom : Math.max(this._zoom, 0.5);
    this.animateTo(worldX, worldY, zoom, duration);
  }

  /**
   * Update animation (called by WebGL renderer each frame)
   */
  updateAnimation(currentTime: number): boolean {
    if (!this._isAnimating) return false;

    const elapsed = currentTime - this._animationStartTime;
    const progress = Math.min(elapsed / this._animationDuration, 1);
    const easedProgress = this.easeInOutCubic(progress);

    // Interpolate values
    this._zoom = this._startZoom + (this._targetZoom - this._startZoom) * easedProgress;
    this._panX = this._startPanX + (this._targetPanX - this._startPanX) * easedProgress;
    this._panY = this._startPanY + (this._targetPanY - this._startPanY) * easedProgress;
    this._isDirty = true;

    if (progress >= 1) {
      this._isAnimating = false;
    }

    // Trigger re-render if callback is set
    if (this._onAnimationUpdate) {
      this._onAnimationUpdate();
    }

    return this._isAnimating;
  };

  /**
   * Update transformation matrices
   */
  private updateMatrices(): void {
    // View matrix (camera transform) - column-major order
    this._viewMatrix[0] = this._zoom;  // scale X
    this._viewMatrix[1] = 0;
    this._viewMatrix[2] = 0;
    this._viewMatrix[3] = 0;
    this._viewMatrix[4] = this._zoom;  // scale Y
    this._viewMatrix[5] = 0;
    this._viewMatrix[6] = -this._panX * this._zoom;  // translate X
    this._viewMatrix[7] = -this._panY * this._zoom;  // translate Y
    this._viewMatrix[8] = 1;

    // Projection matrix (aspect ratio correction)
    const aspect = this._canvasWidth / this._canvasHeight;
    this._projectionMatrix[0] = 1 / aspect;  // scale X to correct aspect
    this._projectionMatrix[1] = 0;
    this._projectionMatrix[2] = 0;
    this._projectionMatrix[3] = 0;
    this._projectionMatrix[4] = 1;  // scale Y
    this._projectionMatrix[5] = 0;
    this._projectionMatrix[6] = 0;
    this._projectionMatrix[7] = 0;
    this._projectionMatrix[8] = 1;

    this._isDirty = false;
  }
}