import { useState, useId } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className = '' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocusCapture={() => setVisible(true)}
      onBlurCapture={() => setVisible(false)}
    >
      <div aria-describedby={visible ? id : undefined}>
        {children}
      </div>
      {visible && (
        <div
          id={id}
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--co-bg-card-2)',
            border: '1px solid var(--co-line-strong)',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: 12,
            color: 'var(--co-text)',
            whiteSpace: 'nowrap',
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export default Tooltip;
