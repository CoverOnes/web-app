import type { ReactNode } from 'react';
import Button from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ icon, title, description, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-4">
      {icon && (
        <div style={{ color: 'var(--co-text-dim)', opacity: 0.6 }}>
          {icon}
        </div>
      )}
      <p className="text-base font-semibold" style={{ color: 'var(--co-text)' }}>
        {title}
      </p>
      {description && (
        <p className="text-sm max-w-sm" style={{ color: 'var(--co-text-dim)' }}>
          {description}
        </p>
      )}
      {ctaLabel && onCta && (
        <Button variant="primary" size="md" onClick={onCta}>
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
