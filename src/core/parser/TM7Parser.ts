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
   * Parse nodes from TM7 Borders section
   */
  private parseNodes(doc: Document): Node[] {
    const nodes: Node[] = [];
    const borders = doc.querySelector('Borders');
    
    if (!borders) {
      return nodes;
    }

    // Find all KeyValueOfguidanyType elements which contain node definitions
    const nodeElements = borders.querySelectorAll('KeyValueOfguidanyType');
    
    for (const nodeElement of nodeElements) {
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
   * Parse individual node element
   */
  private parseNodeElement(element: Element): Node | null {
    const key = element.querySelector('Key')?.textContent;
    const value = element.querySelector('Value');
    
    if (!key || !value) {
      return null;
    }

    // Extract node properties
    const properties = this.extractElementProperties(value);
    const typeId = this.extractTypeId(value);
    const nodeType = this.mapTM7NodeType(typeId);
    
    if (!nodeType) {
      console.warn(`Unknown TM7 node type: ${typeId}`);
      return null;
    }

    // Extract position information
    const position = this.extractPosition(value);
    const name = extractTM7DisplayName(properties);

    return {
      id: key,
      type: nodeType,
      name,
      position,
      properties: extractTM7Properties(properties)
    };
  }

  /**
   * Parse edges from TM7 Lines section
   */
  private parseEdges(doc: Document): Edge[] {
    const edges: Edge[] = [];
    const lines = doc.querySelector('Lines');
    
    if (!lines) {
      return edges;
    }

    const edgeElements = lines.querySelectorAll('KeyValueOfguidanyType');
    
    for (const edgeElement of edgeElements) {
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
   * Parse individual edge element
   */
  private parseEdgeElement(element: Element): Edge | null {
    const key = element.querySelector('Key')?.textContent;
    const value = element.querySelector('Value');
    
    if (!key || !value) {
      return null;
    }

    const sourceGuid = value.querySelector('SourceGuid')?.textContent;
    const targetGuid = value.querySelector('TargetGuid')?.textContent;
    
    if (!sourceGuid || !targetGuid) {
      return null;
    }

    const properties = this.extractElementProperties(value);
    const typeId = this.extractTypeId(value);
    const edgeType = this.mapTM7EdgeType(typeId);

    return {
      id: key,
      type: edgeType,
      source: sourceGuid,
      targets: [targetGuid], // TM7 edges are point-to-point
      properties: extractTM7Properties(properties)
    };
  }

  /**
   * Parse boundaries (trust boundaries, network zones)
   */
  private parseBoundaries(doc: Document): Boundary[] {
    const boundaries: Boundary[] = [];
    
    // TM7 boundaries might be stored in different sections
    // For now, we'll look for trust boundary elements
    const boundaryElements = doc.querySelectorAll('LineBoundary');
    
    for (const boundaryElement of boundaryElements) {
      try {
        const boundary = this.parseBoundaryElement(boundaryElement);
        if (boundary) {
          boundaries.push(boundary);
        }
      } catch (error) {
        console.warn('Failed to parse boundary element:', error);
      }
    }

    return boundaries;
  }

  /**
   * Parse individual boundary element
   */
  private parseBoundaryElement(element: Element): Boundary | null {
    const guid = element.querySelector('Guid')?.textContent;
    
    if (!guid) {
      return null;
    }

    const properties = this.extractElementProperties(element);
    const typeId = this.extractTypeId(element);
    const boundaryType = this.mapTM7BoundaryType(typeId);
    
    const position = this.extractPosition(element);
    const name = extractTM7DisplayName(properties) || 'Trust Boundary';

    return {
      id: guid,
      type: boundaryType,
      name,
      position: { x: position.x, y: position.y },
      bounds: { width: position.width || 100, height: position.height || 50 },
      properties: extractTM7Properties(properties)
    };
  }

  /**
   * Extract position information from TM7 element
   */
  private extractPosition(element: Element): { x: number; y: number; width?: number; height?: number } {
    const left = parseFloat(element.querySelector('Left')?.textContent || '0');
    const top = parseFloat(element.querySelector('Top')?.textContent || '0');
    const width = parseFloat(element.querySelector('Width')?.textContent || '0');
    const height = parseFloat(element.querySelector('Height')?.textContent || '0');

    return {
      x: left,
      y: top,
      width: width || undefined,
      height: height || undefined
    };
  }

  /**
   * Extract properties from TM7 element
   */
  private extractElementProperties(element: Element): any {
    const properties: any = {};
    const propsElement = element.querySelector('Properties');
    
    if (propsElement) {
      // Extract nested properties
      const anyTypes = propsElement.querySelectorAll('anyType');
      for (const anyType of anyTypes) {
        // Process nested property structure
        for (const child of anyType.children) {
          const name = child.querySelector('Name')?.textContent;
          const value = child.querySelector('Value')?.textContent;
          if (name && value) {
            properties[name] = value;
          }
        }
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
   * Map TM7 node type to TM8 NodeType
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
   * Map TM7 edge type to TM8 EdgeType
   */
  private mapTM7EdgeType(tm7Type: string): EdgeType {
    return TM7_TO_TM8_EDGE_TYPES[tm7Type] || EdgeType.HTTPS;
  }

  /**
   * Map TM7 boundary type to TM8 BoundaryType
   */
  private mapTM7BoundaryType(tm7Type: string): BoundaryType {
    return TM7_TO_TM8_BOUNDARY_TYPES[tm7Type] || BoundaryType.TRUST_BOUNDARY;
  }
}