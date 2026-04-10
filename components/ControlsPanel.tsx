import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../hooks/useTranslation';
import { FILTER_PRESETS, mergePatterns } from '../lib/filterPresets';

interface ControlsPanelProps {
    ignorePatterns: string;
    setIgnorePatterns: (value: string) => void;
    maxFileSize: number;
    setMaxFileSize: (value: number) => void;
    outputFormat: 'markdown' | 'json' | 'xml';
    setOutputFormat: (value: 'markdown' | 'json' | 'xml') => void;
    includeTree: boolean;
    setIncludeTree: (value: boolean) => void;
    onSelectDirectory?: () => void;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({
    ignorePatterns, setIgnorePatterns,
    maxFileSize, setMaxFileSize,
    outputFormat, setOutputFormat,
    includeTree, setIncludeTree,
    onSelectDirectory
}) => {
    const { t } = useTranslation();
    const [newPattern, setNewPattern] = React.useState('');
    const [sizeUnit, setSizeUnit] = React.useState<'KB' | 'MB' | 'GB'>('KB');
    const [appliedPresets, setAppliedPresets] = React.useState<Set<string>>(new Set());

    const handleApplyPreset = (presetId: string, patterns: string[]) => {
        const currentPatterns = ignorePatterns ? ignorePatterns.split('\n').filter(p => p.trim()) : [];
        const merged = mergePatterns(currentPatterns, patterns);
        setIgnorePatterns(merged.join('\n'));

        setAppliedPresets(prev => new Set(prev).add(presetId));
        setTimeout(() => {
            setAppliedPresets(prev => {
                const next = new Set(prev);
                next.delete(presetId);
                return next;
            });
        }, 2000);
    };

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
        if (sizeUnit === 'MB') return Math.round((maxFileSize / 1024) * 100) / 100;
        if (sizeUnit === 'GB') return Math.round((maxFileSize / (1024 * 1024)) * 100) / 100;
        return maxFileSize;
    }, [maxFileSize, sizeUnit]);

    return (
        <div className="w-full">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-700/50 pb-4">
                <h3 className="text-lg font-semibold text-white">{t('controls.title')}</h3>
            </div>

            <div className="space-y-8">
                {/* Ignore Patterns Section */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">{t('controls.ignorePatterns')}</label>
                    <div className="flex gap-2 mb-2">
                        <input 
                            type="text" 
                            value={newPattern}
                            onChange={(e) => setNewPattern(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddPattern()}
                            placeholder={t('controls.ignorePatternPlaceholder')}
                            className="flex-1 bg-slate-800/50 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <button 
                            onClick={handleAddPattern}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                        >
                            {t('controls.ignorePatternAdd')}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 p-2.5 bg-slate-900/50 rounded border border-slate-700/50 max-h-48 overflow-y-auto">
                        <AnimatePresence mode="popLayout">
                        {ignorePatterns.split('\n').filter(p => p.trim()).map((pattern, idx) => (
                            <motion.div
                                key={pattern}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                whileHover={{ scale: 1.02 }}
                                className="group/tag flex items-center justify-between gap-1.5 px-2 py-1 rounded text-xs bg-slate-700 text-slate-300 border border-slate-600 overflow-hidden"
                            >
                                <span className="truncate flex-1 group-hover/tag:whitespace-normal group-hover/tag:break-all transition-all duration-200">{pattern}</span>
                                <button 
                                    onClick={() => handleRemovePattern(pattern)}
                                    className="text-slate-400 hover:text-red-400 focus:outline-none flex-shrink-0"
                                    title={t('controls.ignorePatternRemove')}
                                >
                                    {t('controls.ignorePatternRemove')}
                                </button>
                            </motion.div>
                        ))}
                        </AnimatePresence>
                        {(!ignorePatterns || !ignorePatterns.trim()) && (
                            <span className="text-slate-500 text-xs italic col-span-2 p-1">{t('controls.ignorePatternNone')}</span>
                        )}
                    </div>

                    {/* Filter Presets Section */}
                    <div className="mt-3">
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">{t('filterPresets.title')}</label>
                        <div className="flex flex-wrap gap-1.5">
                            {FILTER_PRESETS.map(preset => (
                                <motion.button
                                    key={preset.id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.92 }}
                                    onClick={() => handleApplyPreset(preset.id, preset.patterns)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700/60 text-slate-300 border border-slate-600 hover:bg-indigo-600/20 hover:border-indigo-500/50 hover:text-indigo-300 transition-colors"
                                >
                                    <AnimatePresence mode="wait">
                                    {appliedPresets.has(preset.id) ? (
                                        <motion.span
                                            key="applied"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="inline-flex items-center gap-1"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-emerald-400">{t('filterPresets.applied')}</span>
                                        </motion.span>
                                    ) : (
                                        <motion.span key="label" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
                                            {t(preset.translationKey)}
                                        </motion.span>
                                    )}
                                    </AnimatePresence>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Max File Size Section */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">{t('controls.maxFileSize')}</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="flex">
                            <input
                                type="number"
                                value={displaySize}
                                onChange={(e) => handleSizeChange(Number(e.target.value))}
                                className="block w-full rounded-l-lg bg-slate-800/50 border border-slate-600 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder={t('controls.maxFileSizePlaceholder')}
                            />
                            <select
                                value={sizeUnit}
                                onChange={(e) => {
                                    setSizeUnit(e.target.value as 'KB' | 'MB' | 'GB');
                                    // Value converts automatically via displaySize memo — internal KB stays the same
                                }}
                                className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-slate-600 bg-slate-700 text-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="KB">KB</option>
                                <option value="MB">MB</option>
                                <option value="GB">GB</option>
                            </select>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{t('controls.maxFileSizeHint')}</p>
                    </div>
                </div>

                {/* Output Format & Tree */}
                <div className="grid grid-cols-1 gap-6 pt-4 border-t border-slate-700/50">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">{t('controls.outputFormat')}</label>
                        <div className="flex rounded-lg shadow-sm bg-slate-800/50 p-1 border border-slate-600">
                            <button 
                                onClick={() => setOutputFormat('markdown')} 
                                className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${outputFormat === 'markdown' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                {t('controls.markdown')}
                            </button>
                            <button 
                                onClick={() => setOutputFormat('json')} 
                                className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${outputFormat === 'json' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                {t('controls.json')}
                            </button>
                            <button 
                                onClick={() => setOutputFormat('xml')} 
                                className={`relative flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${outputFormat === 'xml' ? 'bg-indigo-600 text-white shadow ring-2 ring-indigo-400 ring-offset-1 ring-offset-slate-800' : 'text-slate-400 hover:text-slate-200'}`}
                                title={t('controls.xmlRecommendedTooltip')}
                            >
                                {t('controls.xml')}
                                <span className="absolute -top-2 -right-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                    ★
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-lg border border-slate-700/50 bg-slate-800/30 ${outputFormat === 'json' ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-300">{t('controls.includeDirectoryTree')}</span>
                            <span className="text-xs text-slate-500">{t('controls.includeDirectoryTreeHint')}</span>
                        </div>
                        <button
                            onClick={() => { if (outputFormat !== 'json') setIncludeTree(!includeTree); }}
                            className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${includeTree ? 'bg-indigo-600' : 'bg-slate-700'}`}
                            role="switch"
                            aria-checked={includeTree}
                        >
                            <motion.div
                                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
                                animate={{ x: includeTree ? 16 : 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                            <AnimatePresence>
                                {includeTree && (
                                    <motion.svg
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0 }}
                                        className="absolute top-1 left-[22px] w-3 h-3 text-white"
                                        viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"
                                    >
                                        <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                                    </motion.svg>
                                )}
                            </AnimatePresence>
                        </button>
                    </div>
                </div>

                <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={onSelectDirectory}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        {t('controls.selectDirectory')}
                    </motion.button>
            </div>
        </div>
    );
};

export default ControlsPanel;