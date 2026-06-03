import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useListing, useListingBids, useCreateBid, useAcceptBid, useRejectBid, useCreateContract } from '../lib/query';
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
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data: listing, isLoading, isError } = useListing(id);
  const isOwnerComputed = listing ? listing.ownerUserId === user?.id : false;
  const { data: bids = [] } = useListingBids(id, isOwnerComputed);

  const createBid = useCreateBid(id);
  const acceptBid = useAcceptBid(id);
  const rejectBid = useRejectBid(id);
  const createContract = useCreateContract();

  const [bidError, setBidError] = useState('');
  const [bidSubmitted, setBidSubmitted] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [acceptRejectError, setAcceptRejectError] = useState('');
  const [contractError, setContractError] = useState('');

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
      // 🟠-2: switch the right rail to a confirmation block so the user can't
      // resubmit (resubmit → 409 BID_ALREADY_EXISTS). No toast system in codebase.
      setBidSubmitted(true);
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setBidError(axErr.response?.data?.message ?? 'Failed to submit bid.');
    }
  };

  const handleCreateContract = async () => {
    setContractError('');
    const acceptedBid = bids.find((b) => b.status === 'ACCEPTED');
    if (!acceptedBid) {
      setContractError('找不到已接受的投標，無法建立合約。');
      return;
    }
    try {
      const contract = await createContract.mutateAsync({
        listingId: listing.id,
        acceptedBidId: acceptedBid.id,
        freelancerUserId: acceptedBid.bidderUserId,
        title: listing.title,
        terms: listing.description,
        amount: acceptedBid.amount,
        currency: acceptedBid.currency,
      });
      navigate(`/contracts/${contract.id}`);
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setContractError(axErr.response?.data?.message ?? '建立合約失敗，請重試。');
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

                {/* 🔴-1: once a bid is accepted (listing AWARDED), let the owner
                    create the contract from the accepted bid. */}
                {listing.status === 'AWARDED' && (
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--co-line)' }}>
                    {contractError && (
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
                        {contractError}
                      </div>
                    )}
                    <p style={{ fontSize: 13, color: 'var(--co-text-dim)', margin: '0 0 12px 0' }}>
                      您已接受一筆投標。建立合約以進入簽署流程。
                    </p>
                    <button
                      type="button"
                      onClick={handleCreateContract}
                      disabled={createContract.isPending}
                      aria-label="建立合約"
                      style={{
                        height: 44,
                        padding: '0 20px',
                        borderRadius: 10,
                        background: 'var(--co-accent)',
                        border: 'none',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: createContract.isPending ? 'not-allowed' : 'pointer',
                        opacity: createContract.isPending ? 0.6 : 1,
                      }}
                    >
                      {createContract.isPending ? '建立中…' : '建立合約'}
                    </button>
                  </div>
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
                {listing.status !== 'OPEN' ? (
                  <p style={{ fontSize: 13, color: 'var(--co-text-dim)', margin: 0 }}>
                    此案件已{listing.status.toLowerCase()}，不再接受投標。
                  </p>
                ) : bidSubmitted ? (
                  /* 🟠-2: confirmation after a successful bid; prevents resubmit (409). */
                  <div
                    role="status"
                    style={{
                      padding: '14px 16px',
                      background: 'rgba(34,197,94,0.1)',
                      border: '1px solid rgba(34,197,94,0.3)',
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#4ade80', marginBottom: 4 }}>
                      已投標
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--co-text-dim)', margin: 0, lineHeight: 1.5 }}>
                      您的投標已送出，等待案主回覆。您可以在「我的投標」中追蹤狀態。
                    </p>
                  </div>
                ) : (
                  <BidForm
                    onSubmit={handleBidSubmit}
                    isSubmitting={createBid.isPending}
                    error={bidError}
                  />
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
