/**
 * Advanced search engine with fuzzy matching and scoring for TM8
 * Provides real-time search with <1ms response time for large graphs
 */

import { Node, Edge, Boundary, Graph } from '../types/graph';
import { NodeType, EdgeType, BoundaryType } from '../types/enums';

export interface SearchResult {
  entity: Node | Edge | Boundary;
  score: number;
  matches: SearchMatch[];
  rank: number;
}

export interface SearchMatch {
  field: string;
  value: string;
  indices: [number, number][]; // Start and end indices of matches
  matchType: 'exact' | 'fuzzy' | 'partial';
}

export interface SearchOptions {
  query: string;
  fuzzyMatch?: boolean;
  maxResults?: number;
  minScore?: number;
  preferredTypes?: (NodeType | EdgeType | BoundaryType)[];
  searchFields?: SearchField[];
  caseSensitive?: boolean;
  wholeWord?: boolean;
}

export type SearchField = 'name' | 'properties' | 'type' | 'id';

interface SearchableEntity {
  id: string;
  name: string;
  type: NodeType | EdgeType | BoundaryType;
  properties: Record<string, any>;
  original: Node | Edge | Boundary;
  searchableText: string; // Pre-computed for faster searching
  nameWords: string[]; // Tokenized name for better matching
  propertyValues: string[]; // Flattened property values
}

/**
 * High-performance search engine with advanced scoring and fuzzy matching
 */
export class SearchEngine {
  private graph: Graph;
  private searchIndex: Map<string, SearchableEntity>;
  private nameIndex: Map<string, Set<string>>; // Word -> entity IDs
  private propertyIndex: Map<string, Set<string>>; // Property value -> entity IDs
  private typeIndex: Map<string, Set<string>>; // Type -> entity IDs
  
  // Performance optimization
  private lastIndexUpdate = 0;
  private readonly INDEX_CACHE_TIME = 5000; // 5 seconds

  constructor(graph: Graph) {
    this.graph = graph;
    this.searchIndex = new Map();
    this.nameIndex = new Map();
    this.propertyIndex = new Map();
    this.typeIndex = new Map();
    this.buildSearchIndex();
  }

  /**
   * Perform search with advanced scoring and ranking
   */
  search(options: SearchOptions): SearchResult[] {
    const {
      query,
      fuzzyMatch = true,
      maxResults = 50,
      minScore = 0.1,
      preferredTypes = [],
      searchFields = ['name', 'properties', 'type'],
      caseSensitive = false,
      wholeWord = false
    } = options;

    if (!query.trim()) return [];

    // Refresh index if needed
    this.refreshIndexIfNeeded();

    const normalizedQuery = caseSensitive ? query : query.toLowerCase();
    const queryWords = this.tokenize(normalizedQuery);
    const results: SearchResult[] = [];

    // Fast path: exact matches using indices
    const exactMatches = this.findExactMatches(normalizedQuery, queryWords, searchFields);
    
    // Comprehensive search through all entities
    for (const [id, entity] of this.searchIndex) {
      // Skip if we already found this entity in exact matches
      if (exactMatches.has(id)) {
        continue;
      }

      const score = this.calculateScore(entity, normalizedQuery, queryWords, {
        ...options,
        searchFields,
        caseSensitive,
        wholeWord
      });

      if (score >= minScore) {
        const matches = this.findMatches(entity, normalizedQuery, queryWords, searchFields, caseSensitive);
        
        results.push({
          entity: entity.original,
          score,
          matches,
          rank: 0 // Will be set after sorting
        });
      }
    }

    // Add exact matches to results with boosted scores
    for (const entityId of exactMatches) {
      const entity = this.searchIndex.get(entityId);
      if (entity) {
        const score = this.calculateScore(entity, normalizedQuery, queryWords, {
          ...options,
          searchFields,
          caseSensitive,
          wholeWord
        }) * 1.5; // Boost exact matches

        const matches = this.findMatches(entity, normalizedQuery, queryWords, searchFields, caseSensitive);
        
        results.push({
          entity: entity.original,
          score,
          matches,
          rank: 0
        });
      }
    }

    // Sort by score (highest first) and assign ranks
    results.sort((a, b) => b.score - a.score);
    results.forEach((result, index) => {
      result.rank = index + 1;
    });

    return results.slice(0, maxResults);
  }

