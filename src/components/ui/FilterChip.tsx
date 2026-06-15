interface FilterChipProps {
  label: string;
  active?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
}

const XIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export function FilterChip({ label, active = false, onRemove, onClick }: FilterChipProps) {
  const isInteractive = Boolean(onClick);
  return (
    <span
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isInteractive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 999,
        background: active ? 'var(--co-bdg-dev-bg)' : 'var(--co-bg-3)',
        border: `1px solid ${active ? 'var(--co-accent)' : 'var(--co-line-strong)'}`,
        fontSize: 12.5,
        color: active ? 'var(--co-indigo-lt)' : 'var(--co-text-dim)',
        fontWeight: active ? 500 : 400,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 150ms, border-color 150ms, color 150ms',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label={`Remove ${label} filter`}
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: 'inherit',
            opacity: 0.7,
          }}
        >
          <XIcon />
        </button>
      )}
    </span>
  );
}

export default FilterChip;
