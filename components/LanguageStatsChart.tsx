import React, { useState } from 'react';
import { LanguageStat } from '../lib/utils';
import { useTranslation } from '../hooks/useTranslation';

const LANG_COLORS: Record<string, string> = {
    typescript: '#3178c6', tsx: '#3178c6', javascript: '#f7df1e', jsx: '#f7df1e',
    python: '#3572A5', java: '#b07219', css: '#563d7c', scss: '#c6538c',
    html: '#e34c26', json: '#292929', yaml: '#cb171e', markdown: '#083fa1',
    shell: '#89e051', ruby: '#701516', go: '#00ADD8', rust: '#dea584',
    php: '#4F5D95', csharp: '#178600', cpp: '#f34b7d', c: '#555555',
    sql: '#e38c00', vue: '#41b883', xml: '#0060ac', toml: '#9c4221',
    batch: '#C1F12E', powershell: '#012456', dockerfile: '#384d54',
};

const getColor = (lang: string, index: number): string => {
    if (LANG_COLORS[lang]) return LANG_COLORS[lang];
    const fallback = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#22c55e', '#06b6d4'];
    return fallback[index % fallback.length];
};

interface Props {
    stats: LanguageStat[];
}

const LanguageStatsChart: React.FC<Props> = ({ stats }) => {
    const { t } = useTranslation();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const top = stats.slice(0, 8);
    const otherCount = stats.slice(8).reduce((sum, s) => sum + s.count, 0);
    const otherPct = stats.slice(8).reduce((sum, s) => sum + s.percentage, 0);
    const display = otherCount > 0
        ? [...top, { language: 'other', count: otherCount, percentage: Math.round(otherPct * 10) / 10, sizeKb: 0 }]
        : top;

    if (display.length === 0) return null;

    return (
        <div className="rounded-lg border border-slate-800/60 bg-slate-900/60 p-3">
            <h4 className="text-xs font-medium text-slate-300 mb-2">
                {t('output.stats.languages', '📊 Languages')}
            </h4>
            {/* Bar */}
            <div className="flex h-3 rounded-full overflow-hidden mb-2" role="img" aria-label={t('output.stats.languageDistribution', 'Language distribution')}>
                {display.map((s, i) => (
                    <div
                        key={s.language}
                        className="transition-opacity duration-150"
                        style={{
                            width: `${Math.max(s.percentage, 0.5)}%`,
                            backgroundColor: getColor(s.language, i),
                            opacity: hoveredIndex === null || hoveredIndex === i ? 1 : 0.4,
                        }}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        title={`${s.language}: ${s.percentage}% (${s.count} files)`}
                    />
                ))}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-x-3 gap-y-1">
                {display.map((s, i) => (
                    <div
                        key={s.language}
                        className="flex items-center gap-1.5 text-xs cursor-default transition-opacity duration-150"
                        style={{ opacity: hoveredIndex === null || hoveredIndex === i ? 1 : 0.4 }}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(s.language, i) }} />
                        <span className="text-slate-300">{s.language}</span>
                        <span className="text-slate-500">{s.percentage}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LanguageStatsChart;
