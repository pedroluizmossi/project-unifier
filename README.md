# Project Unifier

🌐 **Live Demo:** https://pedroluizmossi.github.io/project-unifier/

Transform local project directories into unified, context-rich files (Markdown, JSON, or XML) optimized for Large Language Models, code review, and documentation.

## Features

- 📁 **Directory Selection** — Browser-based file system access (File System Access API)
- 🔍 **Flexible Filtering** — Customizable ignore patterns (`.gitignore`-style syntax)
- 📏 **File Size Control** — Limit maximum file size for inclusion
- 📄 **Multiple Output Formats** — Markdown (with optional directory tree), JSON, or XML
- 📊 **Statistics** — Track text files, binary files, large files, and token estimates
- 📋 **Easy Export** — Download or copy unified output
- 🌍 **Multi-language** — English and Portuguese support
- 🔒 **Privacy-First** — All processing happens locally in the browser

## Tech Stack

- **React 19** — Functional components with hooks
- **TypeScript** — Strict mode enabled
- **Vite** — Fast build tool
- **Tailwind CSS** — Dark theme UI
- **Web Workers** — Background file processing

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- Modern browser with File System Access API support (Chrome, Edge)

### Development

```bash
npm install
npm run dev
```

Open http://localhost:5173/

### Production Build

```bash
npm run build
```

Output in `dist/` folder.

## Usage

1. Click **Select Directory & Unify**
2. Choose your project folder
3. Adjust ignore patterns, file size limit, and output format
4. Copy or download the generated output

## Notes

- Runs entirely in your browser — no files uploaded to any server
- Large/binary files excluded but tracked in metadata
- Uses Web Workers for non-blocking file processing

## License

MIT

---

Made with ❤️ by [Pedro Mossi](https://github.com/pedroluizmossi)
