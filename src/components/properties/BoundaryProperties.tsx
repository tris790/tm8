import React, { useState, useEffect } from 'react';
import { Boundary, BoundaryType } from '../../types/placeholder';
import { PropertyEditor } from '../ui/PropertyEditor';
import { PropertyGroup } from '../ui/PropertyGroup';
import { CustomPropertiesEditor } from './CustomPropertiesEditor';
import { usePropertyValidation } from '../../hooks/usePropertyValidation';

interface BoundaryPropertiesProps {
  boundary: Boundary;
  onUpdate: (updates: Partial<Boundary>) => void;
}

export const BoundaryProperties: React.FC<BoundaryPropertiesProps> = ({ boundary, onUpdate }) => {
  const [localName, setLocalName] = useState(boundary.name);
  const [localType, setLocalType] = useState(boundary.type);
  const [localPosition, setLocalPosition] = useState(boundary.position);
  const [localBounds, setLocalBounds] = useState(boundary.bounds);
  const [localProperties, setLocalProperties] = useState(boundary.properties);

  const { validateRequired, validateMinLength } = usePropertyValidation();

  // Sync with external updates
  useEffect(() => {
    setLocalName(boundary.name);
    setLocalType(boundary.type);
    setLocalPosition(boundary.position);
    setLocalBounds(boundary.bounds);
    setLocalProperties(boundary.properties);
  }, [boundary]);

  const handleNameChange = (newName: string) => {
    setLocalName(newName);
    onUpdate({ name: newName });
  };

  const handleTypeChange = (newType: string) => {
    const boundaryType = newType as BoundaryType;
    setLocalType(boundaryType);
    onUpdate({ type: boundaryType });
  };

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    const newPosition = { ...localPosition, [axis]: value };
    setLocalPosition(newPosition);
    onUpdate({ position: newPosition });
  };

  const handleBoundsChange = (dimension: 'width' | 'height', value: number) => {
    const newBounds = { ...localBounds, [dimension]: value };
    setLocalBounds(newBounds);
    onUpdate({ bounds: newBounds });
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

  const boundaryTypeOptions = Object.values(BoundaryType).map(type => ({
    value: type,
    label: type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }));

  // Get common properties based on boundary type
  const getCommonBoundaryProperties = () => {
    switch (localType) {
      case BoundaryType.TRUST_BOUNDARY:
        return [
          { key: 'trust_level', label: 'Trust Level', type: 'select' as const, defaultValue: 'medium' },
          { key: 'authentication', label: 'Authentication Required', type: 'boolean' as const, defaultValue: true },
          { key: 'description', label: 'Description', type: 'text' as const, defaultValue: '' },
        ];
      case BoundaryType.NETWORK_ZONE:
        return [
          { key: 'network_segment', label: 'Network Segment', type: 'text' as const, defaultValue: '' },
          { key: 'security_level', label: 'Security Level', type: 'select' as const, defaultValue: 'internal' },
          { key: 'firewall_rules', label: 'Firewall Rules', type: 'text' as const, defaultValue: '' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="boundary-properties">
      <div className="properties-header">
        <h3 className="properties-title">Boundary Properties</h3>
        <span className="properties-id">ID: {boundary.id}</span>
      </div>

      <PropertyGroup title="Basic Information">
        <PropertyEditor
          label="Name"
          type="text"
          value={localName}
          onChange={handleNameChange}
          required
          validation={[validateRequired, validateMinLength(1)]}
          placeholder="Enter boundary name"
          description="A descriptive name for this boundary"
          id="boundary-name"
        />
        
        <PropertyEditor
          label="Type"
          type="select"
          value={localType}
          options={boundaryTypeOptions}
          onChange={handleTypeChange}
          description="The type of boundary in the threat model"
        />
      </PropertyGroup>
      
      <PropertyGroup title="Position & Size" collapsible defaultExpanded={false}>
        <div className="geometry-editors">
          <div className="position-section">
            <h5>Position</h5>
            <div className="position-editors">
              <PropertyEditor
                label="X Position"
                type="number"
                value={localPosition.x}
                onChange={(x) => handlePositionChange('x', x)}
                description="Horizontal position on canvas"
              />
              <PropertyEditor
                label="Y Position"
                type="number"
                value={localPosition.y}
                onChange={(y) => handlePositionChange('y', y)}
                description="Vertical position on canvas"
              />
            </div>
          </div>
          
          <div className="bounds-section">
            <h5>Dimensions</h5>
            <div className="bounds-editors">
              <PropertyEditor
                label="Width"
                type="number"
                value={localBounds.width}
                onChange={(width) => handleBoundsChange('width', width)}
                description="Boundary width in pixels"
              />
              <PropertyEditor
                label="Height"
                type="number"
                value={localBounds.height}
                onChange={(height) => handleBoundsChange('height', height)}
                description="Boundary height in pixels"
              />
            </div>
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
      {getCommonBoundaryProperties().length > 0 && (
        <PropertyGroup title="Suggested Properties" collapsible defaultExpanded={false}>
          <div className="suggested-properties">
            <p className="suggestion-description">
              Common properties for {localType.replace('-', ' ')} boundaries:
            </p>
            {getCommonBoundaryProperties().map(prop => (
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

      {/* Coverage Info */}
      <PropertyGroup title="Coverage" collapsible defaultExpanded={false}>
        <div className="coverage-info">
          <div className="coverage-row">
            <span className="coverage-label">Area:</span>
            <span className="coverage-value">
              {localBounds.width * localBounds.height} px²
            </span>
          </div>
          <div className="coverage-row">
            <span className="coverage-label">Aspect Ratio:</span>
            <span className="coverage-value">
              {(localBounds.width / localBounds.height).toFixed(2)}:1
            </span>
          </div>
        </div>
      </PropertyGroup>

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