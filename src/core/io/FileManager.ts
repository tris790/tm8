/**
 * Core file operations manager for TM8 threat modeling application
 * Handles import/export operations for TM7, JSON, and PNG formats
 */

import type { Graph } from '../types/graph';
import { TM7Parser, TM7Exporter, TM7ParseError, TM7ExportError } from '../parser';

export interface FileOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class FileManagerError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'FileManagerError';
  }
}

export class FileManager {
  private readonly parser: TM7Parser;
  private readonly exporter: TM7Exporter;
  
  constructor() {
    this.parser = new TM7Parser();
    this.exporter = new TM7Exporter();
  }
  
  /**
   * Import TM7 file and convert to Graph
   */
  async importTM7(file: File): Promise<FileOperationResult<Graph>> {
    try {
      // Validate file extension
      if (!file.name.toLowerCase().endsWith('.tm7')) {
        return {
          success: false,
          error: 'Invalid file format. Expected .tm7 file.'
        };
      }

      // Check file size (warn if > 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.warn(`Large file detected: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      }

      const content = await file.text();
      const graph = this.parser.parse(content);
      
      return {
        success: true,
        data: {
          ...graph,
          metadata: {
            ...graph.metadata,
            name: file.name.replace('.tm7', ''),
            imported: new Date()
          }
        }
      };
    } catch (error) {
      let errorMessage = 'Failed to import TM7 file';
      
      if (error instanceof TM7ParseError) {
        errorMessage = `TM7 parsing error: ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = `Import error: ${error.message}`;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Import JSON file and convert to Graph
   */
  async importJSON(file: File): Promise<FileOperationResult<Graph>> {
    try {
      // Validate file extension
      if (!file.name.toLowerCase().endsWith('.json')) {
        return {
          success: false,
          error: 'Invalid file format. Expected .json file.'
        };
      }

      const content = await file.text();
      const graph = JSON.parse(content) as Graph;
      
      // Basic validation
      if (!this.isValidGraph(graph)) {
        return {
          success: false,
          error: 'Invalid JSON format. Not a valid TM8 graph.'
        };
      }

      return {
        success: true,
        data: {
          ...graph,
          metadata: {
            ...graph.metadata,
            name: file.name.replace('.json', ''),
            imported: new Date()
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to import JSON file: ${error.message}`
      };
    }
  }
  
