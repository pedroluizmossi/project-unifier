import { useState, useCallback } from 'react';
import {
    FileInfo,
    ProcessorStatus,
    collectFileHandles,
    calculateTokens,
    selectDirectoryNative,
    selectDirectoryFallback,
    convertFallbackFilesToHandles,
    detectBrowserCapability,
    isIgnored,
    BrowserCapability,
    generateProjectOutput,
} from '../lib/utils.ts';
import { useFileProcessorWorker } from './useFileProcessorWorker';


interface ProcessorSettings {
    ignorePatterns: string;
    maxFileSize: number;
    outputFormat: 'markdown' | 'json' | 'xml';
    includeTree: boolean;
}

interface DirectoryHandleCache {
    handle: FileSystemDirectoryHandle | null;
    name: string;
    fallbackFiles?: File[];
    isFallback: boolean;
}

type TranslationFunction = (key: string, defaultValue?: string) => string;

export const useProjectProcessor = (t: TranslationFunction) => {
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Select a directory to begin.');
    const [outputContent, setOutputContent] = useState('');
    const [directoryName, setDirectoryName] = useState<string | null>(null);
    const [stats, setStats] = useState<ProcessorStatus | null>(null);
    const [cachedDirHandle, setCachedDirHandle] = useState<DirectoryHandleCache | null>(null);
    const [browserCapability, setBrowserCapability] = useState<BrowserCapability>(() => detectBrowserCapability());

    const { processFiles, isSupported: isWorkerSupported } = useFileProcessorWorker({
        onProgress: (processed, total) => {
            setStatusMessage(`Processing files: ${processed}/${total}...`);
        },
    });

    const processDirectory = useCallback(async (settings: ProcessorSettings) => {
        const capability = detectBrowserCapability();
        setBrowserCapability(capability);

        if (capability === 'unsupported') {
            alert(t('errors.browserUnsupported'));
            return;
        }

        try {
            let dirHandle: FileSystemDirectoryHandle | null = null;
            let dirName: string;
            let fileHandles: { handle: FileSystemFileHandle; path: string }[] = [];

            setIsLoading(true);
            setOutputContent('');
            setStats(null);
            setStatusMessage(t('output.generating'));

            if (capability === 'native') {
                dirHandle = await selectDirectoryNative();
                dirName = dirHandle.name;
                
                setDirectoryName(dirName);
                setCachedDirHandle({ handle: dirHandle, name: dirName, isFallback: false });

                const patterns = settings.ignorePatterns.split('\n').filter(p => p.trim() !== '');
                fileHandles = await collectFileHandles(dirHandle, patterns);
            } else {
                // Fallback mode
                const result = await selectDirectoryFallback();
                dirName = result.name;

                setDirectoryName(dirName);
                setCachedDirHandle({ handle: null, name: dirName, fallbackFiles: result.files, isFallback: true });

                const patterns = settings.ignorePatterns.split('\n').filter(p => p.trim() !== '');
                fileHandles = await convertFallbackFilesToHandles(result.files, dirName);
                fileHandles = fileHandles.filter(f => !isIgnored(f.path, patterns));
            }

            setStatusMessage(`Found ${fileHandles.length} files. Processing...`);

            // Create wrapper for processFiles to handle both worker and main thread
            const processFilesWrapper = async (handles: { handle: FileSystemFileHandle; path: string }[], maxSizeBytes: number): Promise<FileInfo[]> => {
                if (isWorkerSupported()) {
                    try {
                        const workerResults = await processFiles(handles, maxSizeBytes);
                        return workerResults as FileInfo[];
                    } catch (error) {
                        console.warn('Worker processing failed, falling back to main thread:', error);
                        const { processFile } = await import('../lib/utils.ts');
                        const promises = handles.map(f => processFile(f.handle as FileSystemFileHandle, f.path, maxSizeBytes));
                        const results = await Promise.all(promises);
                        return results.filter((r): r is FileInfo => r !== null);
                    }
                } else {
                    const { processFile } = await import('../lib/utils.ts');
                    const promises = handles.map(f => processFile(f.handle as FileSystemFileHandle, f.path, maxSizeBytes));
                    const results = await Promise.all(promises);
                    return results.filter((r): r is FileInfo => r !== null);
                }
            };

            const { output, categorized, filesData } = await generateProjectOutput({
                fileHandles,
                dirHandle,
                dirName,
                settings,
                processFilesCallback: processFilesWrapper,
            });

            setOutputContent(output);
            setStats({
                text: categorized.text_files.length,
                binary: categorized.binary_files.length,
                large: categorized.large_files.length,
                tokens: calculateTokens(output),
                files: filesData.map(f => ({ name: f.path, size: Math.round((f.size_kb ?? 0) * 1024) }))
            });
            setStatusMessage(`Processing complete for ${dirName}.`);

        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error("Error processing directory:", error);
                setStatusMessage(t('errors.processingFailed'));
            } else {
                 setStatusMessage(t('output.selectDirectory'));
            }
        } finally {
            setIsLoading(false);
        }
    }, [t, isWorkerSupported, processFiles]);

    const reprocessWithIgnorePatterns = useCallback(async (settings: ProcessorSettings) => {
        if (!cachedDirHandle) return;

        try {
            setIsLoading(true);
            setStatusMessage('Recalculating with updated filters...');

            const patterns = settings.ignorePatterns.split('\n').filter(p => p.trim() !== '');
            let fileHandles: { handle: FileSystemFileHandle; path: string }[] = [];

            if (cachedDirHandle.isFallback && cachedDirHandle.fallbackFiles) {
                fileHandles = await convertFallbackFilesToHandles(cachedDirHandle.fallbackFiles, cachedDirHandle.name);
                fileHandles = fileHandles.filter(f => !isIgnored(f.path, patterns));
            } else if (cachedDirHandle.handle) {
                fileHandles = await collectFileHandles(cachedDirHandle.handle, patterns);
            }
            
            setStatusMessage(`Found ${fileHandles.length} files. Processing...`);

            // Create wrapper for processFiles to handle both worker and main thread
            const processFilesWrapper = async (handles: { handle: FileSystemFileHandle; path: string }[], maxSizeBytes: number): Promise<FileInfo[]> => {
                if (isWorkerSupported()) {
                    try {
                        const workerResults = await processFiles(handles, maxSizeBytes);
                        return workerResults as FileInfo[];
                    } catch (error) {
                        console.warn('Worker processing failed, falling back to main thread:', error);
                        const { processFile } = await import('../lib/utils.ts');
                        const promises = handles.map(f => processFile(f.handle as FileSystemFileHandle, f.path, maxSizeBytes));
                        const results = await Promise.all(promises);
                        return results.filter((r): r is FileInfo => r !== null);
                    }
                } else {
                    const { processFile } = await import('../lib/utils.ts');
                    const promises = handles.map(f => processFile(f.handle as FileSystemFileHandle, f.path, maxSizeBytes));
                    const results = await Promise.all(promises);
                    return results.filter((r): r is FileInfo => r !== null);
                }
            };

            const { output, categorized, filesData } = await generateProjectOutput({
                fileHandles,
                dirHandle: cachedDirHandle.handle,
                dirName: cachedDirHandle.name,
                settings,
                processFilesCallback: processFilesWrapper,
            });

            setOutputContent(output);
            setStats({
                text: categorized.text_files.length,
                binary: categorized.binary_files.length,
                large: categorized.large_files.length,
                tokens: calculateTokens(output),
                files: filesData.map(f => ({ name: f.path, size: Math.round((f.size_kb ?? 0) * 1024) }))
            });
            setStatusMessage(`Processing complete for ${cachedDirHandle.name}.`);

        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error("Error reprocessing directory:", error);
                setStatusMessage(t('errors.processingFailed'));
            } else {
                setStatusMessage(t('output.selectDirectory'));
            }
        } finally {
            setIsLoading(false);
        }
    }, [cachedDirHandle, t, isWorkerSupported, processFiles]);

    return {
        isLoading,
        statusMessage,
        outputContent,
        directoryName,
        stats,
        processDirectory,
        reprocessWithIgnorePatterns,
        browserCapability,
    };
};