# Task 09: Properties Panel & Entity Editing

## 🎯 Objective
Implement a dynamic properties panel for viewing and editing metadata and properties of selected threat model entities.

## 📋 Deliverables
1. `src/components/properties/PropertiesPanel.tsx` - Main properties panel
2. `src/components/properties/NodeProperties.tsx` - Node-specific property editor
3. `src/components/properties/EdgeProperties.tsx` - Edge-specific property editor
4. `src/components/properties/BoundaryProperties.tsx` - Boundary-specific property editor
5. `src/components/ui/PropertyEditor.tsx` - Generic property editing components
6. `src/hooks/usePropertyValidation.ts` - Property validation logic

## 🔧 Technical Requirements

### Properties Panel Architecture
```typescript
// PropertiesPanel.tsx
interface PropertiesPanelProps {
  selection: string[];
  graph: Graph;
  onUpdateNode: (id: string, updates: Partial<Node>) => void;
  onUpdateEdge: (id: string, updates: Partial<Edge>) => void;
  onUpdateBoundary: (id: string, updates: Partial<Boundary>) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  selection, 
  graph, 
  onUpdateNode, 
  onUpdateEdge, 
  onUpdateBoundary 
}) => {
  if (selection.length === 0) {
    return <EmptySelection />;
  }
  
  if (selection.length === 1) {
    const entity = findEntity(graph, selection[0]);
    return <SingleEntityProperties entity={entity} onUpdate={...} />;
  }
  
  return <MultipleSelectionProperties selection={selection} graph={graph} />;
};
```

### Node Properties Component
```typescript
// NodeProperties.tsx
interface NodePropertiesProps {
  node: Node;
  onUpdate: (updates: Partial<Node>) => void;
}

const NodeProperties: React.FC<NodePropertiesProps> = ({ node, onUpdate }) => {
  const [name, setName] = useState(node.name);
  const [properties, setProperties] = useState(node.properties);
  
  const handleNameChange = (newName: string) => {
    setName(newName);
    onUpdate({ name: newName });
  };
  
  const handlePropertyChange = (key: string, value: any) => {
    const newProperties = { ...properties, [key]: value };
    setProperties(newProperties);
    onUpdate({ properties: newProperties });
  };
  
  return (
    <div className="node-properties">
      <PropertyGroup title="Basic Information">
        <PropertyEditor
          label="Name"
          type="text"
          value={name}
          onChange={handleNameChange}
          required
        />
        <PropertyEditor
          label="Type"
          type="select"
          value={node.type}
          options={Object.values(NodeType)}
          onChange={(type) => onUpdate({ type })}
        />
      </PropertyGroup>
      
      <PropertyGroup title="Position">
        <PropertyEditor
          label="X"
          type="number"
          value={node.position.x}
          onChange={(x) => onUpdate({ position: { ...node.position, x } })}
        />
        <PropertyEditor
          label="Y"
          type="number"
          value={node.position.y}
          onChange={(y) => onUpdate({ position: { ...node.position, y } })}
        />
      </PropertyGroup>
      
      <PropertyGroup title="Custom Properties">
        <CustomPropertiesEditor
          properties={properties}
          onChange={handlePropertyChange}
          nodeType={node.type}
        />
      </PropertyGroup>
    </div>
  );
};
```

### Generic Property Editor
```typescript
// PropertyEditor.tsx
interface PropertyEditorProps {
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'color' | 'url';
  value: any;
  onChange: (value: any) => void;
  options?: string[];
  required?: boolean;
  validation?: (value: any) => string | null;
}

const PropertyEditor: React.FC<PropertyEditorProps> = ({ 
  label, 
  type, 
  value, 
  onChange, 
  options, 
  required, 
  validation 
}) => {
  const [error, setError] = useState<string | null>(null);
  
  const handleChange = (newValue: any) => {
    if (validation) {
      const validationError = validation(newValue);
      setError(validationError);
    }
    onChange(newValue);
  };
  
  const renderInput = () => {
    switch (type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={handleChange}
            placeholder={label}
            required={required}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={handleChange}
            required={required}
          />
        );
      case 'select':
        return (
          <Select
            value={value}
            onChange={handleChange}
            options={options || []}
          />
        );
      case 'boolean':
        return (
          <Checkbox
            checked={value}
            onChange={handleChange}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="property-editor">
      <label className="property-label">{label}</label>
      {renderInput()}
      {error && <span className="property-error">{error}</span>}
    </div>
  );
};
```

