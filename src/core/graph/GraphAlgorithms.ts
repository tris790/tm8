/**
 * Graph algorithms for threat modeling analysis
 * Provides traversal, analysis, and clustering algorithms for efficient graph operations
 */

import { Graph, Node, Edge, Boundary } from '../types/graph';
import { GraphStore } from './GraphStore';

export interface DataFlowPath {
  edges: Edge[];
  nodes: Node[];
  length: number;
}

export interface ConnectedComponent {
  nodes: Node[];
  edges: Edge[];
  size: number;
}

export interface CycleInfo {
  edges: Edge[];
  nodes: Node[];
  length: number;
}

/**
 * Essential graph algorithms for threat modeling analysis
 */
export class GraphAlgorithms {
  
  // =================
  // TRAVERSAL ALGORITHMS
  // =================

  /**
   * Depth-first search traversal starting from a node
   */
  static depthFirstSearch(graph: Graph, startId: string): string[] {
    const visited = new Set<string>();
    const result: string[] = [];
    const edgeMap = this.buildEdgeMap(graph);

    const dfs = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      
      visited.add(nodeId);
      result.push(nodeId);

      // Visit all connected nodes
      const connectedNodes = this.getConnectedNodeIds(nodeId, edgeMap);
      for (const connectedId of connectedNodes) {
        if (!visited.has(connectedId)) {
          dfs(connectedId);
        }
      }
    };

    // Start DFS from the given node
    if (this.nodeExists(graph, startId)) {
      dfs(startId);
    }

