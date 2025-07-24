import React, { useState } from 'https://esm.sh/react@19.1.0';
import { DEFAULT_IGNORE_PATTERNS } from '../lib/utils.ts';
import { useProjectProcessor } from '../hooks/useProjectProcessor.ts';
import Header from './Header.tsx';
import ControlsPanel from './ControlsPanel.tsx';
import OutputPanel from './OutputPanel.tsx';
import MarkdownPreview from './MarkdownPreview.tsx';

const App = () => {
    // State for user-configurable settings
    const [ignorePatterns, setIgnorePatterns] = useState(DEFAULT_IGNORE_PATTERNS.join('\n'));
    const [maxFileSize, setMaxFileSize] = useState<number>(5120);
    const [outputFormat, setOutputFormat] = useState<'markdown' | 'json'>('markdown');
    const [includeTree, setIncludeTree] = useState(true);

    // Custom hook to handle all processing logic
    const { isLoading, statusMessage, outputContent, directoryName, stats, processDirectory } = useProjectProcessor();

    const handleProcessDirectory = () => {
        processDirectory({
            ignorePatterns,
            maxFileSize,
            outputFormat,
            includeTree,
        });
    };

    return (
        <div className="min-h-screen flex flex-col p-4 sm:p-6 lg:p-8">
            <Header />
            <main className="flex-grow w-full max-w-7xl mx-auto flex flex-col gap-8 mt-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex flex-col gap-6 flex-1">
                        <ControlsPanel
                            ignorePatterns={ignorePatterns}
                            setIgnorePatterns={setIgnorePatterns}
                            maxFileSize={maxFileSize}
                            setMaxFileSize={setMaxFileSize}
                            outputFormat={outputFormat}
                            setOutputFormat={setOutputFormat}
                            includeTree={includeTree}
                            setIncludeTree={setIncludeTree}
                        />
                        <button
                            onClick={handleProcessDirectory}
                            disabled={isLoading}
                            className="w-full flex justify-center items-center gap-3 rounded-lg bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spinner"></div>}
                            {isLoading ? 'Processing...' : 'Select Directory & Unify'}
                        </button>
                    </div>
                </div>
                <div className="mt-8">
                    <OutputPanel
                        isLoading={isLoading}
                        statusMessage={statusMessage}
                        stats={stats}
                        outputContent={outputContent}
                        directoryName={directoryName}
                        outputFormat={outputFormat}
                    />
                </div>
            </main>
        </div>
    );
};

export default App;