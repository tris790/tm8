/**
 * Auto-save system for TM8 threat modeling application
 * Automatically saves graph state at regular intervals and on critical events
 */

import type { Graph } from '../types/graph';
import { StorageManager, StorageError } from './StorageManager';

export interface AutoSaveOptions {
  interval?: number; // Save interval in milliseconds (default: 30 seconds)
  maxVersions?: number; // Maximum number of auto-save versions to keep
  saveOnChange?: boolean; // Save immediately when graph changes
  saveOnBlur?: boolean; // Save when window loses focus
  saveOnUnload?: boolean; // Save before page unload
}

export interface AutoSaveInfo {
  lastSaveTime: Date | null;
  nextSaveTime: Date | null;
  isRunning: boolean;
  saveCount: number;
  errorCount: number;
  lastError: string | null;
}

export class AutoSaveError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'AutoSaveError';
  }
}

export class AutoSave {
  private storageManager: StorageManager;
  private options: Required<AutoSaveOptions>;
  
  // State tracking
  private intervalId: number | null = null;
  private lastSaveTime: Date | null = null;
  private saveCount: number = 0;
  private errorCount: number = 0;
  private lastError: string | null = null;
  private isRunning: boolean = false;
  
  // Current graph reference
  private currentGraph: Graph | null = null;
  private currentKey: string = 'current-threat-model';
  
  // Event listeners
  private boundHandlers = {
    blur: this.handleWindowBlur.bind(this),
    beforeUnload: this.handleBeforeUnload.bind(this),
    visibilityChange: this.handleVisibilityChange.bind(this)
  };

  constructor(storageManager?: StorageManager, options?: AutoSaveOptions) {
    this.storageManager = storageManager || new StorageManager();
    this.options = {
      interval: 30000, // 30 seconds
      maxVersions: 10,
      saveOnChange: true,
      saveOnBlur: true,
      saveOnUnload: true,
      ...options
    };
  }

  /**
   * Start auto-save for the given graph
   */
  start(graph: Graph, key?: string): void {
    this.stop(); // Stop any existing auto-save
    
    this.currentGraph = graph;
    this.currentKey = key || 'current-threat-model';
    this.isRunning = true;
    this.lastError = null;

    // Set up periodic save
    this.intervalId = window.setInterval(() => {
      this.performSave('interval');
    }, this.options.interval);

    // Set up event listeners
    if (this.options.saveOnBlur) {
      window.addEventListener('blur', this.boundHandlers.blur);
    }
    
    if (this.options.saveOnUnload) {
      window.addEventListener('beforeunload', this.boundHandlers.beforeUnload);
    }
    
    // Listen for visibility changes (tab switching, minimizing)
    document.addEventListener('visibilitychange', this.boundHandlers.visibilityChange);

    // Perform initial save
    this.performSave('start');
  }

  /**
   * Stop auto-save
   */
  stop(): void {
    if (!this.isRunning) return;

    // Clear interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Remove event listeners
    window.removeEventListener('blur', this.boundHandlers.blur);
    window.removeEventListener('beforeunload', this.boundHandlers.beforeUnload);
    document.removeEventListener('visibilitychange', this.boundHandlers.visibilityChange);

    this.isRunning = false;
    this.currentGraph = null;
  }

  /**
   * Update the graph reference (for when graph changes)
   */
  updateGraph(graph: Graph): void {
    this.currentGraph = graph;
    
    if (this.options.saveOnChange && this.isRunning) {
      this.performSave('change');
    }
  }

  /**
   * Force an immediate save
   */
  forceSave(): Promise<void> {
    return this.performSave('manual');
  }

  /**
   * Get auto-save information
   */
  getInfo(): AutoSaveInfo {
    return {
      lastSaveTime: this.lastSaveTime,
      nextSaveTime: this.getNextSaveTime(),
      isRunning: this.isRunning,
      saveCount: this.saveCount,
      errorCount: this.errorCount,
      lastError: this.lastError
    };
  }

