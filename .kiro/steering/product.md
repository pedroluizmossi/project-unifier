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
