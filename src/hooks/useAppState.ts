/**
 * Global application state management hook for TM8
 * Coordinates graph state, UI state, and operations
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Graph, CanvasMode } from '../core/types';
import { StorageManager } from '../core/io/StorageManager';
import { AutoSave } from '../core/io/AutoSave';
import { GraphHistory } from '../core/graph/GraphHistory';

export interface AppState {
  graph: Graph;
  selectedNodes: string[];
  selectedEdges: string[];
  selectedBoundaries: string[];
  canvasMode: CanvasMode;
  isLoading: boolean;
  error: string | null;
  zoom: number;
  panOffset: { x: number; y: number };
}

export interface UseAppStateResult extends AppState {
  // Graph operations
  updateGraph: (updates: Partial<Graph>) => void;
  loadGraph: (graph: Graph) => void;
  resetGraph: () => void;
  
  // Selection operations
  setSelectedNodes: (nodes: string[]) => void;
  setSelectedEdges: (edges: string[]) => void;
  setSelectedBoundaries: (boundaries: string[]) => void;
  clearSelection: () => void;
  selectAll: () => void;
  
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
  selectedNodes: [],
  selectedEdges: [],
  selectedBoundaries: [],
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
      
      // Add to history if this is a significant change
      if (updates.nodes || updates.edges || updates.boundaries) {
        history.current.snapshot(newGraph);
      }
      
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
      selectedNodes: [],
      selectedEdges: [],
      selectedBoundaries: [],
      canvasMode: CanvasMode.SELECT,
      error: null
    }));
    
    // Reset history with new graph
    history.current.clear();
    history.current.snapshot(graph);
  }, []);

  const resetGraph = useCallback(() => {
    const emptyGraph = createEmptyGraph();
    loadGraph(emptyGraph);
  }, [loadGraph]);

  // Selection operations
  const setSelectedNodes = useCallback((nodes: string[]) => {
    setState(prev => ({ ...prev, selectedNodes: nodes }));
  }, []);

  const setSelectedEdges = useCallback((edges: string[]) => {
    setState(prev => ({ ...prev, selectedEdges: edges }));
  }, []);

  const setSelectedBoundaries = useCallback((boundaries: string[]) => {
    setState(prev => ({ ...prev, selectedBoundaries: boundaries }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedNodes: [],
      selectedEdges: [],
      selectedBoundaries: []
    }));
  }, []);

  const selectAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedNodes: prev.graph.nodes.map(n => n.id),
      selectedEdges: prev.graph.edges.map(e => e.id),
      selectedBoundaries: prev.graph.boundaries.map(b => b.id)
    }));
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

  // History operations
  const undo = useCallback(() => {
    const previousGraph = history.current.undo();
    if (previousGraph) {
      setState(prev => ({
        ...prev,
        graph: previousGraph,
        selectedNodes: [],
        selectedEdges: [],
        selectedBoundaries: []
      }));
      autoSave.current.updateGraph(previousGraph);
    }
  }, []);

  const redo = useCallback(() => {
    const nextGraph = history.current.redo();
    if (nextGraph) {
      setState(prev => ({
        ...prev,
        graph: nextGraph,
        selectedNodes: [],
        selectedEdges: [],
        selectedBoundaries: []
      }));
      autoSave.current.updateGraph(nextGraph);
    }
  }, []);

  const canUndo = history.current.canUndo();
  const canRedo = history.current.canRedo();

  // Utility functions
  const getSelectionCount = useCallback(() => {
    return state.selectedNodes.length + state.selectedEdges.length + state.selectedBoundaries.length;
  }, [state.selectedNodes, state.selectedEdges, state.selectedBoundaries]);

  const hasSelection = useCallback(() => {
    return getSelectionCount() > 0;
  }, [getSelectionCount]);

  return {
    ...state,
    updateGraph,
    loadGraph,
    resetGraph,
    setSelectedNodes,
    setSelectedEdges,
    setSelectedBoundaries,
    clearSelection,
    selectAll,
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
    getSelectionCount,
    hasSelection
  };
};

export default useAppState;