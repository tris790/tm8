# Task 01: Project Setup & Build Configuration

## 🎯 Objective
Modify the existing bun init setup to match the TM8 threat modeling application architecture and requirements.

## 📋 Deliverables
1. Updated package.json with proper name and scripts
2. Restructured src/ directory to match plan architecture
3. TypeScript configuration optimized for performance
4. CSS variables and global styles setup
5. Clean up default bun template files

## 🔧 Technical Requirements

### Package.json Updates
- Change name from "bun-react-template" to "tm8-threat-modeler"
- Add type checking script: `"type-check": "bun --env-file=.env tsc --noEmit"`
- Keep existing bun build configuration (already optimized)

### Directory Restructure
Current: Basic bun template structure
Target: 
```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── canvas/          # Canvas-specific components  
│   ├── toolbar/         # Toolbar and tools components
│   ├── properties/      # Properties panel components
│   └── layout/          # Layout components
├── core/
│   ├── canvas/          # Canvas engine (WebGL, rendering)
│   ├── graph/           # Graph data structures
│   ├── parser/          # TM7 parser and exporter
│   └── types/           # TypeScript type definitions
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── styles/
│   ├── components/      # Component-specific styles
│   └── themes/          # Theme variations
└── App.tsx              # Main application component
```

### Files to Remove/Clean
- `src/APITester.tsx` (not needed)
- `src/frontend.tsx` (consolidate into App.tsx)
- `src/logo.svg` and `src/react.svg` (replace with custom)

### CSS Variables Setup
Replace `src/index.css` with proper global styles:
```css
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

### TypeScript Configuration
Update `tsconfig.json` for optimal performance:
- Enable strict mode
- Configure path mapping for clean imports
- Optimize for large codebase

## 🎨 Initial App Structure
Create basic layout matching the plan:
```
┌─────────────────────────────────────────────────────┐
│ [Logo] Threat Modeler    [Search] [Filter] [Export] │
├─────────────────────────────────────────────────────┤
|        canvas                           | Tools     |
|                                         ------------|
|                                         | Properties|
```

## ✅ Acceptance Criteria
- [x] Project builds successfully with `bun build`
- [x] Development server runs with `bun dev`
- [x] TypeScript type-checks with `bun run type-check`
- [x] All required directories exist and are empty (ready for development)
- [x] CSS variables are properly configured
- [x] Basic app structure renders the planned layout
- [x] No unused template files remain

## 🔗 Dependencies
- None (this is the foundation task)

## ⚡ Performance Notes
- Keep bun's optimized build configuration
- Use CSS variables for theming (zero runtime overhead)
- Prepare structure for WebGL canvas integration