import { useState, useEffect } from 'react';
import { DEFAULT_IGNORE_PATTERNS } from '../lib/utils';
import { useProjectProcessor } from '../hooks/useProjectProcessor';
import { useTranslation } from '../hooks/useTranslation';
import ControlsPanel from './ControlsPanel';
import OutputPanel from './OutputPanel';
import DirectoryStructurePanel from './DirectoryStructurePanel';
import LandingPage from './LandingPage';

const App = () => {
    // Configurações
    const [ignorePatterns, setIgnorePatterns] = useState(DEFAULT_IGNORE_PATTERNS.join('\n'));
    const [maxFileSize, setMaxFileSize] = useState<number>(5120);
    const [outputFormat, setOutputFormat] = useState<'markdown' | 'json' | 'xml'>('markdown');
    const [includeTree, setIncludeTree] = useState(true);

    const { t } = useTranslation();
    const { isLoading, statusMessage, outputContent, directoryName, stats, processDirectory, reprocessWithIgnorePatterns } = useProjectProcessor(t);

    const handleProcess = () => {
        processDirectory({ ignorePatterns, maxFileSize, outputFormat, includeTree });
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

    // -- TELA INICIAL (LANDING PAGE) --
    if (!directoryName && !isLoading) {
        return <LandingPage onSelectDirectory={handleProcess} isLoading={isLoading} />;
    }

    // -- TELA PRINCIPAL (LAYOUT) --
    return (
        <div className="flex flex-row h-screen w-full overflow-hidden items-stretch bg-slate-950">
            {/* Sidebar da Árvore de Arquivos */}
            <DirectoryStructurePanel
                stats={stats}
                directoryName={directoryName}
                onFileClick={handleFileClick}
                onAddToIgnore={handleAddToIgnore}
            />

            {/* Conteúdo Principal */}
            <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
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
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
