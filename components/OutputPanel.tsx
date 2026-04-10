import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import JSZip from 'jszip';
import { ProcessorStatus, FileInfo, generateSplitOutputs } from '../lib/utils.ts';
import MarkdownPreview from './MarkdownPreview.tsx';
import JsonPreview from './JsonPreview.tsx';
import XmlPreview from './XmlPreview.tsx';
import LanguageStatsChart from './LanguageStatsChart.tsx';
import AnimatedCounter from './AnimatedCounter.tsx';
import ToastContainer, { ToastMessage } from './Toast.tsx';
import { useTranslation } from '../hooks/useTranslation';

interface OutputPanelProps {
    isLoading: boolean;
    statusMessage: string;
    stats: ProcessorStatus | null;
    outputContent: string;
    directoryName: string | null;
    outputFormat: 'markdown' | 'json' | 'xml';
    selectedFoldersToSplit?: Set<string>;
    filesData?: FileInfo[];
    onOpenSplitModal?: () => void;
}

const StatCard = ({ icon, label, value, tooltip, index = 0 }: { icon: React.ReactNode, label: string, value: string | number, tooltip?: string, index?: number }) => {
    const numericValue = typeof value === 'string' ? parseInt(value.replace(/[^0-9]/g, ''), 10) : value;
    const prefix = typeof value === 'string' && value.startsWith('~') ? '~' : '';
    const isNumeric = !isNaN(numericValue);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.08, type: 'spring', stiffness: 400, damping: 25 }}
            whileHover={{ scale: 1.05, y: -2 }}
            className={`flex items-center gap-2 rounded-md border border-slate-800/60 bg-slate-900/60 px-3 py-1.5 whitespace-nowrap flex-shrink-0 ${tooltip ? 'cursor-help' : ''}`}
            title={tooltip}
        >
            <div className="text-sky-300">{icon}</div>
            <div className="text-xs">
                <span className="font-medium text-slate-100">
                    {isNumeric ? (
                        <AnimatedCounter value={numericValue} prefix={prefix} duration={0.8} />
                    ) : value}
                </span>
                <span className="text-slate-400 ml-1">{label}</span>
            </div>
        </motion.div>
    );
};

// Shimmer skeleton for loading state
const ShimmerSkeleton: React.FC = () => (
    <div className="p-4 space-y-4 animate-pulse">
        <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-8 w-24 rounded-md bg-slate-800/80 shimmer" />
            ))}
        </div>
        <div className="h-3 w-3/4 rounded bg-slate-800/60 shimmer" />
        <div className="space-y-2 mt-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="h-3 rounded bg-slate-800/40 shimmer" style={{ width: `${60 + Math.random() * 40}%` }} />
            ))}
        </div>
        <div className="space-y-2 mt-4">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-3 rounded bg-slate-800/30 shimmer" style={{ width: `${50 + Math.random() * 50}%` }} />
            ))}
        </div>
    </div>
);

