import React, { useMemo, useState } from 'react';
import { ProcessorStatus } from '../lib/utils.ts';

interface DirectoryStructurePanelProps {
    stats: ProcessorStatus | null;
    directoryName: string | null;
    onFileClick?: (filePath: string) => void;
    onAddToIgnore?: (pattern: string) => void;
}

type FlatFile = {
    name: string;
    size: number;
};

type TreeNode = {
    id: string;
    name: string;
    path: string;
    type: 'directory' | 'file';
    size?: number;
    children?: TreeNode[];
};

const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const estimateTokens = (size: number) => {
    return Math.ceil(size / 4);
};

const buildTreeFromFiles = (files: FlatFile[], rootLabel: string): TreeNode => {
    const root: TreeNode = {
        id: 'd:__root__',
        name: rootLabel || 'project',
        path: '',
        type: 'directory',
        children: [],
    };
    const directoryMap = new Map<string, TreeNode>();
    directoryMap.set('', root);

    files.forEach((file) => {
        const parts = file.name.split('/').filter(Boolean);
        let currentPath = '';
        let parent = root;

        parts.forEach((part, index) => {
            const isFile = index === parts.length - 1;
            currentPath = currentPath ? `${currentPath}/${part}` : part;

            if (isFile) {
                parent.children?.push({
                    id: `f:${currentPath}`,
                    name: part,
                    path: currentPath,
                    type: 'file',
                    size: file.size,
                });
                return;
            }

            let directoryNode = directoryMap.get(currentPath);
            if (!directoryNode) {
                directoryNode = {
                    id: `d:${currentPath}`,
                    name: part,
                    path: currentPath,
                    type: 'directory',
                    children: [],
                };
                directoryMap.set(currentPath, directoryNode);
                parent.children?.push(directoryNode);
            }
            parent = directoryNode;
        });
    });

    const sortTree = (node: TreeNode) => {
        if (!node.children) return;
        node.children.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortTree);
    };

    sortTree(root);
    return root;
};

const filterTree = (node: TreeNode, search: string): TreeNode | null => {
    if (!search) return node;
    const lowerSearch = search.toLowerCase();
    const matches = node.name.toLowerCase().includes(lowerSearch)
        || node.path.toLowerCase().includes(lowerSearch);

    if (node.type === 'file') {
        return matches ? node : null;
    }

    const children = node.children
        ?.map((child) => filterTree(child, search))
        .filter((child): child is TreeNode => Boolean(child));

    if (matches || (children && children.length > 0)) {
        return {
            ...node,
            children: children || [],
        };
    }

    return null;
};

const collectDirectoryIds = (node: TreeNode, ids: Set<string>) => {
    if (node.type === 'directory') {
        ids.add(node.id);
        node.children?.forEach((child) => collectDirectoryIds(child, ids));
    }
};

