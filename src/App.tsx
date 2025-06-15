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
import { Camera } from '@/core/canvas';

interface AppProps {}

const App: React.FC<AppProps> = () => {
  // Global application state
  const {
    graph,
    selection,
    canvasMode,
    isLoading,
    error,
    updateGraph,
    updateGraphSilent,
    loadGraph,
    selectEntity,
    setCanvasMode: originalSetCanvasMode,
    clearSelection,
    selectAll,
    undo,
    redo,
    canUndo,
    canRedo,
    startDrag,
    endDrag,
    resetError
  } = useAppState();

  const setCanvasMode = originalSetCanvasMode;

  // Search functionality
  const {
    query,
    results,
    setQuery,
    clearSearch,
    finalResults,
    isSearching
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
  
  // Camera reference for animations
  const cameraRef = useRef<Camera | null>(null);

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

  // Handle camera ready
  const handleCameraReady = useCallback((camera: Camera) => {
    cameraRef.current = camera;
  }, []);

  // Handle search result selection
  const handleSearchResultSelect = useCallback((entityId: string) => {
    // Find the entity in the graph for notification and position
    const node = graph.nodes.find(n => n.id === entityId);
    const edge = graph.edges.find(e => e.id === entityId);
    const boundary = graph.boundaries.find(b => b.id === entityId);

    // Use centralized selection manager
    selectEntity(entityId);

    // Animate camera to entity position
    if (cameraRef.current) {
      let targetX = 0, targetY = 0;
      
      if (node) {
        targetX = node.position.x;
        targetY = node.position.y;
      } else if (boundary) {
        targetX = boundary.position.x + boundary.bounds.width / 2;
        targetY = boundary.position.y + boundary.bounds.height / 2;
      } else if (edge) {
        // For edges, find center between source and first target
        const sourceNode = graph.nodes.find(n => n.id === edge.source);
        const targetNode = graph.nodes.find(n => n.id === edge.targets[0]);
        if (sourceNode && targetNode) {
          targetX = (sourceNode.position.x + targetNode.position.x) / 2;
          targetY = (sourceNode.position.y + targetNode.position.y) / 2;
        }
      }
      
      // Animate camera to entity with a slight zoom increase
      const currentZoom = cameraRef.current.zoom;
      const targetZoom = Math.min(currentZoom * 1.5, 0.01); // Increase zoom by 50% but cap at 0.01
      cameraRef.current.animateToPosition(targetX, targetY, targetZoom, 800);
    }

    // Clear search to hide results
    clearSearch();
    
    // Show notification about selection
    const entityType = node ? 'node' : edge ? 'edge' : 'boundary';
    const entityName = node?.name || boundary?.name || `${edge?.source} → ${edge?.targets.join(', ')}`;
    window.showNotification?.({ 
      type: 'info', 
      title: `Selected ${entityType}`,
      message: entityName
    });
  }, [graph, selectEntity, clearSearch]);

  // Shortcut help state
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

  // Sidebar state

  // Node creation handlers
  const createNode = useCallback((type: string) => {
    // TODO: Implement node creation based on type
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
    selectEntity(nodeId);
    
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
  }, [graph, updateGraph, selectEntity]);

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
    selectEntity(edgeId);
    
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
  }, [graph, updateGraph, selectEntity]);

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
    selectEntity(boundaryId);
    
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
  }, [graph, updateGraph, selectEntity]);

  const deleteSelected = useCallback(() => {
    if (selection.selectedIds.size > 0) {
      // Create updated graph with selected items removed
      const updatedGraph = {
        ...graph,
        nodes: graph.nodes.filter(node => !selection.selectedIds.has(node.id)),
        edges: graph.edges.filter(edge => !selection.selectedIds.has(edge.id)),
        boundaries: graph.boundaries.filter(boundary => !selection.selectedIds.has(boundary.id)),
        metadata: {
          ...graph.metadata,
          modified: new Date()
        }
      };

      // Remove edges connected to deleted nodes
      const remainingEdges = updatedGraph.edges.filter(edge => {
        return !selection.selectedIds.has(edge.source) && 
               !edge.targets.some(target => selection.selectedIds.has(target));
      });
      updatedGraph.edges = remainingEdges;

      updateGraph(updatedGraph);
      clearSelection();
      
      // Show notification about deletion
      const deletedCount = selection.selectedIds.size;
      window.showNotification?.({ 
        type: 'success', 
        title: `Deleted ${deletedCount} item${deletedCount !== 1 ? 's' : ''}`,
        message: `${selection.selectedNodes.length} nodes, ${selection.selectedEdges.length} edges, ${selection.selectedBoundaries.length} boundaries`
      });
    }
  }, [selection, clearSelection, graph, updateGraph]);

  // Group selected entities (placeholder functionality)
  const groupSelected = useCallback(() => {
    if (selection.selectedIds.size > 1) {
      // TODO: Implement grouping functionality
      window.showNotification?.({ 
        type: 'info', 
        title: 'Group selected',
        message: `Grouping ${selection.selectedIds.size} items (not yet implemented)`
      });
    }
  }, [selection.selectedIds]);

  // Keyboard shortcuts
  const shortcutHandlers = {
    setMode: (mode: string) => {
      setCanvasMode(mode as CanvasMode);
    },
    createNode,
    deleteSelected,
    undo,
    redo,
    selectAll,
    groupSelected
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
        onSelectSearchResult={handleSearchResultSelect}
        isSearching={isSearching}
      />
      
      <div className="app-content">
        <Toolbar 
          activeMode={canvasMode}
          onModeChange={setCanvasMode}
          selection={selection}
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
            selectEntity(nodeId, addToSelection);
          }}
          onEdgeSelect={(edgeId, addToSelection) => {
            selectEntity(edgeId, addToSelection);
          }}
          onBoundarySelect={(boundaryId, addToSelection) => {
            selectEntity(boundaryId, addToSelection);
          }}
          onDeselectAll={() => {
            clearSelection();
          }}
          onNodeUpdate={(nodeId, updates) => {
            if (!graph) return;
            const updatedNodes = graph.nodes.map(node => 
              node.id === nodeId ? { ...node, ...updates } : node
            );
            updateGraph({ ...graph, nodes: updatedNodes });
          }}
          onNodeUpdateSilent={(nodeId, updates) => {
            if (!graph) return;
            const updatedNodes = graph.nodes.map(node => 
              node.id === nodeId ? { ...node, ...updates } : node
            );
            updateGraphSilent({ ...graph, nodes: updatedNodes });
          }}
          onBoundaryUpdate={(boundaryId, updates) => {
            if (!graph) return;
            const updatedBoundaries = graph.boundaries.map(boundary => 
              boundary.id === boundaryId ? { ...boundary, ...updates } : boundary
            );
            updateGraph({ ...graph, boundaries: updatedBoundaries });
          }}
          onBoundaryUpdateSilent={(boundaryId, updates) => {
            if (!graph) return;
            const updatedBoundaries = graph.boundaries.map(boundary => 
              boundary.id === boundaryId ? { ...boundary, ...updates } : boundary
            );
            updateGraphSilent({ ...graph, boundaries: updatedBoundaries });
          }}
          onMultiEntityUpdate={(nodeUpdates, boundaryUpdates) => {
            if (!graph) return;
            
            // Apply all node updates in a single operation
            let updatedNodes = graph.nodes;
            if (nodeUpdates.length > 0) {
              updatedNodes = graph.nodes.map(node => {
                const update = nodeUpdates.find(u => u.id === node.id);
                return update ? { ...node, ...update.updates } : node;
              });
            }
            
            // Apply all boundary updates in a single operation
            let updatedBoundaries = graph.boundaries;
            if (boundaryUpdates.length > 0) {
              updatedBoundaries = graph.boundaries.map(boundary => {
                const update = boundaryUpdates.find(u => u.id === boundary.id);
                return update ? { ...boundary, ...update.updates } : boundary;
              });
            }
            
            // Single graph update with all changes
            updateGraph({
              ...graph,
              nodes: updatedNodes,
              boundaries: updatedBoundaries
            });
          }}
          onMultiEntityUpdateSilent={(nodeUpdates, boundaryUpdates) => {
            if (!graph) return;
            
            // Apply all node updates in a single operation
            let updatedNodes = graph.nodes;
            if (nodeUpdates.length > 0) {
              updatedNodes = graph.nodes.map(node => {
                const update = nodeUpdates.find(u => u.id === node.id);
                return update ? { ...node, ...update.updates } : node;
              });
            }
            
            // Apply all boundary updates in a single operation
            let updatedBoundaries = graph.boundaries;
            if (boundaryUpdates.length > 0) {
              updatedBoundaries = graph.boundaries.map(boundary => {
                const update = boundaryUpdates.find(u => u.id === boundary.id);
                return update ? { ...boundary, ...update.updates } : boundary;
              });
            }
            
            // Single silent graph update with all changes
            updateGraphSilent({
              ...graph,
              nodes: updatedNodes,
              boundaries: updatedBoundaries
            });
          }}
          onNodeCreate={handleNodeCreate}
          onEdgeCreate={handleEdgeCreate}
          onBoundaryCreate={handleBoundaryCreate}
          onModeChange={setCanvasMode}
          onDragStart={startDrag}
          onDragEnd={endDrag}
          onCameraReady={handleCameraReady}
        />
        
        <Sidebar 
          selection={selection}
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