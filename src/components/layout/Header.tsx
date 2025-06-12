import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import '../../styles/components/header.css';

interface HeaderProps {
  onSearch: (query: string) => void;
  onImport: () => void;
  onExport: () => void;
  searchQuery: string;
  searchResults: any[];
}

export const Header: React.FC<HeaderProps> = ({ 
  onSearch, 
  onImport, 
  onExport, 
  searchQuery, 
  searchResults 
}) => {

  const handleSearchChange = (value: string) => {
    onSearch(value);
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
        <div className="search-section">
          <Input
            type="search"
            placeholder="Search nodes, edges, properties..."
            value={searchQuery}
            onChange={handleSearchChange}
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667zM14 14l-2.9-2.9" 
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
          />
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