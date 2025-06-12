/**
 * TM7 XML Exporter for converting TM8 Graph objects to Microsoft Threat Modeling Tool format
 * Uses browser's native XMLSerializer for efficient XML generation
 */

import type { Graph, Node, Edge, Boundary } from '../types/graph';
import { NodeType, EdgeType, BoundaryType } from '../types/enums';
import {
  TM8_TO_TM7_NODE_TYPES,
  TM8_TO_TM7_EDGE_TYPES,
  TM8_TO_TM7_BOUNDARY_TYPES,
  TM7_XML_TEMPLATE,
  generateTM7Guid
} from './TM7Types';

export class TM7ExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TM7ExportError';
  }
}

export class TM7Exporter {
  private readonly serializer = new XMLSerializer();
  private readonly parser = new DOMParser();

  /**
   * Export TM8 Graph to TM7 XML format
   */
  export(graph: Graph): string {
    try {
      const xmlDoc = this.createXMLDocument(graph);
      return this.serializer.serializeToString(xmlDoc);
    } catch (error) {
      throw new TM7ExportError(`Failed to export to TM7 format: ${error.message}`);
    }
  }

  /**
   * Create the complete TM7 XML document
   */
  private createXMLDocument(graph: Graph): Document {
    // Start with the TM7 template
    let xmlContent = TM7_XML_TEMPLATE;
    
    // Generate unique GUID for drawing surface
    const drawingSurfaceGuid = generateTM7Guid();
    
    // Replace template placeholders
    xmlContent = xmlContent.replace('{{DRAWING_SURFACE_GUID}}', drawingSurfaceGuid);
    xmlContent = xmlContent.replace('{{MODEL_NAME}}', this.escapeXml(graph.metadata.name));
    
    // Generate nodes XML
    const nodesXml = this.generateNodesXml(graph.nodes);
    xmlContent = xmlContent.replace('{{NODES}}', nodesXml);
    
    // Generate edges XML
    const edgesXml = this.generateEdgesXml(graph.edges);
    xmlContent = xmlContent.replace('{{EDGES}}', edgesXml);

    // Parse the complete XML
    const doc = this.parser.parseFromString(xmlContent, 'application/xml');
    
    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new TM7ExportError(`Generated invalid XML: ${parserError.textContent}`);
    }

    return doc;
  }

  /**
   * Generate XML for all nodes
   */
  private generateNodesXml(nodes: Node[]): string {
    return nodes.map(node => this.generateNodeXml(node)).join('\n');
  }

  /**
   * Generate XML for a single node
   */
  private generateNodeXml(node: Node): string {
    const tm7Type = this.mapNodeTypeToTM7(node.type);
    const properties = this.generateNodeProperties(node);
    
    return `
        <KeyValueOfguidanyType>
          <Key>${node.id}</Key>
          <Value xsi:type="${tm7Type}">
            <GenericTypeId>00000000-0000-0000-0000-000000000000</GenericTypeId>
            <Guid>${node.id}</Guid>
            <Properties>
              ${properties}
            </Properties>
            <TypeId>00000000-0000-0000-0000-000000000000</TypeId>
            <Left>${node.position.x}</Left>
            <Top>${node.position.y}</Top>
            <Width>160</Width>
            <Height>80</Height>
            <StrokeDashArray i:nil="true" />
            <StrokeThickness>2</StrokeThickness>
          </Value>
        </KeyValueOfguidanyType>`;
  }

  /**
   * Generate properties XML for a node
   */
  private generateNodeProperties(node: Node): string {
    const properties: string[] = [];
    
    // Add display name property
    properties.push(`
              <anyType xsi:type="StringToStringDictionaryEntry">
                <Name>DisplayName</Name>
                <Value>${this.escapeXml(node.name)}</Value>
              </anyType>`);
    
    // Add custom properties
    for (const [key, value] of Object.entries(node.properties)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        properties.push(`
              <anyType xsi:type="StringToStringDictionaryEntry">
                <Name>${this.escapeXml(key)}</Name>
                <Value>${this.escapeXml(String(value))}</Value>
              </anyType>`);
      }
    }

    return properties.join('');
  }

  /**
   * Generate XML for all edges
   */
  private generateEdgesXml(edges: Edge[]): string {
    return edges.map(edge => this.generateEdgeXml(edge)).join('\n');
  }

  /**
   * Generate XML for a single edge
   */
  private generateEdgeXml(edge: Edge): string {
    const tm7Type = this.mapEdgeTypeToTM7(edge.type);
    const properties = this.generateEdgeProperties(edge);
    
    // TM7 edges are point-to-point, so we create separate edges for multiple targets
    return edge.targets.map(target => `
        <KeyValueOfguidanyType>
          <Key>${edge.id}-${target}</Key>
          <Value xsi:type="${tm7Type}">
            <GenericTypeId>00000000-0000-0000-0000-000000000000</GenericTypeId>
            <Guid>${edge.id}-${target}</Guid>
            <Properties>
              ${properties}
            </Properties>
            <TypeId>00000000-0000-0000-0000-000000000000</TypeId>
            <SourceGuid>${edge.source}</SourceGuid>
            <TargetGuid>${target}</TargetGuid>
            <HandleX>0</HandleX>
            <HandleY>0</HandleY>
            <PortSource>0</PortSource>
            <PortTarget>0</PortTarget>
            <SourceX>0</SourceX>
            <SourceY>0</SourceY>
            <TargetX>0</TargetX>
            <TargetY>0</TargetY>
          </Value>
        </KeyValueOfguidanyType>`).join('\n');
  }

  /**
   * Generate properties XML for an edge
   */
  private generateEdgeProperties(edge: Edge): string {
    const properties: string[] = [];
    
    // Add edge type information
    properties.push(`
              <anyType xsi:type="StringToStringDictionaryEntry">
                <Name>EdgeType</Name>
                <Value>${this.escapeXml(edge.type)}</Value>
              </anyType>`);
    
    // Add custom properties
    for (const [key, value] of Object.entries(edge.properties)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        properties.push(`
              <anyType xsi:type="StringToStringDictionaryEntry">
                <Name>${this.escapeXml(key)}</Name>
                <Value>${this.escapeXml(String(value))}</Value>
              </anyType>`);
      }
    }

    return properties.join('');
  }

  /**
   * Map TM8 NodeType to TM7 stencil type
   */
  private mapNodeTypeToTM7(nodeType: NodeType): string {
    return TM8_TO_TM7_NODE_TYPES[nodeType] || 'StencilRectangle';
  }

  /**
   * Map TM8 EdgeType to TM7 connector type
   */
  private mapEdgeTypeToTM7(edgeType: EdgeType): string {
    return TM8_TO_TM7_EDGE_TYPES[edgeType] || 'Connector';
  }

  /**
   * Map TM8 BoundaryType to TM7 boundary type
   */
  private mapBoundaryTypeToTM7(boundaryType: BoundaryType): string {
    return TM8_TO_TM7_BOUNDARY_TYPES[boundaryType] || 'LineBoundary';
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Export with pretty formatting (for debugging)
   */
  exportPretty(graph: Graph): string {
    const xmlString = this.export(graph);
    return this.formatXml(xmlString);
  }

  /**
   * Format XML with proper indentation
   */
  private formatXml(xml: string): string {
    const doc = this.parser.parseFromString(xml, 'application/xml');
    return this.serializer.serializeToString(doc);
  }
}