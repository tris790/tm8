/**
 * Public API for IO operations in TM8
 */

export { FileManager, FileManagerError } from './FileManager';
export { AutoSave, AutoSaveError } from './AutoSave';
export { StorageManager, StorageError } from './StorageManager';

export type {
  FileOperationResult,
  StorageItem,
  StorageInfo,
  AutoSaveOptions,
  AutoSaveInfo
} from './FileManager';