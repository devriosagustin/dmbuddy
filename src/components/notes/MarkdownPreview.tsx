// ============================================================
// Vista previa de Markdown con listas, títulos y enlaces
// ============================================================

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  content: string;
}

/**
 * Renderiza el contenido markdown de una nota.
 */
export const MarkdownPreview = ({ content }: MarkdownPreviewProps) => {
  return (
    <div className="prose-nota space-y-2 font-body text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="font-fantasy text-xl font-bold text-dnd-gold">{children}</h1>,
          h2: ({ children }) => <h2 className="font-fantasy text-lg font-bold text-dnd-gold">{children}</h2>,
          h3: ({ children }) => <h3 className="font-fantasy text-base font-bold text-dnd-text">{children}</h3>,
          p: ({ children }) => <p className="text-dnd-text/90">{children}</p>,
          a: ({ children, href }) => (
            <a href={href} className="text-sky-400 underline hover:text-sky-300" target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-dnd-gold/50 bg-dnd-gold/5 px-3 py-1 italic">{children}</blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-dnd-ink/70 px-1 py-0.5 font-body text-xs text-emerald-300">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-lg bg-dnd-ink/80 p-3 font-body text-xs">{children}</pre>
          ),
          strong: ({ children }) => <strong className="font-bold text-dnd-text">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};