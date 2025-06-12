/**
 * useSearch hook for managing search state and functionality
 * Provides debounced search, filtering, and result management
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Graph } from '../core/types/graph';
import { SearchEngine, SearchResult, SearchOptions } from '../core/search/SearchEngine';
import { FilterEngine, FilterOptions, FilteredGraph } from '../core/search/FilterEngine';

export interface UseSearchOptions {
  debounceMs?: number;
  maxResults?: number;
  enableFilters?: boolean;
  enableHistory?: boolean;
}

export interface UseSearchResult {
  // Search state
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  searchTime: number;
  
  // Filter state
  filters: FilterOptions;
  filteredGraph: FilteredGraph | null;
  isFiltering: boolean;
  filterTime: number;
  
  // Search actions
  setQuery: (query: string) => void;
  search: (query: string, options?: Partial<SearchOptions>) => void;
  clearSearch: () => void;
  
  // Filter actions
  setFilters: (filters: FilterOptions) => void;
  applyFilters: () => void;
  clearFilters: () => void;
  
  // History
  searchHistory: string[];
  clearHistory: () => void;
  
  // Combined state
  finalResults: SearchResult[];
  resultCount: number;
  
  // Utilities
  getSuggestions: (partialQuery: string) => string[];
  getStats: () => {
    searchStats: any;
    filterStats: any;
  };
}

/**
 * Comprehensive search hook with filtering and history
 */
