# Task 04: TM7 Parser & Exporter

## 🎯 Objective
Implement TM7 file format parser and exporter using the browser's built-in DOMParser for seamless import/export of threat models.

## 📋 Deliverables
1. `src/core/parser/TM7Parser.ts` - Parse TM7 XML to Graph objects
2. `src/core/parser/TM7Exporter.ts` - Export Graph objects to TM7 XML
3. `src/core/parser/TM7Types.ts` - TM7-specific type mappings
4. `src/core/parser/index.ts` - Public parser API

## 🔧 Technical Requirements

### TM7 Format Analysis
First analyze the sample files to understand structure:
- `samples/simple.tm7` - Basic structure
- `samples/aws-example.tm7` - Real-world example  
- `samples/big.tm7` - Large dataset (performance test)

### Parser Architecture
```typescript
class TM7Parser {
  parse(xmlContent: string): Graph;
  private parseNodes(doc: Document): Node[];
  private parseEdges(doc: Document): Edge[];
  private parseBoundaries(doc: Document): Boundary[];
  private mapTM7NodeType(tm7Type: string): NodeType;
}

class TM7Exporter {
  export(graph: Graph): string;
  private createXMLDocument(): Document;
  private addNodes(doc: Document, nodes: Node[]): void;
  private addEdges(doc: Document, edges: Edge[]): void;
  private mapNodeTypeToTM7(nodeType: NodeType): string;
}
```

### Type Mapping
Map between TM7 and internal types:
```typescript
interface TM7TypeMap {
  // TM7 -> Internal
  'tm.Process': NodeType.PROCESS;
  'tm.Store': NodeType.DATASTORE;
  'tm.Actor': NodeType.EXTERNAL_ENTITY;
  // ... other mappings
}
```

### Error Handling
- Graceful handling of malformed XML
- Missing required fields with sensible defaults
- Validation of parsed data structure
- Detailed error messages for debugging

### Performance Requirements
- Parse large files (>1MB) without blocking UI
- Stream processing for very large files
- Minimal memory usage during parsing
- Fast serialization for export

## 🎨 Integration Points

### File Handling
```typescript
// Usage example
async function loadTM7File(file: File): Promise<Graph> {
  const content = await file.text();
  const parser = new TM7Parser();
  return parser.parse(content);
}
```

### Browser API Usage
- Use `DOMParser` for XML parsing (no external dependencies)
- Use `XMLSerializer` for export
- FileReader API for file loading
- Blob API for download generation

## ✅ Acceptance Criteria
- [x] Successfully parses all sample TM7 files
- [x] Exports graphs that re-import identically
- [x] Handles malformed XML gracefully
- [x] Preserves all metadata and properties
- [x] Fast parsing (big.tm7 in <500ms)
- [x] Memory efficient (no excessive allocations)
- [x] Proper TypeScript types throughout

## 🔗 Dependencies
- Task 02: Core Types (Graph, Node, Edge interfaces)

## ⚡ Performance Notes
- Use browser's native XML parsing (fastest option)
- Consider streaming for very large files
- Profile with samples/big.tm7
- Avoid creating excessive intermediate objects