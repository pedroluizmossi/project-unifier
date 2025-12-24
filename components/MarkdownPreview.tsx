import React, { useMemo } from 'https://esm.sh/react@19.1.0';
import DOMPurify from 'https://esm.sh/dompurify@3.2.6';
import { marked } from 'https://esm.sh/marked@15.0.12';

interface MarkdownPreviewProps {
    content: string;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
    const sanitizedHtml = useMemo(() => {
        const rawHtml = marked.parse(content, { breaks: true, gfm: true });
        return DOMPurify.sanitize(rawHtml);
    }, [content]);

    return (
        <div
            className="prose prose-slate dark:prose-invert max-w-none p-4"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
};

export default MarkdownPreview;
