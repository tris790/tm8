import React, { useState } from 'react';
import { NodeType } from '../../types/placeholder';
import { PropertyEditor } from '../ui/PropertyEditor';
import { Button } from '../ui/Button';

interface PropertyConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'color' | 'url' | 'email';
  defaultValue: any;
  description?: string;
}

interface CustomPropertiesEditorProps {
  properties: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onDelete: (key: string) => void;
  nodeType?: NodeType;
}

// Common properties for different node types
const NODE_TYPE_PROPERTIES: Record<NodeType, PropertyConfig[]> = {
  [NodeType.PROCESS]: [
    { key: 'repo', label: 'Repository', type: 'url', defaultValue: '', description: 'Source code repository URL' },
    { key: 'team', label: 'Team', type: 'text', defaultValue: '', description: 'Responsible team' },
    { key: 'role', label: 'Role', type: 'text', defaultValue: '', description: 'Service role or function' },
    { key: 'technology', label: 'Technology', type: 'text', defaultValue: '', description: 'Technology stack' },
  ],
  [NodeType.DATASTORE]: [
    { key: 'encryption', label: 'Encrypted', type: 'boolean', defaultValue: false, description: 'Data encryption status' },
    { key: 'backup', label: 'Backup Strategy', type: 'text', defaultValue: '', description: 'Backup and recovery strategy' },
    { key: 'retention', label: 'Data Retention', type: 'text', defaultValue: '', description: 'Data retention policy' },
    { key: 'sensitivity', label: 'Data Sensitivity', type: 'select', defaultValue: 'low', description: 'Data sensitivity level' },
  ],
  [NodeType.EXTERNAL_ENTITY]: [
    { key: 'trusted', label: 'Trusted', type: 'boolean', defaultValue: false, description: 'Trust level' },
    { key: 'contact', label: 'Contact', type: 'email', defaultValue: '', description: 'Contact information' },
    { key: 'organization', label: 'Organization', type: 'text', defaultValue: '', description: 'Organization name' },
    { key: 'access_level', label: 'Access Level', type: 'select', defaultValue: 'public', description: 'Access permissions' },
  ],
  [NodeType.SERVICE]: [
    { key: 'endpoint', label: 'Endpoint', type: 'url', defaultValue: '', description: 'Service endpoint URL' },
    { key: 'sla', label: 'SLA', type: 'text', defaultValue: '', description: 'Service level agreement' },
    { key: 'auth_method', label: 'Authentication', type: 'select', defaultValue: 'none', description: 'Authentication method' },
    { key: 'rate_limit', label: 'Rate Limit', type: 'number', defaultValue: null, description: 'Requests per minute' },
  ],
};

// Predefined options for select fields
const SELECT_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  sensitivity: [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ],
  access_level: [
    { value: 'public', label: 'Public' },
    { value: 'internal', label: 'Internal' },
    { value: 'restricted', label: 'Restricted' },
    { value: 'confidential', label: 'Confidential' },
  ],
  auth_method: [
    { value: 'none', label: 'None' },
    { value: 'basic', label: 'Basic Auth' },
    { value: 'bearer', label: 'Bearer Token' },
    { value: 'oauth', label: 'OAuth' },
    { value: 'api_key', label: 'API Key' },
  ],
};

export const CustomPropertiesEditor: React.FC<CustomPropertiesEditorProps> = ({ 
  properties, 
  onChange, 
  onDelete,
  nodeType 
}) => {
  const [newPropertyKey, setNewPropertyKey] = useState('');
  const [newPropertyValue, setNewPropertyValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const commonProperties = nodeType ? NODE_TYPE_PROPERTIES[nodeType] || [] : [];
  const existingKeys = Object.keys(properties);

  // Get suggested properties that aren't already added
  const availableSuggestions = commonProperties.filter(
    prop => !existingKeys.includes(prop.key)
  );

  const inferPropertyType = (value: any): 'text' | 'number' | 'boolean' => {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    return 'text';
  };

  const addProperty = () => {
    if (newPropertyKey && !properties[newPropertyKey]) {
      onChange(newPropertyKey, newPropertyValue);
      setNewPropertyKey('');
      setNewPropertyValue('');
    }
  };

  const addSuggestedProperty = (config: PropertyConfig) => {
    onChange(config.key, config.defaultValue);
    setShowSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addProperty();
    }
  };

  return (
    <div className="custom-properties-editor">
      {/* Existing Properties */}
      {existingKeys.length > 0 && (
        <div className="existing-properties">
          {existingKeys.map((key) => {
            const value = properties[key];
            const propertyConfig = commonProperties.find(p => p.key === key);
            
            return (
              <div key={key} className="property-row">
                <PropertyEditor
                  label={propertyConfig?.label || key}
                  type={propertyConfig?.type || inferPropertyType(value)}
                  value={value}
                  onChange={(newValue) => onChange(key, newValue)}
                  options={propertyConfig?.type === 'select' ? SELECT_OPTIONS[key] : undefined}
                  description={propertyConfig?.description}
                />
                <button
                  type="button"
                  className="property-delete-btn"
                  onClick={() => onDelete(key)}
                  title={`Delete ${key} property`}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Suggested Properties */}
      {availableSuggestions.length > 0 && (
        <div className="property-suggestions">
          <div className="suggestions-header">
            <button
              type="button"
              className="suggestions-toggle"
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              <span>Common Properties</span>
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="none"
                className={`toggle-icon ${showSuggestions ? 'expanded' : ''}`}
              >
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          {showSuggestions && (
            <div className="suggestions-grid">
              {availableSuggestions.map(prop => (
                <button 
                  key={prop.key}
                  type="button"
                  className="suggestion-btn"
                  onClick={() => addSuggestedProperty(prop)}
                  title={prop.description}
                >
                  <span className="suggestion-label">{prop.label}</span>
                  <span className="suggestion-type">({prop.type})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Custom Property */}
      <div className="add-property">
        <h5 className="add-property__title">Add Custom Property</h5>
        <div className="add-property__form">
          <div className="add-property__inputs">
            <PropertyEditor
              label="Property Name"
              type="text"
              value={newPropertyKey}
              onChange={setNewPropertyKey}
              placeholder="e.g., owner, version, status"
              required
            />
            <PropertyEditor
              label="Default Value"
              type="text"
              value={newPropertyValue}
              onChange={setNewPropertyValue}
              placeholder="Initial value"
            />
          </div>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={addProperty}
            disabled={!newPropertyKey}
          >
            Add Property
          </Button>
        </div>
      </div>
    </div>
  );
};