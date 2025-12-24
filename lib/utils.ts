import picomatch from 'picomatch';

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

export const isIgnored = (relativePath: string, patterns: string[]): boolean => {
    const normalizedPath = relativePath.replace(/\\/g, '/');
    
    for (const pattern of patterns) {
        if (!pattern.trim()) continue;
        
        const cleanPattern = pattern.trim();
        
        // Handle directory-only patterns (ending with /)
        if (cleanPattern.endsWith('/')) {
            const dirPattern = cleanPattern.slice(0, -1);
            const isMatch = picomatch.isMatch(normalizedPath, dirPattern, { 
                dot: true,
                noglobstar: false 
            });
            if (isMatch) return true;
            
            // Also check if path is inside this directory
            const isDirMatch = picomatch.isMatch(normalizedPath, `${dirPattern}/**`, { 
                dot: true,
                noglobstar: false 
            });
            if (isDirMatch) return true;
        } else {
            // Regular pattern matching
            const isMatch = picomatch.isMatch(normalizedPath, cleanPattern, { 
                dot: true,
                noglobstar: false 
            });
            if (isMatch) return true;
            
            // Also match if pattern matches any path segment
            const pathSegments = normalizedPath.split('/');
            const fileName = pathSegments[pathSegments.length - 1];
            if (picomatch.isMatch(fileName, cleanPattern, { dot: true })) {
                return true;
            }
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
        lines.push("## �  Text File Contents\n");
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

const escapeCdata = (content: string): string => {
    return content.replace(/]]>/g, ']]]]><![CDATA[>');
};

const escapeXmlAttribute = (value: string): string => {
    return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

export const renderXml = (data: { directory_tree?: string; files_data: CategorizedFiles; project_name: string }): string => {
    const timestamp = new Date().toISOString();
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<project name="${escapeXmlAttribute(data.project_name)}" timestamp="${timestamp}">\n`;

    // Directory structure (optional)
    if (data.directory_tree) {
        xml += `  <directory_structure>\n`;
        xml += `    <![CDATA[\n${escapeCdata(data.directory_tree.trim())}\n    ]]>\n`;
        xml += `  </directory_structure>\n`;
    }

    // Text files
    if (data.files_data.text_files.length > 0) {
        xml += `  <text_files>\n`;
        data.files_data.text_files.forEach(f => {
            const path = escapeXmlAttribute(f.path);
            const lang = escapeXmlAttribute(f.language || 'text');
            xml += `    <file path="${path}" language="${lang}" line_count="${f.line_count}" size_kb="${f.size_kb.toFixed(2)}">\n`;
            xml += `      <![CDATA[\n${escapeCdata(f.content)}\n      ]]>\n`;
            xml += `    </file>\n`;
        });
        xml += `  </text_files>\n`;
    }

    // Large files (omitted)
    if (data.files_data.large_files.length > 0) {
        xml += `  <large_files>\n`;
        data.files_data.large_files.forEach(f => {
            const path = escapeXmlAttribute(f.path);
            xml += `    <file path="${path}" size_kb="${f.size_kb.toFixed(2)}" sha256="${f.sha256}" />\n`;
        });
        xml += `  </large_files>\n`;
    }

    // Binary files (omitted)
    if (data.files_data.binary_files.length > 0) {
        xml += `  <binary_files>\n`;
        data.files_data.binary_files.forEach(f => {
            const path = escapeXmlAttribute(f.path);
            xml += `    <file path="${path}" size_kb="${f.size_kb.toFixed(2)}" sha256="${f.sha256}" />\n`;
        });
        xml += `  </binary_files>\n`;
    }

    xml += `</project>`;
    return xml;
};

// --- BLOB & MEMORY OPTIMIZATION ---

export const createOutputBlob = (content: string, format: 'markdown' | 'json' | 'xml'): Blob => {
    const mimeTypes: Record<string, string> = {
        markdown: 'text/markdown',
        json: 'application/json',
        xml: 'application/xml'
    };
    return new Blob([content], { type: mimeTypes[format] });
};

export const createDownloadUrl = (blob: Blob): string => {
    return URL.createObjectURL(blob);
};

export const revokeDownloadUrl = (url: string): void => {
    URL.revokeObjectURL(url);
};

export const generateFileName = (projectName: string, format: 'markdown' | 'json' | 'xml'): string => {
    const timestamp = new Date().toISOString().split('T')[0];
    const extensions: Record<string, string> = { markdown: 'md', json: 'json', xml: 'xml' };
    const ext = extensions[format];
    return `${projectName}_unified_${timestamp}.${ext}`;
};

// --- OUTPUT GENERATION ---

export interface GenerateOutputParams {
    fileHandles: { handle: FileSystemFileHandle; path: string }[];
    dirHandle: FileSystemDirectoryHandle | null;
    dirName: string;
    settings: {
        ignorePatterns: string;
        maxFileSize: number;
        outputFormat: 'markdown' | 'json' | 'xml';
        includeTree: boolean;
    };
    processFilesCallback: (fileHandles: { handle: FileSystemFileHandle; path: string }[], maxSizeBytes: number) => Promise<FileInfo[]>;
}

export interface GenerateOutputResult {
    output: string;
    categorized: CategorizedFiles;
    filesData: FileInfo[];
}

export const generateProjectOutput = async (params: GenerateOutputParams): Promise<GenerateOutputResult> => {
    const { fileHandles, dirHandle, dirName, settings, processFilesCallback } = params;
    const maxSizeBytes = settings.maxFileSize > 0 ? settings.maxFileSize * 1024 : -1;
    
    // Process files
    const filesData = await processFilesCallback(fileHandles, maxSizeBytes);
    
    // Categorize files
    const categorized: CategorizedFiles = { text_files: [], binary_files: [], large_files: [] };
    filesData.forEach(file => {
        if (file.type === 'text_file') categorized.text_files.push(file);
        else if (file.type === 'binary_file') categorized.binary_files.push(file);
        else categorized.large_files.push(file);
    });
    
    // Generate output
    let output = '';
    
    if (settings.outputFormat === 'markdown') {
        let tree: string | undefined;
        if (settings.includeTree && dirHandle) {
            const patterns = settings.ignorePatterns.split('\n').filter(p => p.trim() !== '');
            tree = await generateTree(dirHandle, patterns);
        }
        output = renderMarkdown({
            project_name: dirName,
            directory_tree: tree,
            files_data: categorized,
        });
    } else if (settings.outputFormat === 'xml') {
        let tree: string | undefined;
        if (settings.includeTree && dirHandle) {
            const patterns = settings.ignorePatterns.split('\n').filter(p => p.trim() !== '');
            tree = await generateTree(dirHandle, patterns);
        }
        output = renderXml({
            project_name: dirName,
            directory_tree: tree,
            files_data: categorized,
        });
    } else {
        const allFiles = [...categorized.text_files, ...categorized.binary_files, ...categorized.large_files];
        const jsonTree = buildJsonStructure(allFiles, dirName);
        output = JSON.stringify({
            project_name: dirName,
            project_tree: jsonTree,
            metadata: {
                generation_timestamp_utc: new Date().toISOString(),
                summary: {
                    text_files: categorized.text_files.length,
                    binary_files: categorized.binary_files.length,
                    large_files: categorized.large_files.length,
                }
            }
        }, null, 2);
    }
    
    return { output, categorized, filesData };
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
    if (node.path) {
        return { name, type: 'file', path, ...node };
    }
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

// --- BROWSER CAPABILITY DETECTION ---

export type BrowserCapability = 'native' | 'fallback' | 'unsupported';

export const detectBrowserCapability = (): BrowserCapability => {
    if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
        return 'native';
    }
    return 'fallback';
};

// --- DIRECTORY SELECTION ---

export const selectDirectoryNative = async (): Promise<FileSystemDirectoryHandle> => {
    if (!('showDirectoryPicker' in window)) {
        throw new Error('File System Access API not supported');
    }
    return window.showDirectoryPicker();
};

export const selectDirectoryFallback = async (): Promise<{ name: string; files: File[] }> => {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        (input as any).webkitdirectory = true;
        (input as any).mozdirectory = true;
        input.multiple = true;

        input.onchange = (e: any) => {
            const files = Array.from(e.target.files || []) as File[];
            if (files.length === 0) {
                reject(new Error('No files selected'));
                return;
            }
            
            const firstPath = (files[0] as any).webkitRelativePath || files[0].name;
            const dirName = firstPath.split('/')[0] || 'selected-directory';
            
            resolve({ name: dirName, files });
        };

        input.onerror = () => reject(new Error('Directory selection cancelled'));
        input.click();
    });
};

export const convertFallbackFilesToHandles = async (files: File[], dirName: string): Promise<{ handle: FileSystemFileHandle; path: string }[]> => {
    return files.map(file => {
        const webkitPath = (file as any).webkitRelativePath || file.name;
        const relativePath = webkitPath.startsWith(dirName + '/') 
            ? webkitPath.substring(dirName.length + 1)
            : webkitPath;

        const mockHandle: FileSystemFileHandle = {
            kind: 'file',
            name: file.name,
            getFile: async () => file,
        } as FileSystemFileHandle;

        return { handle: mockHandle, path: relativePath };
    });
};
