/**
 * SearchResults component for displaying search results
 * Shows ranked results with highlighting and entity type icons
 */

import React, { useMemo, useCallback, useState } from 'react';
import { SearchResult } from '../../core/search/SearchEngine';
import { NodeType, EdgeType, BoundaryType } from '../../core/types/enums';
import { Node, Edge, Boundary } from '../../core/types/graph';

export interface SearchResultsProps {
  results: SearchResult[];
  onSelect: (entityId: string) => void;
  onClose: () => void;
  onPreview?: (entityId: string) => void;
  maxHeight?: number;
  showScores?: boolean;
  groupByType?: boolean;
  className?: string;
}

interface GroupedResults {
  nodes: SearchResult[];
  edges: SearchResult[];
  boundaries: SearchResult[];
}

/**
 * Component for displaying search results with rich interaction
 */
export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  onSelect,
  onClose,
  onPreview,
  maxHeight = 400,
  showScores = false,
  groupByType = false,
  className = ""
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);

  // Group results by entity type if requested
  const groupedResults = useMemo((): GroupedResults => {
    if (!groupByType) {
      return { nodes: [], edges: [], boundaries: [] };
    }

    return results.reduce((groups, result) => {
      const entity = result.entity;
      if ('position' in entity && 'bounds' in entity) {
        groups.boundaries.push(result);
      } else if ('position' in entity) {
        groups.nodes.push(result);
      } else {
        groups.edges.push(result);
      }
      return groups;
    }, { nodes: [], edges: [], boundaries: [] } as GroupedResults);
  }, [results, groupByType]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          onSelect(results[selectedIndex].entity.id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [results, selectedIndex, onSelect, onClose]);

  // Handle mouse hover for preview
  const handleMouseEnter = useCallback((entityId: string) => {
    setHoveredEntityId(entityId);
    onPreview?.(entityId);
  }, [onPreview]);

  const handleMouseLeave = useCallback(() => {
    setHoveredEntityId(null);
  }, []);

  if (results.length === 0) {
    return null;
  }

  return (
    <div 
      className={`search-results ${className}`}
      style={{ maxHeight }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="listbox"
      aria-label="Search results"
    >
      {/* Header */}
      <div className="search-results-header">
        <span className="results-count">
          {results.length} result{results.length !== 1 ? 's' : ''}
        </span>
        <button 
          className="close-button"
          onClick={onClose}
          title="Close search results"
          aria-label="Close search results"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Results List */}
      <div className="search-results-list">
        {groupByType ? (
          <GroupedResultsList 
            groupedResults={groupedResults}
            selectedIndex={selectedIndex}
            hoveredEntityId={hoveredEntityId}
            showScores={showScores}
            onSelect={onSelect}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
        ) : (
          <FlatResultsList 
            results={results}
            selectedIndex={selectedIndex}
            hoveredEntityId={hoveredEntityId}
            showScores={showScores}
            onSelect={onSelect}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
        )}
      </div>

      {/* Footer with keyboard hints */}
      <div className="search-results-footer">
        <span className="keyboard-hints">
          <kbd>↑↓</kbd> navigate • <kbd>Enter</kbd> select • <kbd>Esc</kbd> close
        </span>
      </div>
    </div>
  );
};

// Component for flat (ungrouped) results list
interface FlatResultsListProps {
  results: SearchResult[];
  selectedIndex: number;
  hoveredEntityId: string | null;
  showScores: boolean;
  onSelect: (entityId: string) => void;
  onMouseEnter: (entityId: string) => void;
  onMouseLeave: () => void;
}

const FlatResultsList: React.FC<FlatResultsListProps> = ({
  results,
  selectedIndex,
  hoveredEntityId,
  showScores,
  onSelect,
  onMouseEnter,
  onMouseLeave
}) => (
  <>
    {results.map((result, index) => (
      <SearchResultItem
        key={result.entity.id}
        result={result}
        isSelected={index === selectedIndex}
        isHovered={hoveredEntityId === result.entity.id}
        showScore={showScores}
        onSelect={onSelect}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    ))}
  </>
);

// Component for grouped results list
interface GroupedResultsListProps {
  groupedResults: GroupedResults;
  selectedIndex: number;
  hoveredEntityId: string | null;
  showScores: boolean;
  onSelect: (entityId: string) => void;
  onMouseEnter: (entityId: string) => void;
  onMouseLeave: () => void;
}