  /**
   * Export graph to TM7 format
   */
  async exportTM7(graph: Graph, filename?: string): Promise<FileOperationResult<void>> {
    try {
      const xmlContent = this.exporter.export(graph);
      const blob = new Blob([xmlContent], { type: 'application/xml' });
      
      this.downloadBlob(blob, filename || `${graph.metadata.name}.tm7`);
      
      return { success: true };
    } catch (error) {
      let errorMessage = 'Failed to export TM7 file';
      
      if (error instanceof TM7ExportError) {
        errorMessage = `TM7 export error: ${error.message}`;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
  
  /**
   * Export graph to JSON format
   */
  async exportJSON(graph: Graph, filename?: string): Promise<FileOperationResult<void>> {
    try {
      const jsonContent = JSON.stringify(graph, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      
      this.downloadBlob(blob, filename || `${graph.metadata.name}.json`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to export JSON file: ${error.message}`
      };
    }
  }
  
  /**
   * Export canvas as PNG image
   */
  async exportPNG(canvas: HTMLCanvasElement, filename?: string, options?: {
    includeBackground?: boolean;
    highResolution?: boolean;
  }): Promise<FileOperationResult<void>> {
    try {
      return new Promise((resolve) => {
        const opts = {
          includeBackground: true,
          highResolution: false,
          ...options
        };

        // Create a new canvas for export if high resolution is requested
        let exportCanvas = canvas;
        if (opts.highResolution) {
          exportCanvas = this.createHighResCanvas(canvas);
        }

        exportCanvas.toBlob((blob) => {
          if (blob) {
            this.downloadBlob(blob, filename || 'threat-model.png');
            resolve({ success: true });
          } else {
            resolve({
              success: false,
              error: 'Failed to generate PNG blob'
            });
          }
        }, 'image/png');
      });
    } catch (error) {
      return {
        success: false,
        error: `Failed to export PNG: ${error.message}`
      };
    }
  }

  /**
   * Export canvas as SVG (vector format)
   */
  async exportSVG(graph: Graph, filename?: string): Promise<FileOperationResult<void>> {
    try {
      const svgContent = this.generateSVG(graph);
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      
      this.downloadBlob(blob, filename || `${graph.metadata.name}.svg`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to export SVG: ${error.message}`
      };
    }
  }

  /**
   * Get file info without importing
   */
  async getFileInfo(file: File): Promise<{
    name: string;
    size: number;
    type: string;
    lastModified: Date;
    isValidFormat: boolean;
  }> {
    const extension = file.name.toLowerCase().split('.').pop();
    const isValidFormat = ['tm7', 'json'].includes(extension || '');

    return {
      name: file.name,
      size: file.size,
      type: file.type || `application/${extension}`,
      lastModified: new Date(file.lastModified),
      isValidFormat
    };
  }
  
  /**
   * Download blob as file
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * Create high resolution version of canvas
   */
  private createHighResCanvas(originalCanvas: HTMLCanvasElement): HTMLCanvasElement {
    const scale = 2; // 2x resolution
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return originalCanvas;
    }

    canvas.width = originalCanvas.width * scale;
    canvas.height = originalCanvas.height * scale;
    
    ctx.scale(scale, scale);
    ctx.drawImage(originalCanvas, 0, 0);
    
    return canvas;
  }

  /**
   * Generate SVG representation of graph
   */
  private generateSVG(graph: Graph): string {
    // Calculate bounds
    const bounds = this.calculateGraphBounds(graph);
    const padding = 50;
    
    const width = bounds.maxX - bounds.minX + (padding * 2);
    const height = bounds.maxY - bounds.minY + (padding * 2);
    
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <style>
      .node { fill: #f0f0f0; stroke: #333; stroke-width: 2; }
      .process { fill: #e1f5fe; }
      .datastore { fill: #f3e5f5; }
      .external-entity { fill: #e8f5e8; }
      .service { fill: #fff3e0; }
      .edge { stroke: #666; stroke-width: 2; fill: none; marker-end: url(#arrowhead); }
      .text { font-family: Arial, sans-serif; font-size: 12px; text-anchor: middle; }
      .boundary { fill: none; stroke: #ff5722; stroke-width: 2; stroke-dasharray: 5,5; }
    </style>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" 
            refX="10" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
    </marker>
  </defs>
  <g transform="translate(${padding - bounds.minX}, ${padding - bounds.minY})">`;

    // Add boundaries
    for (const boundary of graph.boundaries) {
      svg += `
    <rect x="${boundary.position.x}" y="${boundary.position.y}" 
          width="${boundary.bounds.width}" height="${boundary.bounds.height}"
          class="boundary" />
    <text x="${boundary.position.x + boundary.bounds.width / 2}" 
          y="${boundary.position.y - 5}" class="text">${this.escapeXml(boundary.name)}</text>`;
    }

    // Add edges
    for (const edge of graph.edges) {
      const sourceNode = graph.nodes.find(n => n.id === edge.source);
      if (sourceNode) {
        for (const targetId of edge.targets) {
          const targetNode = graph.nodes.find(n => n.id === targetId);
          if (targetNode) {
            svg += `
    <line x1="${sourceNode.position.x + 80}" y1="${sourceNode.position.y + 40}"
          x2="${targetNode.position.x + 80}" y2="${targetNode.position.y + 40}"
          class="edge" />`;
          }
        }
      }
    }

    // Add nodes
    for (const node of graph.nodes) {
      const nodeClass = `node ${node.type}`;
      svg += `
    <rect x="${node.position.x}" y="${node.position.y}" 
          width="160" height="80" class="${nodeClass}" />
    <text x="${node.position.x + 80}" y="${node.position.y + 45}" 
          class="text">${this.escapeXml(node.name)}</text>`;
    }

    svg += `
  </g>
</svg>`;

    return svg;
  }

  /**
   * Calculate bounding box of all graph elements
   */
  private calculateGraphBounds(graph: Graph) {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    // Consider nodes
    for (const node of graph.nodes) {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + 160); // Standard node width
      maxY = Math.max(maxY, node.position.y + 80);  // Standard node height
    }

    // Consider boundaries
    for (const boundary of graph.boundaries) {
      minX = Math.min(minX, boundary.position.x);
      minY = Math.min(minY, boundary.position.y);
      maxX = Math.max(maxX, boundary.position.x + boundary.bounds.width);
      maxY = Math.max(maxY, boundary.position.y + boundary.bounds.height);
    }

    // Default bounds if no elements
    if (graph.nodes.length === 0 && graph.boundaries.length === 0) {
      return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
    }

    return { minX, minY, maxX, maxY };
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Validate if object is a valid Graph
   */
  private isValidGraph(obj: any): obj is Graph {
    return obj &&
           Array.isArray(obj.nodes) &&
           Array.isArray(obj.edges) &&
           Array.isArray(obj.boundaries) &&
           typeof obj.metadata === 'object' &&
           typeof obj.metadata.name === 'string';
  }
}