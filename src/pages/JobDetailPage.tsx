import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useListing, useListingBids, useCreateBid, useAcceptBid, useRejectBid } from '../lib/query';
import { workspaceApi } from '../lib/api/coverones';
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
import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Bid } from '../lib/api/coverones';

const JobDetailPage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: listing, isLoading, isError } = useListing(id);
  const isOwnerComputed = listing ? listing.ownerUserId === user?.id : false;
  const { data: bids = [] } = useListingBids(id, isOwnerComputed);

  const createBid = useCreateBid(id);
  const acceptBid = useAcceptBid(id);
  const rejectBid = useRejectBid(id);

  const [bidError, setBidError] = useState('');
  // bidSubmitted tracks whether the current user has successfully submitted a bid
  // this session — swaps the form for an inline confirmation to prevent duplicate submits.
  const [bidSubmitted, setBidSubmitted] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [acceptRejectError, setAcceptRejectError] = useState('');
  // navigationBidId tracks which accepted bid's "前往合約" button is currently in the
  // loading/retry state while we poll for the async-created contract.
  const [navigationBidId, setNavigationBidId] = useState<string | null>(null);
  const [contractNotReadyMsg, setContractNotReadyMsg] = useState('');
  // Retry count ref for the bounded contract discovery poll.
  const contractRetryCount = useRef(0);
  // Holds the pending retry timer so we can cancel it on unmount and avoid a
  // setState-after-unmount warning if the user navigates away mid-poll.
  const contractRetryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cancel any in-flight contract-discovery retry timer when the page unmounts.
  useEffect(() => {
    return () => {
      if (contractRetryTimer.current !== null) {
        clearTimeout(contractRetryTimer.current);
        contractRetryTimer.current = null;
      }
    };
  }, []);

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
      // On success: show inline confirmation and prevent immediate resubmit.
      setBidSubmitted(true);
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

  // Contract discovery after accept: the backend creates the contract asynchronously
  // (bid_service.go:248,296-314), so contractId is NOT in the AwardResponse.
  // We resolve it by matching workspace contracts on listingId (and optionally acceptedBidId).
  // Bounded retry up to 3 attempts with a 1-second gap to handle the async race.
  const MAX_CONTRACT_RETRIES = 3;

  const handleGoToContract = async (bid: Bid) => {
    setNavigationBidId(bid.id);
    setContractNotReadyMsg('');
    contractRetryCount.current = 0;

    const tryFind = async (): Promise<string | null> => {
      // Refetch the contracts list fresh from the server each attempt.
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      const fresh = await queryClient.fetchQuery({
        queryKey: ['contracts'],
        queryFn: () => workspaceApi.listContracts(),
        staleTime: 0,
      });
      const found = fresh.find(
        (c) => c.listingId === listing.id
          // If the contract carries acceptedBidId, prefer an exact match.
          && (c.acceptedBidId == null || c.acceptedBidId === bid.id)
      );
      return found?.id ?? null;
    };

    // The try/catch lives INSIDE attempt so EVERY attempt (including the 2nd/3rd
    // retries fired via setTimeout) is guarded. Previously only the first attempt
    // was wrapped, so a rejection on a retried attempt was an unhandled rejection
    // and the "前往合約" spinner (navigationBidId) never cleared.
    const attempt = async () => {
      try {
        const contractId = await tryFind();
        if (contractId) {
          setNavigationBidId(null);
          navigate(`/contracts/${contractId}`);
          return;
        }

        contractRetryCount.current += 1;
        if (contractRetryCount.current < MAX_CONTRACT_RETRIES) {
          // Wait 1s and retry — the contract is created async and may not exist yet.
          // Store the timer id so unmount can cancel it (avoids setState-after-unmount).
          contractRetryTimer.current = setTimeout(() => {
            contractRetryTimer.current = null;
            void attempt();
          }, 1000);
        } else {
          // Exhausted retries: show a friendly fallback message.
          setNavigationBidId(null);
          setContractNotReadyMsg('合約建立中，請稍候後至「合約管理」頁面查看，或重新整理此頁面。');
        }
      } catch {
        // Any attempt's failure clears the spinner + surfaces the not-ready message.
        setNavigationBidId(null);
        setContractNotReadyMsg('無法載入合約，請稍後重試。');
      }
    };

    await attempt();
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
                {contractNotReadyMsg && (
                  <div
                    role="status"
                    style={{
                      marginBottom: 12,
                      padding: '10px 14px',
                      background: 'rgba(245,158,11,0.1)',
                      border: '1px solid rgba(245,158,11,0.25)',
                      borderRadius: 8,
                      fontSize: 13,
                      color: 'var(--co-amber)',
                    }}
                  >
                    {contractNotReadyMsg}
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
                      onGoToContract={handleGoToContract}
                      isNavigatingToContract={navigationBidId === bid.id}
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

                {/* Bid form / feedback area */}
                {listing.status === 'OPEN' ? (
                  bidSubmitted ? (
                    /* Inline bid success confirmation — prevents duplicate submit */
                    <div
                      role="status"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        padding: '14px 16px',
                        background: 'rgba(74,222,128,0.1)',
                        border: '1px solid rgba(74,222,128,0.3)',
                        borderRadius: 10,
                      }}
                    >
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#4ade80' }}>
                        投標已送出
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--co-text-dim)', margin: 0, lineHeight: 1.5 }}>
                        您的投標已成功提交，等待案主審核。您可前往「我的投標」查看狀態。
                      </p>
                    </div>
                  ) : (
                    <BidForm
                      onSubmit={handleBidSubmit}
                      isSubmitting={createBid.isPending}
                      error={bidError}
                    />
                  )
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
