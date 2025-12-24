// --- TYPE DEFINITIONS ---
export type FileInfo = {
  path: string;
  size_kb: number;
} & ({
  type: 'text_file';
  content: string;
  line_count: number;
  language: string;
} | {
  type: 'binary_file';
  sha256: string;
} | {
  type: 'large_file';
  sha256: string;
});

export type CategorizedFiles = {
  text_files: Extract<FileInfo, {type: 'text_file'}>[];
  binary_files: Extract<FileInfo, {type: 'binary_file'}>[];
  large_files: Extract<FileInfo, {type: 'large_file'}>[];
};

export type ProjectTree = {
    name: string;
    type: 'directory' | 'file';
    path: string;
    children?: ProjectTree[];
    [key: string]: any;
}

export type ProcessorStatus = {
    text: number;
    binary: number;
    large: number;
    tokens: number;
    files?: { name: string; size: number }[];
};

// --- CONSTANTS AND CONFIGURATIONS ---
export const DEFAULT_IGNORE_PATTERNS: string[] = [
    '.git*', '*/.git*', '.svn', '*/.svn', '.hg', '*/.hg', '.idea', '*/.idea',
    '.vscode', '*/.vscode', '*.swp', '*.swo', 'node_modules', '*/node_modules',
    'bower_components', '*/bower_components', 'vendor', '*/vendor', 'build',
    '*/build', 'dist', '*/dist', 'target', '*/target', '__pycache__',
    '*/__pycache__', '*.pyc', '*.pyo', '*.pyd', '.Python', '*.egg-info',
    'venv', '.venv', '*/venv', '*/.venv', '.DS_Store', 'Thumbs.db', '*.exe',
    '*.dll', '*.so', '*.dylib', '*.o', '*.a', '*.lib', '*.class', '*.jar',
    '*.war', '*.ear', '*.log', '*.tmp', '*.temp', '*_unified_*.txt',
    '*_unified_*.md', '*_unified_*.json'
];

export const LANG_MAP: { [key: string]: string } = {
    '.py': 'python', '.js': 'javascript', '.ts': 'typescript', '.jsx': 'jsx',
    '.tsx': 'tsx', '.html': 'html', '.css': 'css', '.scss': 'scss', '.json': 'json',
    '.xml': 'xml', '.yml': 'yaml', '.yaml': 'yaml', '.md': 'markdown', '.sql': 'sql',
    '.sh': 'shell', '.bat': 'batch', '.ps1': 'powershell', '.java': 'java',
    '.c': 'c', '.cpp': 'cpp', '.h': 'c', '.hpp': 'cpp', '.cs': 'csharp', '.rb': 'ruby',
    '.go': 'go', '.rs': 'rust', '.php': 'php', '.vue': 'vue', '.dockerfile': 'dockerfile',
    '.toml': 'toml'
};


// --- CORE LOGIC FUNCTIONS ---

