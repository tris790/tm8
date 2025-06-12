/**
 * Canvas lifecycle management hook
 */

import { useEffect, useState, RefObject } from 'react';
import { WebGLRenderer, Camera } from '@/core/canvas';

export interface UseCanvasResult {
  renderer: WebGLRenderer | null;
  camera: Camera;
  isReady: boolean;
  error: string | null;
}

export const useCanvas = (canvasRef: RefObject<HTMLCanvasElement>): UseCanvasResult => {
  const [renderer, setRenderer] = useState<WebGLRenderer | null>(null);
  const [camera] = useState(() => new Camera());
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      const newRenderer = new WebGLRenderer(canvasRef.current, camera);
      setRenderer(newRenderer);
      setIsReady(true);
      setError(null);

      // Setup resize observer
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          newRenderer.resize(width, height);
        }
      });

      resizeObserver.observe(canvasRef.current);

      // Cleanup function
      return () => {
        resizeObserver.disconnect();
        newRenderer.dispose();
        setRenderer(null);
        setIsReady(false);
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize WebGL renderer';
      setError(errorMessage);
      setIsReady(false);
      console.error('Canvas initialization error:', err);
    }
  }, [canvasRef, camera]);

  return { renderer, camera, isReady, error };
};