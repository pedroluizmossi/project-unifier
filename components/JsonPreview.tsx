import React, { useState, useEffect, useMemo } from 'react';

interface JsonPreviewProps {
    content: string;
}

const JsonPreview: React.FC<JsonPreviewProps> = ({ content }) => {
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    const jsonData = useMemo(() => {
        try {
            return JSON.parse(content);
        } catch (e) {
            return null;
        }
    }, [content]);

    if (jsonData === null) {
        return (
            <div className="p-4 text-red-400">
                <p>Invalid JSON</p>
            </div>
        );
    }

    // Expand only first level on mount
    useEffect(() => {
        const firstLevelPaths = new Set<string>();
        firstLevelPaths.add(''); // Add root path
        if (Array.isArray(jsonData)) {
            jsonData.forEach((_, idx) => {
                firstLevelPaths.add(`[${idx}]`);
            });
        } else if (typeof jsonData === 'object' && jsonData !== null) {
            Object.keys(jsonData).forEach(key => {
                firstLevelPaths.add(`.${key}`);
            });
        }
        setExpandedPaths(firstLevelPaths);
    }, [jsonData]);

    const togglePath = (path: string) => {
        const newSet = new Set(expandedPaths);
        if (newSet.has(path)) {
            newSet.delete(path);
        } else {
            newSet.add(path);
        }
        setExpandedPaths(newSet);
    };

    const highlightSearch = (text: string): React.ReactNode => {
        if (!searchTerm) return text;
        const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
        return parts.map((part, i) => 
            part.toLowerCase() === searchTerm.toLowerCase() 
                ? <mark key={i} className="bg-yellow-500/30 text-yellow-200">{part}</mark>
                : part
        );
    };

    const renderValue = (value: any, path: string = '', depth: number = 0): React.ReactNode => {
        const isExpanded = expandedPaths.has(path);

        if (value === null) {
            return <span className="text-slate-400">null</span>;
        }

        if (typeof value === 'boolean') {
            return <span className="text-amber-400">{value.toString()}</span>;
        }

        if (typeof value === 'number') {
            return <span className="text-emerald-400">{value}</span>;
        }

        if (typeof value === 'string') {
            return <span className="text-green-400">"{highlightSearch(value)}"</span>;
        }

        if (Array.isArray(value)) {
            if (value.length === 0) {
                return <span className="text-slate-400">[]</span>;
            }

            return (
                <div>
                    <button
                        onClick={() => togglePath(path)}
                        className="text-slate-400 hover:text-slate-300 focus:outline-none mr-1 w-4 inline-block text-center"
                    >
                        {isExpanded ? '▼' : '▶'}
                    </button>
                    <span className="text-slate-400">[</span>
                    {isExpanded && (
                        <div className="ml-4 border-l border-slate-700 pl-2">
                            {value.map((item, idx) => (
                                <div key={idx} className="py-1">
                                    <span className="text-slate-500">{idx}:</span>{' '}
                                    {renderValue(item, `${path}[${idx}]`, depth + 1)}
                                    {idx < value.length - 1 && <span className="text-slate-400">,</span>}
                                </div>
                            ))}
                        </div>
                    )}
                    <span className="text-slate-400">]</span>
                </div>
            );
        }

        if (typeof value === 'object') {
            const keys = Object.keys(value);
            if (keys.length === 0) {
                return <span className="text-slate-400">{'{}'}</span>;
            }

            return (
                <div>
                    <button
                        onClick={() => togglePath(path)}
                        className="text-slate-400 hover:text-slate-300 focus:outline-none mr-1 w-4 inline-block text-center"
                    >
                        {isExpanded ? '▼' : '▶'}
                    </button>
                    <span className="text-slate-400">{'{'}</span>
                    {isExpanded && (
                        <div className="ml-4 border-l border-slate-700 pl-2">
                            {keys.map((key, idx) => (
                                <div key={key} className="py-1">
                                    <span className="text-blue-400">"{highlightSearch(key)}"</span>
                                    <span className="text-slate-400">: </span>
                                    {renderValue(value[key], `${path}.${key}`, depth + 1)}
                                    {idx < keys.length - 1 && <span className="text-slate-400">,</span>}
                                </div>
                            ))}
                        </div>
                    )}
                    <span className="text-slate-400">{'}'}</span>
                </div>
            );
        }

        return <span className="text-slate-400">{String(value)}</span>;
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-shrink-0 p-2 border-b border-slate-700/50 bg-slate-900/50">
                <input
                    type="text"
                    placeholder="Search JSON..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
                <div className="text-slate-300">{renderValue(jsonData)}</div>
            </div>
        </div>
    );
};

export default JsonPreview;
