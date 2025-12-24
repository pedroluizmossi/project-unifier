// Web Worker for processing files off the main thread
// This worker handles CPU-intensive tasks like reading files, calculating hashes, and categorizing data

import { LANG_MAP } from './utils';

export interface WorkerMessage {
    type: 'process-files' | 'cancel';
    fileHandles?: Array<{ handle: FileSystemFileHandle; path: string }>;
    maxSizeBytes?: number;
}

export interface WorkerResult {
    type: 'progress' | 'complete' | 'error';
    processed?: number;
    total?: number;
    filesData?: Array<{
        path: string;
        size_kb: number;
        type: 'text_file' | 'binary_file' | 'large_file';
        content?: string;
        line_count?: number;
        language?: string;
        sha256?: string;
    }>;
    error?: string;
}

const calculateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const processFile = async (
    fileHandle: FileSystemFileHandle,
    relativePath: string,
    maxSizeBytes: number
): Promise<{
    path: string;
    size_kb: number;
    type: 'text_file' | 'binary_file' | 'large_file';
    content?: string;
    line_count?: number;
    language?: string;
    sha256?: string;
} | null> => {
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
            return {
                path: relativePath,
                size_kb: fileSize / 1024,
                type: 'large_file',
                sha256: await calculateFileHash(file),
            };
        }

        try {
            const content = await file.text();
            return {
                path: relativePath,
                size_kb: fileSize / 1024,
                type: 'text_file',
                content,
                line_count: content.split('\n').length,
                language: LANG_MAP[extension.toLowerCase()] || '',
            };
        } catch (e) {
            return {
                path: relativePath,
                size_kb: fileSize / 1024,
                type: 'binary_file',
                sha256: await calculateFileHash(file),
            };
        }
    } catch (error) {
        console.warn(`Could not process file ${relativePath}:`, error);
        return null;
    }
};

let isProcessing = false;

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
    const { type, fileHandles, maxSizeBytes } = event.data;

    if (type === 'cancel') {
        isProcessing = false;
        return;
    }

    if (type === 'process-files' && fileHandles && maxSizeBytes !== undefined) {
        isProcessing = true;
        const total = fileHandles.length;
        const filesData = [];

        try {
            for (let i = 0; i < fileHandles.length; i++) {
                if (!isProcessing) break;

                const { handle, path } = fileHandles[i];
                const result = await processFile(handle, path, maxSizeBytes);

                if (result) {
                    filesData.push(result);
                }

                // Send progress update every 10 files or at the end
                if ((i + 1) % 10 === 0 || i === fileHandles.length - 1) {
                    const progressMessage: WorkerResult = {
                        type: 'progress',
                        processed: i + 1,
                        total,
                    };
                    self.postMessage(progressMessage);
                }
            }

            if (isProcessing) {
                const completeMessage: WorkerResult = {
                    type: 'complete',
                    filesData,
                    processed: total,
                    total,
                };
                self.postMessage(completeMessage);
            }
        } catch (error) {
            const errorMessage: WorkerResult = {
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
            self.postMessage(errorMessage);
        } finally {
            isProcessing = false;
        }
    }
};
