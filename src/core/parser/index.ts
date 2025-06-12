/**
 * Public API for TM7 parsing and export functionality
 */

export { TM7Parser, TM7ParseError } from './TM7Parser';
export { TM7Exporter, TM7ExportError } from './TM7Exporter';
export {
  TM7_ELEMENT_TYPES,
  TM7_TO_TM8_NODE_TYPES,
  TM8_TO_TM7_NODE_TYPES,
  TM7_TO_TM8_EDGE_TYPES,
  TM8_TO_TM7_EDGE_TYPES,
  TM7_TO_TM8_BOUNDARY_TYPES,
  TM8_TO_TM7_BOUNDARY_TYPES,
  extractTM7DisplayName,
  extractTM7Properties,
  generateTM7Guid
} from './TM7Types';

export type {
  TM7NodeElement,
  TM7EdgeElement,
  TM7BoundaryElement,
  TM7Position,
  TM7PropertyMap
} from './TM7Types';

// Convenience functions for common operations
export async function parseTM7File(file: File): Promise<import('../types/graph').Graph> {
  const content = await file.text();
  const parser = new TM7Parser();
  return parser.parse(content);
}

export function exportToTM7(graph: import('../types/graph').Graph): string {
  const exporter = new TM7Exporter();
  return exporter.export(graph);
}