const globToRegex = (pattern: string): RegExp => {
    const esc = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    const regexStr = esc
      .replace(/\*\*\//g, '(.*/)?') // Match multi-level directories
      .replace(/\*\*/g, '.*') // Match any characters
      .replace(/\*/g, '[^/]*') // Match characters except slash
      .replace(/\?/g, '[^/]'); // Match single character except slash
    
    if (regexStr.startsWith('(.*/)?')) {
        return new RegExp(`^${regexStr.substring(5)}$`);
    }
    return new RegExp(`^${regexStr}$`);
};

export const isIgnored = (relativePath: string, patterns: string[]): boolean => {
    const normalizedPath = relativePath.replace(/\\/g, '/');
    const pathSegments = normalizedPath.split('/');
    const fileName = pathSegments[pathSegments.length - 1];

    for (const pattern of patterns) {
        const isDirPattern = pattern.endsWith('/');
        const patternToTest = isDirPattern ? normalizedPath + '/' : normalizedPath;

        if (pattern.includes('/')) {
             if (globToRegex(pattern).test(patternToTest)) return true;
        } else {
             if (globToRegex(pattern).test(fileName)) return true;
        }
    }
    return false;
};

export const collectFileHandles = async (dirHandle: FileSystemDirectoryHandle, patterns: string[]): Promise<{handle: FileSystemFileHandle, path: string}[]> => {
    const fileHandles: {handle: FileSystemFileHandle, path: string}[] = [];
    const recurse = async (currentHandle: FileSystemDirectoryHandle, currentPath: string) => {
        for await (const entry of currentHandle.values()) {
            const relativePath = `${currentPath}${entry.name}`;
            if (isIgnored(relativePath, patterns) || isIgnored(`${relativePath}/`, patterns)) continue;
            
            if (entry.kind === 'file') {
                fileHandles.push({ handle: entry as FileSystemFileHandle, path: relativePath });
            } else if (entry.kind === 'directory') {
                await recurse(entry as FileSystemDirectoryHandle, `${relativePath}/`);
            }
        }
    };
    await recurse(dirHandle, '');
    return fileHandles;
};


export const generateTree = async (dirHandle: FileSystemDirectoryHandle, patterns: string[]): Promise<string> => {
    let treeString = `${dirHandle.name}\n`;
    const recurse = async (handle: FileSystemDirectoryHandle, prefix: string) => {
        const entries = [];
        for await (const entry of handle.values()) {
            entries.push(entry);
        }
        entries.sort((a, b) => (a.kind.localeCompare(b.kind)) || a.name.localeCompare(b.name));

        const filteredEntries = entries.filter(entry => !isIgnored(`${prefix.replace(/[│─└├ ]/g, '')}${entry.name}`, patterns));

        for (let i = 0; i < filteredEntries.length; i++) {
            const entry = filteredEntries[i];
            const isLast = i === filteredEntries.length - 1;
            treeString += `${prefix}${isLast ? '└── ' : '├── '}${entry.name}\n`;
            if (entry.kind === 'directory') {
                await recurse(entry as FileSystemDirectoryHandle, `${prefix}${isLast ? '    ' : '│   '}`);
            }
        }
    };
    await recurse(dirHandle, '');
    return treeString;
};

const calculateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const processFile = async (fileHandle: FileSystemFileHandle, relativePath: string, maxSizeBytes: number): Promise<FileInfo | null> => {
    try {
        const file = await fileHandle.getFile();
        const fileSize = file.size;
        // Normalize filename and extension
        const name = file.name.toLowerCase();
        let extension = '';
        if (name.startsWith('.')) {
            // Arquivos como .gitignore, .env etc
            extension = name;
        } else if (name.includes('.')) {
            extension = '.' + name.split('.').pop();
        }

        if (maxSizeBytes > 0 && fileSize > maxSizeBytes) {
            return { path: relativePath, size_kb: fileSize / 1024, type: 'large_file', sha256: await calculateFileHash(file) };
        }
        try {
            const content = await file.text();
            return { path: relativePath, size_kb: fileSize / 1024, type: 'text_file', content, line_count: content.split('\n').length, language: LANG_MAP[extension.toLowerCase()] || '' };
        } catch (e) {
             return { path: relativePath, size_kb: fileSize / 1024, type: 'binary_file', sha256: await calculateFileHash(file) };
        }
    } catch (error) {
        console.warn(`Could not process file ${relativePath}:`, error);
        return null;
    }
};


// --- FORMATTING FUNCTIONS ---

export const calculateTokens = (text: string): number => Math.ceil(text.length / 4);

export const renderMarkdown = (data: { objective?: string; directory_tree?: string; files_data: CategorizedFiles; project_name: string }): string => {
    let lines = [ "---", `project_name: ${data.project_name}`, `generation_timestamp_utc: ${new Date().toISOString()}`, "---", "" ];
    if (data.directory_tree) lines.push(`## 🌳 Directory Structure\n\n\`\`\`\n${data.directory_tree.trim()}\n\`\`\`\n`);
    
    if (data.files_data.text_files.length > 0) {
        lines.push("## 📄 Text File Contents\n");
        data.files_data.text_files.forEach(f => {
            lines.push(`### \`${f.path}\` (Metadata: ${f.line_count} lines, ${f.size_kb.toFixed(2)} KB)\n`);
            lines.push(`\`\`\`${f.language}\n${f.content}\n\`\`\`\n`);
        });
    }

    if (data.files_data.large_files.length > 0) {
        lines.push("## 📦 Large Files (Content Omitted)\n");
        data.files_data.large_files.forEach(f => lines.push(`- \`${f.path}\` (${f.size_kb.toFixed(2)} KB, SHA256: \`${f.sha256}\`)`));
        lines.push("\n");
    }
    if (data.files_data.binary_files.length > 0) {
        lines.push("## 🎲 Binary Files (Content Omitted)\n");
        data.files_data.binary_files.forEach(f => lines.push(`- \`${f.path}\` (${f.size_kb.toFixed(2)} KB, SHA256: \`${f.sha256}\`)`));
        lines.push("\n");
    }
    return lines.join('\n');
};

const buildFileTree = (filesData: FileInfo[]): Record<string, any> => {
    const tree: Record<string, any> = {};
    filesData.forEach(file => {
        let currentLevel = tree;
        const pathParts = file.path.split('/');
        pathParts.forEach((part, index) => {
            if (index === pathParts.length - 1) {
                currentLevel[part] = file;
            } else {
                currentLevel[part] = currentLevel[part] || {};
                currentLevel = currentLevel[part];
            }
        });
    });
    return tree;
};

const convertTreeToProjectTree = (node: Record<string, any>, name: string, path: string): ProjectTree => {
    if (node.path) { // It's a file leaf
        return { name, type: 'file', path, ...node };
    }
    // It's a directory
    return {
        name,
        type: 'directory',
        path,
        children: Object.entries(node)
            .map(([childName, childNode]) => convertTreeToProjectTree(childNode, childName, path ? `${path}/${childName}` : childName))
            .sort((a,b) => a.name.localeCompare(b.name))
    };
}


export const buildJsonStructure = (filesData: FileInfo[], rootName: string): ProjectTree => {
    const rawTree = buildFileTree(filesData);
    return convertTreeToProjectTree(rawTree, rootName, '');
};