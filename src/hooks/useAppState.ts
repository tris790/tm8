/**
 * Global application state management hook for TM8
 * Coordinates graph state, UI state, and operations
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Graph, CanvasMode } from '../core/types';
import { StorageManager } from '../core/io/StorageManager';
import { AutoSave } from '../core/io/AutoSave';
import { GraphHistory } from '../core/graph/GraphHistory';
import { selectionManager, SelectionState } from '../core/graph/SelectionManager';

export interface AppState {
  graph: Graph;
  selection: SelectionState;
  canvasMode: CanvasMode;
  isLoading: boolean;
  error: string | null;
  zoom: number;
  panOffset: { x: number; y: number };
}

export interface UseAppStateResult extends AppState {
  // Graph operations
  updateGraph: (updates: Partial<Graph>) => void;
  updateGraphSilent: (updates: Partial<Graph>) => void; // Update without history snapshot
  loadGraph: (graph: Graph) => void;
  resetGraph: () => void;
  
  // Selection operations (delegated to SelectionManager)
  selectEntity: (entityId: string, addToSelection?: boolean) => void;
  clearSelection: () => void;
  selectAll: () => void;
  isSelected: (entityId: string) => boolean;
  
  // UI state operations
  setCanvasMode: (mode: CanvasMode) => void;
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  // History operations
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Drag operations
  startDrag: () => void;
  endDrag: () => void;
  
  // Utility functions
  getSelectionCount: () => number;
  hasSelection: () => boolean;
  resetError: () => void;
}

/**
 * Default empty graph
 */
const createEmptyGraph = (): Graph => ({
  nodes: [],
  edges: [],
  boundaries: [],
  metadata: {
    name: 'New Threat Model',
    version: '1.0.0',
    created: new Date(),
    modified: new Date()
  }
});

const createEmptyState = (): AppState => ({
  graph: createEmptyGraph(),
  selection: {
    selectedIds: new Set(),
    selectedNodes: [],
    selectedEdges: [],
    selectedBoundaries: []
  },
  canvasMode: CanvasMode.SELECT,
  isLoading: false,
  error: null,
  zoom: 1.0,
  panOffset: { x: 0, y: 0 }
});

