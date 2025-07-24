import React from 'https://esm.sh/react@19.1.0';

interface ControlsPanelProps {
    ignorePatterns: string;
    setIgnorePatterns: (value: string) => void;
    maxFileSize: number;
    setMaxFileSize: (value: number) => void;
    outputFormat: 'markdown' | 'json';
    setOutputFormat: (value: 'markdown' | 'json') => void;
    includeTree: boolean;
    setIncludeTree: (value: boolean) => void;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({
    ignorePatterns, setIgnorePatterns,
    maxFileSize, setMaxFileSize,
    outputFormat, setOutputFormat,
    includeTree, setIncludeTree
}) => {
    return (
        <div className="glass-card rounded-2xl shadow-lg border border-sky-500/10 p-6">
            <div className="space-y-6">
                <div>
                    <label htmlFor="ignore" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Ignore Patterns</label>
                    <textarea id="ignore" value={ignorePatterns} onChange={e => setIgnorePatterns(e.target.value)} rows={8} className="mt-1 block w-full rounded-md bg-white dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono text-xs"></textarea>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="max-size" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Max File Size (KB)</label>
                        <input type="number" id="max-size" value={maxFileSize} onChange={e => setMaxFileSize(Number(e.target.value))} className="mt-1 block w-full rounded-md bg-white dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="0 for unlimited" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Output Format</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <button onClick={() => setOutputFormat('markdown')} className={`px-4 py-2 text-sm w-1/2 ${outputFormat === 'markdown' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600'} rounded-l-md border border-slate-300 dark:border-slate-600 focus:z-10 focus:ring-2 focus:ring-indigo-500 transition-colors`}>Markdown</button>
                            <button onClick={() => setOutputFormat('json')} className={`-ml-px px-4 py-2 text-sm w-1/2 ${outputFormat === 'json' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600'} rounded-r-md border border-slate-300 dark:border-slate-600 focus:z-10 focus:ring-2 focus:ring-indigo-500 transition-colors`}>JSON</button>
                        </div>
                    </div>
                </div>
                <div
                    className={`flex items-start ${outputFormat === 'json' ? 'pointer-events-none opacity-60' : ''}`}
                >
                    <div className="flex h-5 items-center">
                        <input
                            id="include-tree"
                            type="checkbox"
                            checked={includeTree}
                            disabled={outputFormat === 'json'}
                            onChange={e => {
                                if (outputFormat !== 'json') setIncludeTree(e.target.checked);
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label
                            htmlFor="include-tree"
                            className={`font-medium ${outputFormat === 'json' ? 'text-slate-400 dark:text-slate-500' : ''}`}
                        >
                            Include Directory Tree
                        </label>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">(Markdown only)</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ControlsPanel;