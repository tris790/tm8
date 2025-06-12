# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development:**
- `bun install` - Install dependencies
- `bun dev` - Start development server with hot reload
- `bun run` - Running server, no need to kill/start hot reload server
- `bun build` - Build for production (outputs to dist/)
- `bun start` - Run production build
- `bun run type-check` - TypeScript type checking (use this before committing)

**Key Files to Avoid:**
- Never read files from `samples/` directly into LLM context - they are several MBs of TM7 data. Use the parser instead or write a script that only print keys/schema and not everything

## Architecture Overview

TM8 is a high-performance threat modeling application built with React + TypeScript + Bun, designed to handle 1000+ nodes at 60fps using WebGL rendering.

**Core Systems:**
- **Canvas Engine** (`src/core/canvas/`): WebGL-based rendering with custom shaders for performance
- **Graph System** (`src/core/graph/`): Spatial indexing, algorithms, and state management for nodes/edges/boundaries
- **TM7 Parser** (`src/core/parser/`): Import/export Microsoft Threat Modeling Tool XML format
- **Type System** (`src/core/types/`): Central type definitions for Node, Edge, Boundary entities

**Data Model:**
- Nodes: process, datastore, external-entity, service (extensible)
- Edges: https, grpc (extensible, support multiple targets)
- Boundaries: trust-boundary, network-zone (extensible)
- All entities have flexible properties system for metadata

**Performance Requirements:**
- Load time: Instant for 1000+ nodes
- Interaction: Real-time like video game/professional editor
- Memory: Minimize usage
- Bundle size: Minimal library dependencies

**Path Aliases:**
- `@/*` → `./src/*`
- `@/components/*` → `./src/components/*`
- `@/core/*` → `./src/core/*`
- `@/hooks/*` → `./src/hooks/*`
- `@/utils/*` → `./src/utils/*`
- `@/styles/*` → `./src/styles/*`

**Styling:**
- Custom CSS with CSS variables (no framework)
- Dark mode theme in `styles/globals.css`
- Component-specific styles in `styles/components/`
- Color scheme: slate-900 bg, blue-500 primary, emerald-500 accent

**Development Strategy:**
- Speed first optimization
- Professional UX with keyboard shortcuts
- Extensible entity types
- WebGL rendering for performance
- React hooks for state management