import DOMPurify from 'dompurify';

interface TermsPanelProps {
  terms: string;
}

export function TermsPanel({ terms }: TermsPanelProps) {
  // Sanitize before rendering — terms may contain user-created content
  const safeTerms = DOMPurify.sanitize(terms, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

  return (
    <div
      style={{
        background: 'var(--co-bg)',
        border: '1px solid var(--co-line)',
        borderRadius: 10,
        padding: '16px 20px',
        maxHeight: 256,
        overflowY: 'auto',
      }}
      className="sb-scroll"
    >
      <pre
        style={{
          fontSize: 13,
          lineHeight: 1.65,
          color: 'var(--co-text)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'var(--font-mono)',
          margin: 0,
        }}
      >
        {safeTerms}
      </pre>
    </div>
  );
}

export default TermsPanel;
