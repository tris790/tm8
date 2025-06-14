/**
 * Graph core exports
 * Exports all graph data structures and algorithms
 */

export { GraphStore } from './GraphStore';
export { SpatialIndex } from './SpatialIndex';
export { GraphAlgorithms } from './GraphAlgorithms';
export { GraphHistory } from './GraphHistory';
export { GraphValidator } from './GraphValidator';
export { SelectionManager, selectionManager } from './SelectionManager';

export type {
  ViewportBounds,
  SearchOptions,
  VisibilityState,
  GraphBatch
} from './GraphStore';

export type {
  DataFlowPath,
  ConnectedComponent,
  CycleInfo
} from './GraphAlgorithms';

export type {
  GraphSnapshot,
  HistoryStats
} from './GraphHistory';

export type {
  ValidationError,
  ValidationResult
} from './GraphValidator';

export type {
  SelectionState,
  SelectionChangeCallback
} from './SelectionManager';