const getFileBadgeStyles = (fileName: string) => {
    const extension = fileName.includes('.') ? fileName.split('.').pop() || '' : '';
    const normalized = extension.toLowerCase();
    const label = normalized ? normalized.slice(0, 4).toUpperCase() : 'FILE';

    const presets: Record<string, { label: string; className: string }> = {
        md: { label: 'MD', className: 'bg-amber-500/20 text-amber-300 border border-amber-400/30' },
        txt: { label: 'TXT', className: 'bg-amber-500/20 text-amber-300 border border-amber-400/30' },
        pdf: { label: 'PDF', className: 'bg-rose-500/20 text-rose-300 border border-rose-400/30' },
        js: { label: 'JS', className: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' },
        jsx: { label: 'JSX', className: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' },
        ts: { label: 'TS', className: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' },
        tsx: { label: 'TSX', className: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' },
        py: { label: 'PY', className: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' },
        go: { label: 'GO', className: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' },
        rs: { label: 'RS', className: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' },
        json: { label: 'JSON', className: 'bg-sky-500/20 text-sky-300 border border-sky-400/30' },
        csv: { label: 'CSV', className: 'bg-sky-500/20 text-sky-300 border border-sky-400/30' },
        yml: { label: 'YML', className: 'bg-sky-500/20 text-sky-300 border border-sky-400/30' },
        yaml: { label: 'YAML', className: 'bg-sky-500/20 text-sky-300 border border-sky-400/30' },
        html: { label: 'HTML', className: 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30' },
        css: { label: 'CSS', className: 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30' },
        scss: { label: 'SCSS', className: 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30' },
        png: { label: 'IMG', className: 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/30' },
        jpg: { label: 'IMG', className: 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/30' },
        jpeg: { label: 'IMG', className: 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/30' },
        gif: { label: 'IMG', className: 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/30' },
        svg: { label: 'SVG', className: 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/30' },
        toml: { label: 'TOML', className: 'bg-slate-500/20 text-slate-300 border border-slate-400/30' },
        env: { label: 'ENV', className: 'bg-slate-500/20 text-slate-300 border border-slate-400/30' },
    };

    return presets[normalized] || {
        label,
        className: 'bg-slate-700/60 text-slate-200 border border-slate-600/60',
    };
};

const DirectoryStructurePanel: React.FC<DirectoryStructurePanelProps> = ({
    stats,
    directoryName,
    onFileClick,
    onAddToIgnore,
}) => {
    const [treeSearch, setTreeSearch] = useState('');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [ignoredFilesInSession, setIgnoredFilesInSession] = useState<Set<string>>(new Set());

    const hasFiles = Boolean(stats?.files && stats.files.length > 0);
    const totalSize = useMemo(() => {
        if (!stats?.files) return 0;
        return stats.files.reduce((sum, file) => sum + (file.size || 0), 0);
    }, [stats]);

    const treeData = useMemo(() => {
        if (!stats?.files) return null;
        return buildTreeFromFiles(stats.files, directoryName || 'project');
    }, [stats, directoryName]);

    const filteredTree = useMemo(() => {
        if (!treeData) return null;
        const trimmed = treeSearch.trim();
        return trimmed ? filterTree(treeData, trimmed) : treeData;
    }, [treeData, treeSearch]);

    const autoExpanded = useMemo(() => {
        if (!filteredTree || !treeSearch.trim()) return new Set<string>();
        const ids = new Set<string>();
        collectDirectoryIds(filteredTree, ids);
        return ids;
    }, [filteredTree, treeSearch]);

    React.useEffect(() => {
        if (!treeData) return;
        const nextExpanded = new Set<string>([treeData.id]);
        treeData.children?.forEach((child) => {
            if (child.type === 'directory') nextExpanded.add(child.id);
        });
        setExpandedNodes(nextExpanded);
        setTreeSearch('');
    }, [treeData]);

    const searchValue = treeSearch.trim();
    const searchLower = searchValue.toLowerCase();

    const renderTreeNode = (node: TreeNode, depth: number) => {
        const isDirectory = node.type === 'directory';
        const isExpanded = searchValue ? autoExpanded.has(node.id) : expandedNodes.has(node.id);
        const hasChildren = Boolean(node.children && node.children.length > 0);
        const isMatch = Boolean(searchValue)
            && (node.name.toLowerCase().includes(searchLower) || node.path.toLowerCase().includes(searchLower));
        const badge = !isDirectory ? getFileBadgeStyles(node.name) : null;
        const rowTone = isMatch
            ? 'bg-slate-800/70 text-slate-100'
            : depth === 0
                ? 'bg-slate-900/60 text-slate-100'
                : 'text-slate-200 hover:bg-slate-800/40';

        // Indentação: sem indentação para diretórios, pequena para arquivos
        const indentPx = isDirectory ? 8 : 8 + (depth * 3);

        return (
            <div key={node.id} className="select-none">
                <button
                    type="button"
                    onClick={() => (isDirectory ? setExpandedNodes((prev) => {
                        const next = new Set(prev);
                        if (next.has(node.id)) {
                            next.delete(node.id);
                        } else {
                            next.add(node.id);
                        }
                        return next;
                    }) : onFileClick?.(node.path))}
                    className={`group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-base transition-colors overflow-hidden ${rowTone}`}
                    style={{ paddingLeft: `${indentPx}px` }}
                    title={node.path || node.name}
                >
                    <span className={`flex h-4 w-4 items-center justify-center transition-transform flex-shrink-0 ${isDirectory && isExpanded ? 'rotate-90' : ''}`}>
                        {isDirectory ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-600"></span>
                        )}
                    </span>
                    {isDirectory ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 flex-shrink-0 ${isExpanded ? 'text-sky-300' : 'text-sky-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h4l2 2H18.5A2.5 2.5 0 0 1 21 9.5v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z" />
                        </svg>
                    ) : (
                        <span className={`inline-flex min-w-[2.2rem] items-center justify-center rounded-md px-1 text-[10px] font-semibold flex-shrink-0 ${badge?.className}`}>
                            {badge?.label}
                        </span>
                    )}
                    <span className="flex-1 break-words truncate">{node.name}</span>
                    {node.type === 'file' && (
                        <span className="text-xs font-mono flex-shrink-0 ml-2 flex items-center gap-1.5 whitespace-nowrap">
                            <span className="text-slate-500">{formatBytes(node.size || 0)}</span>
                            <span className="text-slate-600">·</span>
                            <span className={`${
                                estimateTokens(node.size || 0) > 25000 ? 'text-red-400 font-semibold' :
                                estimateTokens(node.size || 0) > 15000 ? 'text-yellow-400 font-semibold' :
                                estimateTokens(node.size || 0) > 5000 ? 'text-blue-400' :
                                'text-green-400'
                            }`}>
                                {estimateTokens(node.size || 0).toLocaleString()}t
                            </span>
                        </span>
                    )}
                    {node.type === 'directory' && hasChildren && (
                        <span className="text-sm text-slate-400 font-mono flex-shrink-0 ml-2">{node.children?.length}</span>
                    )}
                </button>
                {isDirectory && isExpanded && hasChildren && (
                    <div className="border-l border-slate-800/60">
                        {node.children?.map((child) => renderTreeNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (!hasFiles) return null;

    return (
    <aside className="w-80 flex-shrink-0 flex flex-col border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm transition-all duration-300">
        <div className="flex flex-col h-full w-full overflow-hidden relative">
            <div className="p-4 border-b border-slate-800 flex-shrink-0">
                 <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Estrutura</h2>
                 <div className="relative mt-2">
                        <input
                            type="text"
                            value={treeSearch}
                            onChange={(e) => setTreeSearch(e.target.value)}
                            placeholder="Pesquisar..."
                            className="w-full pl-8 pr-8 py-2 text-xs bg-slate-900/70 border border-slate-800/80 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-transparent"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {treeSearch && (
                            <button
                                onClick={() => setTreeSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 min-h-0">
                 {filteredTree ? (
                        renderTreeNode(filteredTree, 0)
                    ) : (
                        <div className="px-2 py-8 text-center text-xs text-slate-500">
                            Nenhum resultado
                        </div>
                    )}
            </div>

            {/* Stats do rodapé da árvore */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/30 text-xs flex-shrink-0">
                <div className="font-semibold">Arquivos: <span className="text-cyan-300 text-lg">{stats?.files?.length ?? 0}</span></div>
                <div className="font-semibold">Tamanho: <span className="text-cyan-300 text-lg">{formatBytes(totalSize)}</span></div>
            </div>
        </div>
    </aside>
);
};

export default DirectoryStructurePanel;
