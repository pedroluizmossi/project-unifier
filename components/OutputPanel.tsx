import React, { useEffect, useMemo, useState } from 'https://esm.sh/react@19.1.0';
import { ProcessorStatus } from '../lib/utils.ts';
import MarkdownPreview from './MarkdownPreview.tsx';

interface OutputPanelProps {
    isLoading: boolean;
    statusMessage: string;
    stats: ProcessorStatus | null;
    outputContent: string;
    directoryName: string | null;
    outputFormat: 'markdown' | 'json';
}

const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
    <div className="flex items-center gap-2 rounded-md border border-slate-800/60 bg-slate-900/60 p-2">
        <div className="text-sky-300">{icon}</div>
        <div className="text-xs">
            <span className="font-medium text-slate-100">{value}</span>
            <span className="text-slate-400 ml-1">{label}</span>
        </div>
    </div>
);


const OutputPanel: React.FC<OutputPanelProps> = ({
    isLoading, statusMessage, stats, outputContent, directoryName, outputFormat
}) => {
    const [copied, setCopied] = useState(false);
    const [viewMode, setViewMode] = useState<'raw' | 'preview' | 'split'>('preview');

    useEffect(() => {
        if (outputFormat === 'json') {
            setViewMode('raw');
        } else if (outputFormat === 'markdown') {
            setViewMode(currentViewMode => currentViewMode === 'raw' ? 'split' : currentViewMode);
        }
    }, [outputFormat]);

    const hasFiles = Boolean(stats?.files && stats.files.length > 0);
    const totalSize = useMemo(() => {
        if (!stats?.files) return 0;
        return stats.files.reduce((sum, file) => sum + (file.size || 0), 0);
    }, [stats]);

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
        <div className="output-panel flex flex-col gap-0 h-full w-full rounded-2xl shadow-lg border border-slate-800/60 bg-gradient-to-b from-slate-900/95 to-slate-950/95 overflow-hidden max-w-full">
            <div className="p-4 border-b border-slate-800/60 flex-shrink-0">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div>
                            <h3 className="font-semibold text-lg text-slate-100">Saída Unificada</h3>
                            <p className="text-xs text-slate-400 mt-1">{statusMessage}</p>
                        </div>
                        {hasFiles && (
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-2 text-xs font-semibold rounded-md px-3 py-1.5 border border-slate-200/70 bg-slate-100 text-slate-900 hover:bg-white transition-colors shadow"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                    Copiar
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-2 text-xs font-semibold rounded-md px-3 py-1.5 border border-slate-200/70 bg-slate-100 text-slate-900 hover:bg-white transition-colors shadow"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 5v14m0 0l-6-6m6 6l6-6"/><rect x="5" y="19" width="14" height="2" rx="1" /></svg>
                                    Download
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                {stats && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <StatCard icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>} label="Text" value={stats.text} />
                        <StatCard icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2.4-2.2-4.5-4.4-5.9-2.2-1.4-4.8-2-7.5-1.4s-5.1 2.4-6.4 4.8c-1.3 2.4-1.2 5.2.3 7.5s3.5 4.1 6.1 4.7c2.6.6 5.3.2 7.5-1.1"/><path d="m18 18-6-6 6-6"/></svg>} label="Binary" value={stats.binary} />
                        <StatCard icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>} label="Large" value={stats.large} />
                        <StatCard icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.5A4.5 4.5 0 0 0 17.5 5c-.58 0-1.13.15-1.61.4-.48-.25-1.03-.4-1.61-.4A4.5 4.5 0 0 0 9.5 9.5c0 4.5 3 12.5 6 12.5s1.5-1.06 4-1.06Z"/><path d="M12 20.94c-1.5 0-2.75 1.06-4 1.06-3 0-6-8-6-12.5A4.5 4.5 0 0 1 6.5 5c.58 0 1.13.15 1.61.4.48-.25 1.03-.4 1.61-.4A4.5 4.5 0 0 1 14.5 9.5c0 4.5-3 12.5-6 12.5Z"/></svg>} label="Tokens" value={`~${stats.tokens.toLocaleString()}`} />
                    </div>
                )}
            </div>
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {outputContent ? (
                    <>
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800/60 bg-slate-900/70 flex-shrink-0">
                            <span className={`text-xs text-emerald-400 transition-opacity ${copied ? 'opacity-100' : 'opacity-0'}`}>✓ Copiado!</span>
                            {outputFormat === 'markdown' && (
                                <div className="flex items-center gap-1 ml-auto">
                                    {(['raw', 'preview', 'split'] as const).map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => setViewMode(mode)}
                                            className={`text-xs font-medium rounded-md px-2 py-1 border shadow transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                                                viewMode === mode
                                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/60'
                                            }`}
                                        >
                                            {mode === 'raw' && 'Raw'}
                                            {mode === 'preview' && 'Preview'}
                                            {mode === 'split' && 'Split'}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-h-0 overflow-hidden bg-slate-950/60">
                            {outputFormat === 'markdown' && viewMode !== 'raw' ? (
                                        viewMode === 'preview' ? (
                                            <div className="h-full overflow-y-auto">
                                                <div className="max-w-full overflow-x-hidden">
                                                    <MarkdownPreview content={outputContent} />
                                                </div>
                                            </div>
                                ) : (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/60 h-full">
                                                <div className="overflow-y-auto min-h-0">
                                                    <pre className="text-xs p-4 m-0 overflow-x-auto"><code className="whitespace-pre-wrap break-words">{outputContent}</code></pre>
                                                </div>
                                                <div className="overflow-y-auto min-h-0">
                                                    <div className="max-w-full overflow-x-hidden">
                                                        <MarkdownPreview content={outputContent} />
                                                    </div>
                                                </div>
                                            </div>
                                )
                            ) : (
                                <div className="h-full overflow-y-auto">
                                    <pre className="text-xs p-4 m-0 overflow-x-auto"><code className="whitespace-pre-wrap break-words">{outputContent}</code></pre>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500 p-4 text-center">
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-indigo-600/30 border-t-indigo-500 rounded-full animate-spin"></div>
                                <span className="text-sm">Gerando saída, aguarde...</span>
                            </div>
                        ) : (
                            <span className="text-sm">Selecione um diretório para começar</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OutputPanel;
