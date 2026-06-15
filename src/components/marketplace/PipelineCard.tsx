import type React from 'react';
import type { Bid, BidStatus } from '../../lib/api/coverones';

interface PipelineCardProps {
  bid: Bid;
  isSelected?: boolean;
  onClick?: () => void;
}

// Record<BidStatus,...> — TS enforces exhaustiveness; no fallback needed.
const STATUS_ACCENT: Record<BidStatus, { dot: string; border: string; bg: string; label: string; labelColor: string }> = {
  PENDING:   { dot: '#A78BFA', border: 'rgba(99,102,241,0.4)',   bg: 'linear-gradient(180deg,rgba(99,102,241,0.08),var(--co-bg-3))',  label: '評估中',  labelColor: 'var(--co-amber)' },
  ACCEPTED:  { dot: '#10B981', border: 'rgba(16,185,129,0.4)',   bg: 'linear-gradient(180deg,rgba(16,185,129,0.08),var(--co-bg-3))',  label: '✓ 中標',  labelColor: 'var(--co-green)' },
  REJECTED:  { dot: '#EF4444', border: 'rgba(239,68,68,0.25)',   bg: 'var(--co-bg-3)',                                                label: '未中標', labelColor: 'var(--co-red)' },
  WITHDRAWN: { dot: '#64748B', border: 'rgba(100,116,139,0.25)', bg: 'var(--co-bg-3)',                                                label: '已撤回', labelColor: 'var(--co-text-dim)' },
};

// Record<BidStatus,...> — exhaustive; no fallback.
const PROGRESS: Record<BidStatus, { width: string; bg: string }> = {
  PENDING:   { width: '60%',  bg: 'linear-gradient(90deg,#A78BFA,#22D3EE)' },
  ACCEPTED:  { width: '100%', bg: 'var(--co-green)' },
  REJECTED:  { width: '100%', bg: 'var(--co-red)' },
  WITHDRAWN: { width: '100%', bg: 'var(--co-text-muted)' },
};

export function PipelineCard({ bid, isSelected = false, onClick }: PipelineCardProps) {
  const accent = STATUS_ACCENT[bid.status];
  const prog   = PROGRESS[bid.status];
  const isClosedStatus = bid.status === 'REJECTED' || bid.status === 'WITHDRAWN';

  return (
    // Focus ring: static CSS rule in src/index.css (.pipeline-card:focus-visible).
    // --card-accent set below gives each card its own status color without the
    // last-writer-wins bug caused by per-render <style> injection.
    <div
        className="pipeline-card"
        onClick={onClick}
        tabIndex={0}
        role="button"
        aria-label={`投標 ${bid.listingId.slice(0, 8)} — ${accent.label}`}
        aria-pressed={isSelected}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
        style={{
          '--card-accent': accent.dot,
          background: isSelected ? accent.bg : 'var(--co-bg-3)',
          border: `1px solid ${isSelected ? accent.border : 'var(--co-line)'}`,
          borderRadius: 9,
          padding: 10,
          marginBottom: 8,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'border-color 150ms, box-shadow 150ms',
          opacity: isClosedStatus ? 0.75 : 1,
          boxShadow: isSelected ? `0 0 0 2px ${accent.dot}40` : 'none',
        } as React.CSSProperties}
        onMouseEnter={(e) => {
          if (onClick) (e.currentTarget as HTMLElement).style.borderColor = accent.border;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = isSelected ? accent.border : 'var(--co-line)';
        }}
        onFocus={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 2px ${accent.dot}60`; }}
        onBlur={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = isSelected ? `0 0 0 2px ${accent.dot}40` : 'none'; }}
      >
        {/* Company row: listing ID ref + status badge */}
        <div style={{ fontSize: 11, color: 'var(--co-text-dim)', marginBottom: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: accent.dot, fontSize: 9 }} aria-hidden="true">●</span>
            {/* listingId displayed as short ref; real title requires a separate fetch
                which would N+1 the page — show the ID short-ref. */}
            案件 #{bid.listingId.slice(0, 8)}
          </span>
          <span style={{ color: accent.labelColor, fontWeight: 600, fontSize: 10.5 }}>
            {accent.label}
          </span>
        </div>

        {/* Bid amount as title (single render — duplicate removed) */}
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--co-text)', lineHeight: 1.4, marginBottom: 6 }}>
          {bid.currency} {Number(bid.amount).toLocaleString()}
        </div>

        {/* Message preview — capped at 200 chars for tooltip safety */}
        {bid.message && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', fontSize: 10.5 }}>
            <span
              style={{ color: 'var(--co-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}
              title={bid.message.slice(0, 200)}
            >
              {bid.message}
            </span>
          </div>
        )}

        {/* Mini progress bar */}
        <div className="co-bar" aria-hidden="true">
          <span style={{ width: prog.width, background: prog.bg }} />
        </div>
    </div>
  );
}

export default PipelineCard;
