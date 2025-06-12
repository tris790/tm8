import React, { useState, useEffect } from "react";
import { Node, Edge, Boundary } from '../../types/placeholder';
import "./PropertiesPanel.css";

interface PropertiesPanelProps {
  selection: string[];
  graph: {
    nodes: Record<string, Node>;
    edges: Record<string, Edge>;
    boundaries: Record<string, Boundary>;
  };
  onUpdateNode: (id: string, updates: Partial<Node>) => void;
  onUpdateEdge: (id: string, updates: Partial<Edge>) => void;
  onUpdateBoundary: (id: string, updates: Partial<Boundary>) => void;
}

const findEntity = (graph: PropertiesPanelProps['graph'], id: string) => {
  if (graph.nodes[id]) {
    return { type: 'node' as const, entity: graph.nodes[id] };
  }
  if (graph.edges[id]) {
    return { type: 'edge' as const, entity: graph.edges[id] };
  }
  if (graph.boundaries[id]) {
    return { type: 'boundary' as const, entity: graph.boundaries[id] };
  }
  return null;
};

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return dateString;
  }
};

// Read-only horizontal label:value row
const InfoRow: React.FC<{ label: string; value: any }> = ({ label, value }) => {
  if (value === undefined || value === null) return null;
  
  return (
    <div className="row">
      <label>{label}:</label>
      <span>{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</span>
    </div>
  );
};

// Editable single-line input field
const InputField: React.FC<{ 
  label: string; 
  value: string; 
  onChange: (value: string) => void;
  id?: string;
}> = ({ label, value, onChange, id }) => {
  return (
    <div className="section">
      <label htmlFor={id || label}>{label}</label>
      <input 
        id={id || label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

// Editable multi-line textarea field  
const TextareaField: React.FC<{ 
  label: string; 
  value: string; 
  onChange: (value: string) => void;
  rows?: number;
  id?: string;
}> = ({ label, value, onChange, rows = 3, id }) => {
  return (
    <div className="section">
      <label htmlFor={id || label}>{label}</label>
      <textarea 
        id={id || label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
      />
    </div>
  );
};

export default function PropertiesPanel({ selection, graph, onUpdateNode, onUpdateEdge, onUpdateBoundary }: PropertiesPanelProps) {
  if (selection.length === 0) {
    return (
      <div className="panel">
        <div className="empty-state">
          <p>No entity selected</p>
        </div>
      </div>
    );
  }

  if (selection.length > 1) {
    return (
      <div className="panel">
        <div className="row">
          <label>Selected:</label>
          <span>{selection.length} items</span>
        </div>
        <div className="empty-state">
          <p>Multiple selection not yet supported</p>
        </div>
      </div>
    );
  }

  const entityData = findEntity(graph, selection[0]);
  if (!entityData) {
    return (
      <div className="panel">
        <div className="empty-state">
          <p>Entity not found</p>
        </div>
      </div>
    );
  }

  const { type, entity } = entityData;
  const [localName, setLocalName] = useState(entity.name || '');

  // Update local state when selection changes
  useEffect(() => {
    setLocalName(entity.name || '');
  }, [entity.name, entity.id]);

  const handleNameChange = (newName: string) => {
    setLocalName(newName);
    if (type === 'node') {
      onUpdateNode(entity.id, { name: newName });
    } else if (type === 'edge') {
      // Edges don't have names typically
    } else if (type === 'boundary') {
      onUpdateBoundary(entity.id, { name: newName });
    }
  };

  const getEntityTypeName = () => {
    switch (type) {
      case 'node': return entity.type;
      case 'edge': return entity.type;
      case 'boundary': return entity.type;
      default: return 'Unknown';
    }
  };

  return (
    <div className="panel">
      <InfoRow label="Selected" value={entity.name || entity.id} />
      <InfoRow label="Type" value={getEntityTypeName()} />

      {entity.name !== undefined && (
        <InputField
          label="Name"
          value={localName}
          onChange={handleNameChange}
          id={type === 'node' ? 'node-name' : type === 'boundary' ? 'boundary-name' : 'name'}
        />
      )}

      {/* Node-specific properties */}
      {type === 'node' && (
        <>
          <InfoRow label="Repository" value={entity.properties?.repo} />
          <InfoRow label="Team" value={entity.properties?.team} />
          <InfoRow label="Role" value={entity.properties?.role} />
          <InfoRow label="Technology" value={entity.properties?.technology} />
          <InfoRow label="Encryption" value={entity.properties?.encryption} />
          <InfoRow label="Backup" value={entity.properties?.backup} />
          <InfoRow label="Retention" value={entity.properties?.retention} />
          <InfoRow label="Sensitivity" value={entity.properties?.sensitivity} />
        </>
      )}

      {/* Edge-specific properties */}
      {type === 'edge' && (
        <>
          <InfoRow label="Source" value={entity.source} />
          <InfoRow label="Targets" value={entity.targets.join(', ')} />
          <InfoRow label="Encrypted" value={entity.properties?.encrypted} />
          <InfoRow label="Port" value={entity.properties?.port} />
          <InfoRow label="Certificate" value={entity.properties?.certificate} />
        </>
      )}

      {/* Boundary-specific properties */}
      {type === 'boundary' && (
        <>
          <InfoRow label="Trust Level" value={entity.properties?.trust_level} />
          <InfoRow label="Authentication" value={entity.properties?.authentication} />
          <InfoRow label="Description" value={entity.properties?.description} />
        </>
      )}

      {/* Advanced section */}
      <details className="section">
        <summary>Show Advanced</summary>
        <InfoRow label="ID" value={entity.id} />
        <InfoRow label="Created" value={entity.properties?.created ? formatDate(entity.properties.created) : undefined} />
        <InfoRow label="Modified" value={entity.properties?.modified ? formatDate(entity.properties.modified) : undefined} />
        {'position' in entity && (
          <InfoRow label="Position" value={`${entity.position.x}, ${entity.position.y}`} />
        )}
        {'bounds' in entity && (
          <InfoRow label="Size" value={`${entity.bounds.width} × ${entity.bounds.height}`} />
        )}
      </details>
    </div>
  );
}