  /**
   * List available auto-save versions
   */
  listVersions(): Array<{
    key: string;
    timestamp: Date;
    name: string;
    size: number;
  }> {
    const versions: Array<{
      key: string;
      timestamp: Date;
      name: string;
      size: number;
    }> = [];

    const keys = this.storageManager.list();
    for (const key of keys) {
      if (key.startsWith('auto-save-')) {
        const info = this.storageManager.getItemInfo(key);
        if (info) {
          const graph = this.storageManager.load<Graph>(key);
          versions.push({
            key,
            timestamp: new Date(info.timestamp),
            name: graph?.metadata.name || 'Unknown',
            size: info.size
          });
        }
      }
    }

    // Sort by timestamp (newest first)
    return versions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Restore from auto-save version
   */
  restore(key: string): Graph | null {
    try {
      const graph = this.storageManager.load<Graph>(key);
      if (graph) {
        return graph;
      }
      return null;
    } catch (error) {
      console.error(`Restore failed from ${key}:`, error);
      return null;
    }
  }

  /**
   * Clean up old auto-save versions
   */
  cleanup(): void {
    try {
      const versions = this.listVersions();
      const toRemove = versions.slice(this.options.maxVersions);
      
      for (const version of toRemove) {
        this.storageManager.remove(version.key);
      }
      
      // Cleanup completed silently
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }

  /**
   * Perform the actual save operation
   */
  private async performSave(trigger: string): Promise<void> {
    if (!this.currentGraph || !this.isRunning) return;

    try {
      // Create versioned auto-save key
      const timestamp = new Date().toISOString();
      const autoSaveKey = `auto-save-${Date.now()}`;
      
      // Update metadata
      const graphWithMetadata = {
        ...this.currentGraph,
        metadata: {
          ...this.currentGraph.metadata,
          lastAutoSave: new Date(),
          autoSaveTrigger: trigger
        }
      };

      // Save versioned copy
      this.storageManager.save(autoSaveKey, graphWithMetadata);
      
      // Save as current
      this.storageManager.save(this.currentKey, graphWithMetadata);
      
      this.lastSaveTime = new Date();
      this.saveCount++;
      this.lastError = null;
      
      // Clean up old versions
      this.cleanup();
      
      // Save completed silently
    } catch (error) {
      this.errorCount++;
      this.lastError = error.message;
      
      if (error instanceof StorageError) {
        console.warn('Auto-save storage error:', error.message);
      } else {
        console.error('Auto-save error:', error);
      }
      
      // Don't throw error to avoid disrupting the application
    }
  }

  /**
   * Get time of next scheduled save
   */
  private getNextSaveTime(): Date | null {
    if (!this.isRunning || !this.lastSaveTime) return null;
    
    return new Date(this.lastSaveTime.getTime() + this.options.interval);
  }

  /**
   * Handle window blur event
   */
  private handleWindowBlur(): void {
    this.performSave('blur');
  }

  /**
   * Handle before unload event
   */
  private handleBeforeUnload(): void {
    this.performSave('unload');
  }

  /**
   * Handle visibility change event
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      this.performSave('visibility');
    }
  }

  /**
   * Check if auto-save data exists for recovery
   */
  static hasRecoveryData(storageManager?: StorageManager): boolean {
    const storage = storageManager || new StorageManager();
    const keys = storage.list();
    return keys.some(key => key.startsWith('auto-save-') || key === 'current-threat-model');
  }

  /**
   * Get the most recent auto-save for recovery
   */
  static getLatestAutoSave(storageManager?: StorageManager): Graph | null {
    const storage = storageManager || new StorageManager();
    
    // Try current first
    let graph = storage.load<Graph>('current-threat-model');
    if (graph) return graph;
    
    // Look for most recent auto-save
    const keys = storage.list()
      .filter(key => key.startsWith('auto-save-'))
      .sort((a, b) => {
        const timeA = parseInt(a.split('-')[2]) || 0;
        const timeB = parseInt(b.split('-')[2]) || 0;
        return timeB - timeA;
      });
    
    for (const key of keys) {
      graph = storage.load<Graph>(key);
      if (graph) return graph;
    }
    
    return null;
  }
}