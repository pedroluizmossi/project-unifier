import React, { useState } from 'https://esm.sh/react@19.1.0';
import { ProcessorStatus } from '../lib/utils.ts';

interface OutputPanelProps {
    isLoading: boolean;
    statusMessage: string;
    stats: ProcessorStatus | null;
    outputContent: string;
    directoryName: string | null;
    outputFormat: 'markdown' | 'json';
}

const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700/50 rounded-md p-2">
        <div className="text-indigo-500">{icon}</div>
        <div className="text-xs">
            <span className="font-medium text-slate-800 dark:text-slate-200">{value}</span>
            <span className="text-slate-500 dark:text-slate-400 ml-1">{label}</span>
        </div>
    </div>
);


const OutputPanel: React.FC<OutputPanelProps> = ({
    isLoading, statusMessage, stats, outputContent, directoryName, outputFormat
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!outputContent) return;
        navigator.clipboard.writeText(outputContent).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }, (err) => {
            console.error('Could not copy text: ', err);
            alert('Failed to copy!');
        });
    };

    const handleDownload = () => {
        if (!outputContent) return;
        const blob = new Blob([outputContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const extension = outputFormat === 'json' ? 'json' : 'md';
        a.href = url;
        a.download = `${directoryName || 'project'}_unified_${new Date().toISOString().split('T')[0]}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col gap-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 min-h-[500px] lg:min-h-0">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-lg">Output</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 h-5">{statusMessage}</p>
                 {stats && (
                     <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                         <StatCard icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>} label="Text" value={stats.text} />
                         <StatCard icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2.4-2.2-4.5-4.4-5.9-2.2-1.4-4.8-2-7.5-1.4s-5.1 2.4-6.4 4.8c-1.3 2.4-1.2 5.2.3 7.5s3.5 4.1 6.1 4.7c2.6.6 5.3.2 7.5-1.1"/><path d="m18 18-6-6 6-6"/></svg>} label="Binary" value={stats.binary} />
                         <StatCard icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>} label="Large" value={stats.large} />
                         <StatCard icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.5A4.5 4.5 0 0 0 17.5 5c-.58 0-1.13.15-1.61.4-.48-.25-1.03-.4-1.61-.4A4.5 4.5 0 0 0 9.5 9.5c0 4.5 3 12.5 6 12.5s1.5-1.06 4-1.06Z"/><path d="M12 20.94c-1.5 0-2.75 1.06-4 1.06-3 0-6-8-6-12.5A4.5 4.5 0 0 1 6.5 5c.58 0 1.13.15 1.61.4.48-.25 1.03-.4 1.61-.4A4.5 4.5 0 0 1 14.5 9.5c0 4.5-3 12.5-6 12.5Z"/></svg>} label="Tokens" value={`~${stats.tokens.toLocaleString()}`} />
                    </div>
                 )}
            </div>
            <div className="flex-grow flex flex-col overflow-hidden">
                {outputContent ? (
                    <>
                        <div className="flex items-center gap-2 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-t-lg">
                            <span className={`text-xs text-green-600 dark:text-green-400 transition-opacity ${copied ? 'copied-feedback' : 'opacity-0'}`}>Copied!</span>
                            <button onClick={handleCopy} className="text-xs font-medium rounded-md px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Copy</button>
                            <button onClick={handleDownload} className="text-xs font-medium rounded-md px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Download</button>
                        </div>
                        <div className="flex-grow min-h-[350px] max-h-[600px] overflow-y-auto rounded-b-lg bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                            <pre className="text-xs p-4 m-0 overflow-x-auto"><code className="whitespace-pre-wrap break-words">{outputContent}</code></pre>
                        </div>
                    </>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-slate-500 dark:text-slate-400 p-4 text-center">
                        {isLoading ? 'Generating output, this might take a moment...' : 'Output will appear here...'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OutputPanel;