### Custom Properties System
```typescript
// CustomPropertiesEditor.tsx
interface CustomPropertiesEditorProps {
  properties: Record<string, any>;
  onChange: (key: string, value: any) => void;
  nodeType: NodeType;
}

const CustomPropertiesEditor: React.FC<CustomPropertiesEditorProps> = ({ 
  properties, 
  onChange, 
  nodeType 
}) => {
  const [newPropertyKey, setNewPropertyKey] = useState('');
  const [newPropertyValue, setNewPropertyValue] = useState('');
  
  const commonProperties = getCommonPropertiesForType(nodeType);
  
  const addProperty = () => {
    if (newPropertyKey && !properties[newPropertyKey]) {
      onChange(newPropertyKey, newPropertyValue);
      setNewPropertyKey('');
      setNewPropertyValue('');
    }
  };
  
  const deleteProperty = (key: string) => {
    const newProperties = { ...properties };
    delete newProperties[key];
    // Update parent with new properties object
  };
  
  return (
    <div className="custom-properties">
      {/* Render existing properties */}
      {Object.entries(properties).map(([key, value]) => (
        <div key={key} className="property-row">
          <PropertyEditor
            label={key}
            type={inferPropertyType(value)}
            value={value}
            onChange={(newValue) => onChange(key, newValue)}
          />
          <button onClick={() => deleteProperty(key)}>×</button>
        </div>
      ))}
      
      {/* Common property suggestions */}
      <div className="property-suggestions">
        <h4>Common Properties</h4>
        {commonProperties.map(prop => (
          <button 
            key={prop.key}
            onClick={() => onChange(prop.key, prop.defaultValue)}
            disabled={properties[prop.key] !== undefined}
          >
            {prop.label}
          </button>
        ))}
      </div>
      
      {/* Add new property */}
      <div className="add-property">
        <Input
          value={newPropertyKey}
          onChange={setNewPropertyKey}
          placeholder="Property name"
        />
        <Input
          value={newPropertyValue}
          onChange={setNewPropertyValue}
          placeholder="Value"
        />
        <Button onClick={addProperty}>Add</Button>
      </div>
    </div>
  );
};
```

## 🎨 Property Type System

### Type-Specific Properties
```typescript
interface PropertyConfig {
  key: string;
  label: string;
  type: PropertyEditorProps['type'];
  defaultValue: any;
  validation?: (value: any) => string | null;
}

const NODE_TYPE_PROPERTIES: Record<NodeType, PropertyConfig[]> = {
  [NodeType.PROCESS]: [
    { key: 'repo', label: 'Repository', type: 'url', defaultValue: '' },
    { key: 'team', label: 'Team', type: 'text', defaultValue: '' },
    { key: 'role', label: 'Role', type: 'text', defaultValue: '' },
  ],
  [NodeType.DATASTORE]: [
    { key: 'encryption', label: 'Encrypted', type: 'boolean', defaultValue: false },
    { key: 'backup', label: 'Backup Strategy', type: 'text', defaultValue: '' },
  ],
  [NodeType.EXTERNAL_ENTITY]: [
    { key: 'trusted', label: 'Trusted', type: 'boolean', defaultValue: false },
    { key: 'contact', label: 'Contact', type: 'text', defaultValue: '' },
  ],
  [NodeType.SERVICE]: [
    { key: 'endpoint', label: 'Endpoint', type: 'url', defaultValue: '' },
    { key: 'sla', label: 'SLA', type: 'text', defaultValue: '' },
  ],
};
```

### Property Validation
```typescript
// usePropertyValidation.ts
export const usePropertyValidation = () => {
  const validateURL = (value: string): string | null => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return 'Invalid URL format';
    }
  };
  
  const validateRequired = (value: any): string | null => {
    return value ? null : 'This field is required';
  };
  
  return { validateURL, validateRequired };
};
```

## ✅ Acceptance Criteria
- [x] Properties panel shows selected entity details
- [x] All basic properties are editable (name, type, position)
- [x] Custom properties can be added/removed/edited
- [x] Property validation works and shows errors
- [x] Multiple selection shows common properties
- [x] Changes update the graph in real-time
- [x] Undo/redo works with property changes
- [x] Type-specific property suggestions work

## 🔗 Dependencies
- Task 06: UI Components (Input, Select, Button)
- Task 05: Graph Data Structures (for updates)
- Task 02: Core Types (Node, Edge, Boundary interfaces)

## ⚡ Performance Notes
- Debounce property updates to avoid excessive re-renders
- Use controlled components for form inputs
- Optimize validation to only run when needed