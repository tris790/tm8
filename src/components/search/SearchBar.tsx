/**
 * SearchBar component for TM8 threat modeling search functionality
 * Provides real-time search with debounced input and keyboard shortcuts
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '../ui/Input';

export interface SearchBarProps {
  onSearch: (query: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onClear?: () => void;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  showShortcuts?: boolean;
  className?: string;
  isSearching?: boolean; // Let parent control search state
}

/**
 * Advanced search bar with keyboard shortcuts and real-time feedback
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onFocus,
  onBlur,
  onClear,
  placeholder = "Search nodes, edges, properties...",
  value: controlledValue,
  disabled = false,
  autoFocus = false,
  showShortcuts = true,
  className = "",
  isSearching = false
}) => {
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use controlled value if provided, otherwise use internal state
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    // Remove double debouncing - let useSearch handle debouncing
    onSearch(newValue);
  };

  const handleClear = () => {
    if (controlledValue === undefined) {
      setInternalValue('');
    }
    onSearch('');
    onClear?.();
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle keyboard shortcuts
    if (e.key === 'Escape') {
      if (value) {
        handleClear();
      } else {
        inputRef.current?.blur();
      }
      e.preventDefault();
    }
    
    if (e.key === 'Enter') {
      // Immediate search on Enter
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      onSearch(value);
      setIsSearching(false);
      e.preventDefault();
    }
  };

  // Global keyboard shortcut to focus search (Ctrl+F or Cmd+F)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  // Click outside handler to remove focus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node) && isFocused) {
        inputRef.current.blur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFocused]);

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);


  return (
    <div className={`search-bar ${isFocused ? 'focused' : ''} ${className}`}>
      <div className="search-input-container">
        {/* Search Icon */}
        <div className="search-icon">
          {isSearching ? (
            <div className="search-spinner">
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                className="animate-spin"
              >
                <circle 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeDasharray="32" 
                  strokeDashoffset="32"
                >
                  <animate 
                    attributeName="stroke-dasharray" 
                    dur="2s" 
                    values="0 32;16 16;0 32;0 32" 
                    repeatCount="indefinite"
                  />
                  <animate 
                    attributeName="stroke-dashoffset" 
                    dur="2s" 
                    values="0;-16;-32;-32" 
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
            </div>
          ) : (
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"/>
              <path d="21 21l-4.35-4.35"/>
            </svg>
          )}
        </div>

        {/* Search Input */}
        <Input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="search-input"
          aria-label="Search graph entities"
          role="searchbox"
          aria-expanded={isFocused}
          autoComplete="off"
          spellCheck={false}
        />

        {/* Clear Button */}
        {value && (
          <button 
            className="clear-button"
            onClick={handleClear}
            disabled={disabled}
            title="Clear search"
            aria-label="Clear search"
          >
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>


      {/* Search Status */}
      {isFocused && (
        <div className="search-status">
          <span className="search-tips">
            Tips: Use quotes for exact matches, * for wildcards
          </span>
        </div>
      )}
    </div>
  );
};

// CSS-in-JS styles (you can move these to a separate CSS file)
const styles = `
.search-bar {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--color-background-secondary, #f8f9fa);
  border: 1px solid var(--color-border, #e1e5e9);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.search-bar.focused .search-input-container {
  border-color: var(--color-primary, #0066cc);
  box-shadow: 0 0 0 3px var(--color-primary-alpha, rgba(0, 102, 204, 0.1));
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-secondary, #6c757d);
  pointer-events: none;
  z-index: 1;
}

.search-spinner {
  color: var(--color-primary, #0066cc);
}

.search-input {
  flex: 1;
  border: none !important;
  background: transparent !important;
  padding: 10px 40px 10px 40px !important;
  font-size: 14px;
  outline: none !important;
  box-shadow: none !important;
}

.search-input::placeholder {
  color: var(--color-text-placeholder, #adb5bd);
}

.clear-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-secondary, #6c757d);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 1;
}

.clear-button:hover {
  background: var(--color-background-tertiary, #e9ecef);
  color: var(--color-text-primary, #212529);
}

.clear-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-shortcuts {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-secondary, #6c757d);
}

.shortcut-hint {
  display: flex;
  align-items: center;
  gap: 2px;
}

.shortcut-hint kbd {
  background: var(--color-background-tertiary, #e9ecef);
  border: 1px solid var(--color-border, #e1e5e9);
  border-radius: 3px;
  padding: 1px 4px;
  font-size: 10px;
  font-family: monospace;
}

.search-status {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-secondary, #6c757d);
}

.search-tips {
  font-style: italic;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .search-input-container {
    background: var(--color-background-secondary-dark, #2d3748);
    border-color: var(--color-border-dark, #4a5568);
  }
  
  .search-bar.focused .search-input-container {
    border-color: var(--color-primary-dark, #4299e1);
    box-shadow: 0 0 0 3px var(--color-primary-alpha-dark, rgba(66, 153, 225, 0.1));
  }
}
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('search-bar-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'search-bar-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}