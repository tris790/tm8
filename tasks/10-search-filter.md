# Task 10: Search & Filter System

## 🎯 Objective
Implement a powerful search and filter system with fuzzy matching, real-time results, and advanced filtering capabilities for large threat model graphs.

## 📋 Deliverables
1. `src/components/search/SearchBar.tsx` - Main search input component
2. `src/components/search/SearchResults.tsx` - Search results display
3. `src/components/search/FilterPanel.tsx` - Advanced filtering options
4. `src/core/search/SearchEngine.ts` - Search algorithm implementation
5. `src/core/search/FilterEngine.ts` - Filtering logic
6. `src/hooks/useSearch.ts` - Search state management hook

## 🔧 Technical Requirements

### Search Bar Component
```typescript
// SearchBar.tsx
interface SearchBarProps {
  onSearch: (query: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  onFocus, 
  onBlur, 
  placeholder = "Search nodes, edges, properties..." 
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  const handleChange = (value: string) => {
    setQuery(value);
    onSearch(value);
  };
  
  return (
    <div className={`search-bar ${isFocused ? 'focused' : ''}`}>
      <SearchIcon className="search-icon" />
      <Input
        value={query}
        onChange={handleChange}
        onFocus={() => { setIsFocused(true); onFocus(); }}
        onBlur={() => { setIsFocused(false); onBlur(); }}
        placeholder={placeholder}
      />
      {query && (
        <button 
          className="clear-button"
          onClick={() => handleChange('')}
        >
          ×
        </button>
      )}
    </div>
  );
};
```

### Search Engine Implementation
```typescript
// SearchEngine.ts
interface SearchResult {
  entity: Node | Edge | Boundary;
  score: number;
  matches: SearchMatch[];
}

interface SearchMatch {
  field: string;
  value: string;
  indices: [number, number][];
}

class SearchEngine {
  private graph: Graph;
  private searchIndex: Map<string, SearchableEntity>;
  
  constructor(graph: Graph) {
    this.graph = graph;
    this.buildSearchIndex();
  }
  
  search(query: string, options: SearchOptions = {}): SearchResult[] {
    if (!query.trim()) return [];
    
    const results: SearchResult[] = [];
    const normalizedQuery = query.toLowerCase();
    
    for (const [id, entity] of this.searchIndex) {
      const score = this.calculateScore(entity, normalizedQuery, options);
      if (score > 0) {
        results.push({
          entity: entity.original,
          score,
          matches: this.findMatches(entity, normalizedQuery)
        });
      }
    }
    
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, options.maxResults || 50);
  }
  
  private calculateScore(entity: SearchableEntity, query: string, options: SearchOptions): number {
    let score = 0;
    
    // Exact name match gets highest score
    if (entity.name.toLowerCase() === query) {
      score += 100;
    }
    // Name starts with query
    else if (entity.name.toLowerCase().startsWith(query)) {
      score += 50;
    }
    // Name contains query
    else if (entity.name.toLowerCase().includes(query)) {
      score += 25;
    }
    // Fuzzy match in name
    else {
      const fuzzyScore = this.fuzzyMatch(entity.name.toLowerCase(), query);
      if (fuzzyScore > 0.6) {
        score += fuzzyScore * 20;
      }
    }
    
    // Search in properties
    for (const [key, value] of Object.entries(entity.properties)) {
      const valueStr = String(value).toLowerCase();
      if (valueStr.includes(query)) {
        score += 10;
      }
    }
    
    // Type-based scoring
    if (options.preferredTypes?.includes(entity.type)) {
      score *= 1.5;
    }
    
    return score;
  }
  
  private fuzzyMatch(text: string, pattern: string): number {
    // Implement fuzzy string matching algorithm
    // Returns score between 0 and 1
    return this.levenshteinDistance(text, pattern) / Math.max(text.length, pattern.length);
  }
  
  private buildSearchIndex(): void {
    this.searchIndex = new Map();
    
    // Index nodes
    for (const node of this.graph.nodes) {
      this.searchIndex.set(node.id, {
        id: node.id,
        name: node.name,
        type: node.type,
        properties: node.properties,
        original: node
      });
    }
    
    // Index edges
    for (const edge of this.graph.edges) {
      this.searchIndex.set(edge.id, {
        id: edge.id,
        name: `${edge.source} → ${edge.targets.join(', ')}`,
        type: edge.type,
        properties: edge.properties,
        original: edge
      });
    }
    
    // Index boundaries
    for (const boundary of this.graph.boundaries) {
      this.searchIndex.set(boundary.id, {
        id: boundary.id,
        name: boundary.name,
        type: boundary.type,
        properties: boundary.properties,
        original: boundary
      });
    }
  }
}
```

