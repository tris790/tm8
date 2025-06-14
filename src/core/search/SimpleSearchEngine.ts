/**
 * Lightweight search engine for real-time name-based search
 * Optimized for speed over advanced features - <50ms search time
 */

import { Node, Edge, Boundary, Graph } from '../types/graph';

export interface SimpleSearchResult {
  entity: Node | Edge | Boundary;
  relevance: number; // Simple relevance: 0-100
  matchType: 'exact' | 'starts_with' | 'contains';
}

export interface SimpleSearchOptions {
  query: string;
  maxResults?: number;
  searchNodes?: boolean;
  searchEdges?: boolean;
  searchBoundaries?: boolean;
}

/**
 * Ultra-fast search engine for real-time typing
 * No indexing, no complex scoring - just direct string matching
 */
export class SimpleSearchEngine {
  private graph: Graph;

  constructor(graph: Graph) {
    this.graph = graph;
  }

  /**
   * Fast search - optimized for <50ms response time
   */
  search(options: SimpleSearchOptions): SimpleSearchResult[] {
    const {
      query,
      maxResults = 20,
      searchNodes = true,
      searchEdges = true,
      searchBoundaries = true
    } = options;

    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 1) return [];
    
    // For very short queries, return fewer results to maintain speed
    const actualMaxResults = trimmedQuery.length === 1 ? Math.min(maxResults, 5) : maxResults;

    const lowerQuery = trimmedQuery.toLowerCase();
    const results: SimpleSearchResult[] = [];

    // Search nodes
    if (searchNodes) {
      for (const node of this.graph.nodes) {
        const match = this.matchEntity(node.name, lowerQuery);
        if (match) {
          results.push({
            entity: node,
            relevance: match.relevance,
            matchType: match.type
          });
        }
        
        // Early exit if we have enough results
        if (results.length >= actualMaxResults * 2) break;
      }
    }

    // Search edges (by source -> target pattern)
    if (searchEdges) {
      for (const edge of this.graph.edges) {
        const edgeName = `${edge.source} → ${edge.targets.join(', ')}`;
        const match = this.matchEntity(edgeName, lowerQuery);
        if (match) {
          results.push({
            entity: edge,
            relevance: match.relevance,
            matchType: match.type
          });
        }
        
        // Early exit if we have enough results
        if (results.length >= actualMaxResults * 2) break;
      }
    }

    // Search boundaries
    if (searchBoundaries) {
      for (const boundary of this.graph.boundaries) {
        const match = this.matchEntity(boundary.name, lowerQuery);
        if (match) {
          results.push({
            entity: boundary,
            relevance: match.relevance,
            matchType: match.type
          });
        }
        
        // Early exit if we have enough results
        if (results.length >= actualMaxResults * 2) break;
      }
    }

    // Sort by relevance (highest first) and return top results
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, actualMaxResults);
  }

  /**
   * Update graph reference (lightweight - no re-indexing needed)
   */
  updateGraph(graph: Graph): void {
    this.graph = graph;
  }

  /**
   * Fast entity name matching with simple relevance scoring
   */
  private matchEntity(entityName: string, lowerQuery: string): { relevance: number; type: 'exact' | 'starts_with' | 'contains' } | null {
    const lowerName = entityName.toLowerCase();
    
    // Exact match (highest relevance)
    if (lowerName === lowerQuery) {
      return { relevance: 100, type: 'exact' };
    }
    
    // Starts with match (high relevance)
    if (lowerName.startsWith(lowerQuery)) {
      // Shorter names get higher relevance for starts_with
      const lengthFactor = Math.max(0, 100 - entityName.length);
      return { relevance: 80 + lengthFactor * 0.1, type: 'starts_with' };
    }
    
    // Contains match (medium relevance)
    if (lowerName.includes(lowerQuery)) {
      // Earlier position in string gets higher relevance
      const position = lowerName.indexOf(lowerQuery);
      const positionFactor = Math.max(0, 100 - position * 2);
      const lengthFactor = Math.max(0, 100 - entityName.length);
      return { 
        relevance: 40 + positionFactor * 0.2 + lengthFactor * 0.05, 
        type: 'contains' 
      };
    }
    
    return null;
  }
}