const GroupedResultsList: React.FC<GroupedResultsListProps> = ({
  groupedResults,
  selectedIndex,
  hoveredEntityId,
  showScores,
  onSelect,
  onMouseEnter,
  onMouseLeave
}) => {
  let currentIndex = 0;

  return (
    <>
      {groupedResults.nodes.length > 0 && (
        <>
          <div className="results-group-header">
            <EntityIcon type={NodeType.PROCESS} />
            <span>Nodes ({groupedResults.nodes.length})</span>
          </div>
          {groupedResults.nodes.map((result) => (
            <SearchResultItem
              key={result.entity.id}
              result={result}
              isSelected={currentIndex++ === selectedIndex}
              isHovered={hoveredEntityId === result.entity.id}
              showScore={showScores}
              onSelect={onSelect}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
            />
          ))}
        </>
      )}

      {groupedResults.edges.length > 0 && (
        <>
          <div className="results-group-header">
            <EntityIcon type={EdgeType.HTTPS} />
            <span>Edges ({groupedResults.edges.length})</span>
          </div>
          {groupedResults.edges.map((result) => (
            <SearchResultItem
              key={result.entity.id}
              result={result}
              isSelected={currentIndex++ === selectedIndex}
              isHovered={hoveredEntityId === result.entity.id}
              showScore={showScores}
              onSelect={onSelect}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
            />
          ))}
        </>
      )}

      {groupedResults.boundaries.length > 0 && (
        <>
          <div className="results-group-header">
            <EntityIcon type={BoundaryType.TRUST_BOUNDARY} />
            <span>Boundaries ({groupedResults.boundaries.length})</span>
          </div>
          {groupedResults.boundaries.map((result) => (
            <SearchResultItem
              key={result.entity.id}
              result={result}
              isSelected={currentIndex++ === selectedIndex}
              isHovered={hoveredEntityId === result.entity.id}
              showScore={showScores}
              onSelect={onSelect}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
            />
          ))}
        </>
      )}
    </>
  );
};

// Individual search result item
interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  isHovered: boolean;
  showScore: boolean;
  onSelect: (entityId: string) => void;
  onMouseEnter: (entityId: string) => void;
  onMouseLeave: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  isSelected,
  isHovered,
  showScore,
  onSelect,
  onMouseEnter,
  onMouseLeave
}) => {
  const entity = result.entity;
  const entityName = getEntityName(entity);

  return (
    <div 
      className={`search-result-item ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
      onClick={() => onSelect(entity.id)}
      onMouseEnter={() => onMouseEnter(entity.id)}
      onMouseLeave={onMouseLeave}
      role="option"
      aria-selected={isSelected}
    >
      {/* Entity Icon */}
      <div className="result-icon">
        <EntityIcon type={entity.type} />
      </div>

      {/* Content */}
      <div className="result-content">
        <div className="result-name">
          <HighlightedText 
            text={entityName} 
            matches={result.matches.filter(m => m.field === 'name')}
          />
        </div>
        <div className="result-type">{entity.type}</div>
        {result.matches.length > 0 && (
          <div className="result-matches">
            {result.matches.slice(0, 2).map((match, index) => (
              <span key={index} className="match-preview">
                {match.field}: <HighlightedText text={match.value} matches={[match]} />
              </span>
            ))}
            {result.matches.length > 2 && (
              <span className="more-matches">
                +{result.matches.length - 2} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Score */}
      {showScore && (
        <div className="result-score">
          <span className="score-value">{Math.round(result.score)}</span>
          <span className="score-rank">#{result.rank}</span>
        </div>
      )}
    </div>
  );
};

// Component for highlighting matched text
interface HighlightedTextProps {
  text: string;
  matches: { indices: [number, number][] }[];
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ text, matches }) => {
  if (!matches.length) {
    return <span>{text}</span>;
  }

  // Flatten all match indices and sort them
  const allIndices = matches
    .flatMap(match => match.indices)
    .sort((a, b) => a[0] - b[0]);

  if (!allIndices.length) {
    return <span>{text}</span>;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  allIndices.forEach(([start, end], index) => {
    // Add text before the match
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }

    // Add highlighted match
    parts.push(
      <mark key={index} className="search-highlight">
        {text.slice(start, end)}
      </mark>
    );

    lastIndex = end;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span>{parts}</span>;
};

// Component for entity type icons
interface EntityIconProps {
  type: NodeType | EdgeType | BoundaryType;
  size?: number;
}

const EntityIcon: React.FC<EntityIconProps> = ({ type, size = 16 }) => {
  const getIcon = () => {
    switch (type) {
      case NodeType.PROCESS:
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
          </svg>
        );
      case NodeType.DATASTORE:
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
          </svg>
        );
      case NodeType.EXTERNAL_ENTITY:
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="M21 15l-3.086-3.086a2 2 0 00-2.828 0L6 21"/>
          </svg>
        );
      case NodeType.SERVICE:
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        );
      case EdgeType.HTTPS:
      case EdgeType.GRPC:
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="7" y1="17" x2="17" y2="7"/>
            <polyline points="17,7 17,17 7,17"/>
          </svg>
        );
      case BoundaryType.TRUST_BOUNDARY:
      case BoundaryType.NETWORK_ZONE:
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeDasharray="5,5"/>
          </svg>
        );
      default:
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        );
    }
  };

  return <div className="entity-icon">{getIcon()}</div>;
};

// Helper function to get entity name
const getEntityName = (entity: Node | Edge | Boundary): string => {
  if ('source' in entity) {
    // It's an Edge
    return `${entity.source} → ${entity.targets.join(', ')}`;
  }
  // It's a Node or Boundary
  return entity.name;
};

// Add default export
export default SearchResults;