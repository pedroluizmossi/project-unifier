import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

// Configure marked with syntax highlighting
marked.use(
    markedHighlight({
        langPrefix: 'hljs language-',
        highlight(code: string, lang: string): string {
            if (!lang) {
                return code;
            }
            try {
                if (hljs.getLanguage(lang)) {
                    return hljs.highlight(code, { language: lang }).value;
                }
            } catch {
                // Graceful fallback: return plain code on error
            }
            return code;
        },
    })
);

interface MarkdownPreviewProps {
    content: string;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
    const sanitizedHtml = useMemo(() => {
        const rawHtml = marked.parse(content, { breaks: true, gfm: true });
        return DOMPurify.sanitize(rawHtml as string);
    }, [content]);

    return (
        <div
            className="prose prose-slate dark:prose-invert max-w-full markdown-preview p-4 overflow-y-auto h-full"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
};

export default MarkdownPreview;
