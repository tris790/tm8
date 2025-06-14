/**
 * TM7 XML Parser for converting Microsoft Threat Modeling Tool files to TM8 Graph format
 * Uses browser's native DOMParser for high performance XML processing
 */

import type { Graph, Node, Edge, Boundary, GraphMetadata } from '../types/graph';
import { NodeType, EdgeType, BoundaryType } from '../types/enums';
import {
  TM7_ELEMENT_TYPES,
  TM7_TO_TM8_NODE_TYPES,
  TM7_TO_TM8_EDGE_TYPES,
  TM7_TO_TM8_BOUNDARY_TYPES,
  extractTM7DisplayName,
  extractTM7Properties,
  type TM7NodeElement,
  type TM7EdgeElement,
  type TM7BoundaryElement,
  type TM7Position
} from './TM7Types';

export class TM7ParseError extends Error {
  constructor(message: string, public readonly xmlError?: Error) {
    super(message);
    this.name = 'TM7ParseError';
  }
}

export class TM7Parser {
  private readonly parser = new DOMParser();

  /**
   * Parse TM7 XML content into a TM8 Graph object
   */
  parse(xmlContent: string): Graph {
    try {
      const doc = this.parseXMLDocument(xmlContent);
      
      // Extract metadata from TM7 file
      const metadata = this.parseMetadata(doc);
      
      // Parse main graph elements
      const nodes = this.parseNodes(doc);
      const edges = this.parseEdges(doc);
      const boundaries = this.parseBoundaries(doc);

      return {
        nodes,
        edges,
        boundaries,
        metadata
      };
    } catch (error) {
      if (error instanceof TM7ParseError) {
        throw error;
      }
      throw new TM7ParseError(`Failed to parse TM7 file: ${error.message}`, error);
    }
  }

  /**
   * Parse and validate XML document
   */
  private parseXMLDocument(xmlContent: string): Document {
    const doc = this.parser.parseFromString(xmlContent, 'application/xml');
    
    // Check for XML parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new TM7ParseError(`Invalid XML: ${parserError.textContent}`);
    }

    // Validate TM7 root element
    const threatModel = doc.querySelector('ThreatModel');
    if (!threatModel) {
      throw new TM7ParseError('Invalid TM7 file: Missing ThreatModel root element');
    }

