import type { ReactNode } from 'react';

interface PageHeadProps {
  crumb?: string;
  title: string;
  description?: string | ReactNode;
  actions?: ReactNode;
}

export function PageHead({ crumb, title, description, actions }: PageHeadProps) {
  return (
    <div
      style={{
        padding: '24px 28px 18px 28px',
        borderBottom: '1px solid var(--co-line)',
        flexShrink: 0,
      }}
    >
      {crumb && (
        <p
          style={{
            fontSize: 12,
            color: 'var(--co-text-muted)',
            marginBottom: 6,
            lineHeight: 1.4,
          }}
        >
          {crumb}
        </p>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 6px 0',
              color: 'var(--co-text)',
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>
          {description && (
            <div
              style={{
                fontSize: 13.5,
                color: 'var(--co-text-dim)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {description}
            </div>
          )}
        </div>
        {actions && (
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageHead;
