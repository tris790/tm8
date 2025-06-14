/**
 * Enhanced TM7 Types based on schema discovery
 * Integrates discovered schema patterns with existing TM8 types
 */

import { NodeType, EdgeType, BoundaryType } from '../types/enums';

// Enhanced element type mappings based on discovery
export const TM7_DISCOVERED_ELEMENT_TYPES = {
  // Core structure elements
  THREAT_MODEL: 'ThreatModel',
  DRAWING_SURFACE_LIST: 'DrawingSurfaceList', 
  DRAWING_SURFACE_MODEL: 'DrawingSurfaceModel',
  BORDERS: 'Borders',
  LINES: 'Lines',
  
  // Node/Border elements (discovered in KeyValueOfguidanyType structures)
  KEY_VALUE_PAIR: 'a:KeyValueOfguidanyType',
  KEY: 'a:Key',
  VALUE: 'a:Value',
  
  // Element identification
  GENERIC_TYPE_ID: 'GenericTypeId',
  TYPE_ID: 'TypeId', 
  GUID: 'Guid',
  
  // Properties system (heavily used in schema)
  PROPERTIES: 'Properties',
  ANY_TYPE: 'a:anyType',
  DISPLAY_NAME: 'b:DisplayName',
  NAME: 'b:Name', 
  VALUE: 'b:Value',
  SELECTED_INDEX: 'b:SelectedIndex',
  
  // Position/layout elements
  LEFT: 'Left',
  TOP: 'Top', 
  WIDTH: 'Width',
  HEIGHT: 'Height',
  
  // Connection elements  
  SOURCE_GUID: 'SourceGuid',
  TARGET_GUID: 'TargetGuid',
  SOURCE_X: 'SourceX',
  SOURCE_Y: 'SourceY',
  TARGET_X: 'TargetX',
  TARGET_Y: 'TargetY',
  
  // Metadata
  VERSION: 'Version',
  KNOWLEDGE_BASE: 'KnowledgeBase'
} as const;

// Property display attribute types discovered in schema
export const TM7_PROPERTY_TYPES = {
  HEADER_DISPLAY: 'b:HeaderDisplayAttribute',
  STRING_DISPLAY: 'b:StringDisplayAttribute', 
  BOOLEAN_DISPLAY: 'b:BooleanDisplayAttribute',
  LIST_DISPLAY: 'b:ListDisplayAttribute'
} as const;

// Enhanced XML namespaces discovered
export const TM7_ENHANCED_NAMESPACES = {
  THREAT_MODEL: 'http://schemas.datacontract.org/2004/07/ThreatModeling.Model',
  MODEL_ABSTRACTS: 'http://schemas.datacontract.org/2004/07/ThreatModeling.Model.Abstracts',
  KNOWLEDGE_BASE: 'http://schemas.datacontract.org/2004/07/ThreatModeling.KnowledgeBase',
  SERIALIZATION: 'http://schemas.microsoft.com/2003/10/Serialization/',
  SERIALIZATION_ARRAYS: 'http://schemas.microsoft.com/2003/10/Serialization/Arrays',
  XML_SCHEMA: 'http://www.w3.org/2001/XMLSchema',
  XML_SCHEMA_INSTANCE: 'http://www.w3.org/2001/XMLSchema-instance',
  INTERFACES: 'http://schemas.datacontract.org/2004/07/ThreatModeling.Interfaces',
  EXTERNAL_STORAGE: 'http://schemas.datacontract.org/2004/07/ThreatModeling.ExternalStorage.OM'
} as const;

// Enhanced property structure interfaces based on discovered patterns
export interface TM7PropertyDisplayAttribute {
  'b:DisplayName'?: string;
  'b:Name'?: string;
  'b:Value'?: {
    '@i:type'?: string;
    '@i:nil'?: string;
    textContent?: string;
  };
  'b:SelectedIndex'?: string;
}

export interface TM7ElementWrapper {
  '@z:Id'?: string;
  '@i:type'?: string;
  [TM7_DISCOVERED_ELEMENT_TYPES.GENERIC_TYPE_ID]?: string;
  [TM7_DISCOVERED_ELEMENT_TYPES.GUID]?: string;
  [TM7_DISCOVERED_ELEMENT_TYPES.TYPE_ID]?: string;
  [TM7_DISCOVERED_ELEMENT_TYPES.PROPERTIES]?: {
    [TM7_DISCOVERED_ELEMENT_TYPES.ANY_TYPE]: TM7PropertyDisplayAttribute[];
  };
  // Position elements
  [TM7_DISCOVERED_ELEMENT_TYPES.LEFT]?: string;
  [TM7_DISCOVERED_ELEMENT_TYPES.TOP]?: string;
  [TM7_DISCOVERED_ELEMENT_TYPES.WIDTH]?: string;
  [TM7_DISCOVERED_ELEMENT_TYPES.HEIGHT]?: string;
}

export interface TM7KeyValuePair {
  [TM7_DISCOVERED_ELEMENT_TYPES.KEY]: string;
  [TM7_DISCOVERED_ELEMENT_TYPES.VALUE]: TM7ElementWrapper;
}

