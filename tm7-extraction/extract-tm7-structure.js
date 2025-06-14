#!/usr/bin/env node

/**
 * TM7 XML Structure Extractor
 * 
 * Extracts the actual hierarchical structure from TM7 files
 * Shows how elements are nested and organized (not just what elements exist)
 */

import { readFileSync, writeFileSync } from 'fs';
import { DOMParser } from '@xmldom/xmldom';

class TM7StructureExtractor {
  constructor() {
    this.structure = {};
    this.samples = [];
  }

  extractStructure(filePath) {
    console.log(`🏗️  Extracting XML structure from: ${filePath}`);
    
    const xmlContent = readFileSync(filePath, 'utf8');
    console.log(`📄 File size: ${(xmlContent.length / 1024).toFixed(0)}KB`);
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'application/xml');
    
    // Check for parsing errors
    const errors = doc.getElementsByTagName('parsererror');
    if (errors.length > 0) {
      throw new Error(`XML parsing failed: ${errors[0].textContent}`);
    }
    
    console.log('✅ XML parsed successfully');
    
    // Extract structure starting from root
    this.structure = this.extractElementStructure(doc.documentElement, 0);
    
    return {
      structure: this.structure,
      samples: this.samples
    };
  }

  extractElementStructure(element, depth = 0, maxDepth = 8) {
    if (!element || depth > maxDepth) return null;
    
    const tagName = element.tagName || element.nodeName;
    const result = {
      tag: tagName,
      attributes: {},
      children: [],
      textContent: null,
      depth: depth
    };
    
    // Extract key attributes (skip xmlns noise for clarity)
    if (element.attributes) {
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        if (!attr.name.startsWith('xmlns') && attr.value) {
          result.attributes[attr.name] = attr.value.length > 50 
            ? attr.value.substring(0, 50) + '...' 
            : attr.value;
        }
      }
    }
    
    // Get text content if this is a leaf node (no element children)
    const elementChildren = this.getElementChildren(element);
    if (elementChildren.length === 0 && element.textContent) {
      const text = element.textContent.trim();
      if (text.length > 0) {
        result.textContent = text.length > 100 
          ? text.substring(0, 100) + '...'
          : text;
      }
    }
    
    // Process child elements using childNodes to handle namespace issues
    if (elementChildren.length > 0) {
      const childStructures = new Map(); // Group by tag name
      
      for (const child of elementChildren) {
        const childStructure = this.extractElementStructure(child, depth + 1, maxDepth);
        if (childStructure) {
          const childTag = childStructure.tag;
          
          if (!childStructures.has(childTag)) {
            childStructures.set(childTag, []);
          }
          childStructures.get(childTag).push(childStructure);
        }
      }
      
      // Convert to result format and add counts
      for (const [childTag, instances] of childStructures) {
        result.children.push({
          tag: childTag,
          count: instances.length,
          instances: instances.slice(0, 3), // Keep first 3 examples
          hasMore: instances.length > 3
        });
      }
    }
    
    // Store interesting samples
    if (depth <= 3 && (result.children.length > 0 || result.textContent)) {
      this.samples.push({
        path: this.getElementPath(element),
        tag: tagName,
        attributes: result.attributes,
        childCount: result.children.length,
        hasText: !!result.textContent,
        textSample: result.textContent
      });
    }
    
    return result;
  }

  /**
   * Get element children, handling namespace issues properly
   */
  getElementChildren(element) {
    const children = [];
    
    if (element.childNodes) {
      for (let i = 0; i < element.childNodes.length; i++) {
        const child = element.childNodes[i];
        // Only include element nodes (nodeType 1), skip text/comment nodes
        if (child.nodeType === 1) {
          children.push(child);
        }
      }
    }
    
    return children;
  }

  getElementPath(element) {
    const path = [];
    let current = element;
    
    while (current && current.tagName) {
      let tagName = current.tagName;
      
      // Add index if there are siblings with same name
      if (current.parentNode) {
        const siblings = Array.from(current.parentNode.children || [])
          .filter(sibling => sibling.tagName === tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current);
          tagName += `[${index}]`;
        }
      }
      
      path.unshift(tagName);
      current = current.parentNode;
    }
    
    return path.join(' > ');
  }

  generateStructureReport(data) {
    let report = '# TM7 XML Structure Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    // Main structure
    report += '## Document Structure\n\n';
    report += this.formatStructure(data.structure, 0);
    
    // Key samples
    report += '\n## Key Element Samples\n\n';
    data.samples
      .filter(sample => sample.childCount > 0 || sample.hasText)
      .slice(0, 20)
      .forEach(sample => {
        report += `### ${sample.path}\n`;
        report += `- Tag: \`${sample.tag}\`\n`;
        
        if (Object.keys(sample.attributes).length > 0) {
          report += `- Attributes: ${JSON.stringify(sample.attributes, null, 2)}\n`;
        }
        
        if (sample.hasText) {
          report += `- Text: "${sample.textSample}"\n`;
        }
        
        if (sample.childCount > 0) {
          report += `- Children: ${sample.childCount} child elements\n`;
        }
        
        report += '\n';
      });
    
    return report;
  }

  formatStructure(structure, indent = 0) {
    if (!structure) return '';
    
    const prefix = '  '.repeat(indent);
    let result = `${prefix}- **${structure.tag}**`;
    
    // Add attributes if any
    if (Object.keys(structure.attributes).length > 0) {
      const attrStr = Object.entries(structure.attributes)
        .map(([k, v]) => `${k}="${v}"`)
        .join(', ');
      result += ` {${attrStr}}`;
    }
    
    // Add text content if any
    if (structure.textContent) {
      result += ` → "${structure.textContent}"`;
    }
    
    result += '\n';
    
    // Add children
    if (structure.children.length > 0) {
      for (const childGroup of structure.children) {
        result += `${prefix}  - **${childGroup.tag}** (${childGroup.count} instances)\n`;
        
        // Show structure of first instance
        if (childGroup.instances.length > 0) {
          result += this.formatStructure(childGroup.instances[0], indent + 2);
        }
        
        if (childGroup.hasMore) {
          result += `${prefix}    ... (${childGroup.count - childGroup.instances.length} more)\n`;
        }
      }
    }
    
    return result;
  }

  generateFixedTypes(data) {
    let ts = '/**\n * TM7 Structure-Based Types\n * Generated from actual XML structure analysis\n */\n\n';
    
    // Generate interfaces based on actual structure
    ts += this.generateInterfaceFromStructure(data.structure);
    
    return ts;
  }

  generateInterfaceFromStructure(structure, interfaceName = null) {
    if (!structure) return '';
    
    const name = interfaceName || `TM7${structure.tag.replace(/[^a-zA-Z0-9]/g, '')}`;
    let ts = `export interface ${name} {\n`;
    
    // Add attributes
    for (const [attrName, attrValue] of Object.entries(structure.attributes)) {
      ts += `  '${attrName}'?: string;\n`;
    }
    
    // Add text content if leaf node
    if (structure.textContent && structure.children.length === 0) {
      ts += `  textContent?: string;\n`;
    }
    
    // Add child elements
    for (const childGroup of structure.children) {
      const childTypeName = `TM7${childGroup.tag.replace(/[^a-zA-Z0-9]/g, '')}`;
      if (childGroup.count === 1) {
        ts += `  '${childGroup.tag}'?: ${childTypeName};\n`;
      } else {
        ts += `  '${childGroup.tag}'?: ${childTypeName}[];\n`;
      }
    }
    
    ts += '}\n\n';
    
    // Generate interfaces for child types
    for (const childGroup of structure.children) {
      if (childGroup.instances.length > 0) {
        const childInterface = this.generateInterfaceFromStructure(
          childGroup.instances[0], 
          `TM7${childGroup.tag.replace(/[^a-zA-Z0-9]/g, '')}`
        );
        ts += childInterface;
      }
    }
    
    return ts;
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('Usage: node extract-tm7-structure.js <tm7-file-path>');
    process.exit(1);
  }
  
  try {
    const extractor = new TM7StructureExtractor();
    const data = extractor.extractStructure(filePath);
    
    console.log('\n🎯 Structure extraction complete!');
    console.log(`📊 Found ${data.samples.length} sample elements`);
    
    // Generate structure report
    const report = extractor.generateStructureReport(data);
    writeFileSync('tm7-structure-report.md', report);
    console.log('📝 Structure report: tm7-structure-report.md');
    
    // Generate structure JSON for analysis
    writeFileSync('tm7-structure.json', JSON.stringify(data, null, 2));
    console.log('💾 Structure data: tm7-structure.json');
    
    // Generate corrected TypeScript types
    const types = extractor.generateFixedTypes(data);
    writeFileSync('src/core/parser/TM7StructureTypes.ts', types);
    console.log('🔧 Fixed types: src/core/parser/TM7StructureTypes.ts');
    
    console.log('\n📋 Quick structure preview:');
    console.log(extractor.formatStructure(data.structure, 0).split('\n').slice(0, 20).join('\n'));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

export { TM7StructureExtractor };