import { useMyBids, useWithdrawBid } from '../lib/query';
import { BidCard } from '../components/marketplace/BidCard';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { useState } from 'react';

const MyBidsPage = () => {
  const { data: bids, isLoading, isError } = useMyBids();
  const withdrawBid = useWithdrawBid();
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const handleWithdraw = async (bidId: string) => {
    setWithdrawingId(bidId);
    try {
      await withdrawBid.mutateAsync(bidId);
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-main-text)', marginBottom: 24, letterSpacing: '-0.02em' }}>
        My Bids
      </h1>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <LoadingSkeleton count={4} height="h-24" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={<Icon.X size={48} />}
          title="Failed to load bids"
          description="Something went wrong. Please refresh."
        />
      ) : !bids || bids.length === 0 ? (
        <EmptyState
          icon={<Icon.MessageSquare size={48} />}
          title="No bids yet"
          description="Browse the job board and place your first bid."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
          {bids.map((bid) => (
            <BidCard
              key={bid.id}
              bid={bid}
              onWithdraw={handleWithdraw}
              isWithdrawing={withdrawingId === bid.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBidsPage;
