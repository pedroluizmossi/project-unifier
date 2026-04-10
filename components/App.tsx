import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DEFAULT_IGNORE_PATTERNS, calculateFolderStats, FolderStats } from '../lib/utils';
import { useProjectProcessor } from '../hooks/useProjectProcessor';
import { useTranslation } from '../hooks/useTranslation';
import ControlsPanel from './ControlsPanel';
import OutputPanel from './OutputPanel';
import DirectoryStructurePanel from './DirectoryStructurePanel';
import LandingPage from './LandingPage';
import FolderSplitModal from './FolderSplitModal';
import LanguageSwitcher from './LanguageSwitcher';

const FOLDER_SPLIT_THRESHOLD_MB = 1; // Show modal when project exceeds this size

const App = () => {
    // Configurações
    const [ignorePatterns, setIgnorePatterns] = useState(DEFAULT_IGNORE_PATTERNS.join('\n'));
    const [maxFileSize, setMaxFileSize] = useState<number>(5120);
    const [outputFormat, setOutputFormat] = useState<'markdown' | 'json' | 'xml'>('xml');
    const [includeTree, setIncludeTree] = useState(true);
    
    // Folder split state
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [selectedFoldersToSplit, setSelectedFoldersToSplit] = useState<Set<string>>(new Set());
    const [hasShownSplitModal, setHasShownSplitModal] = useState(false);
    const [showMobileControls, setShowMobileControls] = useState(false);

    const { t } = useTranslation();
    const { isLoading, statusMessage, outputContent, directoryName, stats, filesData, processDirectory, reprocessWithIgnorePatterns } = useProjectProcessor(t);

    // Calculate folder stats for split modal
    const folderStats: FolderStats | null = useMemo(() => {
        if (!stats?.files || !directoryName) return null;
        return calculateFolderStats(stats.files, directoryName);
    }, [stats?.files, directoryName]);

    // Calculate total project size
    const totalProjectSize = useMemo(() => {
        if (!stats?.files) return 0;
        return stats.files.reduce((sum, file) => sum + (file.size || 0), 0);
    }, [stats?.files]);

    // Show split modal when project is large enough
    useEffect(() => {
        const thresholdBytes = FOLDER_SPLIT_THRESHOLD_MB * 1024 * 1024;
        if (
            totalProjectSize >= thresholdBytes && 
            !hasShownSplitModal && 
            !isLoading && 
            directoryName &&
            folderStats
        ) {
            setShowSplitModal(true);
            setHasShownSplitModal(true);
        }
    }, [totalProjectSize, hasShownSplitModal, isLoading, directoryName, folderStats]);

    // Reset modal shown flag when selecting new directory
    const handleProcess = () => {
        setHasShownSplitModal(false);
        setSelectedFoldersToSplit(new Set());
        processDirectory({ ignorePatterns, maxFileSize, outputFormat, includeTree });
    };

    const handleSplitConfirm = (selectedFolders: Set<string>) => {
        setSelectedFoldersToSplit(selectedFolders);
        setShowSplitModal(false);
    };

    // Reprocess when output format changes
    useEffect(() => {
        if (directoryName && outputContent) {
            reprocessWithIgnorePatterns({
                ignorePatterns,
                maxFileSize,
                outputFormat,
                includeTree,
            });
        }
    }, [outputFormat]);

    const handleFileClick = useCallback((filePath: string) => {
        // Try to find in code blocks (raw mode)
        const codeBlocks = document.querySelectorAll('pre code');
        const searchStrings = [
            `### \`${filePath}\``,
            `"${filePath}"`,
            filePath,
        ];

        for (const block of codeBlocks) {
            const content = block.textContent || '';
            for (const searchString of searchStrings) {
                const index = content.indexOf(searchString);
                if (index >= 0) {
                    const container = block.parentElement?.parentElement;
                    if (container) {
                        const range = document.createRange();
                        const textNode = block.firstChild;
                        if (textNode) {
                            try {
                                range.setStart(textNode, Math.min(index, textNode.textContent?.length || 0));
                                range.setEnd(textNode, Math.min(index + searchString.length, textNode.textContent?.length || 0));
                                const rect = range.getBoundingClientRect();
                                const containerRect = container.getBoundingClientRect();
                                container.scrollTop = container.scrollTop + (rect.top - containerRect.top) - 50;
                            } catch {
                                const linesBefore = content.substring(0, index).split('\n').length;
                                container.scrollTop = linesBefore * 16 - 50;
                            }
                        }
                    }
                    return;
                }
            }
        }

        // Try rendered markdown headings (preview/split mode)
        const headings = document.querySelectorAll('h3');
        for (const heading of headings) {
            if ((heading.textContent || '').includes(filePath)) {
                heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        }

        // Targeted fallback: search in code/span/p elements instead of all DOM nodes
        const candidates = document.querySelectorAll('code, span, p, td, li');
        for (const el of candidates) {
            if (el.children.length === 0 && (el.textContent || '').includes(filePath)) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        }
    }, []);

    const handleAddToIgnore = (pattern: string) => {
        const patterns = ignorePatterns.split('\n').filter(p => p.trim());
        if (!patterns.includes(pattern)) {
            const updatedPatterns = [...patterns, pattern].join('\n');
            setIgnorePatterns(updatedPatterns);
            // Reprocess with updated patterns without asking for directory again
            setTimeout(() => {
                reprocessWithIgnorePatterns({
                    ignorePatterns: updatedPatterns,
                    maxFileSize,
                    outputFormat,
                    includeTree,
                });
            }, 0);
        }
    };

    // -- TELA INICIAL (LANDING PAGE) --
    if (!directoryName && !isLoading) {
        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key="landing"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -60, scale: 0.97 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                >
                    <LandingPage onSelectDirectory={handleProcess} isLoading={isLoading} />
                </motion.div>
            </AnimatePresence>
        );
    }

    // -- TELA PRINCIPAL (LAYOUT) --
    return (
        <AnimatePresence mode="wait">
        <motion.div
            key="main"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-row h-screen w-full overflow-hidden items-stretch bg-slate-950"
        >
            {/* Sidebar da Árvore de Arquivos */}
            <DirectoryStructurePanel
                stats={stats}
                directoryName={directoryName}
                onFileClick={handleFileClick}
                onAddToIgnore={handleAddToIgnore}
            />

            {/* Conteúdo Principal */}
            <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
                {/* Header global com LanguageSwitcher e botão de settings mobile */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/60 bg-slate-900/50 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowMobileControls(true)}
                            className="lg:hidden flex items-center gap-1.5 text-sm text-slate-400 hover:text-white bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-1.5 transition-colors"
                            title={t('controls.openSettings')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {t('controls.openSettings')}
                        </button>
                    </div>
                    <LanguageSwitcher />
                </div>

                {/* Área de Trabalho Dividida */}
                <div className="flex-1 flex overflow-hidden p-4 gap-4 min-h-0">
                    {/* Painel de Controles (Esquerda, Fixo ou Scrollável) */}
                    <div className="w-80 flex-shrink-0 overflow-y-auto hidden lg:block">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col p-4 h-full">
                            <ControlsPanel
                                ignorePatterns={ignorePatterns} setIgnorePatterns={setIgnorePatterns}
                                maxFileSize={maxFileSize} setMaxFileSize={setMaxFileSize}
                                outputFormat={outputFormat} setOutputFormat={setOutputFormat}
                                includeTree={includeTree} setIncludeTree={setIncludeTree}
                                onSelectDirectory={handleProcess}
                            />
                        </div>
                    </div>

                    {/* Painel de Saída (Direita, Flexível) */}
                    <div className="flex-1 min-w-0 h-full">
                         <OutputPanel
                            isLoading={isLoading}
                            statusMessage={statusMessage}
                            stats={stats}
                            outputContent={outputContent}
                            directoryName={directoryName}
                            outputFormat={outputFormat}
                            selectedFoldersToSplit={selectedFoldersToSplit}
                            filesData={filesData}
                            onOpenSplitModal={() => setShowSplitModal(true)}
                        />
                    </div>
                </div>
            </main>

            {/* Mobile Controls Drawer */}
            <AnimatePresence>
            {showMobileControls && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowMobileControls(false)}
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-slate-900 border-l border-slate-800 shadow-2xl overflow-y-auto p-4"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">{t('controls.title')}</h3>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowMobileControls(false)}
                                className="text-slate-400 hover:text-white transition-colors p-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </motion.button>
                        </div>
                        <ControlsPanel
                            ignorePatterns={ignorePatterns} setIgnorePatterns={setIgnorePatterns}
                            maxFileSize={maxFileSize} setMaxFileSize={setMaxFileSize}
                            outputFormat={outputFormat} setOutputFormat={setOutputFormat}
                            includeTree={includeTree} setIncludeTree={setIncludeTree}
                            onSelectDirectory={() => { setShowMobileControls(false); handleProcess(); }}
                        />
                    </motion.div>
                </div>
            )}
            </AnimatePresence>

            {/* Folder Split Modal */}
            <FolderSplitModal
                isOpen={showSplitModal}
                onClose={() => setShowSplitModal(false)}
                onConfirm={handleSplitConfirm}
                folderStats={folderStats}
                totalProjectSize={totalProjectSize}
                folderSizeLimitMB={FOLDER_SPLIT_THRESHOLD_MB}
            />
        </motion.div>
        </AnimatePresence>
    );
};

export default App;
