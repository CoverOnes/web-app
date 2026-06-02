import { useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useListing, useListingBids, useCreateBid, useAcceptBid, useRejectBid } from '../lib/query';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { BidForm } from '../components/marketplace/BidForm';
import { BidListRow } from '../components/marketplace/BidListRow';
import { Icon } from '../components/ui/Icon';
import { formatDistanceToNow } from 'date-fns';
import type { AxiosError } from 'axios';
import { useState } from 'react';

const JobDetailPage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const { data: listing, isLoading, isError } = useListing(id);
  const isOwnerComputed = listing ? listing.ownerUserId === user?.id : false;
  const { data: bids = [] } = useListingBids(id, isOwnerComputed);

  const createBid = useCreateBid(id);
  const acceptBid = useAcceptBid(id);
  const rejectBid = useRejectBid(id);

  const [bidError, setBidError] = useState('');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <LoadingSkeleton count={1} height="h-64" />
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div style={{ padding: 24 }}>
        <EmptyState
          icon={<Icon.X size={48} />}
          title="Listing not found"
          description="This job listing may have been removed or you don't have access."
        />
      </div>
    );
  }

  const relativeTime = (() => {
    try { return formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true }); } catch { return ''; }
  })();

  const handleBidSubmit = async (data: Parameters<typeof createBid.mutateAsync>[0]) => {
    setBidError('');
    try {
      await createBid.mutateAsync(data);
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setBidError(axErr.response?.data?.message ?? 'Failed to submit bid.');
    }
  };

  const handleAccept = async (bidId: string) => {
    setAcceptingId(bidId);
    try { await acceptBid.mutateAsync(bidId); } finally { setAcceptingId(null); }
  };

  const handleReject = async (bidId: string) => {
    setRejectingId(bidId);
    try { await rejectBid.mutateAsync(bidId); } finally { setRejectingId(null); }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, maxWidth: 1100 }}>
        {/* Left: Listing detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              background: 'var(--color-main-bg-2)',
              border: '1px solid var(--color-main-border)',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-main-text)', letterSpacing: '-0.02em' }}>
                {listing.title}
              </h1>
              <StatusBadge status={listing.status} />
            </div>

            <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--color-main-text-dim)', marginBottom: 16 }}>
              {listing.description}
            </p>

            <div style={{ display: 'flex', gap: 20, paddingTop: 16, borderTop: '1px solid var(--color-main-border)' }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--color-main-text-dim)', marginBottom: 2 }}>Budget</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-accent)' }}>
                  {listing.budgetMin && listing.budgetMax
                    ? `${listing.currency} ${listing.budgetMin} – ${listing.budgetMax}`
                    : listing.budgetMin
                    ? `${listing.currency} ${listing.budgetMin}+`
                    : 'TBD'
                  }
                </p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--color-main-text-dim)', marginBottom: 2 }}>Posted</p>
                <p style={{ fontSize: 13, color: 'var(--color-main-text)' }}>{relativeTime}</p>
              </div>
            </div>
          </div>

          {/* Owner: bid list */}
          {isOwnerComputed && (
            <div
              style={{
                background: 'var(--color-main-bg-2)',
                border: '1px solid var(--color-main-border)',
                borderRadius: 16,
                padding: 24,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-main-text)', marginBottom: 16 }}>
                Bids ({bids.length})
              </h2>
              {bids.length === 0 ? (
                <EmptyState title="No bids yet" description="Bids will appear here when freelancers apply." />
              ) : (
                bids.map((bid) => (
                  <BidListRow
                    key={bid.id}
                    bid={bid}
                    isListingOpen={listing.status === 'OPEN'}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    isAccepting={acceptingId === bid.id}
                    isRejecting={rejectingId === bid.id}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Right: bid form */}
        {!isOwnerComputed && (
          <div
            style={{
              background: 'var(--color-main-bg-2)',
              border: '1px solid var(--color-main-border)',
              borderRadius: 16,
              padding: 24,
              alignSelf: 'start',
            }}
          >
            {listing.status === 'OPEN' ? (
              <BidForm
                onSubmit={handleBidSubmit}
                isSubmitting={createBid.isPending}
                error={bidError}
              />
            ) : (
              <p style={{ fontSize: 13, color: 'var(--color-main-text-dim)' }}>
                This listing is {listing.status.toLowerCase()} and no longer accepting bids.
              </p>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default JobDetailPage;
