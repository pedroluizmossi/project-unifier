import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

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
