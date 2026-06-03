import { Link } from 'react-router-dom';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import type { Bid } from '../../lib/api/coverones';

interface BidCardProps {
  bid: Bid;
  listingTitle?: string;
  onWithdraw: (bidId: string) => void;
  isWithdrawing: boolean;
}

export function BidCard({ bid, listingTitle, onWithdraw, isWithdrawing }: BidCardProps) {
  return (
    <div
      style={{
        background: 'var(--co-bg-card-2)',
        border: '1px solid var(--co-line)',
        borderRadius: 'var(--radius-card)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Link
            to={`/jobs/${bid.listingId}`}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--color-accent)',
              textDecoration: 'none',
            }}
            className="hover:underline"
          >
            {listingTitle ?? `Listing ${bid.listingId.slice(0, 8)}...`}
          </Link>
        </div>
        <StatusBadge status={bid.status} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--co-text)' }}>
          {bid.currency} {bid.amount}
        </span>
      </div>

      {bid.message && (
        <p
          style={{
            fontSize: 13,
            color: 'var(--co-text-dim)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {bid.message}
        </p>
      )}

      {bid.status === 'PENDING' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onWithdraw(bid.id)}
            loading={isWithdrawing}
            aria-label="Withdraw bid"
          >
            Withdraw
          </Button>
        </div>
      )}
    </div>
  );
}

export default BidCard;
