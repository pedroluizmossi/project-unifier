---
inclusion: always
---

# Project Structure

## Directory Layout

```
project-unifier/
├── components/          # React UI components
├── hooks/              # Custom React hooks (business logic)
├── lib/                # Utilities, constants, translations
├── dist/               # Build output (generated)
├── node_modules/       # Dependencies (generated)
├── index.html          # HTML entry point
├── index.tsx           # React app initialization
├── index.css           # Global Tailwind styles
├── tsconfig.json       # TypeScript strict mode config
├── vite.config.ts      # Vite build config (GitHub Pages base: /project-unifier/)
├── package.json        # Dependencies and scripts
└── metadata.json       # Project metadata
```

## Components (`/components`)

All components are functional with React hooks. State is centralized in `App.tsx` and passed down via props.

- **App.tsx**: Main layout, state orchestration, props distribution
- **ControlsPanel.tsx**: User settings (ignore patterns, file size limit, output format)
- **OutputPanel.tsx**: Displays generated output (Markdown or JSON)
- **DirectoryStructurePanel.tsx**: File tree sidebar with file statistics
- **MarkdownPreview.tsx**: Renders Markdown with DOMPurify sanitization
- **LanguageSwitcher.tsx**: Language selection UI
- **TranslationProvider.tsx**: Translation context provider
- **LandingPage.tsx**: Initial UI before directory selection

## Hooks (`/hooks`)

- **useProjectProcessor.ts**: Core hook managing directory traversal, file filtering, output generation, and processing state
- **useTranslation.ts**: Translation context consumer
- **useFileProcessorWorker.ts**: Web Worker integration for file processing

## Utilities (`/lib`)

- **utils.ts**: Helper functions, constants (`DEFAULT_IGNORE_PATTERNS`), file processing logic
- **TranslationContext.ts**: Translation context definition
- **fileProcessorWorker.ts**: Web Worker for background file processing
- **translations/**: JSON translation files (en.json, pt.json)

## Data Flow

1. User selects directory via File System Access API
2. `useProjectProcessor` recursively traverses directory
3. Files filtered by ignore patterns and size limits
4. Output generated (Markdown or JSON format)
5. `OutputPanel` renders result; `DirectoryStructurePanel` shows tree and stats

## Code Patterns

- **Components**: Functional, props-based, no internal state (except UI state like modals)
- **Hooks**: Encapsulate business logic; state lifted to `App.tsx`
- **Props**: Passed down from parent; event handlers as callbacks
- **Styling**: Tailwind CSS utility classes, dark theme (slate/indigo), responsive design
- **TypeScript**: Strict mode enabled; all code must be type-safe

## Key Conventions

- Component files: PascalCase (e.g., `App.tsx`, `ControlsPanel.tsx`)
- Hook/utility files: camelCase (e.g., `useProjectProcessor.ts`, `utils.ts`)
- Imports: ES6 modules only
- Unused variables/parameters: Not allowed (TypeScript strict mode)
