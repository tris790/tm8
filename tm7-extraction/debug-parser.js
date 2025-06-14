#!/usr/bin/env node

/**
 * Debug TM7 Parser - check what's actually being parsed
 */

import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { TM7Parser } from './src/core/parser/TM7Parser.ts';

// Set up JSDOM environment for full DOM support
const dom = new JSDOM();
global.DOMParser = dom.window.DOMParser;

const parser = new TM7Parser();
const xmlContent = readFileSync('./assets/dummy.tm7', 'utf8');

console.log('📄 Testing DOMParser directly...\n');

try {
  const domParser = new DOMParser();
  const doc = domParser.parseFromString(xmlContent, 'application/xml');
  console.log('Document:', doc.constructor.name);
  console.log('Root element:', doc.documentElement?.tagName);
  console.log('Has querySelector:', typeof doc.querySelector);
  
  console.log('\n📄 Parsing dummy.tm7...\n');
  const result = parser.parse(xmlContent);
  
  console.log('📊 Parse Results:');
  console.log(`  Nodes: ${result.nodes.length}`);
  console.log(`  Edges: ${result.edges.length}`);
  console.log(`  Boundaries: ${result.boundaries.length}`);
  
  if (result.nodes.length > 0) {
    console.log('\n🔷 Nodes:');
    result.nodes.forEach((node, i) => {
      console.log(`  ${i+1}. ${node.name} (${node.type}) at (${node.position.x}, ${node.position.y})`);
    });
  }
  
  if (result.boundaries.length > 0) {
    console.log('\n🚧 Boundaries:');
    result.boundaries.forEach((boundary, i) => {
      console.log(`  ${i+1}. ${boundary.name} (${boundary.type}) at (${boundary.position.x}, ${boundary.position.y})`);
    });
  } else {
    console.log('\n❌ No boundaries found!');
  }
  
  if (result.edges.length > 0) {
    console.log('\n🔗 Edges:');
    result.edges.forEach((edge, i) => {
      const sourceNode = result.nodes.find(n => n.id === edge.source);
      const targetNodes = edge.targets.map(t => result.nodes.find(n => n.id === t));
      
      console.log(`  ${i+1}. ${edge.id} (${edge.type})`);
      console.log(`      Source: ${edge.source} → ${sourceNode ? `${sourceNode.name} at (${sourceNode.position.x}, ${sourceNode.position.y})` : 'NOT FOUND'}`);
      console.log(`      Target: ${edge.targets[0]} → ${targetNodes[0] ? `${targetNodes[0].name} at (${targetNodes[0].position.x}, ${targetNodes[0].position.y})` : 'NOT FOUND'}`);
      
      // Check for potential rendering issues
      if (sourceNode && targetNodes[0]) {
        const distance = Math.sqrt(
          Math.pow(targetNodes[0].position.x - sourceNode.position.x, 2) + 
          Math.pow(targetNodes[0].position.y - sourceNode.position.y, 2)
        );
        console.log(`      Distance: ${distance.toFixed(1)} pixels`);
        
        // Check if coordinates look reasonable
        const coords = [sourceNode.position.x, sourceNode.position.y, targetNodes[0].position.x, targetNodes[0].position.y];
        const hasNaN = coords.some(c => isNaN(c));
        const hasInfinity = coords.some(c => !isFinite(c));
        const hasNegative = coords.some(c => c < 0);
        
        if (hasNaN) console.log(`      ⚠️  WARNING: NaN coordinates detected`);
        if (hasInfinity) console.log(`      ⚠️  WARNING: Infinite coordinates detected`);
        if (hasNegative) console.log(`      ⚠️  WARNING: Negative coordinates detected`);
        
        // Check if edge might be too short/long
        if (distance < 1) console.log(`      ⚠️  WARNING: Edge too short (${distance.toFixed(3)}px)`);
        if (distance > 5000) console.log(`      ⚠️  WARNING: Edge very long (${distance.toFixed(1)}px)`);
      }
    });
  } else {
    console.log('\n❌ No valid edges found!');
  }
  
} catch (error) {
  console.error('❌ Parse error:', error.message);
  console.error(error.stack);
}