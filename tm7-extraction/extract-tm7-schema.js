#!/usr/bin/env node

/**
 * Dynamic TM7 Schema Discovery Tool
 * 
 * Discovers XML schema by intelligently sampling large TM7 files
 * without loading entire content into memory. Adapts to format variations.
 */

import { readFileSync, writeFileSync, statSync, openSync, readSync, closeSync } from 'fs';

const CHUNK_SIZE = 8192; // 8KB chunks for streaming analysis
const MAX_SAMPLES = 20;  // Maximum chunks to analyze

class TM7SchemaDiscoverer {
  constructor() {
    this.discoveredElements = new Map(); // element -> { attributes: Set, children: Set, examples: [] }
    this.xmlNamespaces = new Set();
    this.rootStructure = null;
    this.currentDepth = 0;
    this.maxDepth = 0;
  }

  /**
   * Discover schema by streaming through file
   */
  discoverSchema(filePath) {
    console.log(`🔍 Discovering schema from: ${filePath}`);
    const fileSize = statSync(filePath).size;
    console.log(`📊 File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Sample from different parts of the file
    const samplePositions = this.calculateSamplePositions(fileSize);
    
    for (const [index, position] of samplePositions.entries()) {
      console.log(`📖 Analyzing sample ${index + 1}/${samplePositions.length} at position ${(position / 1024).toFixed(0)}KB`);
      const chunk = this.readChunk(filePath, position, CHUNK_SIZE);
      this.analyzeChunk(chunk, position);
    }
    
    return this.generateDiscoveredSchema();
  }

  /**
   * Calculate optimal sampling positions throughout the file
   */
  calculateSamplePositions(fileSize) {
    const positions = [];
    
    // Always sample the beginning for root structure
    positions.push(0);
    
    if (fileSize > CHUNK_SIZE * 2) {
      // Sample evenly throughout the file
      const sampleCount = Math.min(MAX_SAMPLES - 1, Math.floor(fileSize / (CHUNK_SIZE * 4)));
      for (let i = 1; i < sampleCount; i++) {
        const position = Math.floor((fileSize / sampleCount) * i);
        positions.push(position);
      }
    }
    
    return positions;
  }

  /**
   * Read a chunk from file at specific position
   */
  readChunk(filePath, position, size) {
    const fd = openSync(filePath, 'r');
    const buffer = Buffer.alloc(size);
    
    try {
      const bytesRead = readSync(fd, buffer, 0, size, position);
      return buffer.toString('utf8', 0, bytesRead);
    } finally {
      closeSync(fd);
    }
  }

  /**
   * Analyze a chunk of XML content
   */
  analyzeChunk(chunk, position) {
    // Find complete XML elements in this chunk
    const elements = this.extractCompleteElements(chunk);
    
    // Also look for partial elements and attributes to understand structure
    this.extractElementPatterns(chunk);
    
    // Process complete elements
    elements.forEach(element => {
      try {
        this.analyzeElementString(element);
      } catch (error) {
        // Skip malformed elements, continue discovery
        console.log(`⚠️  Skipped malformed element at position ${position}`);
      }
    });
  }

  /**
   * Extract complete XML elements from chunk
   */
  extractCompleteElements(chunk) {
    const elements = [];
    
    // Find elements with opening and closing tags
    const elementRegex = /<([a-zA-Z][a-zA-Z0-9:._-]*)[^>]*>[\s\S]*?<\/\1>/g;
    let match;
    
    while ((match = elementRegex.exec(chunk)) !== null) {
      elements.push(match[0]);
      if (elements.length > 10) break; // Limit per chunk
    }
    
    // Also find self-closing elements
    const selfClosingRegex = /<([a-zA-Z][a-zA-Z0-9:._-]*)[^>]*\/>/g;
    while ((match = selfClosingRegex.exec(chunk)) !== null) {
      elements.push(match[0]);
      if (elements.length > 20) break;
    }
    
    return elements;
  }

  /**
   * Extract element patterns even from partial XML
   */
  extractElementPatterns(chunk) {
    // Find opening tags with attributes
    const tagRegex = /<([a-zA-Z][a-zA-Z0-9:._-]*)((?:\s+[^>]*)?)>/g;
    let match;
    
    while ((match = tagRegex.exec(chunk)) !== null) {
      const elementName = match[1];
      const attributesStr = match[2];
      
      this.recordElement(elementName);
      
      if (attributesStr) {
        this.extractAttributes(elementName, attributesStr);
      }
    }
    
    // Extract namespaces
    const nsRegex = /xmlns(?::([^=]*?))?=["']([^"']+)["']/g;
    while ((match = nsRegex.exec(chunk)) !== null) {
      this.xmlNamespaces.add(match[2]);
    }
  }

  /**
   * Record discovered element
   */
  recordElement(elementName) {
    if (!this.discoveredElements.has(elementName)) {
      this.discoveredElements.set(elementName, {
        attributes: new Set(),
        children: new Set(),
        examples: [],
        frequency: 0
      });
    }
    
    const element = this.discoveredElements.get(elementName);
    element.frequency++;
  }

  /**
   * Extract attributes from element string
   */
  extractAttributes(elementName, attributesStr) {
    const attrRegex = /([a-zA-Z][a-zA-Z0-9:._-]*)\s*=\s*["']([^"']*)["']/g;
    let match;
    
    const element = this.discoveredElements.get(elementName);
    
    while ((match = attrRegex.exec(attributesStr)) !== null) {
      element.attributes.add(match[1]);
    }
  }

  /**
   * Analyze individual element string to understand structure
   */
  analyzeElementString(elementStr) {
    // Simple parsing to extract parent-child relationships
    const openTagMatch = elementStr.match(/^<([a-zA-Z][a-zA-Z0-9:._-]*)[^>]*>/);
    if (!openTagMatch) return;
    
    const parentName = openTagMatch[1];
    this.recordElement(parentName);
    
    // Find direct children (not nested)
    const childRegex = /<([a-zA-Z][a-zA-Z0-9:._-]*)[^>]*(?:\/>|>[\s\S]*?<\/\1>)/g;
    let match;
    let depth = 0;
    
    while ((match = childRegex.exec(elementStr)) !== null) {
      const childName = match[1];
      if (childName !== parentName) { // Avoid self-reference
        this.discoveredElements.get(parentName).children.add(childName);
        this.recordElement(childName);
      }
    }
    
    // Store example for later analysis
    if (this.discoveredElements.get(parentName).examples.length < 3) {
      this.discoveredElements.get(parentName).examples.push(
        elementStr.length > 500 ? elementStr.substring(0, 500) + '...' : elementStr
      );
    }
  }

  /**
   * Generate discovered schema object
   */
  generateDiscoveredSchema() {
    const schema = {
      elements: {},
      namespaces: Array.from(this.xmlNamespaces),
      statistics: {
        totalElements: this.discoveredElements.size,
        totalNamespaces: this.xmlNamespaces.size
      },
      discoveryMeta: {
        timestamp: new Date().toISOString(),
        method: 'streaming-analysis'
      }
    };
    
    // Convert Maps to objects for JSON serialization
    for (const [elementName, data] of this.discoveredElements) {
      schema.elements[elementName] = {
        attributes: Array.from(data.attributes).sort(),
        children: Array.from(data.children).sort(),
        frequency: data.frequency,
        examples: data.examples
      };
    }
    
    // Identify likely root elements (high frequency, many children)
    const rootCandidates = Array.from(this.discoveredElements.entries())
      .filter(([name, data]) => data.children.size > 5)
      .sort(([,a], [,b]) => b.frequency - a.frequency)
      .slice(0, 5)
      .map(([name]) => name);
    
    schema.rootCandidates = rootCandidates;
    
    return schema;
  }

  /**
   * Generate TypeScript types from discovered schema
   */
  generateTypeScript(schema) {
    let ts = `/**\n * Generated TM7 Schema Types (Discovered)\n * Generated: ${schema.discoveryMeta.timestamp}\n */\n\n`;
    
    // Namespace constants
    if (schema.namespaces.length > 0) {
      ts += `export const TM7_NAMESPACES = {\n`;
      schema.namespaces.forEach((ns, i) => {
        const key = this.namespaceToKey(ns);
        ts += `  ${key}: '${ns}',\n`;
      });
      ts += `} as const;\n\n`;
    }
    
    // Element type enum
    ts += `export enum TM7DiscoveredElements {\n`;
    Object.keys(schema.elements).sort().forEach(element => {
      const enumKey = element.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      ts += `  ${enumKey} = '${element}',\n`;
    });
    ts += `}\n\n`;
    
    // Generate interfaces for each discovered element
    Object.entries(schema.elements).forEach(([elementName, data]) => {
      if (data.attributes.length > 0 || data.children.length > 0) {
        const interfaceName = `TM7${this.toPascalCase(elementName)}`;
        ts += `export interface ${interfaceName} {\n`;
        
        // Attributes as optional strings
        data.attributes.forEach(attr => {
          ts += `  '${attr}'?: string;\n`;
        });
        
        // Child elements
        data.children.forEach(child => {
          const childType = schema.elements[child] ? `TM7${this.toPascalCase(child)}` : 'any';
          ts += `  '${child}'?: ${childType} | ${childType}[];\n`;
        });
        
        // Text content for elements that might have it
        if (data.children.length === 0) {
          ts += `  textContent?: string;\n`;
        }
        
        ts += `}\n\n`;
      }
    });
    
    // Statistics comment
    ts += `/**\n * Schema Discovery Statistics:\n`;
    ts += ` * - Elements discovered: ${schema.statistics.totalElements}\n`;
    ts += ` * - Namespaces found: ${schema.statistics.totalNamespaces}\n`;
    ts += ` * - Root candidates: ${schema.rootCandidates?.join(', ')}\n`;
    ts += ` */\n`;
    
    return ts;
  }

  /**
   * Convert namespace URL to valid TypeScript key
   */
  namespaceToKey(namespace) {
    return namespace
      .replace(/https?:\/\//, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toUpperCase();
  }

  /**
   * Convert element name to PascalCase
   */
  toPascalCase(str) {
    return str
      .split(/[^a-zA-Z0-9]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('Usage: node extract-tm7-schema.js <tm7-file-path>');
    process.exit(1);
  }
  
  try {
    const discoverer = new TM7SchemaDiscoverer();
    const schema = discoverer.discoverSchema(filePath);
    
    console.log('\n🎉 === TM7 Schema Discovery Complete ===');
    console.log(`📋 Discovered ${schema.statistics.totalElements} unique elements`);
    console.log(`🌐 Found ${schema.statistics.totalNamespaces} namespaces`);
    
    if (schema.rootCandidates?.length > 0) {
      console.log(`🏗️  Root element candidates: ${schema.rootCandidates.join(', ')}`);
    }
    
    // Write discovered schema
    writeFileSync('tm7-schema.json', JSON.stringify(schema, null, 2));
    console.log('\n💾 Schema saved to: tm7-schema.json');
    
    // Generate TypeScript types
    const tsTypes = discoverer.generateTypeScript(schema);
    writeFileSync('src/core/parser/TM7DiscoveredTypes.ts', tsTypes);
    console.log('📝 TypeScript types generated: src/core/parser/TM7DiscoveredTypes.ts');
    
    // Show top elements by frequency
    const topElements = Object.entries(schema.elements)
      .sort(([,a], [,b]) => b.frequency - a.frequency)
      .slice(0, 10);
    
    console.log('\n📊 Most frequent elements:');
    topElements.forEach(([name, data]) => {
      console.log(`   ${name}: ${data.frequency} occurrences, ${data.children.length} children, ${data.attributes.length} attributes`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

export { TM7SchemaDiscoverer };