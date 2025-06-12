# Task 06: UI Components & Layout

## 🎯 Objective
Build the core UI components and layout system for the TM8 threat modeling application using custom CSS and React components.

## 📋 Deliverables
1. `src/components/layout/AppLayout.tsx` - Main application layout
2. `src/components/layout/Header.tsx` - Top navigation bar
3. `src/components/layout/Sidebar.tsx` - Tools and properties panels
4. `src/components/ui/Button.tsx` - Reusable button component
5. `src/components/ui/Input.tsx` - Input field component
6. `src/components/ui/Select.tsx` - Dropdown component
7. `src/styles/components/` - Component-specific styles

## 🔧 Technical Requirements

### Layout Structure
Match the plan's layout specification:
```
┌─────────────────────────────────────────────────────┐
│ [Logo] Threat Modeler    [Search] [Filter] [Export] │
├─────────────────────────────────────────────────────┤
|        canvas                           | Tools     |
|                                         ------------|
|                                         | Properties|
|                                         |           |
```

### Component Architecture
```typescript
// AppLayout.tsx
interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="app-layout">
      <Header />
      <div className="app-content">
        <main className="canvas-container">
          {children}
        </main>
        <Sidebar />
      </div>
    </div>
  );
};
```

### Header Component
```typescript
interface HeaderProps {
  onSearch: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch, onFilter, onExport }) => {
  // Logo, search, filter, export buttons
};
```

### Sidebar Component
```typescript
interface SidebarProps {
  activeTab: 'tools' | 'properties';
  onTabChange: (tab: 'tools' | 'properties') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  // Tools and properties panels
};
```

## 🎨 Styling System

### CSS Architecture
```css
/* styles/components/layout.css */
.app-layout {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
  background-color: var(--bg-primary);
  color: var(--color-text);
}

.app-content {
  display: grid;
  grid-template-columns: 1fr 300px;
  overflow: hidden;
}

.canvas-container {
  position: relative;
  overflow: hidden;
}
```

### Component Styles
Each component gets its own CSS file:
- `styles/components/header.css`
- `styles/components/sidebar.css`
- `styles/components/button.css`
- `styles/components/input.css`

### UI Component System
```typescript
// Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

// Input.tsx
interface InputProps {
  type: 'text' | 'search' | 'number';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}
```

## 🎨 Dark Theme Implementation

### CSS Variables Usage
```css
.button-primary {
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius);
  padding: var(--spacing-sm) var(--spacing-md);
}

.button-primary:hover {
  background-color: color-mix(in srgb, var(--color-primary) 80%, white);
}
```

### Responsive Design
- Sidebar collapses on smaller screens
- Header adapts to mobile layout
- Canvas remains full-width priority

## ✅ Acceptance Criteria
- [x] Layout matches the plan specification exactly
- [x] All components use CSS variables consistently
- [x] Header contains logo, search, filter, export
- [x] Sidebar has tools and properties tabs
- [x] Responsive design works on different screen sizes
- [x] Dark theme is properly implemented
- [x] All interactions are smooth and responsive
- [x] Components are reusable and well-typed

## 🔗 Dependencies
- Task 01: Project Setup (CSS variables, directory structure)
- Task 02: Core Types (for TypeScript interfaces)

## ⚡ Performance Notes
- Use CSS Grid for efficient layouts
- Minimize DOM updates with React best practices
- Optimize CSS with minimal specificity
- Lazy load non-critical components