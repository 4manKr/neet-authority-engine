'use client';

import { useEffect, useState } from 'react';

export function MarkdownRenderer({ content }: { content: string }) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    async function render() {
      try {
        const { marked } = await import('marked');
        const { default: DOMPurify } = await import('isomorphic-dompurify');
        const raw = await marked.parse(content);
        setHtml(DOMPurify.sanitize(raw));
      } catch {
        // fallback: show raw content
        setHtml(`<pre style="white-space:pre-wrap;font-family:inherit">${content.replace(/</g, '&lt;')}</pre>`);
      }
    }
    render();
  }, [content]);

  if (!html) return <p className="text-gray-400 text-sm">Rendering preview...</p>;

  return <div className="article-prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
