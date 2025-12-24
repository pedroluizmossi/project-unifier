import React from 'react';

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
    const [newPattern, setNewPattern] = React.useState('');
    const [sizeUnit, setSizeUnit] = React.useState<'KB' | 'MB' | 'GB'>('KB');

    const handleAddPattern = () => {
        if (newPattern.trim()) {
            const currentPatterns = ignorePatterns ? ignorePatterns.split('\n') : [];
            if (!currentPatterns.includes(newPattern.trim())) {
                setIgnorePatterns([...currentPatterns, newPattern.trim()].join('\n'));
            }
            setNewPattern('');
        }
    };

    const handleRemovePattern = (patternToRemove: string) => {
        const currentPatterns = ignorePatterns.split('\n');
        setIgnorePatterns(currentPatterns.filter(p => p !== patternToRemove).join('\n'));
    };

    const handleSizeChange = (val: number) => {
        // Convert to KB for internal state
        let kbValue = val;
        if (sizeUnit === 'MB') kbValue = val * 1024;
        if (sizeUnit === 'GB') kbValue = val * 1024 * 1024;
        setMaxFileSize(kbValue);
    };

    const displaySize = React.useMemo(() => {
        if (sizeUnit === 'MB') return maxFileSize / 1024;
        if (sizeUnit === 'GB') return maxFileSize / (1024 * 1024);
        return maxFileSize;
    }, [maxFileSize, sizeUnit]);

    return (
        <div className="w-full">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-700/50 pb-4">
                <button className="text-slate-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                </button>
                <h3 className="text-lg font-semibold text-white">Configurações de Entrada Otimizadas</h3>
            </div>

            <div className="space-y-8">
                {/* Ignore Patterns Section */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Ignore Patterns</label>
                    <div className="flex gap-2 mb-2">
                        <input 
                            type="text" 
                            value={newPattern}
                            onChange={(e) => setNewPattern(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddPattern()}
                            placeholder="ex: .git"
                            className="flex-1 bg-slate-800/50 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <button 
                            onClick={handleAddPattern}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                        >
                            +
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 p-2.5 bg-slate-900/50 rounded border border-slate-700/50 max-h-48 overflow-y-auto">
                        {ignorePatterns.split('\n').filter(p => p.trim()).map((pattern, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-1.5 px-2 py-1 rounded text-xs bg-slate-700 text-slate-300 border border-slate-600">
                                <span className="truncate flex-1">{pattern}</span>
                                <button 
                                    onClick={() => handleRemovePattern(pattern)}
                                    className="text-slate-400 hover:text-red-400 focus:outline-none flex-shrink-0"
                                    title="Remover"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        {(!ignorePatterns || !ignorePatterns.trim()) && (
                            <span className="text-slate-500 text-xs italic col-span-2 p-1">Nenhum padrão.</span>
                        )}
                    </div>
                </div>

                {/* Max File Size Section */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Max File Size</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="flex">
                            <input
                                type="number"
                                value={displaySize}
                                onChange={(e) => handleSizeChange(Number(e.target.value))}
                                className="block w-full rounded-l-lg bg-slate-800/50 border border-slate-600 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Tamanho máximo"
                            />
                            <select
                                value={sizeUnit}
                                onChange={(e) => {
                                    setSizeUnit(e.target.value as any);
                                    // Recalculate maxFileSize based on new unit but keeping the same number value visually?
                                    // Usually UX expects the value to convert. But here the user changes unit to type a new value.
                                    // Let's keep the visual number and update the internal KB value.
                                    let val = displaySize;
                                    let newUnit = e.target.value;
                                    let kbValue = val;
                                    if (newUnit === 'MB') kbValue = val * 1024;
                                    if (newUnit === 'GB') kbValue = val * 1024 * 1024;
                                    if (newUnit === 'KB') kbValue = val;
                                    setMaxFileSize(kbValue);
                                }}
                                className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-slate-600 bg-slate-700 text-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="KB">KB</option>
                                <option value="MB">MB</option>
                                <option value="GB">GB</option>
                            </select>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Arquivos maiores que este tamanho serão ignorados.</p>
                    </div>
                </div>

                {/* Output Format & Tree */}
                <div className="grid grid-cols-1 gap-6 pt-4 border-t border-slate-700/50">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Output Format</label>
                        <div className="flex rounded-lg shadow-sm bg-slate-800/50 p-1 border border-slate-600">
                            <button 
                                onClick={() => setOutputFormat('markdown')} 
                                className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${outputFormat === 'markdown' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                Markdown
                            </button>
                            <button 
                                onClick={() => setOutputFormat('json')} 
                                className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${outputFormat === 'json' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                JSON
                            </button>
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-lg border border-slate-700/50 bg-slate-800/30 ${outputFormat === 'json' ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-300">Include Directory Tree</span>
                            <span className="text-xs text-slate-500">Add structure visualization</span>
                        </div>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input 
                                type="checkbox" 
                                name="toggle" 
                                id="include-tree-toggle" 
                                checked={includeTree}
                                onChange={(e) => {
                                    if (outputFormat !== 'json') setIncludeTree(e.target.checked);
                                }}
                                className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-5 checked:border-indigo-600"
                                style={{ top: 2, left: 2 }}
                            />
                            <label 
                                htmlFor="include-tree-toggle" 
                                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${includeTree ? 'bg-indigo-600' : 'bg-slate-700'}`}
                            ></label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ControlsPanel;