    return doc;
  }

  /**
   * Extract metadata from TM7 MetaInformation section
   */
  private parseMetadata(doc: Document): GraphMetadata {
    const metaInfo = doc.querySelector('MetaInformation');
    const threatModelName = metaInfo?.querySelector('ThreatModelName')?.textContent || 'Untitled Threat Model';
    const version = doc.querySelector('Version')?.textContent || '1.0';

    return {
      name: threatModelName,
      version,
      created: new Date(),
      modified: new Date()
    };
  }

  /**
   * Parse nodes from TM7 Borders section (updated for real structure)
   */
  private parseNodes(doc: Document): Node[] {
    const nodes: Node[] = [];
    
    // Navigate to the correct path: DrawingSurfaceList > DrawingSurfaceModel > Borders
    const drawingSurfaceModel = doc.querySelector('DrawingSurfaceList DrawingSurfaceModel');
    if (!drawingSurfaceModel) {
      console.warn('No DrawingSurfaceModel found');
      return nodes;
    }

    const borders = drawingSurfaceModel.querySelector('Borders');
    if (!borders) {
      console.warn('No Borders section found');
      return nodes;
    }

    // Find all a:KeyValueOfguidanyType elements (note the namespace prefix)
    const nodeElements = borders.querySelectorAll('*');
    const keyValueElements = Array.from(nodeElements).filter(el => 
      el.tagName === 'a:KeyValueOfguidanyType' || el.localName === 'KeyValueOfguidanyType'
    );
    
    for (const nodeElement of keyValueElements) {
      try {
        const node = this.parseNodeElement(nodeElement);
        if (node) {
          nodes.push(node);
        }
      } catch (error) {
        console.warn('Failed to parse node element:', error);
        // Continue parsing other nodes
      }
    }

    return nodes;
  }

  /**
   * Parse individual element from Borders (can be node or boundary)
   */
  private parseNodeElement(element: Element): Node | null {
    // Get key and value from a:KeyValueOfguidanyType structure
    const keyElement = element.querySelector('*')?.tagName === 'a:Key' ? 
      element.querySelector('*') : 
      Array.from(element.children).find(child => 
        child.tagName === 'a:Key' || child.localName === 'Key'
      );
      
    const valueElement = Array.from(element.children).find(child => 
      child.tagName === 'a:Value' || child.localName === 'Value'
    );
    
    if (!keyElement || !valueElement) {
      console.warn('Missing Key or Value in node element');
      return null;
    }

    const key = keyElement.textContent?.trim();
    if (!key) {
      console.warn('Empty key in node element');
      return null;
    }

    // Extract type from i:type attribute on a:Value
    const iType = valueElement.getAttribute('i:type');
    
    // Skip boundary elements (they're handled separately now)
    if (this.isBoundaryType(iType)) {
      return null;
    }
    
    const nodeType = this.mapTM7NodeTypeFromIType(iType);
    
    if (!nodeType) {
      console.warn(`Unknown TM7 node i:type: ${iType}`);
      return null;
    }

    // Extract node properties from the Properties element
    const properties = this.extractElementProperties(valueElement);
    
    // Extract position information from child elements
    const position = this.extractPosition(valueElement);
    
    // Extract display name from properties
    const name = extractTM7DisplayName(properties) || 'Unnamed Node';


    return {
      id: key,
      type: nodeType,
      name,
      position,
      properties: extractTM7Properties(properties)
    };
  }

  /**
   * Parse edges from TM7 Lines section (updated for real structure)
   */
  private parseEdges(doc: Document): Edge[] {
    const edges: Edge[] = [];
    
    // Navigate to the correct path: DrawingSurfaceList > DrawingSurfaceModel > Lines
    const drawingSurfaceModel = doc.querySelector('DrawingSurfaceList DrawingSurfaceModel');
    if (!drawingSurfaceModel) {
      console.warn('No DrawingSurfaceModel found for edges');
      return edges;
    }

    const lines = drawingSurfaceModel.querySelector('Lines');
    if (!lines) {
      console.warn('No Lines section found');
      return edges;
    }

    // Find all a:KeyValueOfguidanyType elements for edges
    const lineElements = lines.querySelectorAll('*');
    const keyValueElements = Array.from(lineElements).filter(el => 
      el.tagName === 'a:KeyValueOfguidanyType' || el.localName === 'KeyValueOfguidanyType'
    );
    
    
    for (const edgeElement of keyValueElements) {
      try {
        const edge = this.parseEdgeElement(edgeElement);
        if (edge) {
          edges.push(edge);
        }
      } catch (error) {
        console.warn('Failed to parse edge element:', error);
      }
    }

    return edges;
  }

  /**
   * Parse individual edge element (updated for real a:KeyValueOfguidanyType structure)
   */
  private parseEdgeElement(element: Element): Edge | null {
    // Get key and value from a:KeyValueOfguidanyType structure
    const keyElement = Array.from(element.children).find(child => 
      child.tagName === 'a:Key' || child.localName === 'Key'
    );
      
    const valueElement = Array.from(element.children).find(child => 
      child.tagName === 'a:Value' || child.localName === 'Value'
    );
    
    if (!keyElement || !valueElement) {
      console.warn('Missing Key or Value in edge element');
      return null;
    }

    const key = keyElement.textContent?.trim();
    if (!key) {
      console.warn('Empty key in edge element');
      return null;
    }

    // Extract source and target GUIDs from child elements
    const sourceGuidElement = Array.from(valueElement.children).find(child => 
      child.tagName === 'SourceGuid' || child.localName === 'SourceGuid'
    );
    
    const targetGuidElement = Array.from(valueElement.children).find(child => 
      child.tagName === 'TargetGuid' || child.localName === 'TargetGuid'
    );
    
    const sourceGuid = sourceGuidElement?.textContent?.trim();
    const targetGuid = targetGuidElement?.textContent?.trim();
    
    if (!sourceGuid || !targetGuid) {
      console.warn(`Edge ${key} missing source or target GUID`);
      return null;
    }

    // Filter out null/invalid GUIDs (common in TM7 files)
    const nullGuid = '00000000-0000-0000-0000-000000000000';
    if (sourceGuid === nullGuid || targetGuid === nullGuid) {
      console.warn(`Edge ${key} has null GUID (source: ${sourceGuid}, target: ${targetGuid}) - skipping`);
      return null;
    }

    // Extract edge type from i:type attribute (should be "Connector")
    const iType = valueElement.getAttribute('i:type');
    const edgeType = this.mapTM7EdgeTypeFromIType(iType);
    
    // Extract properties
    const properties = this.extractElementProperties(valueElement);


    return {
      id: key,
      type: edgeType,
      source: sourceGuid,
      targets: [targetGuid], // TM7 edges are point-to-point
      properties: extractTM7Properties(properties)
    };
  }

  /**
   * Parse boundaries from TM7 Borders and Lines sections (updated for real structure)
   */
  private parseBoundaries(doc: Document): Boundary[] {
    const boundaries: Boundary[] = [];
    
    // Navigate to the correct path: DrawingSurfaceList > DrawingSurfaceModel
    const drawingSurfaceModel = doc.querySelector('DrawingSurfaceList DrawingSurfaceModel');
    if (!drawingSurfaceModel) {
      console.warn('No DrawingSurfaceModel found for boundaries');
      return boundaries;
    }

    // Parse BorderBoundary elements from Borders section
    const borders = drawingSurfaceModel.querySelector('Borders');
    if (borders) {
      const borderElements = borders.querySelectorAll('*');
      const keyValueElements = Array.from(borderElements).filter(el => 
        el.tagName === 'a:KeyValueOfguidanyType' || el.localName === 'KeyValueOfguidanyType'
      );
      
      
      for (const borderElement of keyValueElements) {
        try {
          const boundary = this.parseBoundaryElement(borderElement);
          if (boundary) {
            boundaries.push(boundary);
          }
        } catch (error) {
          console.warn('Failed to parse boundary element from Borders:', error);
        }
      }
    }

    // Parse LineBoundary elements from Lines section  
    const lines = drawingSurfaceModel.querySelector('Lines');
    if (lines) {
      const lineElements = lines.querySelectorAll('*');
      const keyValueElements = Array.from(lineElements).filter(el => 
        el.tagName === 'a:KeyValueOfguidanyType' || el.localName === 'KeyValueOfguidanyType'
      );
      
      
      for (const lineElement of keyValueElements) {
        try {
          const boundary = this.parseBoundaryElement(lineElement);
          if (boundary) {
            boundaries.push(boundary);
          }
        } catch (error) {
          console.warn('Failed to parse boundary element from Lines:', error);
        }
      }
    }

    return boundaries;
  }

  /**
   * Parse individual boundary element (updated for real a:KeyValueOfguidanyType structure)
   */
  private parseBoundaryElement(element: Element): Boundary | null {
    // Get key and value from a:KeyValueOfguidanyType structure
    const keyElement = Array.from(element.children).find(child => 
      child.tagName === 'a:Key' || child.localName === 'Key'
    );
      
    const valueElement = Array.from(element.children).find(child => 
      child.tagName === 'a:Value' || child.localName === 'Value'
    );
    
    if (!keyElement || !valueElement) {
      return null;
    }

    const key = keyElement.textContent?.trim();
    if (!key) {
      return null;
    }

    // Extract type from i:type attribute on a:Value
    const iType = valueElement.getAttribute('i:type');
    
    // Only process boundary elements
    if (!this.isBoundaryType(iType)) {
      return null;
    }
    
    const boundaryType = this.mapTM7BoundaryTypeFromIType(iType);
    
    if (!boundaryType) {
      console.warn(`Unknown TM7 boundary i:type: ${iType}`);
      return null;
    }

    // Extract boundary properties from the Properties element
    const properties = this.extractElementProperties(valueElement);
    
    // Extract position information from child elements
    const position = this.extractPosition(valueElement);
    
    // Extract display name from properties
    const name = extractTM7DisplayName(properties) || 'Trust Boundary';


    // Determine if this is a line or rectangle boundary based on dimensions
    const isLineBoundary = iType === 'LineBoundary';
    
    // Keep original TM7 positioning - no hardcoded adjustments
    let adjustedPosition = { x: position.x, y: position.y };
    
    if (isLineBoundary) {
      // Only adjust X positioning to prevent overlap, keep Y as-is from TM7
      if (name.includes('Internet')) {
        adjustedPosition.x = position.x + 150; // Offset Internet boundary to the right
      }
    }
    
    return {
      id: key,
      type: boundaryType,
      name,
      position: adjustedPosition,
      bounds: { 
        width: position.width || (isLineBoundary ? 200 : 100), 
        height: position.height || (isLineBoundary ? 5 : 50) 
      },
      properties: {
        ...extractTM7Properties(properties),
        shape: isLineBoundary ? 'line' : 'rectangle'  // Add shape hint for rendering
      }
    };
  }

  /**
   * Extract position information from TM7 element (updated for real structure)
   */
  private extractPosition(element: Element): { x: number; y: number; width?: number; height?: number } {
    // Find position elements as direct children
    const leftElement = Array.from(element.children).find(child => 
      child.tagName === 'Left' || child.localName === 'Left'
    );
    const topElement = Array.from(element.children).find(child => 
      child.tagName === 'Top' || child.localName === 'Top'
    );
    const widthElement = Array.from(element.children).find(child => 
      child.tagName === 'Width' || child.localName === 'Width'
    );
    const heightElement = Array.from(element.children).find(child => 
      child.tagName === 'Height' || child.localName === 'Height'
    );

    const left = parseFloat(leftElement?.textContent || '0');
    const top = parseFloat(topElement?.textContent || '0');
    const width = parseFloat(widthElement?.textContent || '0');
    const height = parseFloat(heightElement?.textContent || '0');

    return {
      x: left,
      y: -top, // Flip Y coordinate: TM7 uses inverted Y coordinates (Y down) compared to our screen rendering (Y up)
      width: width || undefined,
      height: height || undefined
    };
  }

  /**
   * Extract properties from TM7 element (updated for real a:anyType structure)
   */
  private extractElementProperties(element: Element): any {
    const properties: any = {};
    
    // Find Properties element
    const propsElement = Array.from(element.children).find(child => 
      child.tagName === 'Properties' || child.localName === 'Properties'
    );
    
    if (!propsElement) {
      return properties;
    }

    // Find all a:anyType elements within Properties
    const anyTypeElements = Array.from(propsElement.children).filter(child => 
      child.tagName === 'a:anyType' || child.localName === 'anyType'
    );

    for (const anyType of anyTypeElements) {
      try {
        // Extract display name from b:DisplayName
        const displayNameElement = Array.from(anyType.children).find(child => 
          child.tagName === 'b:DisplayName' || child.localName === 'DisplayName'
        );
        
        // Extract name from b:Name
        const nameElement = Array.from(anyType.children).find(child => 
          child.tagName === 'b:Name' || child.localName === 'Name'
        );
        
        // Extract value from b:Value
        const valueElement = Array.from(anyType.children).find(child => 
          child.tagName === 'b:Value' || child.localName === 'Value'
        );
        
        const displayName = displayNameElement?.textContent?.trim();
        const name = nameElement?.textContent?.trim();
        const value = valueElement?.textContent?.trim();
        
        // Use name if available, otherwise use displayName as key
        const key = name || displayName;
        if (key && value) {
          properties[key] = value;
        } else if (key) {
          // Handle cases where value might be empty but we want to track the property
          properties[key] = value || '';
        }
      } catch (error) {
        console.warn('Error extracting property from anyType:', error);
      }
    }

    return properties;
  }

  /**
   * Extract TypeId from element
   */
  private extractTypeId(element: Element): string {
    return element.querySelector('TypeId')?.textContent || 
           element.querySelector('GenericTypeId')?.textContent || '';
  }

  /**
   * Map TM7 i:type attribute to TM8 NodeType (updated for real structure)
   */
  private mapTM7NodeTypeFromIType(iType: string | null): NodeType | null {
    if (!iType) return null;

    // Map based on the real i:type values found in structure analysis
    switch (iType) {
      case 'StencilEllipse':
        return NodeType.PROCESS;  // Generic Process uses StencilEllipse
      case 'StencilRectangle':
        return NodeType.EXTERNAL_ENTITY;  // External entities use StencilRectangle
      case 'StencilParallelLines':
        return NodeType.DATASTORE;  // Data stores use StencilParallelLines
      default:
        console.warn(`Unknown i:type: ${iType}`);
        return null;
    }
  }

  /**
   * Map TM7 node type to TM8 NodeType (legacy method, kept for compatibility)
   */
  private mapTM7NodeType(tm7Type: string): NodeType | null {
    // Check if it's a known stencil type
    for (const [tm7StencilType, tm8Type] of Object.entries(TM7_TO_TM8_NODE_TYPES)) {
      if (tm7Type.includes(tm7StencilType)) {
        return tm8Type;
      }
    }

    // Default mapping based on common TM7 patterns
    if (tm7Type.toLowerCase().includes('process')) return NodeType.PROCESS;
    if (tm7Type.toLowerCase().includes('store') || tm7Type.toLowerCase().includes('data')) return NodeType.DATASTORE;
    if (tm7Type.toLowerCase().includes('entity') || tm7Type.toLowerCase().includes('actor')) return NodeType.EXTERNAL_ENTITY;
    if (tm7Type.toLowerCase().includes('service')) return NodeType.SERVICE;

    return null;
  }

  /**
   * Map TM7 edge i:type to TM8 EdgeType (updated for real structure)
   */
  private mapTM7EdgeTypeFromIType(iType: string | null): EdgeType {
    if (!iType) return EdgeType.HTTPS;

    switch (iType) {
      case 'Connector':
        return EdgeType.HTTPS;  // Default to HTTPS for connectors
      default:
        console.warn(`Unknown edge i:type: ${iType}`);
        return EdgeType.HTTPS;
    }
  }

  /**
   * Map TM7 edge type to TM8 EdgeType (legacy method)
   */
  private mapTM7EdgeType(tm7Type: string): EdgeType {
    return TM7_TO_TM8_EDGE_TYPES[tm7Type] || EdgeType.HTTPS;
  }

  /**
   * Check if an i:type represents a boundary element
   */
  private isBoundaryType(iType: string | null): boolean {
    if (!iType) return false;
    return iType === 'BorderBoundary' || iType === 'LineBoundary';
  }

  /**
   * Map TM7 boundary i:type to TM8 BoundaryType
   */
  private mapTM7BoundaryTypeFromIType(iType: string | null): BoundaryType | null {
    if (!iType) return null;

    switch (iType) {
      case 'BorderBoundary':
        return BoundaryType.TRUST_BOUNDARY;  // Rectangle boundaries (TD Generic Trust Border)
      case 'LineBoundary':
        return BoundaryType.NETWORK_ZONE;    // Line boundaries (TD Generic Trust Line Boundary, TD Internet Boundary)
      default:
        console.warn(`Unknown boundary i:type: ${iType}`);
        return null;
    }
  }

  /**
   * Map TM7 boundary type to TM8 BoundaryType (legacy method)
   */
  private mapTM7BoundaryType(tm7Type: string): BoundaryType {
    return TM7_TO_TM8_BOUNDARY_TYPES[tm7Type] || BoundaryType.TRUST_BOUNDARY;
  }
}