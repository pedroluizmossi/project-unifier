import { useEffect, useRef, useCallback } from 'react';
import type { WorkerMessage, WorkerResult } from '../lib/fileProcessorWorker';
import FileProcessorWorker from '../lib/fileProcessorWorker?worker';

interface FileProcessingResult {
    path: string;
    size_kb: number;
    type: 'text_file' | 'binary_file' | 'large_file';
    content?: string;
    line_count?: number;
    language?: string;
    sha256?: string;
}

interface UseFileProcessorWorkerOptions {
    onProgress?: (processed: number, total: number) => void;
    onComplete?: (filesData: FileProcessingResult[]) => void;
    onError?: (error: string) => void;
}

export const useFileProcessorWorker = (options: UseFileProcessorWorkerOptions = {}) => {
    const workerRef = useRef<Worker | null>(null);
    const isInitializedRef = useRef(false);
    const resolveRef = useRef<((value: FileProcessingResult[]) => void) | null>(null);
    const rejectRef = useRef<((error: Error) => void) | null>(null);
    const onProgressRef = useRef(options.onProgress);
    const onCompleteRef = useRef(options.onComplete);
    const onErrorRef = useRef(options.onError);

    // Update refs when options change (without triggering re-initialization)
    useEffect(() => {
        onProgressRef.current = options.onProgress;
        onCompleteRef.current = options.onComplete;
        onErrorRef.current = options.onError;
    }, [options.onProgress, options.onComplete, options.onError]);

    // Initialize worker on mount only
    useEffect(() => {
        if (isInitializedRef.current) return;

        try {
            // Create worker using Vite's worker import
            workerRef.current = new FileProcessorWorker();

            workerRef.current.onmessage = (event: MessageEvent<WorkerResult>) => {
                const { type, processed, total, filesData, error } = event.data;

                if (type === 'progress' && onProgressRef.current && processed && total) {
                    onProgressRef.current(processed, total);
                } else if (type === 'complete' && filesData) {
                    if (resolveRef.current) {
                        resolveRef.current(filesData);
                        resolveRef.current = null;
                    }
                    if (onCompleteRef.current) {
                        onCompleteRef.current(filesData);
                    }
                } else if (type === 'error' && error) {
                    if (rejectRef.current) {
                        rejectRef.current(new Error(error));
                        rejectRef.current = null;
                    }
                    if (onErrorRef.current) {
                        onErrorRef.current(error);
                    }
                }
            };

            workerRef.current.onerror = (error) => {
                if (rejectRef.current) {
                    rejectRef.current(new Error(error.message || 'Worker error'));
                    rejectRef.current = null;
                }
                if (onErrorRef.current) {
                    onErrorRef.current(error.message || 'Worker error');
                }
            };

            isInitializedRef.current = true;
        } catch (error) {
            console.error('Failed to initialize worker:', error);
            // Fallback: if worker fails to initialize, we'll process on main thread
        }

        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
                isInitializedRef.current = false;
            }
        };
    }, []);

    const processFiles = useCallback(
        (
            fileHandles: Array<{ handle: FileSystemFileHandle; path: string }>,
            maxSizeBytes: number
        ): Promise<FileProcessingResult[]> => {
            return new Promise((resolve, reject) => {
                if (!workerRef.current) {
                    reject(new Error('Worker not initialized'));
                    return;
                }

                // Store resolve/reject for the onmessage handler
                resolveRef.current = resolve;
                rejectRef.current = reject;

                // Send processing request to worker
                const message: WorkerMessage = {
                    type: 'process-files',
                    fileHandles,
                    maxSizeBytes,
                };

                workerRef.current.postMessage(message);
            });
        },
        []
    );

    const cancel = useCallback(() => {
        if (workerRef.current) {
            const message: WorkerMessage = { type: 'cancel' };
            workerRef.current.postMessage(message);
        }
    }, []);

    const isSupported = useCallback(() => {
        return typeof Worker !== 'undefined';
    }, []);

    return {
        processFiles,
        cancel,
        isSupported,
        isInitialized: isInitializedRef.current,
    };
};
