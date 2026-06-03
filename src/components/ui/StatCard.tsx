interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
}

export function StatCard({ label, value, delta, deltaPositive }: StatCardProps) {
  return (
    <div
      style={{
        background: 'var(--co-bg-card)',
        border: '1px solid var(--co-line)',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: 'var(--co-text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--co-text)',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      {delta !== undefined && (
        <div
          style={{
            fontSize: 11,
            color: deltaPositive ? 'var(--co-green)' : 'var(--co-red)',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <span aria-hidden="true">{deltaPositive ? '▲' : '▼'}</span>
          {delta}
        </div>
      )}
    </div>
  );
}

export default StatCard;