    return result;
  }

  /**
   * Breadth-first search traversal starting from a node
   */
  static breadthFirstSearch(graph: Graph, startId: string): string[] {
    if (!this.nodeExists(graph, startId)) return [];

    const visited = new Set<string>();
    const result: string[] = [];
    const queue: string[] = [startId];
    const edgeMap = this.buildEdgeMap(graph);

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      
      if (visited.has(nodeId)) continue;
      
      visited.add(nodeId);
      result.push(nodeId);

      // Add all unvisited connected nodes to queue
      const connectedNodes = this.getConnectedNodeIds(nodeId, edgeMap);
      for (const connectedId of connectedNodes) {
        if (!visited.has(connectedId)) {
          queue.push(connectedId);
        }
      }
    }

    return result;
  }

  // =================
  // PATH ANALYSIS
  // =================

  /**
   * Find all data flow paths between two nodes
   */
  static findDataFlowPaths(graph: Graph, fromId: string, toId: string, maxPaths: number = 10): DataFlowPath[] {
    if (!this.nodeExists(graph, fromId) || !this.nodeExists(graph, toId)) {
      return [];
    }

    const paths: DataFlowPath[] = [];
    const visited = new Set<string>();
    const currentPath: Edge[] = [];
    const edgeMap = this.buildEdgeMap(graph);
    const nodeMap = this.buildNodeMap(graph);

    const findPaths = (currentNodeId: string, targetNodeId: string, depth: number) => {
      if (depth > 20 || paths.length >= maxPaths) return; // Prevent infinite loops and limit results
      
      if (currentNodeId === targetNodeId) {
        // Found a path to target
        const pathNodes = this.getNodesFromEdges(currentPath, nodeMap);
        paths.push({
          edges: [...currentPath],
          nodes: pathNodes,
          length: currentPath.length
        });
        return;
      }

      if (visited.has(currentNodeId)) return;
      visited.add(currentNodeId);

      // Explore outgoing edges
      const outgoingEdges = edgeMap.outgoing.get(currentNodeId) || [];
      for (const edge of outgoingEdges) {
        currentPath.push(edge);
        
        // Follow each target of this edge
        for (const target of edge.targets) {
          findPaths(target, targetNodeId, depth + 1);
        }
        
        currentPath.pop();
      }

      visited.delete(currentNodeId);
    };

    findPaths(fromId, toId, 0);
    
    // Sort paths by length (shortest first)
    return paths.sort((a, b) => a.length - b.length);
  }

  /**
   * Find shortest path between two nodes using Dijkstra's algorithm
   */
  static findShortestPath(graph: Graph, fromId: string, toId: string): DataFlowPath | null {
    if (!this.nodeExists(graph, fromId) || !this.nodeExists(graph, toId)) {
      return null;
    }

    const distances = new Map<string, number>();
    const previous = new Map<string, { nodeId: string; edge: Edge }>();
    const visited = new Set<string>();
    const queue = new Set<string>();

    // Initialize distances
    for (const node of graph.nodes) {
      distances.set(node.id, node.id === fromId ? 0 : Infinity);
      queue.add(node.id);
    }

    const edgeMap = this.buildEdgeMap(graph);
    const nodeMap = this.buildNodeMap(graph);

    while (queue.size > 0) {
      // Find unvisited node with minimum distance
      let currentNode: string | null = null;
      let minDistance = Infinity;
      
      for (const nodeId of queue) {
        const distance = distances.get(nodeId)!;
        if (distance < minDistance) {
          minDistance = distance;
          currentNode = nodeId;
        }
      }

      if (!currentNode || minDistance === Infinity) break;
      
      queue.delete(currentNode);
      visited.add(currentNode);

      if (currentNode === toId) break;

      // Update distances to neighbors
      const outgoingEdges = edgeMap.outgoing.get(currentNode) || [];
      for (const edge of outgoingEdges) {
        for (const target of edge.targets) {
          if (visited.has(target)) continue;

          const altDistance = distances.get(currentNode)! + 1; // Each edge has weight 1
          if (altDistance < distances.get(target)!) {
            distances.set(target, altDistance);
            previous.set(target, { nodeId: currentNode, edge });
          }
        }
      }
    }

    // Reconstruct path
    if (!previous.has(toId)) return null;

    const pathEdges: Edge[] = [];
    const pathNodes: Node[] = [];
    let current = toId;

    // Build path backwards
    while (previous.has(current)) {
      const prev = previous.get(current)!;
      pathEdges.unshift(prev.edge);
      pathNodes.unshift(nodeMap.get(current)!);
      current = prev.nodeId;
    }
    
    // Add starting node
    pathNodes.unshift(nodeMap.get(fromId)!);

    return {
      edges: pathEdges,
      nodes: pathNodes,
      length: pathEdges.length
    };
  }

  // =================
  // CYCLE DETECTION
  // =================

  /**
   * Detect cycles in the graph using DFS
   */
  static detectCycles(graph: Graph): CycleInfo[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: CycleInfo[] = [];
    const edgeMap = this.buildEdgeMap(graph);
    const nodeMap = this.buildNodeMap(graph);

    const dfs = (nodeId: string, path: Edge[], pathNodes: string[]): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingEdges = edgeMap.outgoing.get(nodeId) || [];
      for (const edge of outgoingEdges) {
        for (const target of edge.targets) {
          if (recursionStack.has(target)) {
            // Found a cycle
            const cycleStartIndex = pathNodes.indexOf(target);
            if (cycleStartIndex !== -1) {
              const cycleEdges = path.slice(cycleStartIndex);
              cycleEdges.push(edge);
              
              const cycleNodes = pathNodes.slice(cycleStartIndex).map(id => nodeMap.get(id)!);
              cycleNodes.push(nodeMap.get(target)!);

              cycles.push({
                edges: cycleEdges,
                nodes: cycleNodes,
                length: cycleEdges.length
              });
            }
          } else if (!visited.has(target)) {
            dfs(target, [...path, edge], [...pathNodes, target]);
          }
        }
      }

      recursionStack.delete(nodeId);
    };

    // Check all nodes for cycles
    for (const node of graph.nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id, [], [node.id]);
      }
    }

    return cycles;
  }

  // =================
  // COMPONENT ANALYSIS
  // =================

  /**
   * Find all isolated nodes (nodes with no connections)
   */
  static findIsolatedNodes(graph: Graph): Node[] {
    const connectedNodes = new Set<string>();
    
    // Mark all nodes that are connected via edges
    for (const edge of graph.edges) {
      connectedNodes.add(edge.source);
      edge.targets.forEach(target => connectedNodes.add(target));
    }

    // Return nodes that are not connected
    return graph.nodes.filter(node => !connectedNodes.has(node.id));
  }

  /**
   * Find all connected components in the graph
   */
  static findConnectedComponents(graph: Graph): ConnectedComponent[] {
    const visited = new Set<string>();
    const components: ConnectedComponent[] = [];
    const edgeMap = this.buildEdgeMap(graph);
    const nodeMap = this.buildNodeMap(graph);

    const exploreComponent = (startNodeId: string): ConnectedComponent => {
      const componentNodes: Node[] = [];
      const componentNodeIds = new Set<string>();
      const queue = [startNodeId];

      while (queue.length > 0) {
        const nodeId = queue.shift()!;
        if (visited.has(nodeId)) continue;

        visited.add(nodeId);
        componentNodeIds.add(nodeId);
        const node = nodeMap.get(nodeId);
        if (node) componentNodes.push(node);

        // Add all connected nodes (both directions)
        const connectedNodes = this.getConnectedNodeIds(nodeId, edgeMap);
        for (const connectedId of connectedNodes) {
          if (!visited.has(connectedId)) {
            queue.push(connectedId);
          }
        }
      }

      // Find edges within this component
      const componentEdges = graph.edges.filter(edge => 
        componentNodeIds.has(edge.source) && 
        edge.targets.some(target => componentNodeIds.has(target))
      );

      return {
        nodes: componentNodes,
        edges: componentEdges,
        size: componentNodes.length
      };
    };

    // Find all components
    for (const node of graph.nodes) {
      if (!visited.has(node.id)) {
        const component = exploreComponent(node.id);
        if (component.nodes.length > 0) {
          components.push(component);
        }
      }
    }

    // Sort by size (largest first)
    return components.sort((a, b) => b.size - a.size);
  }

  // =================
  // CLUSTERING ALGORITHMS
  // =================

  /**
   * Group nodes by trust boundary
   */
  static groupByTrustBoundary(graph: Graph): Map<string, Node[]> {
    const groups = new Map<string, Node[]>();

    // Create a default group for nodes not in any boundary
    groups.set('__no_boundary__', []);

    // Find which boundary contains each node
    for (const node of graph.nodes) {
      let containingBoundary: string | null = null;

      for (const boundary of graph.boundaries) {
        if (this.isNodeInBoundary(node, boundary)) {
          containingBoundary = boundary.id;
          break;
        }
      }

      const groupKey = containingBoundary || '__no_boundary__';
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(node);
    }

    // Remove empty default group
    if (groups.get('__no_boundary__')?.length === 0) {
      groups.delete('__no_boundary__');
    }

    return groups;
  }

  /**
   * Calculate centrality measures for nodes
   */
  static calculateNodeCentrality(graph: Graph): Map<string, { degree: number; betweenness: number; closeness: number }> {
    const centrality = new Map<string, { degree: number; betweenness: number; closeness: number }>();
    const edgeMap = this.buildEdgeMap(graph);
    
    // Calculate degree centrality
    for (const node of graph.nodes) {
      const inDegree = (edgeMap.incoming.get(node.id) || []).length;
      const outDegree = (edgeMap.outgoing.get(node.id) || []).length;
      const degree = inDegree + outDegree;
      
      centrality.set(node.id, {
        degree,
        betweenness: 0, // Simplified - would need all-pairs shortest paths for accurate calculation
        closeness: this.calculateCloseness(node.id, graph, edgeMap)
      });
    }

    return centrality;
  }

  // =================
  // HELPER METHODS
  // =================

  private static buildEdgeMap(graph: Graph): {
    outgoing: Map<string, Edge[]>;
    incoming: Map<string, Edge[]>;
  } {
    const outgoing = new Map<string, Edge[]>();
    const incoming = new Map<string, Edge[]>();

    for (const edge of graph.edges) {
      // Outgoing edges
      if (!outgoing.has(edge.source)) {
        outgoing.set(edge.source, []);
      }
      outgoing.get(edge.source)!.push(edge);

      // Incoming edges
      for (const target of edge.targets) {
        if (!incoming.has(target)) {
          incoming.set(target, []);
        }
        incoming.get(target)!.push(edge);
      }
    }

    return { outgoing, incoming };
  }

  private static buildNodeMap(graph: Graph): Map<string, Node> {
    const nodeMap = new Map<string, Node>();
    for (const node of graph.nodes) {
      nodeMap.set(node.id, node);
    }
    return nodeMap;
  }

  private static getConnectedNodeIds(nodeId: string, edgeMap: { outgoing: Map<string, Edge[]>; incoming: Map<string, Edge[]> }): string[] {
    const connected = new Set<string>();

    // Add targets from outgoing edges
    const outgoing = edgeMap.outgoing.get(nodeId) || [];
    for (const edge of outgoing) {
      edge.targets.forEach(target => connected.add(target));
    }

    // Add sources from incoming edges
    const incoming = edgeMap.incoming.get(nodeId) || [];
    for (const edge of incoming) {
      connected.add(edge.source);
    }

    return Array.from(connected);
  }

  private static getNodesFromEdges(edges: Edge[], nodeMap: Map<string, Node>): Node[] {
    const nodeIds = new Set<string>();
    
    for (const edge of edges) {
      nodeIds.add(edge.source);
      edge.targets.forEach(target => nodeIds.add(target));
    }

    return Array.from(nodeIds).map(id => nodeMap.get(id)!).filter(Boolean);
  }

  private static nodeExists(graph: Graph, nodeId: string): boolean {
    return graph.nodes.some(node => node.id === nodeId);
  }

  private static isNodeInBoundary(node: Node, boundary: Boundary): boolean {
    return node.position.x >= boundary.position.x &&
           node.position.x <= boundary.position.x + boundary.bounds.width &&
           node.position.y >= boundary.position.y &&
           node.position.y <= boundary.position.y + boundary.bounds.height;
  }

  private static calculateCloseness(nodeId: string, graph: Graph, edgeMap: { outgoing: Map<string, Edge[]>; incoming: Map<string, Edge[]> }): number {
    // Simplified closeness calculation
    // In a full implementation, this would calculate shortest paths to all other nodes
    const reachableNodes = new Set<string>();
    const queue = [nodeId];
    const visited = new Set<string>();
    let totalDistance = 0;
    let distance = 0;

    while (queue.length > 0) {
      const levelSize = queue.length;
      distance++;
      
      for (let i = 0; i < levelSize; i++) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        
        visited.add(current);
        if (current !== nodeId) {
          reachableNodes.add(current);
          totalDistance += distance;
        }

        const connected = this.getConnectedNodeIds(current, edgeMap);
        for (const connectedId of connected) {
          if (!visited.has(connectedId)) {
            queue.push(connectedId);
          }
        }
      }
    }

    return reachableNodes.size > 0 ? reachableNodes.size / totalDistance : 0;
  }
}