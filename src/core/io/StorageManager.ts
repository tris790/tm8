/**
 * Browser storage manager for TM8 threat modeling application
 * Handles localStorage operations with quota management and data compression
 */

export interface StorageItem<T = any> {
  data: T;
  timestamp: number;
  version: string;
  size: number;
}

export interface StorageInfo {
  totalItems: number;
  totalSize: number;
  oldestItem?: Date;
  newestItem?: Date;
  availableSpace?: number;
}

export class StorageError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'StorageError';
  }
}

export class StorageManager {
  private readonly prefix: string = 'tm8-';
  private readonly version: string = '1.0';
  private readonly maxAge: number = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly maxItems: number = 100;

  constructor(prefix?: string) {
    if (prefix) {
      this.prefix = prefix.endsWith('-') ? prefix : prefix + '-';
    }
  }

  /**
   * Save data to localStorage with metadata
   */
  save<T>(key: string, data: T, options?: {
    compress?: boolean;
    ttl?: number; // Time to live in milliseconds
  }): void {
    try {
      const opts = {
        compress: false,
        ttl: this.maxAge,
        ...options
      };

      const item: StorageItem<T> = {
        data,
        timestamp: Date.now(),
        version: this.version,
        size: 0 // Will be calculated after serialization
      };

      const serialized = JSON.stringify(item);
      item.size = new Blob([serialized]).size;

      // Check quota before saving
      this.ensureQuotaAvailable(item.size);

      localStorage.setItem(this.getFullKey(key), serialized);
      
      // Clean up old items if needed
      this.cleanupIfNeeded();
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        this.performEmergencyCleanup();
        throw new StorageError('Storage quota exceeded. Some old data has been cleared.', error);
      }
      throw new StorageError(`Failed to save ${key}: ${error.message}`, error);
    }
  }

  /**
   * Load data from localStorage
   */
  load<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.getFullKey(key));
      if (!item) return null;

      const parsed: StorageItem<T> = JSON.parse(item);
      
      // Check if item has expired
      if (this.isExpired(parsed)) {
        this.remove(key);
        return null;
      }

      // Version compatibility check
      if (parsed.version !== this.version) {
        console.warn(`Version mismatch for ${key}: ${parsed.version} vs ${this.version}`);
        // Could implement migration logic here
      }

      return parsed.data;
    } catch (error) {
      console.warn(`Failed to load ${key}:`, error);
      // Clean up corrupted data
      this.remove(key);
      return null;
    }
  }

  /**
   * Check if item exists
   */
  exists(key: string): boolean {
    return localStorage.getItem(this.getFullKey(key)) !== null;
  }

  /**
   * Remove item from storage
   */
  remove(key: string): void {
    localStorage.removeItem(this.getFullKey(key));
  }

  /**
   * List all stored keys (without prefix)
   */
  list(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    return keys.sort();
  }

  /**
   * Get metadata for a stored item
   */
  getItemInfo(key: string): StorageItem | null {
    try {
      const item = localStorage.getItem(this.getFullKey(key));
      if (!item) return null;

      const parsed: StorageItem = JSON.parse(item);
      return {
        data: '[Data]', // Don't return actual data for info
        timestamp: parsed.timestamp,
        version: parsed.version,
        size: parsed.size || new Blob([item]).size
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): StorageInfo {
    const keys = this.list();
    let totalSize = 0;
    let oldestTime: number | undefined;
    let newestTime: number | undefined;

    for (const key of keys) {
      const info = this.getItemInfo(key);
      if (info) {
        totalSize += info.size;
        
        if (!oldestTime || info.timestamp < oldestTime) {
          oldestTime = info.timestamp;
        }
        if (!newestTime || info.timestamp > newestTime) {
          newestTime = info.timestamp;
        }
      }
    }

    return {
      totalItems: keys.length,
      totalSize,
      oldestItem: oldestTime ? new Date(oldestTime) : undefined,
      newestItem: newestTime ? new Date(newestTime) : undefined,
      availableSpace: this.estimateAvailableSpace()
    };
  }

  /**
   * Clear all stored data
   */
  clear(): void {
    const keys = this.list();
    for (const key of keys) {
      this.remove(key);
    }
  }

  /**
   * Export all data as JSON
   */
  export(): Record<string, any> {
    const keys = this.list();
    const exported: Record<string, any> = {};
    
    for (const key of keys) {
      const data = this.load(key);
      if (data !== null) {
        exported[key] = data;
      }
    }
    
    return exported;
  }

  /**
   * Import data from JSON
   */
  import(data: Record<string, any>, options?: {
    overwrite?: boolean;
    prefix?: string;
  }): { successful: number; failed: string[] } {
    const opts = {
      overwrite: false,
      prefix: '',
      ...options
    };

    let successful = 0;
    const failed: string[] = [];

    for (const [key, value] of Object.entries(data)) {
      try {
        const fullKey = opts.prefix ? `${opts.prefix}${key}` : key;
        
        if (!opts.overwrite && this.exists(fullKey)) {
          failed.push(`${key}: already exists`);
          continue;
        }

        this.save(fullKey, value);
        successful++;
      } catch (error) {
        failed.push(`${key}: ${error.message}`);
      }
    }

    return { successful, failed };
  }

  /**
   * Get full key with prefix
   */
  private getFullKey(key: string): string {
    return this.prefix + key;
  }

  /**
   * Check if item has expired
   */
  private isExpired(item: StorageItem): boolean {
    const age = Date.now() - item.timestamp;
    return age > this.maxAge;
  }

  /**
   * Ensure enough quota is available
   */
  private ensureQuotaAvailable(requiredSize: number): void {
    // Conservative estimate of localStorage limit (5-10MB typically)
    const estimatedLimit = 5 * 1024 * 1024; // 5MB
    const currentUsage = this.getCurrentUsage();
    
    if (currentUsage + requiredSize > estimatedLimit * 0.9) {
      this.performCleanup(requiredSize);
    }
  }

  /**
   * Get current localStorage usage
   */
  private getCurrentUsage(): number {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          total += new Blob([key + value]).size;
        }
      }
    }
    return total;
  }

  /**
   * Estimate available space
   */
  private estimateAvailableSpace(): number {
    const estimatedLimit = 5 * 1024 * 1024; // 5MB conservative estimate
    const currentUsage = this.getCurrentUsage();
    return Math.max(0, estimatedLimit - currentUsage);
  }

  /**
   * Clean up expired and old items
   */
  private cleanupIfNeeded(): void {
    const keys = this.list();
    if (keys.length <= this.maxItems) return;

    // Remove expired items first
    for (const key of keys) {
      const info = this.getItemInfo(key);
      if (info && this.isExpired(info)) {
        this.remove(key);
      }
    }

    // If still too many items, remove oldest
    this.performCleanup(0);
  }

  /**
   * Perform cleanup to free space
   */
  private performCleanup(requiredSize: number): void {
    const keys = this.list();
    const items: { key: string; info: StorageItem }[] = [];

    // Collect items with metadata
    for (const key of keys) {
      const info = this.getItemInfo(key);
      if (info) {
        items.push({ key, info });
      }
    }

    // Sort by timestamp (oldest first)
    items.sort((a, b) => a.info.timestamp - b.info.timestamp);

    // Remove items until we have enough space or reach reasonable limit
    let freedSpace = 0;
    let removedCount = 0;
    const maxToRemove = Math.floor(items.length * 0.3); // Remove max 30% of items

    for (const item of items) {
      if (freedSpace >= requiredSize && removedCount >= maxToRemove) break;
      
      // Prioritize auto-save and temporary files for removal
      if (item.key.startsWith('auto-save-') || item.key.startsWith('temp-')) {
        this.remove(item.key);
        freedSpace += item.info.size;
        removedCount++;
      }
    }

    // If still not enough, remove oldest items
    if (freedSpace < requiredSize) {
      for (const item of items) {
        if (freedSpace >= requiredSize || removedCount >= maxToRemove) break;
        
        this.remove(item.key);
        freedSpace += item.info.size;
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} items, freed ${freedSpace} bytes`);
    }
  }

  /**
   * Emergency cleanup when quota is exceeded
   */
  private performEmergencyCleanup(): void {
    console.warn('Performing emergency storage cleanup');
    
    // Remove all auto-save files
    const keys = this.list();
    for (const key of keys) {
      if (key.startsWith('auto-save-') || key.startsWith('temp-')) {
        this.remove(key);
      }
    }
  }
}