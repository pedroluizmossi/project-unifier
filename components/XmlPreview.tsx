import React, { useState, useMemo } from 'react';
import { parseXml, type XmlNode } from '../lib/xmlParser.ts';

interface XmlPreviewProps {
    content: string;
}

/**
 * Escapes regex metacharacters so the string can be used safely in `new RegExp(...)`.
 * Escapes: . * + ? ^ $ { } ( ) | [ ] \
 */
export function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

/**
 * Highlights occurrences of `searchTerm` in `text`.
 * Uses escapeRegex to prevent crashes with special characters.
 * Falls back to `String.includes` if RegExp still fails.
 */
export function highlightSearch(text: string, searchTerm: string): React.ReactNode {
    if (!searchTerm) return text;
    try {
        const escaped = escapeRegex(searchTerm);
        const regex = new RegExp(`(${escaped})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            part.toLowerCase() === searchTerm.toLowerCase()
                ? <mark key={i} className="bg-yellow-500/30 text-yellow-200">{part}</mark>
                : part
        );
    } catch {
        // Fallback: use String.includes for case-insensitive literal match
        if (!text.toLowerCase().includes(searchTerm.toLowerCase())) {
            return text;
        }
        const parts: React.ReactNode[] = [];
        let remaining = text;
        let keyIdx = 0;
        const lowerSearch = searchTerm.toLowerCase();
        while (remaining.length > 0) {
            const idx = remaining.toLowerCase().indexOf(lowerSearch);
            if (idx === -1) {
                parts.push(remaining);
                break;
            }
            if (idx > 0) {
                parts.push(remaining.substring(0, idx));
            }
            parts.push(
                <mark key={keyIdx++} className="bg-yellow-500/30 text-yellow-200">
                    {remaining.substring(idx, idx + searchTerm.length)}
                </mark>
            );
            remaining = remaining.substring(idx + searchTerm.length);
        }
        return <>{parts}</>;
    }
}

interface TreeRendererProps {
    nodes: XmlNode[];
    expandedPaths: Set<string>;
    onToggle: (id: string) => void;
    searchTerm: string;
    depth?: number;
}

function hasElementChildren(node: XmlNode): boolean {
    return node.type === 'element' && !node.selfClosing && node.children.length > 0;
}

const TreeRenderer: React.FC<TreeRendererProps> = ({ nodes, expandedPaths, onToggle, searchTerm, depth = 0 }) => {
    return (
        <>
            {nodes.map((node) => {
                switch (node.type) {
                    case 'declaration':
                        return (
                            <div key={node.id} style={{ marginLeft: `${depth * 1.5}rem` }} className="py-0.5 font-mono text-sm">
                                <span className="mr-1 w-4 inline-block" />
                                <span className="text-slate-500">{highlightSearch(node.content, searchTerm)}</span>
                            </div>
                        );

                    case 'text':
                        return (
                            <div key={node.id} style={{ marginLeft: `${depth * 1.5}rem` }} className="py-0.5 font-mono text-sm text-slate-300 whitespace-pre-wrap break-words">
                                <span className="mr-1 w-4 inline-block" />
                                {highlightSearch(node.content, searchTerm)}
                            </div>
                        );

                    case 'cdata':
                        return (
                            <div key={node.id} style={{ marginLeft: `${depth * 1.5}rem` }} className="py-0.5 font-mono text-sm">
                                <span className="mr-1 w-4 inline-block" />
                                <span className="text-slate-500">&lt;![CDATA[</span>
                                <div className="ml-4 border-l border-slate-700 pl-2 py-1">
                                    <span className="text-green-400 text-xs whitespace-pre-wrap break-words">
                                        {highlightSearch(node.content, searchTerm)}
                                    </span>
                                </div>
                                <span className="text-slate-500">]]&gt;</span>
                            </div>
                        );

                    case 'error':
                        return (
                            <div key={node.id} style={{ marginLeft: `${depth * 1.5}rem` }} className="py-0.5 font-mono text-sm">
                                <span className="mr-1 w-4 inline-block" />
                                <span className="text-red-400" title={node.errorMessage}>
                                    ⚠ {highlightSearch(node.content, searchTerm)}
                                </span>
                                <span className="text-red-500 text-xs ml-2">({node.errorMessage})</span>
                            </div>
                        );

                    case 'element': {
                        const canToggle = hasElementChildren(node);
                        const isExpanded = expandedPaths.has(node.id);

                        if (node.selfClosing) {
                            return (
                                <div key={node.id} style={{ marginLeft: `${depth * 1.5}rem` }} className="py-0.5 font-mono text-sm">
                                    <span className="mr-1 w-4 inline-block" />
                                    <span className="text-slate-400">&lt;</span>
                                    <span className="text-blue-400">{highlightSearch(node.tagName, searchTerm)}</span>
                                    {node.attributes && <span className="text-slate-300"> {highlightSearch(node.attributes, searchTerm)}</span>}
                                    <span className="text-slate-400"> /&gt;</span>
                                </div>
                            );
                        }

                        if (canToggle) {
                            return (
                                <div key={node.id}>
                                    <div style={{ marginLeft: `${depth * 1.5}rem` }} className="py-0.5 font-mono text-sm">
                                        <button
                                            onClick={() => onToggle(node.id)}
                                            className="text-slate-400 hover:text-slate-300 focus:outline-none mr-1 w-4 inline-block text-center"
                                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                        >
                                            {isExpanded ? '▼' : '▶'}
                                        </button>
                                        <span className="text-slate-400">&lt;</span>
                                        <span className="text-blue-400">{highlightSearch(node.tagName, searchTerm)}</span>
                                        {node.attributes && <span className="text-slate-300"> {highlightSearch(node.attributes, searchTerm)}</span>}
                                        <span className="text-slate-400">&gt;</span>
                                        {!isExpanded && (
                                            <span className="text-slate-500">...</span>
                                        )}
                                        {!isExpanded && (
                                            <>
                                                <span className="text-slate-400">&lt;/</span>
                                                <span className="text-blue-400">{highlightSearch(node.tagName, searchTerm)}</span>
                                                <span className="text-slate-400">&gt;</span>
                                            </>
                                        )}
                                    </div>
                                    {isExpanded && (
                                        <TreeRenderer
                                            nodes={node.children}
                                            expandedPaths={expandedPaths}
                                            onToggle={onToggle}
                                            searchTerm={searchTerm}
                                            depth={depth + 1}
                                        />
                                    )}
                                    {isExpanded && (
                                        <div style={{ marginLeft: `${depth * 1.5}rem` }} className="py-0.5 font-mono text-sm">
                                            <span className="mr-1 w-4 inline-block" />
                                            <span className="text-slate-400">&lt;/</span>
                                            <span className="text-blue-400">{highlightSearch(node.tagName, searchTerm)}</span>
                                            <span className="text-slate-400">&gt;</span>
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <div key={node.id} style={{ marginLeft: `${depth * 1.5}rem` }} className="py-0.5 font-mono text-sm">
                                <span className="mr-1 w-4 inline-block" />
                                <span className="text-slate-400">&lt;</span>
                                <span className="text-blue-400">{highlightSearch(node.tagName, searchTerm)}</span>
                                {node.attributes && <span className="text-slate-300"> {highlightSearch(node.attributes, searchTerm)}</span>}
                                <span className="text-slate-400">&gt;</span>
                                <span className="text-slate-400">&lt;/</span>
                                <span className="text-blue-400">{highlightSearch(node.tagName, searchTerm)}</span>
                                <span className="text-slate-400">&gt;</span>
                            </div>
                        );
                    }

                    default:
                        return null;
                }
            })}
        </>
    );
};

/**
 * Collect IDs of all expandable element nodes up to `maxDepth` levels deep.
 * Used to auto-expand the first N levels on initial render.
 */
function collectExpandableIds(nodes: XmlNode[], maxDepth: number, currentDepth = 0): string[] {
    if (currentDepth >= maxDepth) return [];
    const ids: string[] = [];
    for (const node of nodes) {
        if (hasElementChildren(node)) {
            ids.push(node.id);
            if (node.type === 'element') {
                ids.push(...collectExpandableIds(node.children, maxDepth, currentDepth + 1));
            }
        }
    }
    return ids;
}

const DEFAULT_EXPAND_DEPTH = 3;

const XmlPreview: React.FC<XmlPreviewProps> = ({ content }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const nodes = useMemo(() => parseXml(content), [content]);

    const defaultExpanded = useMemo(
        () => new Set(collectExpandableIds(nodes, DEFAULT_EXPAND_DEPTH)),
        [nodes]
    );

    const [expandedPaths, setExpandedPaths] = useState<Set<string> | null>(null);

    // Use defaultExpanded until user interacts
    const activeExpanded = expandedPaths ?? defaultExpanded;

    const togglePath = (id: string) => {
        const base = activeExpanded;
        const newSet = new Set(base);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedPaths(newSet);
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-shrink-0 p-2 border-b border-slate-700/50 bg-slate-900/50">
                <input
                    type="text"
                    placeholder="Search XML..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950/60">
                <div className="text-slate-300">
                    <TreeRenderer
                        nodes={nodes}
                        expandedPaths={activeExpanded}
                        onToggle={togglePath}
                        searchTerm={searchTerm}
                    />
                </div>
            </div>
        </div>
    );
};

export default XmlPreview;