const OutputPanel: React.FC<OutputPanelProps> = ({
    isLoading, statusMessage: _, stats, outputContent, directoryName, outputFormat,
    selectedFoldersToSplit, filesData, onOpenSplitModal
}) => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const [downloaded, setDownloaded] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [viewMode, setViewMode] = useState<'raw' | 'preview' | 'split'>('preview');
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((text: string, type: ToastMessage['type'] = 'success') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, text, type }]);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const hasSplitSelection = selectedFoldersToSplit && selectedFoldersToSplit.size > 0;

    useEffect(() => {
        if (outputFormat === 'json' || outputFormat === 'xml') {
            setViewMode('raw');
        } else if (outputFormat === 'markdown') {
            setViewMode('preview');
        }
    }, [outputFormat]);

    const hasFiles = Boolean(stats?.files && stats.files.length > 0);

    const handleCopy = () => {
        if (!outputContent) return;
        navigator.clipboard.writeText(outputContent).then(() => {
            setCopied(true);
            addToast(t('output.copied'), 'success');
            setTimeout(() => setCopied(false), 2000);
        }, (err) => {
            console.error('Could not copy text: ', err);
            addToast(t('errors.processingFailed'), 'error');
        });
    };

    const handleDownload = async () => {
        if (!outputContent) return;
        setIsDownloading(true);
        try {
            const extensions: Record<string, string> = { markdown: 'md', json: 'json', xml: 'xml' };
            const extension = extensions[outputFormat];
            const timestamp = new Date().toISOString().split('T')[0];
            
            if (hasSplitSelection && filesData && filesData.length > 0 && directoryName) {
                const outputs = await generateSplitOutputs(
                    filesData, selectedFoldersToSplit!, directoryName,
                    { outputFormat, includeTree: true }
                );
                const zip = new JSZip();
                outputs.forEach((output) => {
                    const fileName = output.folderPath 
                        ? `${output.name}_unified.${extension}`
                        : `${directoryName}_main_unified.${extension}`;
                    zip.file(fileName, output.content);
                });
                const manifest = {
                    project_name: directoryName,
                    generation_timestamp: new Date().toISOString(),
                    total_parts: outputs.length,
                    output_format: outputFormat,
                    parts: outputs.map(o => ({
                        name: o.name, folder_path: o.folderPath || '(root)',
                        file_count: o.fileCount, size_bytes: o.size, estimated_tokens: o.tokens,
                    }))
                };
                zip.file('_manifest.json', JSON.stringify(manifest, null, 2));
                const blob = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${directoryName}_unified_split_${timestamp}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                const blob = new Blob([outputContent], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${directoryName || 'project'}_unified_${timestamp}.${extension}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
            setDownloaded(true);
            addToast(t('output.download') + ' ✓', 'success');
            setTimeout(() => setDownloaded(false), 2000);
        } catch (error) {
            console.error('Download failed:', error);
            addToast(t('errors.processingFailed'), 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="output-panel flex flex-col gap-0 h-full w-full rounded-2xl shadow-lg border border-slate-800/60 bg-gradient-to-b from-slate-900/95 to-slate-950/95 overflow-hidden max-w-full">
            <div className="p-4 border-b border-slate-800/60 flex-shrink-0">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg text-slate-100">{t('output.title')}</h3>
                        </div>
                        {hasFiles && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                className="flex flex-wrap items-center gap-3"
                            >
                                {onOpenSplitModal && (
                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                        onClick={onOpenSplitModal}
                                        className={`flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 border transition-all duration-200 ${
                                            hasSplitSelection
                                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                                                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                                        }`}
                                        title={t('output.splitFolders')}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        {hasSplitSelection 
                                            ? `${selectedFoldersToSplit!.size} ${t('output.foldersSelected')}`
                                            : t('output.splitFolders')
                                        }
                                    </motion.button>
                                )}
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                                    onClick={handleCopy} disabled={hasSplitSelection}
                                    className={`flex items-center gap-2 text-sm font-bold rounded-lg px-4 py-2.5 border-2 transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 ${
                                        hasSplitSelection ? 'opacity-50 cursor-not-allowed bg-slate-700 border-slate-600 text-slate-400'
                                            : copied ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg'
                                                : 'border-slate-200 bg-slate-100 text-slate-900 hover:bg-white hover:border-slate-300 hover:shadow-lg'
                                    }`}
                                    title={hasSplitSelection ? t('output.copyDisabledWhenSplit') : ''}
                                >
                                    <AnimatePresence mode="wait">
                                        {copied ? (
                                            <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>✓</motion.span>
                                        ) : (
                                            <motion.svg key="copy" initial={{ scale: 0.8 }} animate={{ scale: 1 }} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></motion.svg>
                                        )}
                                    </AnimatePresence>
                                    {copied ? t('output.copied') : t('output.copy')}
                                </motion.button>
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                                    onClick={handleDownload} disabled={isDownloading}
                                    className={`flex items-center gap-2 text-sm font-bold rounded-lg px-4 py-2.5 border-2 transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 ${
                                        isDownloading ? 'opacity-75 cursor-wait'
                                            : downloaded ? 'bg-blue-500 border-blue-600 text-white shadow-lg'
                                                : hasSplitSelection ? 'bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-700 hover:shadow-lg'
                                                    : 'border-slate-200 bg-slate-100 text-slate-900 hover:bg-white hover:border-slate-300 hover:shadow-lg'
                                    }`}
                                >
                                    {isDownloading ? (
                                        <motion.div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full"
                                            animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 5v14m0 0l-6-6m6 6l6-6"/><rect x="5" y="19" width="14" height="2" rx="1" /></svg>
                                    )}
                                    {isDownloading ? t('output.downloading')
                                        : hasSplitSelection ? t('output.downloadZip')
                                            : t('output.download')}
                                </motion.button>
                            </motion.div>
                        )}
                    </div>
                </div>
                {stats && (
                    <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
                        <StatCard index={0} icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>} label={t('output.stats.text')} value={stats.text} />
                        <StatCard index={1} icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2.4-2.2-4.5-4.4-5.9-2.2-1.4-4.8-2-7.5-1.4s-5.1 2.4-6.4 4.8c-1.3 2.4-1.2 5.2.3 7.5s3.5 4.1 6.1 4.7c2.6.6 5.3.2 7.5-1.1"/><path d="m18 18-6-6 6-6"/></svg>} label={t('output.stats.binary')} value={stats.binary} />
                        <StatCard index={2} icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>} label={t('output.stats.large')} value={stats.large} />
                        <StatCard index={3} icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.5A4.5 4.5 0 0 0 17.5 5c-.58 0-1.13.15-1.61.4-.48-.25-1.03-.4-1.61-.4A4.5 4.5 0 0 0 9.5 9.5c0 4.5 3 12.5 6 12.5s1.5-1.06 4-1.06Z"/><path d="M12 20.94c-1.5 0-2.75 1.06-4 1.06-3 0-6-8-6-12.5A4.5 4.5 0 0 1 6.5 5c.58 0 1.13.15 1.61.4.48-.25 1.03-.4 1.61-.4A4.5 4.5 0 0 1 14.5 9.5c0 4.5-3 12.5-6 12.5Z"/></svg>} label={t('output.stats.tokens')} value={`~${stats.tokens.toLocaleString()}`} />
                    </div>
                )}
                {stats?.languageStats && stats.languageStats.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        transition={{ delay: 0.3, duration: 0.4 }} className="mt-3">
                        <LanguageStatsChart stats={stats.languageStats} />
                    </motion.div>
                )}
            </div>
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <AnimatePresence mode="wait">
                {outputContent ? (
                    <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }} className="flex-1 min-h-0 flex flex-col overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800/60 bg-slate-900/70 flex-shrink-0">
                            {outputFormat === 'markdown' && (
                                <div className="flex items-center gap-1 ml-auto">
                                    {(['raw', 'preview', 'split'] as const).map((mode) => (
                                        <motion.button key={mode} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                            onClick={() => setViewMode(mode)}
                                            className={`relative text-xs font-medium rounded-md px-2 py-1 border shadow transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                                                viewMode === mode ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/60'
                                            }`}>
                                            {mode === 'raw' && t('output.raw')}
                                            {mode === 'preview' && t('output.preview')}
                                            {mode === 'split' && t('output.split')}
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                            {(outputFormat === 'json' || outputFormat === 'xml') && (
                                <div className="text-xs text-slate-400 ml-auto">
                                    {outputFormat === 'json' && '📋 JSON Preview'}
                                    {outputFormat === 'xml' && '📄 XML Preview'}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-h-0 overflow-hidden bg-slate-950/60">
                            <AnimatePresence mode="wait">
                            {outputFormat === 'markdown' ? (
                                viewMode === 'raw' ? (
                                    <motion.div key="raw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="h-full overflow-y-auto">
                                        <pre className="text-xs p-4 m-0 overflow-x-auto"><code className="whitespace-pre-wrap break-words">{outputContent}</code></pre>
                                    </motion.div>
                                ) : viewMode === 'preview' ? (
                                    <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="h-full overflow-y-auto">
                                        <div className="max-w-full overflow-x-hidden"><MarkdownPreview content={outputContent} /></div>
                                    </motion.div>
                                ) : (
                                    <motion.div key="split" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/60 h-full">
                                        <div className="overflow-y-auto min-h-0">
                                            <pre className="text-xs p-4 m-0 overflow-x-auto"><code className="whitespace-pre-wrap break-words">{outputContent}</code></pre>
                                        </div>
                                        <div className="overflow-y-auto min-h-0">
                                            <div className="max-w-full overflow-x-hidden"><MarkdownPreview content={outputContent} /></div>
                                        </div>
                                    </motion.div>
                                )
                            ) : outputFormat === 'json' ? (
                                <motion.div key="json" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="h-full">
                                    <JsonPreview content={outputContent} />
                                </motion.div>
                            ) : outputFormat === 'xml' ? (
                                <motion.div key="xml" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="h-full">
                                    <XmlPreview content={outputContent} />
                                </motion.div>
                            ) : (
                                <motion.div key="fallback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto">
                                    <pre className="text-xs p-4 m-0 overflow-x-auto"><code className="whitespace-pre-wrap break-words">{outputContent}</code></pre>
                                </motion.div>
                            )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col overflow-hidden">
                        {isLoading ? (
                            <div className="flex-1 flex flex-col">
                                {/* Indeterminate progress bar */}
                                <div className="h-1 w-full bg-slate-800 overflow-hidden flex-shrink-0">
                                    <motion.div
                                        className="h-full w-1/3 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                                        animate={{ x: ['-100%', '400%'] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                    />
                                </div>
                                <ShimmerSkeleton />
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-500 p-4 text-center">
                                <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-sm">
                                    {t('output.selectDirectory')}
                                </motion.span>
                            </div>
                        )}
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </div>
    );
};

export default OutputPanel;
