import { useState, useCallback } from 'react';
import {
    FileInfo,
    CategorizedFiles,
    ProcessorStatus,
    collectFileHandles,
    processFile,
    generateTree,
    renderMarkdown,
    buildJsonStructure,
    calculateTokens
} from '../lib/utils.ts';

// Type definitions for the File System Access API. These are not always included in
// standard TypeScript lib files, so we define them here to avoid compilation
// errors and provide type safety for the features used in this app.
declare global {
    interface FileSystemHandle {
        readonly kind: 'file' | 'directory';
        readonly name: string;
    }

    interface FileSystemFileHandle extends FileSystemHandle {
        readonly kind: 'file';
        getFile(): Promise<File>;
    }

    interface FileSystemDirectoryHandle extends FileSystemHandle {
        readonly kind: 'directory';
        values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>;
    }

    interface Window {
        showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
    }
}


interface ProcessorSettings {
    ignorePatterns: string;
    maxFileSize: number;
    outputFormat: 'markdown' | 'json';
    includeTree: boolean;
}

interface DirectoryHandleCache {
    handle: FileSystemDirectoryHandle;
    name: string;
}

export const useProjectProcessor = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Select a directory to begin.');
    const [outputContent, setOutputContent] = useState('');
    const [directoryName, setDirectoryName] = useState<string | null>(null);
    const [stats, setStats] = useState<ProcessorStatus | null>(null);
    const [cachedDirHandle, setCachedDirHandle] = useState<DirectoryHandleCache | null>(null);

    const processDirectory = useCallback(async (settings: ProcessorSettings) => {
        if (!('showDirectoryPicker' in window)) {
            alert('Your browser does not support the File System Access API. Please use a modern browser like Chrome or Edge.');
            return;
        }

        try {
            const dirHandle = await window.showDirectoryPicker();
            setIsLoading(true);
            setDirectoryName(dirHandle.name);
            setCachedDirHandle({ handle: dirHandle, name: dirHandle.name });
            setOutputContent('');
            setStats(null);
            setStatusMessage('Collecting files...');

            const patterns = settings.ignorePatterns.split('\n').filter(p => p.trim() !== '');
            const fileHandles = await collectFileHandles(dirHandle, patterns);
            
            setStatusMessage(`Found ${fileHandles.length} files. Processing...`);

            const maxSizeBytes = settings.maxFileSize > 0 ? settings.maxFileSize * 1024 : -1;
            const promises = fileHandles.map(f => processFile(f.handle as FileSystemFileHandle, f.path, maxSizeBytes));
            const results = await Promise.all(promises);
            const filesData = results.filter((r): r is FileInfo => r !== null);
            
            const categorized: CategorizedFiles = { text_files: [], binary_files: [], large_files: [] };
            filesData.forEach(file => {
                if (file.type === 'text_file') categorized.text_files.push(file);
                else if (file.type === 'binary_file') categorized.binary_files.push(file);
                else categorized.large_files.push(file);
            });
            
            let finalOutput = '';
            
            if (settings.outputFormat === 'markdown') {
                setStatusMessage('Generating Markdown output...');
                const tree = settings.includeTree ? await generateTree(dirHandle, patterns) : undefined;
                finalOutput = renderMarkdown({
                    project_name: dirHandle.name,
                    directory_tree: tree,
                    files_data: categorized,
                });
            } else { // JSON
                setStatusMessage('Generating JSON output...');
                // Ao gerar a estrutura JSON, use a mesma lógica de generateTree para garantir consistência.
                const tree = generateTree(dirHandle, patterns);
                // Converta tree para o formato JSON esperado, incluindo diretórios vazios
                const allFiles = [...categorized.text_files, ...categorized.binary_files, ...categorized.large_files];
                const jsonTree = buildJsonStructure(allFiles, dirHandle.name);
                finalOutput = JSON.stringify({
                    project_name: dirHandle.name,
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

            setOutputContent(finalOutput);
            setStats({
                text: categorized.text_files.length,
                binary: categorized.binary_files.length,
                large: categorized.large_files.length,
                tokens: calculateTokens(finalOutput),
                files: filesData.map(f => ({ name: f.path, size: Math.round((f.size_kb ?? 0) * 1024) }))
            });
            setStatusMessage(`Processing complete for ${dirHandle.name}.`);

        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error("Error processing directory:", error);
                setStatusMessage(`An error occurred: ${error.message}`);
            } else {
                 setStatusMessage('Directory selection cancelled.');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const reprocessWithIgnorePatterns = useCallback(async (settings: ProcessorSettings) => {
        if (!cachedDirHandle) return;

        try {
            setIsLoading(true);
            setOutputContent('');
            setStats(null);
            setStatusMessage('Recalculating with updated filters...');

            const dirHandle = cachedDirHandle.handle;
            const patterns = settings.ignorePatterns.split('\n').filter(p => p.trim() !== '');
            const fileHandles = await collectFileHandles(dirHandle, patterns);
            
            setStatusMessage(`Found ${fileHandles.length} files. Processing...`);

            const maxSizeBytes = settings.maxFileSize > 0 ? settings.maxFileSize * 1024 : -1;
            const promises = fileHandles.map(f => processFile(f.handle as FileSystemFileHandle, f.path, maxSizeBytes));
            const results = await Promise.all(promises);
            const filesData = results.filter((r): r is FileInfo => r !== null);
            
            const categorized: CategorizedFiles = { text_files: [], binary_files: [], large_files: [] };
            filesData.forEach(file => {
                if (file.type === 'text_file') categorized.text_files.push(file);
                else if (file.type === 'binary_file') categorized.binary_files.push(file);
                else categorized.large_files.push(file);
            });
            
            let finalOutput = '';
            
            if (settings.outputFormat === 'markdown') {
                setStatusMessage('Generating Markdown output...');
                const tree = settings.includeTree ? await generateTree(dirHandle, patterns) : undefined;
                finalOutput = renderMarkdown({
                    project_name: dirHandle.name,
                    directory_tree: tree,
                    files_data: categorized,
                });
            } else { // JSON
                setStatusMessage('Generating JSON output...');
                const tree = generateTree(dirHandle, patterns);
                const allFiles = [...categorized.text_files, ...categorized.binary_files, ...categorized.large_files];
                const jsonTree = buildJsonStructure(allFiles, dirHandle.name);
                finalOutput = JSON.stringify({
                    project_name: dirHandle.name,
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

            setOutputContent(finalOutput);
            setStats({
                text: categorized.text_files.length,
                binary: categorized.binary_files.length,
                large: categorized.large_files.length,
                tokens: calculateTokens(finalOutput),
                files: filesData.map(f => ({ name: f.path, size: Math.round((f.size_kb ?? 0) * 1024) }))
            });
            setStatusMessage(`Processing complete for ${dirHandle.name}.`);

        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error("Error reprocessing directory:", error);
                setStatusMessage(`An error occurred: ${error.message}`);
            } else {
                setStatusMessage('Reprocessing cancelled.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [cachedDirHandle]);

    return {
        isLoading,
        statusMessage,
        outputContent,
        directoryName,
        stats,
        processDirectory,
        reprocessWithIgnorePatterns,
    };
};