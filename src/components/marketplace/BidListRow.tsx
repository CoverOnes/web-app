import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import type { Bid } from '../../lib/api/coverones';

interface BidListRowProps {
  bid: Bid;
  isListingOpen: boolean;
  onAccept: (bidId: string) => void;
  onReject: (bidId: string) => void;
  isAccepting: boolean;
  isRejecting: boolean;
}

export function BidListRow({
  bid,
  isListingOpen,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
}: BidListRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 0',
        borderBottom: '1px solid var(--color-main-border)',
      }}
    >
      <Avatar name={bid.bidderUserId.slice(0, 2)} size="sm" />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-main-text)' }}>
            {bid.bidderUserId.slice(0, 8)}...
          </span>
          <StatusBadge status={bid.status} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-accent)', marginLeft: 'auto' }}>
            {bid.currency} {bid.amount}
          </span>
        </div>
        {bid.message && (
          <p
            style={{
              fontSize: 12,
              color: 'var(--color-main-text-dim)',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {bid.message}
          </p>
        )}
      </div>

      {bid.status === 'PENDING' && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <Button
            variant="primary"
            size="sm"
            disabled={!isListingOpen}
            loading={isAccepting}
            onClick={() => onAccept(bid.id)}
            aria-label="Accept bid"
          >
            Accept
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={!isListingOpen}
            loading={isRejecting}
            onClick={() => onReject(bid.id)}
            aria-label="Reject bid"
          >
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}

export default BidListRow;
