---
inclusion: always
---

# Tech Stack & Build System

## Core Technologies

- **React 19.1.0**: Functional components with hooks; state centralized in `App.tsx` and passed via props
- **TypeScript 5.7.2**: Strict mode enforced; all code must be type-safe
- **Vite 6.3.5**: Build tool with base path `/project-unifier/` for GitHub Pages
- **marked 17.0.1**: Markdown parsing
- **dompurify 3.3.1**: HTML sanitization for safe markdown rendering

## TypeScript Requirements

- **Strict Mode**: Enabled and enforced
- **No Unused Variables**: `noUnusedLocals` and `noUnusedParameters` are true—compilation will fail if violated
- **Target**: ES2020
- **Module**: ESNext
- **JSX Files**: Use `.tsx` extension only

## Code Conventions

### Naming & File Organization
- **Components**: PascalCase filenames (e.g., `App.tsx`, `ControlsPanel.tsx`)
- **Hooks/Utilities**: camelCase filenames (e.g., `useProjectProcessor.ts`, `utils.ts`)
- **Imports**: ES6 modules only (no CommonJS)

### React Patterns
- All components are functional with hooks
- State is lifted to `App.tsx` and distributed via props
- Business logic is encapsulated in custom hooks (`/hooks`)
- Avoid prop drilling; lift state to appropriate parent level

### Styling
- **Framework**: Tailwind CSS (dark theme)
- **Primary Color**: Indigo (`indigo-600`, `indigo-500`)
- **Background**: Slate (`slate-950`, `slate-900`, `slate-800`)
- **Text**: Slate grays with white for contrast

## Build & Development

### Commands
```bash
npm run dev      # Development server (http://localhost:5173)
npm run build    # Production build (outputs to dist/)
npm run preview  # Preview production build locally
npm install      # Install dependencies
```

### Deployment
- GitHub Pages: `https://pedroluizmossi.github.io/project-unifier/`
- Base path in vite.config.ts: `/project-unifier/`
- Build artifacts: `dist/` folder
- Uses `gh-pages` package for deployment

## Key Implementation Details

### File Processing Pipeline
- User selects directory via File System Access API
- `useProjectProcessor` hook handles recursive traversal, filtering, and output generation
- Files filtered by ignore patterns (`.gitignore`-style) and size limits
- Output formats: Markdown (with optional tree) or JSON
- All processing happens client-side; no server uploads

### Type Safety
- All props must be typed with TypeScript interfaces
- Event handlers passed as props from parent components
- Avoid `any` type; use explicit types or generics

### Error Handling
- File system access errors caught and displayed to user
- Invalid patterns handled gracefully
- Large file processing should not block UI
