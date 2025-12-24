/// <reference types="vite/client" />

// Worker module declaration for Vite
declare module '*?worker' {
    const workerConstructor: {
        new (): Worker;
    };
    export default workerConstructor;
}

// --- FILE SYSTEM ACCESS API TYPE DEFINITIONS ---

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

export {};
