import React, { useState, useEffect } from 'react';
import { Edge, EdgeType } from '../../types/placeholder';
import { PropertyEditor } from '../ui/PropertyEditor';
import { PropertyGroup } from '../ui/PropertyGroup';
import { CustomPropertiesEditor } from './CustomPropertiesEditor';

interface EdgePropertiesProps {
  edge: Edge;
  onUpdate: (updates: Partial<Edge>) => void;
}

export const EdgeProperties: React.FC<EdgePropertiesProps> = ({ edge, onUpdate }) => {
  const [localType, setLocalType] = useState(edge.type);
  const [localProperties, setLocalProperties] = useState(edge.properties);

  // Sync with external updates
  useEffect(() => {
    setLocalType(edge.type);
    setLocalProperties(edge.properties);
  }, [edge]);

  const handleTypeChange = (newType: string) => {
    const edgeType = newType as EdgeType;
    setLocalType(edgeType);
    onUpdate({ type: edgeType });
  };

  const handlePropertyChange = (key: string, value: any) => {
    const newProperties = { ...localProperties, [key]: value };
    setLocalProperties(newProperties);
    onUpdate({ properties: newProperties });
  };

  const handlePropertyDelete = (key: string) => {
    const newProperties = { ...localProperties };
    delete newProperties[key];
    setLocalProperties(newProperties);
    onUpdate({ properties: newProperties });
  };

  const edgeTypeOptions = Object.values(EdgeType).map(type => ({
    value: type,
    label: type.toUpperCase()
  }));

  // Common edge properties based on type
  const getCommonEdgeProperties = () => {
    switch (localType) {
      case EdgeType.HTTPS:
        return [
          { key: 'encrypted', label: 'Encrypted', type: 'boolean' as const, defaultValue: true },
          { key: 'port', label: 'Port', type: 'number' as const, defaultValue: 443 },
          { key: 'certificate', label: 'Certificate', type: 'text' as const, defaultValue: '' },
        ];
      case EdgeType.GRPC:
        return [
          { key: 'encrypted', label: 'Encrypted', type: 'boolean' as const, defaultValue: true },
          { key: 'port', label: 'Port', type: 'number' as const, defaultValue: 443 },
          { key: 'proto_file', label: 'Proto File', type: 'text' as const, defaultValue: '' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="edge-properties">
      <div className="properties-header">
        <h3 className="properties-title">Connection Properties</h3>
        <span className="properties-id">ID: {edge.id}</span>
      </div>

      <PropertyGroup title="Basic Information">
        <PropertyEditor
          label="Connection Type"
          type="select"
          value={localType}
          options={edgeTypeOptions}
          onChange={handleTypeChange}
          description="The type of connection between nodes"
          id="edge-type"
        />
      </PropertyGroup>

      <PropertyGroup title="Connection Details">
        <div className="connection-info">
          <div className="connection-row">
            <span className="connection-label">Source:</span>
            <span className="connection-value">{edge.source}</span>
          </div>
          <div className="connection-row">
            <span className="connection-label">Targets:</span>
            <span className="connection-value">
              {edge.targets.length > 0 ? edge.targets.join(', ') : 'None'}
            </span>
          </div>
          <div className="connection-row">
            <span className="connection-label">Direction:</span>
            <span className="connection-value">
              {edge.targets.length > 1 ? 'One-to-Many' : 'Point-to-Point'}
            </span>
          </div>
        </div>
      </PropertyGroup>
      
      <PropertyGroup title="Custom Properties" defaultExpanded={true}>
        <CustomPropertiesEditor
          properties={localProperties}
          onChange={handlePropertyChange}
          onDelete={handlePropertyDelete}
        />
      </PropertyGroup>

      {/* Type-specific suggestions */}
      {getCommonEdgeProperties().length > 0 && (
        <PropertyGroup title="Suggested Properties" collapsible defaultExpanded={false}>
          <div className="suggested-properties">
            <p className="suggestion-description">
              Common properties for {localType.toUpperCase()} connections:
            </p>
            {getCommonEdgeProperties().map(prop => (
              <button
                key={prop.key}
                type="button"
                className="suggestion-btn"
                onClick={() => handlePropertyChange(prop.key, prop.defaultValue)}
                disabled={localProperties[prop.key] !== undefined}
              >
                Add {prop.label}
              </button>
            ))}
          </div>
        </PropertyGroup>
      )}

      {/* Metadata */}
      <PropertyGroup title="Metadata" collapsible defaultExpanded={false}>
        <div className="metadata-info">
          <div className="metadata-row">
            <span className="metadata-label">Created:</span>
            <span className="metadata-value">
              {localProperties.created || 'Unknown'}
            </span>
          </div>
          <div className="metadata-row">
            <span className="metadata-label">Modified:</span>
            <span className="metadata-value">
              {localProperties.modified || 'Unknown'}
            </span>
          </div>
          <div className="metadata-row">
            <span className="metadata-label">Properties:</span>
            <span className="metadata-value">
              {Object.keys(localProperties).length} custom
            </span>
          </div>
        </div>
      </PropertyGroup>
    </div>
  );
};