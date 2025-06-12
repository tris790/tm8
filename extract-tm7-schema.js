#!/usr/bin/env node

import fs from 'fs';
import { DOMParser } from 'xmldom';

function extractXMLSchema(xmlFilePath) {
    console.log(`\n=== Analyzing TM7 Schema: ${xmlFilePath} ===\n`);
    
    try {
        const xmlContent = fs.readFileSync(xmlFilePath, 'utf8');
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlContent, 'text/xml');
        
        const schema = {};
        const elementCounts = {};
        const attributeCollector = {};
        
        function analyzeElement(element, path = '') {
            if (element.nodeType !== 1) return; // Only process element nodes
            
            const tagName = element.tagName;
            const currentPath = path ? `${path}.${tagName}` : tagName;
            
            // Count elements
            elementCounts[tagName] = (elementCounts[tagName] || 0) + 1;
            
            // Collect attributes
            if (element.attributes && element.attributes.length > 0) {
                if (!attributeCollector[tagName]) {
                    attributeCollector[tagName] = new Set();
                }
                
                for (let i = 0; i < element.attributes.length; i++) {
                    const attr = element.attributes[i];
                    attributeCollector[tagName].add(`${attr.name}: "${attr.value}"`);
                }
            }
            
            // Track structure
            if (!schema[currentPath]) {
                schema[currentPath] = {
                    tag: tagName,
                    attributes: [],
                    children: new Set(),
                    textContent: element.textContent ? element.textContent.trim().substring(0, 100) : null
                };
            }
            
            // Process children
            for (let i = 0; i < element.childNodes.length; i++) {
                const child = element.childNodes[i];
                if (child.nodeType === 1) { // Element node
                    schema[currentPath].children.add(child.tagName);
                    analyzeElement(child, currentPath);
                }
            }
        }
        
        analyzeElement(doc.documentElement);
        
        // Convert Sets to Arrays for JSON serialization
        Object.keys(schema).forEach(path => {
            schema[path].children = Array.from(schema[path].children);
        });
        
        // Convert attribute Sets to Arrays
        Object.keys(attributeCollector).forEach(tag => {
            attributeCollector[tag] = Array.from(attributeCollector[tag]).slice(0, 5); // Limit samples
        });
        
        return {
            file: xmlFilePath,
            elementCounts,
            schema,
            sampleAttributes: attributeCollector
        };
        
    } catch (error) {
        console.error(`Error analyzing ${xmlFilePath}:`, error.message);
        return null;
    }
}

// Main execution
const sampleFiles = [
    './samples/simple.tm7',
    './samples/aws-example.tm7',
    './samples/big.tm7'
];

console.log('TM7 Schema Extraction Tool');
console.log('==========================');

const schemas = [];

sampleFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const schema = extractXMLSchema(file);
        if (schema) {
            schemas.push(schema);
            
            console.log(`File: ${file}`);
            console.log(`File Size: ${(fs.statSync(file).size / 1024).toFixed(1)} KB`);
            console.log('\nElement Counts:');
            Object.entries(schema.elementCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .forEach(([tag, count]) => {
                    console.log(`  ${tag}: ${count}`);
                });
            
            console.log('\nKey Element Attributes (samples):');
            Object.entries(schema.sampleAttributes).forEach(([tag, attrs]) => {
                if (attrs.length > 0) {
                    console.log(`  ${tag}:`);
                    attrs.forEach(attr => console.log(`    ${attr}`));
                }
            });
            
            console.log('\n' + '='.repeat(50) + '\n');
        }
    } else {
        console.log(`File not found: ${file}`);
    }
});

// Save consolidated schema
const consolidatedSchema = {
    timestamp: new Date().toISOString(),
    files: schemas.map(s => ({
        file: s.file,
        size: fs.statSync(s.file).size,
        elementCounts: s.elementCounts
    })),
    commonElements: {},
    schemaStructure: schemas[0]?.schema || {}
};

// Find common elements across all files
if (schemas.length > 0) {
    const allElements = new Set();
    schemas.forEach(s => {
        Object.keys(s.elementCounts).forEach(el => allElements.add(el));
    });
    
    allElements.forEach(element => {
        const counts = schemas.map(s => s.elementCounts[element] || 0);
        consolidatedSchema.commonElements[element] = {
            appearsIn: counts.filter(c => c > 0).length,
            totalCount: counts.reduce((a, b) => a + b, 0),
            avgPerFile: Math.round(counts.reduce((a, b) => a + b, 0) / schemas.length)
        };
    });
}

fs.writeFileSync('./tm7-schema.json', JSON.stringify(consolidatedSchema, null, 2));
console.log('Schema saved to: tm7-schema.json');
console.log('\nKey TM7 Element Types Identified:');
Object.entries(consolidatedSchema.commonElements)
    .filter(([, data]) => data.totalCount > 5)
    .sort(([,a], [,b]) => b.totalCount - a.totalCount)
    .forEach(([element, data]) => {
        console.log(`  ${element}: ${data.totalCount} total instances`);
    });