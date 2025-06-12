/**
 * FilterPanel component for advanced graph filtering
 * Provides UI for complex filtering options with real-time preview
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { FilterOptions, PropertyFilter } from '../../core/search/FilterEngine';
import { NodeType, EdgeType, BoundaryType } from '../../core/types/enums';

export interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onApply?: () => void;
  onClear?: () => void;
  onClose?: () => void;
  availableProperties?: string[];
  isOpen: boolean;
  className?: string;
  showPreview?: boolean;
  resultCount?: number;
}

/**
 * Advanced filter panel with multiple filter types and presets
 */
export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  onApply,
  onClear,
  onClose,
  availableProperties = [],
  isOpen,
  className = "",
  showPreview = true,
  resultCount
}) => {
  const [activeTab, setActiveTab] = useState<'types' | 'properties' | 'advanced'>('types');
  const [newPropertyFilter, setNewPropertyFilter] = useState<Partial<PropertyFilter>>({
    key: '',
    operator: 'equals',
    value: ''
  });

  // Handle type selection changes
  const handleTypeChange = useCallback((
    entityType: 'node' | 'edge' | 'boundary',
    type: NodeType | EdgeType | BoundaryType,
    checked: boolean
  ) => {
    const updatedFilters = { ...filters };
    
    if (entityType === 'node') {
      const nodeTypes = new Set(updatedFilters.nodeTypes);
      if (checked) {
        nodeTypes.add(type as NodeType);
      } else {
        nodeTypes.delete(type as NodeType);
      }
      updatedFilters.nodeTypes = Array.from(nodeTypes);
    } else if (entityType === 'edge') {
      const edgeTypes = new Set(updatedFilters.edgeTypes);
      if (checked) {
        edgeTypes.add(type as EdgeType);
      } else {
        edgeTypes.delete(type as EdgeType);
      }
      updatedFilters.edgeTypes = Array.from(edgeTypes);
    } else if (entityType === 'boundary') {
      const boundaryTypes = new Set(updatedFilters.boundaryTypes);
      if (checked) {
        boundaryTypes.add(type as BoundaryType);
      } else {
        boundaryTypes.delete(type as BoundaryType);
      }
      updatedFilters.boundaryTypes = Array.from(boundaryTypes);
    }
    
    onFiltersChange(updatedFilters);
  }, [filters, onFiltersChange]);

  // Handle property filter changes
  const handlePropertyFilterAdd = useCallback(() => {
    if (!newPropertyFilter.key || newPropertyFilter.value === undefined) {
      return;
    }

    const propertyFilter: PropertyFilter = {
      key: newPropertyFilter.key,
      operator: newPropertyFilter.operator || 'equals',
      value: newPropertyFilter.value,
      caseSensitive: newPropertyFilter.caseSensitive || false
    };

    const updatedFilters = {
      ...filters,
      propertyFilters: [...filters.propertyFilters, propertyFilter]
    };

    onFiltersChange(updatedFilters);
    setNewPropertyFilter({ key: '', operator: 'equals', value: '' });
  }, [filters, newPropertyFilter, onFiltersChange]);

  const handlePropertyFilterRemove = useCallback((index: number) => {
    const updatedFilters = {
      ...filters,
      propertyFilters: filters.propertyFilters.filter((_, i) => i !== index)
    };
    onFiltersChange(updatedFilters);
  }, [filters, onFiltersChange]);

  // Handle required properties
  const handleRequiredPropertyAdd = useCallback((property: string) => {
    if (!property || filters.hasProperties.includes(property)) {
      return;
    }

    const updatedFilters = {
      ...filters,
      hasProperties: [...filters.hasProperties, property]
    };
    onFiltersChange(updatedFilters);
  }, [filters, onFiltersChange]);

  const handleRequiredPropertyRemove = useCallback((property: string) => {
    const updatedFilters = {
      ...filters,
      hasProperties: filters.hasProperties.filter(p => p !== property)
    };
    onFiltersChange(updatedFilters);
  }, [filters, onFiltersChange]);

  // Handle advanced options
  const handleAdvancedOptionChange = useCallback((
    option: 'includeConnections' | 'isolatedOnly' | 'connectedOnly',
    value: boolean
  ) => {
    const updatedFilters = { ...filters, [option]: value };
    onFiltersChange(updatedFilters);
  }, [filters, onFiltersChange]);

  // Clear all filters
  const handleClearAll = useCallback(() => {
    const emptyFilters: FilterOptions = {
      nodeTypes: [],
      edgeTypes: [],
      boundaryTypes: [],
      hasProperties: [],
      propertyFilters: []
    };
    onFiltersChange(emptyFilters);
    onClear?.();
  }, [onFiltersChange, onClear]);

  // Apply preset filters
  const handlePresetApply = useCallback((presetName: string) => {
    let presetFilters: FilterOptions;
    
    switch (presetName) {
      case 'processes-only':
        presetFilters = { ...filters, nodeTypes: [NodeType.PROCESS] };
        break;
      case 'data-flows':
        presetFilters = { 
          ...filters, 
          nodeTypes: [NodeType.PROCESS, NodeType.DATASTORE],
          edgeTypes: [EdgeType.HTTPS, EdgeType.GRPC]
        };
        break;
      case 'external-entities':
        presetFilters = { ...filters, nodeTypes: [NodeType.EXTERNAL_ENTITY] };
        break;
      case 'trust-boundaries':
        presetFilters = { ...filters, boundaryTypes: [BoundaryType.TRUST_BOUNDARY] };
        break;
      case 'isolated-nodes':
        presetFilters = { ...filters, isolatedOnly: true };
        break;
      default:
        return;
    }
    
    onFiltersChange(presetFilters);
  }, [filters, onFiltersChange]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    return filters.nodeTypes.length + 
           filters.edgeTypes.length + 
           filters.boundaryTypes.length + 
           filters.hasProperties.length + 
           filters.propertyFilters.length +
           (filters.includeConnections ? 1 : 0) +
           (filters.isolatedOnly ? 1 : 0) +
           (filters.connectedOnly ? 1 : 0);
  }, [filters]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={`filter-panel ${className}`}>
      {/* Header */}
      <div className="filter-panel-header">
        <h3>Filter Graph</h3>
        <div className="header-actions">
          {showPreview && resultCount !== undefined && (
            <span className="result-preview">
              {resultCount} results
            </span>
          )}
          <button 
            className="close-button"
            onClick={onClose}
            title="Close filter panel"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="filter-presets">
        <h4>Quick Filters</h4>
        <div className="preset-buttons">
          <Button 
            size="small" 
            variant="outline"
            onClick={() => handlePresetApply('processes-only')}
          >
            Processes Only
          </Button>
          <Button 
            size="small" 
            variant="outline"
            onClick={() => handlePresetApply('data-flows')}
          >
            Data Flows
          </Button>
          <Button 
            size="small" 
            variant="outline"
            onClick={() => handlePresetApply('external-entities')}
          >
            External Entities
          </Button>
          <Button 
            size="small" 
            variant="outline"
            onClick={() => handlePresetApply('trust-boundaries')}
          >
            Trust Boundaries
          </Button>
          <Button 
            size="small" 
            variant="outline"
            onClick={() => handlePresetApply('isolated-nodes')}
          >
            Isolated Nodes
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`tab ${activeTab === 'types' ? 'active' : ''}`}
          onClick={() => setActiveTab('types')}
        >
          Entity Types
        </button>
        <button 
          className={`tab ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          Properties
        </button>
        <button 
          className={`tab ${activeTab === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced')}
        >
          Advanced
        </button>
      </div>

      {/* Filter Content */}
      <div className="filter-content">
        {activeTab === 'types' && (
          <TypeFilters 
            filters={filters}
            onTypeChange={handleTypeChange}
          />
        )}

        {activeTab === 'properties' && (
          <PropertyFilters 
            filters={filters}
            newPropertyFilter={newPropertyFilter}
            setNewPropertyFilter={setNewPropertyFilter}
            availableProperties={availableProperties}
            onPropertyFilterAdd={handlePropertyFilterAdd}
            onPropertyFilterRemove={handlePropertyFilterRemove}
            onRequiredPropertyAdd={handleRequiredPropertyAdd}
            onRequiredPropertyRemove={handleRequiredPropertyRemove}
          />
        )}

        {activeTab === 'advanced' && (
          <AdvancedFilters 
            filters={filters}
            onAdvancedOptionChange={handleAdvancedOptionChange}
          />
        )}
      </div>

      {/* Footer */}
      <div className="filter-panel-footer">
        <div className="filter-status">
          {activeFilterCount > 0 && (
            <span className="active-filters">
              {activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="footer-actions">
          <Button 
            variant="outline" 
            onClick={handleClearAll}
            disabled={activeFilterCount === 0}
          >
            Clear All
          </Button>
          <Button 
            variant="primary" 
            onClick={onApply}
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

// Type Filters Tab Component
interface TypeFiltersProps {
  filters: FilterOptions;
  onTypeChange: (entityType: 'node' | 'edge' | 'boundary', type: any, checked: boolean) => void;
}

const TypeFilters: React.FC<TypeFiltersProps> = ({ filters, onTypeChange }) => (
  <div className="type-filters">
    {/* Node Types */}
    <div className="filter-group">
      <h5>Node Types</h5>
      <div className="checkbox-group">
        {Object.values(NodeType).map(type => (
          <label key={type} className="checkbox-item">
            <input
              type="checkbox"
              checked={filters.nodeTypes.includes(type)}
              onChange={(e) => onTypeChange('node', type, e.target.checked)}
            />
            <span className="checkbox-label">{type}</span>
          </label>
        ))}
      </div>
    </div>

    {/* Edge Types */}
    <div className="filter-group">
      <h5>Edge Types</h5>
      <div className="checkbox-group">
        {Object.values(EdgeType).map(type => (
          <label key={type} className="checkbox-item">
            <input
              type="checkbox"
              checked={filters.edgeTypes.includes(type)}
              onChange={(e) => onTypeChange('edge', type, e.target.checked)}
            />
            <span className="checkbox-label">{type}</span>
          </label>
        ))}
      </div>
    </div>

    {/* Boundary Types */}
    <div className="filter-group">
      <h5>Boundary Types</h5>
      <div className="checkbox-group">
        {Object.values(BoundaryType).map(type => (
          <label key={type} className="checkbox-item">
            <input
              type="checkbox"
              checked={filters.boundaryTypes.includes(type)}
              onChange={(e) => onTypeChange('boundary', type, e.target.checked)}
            />
            <span className="checkbox-label">{type}</span>
          </label>
        ))}
      </div>
    </div>
  </div>
);

// Property Filters Tab Component
interface PropertyFiltersProps {
  filters: FilterOptions;
  newPropertyFilter: Partial<PropertyFilter>;
  setNewPropertyFilter: (filter: Partial<PropertyFilter>) => void;
  availableProperties: string[];
  onPropertyFilterAdd: () => void;
  onPropertyFilterRemove: (index: number) => void;
  onRequiredPropertyAdd: (property: string) => void;
  onRequiredPropertyRemove: (property: string) => void;
}

const PropertyFilters: React.FC<PropertyFiltersProps> = ({
  filters,
  newPropertyFilter,
  setNewPropertyFilter,
  availableProperties,
  onPropertyFilterAdd,
  onPropertyFilterRemove,
  onRequiredPropertyAdd,
  onRequiredPropertyRemove
}) => (
  <div className="property-filters">
    {/* Required Properties */}
    <div className="filter-group">
      <h5>Required Properties</h5>
      <div className="property-selector">
        <Select
          value=""
          onChange={(value) => onRequiredPropertyAdd(value)}
          options={availableProperties
            .filter(prop => !filters.hasProperties.includes(prop))
            .map(prop => ({ value: prop, label: prop }))}
          placeholder="Select property..."
        />
      </div>
      <div className="selected-properties">
        {filters.hasProperties.map(property => (
          <span key={property} className="property-tag">
            {property}
            <button onClick={() => onRequiredPropertyRemove(property)}>×</button>
          </span>
        ))}
      </div>
    </div>

    {/* Property Value Filters */}
    <div className="filter-group">
      <h5>Property Value Filters</h5>
      
      {/* Add New Filter */}
      <div className="new-property-filter">
        <Input
          value={newPropertyFilter.key || ''}
          onChange={(value) => setNewPropertyFilter({ ...newPropertyFilter, key: value })}
          placeholder="Property name"
        />
        <Select
          value={newPropertyFilter.operator || 'equals'}
          onChange={(value) => setNewPropertyFilter({ ...newPropertyFilter, operator: value as PropertyFilter['operator'] })}
          options={[
            { value: 'equals', label: 'Equals' },
            { value: 'contains', label: 'Contains' },
            { value: 'starts_with', label: 'Starts with' },
            { value: 'ends_with', label: 'Ends with' },
            { value: 'greater_than', label: 'Greater than' },
            { value: 'less_than', label: 'Less than' },
            { value: 'not_equals', label: 'Not equals' },
            { value: 'regex', label: 'Regex' }
          ]}
        />
        <Input
          value={newPropertyFilter.value || ''}
          onChange={(value) => setNewPropertyFilter({ ...newPropertyFilter, value })}
          placeholder="Value"
        />
        <Button 
          size="small"
          onClick={onPropertyFilterAdd}
          disabled={!newPropertyFilter.key || newPropertyFilter.value === undefined}
        >
          Add
        </Button>
      </div>

      {/* Existing Filters */}
      <div className="existing-property-filters">
        {filters.propertyFilters.map((filter, index) => (
          <div key={index} className="property-filter-item">
            <span className="filter-description">
              <strong>{filter.key}</strong> {filter.operator} <em>{filter.value}</em>
            </span>
            <button onClick={() => onPropertyFilterRemove(index)}>×</button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Advanced Filters Tab Component
interface AdvancedFiltersProps {
  filters: FilterOptions;
  onAdvancedOptionChange: (option: 'includeConnections' | 'isolatedOnly' | 'connectedOnly', value: boolean) => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ filters, onAdvancedOptionChange }) => (
  <div className="advanced-filters">
    <div className="filter-group">
      <h5>Connection Options</h5>
      
      <label className="checkbox-item">
        <input
          type="checkbox"
          checked={filters.includeConnections || false}
          onChange={(e) => onAdvancedOptionChange('includeConnections', e.target.checked)}
        />
        <span className="checkbox-label">Include connected entities</span>
        <span className="checkbox-description">
          Show entities connected to filtered results
        </span>
      </label>

      <label className="checkbox-item">
        <input
          type="checkbox"
          checked={filters.isolatedOnly || false}
          onChange={(e) => onAdvancedOptionChange('isolatedOnly', e.target.checked)}
        />
        <span className="checkbox-label">Show isolated nodes only</span>
        <span className="checkbox-description">
          Only show nodes with no connections
        </span>
      </label>

      <label className="checkbox-item">
        <input
          type="checkbox"
          checked={filters.connectedOnly || false}
          onChange={(e) => onAdvancedOptionChange('connectedOnly', e.target.checked)}
        />
        <span className="checkbox-label">Show connected nodes only</span>
        <span className="checkbox-description">
          Only show nodes with at least one connection
        </span>
      </label>
    </div>
  </div>
);

export default FilterPanel;