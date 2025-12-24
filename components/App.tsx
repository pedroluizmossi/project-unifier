import React, { useState } from 'react'; // Use import normal
import { DEFAULT_IGNORE_PATTERNS } from '../lib/utils';
import { useProjectProcessor } from '../hooks/useProjectProcessor';
import ControlsPanel from './ControlsPanel';
import OutputPanel from './OutputPanel';
import DirectoryStructurePanel from './DirectoryStructurePanel';

const App = () => {
    // Configurações
    const [ignorePatterns, setIgnorePatterns] = useState(DEFAULT_IGNORE_PATTERNS.join('\n'));
    const [maxFileSize, setMaxFileSize] = useState<number>(5120);
    const [outputFormat, setOutputFormat] = useState<'markdown' | 'json'>('markdown');
    const [includeTree, setIncludeTree] = useState(true);
    
    // UI State
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const { isLoading, statusMessage, outputContent, directoryName, stats, processDirectory, reprocessWithIgnorePatterns } = useProjectProcessor();

    const handleProcess = () => {
        processDirectory({ ignorePatterns, maxFileSize, outputFormat, includeTree });
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

    // -- TELA INICIAL (HERO) --
    if (!directoryName && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-center px-4">
                <div className="max-w-2xl space-y-8">
                    <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl">
                        Project <span className="text-indigo-500">Unifier</span>
                    </h1>
                    <p className="text-lg text-slate-400">
                        Prepare seu código para LLMs. Transforme diretórios complexos em um único arquivo de contexto (Markdown ou JSON) com facilidade.
                    </p>
                    <button
                        onClick={handleProcess}
                        className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/25"
                    >
                        Selecionar Diretório
                    </button>
                    
                    <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-800/50">
                        <div className="text-slate-500 text-sm">🔒 100% Local</div>
                        <div className="text-slate-500 text-sm">⚡ Processamento Rápido</div>
                        <div className="text-slate-500 text-sm">🤖 Otimizado para IA</div>
                    </div>
                </div>
            </div>
        );
    }

    // -- TELA PRINCIPAL (LAYOUT) --
    return (
        <div className="flex flex-row h-screen w-full overflow-hidden items-stretch bg-slate-950">
            {/* Sidebar da Árvore de Arquivos */}
            {isSidebarOpen && (
                <DirectoryStructurePanel
                    stats={stats}
                    directoryName={directoryName}
                    onFileClick={handleFileClick}
                    onAddToIgnore={handleAddToIgnore}
                />
            )}

            {/* Conteúdo Principal */}
            <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
                {/* Header Simplificado */}
                <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/50 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                        >
                           {/* Ícone de Menu Hamburguer/Toggle */}
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                        </button>
                        <span className="font-medium text-slate-200 truncate">{directoryName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                         {/* Botão de Reprocessar Rápido */}
                         <button
                            onClick={() => reprocessWithIgnorePatterns({ ignorePatterns, maxFileSize, outputFormat, includeTree })}
                            className="text-xs bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 px-3 py-1.5 rounded-md hover:bg-indigo-600/20 transition-colors"
                         >
                            Atualizar Saída
                         </button>
                    </div>
                </header>

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
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
