import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { SearchBar } from '../search/SearchBar';
import { SearchResults } from '../search/SearchResults';
import { SearchResult } from '../../core/search/SearchEngine';
import '../../styles/components/header.css';

interface HeaderProps {
  onSearch: (query: string) => void;
  onImport: () => void;
  onExport: () => void;
  searchQuery: string;
  searchResults: SearchResult[];
  onSelectSearchResult?: (entityId: string) => void;
  isSearching?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onSearch, 
  onImport, 
  onExport, 
  searchQuery, 
  searchResults,
  onSelectSearchResult,
  isSearching = false
}) => {
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Show results when there's a query and results exist
  useEffect(() => {
    setShowResults(searchQuery.trim().length > 0 && searchResults.length > 0);
  }, [searchQuery, searchResults]);

  // Handle clicking outside search to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchResultSelect = (entityId: string) => {
    setShowResults(false);
    onSelectSearchResult?.(entityId);
  };

  const handleSearchResultsClose = () => {
    setShowResults(false);
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo-section">
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="var(--color-primary)"/>
              <path d="M8 12h16M8 16h16M8 20h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="app-title">Threat Modeler</h1>
        </div>
      </div>
      
      <div className="header-center">
        <div className="search-section" ref={searchContainerRef}>
          <SearchBar
            onSearch={onSearch}
            placeholder="Search nodes, edges, boundaries..."
            value={searchQuery}
            isSearching={isSearching}
          />
          {showResults && (
            <div className="search-results-overlay">
              <SearchResults
                results={searchResults}
                onSelect={handleSearchResultSelect}
                onClose={handleSearchResultsClose}
                maxHeight={400}
                showScores={false}
                groupByType={true}
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="header-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={onImport}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 14h12M8 2v8M5 7l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Import
        </Button>
        
        <Button
          variant="primary"
          size="sm"
          onClick={onExport}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v8M5 7l3-3 3 3M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Export
        </Button>
      </div>
    </header>
  );
};