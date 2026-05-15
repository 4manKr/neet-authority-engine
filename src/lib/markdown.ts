import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Parses markdown content and returns sanitized HTML
 */
export function parseMarkdown(markdown: string): string {
  const rawHtml = marked.parse(markdown, { async: false }) as string;
  const sanitized = DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'target'],
  });
  // Wrap bare tables in a scrollable container for mobile
  return sanitized.replace(/<table/g, '<div class="table-wrapper"><table').replace(/<\/table>/g, '</table></div>');
}

/**
 * Extracts headings from markdown to build a Table of Contents
 */
export function extractTOC(markdown: string): TOCItem[] {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const toc: TOCItem[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    toc.push({ id, text, level });
  }

  return toc;
}

/**
 * Adds id attributes to headings in HTML for anchor linking.
 * Also promotes a leading plain <p> that looks like a title (no sentence-ending
 * punctuation, under 200 chars) to an <h1> so the AI-generated title is styled.
 */
export function addHeadingIds(html: string): string {
  let result = html;

  // If the content starts with a plain <p> that looks like a heading title
  // (short text, no trailing period/question/exclamation mark), promote to <h1>
  result = result.replace(
    /^(\s*)<p>([^<]{10,180})<\/p>/,
    (match, ws, text) => {
      const trimmed = text.trim();
      // Only promote if it doesn't end with sentence punctuation
      if (!/[.!?]$/.test(trimmed)) {
        const id = trimmed.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
        return `${ws}<h1 id="${id}">${trimmed}</h1>`;
      }
      return match;
    }
  );

  return result.replace(
    /<h([1-4])>(.*?)<\/h[1-4]>/gi,
    (_, level: string, text: string) => {
      const id = text
        .replace(/<[^>]*>/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      return `<h${level} id="${id}">${text}</h${level}>`;
    }
  );
}

/**
 * Calculates estimated reading time
 */
export function calculateReadTime(content: string): number {
  const wordCount = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * Generates a URL-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}
