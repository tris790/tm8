/**
 * Advanced filtering engine for TM8 graphs
 * Supports complex filtering logic with high performance
 */

import { Graph, Node, Edge, Boundary } from '../types/graph';
import { NodeType, EdgeType, BoundaryType } from '../types/enums';

export interface FilterOptions {
  nodeTypes: NodeType[];
  edgeTypes: EdgeType[];
  boundaryTypes: BoundaryType[];
  hasProperties: string[];
  propertyFilters: PropertyFilter[];
  dateRange?: { start: Date; end: Date };
  customFilters?: CustomFilter[];
  includeConnections?: boolean; // Include connected entities even if they don't match
  isolatedOnly?: boolean; // Show only isolated nodes
  connectedOnly?: boolean; // Show only connected nodes
}

export interface PropertyFilter {
  key: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'not_equals' | 'exists' | 'not_exists' | 'regex';
  value: any;
  caseSensitive?: boolean;
}

export interface CustomFilter {
  name: string;
  description: string;
  predicate: (entity: Node | Edge | Boundary, graph: Graph) => boolean;
  entityTypes: ('node' | 'edge' | 'boundary')[];
}

export interface FilteredGraph {
  nodes: Node[];
  edges: Edge[];
  boundaries: Boundary[];
  metadata: {
    originalNodeCount: number;
    originalEdgeCount: number;
    originalBoundaryCount: number;
    filteredNodeCount: number;
    filteredEdgeCount: number;
    filteredBoundaryCount: number;
    filterTime: number;
  };
}

export interface FilterStats {
  totalEntities: number;
  matchedEntities: number;
  filterTime: number;
  filtersPassed: string[];
  filtersFailed: string[];
}

/**
 * High-performance filtering engine with advanced capabilities
 */
export class FilterEngine {
  private static readonly DEFAULT_DATE_PROPERTY = 'created';

  /**
   * Apply filters to a graph and return filtered result
   */
  static apply(graph: Graph, filters: FilterOptions): FilteredGraph {
    const startTime = performance.now();
    
    // Step 1: Filter nodes
    const filteredNodes = graph.nodes.filter(node => 
      this.matchesNodeFilters(node, filters, graph)
    );

    // Step 2: Filter edges based on node availability and edge filters
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = graph.edges.filter(edge => {
      // Check if edge passes its own filters
      if (!this.matchesEdgeFilters(edge, filters, graph)) {
        return false;
      }

      // Check if source and at least one target exist in filtered nodes
      if (!nodeIds.has(edge.source)) {
        return false;
      }

      const hasValidTarget = edge.targets.some(target => nodeIds.has(target));
      return hasValidTarget;
    });

    // Step 3: Filter boundaries
    const filteredBoundaries = graph.boundaries.filter(boundary => 
      this.matchesBoundaryFilters(boundary, filters, graph)
    );

    // Step 4: Handle connection-based filtering
    let finalNodes = filteredNodes;
    let finalEdges = filteredEdges;

    if (filters.includeConnections) {
      const result = this.includeConnectedEntities(filteredNodes, filteredEdges, graph);
      finalNodes = result.nodes;
      finalEdges = result.edges;
    }

    if (filters.isolatedOnly) {
      finalNodes = this.filterIsolatedNodes(finalNodes, finalEdges);
    }

    if (filters.connectedOnly) {
      finalNodes = this.filterConnectedNodes(finalNodes, finalEdges);
    }

    const filterTime = performance.now() - startTime;

    return {
      nodes: finalNodes,
      edges: finalEdges,
      boundaries: filteredBoundaries,
      metadata: {
        originalNodeCount: graph.nodes.length,
        originalEdgeCount: graph.edges.length,
        originalBoundaryCount: graph.boundaries.length,
        filteredNodeCount: finalNodes.length,
        filteredEdgeCount: finalEdges.length,
        filteredBoundaryCount: filteredBoundaries.length,
        filterTime
      }
    };
  }

  /**
   * Test if a single node matches the filter criteria
   */
  static testNode(node: Node, filters: FilterOptions, graph: Graph): boolean {
    return this.matchesNodeFilters(node, filters, graph);
  }

