import type { Bid } from '../../lib/api/coverones';

interface PipelineCardProps {
  bid: Bid;
  onClick?: () => void;
}

export function PipelineCard({ bid, onClick }: PipelineCardProps) {
  return (
    <div
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`Bid on listing ${bid.listingId.slice(0, 8)}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
      style={{
        background: 'var(--co-bg-3)',
        border: '1px solid var(--co-line)',
        borderRadius: 9,
        padding: 10,
        marginBottom: 8,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 150ms',
      }}
      onMouseEnter={(e) => { if (onClick) (e.currentTarget as HTMLElement).style.borderColor = 'var(--co-line-strong)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--co-line)'; }}
    >
      {/* Company / listing ref */}
      <div style={{ fontSize: 11.5, color: 'var(--co-text-muted)', marginBottom: 3 }}>
        {bid.listingId.slice(0, 8)}...
      </div>

      {/* Amount as title */}
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          color: 'var(--co-text)',
          lineHeight: 1.4,
          marginBottom: 6,
        }}
      >
        {bid.currency} {bid.amount}
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--co-green)', fontWeight: 500 }}>
          {bid.currency} {bid.amount}
        </span>
      </div>

      {/* Mini progress bar */}
      <div className="co-bar" aria-hidden="true">
        <span
          style={{
            width: bid.status === 'ACCEPTED' ? '100%'
              : bid.status === 'PENDING' ? '40%'
              : '20%',
          }}
        />
      </div>
    </div>
  );
}

export default PipelineCard;
