# Project Structure

## Directory Organization

```
project-unifier/
├── components/          # React components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and constants
├── dist/               # Build output (generated)
├── node_modules/       # Dependencies (generated)
├── .git/               # Git repository
├── .github/            # GitHub workflows and config
├── .kiro/              # Kiro IDE configuration
├── index.html          # HTML entry point
├── index.tsx           # React app entry point
├── index.css           # Global styles
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite build configuration
├── package.json        # Dependencies and scripts
├── package-lock.json   # Locked dependency versions
├── metadata.json       # Project metadata
└── README.md           # Project documentation
```

## Component Architecture

### `/components`
React UI components organized by feature/panel:

- **App.tsx**: Main application component, layout orchestration, state management
- **ControlsPanel.tsx**: Settings panel (ignore patterns, file size, output format)
- **OutputPanel.tsx**: Display area for generated output (markdown/JSON)
- **DirectoryStructurePanel.tsx**: File tree sidebar with statistics
- **FileStatsPanel.tsx**: Statistics display (file counts, token estimates)
- **MarkdownPreview.tsx**: Markdown rendering with sanitization
- **Header.tsx**: Top navigation bar
- **Footer.tsx**: Footer component

### Component Patterns
- Functional components with React hooks
- Props-based configuration
- State lifted to `App.tsx` for shared state
- Event handlers passed as props to child components

## Hooks

### `/hooks`
Custom React hooks for business logic:

- **useProjectProcessor.ts**: Main hook handling directory processing, file reading, output generation, and state management for the processing pipeline

## Utilities

### `/lib`
Shared utility functions and constants:

- **utils.ts**: Helper functions, constants (e.g., `DEFAULT_IGNORE_PATTERNS`), file processing logic

## Key Files

### Entry Points
- **index.html**: HTML template with root div for React
- **index.tsx**: React app initialization and DOM mounting
- **index.css**: Global styles (Tailwind CSS)

### Configuration
- **tsconfig.json**: TypeScript compiler options with strict mode enabled
- **vite.config.ts**: Vite build configuration with GitHub Pages base path
- **package.json**: Dependencies, scripts, and project metadata

## Data Flow

1. User selects directory via File System Access API
2. `useProjectProcessor` hook processes directory recursively
3. Files are filtered based on ignore patterns and size limits
4. Output is generated in selected format (Markdown or JSON)
5. `OutputPanel` displays the result
6. `DirectoryStructurePanel` shows file tree and statistics

## Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Dark Theme**: Slate and indigo color palette
- **Responsive**: Mobile-first design with breakpoints (hidden lg:block patterns)
- **Global Styles**: `index.css` contains Tailwind directives and custom styles
