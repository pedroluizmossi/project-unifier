# Tech Stack & Build System

## Core Technologies

### Frontend Framework
- **React 19.1.0**: UI library with hooks-based architecture
- **TypeScript 5.7.2**: Strict type checking enabled
- **Vite 6.3.5**: Build tool and dev server

### Key Dependencies
- **marked 17.0.1**: Markdown parsing and rendering
- **dompurify 3.3.1**: HTML sanitization for safe markdown rendering
- **react-dom 19.2.3**: React DOM rendering

### Development Tools
- **Node.js**: v18+ recommended
- **npm**: Package manager

## Build System (Vite)

### Configuration
- Base path: `/project-unifier/` (GitHub Pages deployment)
- Module resolution: Bundler mode
- JSX: React JSX transform
- Path alias: `@/*` maps to workspace root

### Common Commands

```bash
# Development server (http://localhost:5173)
npm run dev

# Production build (outputs to dist/)
npm run build

# Preview production build locally
npm run preview

# Install dependencies
npm install
```

## TypeScript Configuration

### Compiler Options
- **Target**: ES2020
- **Module**: ESNext
- **Strict Mode**: Enabled
- **Linting Rules**:
  - `noUnusedLocals`: true
  - `noUnusedParameters`: true
  - `noFallthroughCasesInSwitch`: true
  - `noUncheckedSideEffectImports`: true

### Important Notes
- Strict type checking is enforced—all code must be type-safe
- Unused variables and parameters will cause compilation errors
- JSX files use `.tsx` extension

## Code Style

### Conventions
- Use ES6 imports (not CommonJS)
- React components are functional with hooks
- Component files use PascalCase (e.g., `App.tsx`, `ControlsPanel.tsx`)
- Utility/hook files use camelCase (e.g., `useProjectProcessor.ts`, `utils.ts`)
- Tailwind CSS for styling (dark theme with slate/indigo color scheme)

### Tailwind Theme
- Primary color: Indigo (`indigo-600`, `indigo-500`)
- Background: Slate (`slate-950`, `slate-900`, `slate-800`)
- Text: Slate grays with white for contrast
- Dark theme throughout

## Deployment

- Hosted on GitHub Pages at `https://pedroluizmossi.github.io/project-unifier/`
- Built artifacts go to `dist/` folder
- Uses `gh-pages` package for deployment
