# Threat Modeling Software - Implementation Plan

## 🎯 Project Overview
Building a high-performance, professional threat modeling application with TM7 import/export support.

## 🏗️ Architecture

**Core Tech Stack:**
- **Frontend**: React + TypeScript + bun js
- **Canvas**: webgl
- **XML Processing**: builtin browser DOMParser
- **Storage**: none to start but file in future and load from network request

## 📊 Data Models

```typescript
enum NodeType { // User can extend
  'process',
  'datastore',
  'external-entity',
  'service'
}

// Node
interface Node {
  id: string;
  type: NodeType;
  name: string;
  position: { x: number; y: number };
  properties: Record<string, any>; // "repo", "team", "role", "avatar" any other that user adds (might be unique to that node)
}

enum EdgeType { // User can extend
  'https',
  'grpc',
}

// Connections between nodes
interface Edge{
  id: string
  type: EdgeType;
  source: string;
  targets: string[];
  properties: Record<string, any>; // "encrypted", "routes" any other that user adds (might be unique to that node)
}

enum BoundaryType { // User can extend
  'trust-boundary',
  'network-zone'
}

// Trust boundaries and zones
interface Boundary extends Entity {
  type: BoundaryType;
  bounds: { width: number; height: number };
}

```

## 🎨 UI/UX Design

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ [Logo] Threat Modeler    [Search] [Filter] [Export] │
├─────────────────────────────────────────────────────┤
|        canvas                           | Tools     |
|                                         ------------|
|                                         | Properties|
|                                         |           |
|                                         |           |
|                                         |           |
|                                         |           |
|                                         |           |
|                                         |           |
|                                         |           |
__________________________________________|___________|
```

**Color Scheme (Dark Mode):**
- Background: `#0f172a` (slate-900)
- Surface: `#1e293b` (slate-800)
- Primary: `#3b82f6` (blue-500)
- Text: `#f1f5f9` (slate-100)
- Accent: `#10b981` (emerald-500)

## 📁 File Structure
```
src/
├── components/           # React components
│   ├── ui/              # Reusable UI components (buttons, inputs, etc.)
│   ├── canvas/          # Canvas-specific components
│   ├── toolbar/         # Toolbar and tools components
│   ├── properties/      # Properties panel components
│   └── layout/          # Layout components (header, sidebar, etc.)
├── core/                # Core business logic
│   ├── canvas/          # Canvas engine (WebGL, rendering, interactions)
│   ├── graph/           # Graph data structures and algorithms
│   ├── parser/          # TM7 parser and exporter
│   └── types/           # TypeScript type definitions
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── styles/              # Global styles and CSS variables
└── App.tsx              # Main application component

samples/*                # Sample TM7 files (NEVER load into LLM context - several MBs)
public/                  # Static assets
dist/                    # Build output

## 🎨 Styling Strategy

**Approach: Custom CSS with CSS Variables**

Given the performance requirements and "minimize library use" goal, we'll use a custom CSS approach:

```css
/* CSS Variables for theming */
:root {
  --bg-primary: #0f172a;     /* slate-900 */
  --bg-surface: #1e293b;     /* slate-800 */
  --color-primary: #3b82f6;  /* blue-500 */
  --color-text: #f1f5f9;     /* slate-100 */
  --color-accent: #10b981;   /* emerald-500 */
  --radius: 0.5rem;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}
```

**Why Custom CSS:**
- **Performance**: Zero runtime overhead, smallest bundle size
- **Control**: Full control over styling without framework constraints
- **WebGL Integration**: Easier to synchronize with canvas rendering
- **Professional Look**: Hand-crafted styles for pixel-perfect UI

**Organization:**
- `styles/globals.css` - CSS variables, reset, base styles
- `styles/components/` - Component-specific styles
- `styles/themes/` - Theme variations (dark/light mode)

**Alternative Considered:**
- **Tailwind**: Great for rapid prototyping but adds bundle size
- **shadcn + Tailwind**: Excellent components but conflicts with minimal library goal

## 🎯 Key Performance Targets
- **Load Time**: Instant for 1000 nodes+
- **Interaction**: realtime like a video game or professional editor
- **Memory**: lower possible
- **Minimize library use**

## 🔧 Development Priorities
1. **Speed First**: Optimize for snappy interactions
2. **Professional UX**: Clean, intuitive interface
3. **TM7 Compatibility**: Seamless import/export
4. **Extensibility**: Easy to add new node types
5. **Keyboard-Driven**: Power user friendly

## 📋 Requirements Coverage

### ✅ Core Requirements
- [x] Fast and performant 
- [x] Large number of entities support (virtualization)
- [x] TM7 import/export (dedicated parser/exporter)
- [x] Professional, delightful UI (dark mode)
- [x] Infinite canvas with zoom/pan
- [x] Metadata/properties on entities (flexible property system)
- [x] Focus/hide parts of graph (filtering system)
- [x] Move entities around (drag & drop)
- [x] Search and filter (real-time search with fuzzy matching)
- [x] Save/reload graphs (from file or db what ever is easier)
- [x] Extensible entities (flexible type system)
- [x] Quick node/edge creation (keyboard shortcuts + UI)
- [x] Dark mode (CSS variables)

### 🔮 Future Goals
- [ ] Auto-calculate threats based on properties
- [ ] Export to PNG (React has built-in support)

This plan balances ambitious features with realistic timelines. Each phase builds incrementally toward the full vision while maintaining a working application throughout development.