### Filter System
```typescript
// FilterEngine.ts
interface FilterOptions {
  nodeTypes: NodeType[];
  edgeTypes: EdgeType[];
  boundaryTypes: BoundaryType[];
  hasProperties: string[];
  propertyFilters: PropertyFilter[];
  dateRange?: { start: Date; end: Date };
}

interface PropertyFilter {
  key: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than';
  value: any;
}

class FilterEngine {
  static apply(graph: Graph, filters: FilterOptions): Graph {
    const filteredNodes = graph.nodes.filter(node => 
      this.matchesNodeFilters(node, filters)
    );
    
    const filteredEdges = graph.edges.filter(edge => 
      this.matchesEdgeFilters(edge, filters, filteredNodes)
    );
    
    const filteredBoundaries = graph.boundaries.filter(boundary => 
      this.matchesBoundaryFilters(boundary, filters)
    );
    
    return {
      ...graph,
      nodes: filteredNodes,
      edges: filteredEdges,
      boundaries: filteredBoundaries
    };
  }
  
  private static matchesNodeFilters(node: Node, filters: FilterOptions): boolean {
    // Type filter
    if (filters.nodeTypes.length > 0 && !filters.nodeTypes.includes(node.type)) {
      return false;
    }
    
    // Property existence filter
    for (const requiredProp of filters.hasProperties) {
      if (!(requiredProp in node.properties)) {
        return false;
      }
    }
    
    // Property value filters
    for (const filter of filters.propertyFilters) {
      if (!this.matchesPropertyFilter(node.properties, filter)) {
        return false;
      }
    }
    
    return true;
  }
  
  private static matchesPropertyFilter(properties: Record<string, any>, filter: PropertyFilter): boolean {
    const value = properties[filter.key];
    if (value === undefined) return false;
    
    switch (filter.operator) {
      case 'equals':
        return value === filter.value;
      case 'contains':
        return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
      case 'starts_with':
        return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase());
      case 'greater_than':
        return Number(value) > Number(filter.value);
      case 'less_than':
        return Number(value) < Number(filter.value);
      default:
        return false;
    }
  }
}
```

### Search Hook
```typescript
// useSearch.ts
interface UseSearchResult {
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  filters: FilterOptions;
  setQuery: (query: string) => void;
  setFilters: (filters: FilterOptions) => void;
  clearSearch: () => void;
}

export const useSearch = (graph: Graph): UseSearchResult => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    nodeTypes: [],
    edgeTypes: [],
    boundaryTypes: [],
    hasProperties: [],
    propertyFilters: []
  });
  
  const searchEngine = useMemo(() => new SearchEngine(graph), [graph]);
  
  const debouncedSearch = useCallback(
    debounce((searchQuery: string, searchFilters: FilterOptions) => {
      setIsSearching(true);
      
      let searchResults: SearchResult[] = [];
      if (searchQuery.trim()) {
        searchResults = searchEngine.search(searchQuery, {
          preferredTypes: searchFilters.nodeTypes,
          maxResults: 100
        });
      }
      
      setResults(searchResults);
      setIsSearching(false);
    }, 300),
    [searchEngine]
  );
  
  useEffect(() => {
    debouncedSearch(query, filters);
  }, [query, filters, debouncedSearch]);
  
  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };
  
  return {
    query,
    results,
    isSearching,
    filters,
    setQuery,
    setFilters,
    clearSearch
  };
};
```

## 🎨 Visual Components

### Search Results Display
```typescript
// SearchResults.tsx
interface SearchResultsProps {
  results: SearchResult[];
  onSelect: (entityId: string) => void;
  onClose: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onSelect, onClose }) => {
  return (
    <div className="search-results">
      <div className="search-results-header">
        <span>{results.length} results</span>
        <button onClick={onClose}>×</button>
      </div>
      
      <div className="search-results-list">
        {results.map(result => (
          <div 
            key={result.entity.id}
            className="search-result-item"
            onClick={() => onSelect(result.entity.id)}
          >
            <div className="result-icon">
              <EntityIcon type={result.entity.type} />
            </div>
            <div className="result-content">
              <div className="result-name">
                <HighlightedText 
                  text={result.entity.name} 
                  matches={result.matches}
                />
              </div>
              <div className="result-type">{result.entity.type}</div>
            </div>
            <div className="result-score">{Math.round(result.score)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## ✅ Acceptance Criteria
- [x] Search works across all entity types (nodes, edges, boundaries)
- [x] Fuzzy matching handles typos and partial matches
- [x] Real-time search with debounced input
- [x] Results are ranked by relevance
- [x] Search includes entity properties
- [x] Advanced filters work (type, properties, date range)
- [x] Search results are highlighted in canvas
- [x] Performance remains good with large datasets

## 🔗 Dependencies
- Task 05: Graph Data Structures (Graph interface)
- Task 06: UI Components (Input, Button)
- Task 02: Core Types (Node, Edge, Boundary)

## ⚡ Performance Notes
- Debounce search input to avoid excessive queries
- Build search index once and update incrementally
- Limit search results to prevent UI lag
- Use Web Workers for complex search operations