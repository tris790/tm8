import React, { useState, useCallback, useRef } from 'react';
import './index.css';
import { CanvasContainer } from '@/components/canvas';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { NotificationSystem } from '@/components/notifications';
import { ShortcutHelp } from '@/components/shortcuts';
import { LoadingScreen, ErrorScreen } from '@/components/ui';
import { useAppState } from '@/hooks/useAppState';
import { useFileOperations } from '@/hooks/useFileOperations';
import { useSearch } from '@/hooks/useSearch';
import { useKeyboardShortcuts, createDefaultShortcuts } from '@/hooks/useKeyboardShortcuts';
import { createDemoGraph } from '@/utils/demoGraph';
import { Node, CanvasMode } from '@/core/types';
import { NodeType, EdgeType, BoundaryType } from '@/core/types/enums';
import { toolManager } from '@/core/tools/ToolManager';

interface AppProps {}

const App: React.FC<AppProps> = () => {
  // Global application state
  const {
    graph,
    selectedNodes,
    selectedEdges,
    selectedBoundaries,
    canvasMode,
    isLoading,
    error,
    updateGraph,
    loadGraph,
    setSelectedNodes,
    setSelectedEdges,
    setSelectedBoundaries,
    setCanvasMode: originalSetCanvasMode,
    clearSelection,
    selectAll,
    undo,
    redo,
    canUndo,
    canRedo,
    resetError
  } = useAppState();

  const setCanvasMode = originalSetCanvasMode;

  // Search functionality
  const {
    query,
    results,
    setQuery,
    clearSearch,
    finalResults
  } = useSearch(graph);

  // File operations
  const {
    importTM7,
    importJSON,
    exportTM7,
    exportJSON,
    exportPNG,
    state: fileState
  } = useFileOperations({
    onSuccess: (operation, data) => {
      if (operation === 'import' && data) {
        loadGraph(data);
        window.showNotification?.({ 
          type: 'success', 
          title: 'File imported successfully',
          message: `Loaded ${data.nodes.length} nodes and ${data.edges.length} edges` 
        });
      } else if (operation === 'export') {
        window.showNotification?.({ 
          type: 'success', 
          title: 'File exported successfully' 
        });
      }
    },
    onError: (operation, error) => {
      window.showNotification?.({ 
        type: 'error', 
        title: `${operation} failed`,
        message: error 
      });
    }
  });

  // Canvas reference for exports
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // File operation handlers
  const handleImportFile = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.tm7,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.name.endsWith('.tm7')) {
          await importTM7(file);
        } else if (file.name.endsWith('.json')) {
          await importJSON(file);
        }
      }
    };
    input.click();
  }, [importTM7, importJSON]);

  const handleExportFile = useCallback(async () => {
    await exportTM7(graph);
  }, [exportTM7, graph]);

  const handleExportImage = useCallback(async () => {
    if (canvasRef.current) {
      await exportPNG(canvasRef.current);
    }
  }, [exportPNG]);

  // Focus search function
  const focusSearch = useCallback(() => {
    const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  }, []);

  // Shortcut help state
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

  // Sidebar state

  // Node creation handlers
  const createNode = useCallback((type: string) => {
    // TODO: Implement node creation based on type
    console.log('Create node:', type);
  }, []);

  const handleNodeCreate = useCallback((x: number, y: number) => {
    // Generate unique node ID
    const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get the currently selected node type from ToolManager
    const selectedNodeType = toolManager.getActiveNodeType();
    
    // Create new node at clicked position
    const newNode = {
      id: nodeId,
      type: selectedNodeType,
      name: `New Node`,
      position: { x, y },
      properties: {}
    };

    // Add node to graph
    const updatedGraph = {
      ...graph,
      nodes: [...graph.nodes, newNode],
      metadata: {
        ...graph.metadata,
        modified: new Date()
      }
    };

    updateGraph(updatedGraph);
    
    // Select the newly created node and focus name field
    setSelectedNodes([nodeId]);
    setSelectedEdges([]);
    setSelectedBoundaries([]);
    
    // Focus first available field after a brief delay to allow component to render
    setTimeout(() => {
      // Find the properties panel and focus the first text input
      const propertiesPanel = document.querySelector('.properties-panel, .panel');
      if (propertiesPanel) {
        const nameInput = propertiesPanel.querySelector('input[type="text"]') as HTMLInputElement;
        if (nameInput) {
          nameInput.focus();
          nameInput.select();
        }
      }
    }, 300);
  }, [graph, updateGraph, setSelectedNodes, setSelectedEdges, setSelectedBoundaries]);

  const handleEdgeCreate = useCallback((sourceNodeId: string, targetNodeId: string) => {
    // Generate unique edge ID
    const edgeId = `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get the currently selected edge type from ToolManager
    const selectedEdgeType = toolManager.getActiveEdgeType();
    
    // Create new edge connecting source to target
    const newEdge = {
      id: edgeId,
      type: selectedEdgeType,
      source: sourceNodeId,
      targets: [targetNodeId], // Note: targets is an array (supports multiple targets)
      properties: {}
    };

    // Add edge to graph
    const updatedGraph = {
      ...graph,
      edges: [...graph.edges, newEdge],
      metadata: {
        ...graph.metadata,
        modified: new Date()
      }
    };

    updateGraph(updatedGraph);
    
    // Select the newly created edge and focus type field (edges don't have names)
    setSelectedNodes([]);
    setSelectedEdges([edgeId]);
    setSelectedBoundaries([]);
    
    // Focus first available field after a brief delay to allow component to render
    setTimeout(() => {
      // Find the properties panel and focus the first focusable element
      const propertiesPanel = document.querySelector('.properties-panel, .panel');
      if (propertiesPanel) {
        const firstInput = propertiesPanel.querySelector('input, select') as HTMLInputElement | HTMLSelectElement;
        if (firstInput) {
          firstInput.focus();
        }
      }
    }, 300);
  }, [graph, updateGraph, setSelectedNodes, setSelectedEdges, setSelectedBoundaries]);

  const handleBoundaryCreate = useCallback((x: number, y: number, width: number, height: number) => {
    // Generate unique boundary ID
    const boundaryId = `boundary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create new boundary at specified position and size
    const newBoundary = {
      id: boundaryId,
      type: BoundaryType.TRUST_BOUNDARY, // Default type - will integrate with ToolManager later
      name: 'New Boundary',
      position: { x, y },
      bounds: { width, height },
      properties: {}
    };

    // Add boundary to graph
    const updatedGraph = {
      ...graph,
      boundaries: [...graph.boundaries, newBoundary],
      metadata: {
        ...graph.metadata,
        modified: new Date()
      }
    };

    updateGraph(updatedGraph);
    
    // Select the newly created boundary and focus name field
    setSelectedNodes([]);
    setSelectedEdges([]);
    setSelectedBoundaries([boundaryId]);
    
    // Focus first available field after a brief delay to allow component to render
    setTimeout(() => {
      // Find the properties panel and focus the first text input
      const propertiesPanel = document.querySelector('.properties-panel, .panel');
      if (propertiesPanel) {
        const nameInput = propertiesPanel.querySelector('input[type="text"]') as HTMLInputElement;
        if (nameInput) {
          nameInput.focus();
          nameInput.select();
        }
      }
    }, 300);
  }, [graph, updateGraph, setSelectedNodes, setSelectedEdges, setSelectedBoundaries]);

  const deleteSelected = useCallback(() => {
    if (selectedNodes.length > 0 || selectedEdges.length > 0 || selectedBoundaries.length > 0) {
      // Create updated graph with selected items removed
      const updatedGraph = {
        ...graph,
        nodes: graph.nodes.filter(node => !selectedNodes.includes(node.id)),
        edges: graph.edges.filter(edge => !selectedEdges.includes(edge.id)),
        boundaries: graph.boundaries.filter(boundary => !selectedBoundaries.includes(boundary.id)),
        metadata: {
          ...graph.metadata,
          modified: new Date()
        }
      };

      // Remove edges connected to deleted nodes
      const remainingEdges = updatedGraph.edges.filter(edge => {
        return !selectedNodes.includes(edge.source) && 
               !edge.targets.some(target => selectedNodes.includes(target));
      });
      updatedGraph.edges = remainingEdges;

      updateGraph(updatedGraph);
      clearSelection();
      
      // Show notification about deletion
      const deletedCount = selectedNodes.length + selectedEdges.length + selectedBoundaries.length;
      window.showNotification?.({ 
        type: 'success', 
        title: `Deleted ${deletedCount} item${deletedCount !== 1 ? 's' : ''}`,
        message: `${selectedNodes.length} nodes, ${selectedEdges.length} edges, ${selectedBoundaries.length} boundaries`
      });
    }
  }, [selectedNodes, selectedEdges, selectedBoundaries, clearSelection, graph, updateGraph]);

  // Keyboard shortcuts
  const shortcutHandlers = {
    setMode: (mode: string) => {
      setCanvasMode(mode as CanvasMode);
    },
    createNode,
    deleteSelected,
    undo,
    redo,
    selectAll
  };

  const shortcuts = [
    ...createDefaultShortcuts(shortcutHandlers),
    { key: 'o', ctrlKey: true, action: handleImportFile, description: 'Open file' },
    { key: 's', ctrlKey: true, action: handleExportFile, description: 'Save file' },
    { key: 'f', ctrlKey: true, action: focusSearch, description: 'Focus search' },
    { key: '?', action: () => setShowShortcutHelp(true), description: 'Show shortcuts' },
    { key: 'Escape', action: () => { clearSelection(); clearSearch(); }, description: 'Clear selection and search' }
  ];

  useKeyboardShortcuts(shortcuts);

  // Initialize with demo data if empty
  React.useEffect(() => {
    if (graph.nodes.length === 0 && !isLoading) {
      const demoGraph = createDemoGraph();
      loadGraph(demoGraph);
    }
  }, [graph.nodes.length, isLoading, loadGraph]);

  // Loading state
  if (isLoading) {
    return (
      <LoadingScreen 
        message={fileState.isImporting ? 'Importing file...' : 'Loading application...'}
        progress={fileState.importProgress}
      />
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorScreen 
        error={error}
        onRetry={resetError}
        onGoHome={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="app">
      <Header 
        onSearch={setQuery}
        onImport={handleImportFile}
        onExport={handleExportFile}
        searchQuery={query}
        searchResults={finalResults}
      />
      
      <div className="app-content">
        <Toolbar 
          activeMode={canvasMode}
          onModeChange={setCanvasMode}
          selectedNodes={selectedNodes}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onDeleteSelected={deleteSelected}
        />
        
        <CanvasContainer
          graph={graph}
          mode={canvasMode}
          onNodeSelect={(nodeId, addToSelection) => {
            if (addToSelection) {
              const newSelection = selectedNodes.includes(nodeId) 
                ? selectedNodes.filter(id => id !== nodeId)
                : [...selectedNodes, nodeId];
              setSelectedNodes(newSelection);
            } else {
              // Clear all other selections when not adding to selection
              setSelectedNodes([nodeId]);
              setSelectedEdges([]);
              setSelectedBoundaries([]);
            }
          }}
          onEdgeSelect={(edgeId, addToSelection) => {
            if (addToSelection) {
              const newSelection = selectedEdges.includes(edgeId) 
                ? selectedEdges.filter(id => id !== edgeId)
                : [...selectedEdges, edgeId];
              setSelectedEdges(newSelection);
            } else {
              // Clear all other selections when not adding to selection
              setSelectedNodes([]);
              setSelectedEdges([edgeId]);
              setSelectedBoundaries([]);
            }
          }}
          onBoundarySelect={(boundaryId, addToSelection) => {
            if (addToSelection) {
              const newSelection = selectedBoundaries.includes(boundaryId) 
                ? selectedBoundaries.filter(id => id !== boundaryId)
                : [...selectedBoundaries, boundaryId];
              setSelectedBoundaries(newSelection);
            } else {
              // Clear all other selections when not adding to selection
              setSelectedNodes([]);
              setSelectedEdges([]);
              setSelectedBoundaries([boundaryId]);
            }
          }}
          onDeselectAll={() => {
            clearSelection();
          }}
          onNodeCreate={handleNodeCreate}
          onEdgeCreate={handleEdgeCreate}
          onBoundaryCreate={handleBoundaryCreate}
          onModeChange={setCanvasMode}
        />
        
        <Sidebar 
          selectedNodes={selectedNodes}
          selectedEdges={selectedEdges}
          selectedBoundaries={selectedBoundaries}
          graph={graph}
          onUpdateNode={(id, updates) => {
            if (!graph) return;
            const updatedNodes = graph.nodes.map(node => 
              node.id === id ? { ...node, ...updates } : node
            );
            updateGraph({ nodes: updatedNodes });
          }}
          onUpdateEdge={(id, updates) => {
            if (!graph) return;
            const updatedEdges = graph.edges.map(edge => 
              edge.id === id ? { ...edge, ...updates } : edge
            );
            updateGraph({ edges: updatedEdges });
          }}
          onUpdateBoundary={(id, updates) => {
            if (!graph) return;
            const updatedBoundaries = graph.boundaries.map(boundary => 
              boundary.id === id ? { ...boundary, ...updates } : boundary
            );
            updateGraph({ boundaries: updatedBoundaries });
          }}
        />
      </div>
      
      <NotificationSystem />
      <ShortcutHelp 
        isOpen={showShortcutHelp}
        onClose={() => setShowShortcutHelp(false)}
      />
    </div>
  );
};

export default App;