  /**
   * Test if a single edge matches the filter criteria
   */
  static testEdge(edge: Edge, filters: FilterOptions, graph: Graph): boolean {
    return this.matchesEdgeFilters(edge, filters, graph);
  }

  /**
   * Test if a single boundary matches the filter criteria
   */
  static testBoundary(boundary: Boundary, filters: FilterOptions, graph: Graph): boolean {
    return this.matchesBoundaryFilters(boundary, filters, graph);
  }

  /**
   * Get statistics about how filters are performing
   */
  static getFilterStats(graph: Graph, filters: FilterOptions): FilterStats {
    const startTime = performance.now();
    let matchedEntities = 0;
    const totalEntities = graph.nodes.length + graph.edges.length + graph.boundaries.length;

    // Count matches
    for (const node of graph.nodes) {
      if (this.matchesNodeFilters(node, filters, graph)) {
        matchedEntities++;
      }
    }

    for (const edge of graph.edges) {
      if (this.matchesEdgeFilters(edge, filters, graph)) {
        matchedEntities++;
      }
    }

    for (const boundary of graph.boundaries) {
      if (this.matchesBoundaryFilters(boundary, filters, graph)) {
        matchedEntities++;
      }
    }

    const filterTime = performance.now() - startTime;

    return {
      totalEntities,
      matchedEntities,
      filterTime,
      filtersPassed: [], // Could be enhanced to track which specific filters passed
      filtersFailed: []  // Could be enhanced to track which specific filters failed
    };
  }

  /**
   * Create common filter presets
   */
  static createPreset(presetName: string): FilterOptions {
    switch (presetName) {
      case 'processes-only':
        return {
          nodeTypes: [NodeType.PROCESS],
          edgeTypes: [],
          boundaryTypes: [],
          hasProperties: [],
          propertyFilters: []
        };

      case 'data-flows':
        return {
          nodeTypes: [NodeType.PROCESS, NodeType.DATASTORE],
          edgeTypes: [EdgeType.HTTPS, EdgeType.GRPC],
          boundaryTypes: [],
          hasProperties: [],
          propertyFilters: []
        };

      case 'external-entities':
        return {
          nodeTypes: [NodeType.EXTERNAL_ENTITY],
          edgeTypes: [],
          boundaryTypes: [],
          hasProperties: [],
          propertyFilters: []
        };

      case 'trust-boundaries':
        return {
          nodeTypes: [],
          edgeTypes: [],
          boundaryTypes: [BoundaryType.TRUST_BOUNDARY],
          hasProperties: [],
          propertyFilters: []
        };

      case 'isolated-nodes':
        return {
          nodeTypes: [],
          edgeTypes: [],
          boundaryTypes: [],
          hasProperties: [],
          propertyFilters: [],
          isolatedOnly: true
        };

      default:
        return this.createEmptyFilter();
    }
  }

  /**
   * Create an empty filter (shows everything)
   */
  static createEmptyFilter(): FilterOptions {
    return {
      nodeTypes: [],
      edgeTypes: [],
      boundaryTypes: [],
      hasProperties: [],
      propertyFilters: []
    };
  }

  // =================
  // PRIVATE METHODS
  // =================

  private static matchesNodeFilters(node: Node, filters: FilterOptions, graph: Graph): boolean {
    // Type filter
    if (filters.nodeTypes.length > 0 && !filters.nodeTypes.includes(node.type)) {
      return false;
    }

    // Property existence filter
    if (!this.hasRequiredProperties(node.properties, filters.hasProperties)) {
      return false;
    }

    // Property value filters
    if (!this.matchesPropertyFilters(node.properties, filters.propertyFilters)) {
      return false;
    }

    // Date range filter
    if (filters.dateRange && !this.matchesDateRange(node.properties, filters.dateRange)) {
      return false;
    }

    // Custom filters
    if (filters.customFilters) {
      for (const customFilter of filters.customFilters) {
        if (customFilter.entityTypes.includes('node')) {
          if (!customFilter.predicate(node, graph)) {
            return false;
          }
        }
      }
    }

    return true;
  }