export interface TM7DrawingSurface {
  [TM7_DISCOVERED_ELEMENT_TYPES.GENERIC_TYPE_ID]: string;
  [TM7_DISCOVERED_ELEMENT_TYPES.GUID]: string;
  [TM7_DISCOVERED_ELEMENT_TYPES.TYPE_ID]: string;
  [TM7_DISCOVERED_ELEMENT_TYPES.PROPERTIES]?: any;
  [TM7_DISCOVERED_ELEMENT_TYPES.BORDERS]?: {
    [TM7_DISCOVERED_ELEMENT_TYPES.KEY_VALUE_PAIR]: TM7KeyValuePair[];
  };
  [TM7_DISCOVERED_ELEMENT_TYPES.LINES]?: {
    [TM7_DISCOVERED_ELEMENT_TYPES.KEY_VALUE_PAIR]: TM7KeyValuePair[];
  };
}

export interface TM7EnhancedDocument {
  [TM7_DISCOVERED_ELEMENT_TYPES.THREAT_MODEL]: {
    '@xmlns'?: string;
    '@xmlns:i'?: string;
    [TM7_DISCOVERED_ELEMENT_TYPES.DRAWING_SURFACE_LIST]: {
      [TM7_DISCOVERED_ELEMENT_TYPES.DRAWING_SURFACE_MODEL]: TM7DrawingSurface[];
    };
    [TM7_DISCOVERED_ELEMENT_TYPES.VERSION]?: string;
    [TM7_DISCOVERED_ELEMENT_TYPES.KNOWLEDGE_BASE]?: any;
  };
}

// Enhanced type mapping with discovered GenericTypeId patterns
export const TM7_ENHANCED_NODE_TYPE_MAPPING: Record<string, NodeType> = {
  // Discovered from schema examples
  'GE.EI': NodeType.EXTERNAL_ENTITY,  // Generic External Interactor
  'GE.P': NodeType.PROCESS,           // Generic Process  
  'GE.DS': NodeType.DATASTORE,        // Generic Data Store
  'GE.S': NodeType.SERVICE,           // Generic Service
  
  // TypeId patterns from discovery
  '1801258c-7f7a-4498-9c79-ce598fea359e': NodeType.EXTERNAL_ENTITY,
  'SE.P.TMCore.WebApp': NodeType.PROCESS,
  'SE.DS.TMCore.SQL': NodeType.DATASTORE,
  'b29c6647-371d-48d9-830e-9e7f3056d496': NodeType.EXTERNAL_ENTITY, // Security Gateway
  
  // Fallback patterns
  'StencilEllipse': NodeType.EXTERNAL_ENTITY,
  'StencilRectangle': NodeType.PROCESS,
  'StencilParallelLines': NodeType.DATASTORE,
  'StencilOpenRectangle': NodeType.DATASTORE
};

export const TM7_ENHANCED_EDGE_TYPE_MAPPING: Record<string, EdgeType> = {
  'GE.DF': EdgeType.HTTPS,  // Generic Data Flow
  'Connector': EdgeType.HTTPS,
  'SE.DF.TMCore.HTTPS': EdgeType.HTTPS,
  'SE.DF.TMCore.SQL': EdgeType.HTTPS  // SQL connections map to HTTPS for now
};

export const TM7_ENHANCED_BOUNDARY_TYPE_MAPPING: Record<string, BoundaryType> = {
  'LineBoundary': BoundaryType.TRUST_BOUNDARY,
  'BorderBoundary': BoundaryType.TRUST_BOUNDARY,
  '63e7829e-c420-4546-9336-0194c0113281': BoundaryType.TRUST_BOUNDARY,
  'b5d57773-67c8-427e-8fb7-239924b0992e': BoundaryType.NETWORK_ZONE,
  '86a6b066-3652-49a5-8a3a-3df2d7faa221': BoundaryType.NETWORK_ZONE
};

/**
 * Enhanced property extraction that handles discovered property structure
 */
export function extractTM7EnhancedProperties(propertiesElement: any): Record<string, any> {
  const result: Record<string, any> = {};
  
  if (!propertiesElement) return result;
  
  // Handle a:anyType array structure discovered in schema
  const anyTypes = propertiesElement[TM7_DISCOVERED_ELEMENT_TYPES.ANY_TYPE];
  if (Array.isArray(anyTypes)) {
    for (const anyType of anyTypes) {
      const displayName = anyType['b:DisplayName'];
      const name = anyType['b:Name'];
      const value = anyType['b:Value'];
      const selectedIndex = anyType['b:SelectedIndex'];
      
      if (displayName && value) {
        const key = name || displayName;
        
        // Handle different value types discovered
        if (typeof value === 'object' && value['@i:type']) {
          if (value['@i:type'].includes('string')) {
            result[key] = value.textContent || '';
          } else if (value['@i:type'].includes('boolean')) {
            result[key] = value.textContent === 'true';
          } else if (value['@i:type'].includes('ArrayOfstring') && selectedIndex !== undefined) {
            // List display attribute with selected index
            result[key] = parseInt(selectedIndex);
          }
        } else {
          result[key] = value;
        }
      }
    }
  }
  
  return result;
}

/**
 * Enhanced display name extraction using discovered patterns
 */
export function extractTM7EnhancedDisplayName(properties: any): string {
  // First try the enhanced property extraction
  const extracted = extractTM7EnhancedProperties(properties);
  
  // Look for common name patterns discovered in schema
  if (extracted['Name']) return extracted['Name'];
  if (extracted['DisplayName']) return extracted['DisplayName'];
  
  // Fallback to direct property access
  if (properties?.Name) return properties.Name;
  if (properties?.DisplayName) return properties.DisplayName;
  
  return 'Unnamed Element';
}