export const useSearch = (
  graph: Graph,
  options: UseSearchOptions = {}
): UseSearchResult => {
  const {
    debounceMs = 300,
    maxResults = 100,
    enableFilters = true,
    enableHistory = true
  } = options;

  // Search state
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);

  // Filter state
  const [filters, setFiltersState] = useState<FilterOptions>({
    nodeTypes: [],
    edgeTypes: [],
    boundaryTypes: [],
    hasProperties: [],
    propertyFilters: []
  });
  const [filteredGraph, setFilteredGraph] = useState<FilteredGraph | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterTime, setFilterTime] = useState(0);

  // History state
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Refs for cleanup and optimization
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const filterTimeoutRef = useRef<NodeJS.Timeout>();
  const searchEngineRef = useRef<SearchEngine | null>(null);

  // Initialize/update search engine when graph changes
  useEffect(() => {
    searchEngineRef.current = new SearchEngine(graph);
  }, [graph]);

  // Debounced search function
  const debouncedSearch = useCallback((searchQuery: string, searchOptions?: Partial<SearchOptions>) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(() => {
      if (!searchEngineRef.current) {
        setIsSearching(false);
        return;
      }

      const startTime = performance.now();
      
      try {
        const searchResults = searchQuery.trim() 
          ? searchEngineRef.current.search({
              query: searchQuery,
              maxResults,
              fuzzyMatch: true,
              searchFields: ['name', 'properties', 'type'],
              ...searchOptions
            })
          : [];

        setResults(searchResults);
        setSearchTime(performance.now() - startTime);
        
        // Add to history if enabled and query is not empty
        if (enableHistory && searchQuery.trim() && !searchHistory.includes(searchQuery.trim())) {
          setSearchHistory(prev => [searchQuery.trim(), ...prev.slice(0, 9)]); // Keep last 10
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);
  }, [debounceMs, maxResults, enableHistory, searchHistory]);

  // Debounced filter function
  const debouncedFilter = useCallback(() => {
    if (!enableFilters) return;

    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }

    setIsFiltering(true);

    filterTimeoutRef.current = setTimeout(() => {
      const startTime = performance.now();
      
      try {
        const filtered = FilterEngine.apply(graph, filters);
        setFilteredGraph(filtered);
        setFilterTime(performance.now() - startTime);
      } catch (error) {
        console.error('Filter error:', error);
        setFilteredGraph(null);
      } finally {
        setIsFiltering(false);
      }
    }, 100); // Shorter debounce for filters
  }, [graph, filters, enableFilters]);

  // Auto-apply filters when they change
  useEffect(() => {
    if (enableFilters) {
      debouncedFilter();
    }
  }, [filters, debouncedFilter, enableFilters]);

  // Search when query changes
  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, []);

  // Public API functions
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
  }, []);

  const search = useCallback((searchQuery: string, searchOptions?: Partial<SearchOptions>) => {
    setQueryState(searchQuery);
    debouncedSearch(searchQuery, searchOptions);
  }, [debouncedSearch]);

  const clearSearch = useCallback(() => {
    setQueryState('');
    setResults([]);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setIsSearching(false);
  }, []);

  const setFilters = useCallback((newFilters: FilterOptions) => {
    setFiltersState(newFilters);
  }, []);

  const applyFilters = useCallback(() => {
    debouncedFilter();
  }, [debouncedFilter]);

  const clearFilters = useCallback(() => {
    setFiltersState({
      nodeTypes: [],
      edgeTypes: [],
      boundaryTypes: [],
      hasProperties: [],
      propertyFilters: []
    });
    setFilteredGraph(null);
  }, []);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  const getSuggestions = useCallback((partialQuery: string): string[] => {
    if (!searchEngineRef.current) return [];
    return searchEngineRef.current.getSuggestions(partialQuery);
  }, []);

  const getStats = useCallback(() => {
    const searchStats = searchEngineRef.current?.getStats() || {
      totalEntities: 0,
      indexSize: 0,
      lastUpdate: 0,
      memoryUsage: 0
    };

    const filterStats = filteredGraph ? {
      originalCount: filteredGraph.metadata.originalNodeCount + 
                    filteredGraph.metadata.originalEdgeCount + 
                    filteredGraph.metadata.originalBoundaryCount,
      filteredCount: filteredGraph.metadata.filteredNodeCount + 
                    filteredGraph.metadata.filteredEdgeCount + 
                    filteredGraph.metadata.filteredBoundaryCount,
      filterTime: filteredGraph.metadata.filterTime
    } : null;

    return { searchStats, filterStats };
  }, [filteredGraph]);

  // Calculate final results (intersection of search and filter results)
  const finalResults = useMemo(() => {
    if (!enableFilters || !filteredGraph) {
      return results;
    }

    // If both search and filters are active, intersect the results
    if (query.trim() && results.length > 0) {
      const filteredEntityIds = new Set([
        ...filteredGraph.nodes.map(n => n.id),
        ...filteredGraph.edges.map(e => e.id),
        ...filteredGraph.boundaries.map(b => b.id)
      ]);

      return results.filter(result => filteredEntityIds.has(result.entity.id));
    }

    // If only filters are active, return all filtered entities as search results
    if (!query.trim()) {
      const mockResults: SearchResult[] = [
        ...filteredGraph.nodes.map((node, index) => ({
          entity: node,
          score: 100 - index, // Arbitrary scoring for filtered-only results
          matches: [],
          rank: index + 1
        })),
        ...filteredGraph.edges.map((edge, index) => ({
          entity: edge,
          score: 100 - index,
          matches: [],
          rank: filteredGraph.nodes.length + index + 1
        })),
        ...filteredGraph.boundaries.map((boundary, index) => ({
          entity: boundary,
          score: 100 - index,
          matches: [],
          rank: filteredGraph.nodes.length + filteredGraph.edges.length + index + 1
        }))
      ];

      return mockResults.slice(0, maxResults);
    }

    return results;
  }, [results, filteredGraph, query, enableFilters, maxResults]);

  const resultCount = useMemo(() => {
    return finalResults.length;
  }, [finalResults]);

  return {
    // Search state
    query,
    results,
    isSearching,
    searchTime,
    
    // Filter state
    filters,
    filteredGraph,
    isFiltering,
    filterTime,
    
    // Search actions
    setQuery,
    search,
    clearSearch,
    
    // Filter actions
    setFilters,
    applyFilters,
    clearFilters,
    
    // History
    searchHistory,
    clearHistory,
    
    // Combined state
    finalResults,
    resultCount,
    
    // Utilities
    getSuggestions,
    getStats
  };
};

/**
 * Simplified search hook for basic use cases
 */
export const useSimpleSearch = (graph: Graph, debounceMs: number = 300) => {
  const {
    query,
    results,
    isSearching,
    setQuery,
    search,
    clearSearch,
    getSuggestions
  } = useSearch(graph, {
    debounceMs,
    enableFilters: false,
    enableHistory: false
  });

  return {
    query,
    results,
    isSearching,
    setQuery,
    search,
    clearSearch,
    getSuggestions
  };
};

/**
 * Hook for filter-only functionality
 */
export const useFilters = (graph: Graph) => {
  const {
    filters,
    filteredGraph,
    isFiltering,
    filterTime,
    setFilters,
    applyFilters,
    clearFilters
  } = useSearch(graph, {
    enableFilters: true,
    enableHistory: false
  });

  return {
    filters,
    filteredGraph,
    isFiltering,
    filterTime,
    setFilters,
    applyFilters,
    clearFilters
  };
};

export default useSearch;