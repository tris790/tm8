import React, { useState, useEffect } from 'react';
import { Node, NodeType } from '../../types/placeholder';
import { PropertyEditor } from '../ui/PropertyEditor';
import { PropertyGroup } from '../ui/PropertyGroup';
import { CustomPropertiesEditor } from './CustomPropertiesEditor';
import { usePropertyValidation } from '../../hooks/usePropertyValidation';

interface NodePropertiesProps {
  node: Node;
  onUpdate: (updates: Partial<Node>) => void;
}

export const NodeProperties: React.FC<NodePropertiesProps> = ({ node, onUpdate }) => {
  const [localName, setLocalName] = useState(node.name);
  const [localType, setLocalType] = useState(node.type);
  const [localPosition, setLocalPosition] = useState(node.position);
  const [localProperties, setLocalProperties] = useState(node.properties);

  const { validateRequired, validateMinLength } = usePropertyValidation();

  // Sync with external updates
  useEffect(() => {
    setLocalName(node.name);
    setLocalType(node.type);
    setLocalPosition(node.position);
    setLocalProperties(node.properties);
  }, [node]);

  const handleNameChange = (newName: string) => {
    setLocalName(newName);
    onUpdate({ name: newName });
  };

  const handleTypeChange = (newType: string) => {
    const nodeType = newType as NodeType;
    setLocalType(nodeType);
    onUpdate({ type: nodeType });
  };

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    const newPosition = { ...localPosition, [axis]: value };
    setLocalPosition(newPosition);
    onUpdate({ position: newPosition });
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

  const nodeTypeOptions = Object.values(NodeType).map(type => ({
    value: type,
    label: type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }));

  return (
    <div className="node-properties">
      <div className="properties-header">
        <h2 className="properties-title">Node Properties</h2>
      </div>

      <PropertyGroup title="Basic Information" defaultExpanded={true}>
        <PropertyEditor
          label="Name"
          type="text"
          value={localName}
          onChange={handleNameChange}
          required
          validation={[validateRequired, validateMinLength(1)]}
          placeholder="Enter node name"
          description="A descriptive name for this node"
          id="node-name"
        />
        
        <PropertyEditor
          label="Type"
          type="select"
          value={localType}
          options={nodeTypeOptions}
          onChange={handleTypeChange}
          description="The type of this node in the threat model"
        />
      </PropertyGroup>
      
      <PropertyGroup title="Position" collapsible defaultExpanded={false} description="Node coordinates on the canvas">
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
      </PropertyGroup>
      
      <PropertyGroup title="Custom Properties" collapsible defaultExpanded={true} description="Domain-specific properties for this node">
        <CustomPropertiesEditor
          properties={localProperties}
          onChange={handlePropertyChange}
          onDelete={handlePropertyDelete}
          nodeType={localType}
        />
      </PropertyGroup>

      <PropertyGroup title="Advanced" collapsible defaultExpanded={false} description="Technical metadata and identifiers">
        <div className="metadata-info">
          <div className="metadata-row">
            <span className="metadata-label">Node ID:</span>
            <span className="metadata-value">{node.id}</span>
          </div>
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