  private static matchesEdgeFilters(edge: Edge, filters: FilterOptions, graph: Graph): boolean {
    // Type filter
    if (filters.edgeTypes.length > 0 && !filters.edgeTypes.includes(edge.type)) {
      return false;
    }

    // Property existence filter
    if (!this.hasRequiredProperties(edge.properties, filters.hasProperties)) {
      return false;
    }

    // Property value filters
    if (!this.matchesPropertyFilters(edge.properties, filters.propertyFilters)) {
      return false;
    }

    // Date range filter
    if (filters.dateRange && !this.matchesDateRange(edge.properties, filters.dateRange)) {
      return false;
    }

    // Custom filters
    if (filters.customFilters) {
      for (const customFilter of filters.customFilters) {
        if (customFilter.entityTypes.includes('edge')) {
          if (!customFilter.predicate(edge, graph)) {
            return false;
          }
        }
      }
    }

    return true;
  }

  private static matchesBoundaryFilters(boundary: Boundary, filters: FilterOptions, graph: Graph): boolean {
    // Type filter
    if (filters.boundaryTypes.length > 0 && !filters.boundaryTypes.includes(boundary.type)) {
      return false;
    }

    // Property existence filter
    if (!this.hasRequiredProperties(boundary.properties, filters.hasProperties)) {
      return false;
    }

    // Property value filters
    if (!this.matchesPropertyFilters(boundary.properties, filters.propertyFilters)) {
      return false;
    }

    // Date range filter
    if (filters.dateRange && !this.matchesDateRange(boundary.properties, filters.dateRange)) {
      return false;
    }

    // Custom filters
    if (filters.customFilters) {
      for (const customFilter of filters.customFilters) {
        if (customFilter.entityTypes.includes('boundary')) {
          if (!customFilter.predicate(boundary, graph)) {
            return false;
          }
        }
      }
    }

    return true;
  }

  private static hasRequiredProperties(properties: Record<string, any>, requiredProps: string[]): boolean {
    for (const requiredProp of requiredProps) {
      if (!(requiredProp in properties)) {
        return false;
      }
    }
    return true;
  }

  private static matchesPropertyFilters(properties: Record<string, any>, propertyFilters: PropertyFilter[]): boolean {
    for (const filter of propertyFilters) {
      if (!this.matchesPropertyFilter(properties, filter)) {
        return false;
      }
    }
    return true;
  }

  private static matchesPropertyFilter(properties: Record<string, any>, filter: PropertyFilter): boolean {
    const value = properties[filter.key];
    const { operator, value: filterValue, caseSensitive = false } = filter;

    switch (operator) {
      case 'exists':
        return filter.key in properties;

      case 'not_exists':
        return !(filter.key in properties);

      case 'equals':
        return value === filterValue;

      case 'not_equals':
        return value !== filterValue;

      case 'contains':
        if (value === undefined || value === null) return false;
        const valueStr = String(value);
        const filterStr = String(filterValue);
        return caseSensitive 
          ? valueStr.includes(filterStr)
          : valueStr.toLowerCase().includes(filterStr.toLowerCase());

      case 'starts_with':
        if (value === undefined || value === null) return false;
        const startValueStr = String(value);
        const startFilterStr = String(filterValue);
        return caseSensitive
          ? startValueStr.startsWith(startFilterStr)
          : startValueStr.toLowerCase().startsWith(startFilterStr.toLowerCase());

      case 'ends_with':
        if (value === undefined || value === null) return false;
        const endValueStr = String(value);
        const endFilterStr = String(filterValue);
        return caseSensitive
          ? endValueStr.endsWith(endFilterStr)
          : endValueStr.toLowerCase().endsWith(endFilterStr.toLowerCase());

      case 'greater_than':
        return Number(value) > Number(filterValue);

      case 'less_than':
        return Number(value) < Number(filterValue);

      case 'regex':
        if (value === undefined || value === null) return false;
        try {
          const regex = new RegExp(String(filterValue), caseSensitive ? 'g' : 'gi');
          return regex.test(String(value));
        } catch {
          return false; // Invalid regex
        }

      default:
        return false;
    }
  }

