interface DaySeparatorProps {
  label: string;
}

const DaySeparator = ({ label }: DaySeparatorProps) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '18px 0 14px 0',
    fontSize: 11,
    color: 'var(--color-main-text-dim)',
    fontWeight: 500,
    letterSpacing: '0.02em',
  }}>
    <div style={{ flex: 1, height: 1, background: 'var(--color-main-border)' }} />
    <span style={{
      padding: '3px 10px',
      borderRadius: 999,
      background: 'var(--color-main-bg-2)',
      border: '1px solid var(--color-main-border)',
    }}>
      {label}
    </span>
    <div style={{ flex: 1, height: 1, background: 'var(--color-main-border)' }} />
  </div>
);

export default DaySeparator;
