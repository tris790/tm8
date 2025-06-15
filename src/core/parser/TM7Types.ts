/**
 * TM7 format type definitions and mappings for TM8
 * Based on Microsoft Threat Modeling Tool XML format
 */

import { NodeType, EdgeType, BoundaryType } from '../types/enums';

// TM7 XML element type identifiers from schema analysis
export const TM7_ELEMENT_TYPES = {
  // Node stencil types from schema
  STENCIL_ELLIPSE: 'StencilEllipse',      // External Entity
  STENCIL_RECTANGLE: 'StencilRectangle',  // Process
  STENCIL_OPEN_RECTANGLE: 'StencilOpenRectangle', // Data Store
  STENCIL_SERVICE: 'StencilService',      // Service/API
  
  // Trust boundary types
  TRUST_BOUNDARY: 'LineBoundary',
  
  // Data flow line types
  DATA_FLOW: 'Connector'
} as const;

// TM7 to TM8 node type mapping
export const TM7_TO_TM8_NODE_TYPES: Record<string, NodeType> = {
  [TM7_ELEMENT_TYPES.STENCIL_ELLIPSE]: NodeType.EXTERNAL_ENTITY,
  [TM7_ELEMENT_TYPES.STENCIL_RECTANGLE]: NodeType.PROCESS,
  [TM7_ELEMENT_TYPES.STENCIL_OPEN_RECTANGLE]: NodeType.DATASTORE,
  [TM7_ELEMENT_TYPES.STENCIL_SERVICE]: NodeType.SERVICE
};

// TM8 to TM7 node type mapping (for export)
export const TM8_TO_TM7_NODE_TYPES: Record<NodeType, string> = {
  [NodeType.EXTERNAL_ENTITY]: TM7_ELEMENT_TYPES.STENCIL_ELLIPSE,
  [NodeType.PROCESS]: TM7_ELEMENT_TYPES.STENCIL_RECTANGLE,
  [NodeType.DATASTORE]: TM7_ELEMENT_TYPES.STENCIL_OPEN_RECTANGLE,
  [NodeType.SERVICE]: TM7_ELEMENT_TYPES.STENCIL_SERVICE
};

// TM7 edge type mappings
export const TM7_TO_TM8_EDGE_TYPES: Record<string, EdgeType> = {
  'Connector': EdgeType.HTTPS, // Default to HTTPS for TM7 connectors
};

export const TM8_TO_TM7_EDGE_TYPES: Record<EdgeType, string> = {
  [EdgeType.HTTPS]: 'Connector',
  [EdgeType.GRPC]: 'Connector' // Both map to generic connector in TM7
};

// TM7 boundary type mappings
export const TM7_TO_TM8_BOUNDARY_TYPES: Record<string, BoundaryType> = {
  [TM7_ELEMENT_TYPES.TRUST_BOUNDARY]: BoundaryType.TRUST_BOUNDARY
};

export const TM8_TO_TM7_BOUNDARY_TYPES: Record<BoundaryType, string> = {
  [BoundaryType.TRUST_BOUNDARY]: TM7_ELEMENT_TYPES.TRUST_BOUNDARY,
  [BoundaryType.NETWORK_ZONE]: TM7_ELEMENT_TYPES.TRUST_BOUNDARY // Map to trust boundary
};

// TM7 XML structure interfaces based on schema analysis
export interface TM7Position {
  Left: number;
  Top: number;
  Width: number;
  Height: number;
}

export interface TM7NodeElement {
  GenericTypeId: string;
  Guid: string;
  Properties: Record<string, any>;
  TypeId: string;
  position?: TM7Position;
}

export interface TM7EdgeElement {
  GenericTypeId: string;
  Guid: string;
  Properties: Record<string, any>;
  SourceGuid: string;
  TargetGuid: string;
  SourceX?: number;
  SourceY?: number;
  TargetX?: number;
  TargetY?: number;
}

export interface TM7BoundaryElement {
  GenericTypeId: string;
  Guid: string;
  Properties: Record<string, any>;
  position?: TM7Position;
}

// TM7 property extraction helpers
export interface TM7PropertyMap {
  DisplayName?: string;
  Name?: string;
  Description?: string;
  [key: string]: any;
}

/**
 * Extracts display name from TM7 properties structure
 */
export function extractTM7DisplayName(properties: any): string {
  // TM7 stores names in nested property structures
  if (properties?.anyType) {
    for (const prop of properties.anyType) {
      if (prop?.DisplayName?.Value) {
        return prop.DisplayName.Value;
      }
      if (prop?.Name?.Value) {
        return prop.Name.Value;
      }
    }
  }
  
  // Fallback to direct properties
  if (properties?.DisplayName) return properties.DisplayName;
  if (properties?.Name) return properties.Name;
  
  return 'Unnamed Element';
}

/**
 * Extracts all properties from TM7 nested structure
 */
export function extractTM7Properties(properties: any): TM7PropertyMap {
  const result: TM7PropertyMap = {};
  
  if (properties?.anyType) {
    for (const prop of properties.anyType) {
      // Extract nested property values
      for (const [key, value] of Object.entries(prop)) {
        if (typeof value === 'object' && value?.Value !== undefined) {
          result[key] = value.Value;
        } else if (typeof value !== 'object') {
          result[key] = value;
        }
      }
    }
  }
  
  // Also copy direct properties
  for (const [key, value] of Object.entries(properties || {})) {
    if (key !== 'anyType') {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Default TM7 XML template structure
 */
export const TM7_XML_TEMPLATE = `<?xml version="1.0" encoding="utf-8"?>
<ThreatModel xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:i="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://schemas.microsoft.com/2003/10/Serialization/">
  <DrawingSurfaceList>
    <DrawingSurfaceModel>
      <GenericTypeId>00000000-0000-0000-0000-000000000000</GenericTypeId>
      <Guid>{{DRAWING_SURFACE_GUID}}</Guid>
      <Properties>
        <anyType xsi:type="StringToBoolDictionaryEntry">
          <Name>IsThumbnailVisible</Name>
          <Value>true</Value>
        </anyType>
      </Properties>
      <TypeId>00000000-0000-0000-0000-000000000000</TypeId>
      <Borders>
        {{NODES}}
      </Borders>
      <Lines>
        {{EDGES}}
      </Lines>
      <Zoom>1</Zoom>
    </DrawingSurfaceModel>
  </DrawingSurfaceList>
  <MetaInformation>
    <ThreatModelName>{{MODEL_NAME}}</ThreatModelName>
    <HighLevelSystemDescription></HighLevelSystemDescription>
    <Owner></Owner>
    <Reviewer></Reviewer>
    <Contributors></Contributors>
    <ExternalDependencies></ExternalDependencies>
    <Assumptions></Assumptions>
    <Notes></Notes>
  </MetaInformation>
  <ThreatInstances />
  <ThreatGenerationEnabled>true</ThreatGenerationEnabled>
  <Validations />
  <Version>2.1.5821.22648</Version>
</ThreatModel>`;

/**
 * Generate a GUID in the format expected by TM7
 */
export function generateTM7Guid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}