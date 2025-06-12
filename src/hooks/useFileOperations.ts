/**
 * React hook for file operations in TM8 threat modeling application
 * Provides a unified interface for import/export operations with state management
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import type { Graph } from '../core/types/graph';
import { FileManager, type FileOperationResult } from '../core/io/FileManager';
import { AutoSave } from '../core/io/AutoSave';
import { StorageManager } from '../core/io/StorageManager';
import type { ExportFormat } from '../components/io/ExportDialog';

export interface FileOperationState {
  isImporting: boolean;
  isExporting: boolean;
  importProgress?: number;
  exportProgress?: number;
  lastOperation?: {
    type: 'import' | 'export';
    format: string;
    filename: string;
    timestamp: Date;
    success: boolean;
  };
}

export interface UseFileOperationsResult {
  // State
  state: FileOperationState;
  
  // Import operations
  importTM7: (file: File) => Promise<Graph | null>;
  importJSON: (file: File) => Promise<Graph | null>;
  importFiles: (files: File[]) => Promise<Graph[]>;
  
  // Export operations
  exportTM7: (graph: Graph, filename?: string) => Promise<boolean>;
  exportJSON: (graph: Graph, filename?: string) => Promise<boolean>;
  exportPNG: (canvas: HTMLCanvasElement, filename?: string, options?: any) => Promise<boolean>;
  exportSVG: (graph: Graph, filename?: string) => Promise<boolean>;
  
  // Utility functions
  getFileInfo: (file: File) => Promise<any>;
  validateFiles: (files: File[]) => { valid: File[]; invalid: Array<{ file: File; error: string }> };
  
  // Auto-save operations
  autoSave: {
    start: (graph: Graph, key?: string) => void;
    stop: () => void;
    updateGraph: (graph: Graph) => void;
    forceSave: () => Promise<void>;
    getInfo: () => any;
    listVersions: () => any[];
    restore: (key: string) => Graph | null;
    hasRecoveryData: () => boolean;
    getLatestAutoSave: () => Graph | null;
  };
  
  // Event handlers
  onSuccess?: (operation: string, data?: any) => void;
  onError?: (operation: string, error: string) => void;
  onProgress?: (operation: string, progress: number) => void;
}

export interface UseFileOperationsOptions {
  onSuccess?: (operation: string, data?: any) => void;
  onError?: (operation: string, error: string) => void;
  onProgress?: (operation: string, progress: number) => void;
  autoSaveOptions?: {
    interval?: number;
    maxVersions?: number;
  };
}

export function useFileOperations(options?: UseFileOperationsOptions): UseFileOperationsResult {
  const [state, setState] = useState<FileOperationState>({
    isImporting: false,
    isExporting: false
  });

  // Managers
  const fileManager = useRef(new FileManager());
  const storageManager = useRef(new StorageManager());
  const autoSave = useRef(new AutoSave(storageManager.current, options?.autoSaveOptions));

  // Callbacks
  const { onSuccess, onError, onProgress } = options || {};

  const updateState = useCallback((updates: Partial<FileOperationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const recordOperation = useCallback((
    type: 'import' | 'export',
    format: string,
    filename: string,
    success: boolean
  ) => {
    updateState({
      lastOperation: {
        type,
        format,
        filename,
        timestamp: new Date(),
        success
      }
    });
  }, [updateState]);

  // Import operations
  const importTM7 = useCallback(async (file: File): Promise<Graph | null> => {
    updateState({ isImporting: true, importProgress: 0 });
    
    try {
      onProgress?.('import', 25);
      const result = await fileManager.current.importTM7(file);
      onProgress?.('import', 100);
      
      if (result.success && result.data) {
        recordOperation('import', 'tm7', file.name, true);
        onSuccess?.('import', result.data);
        return result.data;
      } else {
        recordOperation('import', 'tm7', file.name, false);
        onError?.('import', result.error || 'Import failed');
        return null;
      }
    } catch (error) {
      recordOperation('import', 'tm7', file.name, false);
      onError?.('import', error.message);
      return null;
    } finally {
      updateState({ isImporting: false, importProgress: undefined });
    }
  }, [updateState, recordOperation, onSuccess, onError, onProgress]);

  const importJSON = useCallback(async (file: File): Promise<Graph | null> => {
    updateState({ isImporting: true, importProgress: 0 });
    
    try {
      onProgress?.('import', 25);
      const result = await fileManager.current.importJSON(file);
      onProgress?.('import', 100);
      
      if (result.success && result.data) {
        recordOperation('import', 'json', file.name, true);
        onSuccess?.('import', result.data);
        return result.data;
      } else {
        recordOperation('import', 'json', file.name, false);
        onError?.('import', result.error || 'Import failed');
        return null;
      }
    } catch (error) {
      recordOperation('import', 'json', file.name, false);
      onError?.('import', error.message);
      return null;
    } finally {
      updateState({ isImporting: false, importProgress: undefined });
    }
  }, [updateState, recordOperation, onSuccess, onError, onProgress]);

  const importFiles = useCallback(async (files: File[]): Promise<Graph[]> => {
    const results: Graph[] = [];
    updateState({ isImporting: true });
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = ((i + 1) / files.length) * 100;
        onProgress?.('import', progress);
        
        let graph: Graph | null = null;
        
        if (file.name.toLowerCase().endsWith('.tm7')) {
          graph = await importTM7(file);
        } else if (file.name.toLowerCase().endsWith('.json')) {
          graph = await importJSON(file);
        }
        
        if (graph) {
          results.push(graph);
        }
      }
      
      return results;
    } finally {
      updateState({ isImporting: false, importProgress: undefined });
    }
  }, [importTM7, importJSON, updateState, onProgress]);

  // Export operations
  const exportTM7 = useCallback(async (graph: Graph, filename?: string): Promise<boolean> => {
    updateState({ isExporting: true, exportProgress: 0 });
    
    try {
      onProgress?.('export', 50);
      const result = await fileManager.current.exportTM7(graph, filename);
      onProgress?.('export', 100);
      
      const exportFilename = filename || `${graph.metadata.name}.tm7`;
      recordOperation('export', 'tm7', exportFilename, result.success);
      
      if (result.success) {
        onSuccess?.('export', { format: 'tm7', filename: exportFilename });
        return true;
      } else {
        onError?.('export', result.error || 'Export failed');
        return false;
      }
    } catch (error) {
      const exportFilename = filename || `${graph.metadata.name}.tm7`;
      recordOperation('export', 'tm7', exportFilename, false);
      onError?.('export', error.message);
      return false;
    } finally {
      updateState({ isExporting: false, exportProgress: undefined });
    }
  }, [updateState, recordOperation, onSuccess, onError, onProgress]);

  const exportJSON = useCallback(async (graph: Graph, filename?: string): Promise<boolean> => {
    updateState({ isExporting: true, exportProgress: 0 });
    
    try {
      onProgress?.('export', 50);
      const result = await fileManager.current.exportJSON(graph, filename);
      onProgress?.('export', 100);
      
      const exportFilename = filename || `${graph.metadata.name}.json`;
      recordOperation('export', 'json', exportFilename, result.success);
      
      if (result.success) {
        onSuccess?.('export', { format: 'json', filename: exportFilename });
        return true;
      } else {
        onError?.('export', result.error || 'Export failed');
        return false;
      }
    } catch (error) {
      const exportFilename = filename || `${graph.metadata.name}.json`;
      recordOperation('export', 'json', exportFilename, false);
      onError?.('export', error.message);
      return false;
    } finally {
      updateState({ isExporting: false, exportProgress: undefined });
    }
  }, [updateState, recordOperation, onSuccess, onError, onProgress]);

  const exportPNG = useCallback(async (
    canvas: HTMLCanvasElement, 
    filename?: string, 
    options?: any
  ): Promise<boolean> => {
    updateState({ isExporting: true, exportProgress: 0 });
    
    try {
      onProgress?.('export', 50);
      const result = await fileManager.current.exportPNG(canvas, filename, options);
      onProgress?.('export', 100);
      
      const exportFilename = filename || 'threat-model.png';
      recordOperation('export', 'png', exportFilename, result.success);
      
      if (result.success) {
        onSuccess?.('export', { format: 'png', filename: exportFilename });
        return true;
      } else {
        onError?.('export', result.error || 'Export failed');
        return false;
      }
    } catch (error) {
      const exportFilename = filename || 'threat-model.png';
      recordOperation('export', 'png', exportFilename, false);
      onError?.('export', error.message);
      return false;
    } finally {
      updateState({ isExporting: false, exportProgress: undefined });
    }
  }, [updateState, recordOperation, onSuccess, onError, onProgress]);

  const exportSVG = useCallback(async (graph: Graph, filename?: string): Promise<boolean> => {
    updateState({ isExporting: true, exportProgress: 0 });
    
    try {
      onProgress?.('export', 50);
      const result = await fileManager.current.exportSVG(graph, filename);
      onProgress?.('export', 100);
      
      const exportFilename = filename || `${graph.metadata.name}.svg`;
      recordOperation('export', 'svg', exportFilename, result.success);
      
      if (result.success) {
        onSuccess?.('export', { format: 'svg', filename: exportFilename });
        return true;
      } else {
        onError?.('export', result.error || 'Export failed');
        return false;
      }
    } catch (error) {
      const exportFilename = filename || `${graph.metadata.name}.svg`;
      recordOperation('export', 'svg', exportFilename, false);
      onError?.('export', error.message);
      return false;
    } finally {
      updateState({ isExporting: false, exportProgress: undefined });
    }
  }, [updateState, recordOperation, onSuccess, onError, onProgress]);

  // Utility functions
  const getFileInfo = useCallback(async (file: File) => {
    return await fileManager.current.getFileInfo(file);
  }, []);

  const validateFiles = useCallback((files: File[]) => {
    const valid: File[] = [];
    const invalid: Array<{ file: File; error: string }> = [];
    
    for (const file of files) {
      const extension = file.name.toLowerCase().split('.').pop();
      if (extension && ['tm7', 'json'].includes(extension)) {
        valid.push(file);
      } else {
        invalid.push({
          file,
          error: `Unsupported file type: .${extension}`
        });
      }
    }
    
    return { valid, invalid };
  }, []);

  // Auto-save operations
  const autoSaveOperations = useMemo(() => ({
    start: (graph: Graph, key?: string) => autoSave.current.start(graph, key),
    stop: () => autoSave.current.stop(),
    updateGraph: (graph: Graph) => autoSave.current.updateGraph(graph),
    forceSave: () => autoSave.current.forceSave(),
    getInfo: () => autoSave.current.getInfo(),
    listVersions: () => autoSave.current.listVersions(),
    restore: (key: string) => autoSave.current.restore(key),
    hasRecoveryData: () => AutoSave.hasRecoveryData(storageManager.current),
    getLatestAutoSave: () => AutoSave.getLatestAutoSave(storageManager.current)
  }), []);

  return {
    state,
    importTM7,
    importJSON,
    importFiles,
    exportTM7,
    exportJSON,
    exportPNG,
    exportSVG,
    getFileInfo,
    validateFiles,
    autoSave: autoSaveOperations,
    onSuccess,
    onError,
    onProgress
  };
}