export const useAppState = (): UseAppStateResult => {
  const [state, setState] = useState<AppState>(createEmptyState);
  
  // Refs for managers
  const storageManager = useRef(new StorageManager());
  const autoSave = useRef(new AutoSave(storageManager.current));
  const history = useRef(new GraphHistory());
  
  // Selection state sync
  useEffect(() => {
    const unsubscribe = selectionManager.subscribe((selectionState) => {
      setState(prev => ({ ...prev, selection: selectionState }));
    });
    return unsubscribe;
  }, []);
  
  // Drag state management
  const isDragging = useRef(false);
  const dragStartGraph = useRef<Graph | null>(null);

  // Initialize with auto-saved data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        
        // Check for recovery data first
        const hasRecovery = AutoSave.hasRecoveryData(storageManager.current);
        if (hasRecovery) {
          const recoveredGraph = AutoSave.getLatestAutoSave(storageManager.current);
          if (recoveredGraph) {
            setState(prev => ({
              ...prev,
              graph: recoveredGraph,
              isLoading: false
            }));
            return;
          }
        }
        
        // Try to load from normal storage
        const savedGraph = storageManager.current.load<Graph>('current-threat-model');
        if (savedGraph) {
          setState(prev => ({
            ...prev,
            graph: savedGraph,
            isLoading: false
          }));
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Failed to initialize app state:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to load application data',
          isLoading: false
        }));
      }
    };

    initializeApp();
  }, []);

  // Auto-save setup
  useEffect(() => {
    if (state.graph && state.graph.nodes.length > 0) {
      autoSave.current.start(state.graph);
      history.current.snapshot(state.graph);
    }
    
    return () => autoSave.current.stop();
  }, [state.graph]);

  // Graph operations
  const updateGraph = useCallback((updates: Partial<Graph>) => {
    setState(prev => {
      const newGraph = { ...prev.graph, ...updates };
      
      // Update auto-save
      autoSave.current.updateGraph(newGraph);
      
      // Add to history if this is a significant change and we're not in the middle of a drag
      if (updates.nodes || updates.edges || updates.boundaries) {
        if (!isDragging.current) {
          history.current.snapshot(newGraph);
        }
      }
      
      return {
        ...prev,
        graph: newGraph
      };
    });
  }, []);

  // Silent update without history snapshot (used during drag operations)
  const updateGraphSilent = useCallback((updates: Partial<Graph>) => {
    setState(prev => {
      const newGraph = { ...prev.graph, ...updates };
      
      // Update auto-save
      autoSave.current.updateGraph(newGraph);
      
      // No history snapshot for silent updates
      
      return {
        ...prev,
        graph: newGraph
      };
    });
  }, []);

  const loadGraph = useCallback((graph: Graph) => {
    setState(prev => ({
      ...prev,
      graph,
      canvasMode: CanvasMode.SELECT,
      error: null
    }));
    
    // Update selection manager with new graph
    selectionManager.setGraph(graph);
    selectionManager.clearSelection();
    
    // Reset history with new graph
    history.current.clear();
    history.current.snapshot(graph);
  }, []);

  const resetGraph = useCallback(() => {
    const emptyGraph = createEmptyGraph();
    loadGraph(emptyGraph);
  }, [loadGraph]);

  // Selection operations (delegated to SelectionManager)
  const selectEntity = useCallback((entityId: string, addToSelection: boolean = false) => {
    selectionManager.handleEntitySelect(entityId, addToSelection);
  }, []);

  const clearSelection = useCallback(() => {
    selectionManager.clearSelection();
  }, []);

  const selectAll = useCallback(() => {
    selectionManager.selectAll();
  }, []);

  const isSelected = useCallback((entityId: string) => {
    return selectionManager.isSelected(entityId);
  }, []);

  // UI state operations
  const setCanvasMode = useCallback((mode: CanvasMode) => {
    setState(prev => ({ ...prev, canvasMode: mode }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, zoom: Math.max(0.1, Math.min(5.0, zoom)) }));
  }, []);

  const setPanOffset = useCallback((offset: { x: number; y: number }) => {
    setState(prev => ({ ...prev, panOffset: offset }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const resetError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Drag operations
  const startDrag = useCallback(() => {
    if (!isDragging.current) {
      isDragging.current = true;
      // Store the graph state before drag starts, but don't create snapshot yet
      dragStartGraph.current = JSON.parse(JSON.stringify(state.graph));
    }
  }, [state.graph]);

  const endDrag = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      // Only now create the history snapshots - one for before drag, one for after
      if (dragStartGraph.current) {
        history.current.snapshot(dragStartGraph.current);
        history.current.snapshot(state.graph);
      }
      dragStartGraph.current = null;
    }
  }, [state.graph]);

  // History operations
  const undo = useCallback(() => {
    const previousSnapshot = history.current.undo();
    if (previousSnapshot) {
      // Convert GraphSnapshot to Graph by preserving metadata
      const previousGraph: Graph = {
        ...previousSnapshot,
        metadata: state.graph.metadata // Preserve current metadata
      };
      setState(prev => ({
        ...prev,
        graph: previousGraph
      }));
      // Update selection manager and clear selection on undo
      selectionManager.setGraph(previousGraph);
      selectionManager.clearSelection();
      autoSave.current.updateGraph(previousGraph);
    }
  }, [state.graph.metadata]);

  const redo = useCallback(() => {
    const nextSnapshot = history.current.redo();
    if (nextSnapshot) {
      // Convert GraphSnapshot to Graph by preserving metadata
      const nextGraph: Graph = {
        ...nextSnapshot,
        metadata: state.graph.metadata // Preserve current metadata
      };
      setState(prev => ({
        ...prev,
        graph: nextGraph
      }));
      // Update selection manager and clear selection on redo
      selectionManager.setGraph(nextGraph);
      selectionManager.clearSelection();
      autoSave.current.updateGraph(nextGraph);
    }
  }, [state.graph.metadata]);

  const canUndo = history.current.canUndo();
  const canRedo = history.current.canRedo();

  // Utility functions
  const getSelectionCount = useCallback(() => {
    return selectionManager.getSelectionCount();
  }, []);

  const hasSelection = useCallback(() => {
    return selectionManager.hasSelection();
  }, []);
  
  // Initialize selection manager with initial graph
  useEffect(() => {
    if (state.graph) {
      selectionManager.setGraph(state.graph);
    }
  }, [state.graph]);

  return {
    ...state,
    updateGraph,
    updateGraphSilent,
    loadGraph,
    resetGraph,
    selectEntity,
    clearSelection,
    selectAll,
    isSelected,
    setCanvasMode,
    setZoom,
    setPanOffset,
    setError,
    setLoading,
    resetError,
    undo,
    redo,
    canUndo,
    canRedo,
    startDrag,
    endDrag,
    getSelectionCount,
    hasSelection
  };
};

export default useAppState;