  private static matchesDateRange(properties: Record<string, any>, dateRange: { start: Date; end: Date }): boolean {
    // Look for common date properties
    const dateProperties = ['created', 'modified', 'updated', 'date', 'timestamp'];
    
    for (const dateProp of dateProperties) {
      if (dateProp in properties) {
        const dateValue = this.parseDate(properties[dateProp]);
        if (dateValue) {
          return dateValue >= dateRange.start && dateValue <= dateRange.end;
        }
      }
    }

    // If no date properties found, include the entity (assume it passes the filter)
    return true;
  }

  private static parseDate(value: any): Date | null {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }

    return null;
  }

  private static includeConnectedEntities(
    filteredNodes: Node[],
    filteredEdges: Edge[],
    originalGraph: Graph
  ): { nodes: Node[]; edges: Edge[] } {
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const connectedNodeIds = new Set<string>();

    // Find all nodes connected to filtered nodes
    for (const edge of originalGraph.edges) {
      if (nodeIds.has(edge.source)) {
        edge.targets.forEach(target => connectedNodeIds.add(target));
      }
      
      for (const target of edge.targets) {
        if (nodeIds.has(target)) {
          connectedNodeIds.add(edge.source);
        }
      }
    }

    // Add connected nodes that weren't already included
    const additionalNodes = originalGraph.nodes.filter(node => 
      connectedNodeIds.has(node.id) && !nodeIds.has(node.id)
    );

    const allNodes = [...filteredNodes, ...additionalNodes];
    const allNodeIds = new Set(allNodes.map(n => n.id));

    // Include edges that connect any of the nodes
    const additionalEdges = originalGraph.edges.filter(edge => {
      const hasValidSource = allNodeIds.has(edge.source);
      const hasValidTarget = edge.targets.some(target => allNodeIds.has(target));
      return hasValidSource && hasValidTarget;
    });

    return {
      nodes: allNodes,
      edges: additionalEdges
    };
  }

  private static filterIsolatedNodes(nodes: Node[], edges: Edge[]): Node[] {
    const connectedNodeIds = new Set<string>();

    // Mark all nodes that are connected via edges
    for (const edge of edges) {
      connectedNodeIds.add(edge.source);
      edge.targets.forEach(target => connectedNodeIds.add(target));
    }

    // Return only nodes that are NOT connected
    return nodes.filter(node => !connectedNodeIds.has(node.id));
  }

  private static filterConnectedNodes(nodes: Node[], edges: Edge[]): Node[] {
    const connectedNodeIds = new Set<string>();

    // Mark all nodes that are connected via edges
    for (const edge of edges) {
      connectedNodeIds.add(edge.source);
      edge.targets.forEach(target => connectedNodeIds.add(target));
    }

    // Return only nodes that ARE connected
    return nodes.filter(node => connectedNodeIds.has(node.id));
  }

  /**
   * Advanced filtering utilities
   */
  static createComplexFilter(conditions: Array<{
    field: string;
    operator: PropertyFilter['operator'];
    value: any;
    logicalOperator?: 'AND' | 'OR';
  }>): PropertyFilter[] {
    // For now, we only support AND logic between filters
    // OR logic would require a more complex filter structure
    return conditions.map(condition => ({
      key: condition.field,
      operator: condition.operator,
      value: condition.value
    }));
  }

  /**
   * Performance optimization: pre-compile filters for repeated use
   */
  static compileFilter(filters: FilterOptions): (entity: Node | Edge | Boundary, graph: Graph) => boolean {
    return (entity: Node | Edge | Boundary, graph: Graph) => {
      if ('position' in entity) {
        // It's a Node or Boundary
        if ('bounds' in entity) {
          // It's a Boundary
          return this.matchesBoundaryFilters(entity as Boundary, filters, graph);
        } else {
          // It's a Node
          return this.matchesNodeFilters(entity as Node, filters, graph);
        }
      } else {
        // It's an Edge
        return this.matchesEdgeFilters(entity as Edge, filters, graph);
      }
    };
  }
}