import React, { useState } from 'https://esm.sh/react@19.1.0';
import { DEFAULT_IGNORE_PATTERNS } from '../lib/utils.ts';
import { useProjectProcessor } from '../hooks/useProjectProcessor.ts';
import ControlsPanel from './ControlsPanel.tsx';
import OutputPanel from './OutputPanel.tsx';
import DirectoryStructurePanel from './DirectoryStructurePanel.tsx';
import Footer from './Footer.tsx';

const App = () => {
    // State for user-configurable settings
    const [ignorePatterns, setIgnorePatterns] = useState(DEFAULT_IGNORE_PATTERNS.join('\n'));
    const [maxFileSize, setMaxFileSize] = useState<number>(5120);
    const [outputFormat, setOutputFormat] = useState<'markdown' | 'json'>('markdown');
    const [includeTree, setIncludeTree] = useState(true);

    // Custom hook to handle all processing logic
    const { isLoading, statusMessage, outputContent, directoryName, stats, processDirectory, reprocessWithIgnorePatterns } = useProjectProcessor();

    const handleProcessDirectory = () => {
        processDirectory({
            ignorePatterns,
            maxFileSize,
            outputFormat,
            includeTree,
        });
    };

    const handleFileClick = (filePath: string) => {
        // Scroll to the file in the output panel
        // First, try to find in code blocks (raw mode)
        const codeBlocks = document.querySelectorAll('pre code');
        for (const block of codeBlocks) {
            const content = block.textContent || '';
            // Look for markdown heading or JSON key
            const searchStrings = [
                `### \`${filePath}\``,
                `"${filePath}"`,
                filePath,
            ];

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
                            } catch (e) {
                                // Fallback: just scroll to approximate position
                                const linesBefore = content.substring(0, index).split('\n').length;
                                container.scrollTop = linesBefore * 16 - 50;
                            }
                        }
                    }
                    return;
                }
            }
        }

        // If not found in code blocks, try to find in rendered markdown (preview/split mode)
        // Look for h3 headings with the file path
        const headings = document.querySelectorAll('h3');
        for (const heading of headings) {
            const headingText = heading.textContent || '';
            if (headingText.includes(filePath)) {
                heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        }

        // Final fallback: search for any element containing the file path
        const allElements = document.querySelectorAll('*');
        for (const element of allElements) {
            const text = element.textContent || '';
            if (text.includes(filePath) && element.children.length === 0) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        }
    };

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

    if (!directoryName && !isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-[#020617] text-slate-200 font-sans overflow-hidden">
                {/* Animated background gradient */}
                <div className="fixed inset-0 -z-10">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>

                <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center max-w-4xl mx-auto space-y-10 z-10">
                        {/* Hero title with animation */}
                        <div className="space-y-6">
                            <div className="inline-block">
                                <span className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 uppercase tracking-widest">
                                    Project Unifier
                                </span>
                            </div>
                            
                            <h2 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white">
                                Transforme seu <span className="gradient-text">Projeto</span>
                            </h2>
                            
                            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                                Converta seu código inteiro em um arquivo contextualizado pronto para análise por IA. Perfeito para documentação, refatoração e compreensão do projeto.
                            </p>
                        </div>

                        {/* Feature highlights */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-12 max-w-3xl mx-auto">
                            <div className="glass-card p-4 rounded-xl border border-slate-700/50 backdrop-blur-md">
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span>100% Privado</span>
                                </div>
                            </div>
                            <div className="glass-card p-4 rounded-xl border border-slate-700/50 backdrop-blur-md">
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span>Super Rápido</span>
                                </div>
                            </div>
                            <div className="glass-card p-4 rounded-xl border border-slate-700/50 backdrop-blur-md">
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.5a2 2 0 00-1 .267" />
                                    </svg>
                                    <span>IA-Ready</span>
                                </div>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <div className="flex flex-col items-center gap-6 mt-12">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition duration-300 animate-pulse"></div>
                                <button
                                    onClick={handleProcessDirectory}
                                    className="relative inline-flex items-center justify-center gap-3 px-8 py-5 text-lg font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#020617] focus:ring-indigo-400 shadow-2xl transition-all duration-200 hover:shadow-purple-500/50 hover:-translate-y-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                    Selecionar Diretório
                                </button>
                            </div>
                            
                            <p className="text-sm text-slate-400 max-w-md">
                                Selecione um diretório local. Suporta múltiplos formatos de saída.
                            </p>
                        </div>

                        {/* Stats section */}
                        <div className="mt-12 pt-12 border-t border-slate-800">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                                <div className="text-center">
                                    <div className="text-3xl font-bold gradient-text">Filtros</div>
                                    <p className="text-xs text-slate-400 mt-1">customizáveis</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold gradient-text">JSON</div>
                                    <p className="text-xs text-slate-400 mt-1">ou Markdown</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold gradient-text">Árvore</div>
                                    <p className="text-xs text-slate-400 mt-1">do projeto</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            <DirectoryStructurePanel 
                stats={stats} 
                directoryName={directoryName}
                onFileClick={handleFileClick}
                onAddToIgnore={handleAddToIgnore}
            />
            
            <span className="block text-xs text-slate-400 bg-slate-800/60 rounded px-3 py-1 w-fit mx-auto mt-4">
                <strong>Privacy:</strong> All processing happens locally in your browser. No files or data ever leave your device.
            </span>
            <main
                className="ml-96 flex-1 w-full flex flex-col gap-8 py-4 min-h-0 overflow-hidden"
            >
                <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 pb-4">
                    <div className="flex-1 min-w-0 flex flex-col gap-6">
                        <div className="flex flex-col lg:flex-row gap-6 items-stretch h-full">
                            <div className="w-full lg:w-80 flex-shrink-0">
                                <div className="rounded-2xl overflow-hidden border border-slate-800/60 bg-slate-900/50 h-full">
                                    <div className="p-6">
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
                                        <div className="mt-4">
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
                                </div>
                            </div>
                            <div className="flex-1 min-w-0 min-h-0">
                                <OutputPanel
                                    isLoading={isLoading}
                                    statusMessage={statusMessage}
                                    stats={stats}
                                    outputContent={outputContent}
                                    directoryName={directoryName}
                                    outputFormat={outputFormat}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default App;
