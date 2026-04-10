export interface FilterPreset {
    id: string;
    translationKey: string;
    patterns: string[];
}

export const FILTER_PRESETS: FilterPreset[] = [
    {
        id: 'nodejs',
        translationKey: 'filterPresets.nodejs.label',
        patterns: ['node_modules', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.npm', '.yarn'],
    },
    {
        id: 'staticAssets',
        translationKey: 'filterPresets.staticAssets.label',
        patterns: [
            '*.png', '*.jpg', '*.jpeg', '*.gif', '*.svg', '*.ico', '*.webp',
            '*.mp4', '*.webm', '*.mp3', '*.wav', '*.ogg',
            '*.ttf', '*.woff', '*.woff2', '*.eot',
        ],
    },
    {
        id: 'minified',
        translationKey: 'filterPresets.minified.label',
        patterns: ['*.min.js', '*.min.css', '*.min.map', '*.bundle.js', '*.chunk.js'],
    },
];

/**
 * Merges two pattern arrays into a union without duplicates.
 * Preserves the order of existing patterns, appending only new ones.
 */
export function mergePatterns(existing: string[], newPatterns: string[]): string[] {
    const seen = new Set(existing);
    const result = [...existing];
    for (const pattern of newPatterns) {
        if (!seen.has(pattern)) {
            seen.add(pattern);
            result.push(pattern);
        }
    }
    return result;
}
