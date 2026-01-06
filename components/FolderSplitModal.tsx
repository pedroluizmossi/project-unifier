import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { FolderStats, findLargeFolders } from '../lib/utils';
import { useTranslation } from '../hooks/useTranslation';

interface FolderSplitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedFolders: Set<string>) => void;
    folderStats: FolderStats | null;
    totalProjectSize: number;
    folderSizeLimitMB: number;
}

const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const FolderSplitModal: React.FC<FolderSplitModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    folderStats,
    totalProjectSize,
    folderSizeLimitMB,
}) => {
    const { t } = useTranslation();
    const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    const sizeLimitBytes = folderSizeLimitMB * 1024 * 1024;

    // Find large folders automatically
    const largeFolders = useMemo(() => {
        if (!folderStats) return [];
        return findLargeFolders(folderStats, sizeLimitBytes);
    }, [folderStats, sizeLimitBytes]);

    // Reset selection when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedFolders(new Set());
            // Auto-expand root and first level
            if (folderStats) {
                const expanded = new Set<string>(['']);
                folderStats.children.forEach(child => expanded.add(child.path));
                setExpandedFolders(expanded);
            }
        }
    }, [isOpen, folderStats]);

    const toggleFolder = useCallback((path: string) => {
        setSelectedFolders(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                // Remove any parent or child folders to avoid overlap
                for (const existing of Array.from(next)) {
                    if (path.startsWith(existing + '/') || existing.startsWith(path + '/')) {
                        next.delete(existing);
                    }
                }
                next.add(path);
            }
            return next;
        });
    }, []);

    const toggleExpand = useCallback((path: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    }, []);

    const handleConfirm = useCallback(() => {
        onConfirm(selectedFolders);
        onClose();
    }, [selectedFolders, onConfirm, onClose]);

    const handleSkip = useCallback(() => {
        onConfirm(new Set());
        onClose();
    }, [onConfirm, onClose]);

    // Calculate summary stats
    const selectedStats = useMemo(() => {
        if (!folderStats) return { size: 0, tokens: 0, files: 0, outputCount: 0 };
        
        let totalSelectedSize = 0;
        let totalSelectedTokens = 0;
        let totalSelectedFiles = 0;

        const findFolder = (stats: FolderStats, path: string): FolderStats | null => {
            if (stats.path === path) return stats;
            for (const child of stats.children) {
                const found = findFolder(child, path);
                if (found) return found;
            }
            return null;
        };

        selectedFolders.forEach(path => {
            const folder = findFolder(folderStats, path);
            if (folder) {
                totalSelectedSize += folder.size;
                totalSelectedTokens += folder.tokens;
                totalSelectedFiles += folder.fileCount;
            }
        });

        return {
            size: totalSelectedSize,
            tokens: totalSelectedTokens,
            files: totalSelectedFiles,
            outputCount: selectedFolders.size + 1, // +1 for remaining files
        };
    }, [folderStats, selectedFolders]);

    const renderFolderNode = (folder: FolderStats, depth: number = 0) => {
        const isSelected = selectedFolders.has(folder.path);
        const isExpanded = expandedFolders.has(folder.path);
        const hasChildren = folder.children.length > 0;
        const isLarge = folder.size >= sizeLimitBytes;
        const isRoot = folder.path === '';

        // Check if this folder is inside a selected parent
        const isInsideSelected = Array.from(selectedFolders).some(
            selected => folder.path.startsWith(selected + '/') && folder.path !== selected
        );

        return (
            <div key={folder.path || '__root__'} className="select-none">
                <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                        isSelected 
                            ? 'bg-indigo-600/30 border border-indigo-500/50' 
                            : isInsideSelected
                                ? 'bg-slate-800/30 opacity-50'
                                : isLarge && !isRoot
                                    ? 'bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20'
                                    : 'hover:bg-slate-800/50'
                    }`}
                    style={{ marginLeft: `${depth * 16}px` }}
                >
                    {/* Expand/Collapse */}
                    {hasChildren && (
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleExpand(folder.path); }}
                            className="p-0.5 hover:bg-slate-700 rounded transition-colors"
                        >
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                                viewBox="0 0 20 20" 
                                fill="currentColor"
                            >
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                    {!hasChildren && <div className="w-5" />}

                    {/* Checkbox (not for root) */}
                    {!isRoot && (
                        <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isInsideSelected}
                            onChange={() => toggleFolder(folder.path)}
                            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer disabled:opacity-50"
                        />
                    )}

                    {/* Folder Icon */}
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 flex-shrink-0 ${isLarge && !isRoot ? 'text-amber-400' : 'text-sky-400'}`} 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="1.5"
                    >
                        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h4l2 2H18.5A2.5 2.5 0 0 1 21 9.5v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z" />
                    </svg>

                    {/* Name */}
                    <span 
                        className={`flex-1 text-sm font-medium truncate ${isRoot ? 'text-slate-100' : 'text-slate-200'}`}
                        onClick={() => !isRoot && !isInsideSelected && toggleFolder(folder.path)}
                    >
                        {folder.name}
                    </span>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-500">{folder.fileCount} {t('folderSplit.files')}</span>
                        <span className={`font-mono ${isLarge && !isRoot ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}>
                            {formatBytes(folder.size)}
                        </span>
                        <span className={`font-mono ${
                            folder.tokens > 25000 ? 'text-red-400' :
                            folder.tokens > 15000 ? 'text-yellow-400' :
                            folder.tokens > 5000 ? 'text-blue-400' :
                            'text-green-400'
                        }`}>
                            ~{folder.tokens.toLocaleString()}t
                        </span>
                    </div>
                </div>

                {/* Children */}
                {hasChildren && isExpanded && (
                    <div className="mt-1">
                        {folder.children.map(child => renderFolderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
                onClick={onClose} 
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-slate-800 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                {t('folderSplit.title')}
                            </h2>
                            <p className="text-sm text-slate-400 mt-1">
                                {t('folderSplit.description', `Project size: ${formatBytes(totalProjectSize)} — Select folders to export as separate files`)}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Large folders suggestion */}
                    {largeFolders.length > 0 && (
                        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                            <p className="text-sm text-amber-300 font-medium">
                                ⚠️ {t('folderSplit.largeFoldersFound', `${largeFolders.length} folders exceed ${folderSizeLimitMB}MB`)}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {largeFolders.slice(0, 5).map(folder => (
                                    <button
                                        key={folder.path}
                                        onClick={() => toggleFolder(folder.path)}
                                        className={`text-xs px-2 py-1 rounded-md transition-colors ${
                                            selectedFolders.has(folder.path)
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                        }`}
                                    >
                                        {folder.name} ({formatBytes(folder.size)})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 min-h-0">
                    {folderStats && renderFolderNode(folderStats)}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        {/* Summary */}
                        <div className="text-sm">
                            {selectedFolders.size > 0 ? (
                                <div className="flex flex-wrap items-center gap-4">
                                    <span className="text-slate-400">
                                        <span className="text-indigo-400 font-semibold">{selectedFolders.size}</span> {t('folderSplit.foldersSelected')}
                                    </span>
                                    <span className="text-slate-400">
                                        {t('folderSplit.willGenerate')} <span className="text-emerald-400 font-semibold">{selectedStats.outputCount}</span> {t('folderSplit.outputFiles')}
                                    </span>
                                    <span className="text-slate-500">
                                        ({formatBytes(selectedStats.size)} • ~{selectedStats.tokens.toLocaleString()}t)
                                    </span>
                                </div>
                            ) : (
                                <span className="text-slate-500">{t('folderSplit.noSelection')}</span>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSkip}
                                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                {t('folderSplit.skipSplit')}
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={selectedFolders.size === 0}
                                className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                    selectedFolders.size > 0
                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-indigo-500/25'
                                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                {selectedFolders.size > 0 
                                    ? t('folderSplit.confirmSplit', `Split into ${selectedStats.outputCount} files`)
                                    : t('folderSplit.selectFolders')
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FolderSplitModal;
