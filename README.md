# Project Unifier 
## 🌐 https://pedroluizmossi.github.io/project-unifier/

<img width="1374" height="1309" alt="image" src="https://github.com/user-attachments/assets/14e4afb7-b2b1-4eea-b667-d5e42844c548" />

Project Unifier is a tool that allows you to select a local directory and generate a single, context-rich file (Markdown or JSON) containing the structure and contents of your project. This is especially useful for preparing codebases for Large Language Models (LLMs), code review, or documentation.

## Features

- Select any local directory using the browser (File System Access API)
- Ignore files and folders using customizable patterns (like `.gitignore`)
- Limit the maximum file size to include
- Choose output format: **Markdown** (with optional directory tree) or **JSON**
- Download or copy the unified output easily
- See statistics: number of text, binary, large files, and estimated tokens
- Modern, responsive, and dark-themed UI

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- A modern browser (Chrome or Edge) that supports the File System Access API

### Running Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser and go to:**
   ```
   http://localhost:5173/
   ```

### Building for Production

```bash
npm run build
```

The output will be in the `dist/` folder.

## Usage

1. Click **Select Directory & Unify**.
2. Choose the root folder of your project.
3. Adjust ignore patterns, file size limit, and output format as needed.
4. Copy or download the generated output from the right panel.

## Notes

- The app runs entirely in your browser. No files are uploaded to any server.
- Large/binary files are not included in the output, but their metadata (name, size, hash) is.

## License

MIT

---

Made with ❤️ by [Pedro Mossi](https://github.com/pedroluizmossi)
