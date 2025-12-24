---
inclusion: always
---

# Product Overview

## Project Unifier

A browser-based tool that transforms local project directories into unified, context-rich files (Markdown or JSON) optimized for Large Language Models, code review, and documentation.

### Core Purpose
Enable users to prepare codebases for LLM consumption by generating single, comprehensive files containing project structure and content with intelligent filtering and formatting options.

### Key Features
- **Directory Selection**: Browser-based file system access (File System Access API)
- **Flexible Filtering**: Customizable ignore patterns (similar to `.gitignore`)
- **File Size Control**: Limit maximum file size for inclusion
- **Multiple Output Formats**: Markdown (with optional directory tree) or JSON
- **Statistics**: Track text files, binary files, large files, and token estimates
- **Easy Export**: Download or copy unified output
- **Privacy-First**: All processing happens locally in the browser—no server uploads

### Target Users
- Developers preparing code for LLM analysis
- Teams conducting code reviews
- Documentation generators
- Anyone needing to consolidate project context into a single file

### Technical Constraints
- Runs entirely in the browser (client-side only)
- Requires modern browser with File System Access API support (Chrome, Edge)
- Large/binary files are excluded but tracked in metadata

## Implementation Patterns

### State Management
- Centralized state in `App.tsx` with props passed to child components
- `useProjectProcessor` hook encapsulates all directory processing logic and state
- Avoid prop drilling by lifting state to the appropriate level

### File Processing Pipeline
1. User selects directory via File System Access API
2. `useProjectProcessor` recursively traverses directory structure
3. Files filtered by ignore patterns and size limits
4. Content read and formatted based on output type
5. Statistics calculated (file counts, token estimates)
6. Output rendered in `OutputPanel` or downloaded

### Output Formats
- **Markdown**: Human-readable with optional directory tree structure
- **JSON**: Machine-parseable with metadata and file contents
- Both formats include file statistics and processing metadata

### User Controls
- Ignore patterns: Text input accepting `.gitignore`-style patterns
- File size limit: Numeric input in bytes
- Output format: Toggle between Markdown and JSON
- Directory tree: Optional checkbox for Markdown output

## Code Conventions

### Component Organization
- Components handle UI rendering only
- Business logic delegated to hooks
- Props are typed with TypeScript interfaces
- Event handlers passed as props from parent components

### Error Handling
- File system access errors caught and displayed to user
- Invalid patterns handled gracefully
- Large file processing doesn't block UI

### Performance Considerations
- Avoid processing entire directory tree unnecessarily
- Cache file contents when possible
- Lazy-load large files or skip them based on size limits
- Token estimation should be approximate, not exact
