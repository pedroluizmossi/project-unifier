import React, { useState } from 'react';

interface XmlPreviewProps {
    content: string;
}

const XmlPreview: React.FC<XmlPreviewProps> = ({ content }) => {
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

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

    const parseXml = (xml: string): React.ReactNode[] => {
        const lines = xml.split('\n');
        const result: React.ReactNode[] = [];
        let pathStack: string[] = [];
        let elementCounter = 0;
        let inCdata = false;
        let cdataContent: string[] = [];
        let cdataDepth = 0;

        lines.forEach((line, idx) => {
            const trimmed = line.trim();
            
            // Handle CDATA sections
            if (inCdata) {
                if (trimmed.endsWith(']]>')) {
                    cdataContent.push(trimmed.slice(0, -3));
                    result.push(
                        <div key={idx} style={{ marginLeft: `${cdataDepth * 1.5}rem` }} className="py-0.5 font-mono text-sm">
                            <span className="text-slate-500">&lt;![CDATA[</span>
                            <div className="ml-4 border-l border-slate-700 pl-2 py-1">
                                <span className="text-green-400 text-xs whitespace-pre-wrap break-words">
                                    {highlightSearch(cdataContent.join('\n'))}
                                </span>
                            </div>
                            <span className="text-slate-500">]]&gt;</span>
                        </div>
                    );
                    inCdata = false;
                    cdataContent = [];
                } else {
                    cdataContent.push(trimmed);
                }
                return;
            }

            if (!trimmed) return;

            const depth = (line.match(/^ */)?.[0].length || 0) / 2;
            const currentPath = pathStack.slice(0, depth).join('/');

            // XML declaration
            if (trimmed.startsWith('<?xml')) {
                result.push(
                    <div key={idx} className="py-0.5">
                        <span className="text-slate-500">{trimmed}</span>
                    </div>
                );
                return;
            }

            // Opening tag
            const openTagMatch = trimmed.match(/^<([^\s/>]+)([^>]*)>/);
            if (openTagMatch) {
                const tagName = openTagMatch[1];
                const attributes = openTagMatch[2];
                const isClosing = trimmed.includes('/>');
                const elementId = `${currentPath}/${tagName}-${elementCounter++}`;
                const isExpanded = expandedPaths.has(elementId);

                const hasContent = !isClosing && !trimmed.endsWith('/>');

                result.push(
                    <div key={idx} style={{ marginLeft: `${depth * 1.5}rem` }} className="py-0.5 font-mono text-sm">
                        {hasContent && (
                            <button
                                onClick={() => togglePath(elementId)}
                                className="text-slate-400 hover:text-slate-300 focus:outline-none mr-1 w-4 inline-block text-center"
                            >
                                {isExpanded ? '▼' : '▶'}
                            </button>
                        )}
                        {!hasContent && <span className="mr-1 w-4 inline-block" />}
                        <span className="text-slate-400">&lt;</span>
                        <span className="text-blue-400">{highlightSearch(tagName)}</span>
                        {attributes && <span className="text-slate-300">{highlightSearch(attributes)}</span>}
                        <span className="text-slate-400">{isClosing ? ' />' : '>'}</span>
                    </div>
                );

                if (hasContent) {
                    pathStack[depth] = tagName;
                }
                return;
            }

            // Closing tag
            const closeTagMatch = trimmed.match(/^<\/([^>]+)>/);
            if (closeTagMatch) {
                const tagName = closeTagMatch[1];
                result.push(
                    <div key={idx} style={{ marginLeft: `${depth * 1.5}rem` }} className="py-0.5 font-mono text-sm">
                        <span className="text-slate-400">&lt;/</span>
                        <span className="text-blue-400">{highlightSearch(tagName)}</span>
                        <span className="text-slate-400">&gt;</span>
                    </div>
                );
                pathStack[depth] = '';
                return;
            }

            // CDATA start
            if (trimmed.startsWith('<![CDATA[')) {
                inCdata = true;
                cdataDepth = depth;
                const cdataEnd = trimmed.indexOf(']]>');
                if (cdataEnd !== -1) {
                    // CDATA on single line
                    const content = trimmed.substring(9, cdataEnd);
                    result.push(
                        <div key={idx} style={{ marginLeft: `${depth * 1.5}rem` }} className="py-0.5 font-mono text-sm">
                            <span className="text-slate-500">&lt;![CDATA[</span>
                            <span className="text-green-400 text-xs">{highlightSearch(content)}</span>
                            <span className="text-slate-500">]]&gt;</span>
                        </div>
                    );
                    inCdata = false;
                } else {
                    // CDATA starts, continues on next lines
                    cdataContent = [trimmed.substring(9)];
                }
                return;
            }

            // Regular text
            if (trimmed && !trimmed.startsWith('<')) {
                result.push(
                    <div key={idx} style={{ marginLeft: `${depth * 1.5}rem` }} className="py-0.5 font-mono text-sm text-slate-300 whitespace-pre-wrap break-words">
                        {highlightSearch(trimmed)}
                    </div>
                );
            }
        });

        return result;
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
                <div className="text-slate-300">{parseXml(content)}</div>
            </div>
        </div>
    );
};

export default XmlPreview;