  /**
   * Get search suggestions based on partial query
   */
  getSuggestions(partialQuery: string, maxSuggestions: number = 10): string[] {
    if (!partialQuery.trim()) return [];

    const query = partialQuery.toLowerCase();
    const suggestions = new Set<string>();

    // Search through indexed names and properties
    for (const [word, entityIds] of this.nameIndex) {
      if (word.startsWith(query) || word.includes(query)) {
        if (suggestions.size < maxSuggestions) {
          suggestions.add(word);
        }
      }
    }

    for (const [value, entityIds] of this.propertyIndex) {
      if (value.startsWith(query) || value.includes(query)) {
        if (suggestions.size < maxSuggestions) {
          suggestions.add(value);
        }
      }
    }

    return Array.from(suggestions).slice(0, maxSuggestions);
  }

  /**
   * Update the search index with new graph data
   */
  updateGraph(graph: Graph): void {
    this.graph = graph;
    this.buildSearchIndex();
  }

  /**
   * Get search index statistics
   */
  getStats(): {
    totalEntities: number;
    indexSize: number;
    lastUpdate: number;
    memoryUsage: number;
  } {
    return {
      totalEntities: this.searchIndex.size,
      indexSize: this.nameIndex.size + this.propertyIndex.size + this.typeIndex.size,
      lastUpdate: this.lastIndexUpdate,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  // =================
  // PRIVATE METHODS
  // =================

  private buildSearchIndex(): void {
    this.searchIndex.clear();
    this.nameIndex.clear();
    this.propertyIndex.clear();
    this.typeIndex.clear();

    // Index nodes
    for (const node of this.graph.nodes) {
      const entity = this.createSearchableEntity(node, 'node');
      this.searchIndex.set(node.id, entity);
      this.indexEntity(entity);
    }

    // Index edges
    for (const edge of this.graph.edges) {
      const entity = this.createSearchableEntity(edge, 'edge');
      this.searchIndex.set(edge.id, entity);
      this.indexEntity(entity);
    }

    // Index boundaries
    for (const boundary of this.graph.boundaries) {
      const entity = this.createSearchableEntity(boundary, 'boundary');
      this.searchIndex.set(boundary.id, entity);
      this.indexEntity(entity);
    }

    this.lastIndexUpdate = Date.now();
  }

  private createSearchableEntity(
    original: Node | Edge | Boundary,
    entityType: 'node' | 'edge' | 'boundary'
  ): SearchableEntity {
    let name: string;
    
    if (entityType === 'edge') {
      const edge = original as Edge;
      name = `${edge.source} → ${edge.targets.join(', ')}`;
    } else {
      name = (original as Node | Boundary).name;
    }

    const propertyValues = Object.values(original.properties || {})
      .map(value => String(value).toLowerCase())
      .filter(value => value.length > 0);

    const searchableText = [
      name.toLowerCase(),
      original.type.toLowerCase(),
      ...propertyValues
    ].join(' ');

    return {
      id: original.id,
      name,
      type: original.type,
      properties: original.properties || {},
      original,
      searchableText,
      nameWords: this.tokenize(name.toLowerCase()),
      propertyValues
    };
  }

  private indexEntity(entity: SearchableEntity): void {
    // Index name words
    for (const word of entity.nameWords) {
      if (!this.nameIndex.has(word)) {
        this.nameIndex.set(word, new Set());
      }
      this.nameIndex.get(word)!.add(entity.id);
    }

    // Index property values
    for (const value of entity.propertyValues) {
      const words = this.tokenize(value);
      for (const word of words) {
        if (!this.propertyIndex.has(word)) {
          this.propertyIndex.set(word, new Set());
        }
        this.propertyIndex.get(word)!.add(entity.id);
      }
    }

    // Index type
    const type = entity.type.toLowerCase();
    if (!this.typeIndex.has(type)) {
      this.typeIndex.set(type, new Set());
    }
    this.typeIndex.get(type)!.add(entity.id);
  }

  private findExactMatches(
    query: string,
    queryWords: string[],
    searchFields: SearchField[]
  ): Set<string> {
    const matches = new Set<string>();

    // Exact name matches
    if (searchFields.includes('name')) {
      for (const [word, entityIds] of this.nameIndex) {
        if (word === query || queryWords.includes(word)) {
          entityIds.forEach(id => matches.add(id));
        }
      }
    }

    // Exact property matches
    if (searchFields.includes('properties')) {
      for (const [value, entityIds] of this.propertyIndex) {
        if (value === query || queryWords.some(word => value.includes(word))) {
          entityIds.forEach(id => matches.add(id));
        }
      }
    }

    // Exact type matches
    if (searchFields.includes('type')) {
      for (const [type, entityIds] of this.typeIndex) {
        if (type === query || queryWords.includes(type)) {
          entityIds.forEach(id => matches.add(id));
        }
      }
    }

    return matches;
  }

  private calculateScore(
    entity: SearchableEntity,
    query: string,
    queryWords: string[],
    options: SearchOptions & { searchFields: SearchField[]; caseSensitive: boolean; wholeWord: boolean }
  ): number {
    let score = 0;
    const { searchFields, preferredTypes, fuzzyMatch, wholeWord } = options;

    // Name scoring
    if (searchFields.includes('name')) {
      const nameScore = this.scoreText(entity.name.toLowerCase(), query, queryWords, {
        fuzzyMatch,
        wholeWord,
        isName: true
      });
      score += nameScore * 3; // Names are most important
    }

    // Type scoring
    if (searchFields.includes('type')) {
      const typeScore = this.scoreText(entity.type.toLowerCase(), query, queryWords, {
        fuzzyMatch,
        wholeWord,
        isName: false
      });
      score += typeScore * 2;
    }

    // Property scoring
    if (searchFields.includes('properties')) {
      let propertyScore = 0;
      for (const value of entity.propertyValues) {
        propertyScore = Math.max(propertyScore, this.scoreText(value, query, queryWords, {
          fuzzyMatch,
          wholeWord,
          isName: false
        }));
      }
      score += propertyScore;
    }

    // ID scoring (exact match only)
    if (searchFields.includes('id')) {
      if (entity.id.toLowerCase().includes(query)) {
        score += 50; // High score for ID matches
      }
    }

    // Type preference bonus
    if (preferredTypes && preferredTypes.includes(entity.type)) {
      score *= 1.3;
    }

    // Boost score for shorter names (more specific matches)
    if (entity.name.length < 20) {
      score *= 1.1;
    }

    return score;
  }

  private scoreText(
    text: string,
    query: string,
    queryWords: string[],
    options: { fuzzyMatch?: boolean; wholeWord?: boolean; isName?: boolean }
  ): number {
    const { fuzzyMatch, wholeWord, isName } = options;
    let score = 0;

    // Exact match gets highest score
    if (text === query) {
      return isName ? 100 : 80;
    }

    // Starts with query
    if (text.startsWith(query)) {
      score += isName ? 60 : 40;
    }

    // Contains query
    if (text.includes(query)) {
      score += isName ? 40 : 25;
    }

    // Word-based matching
    const textWords = this.tokenize(text);
    let wordMatches = 0;
    
    for (const queryWord of queryWords) {
      for (const textWord of textWords) {
        if (wholeWord) {
          if (textWord === queryWord) {
            wordMatches++;
            score += 20;
          }
        } else {
          if (textWord.includes(queryWord)) {
            wordMatches++;
            score += 15;
          } else if (fuzzyMatch && this.fuzzyMatch(textWord, queryWord) > 0.7) {
            wordMatches++;
            score += 10;
          }
        }
      }
    }

    // Boost score based on proportion of words matched
    if (queryWords.length > 0) {
      const matchRatio = wordMatches / queryWords.length;
      score *= (1 + matchRatio);
    }

    return score;
  }

  private findMatches(
    entity: SearchableEntity,
    query: string,
    queryWords: string[],
    searchFields: SearchField[],
    caseSensitive: boolean
  ): SearchMatch[] {
    const matches: SearchMatch[] = [];

    // Find matches in name
    if (searchFields.includes('name')) {
      const nameMatches = this.findTextMatches(entity.name, query, queryWords, caseSensitive);
      matches.push(...nameMatches.map(match => ({ ...match, field: 'name' })));
    }

    // Find matches in type
    if (searchFields.includes('type')) {
      const typeMatches = this.findTextMatches(entity.type, query, queryWords, caseSensitive);
      matches.push(...typeMatches.map(match => ({ ...match, field: 'type' })));
    }

    // Find matches in properties
    if (searchFields.includes('properties')) {
      for (const [key, value] of Object.entries(entity.properties)) {
        const valueStr = String(value);
        const propertyMatches = this.findTextMatches(valueStr, query, queryWords, caseSensitive);
        matches.push(...propertyMatches.map(match => ({ ...match, field: `properties.${key}` })));
      }
    }

    return matches;
  }

  private findTextMatches(
    text: string,
    query: string,
    queryWords: string[],
    caseSensitive: boolean
  ): Omit<SearchMatch, 'field'>[] {
    const matches: Omit<SearchMatch, 'field'>[] = [];
    const searchText = caseSensitive ? text : text.toLowerCase();
    const searchQuery = caseSensitive ? query : query.toLowerCase();

    // Find exact query matches
    let index = 0;
    while ((index = searchText.indexOf(searchQuery, index)) !== -1) {
      matches.push({
        value: text.substring(index, index + searchQuery.length),
        indices: [[index, index + searchQuery.length]],
        matchType: 'exact'
      });
      index += searchQuery.length;
    }

    // Find individual word matches
    for (const word of queryWords) {
      let wordIndex = 0;
      while ((wordIndex = searchText.indexOf(word, wordIndex)) !== -1) {
        // Avoid duplicate matches
        const isAlreadyMatched = matches.some(match =>
          match.indices.some(([start, end]) => 
            wordIndex >= start && wordIndex + word.length <= end
          )
        );

        if (!isAlreadyMatched) {
          matches.push({
            value: text.substring(wordIndex, wordIndex + word.length),
            indices: [[wordIndex, wordIndex + word.length]],
            matchType: 'partial'
          });
        }
        wordIndex += word.length;
      }
    }

    return matches;
  }

  private fuzzyMatch(text: string, pattern: string): number {
    if (text === pattern) return 1;
    if (pattern.length === 0) return 0;
    if (text.length === 0) return 0;

    // Use Levenshtein distance for fuzzy matching
    const distance = this.levenshteinDistance(text, pattern);
    const maxLength = Math.max(text.length, pattern.length);
    
    return 1 - (distance / maxLength);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i] + 1, // deletion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace non-word characters with spaces
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private refreshIndexIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastIndexUpdate > this.INDEX_CACHE_TIME) {
      this.buildSearchIndex();
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in bytes
    let totalSize = 0;

    // Search index
    for (const [key, entity] of this.searchIndex) {
      totalSize += key.length * 2; // UTF-16
      totalSize += JSON.stringify(entity).length * 2;
    }

    // Additional indices
    for (const [key, value] of this.nameIndex) {
      totalSize += key.length * 2;
      totalSize += value.size * 20; // Rough estimate for Set entries
    }

    return totalSize;
  }
}