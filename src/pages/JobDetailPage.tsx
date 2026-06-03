import { useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useListing, useListingBids, useCreateBid, useAcceptBid, useRejectBid } from '../lib/query';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { BidForm } from '../components/marketplace/BidForm';
import { BidListRow } from '../components/marketplace/BidListRow';
import { LogoSquare } from '../components/ui/LogoSquare';
import { PageHead } from '../components/layout/PageHead';
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
  const [acceptRejectError, setAcceptRejectError] = useState('');

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
          title="找不到案件"
          description="此案件可能已被移除或您沒有存取權限。"
        />
      </div>
    );
  }

  const relativeTime = (() => {
    try { return formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true }); } catch { return ''; }
  })();

  const budgetLabel = (() => {
    if (listing.budgetMin && listing.budgetMax) {
      return `${listing.currency} ${listing.budgetMin} – ${listing.budgetMax}`;
    }
    if (listing.budgetMin) return `${listing.currency} ${listing.budgetMin}+`;
    if (listing.budgetMax) return `Up to ${listing.currency} ${listing.budgetMax}`;
    return 'TBD';
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
    setAcceptRejectError('');
    try {
      await acceptBid.mutateAsync(bidId);
    } catch (err) {
      const axErr = err as import('axios').AxiosError<{ message?: string }>;
      setAcceptRejectError(axErr.response?.data?.message ?? 'Failed to accept bid. Please try again.');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = async (bidId: string) => {
    setRejectingId(bidId);
    setAcceptRejectError('');
    try {
      await rejectBid.mutateAsync(bidId);
    } catch (err) {
      const axErr = err as import('axios').AxiosError<{ message?: string }>;
      setAcceptRejectError(axErr.response?.data?.message ?? 'Failed to reject bid. Please try again.');
    } finally {
      setRejectingId(null);
    }
  };

  const letter = listing.title.charAt(0).toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--co-bg)', minHeight: '100%' }}>
      <PageHead
        crumb="案件看板 / 案件詳情"
        title={listing.title}
        actions={
          <StatusBadge status={listing.status} />
        }
      />

      <div style={{ padding: '22px 28px 40px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 22 }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Hero card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(37,99,235,0.18), rgba(139,92,246,0.12))',
                border: '1px solid var(--co-line)',
                borderRadius: 16,
                padding: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
                <LogoSquare letter={letter} size={56} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--co-text)', letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>
                    {listing.title}
                  </h2>
                  <div style={{ fontSize: 13, color: 'var(--co-text-dim)' }}>
                    Posted {relativeTime}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, paddingTop: 18, borderTop: '1px solid var(--co-line)' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--co-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    預算
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--co-green)' }}>
                    {budgetLabel}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--co-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    投標數
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--co-cyan)' }}>
                    {bids.length}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--co-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    狀態
                  </div>
                  <div>
                    <StatusBadge status={listing.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div
              style={{
                background: 'var(--co-bg-card)',
                border: '1px solid var(--co-line)',
                borderRadius: 12,
                padding: 24,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--co-text)', marginBottom: 12 }}>
                案件說明
              </h2>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--co-text-dim)', margin: 0 }}>
                {listing.description}
              </p>
            </div>

            {/* Owner: bid list */}
            {isOwnerComputed && (
              <div
                style={{
                  background: 'var(--co-bg-card)',
                  border: '1px solid var(--co-line)',
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--co-text)', marginBottom: 16 }}>
                  投標名單 ({bids.length})
                </h2>
                {acceptRejectError && (
                  <div
                    role="alert"
                    style={{
                      marginBottom: 12,
                      padding: '10px 14px',
                      background: 'rgba(239,68,68,0.12)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: 8,
                      fontSize: 13,
                      color: '#FCA5A5',
                    }}
                  >
                    {acceptRejectError}
                  </div>
                )}
                {bids.length === 0 ? (
                  <EmptyState title="尚無投標" description="投標者將出現在這裡。" />
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

          {/* Right rail — apply card */}
          {!isOwnerComputed && (
            <div style={{ position: 'sticky', top: 80, alignSelf: 'start' }}>
              <div
                style={{
                  background: 'var(--co-bg-card)',
                  border: '1px solid var(--co-line)',
                  borderRadius: 14,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                {/* Budget highlight */}
                <div>
                  <div style={{ fontSize: 11, color: 'var(--co-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    預算範圍
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--co-green)' }}>
                    {budgetLabel}
                  </div>
                </div>

                <div style={{ height: 1, background: 'var(--co-line)' }} aria-hidden="true" />

                {/* Bid form */}
                {listing.status === 'OPEN' ? (
                  <BidForm
                    onSubmit={handleBidSubmit}
                    isSubmitting={createBid.isPending}
                    error={bidError}
                  />
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--co-text-dim)', margin: 0 }}>
                    此案件已{listing.status.toLowerCase()}，不再接受投標。
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage;
