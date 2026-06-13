import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useListing, useListingBids, useCreateBid, useAcceptBid, useRejectBid, useListings } from '../lib/query';
import { workspaceApi } from '../lib/api/coverones';

/* Design-system palette constants — all values from shared.css / index.css :root tokens */
const P = {
  textViolet:  'var(--co-bdg-dev-text)',
  textCyan:    'var(--co-bdg-design-text)',
  textIndigoLt:'#C7D2FE',   /* indigo-200; no --co-* token — closest is co-accent tinted */
  textRedLt:   '#FCA5A5',   /* red-300; no --co-* token — used for urgent labels in design */
  textGreenBright: '#4ade80', /* green-400; no --co-* token — used for success state */
  redPulse:    'var(--co-red)',
  /* Gradient: match score bar */
  gradMatchScore: 'linear-gradient(135deg,var(--co-bdg-design-text),var(--co-bdg-dev-text))',
  /* Logo square gradients (shared.css .lg-* classes) */
  gradAmber:  'linear-gradient(135deg,var(--co-amber),#F97316)',
  gradRose:   'linear-gradient(135deg,var(--co-amber),var(--co-red))',
  gradCyan:   'linear-gradient(135deg,#0EA5E9,var(--co-cyan))',
  gradViolet: 'linear-gradient(135deg,var(--co-accent-2),var(--co-pink))',
  gradGreen:  'linear-gradient(135deg,var(--co-green),#059669)',
} as const;
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { BidForm } from '../components/marketplace/BidForm';
import { BidListRow } from '../components/marketplace/BidListRow';
import { Icon } from '../components/ui/Icon';
import { formatDistanceToNow } from 'date-fns';
import { getApiErrorMessage } from '../lib/api/http';
import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Bid } from '../lib/api/coverones';

/* ── Logo square ─────────────────────────────────────────────────────── */
/* All gradient values come from shared.css .lg-* classes */
const LOGO_GRADIENTS = [
  'linear-gradient(135deg,var(--co-accent-blue),var(--co-accent))',
  'linear-gradient(135deg,var(--co-accent-2),var(--co-pink))',
  'linear-gradient(135deg,var(--co-green),var(--co-green))',
  'linear-gradient(135deg,var(--co-pink),var(--co-accent-2))',
  P.gradAmber,
  P.gradCyan,
];

function logoGrad(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return LOGO_GRADIENTS[Math.abs(h) % LOGO_GRADIENTS.length];
}

/* ── Role badge ─────────────────────────────────────────────────────── */
function Badge({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 500,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* ── Verified tick ───────────────────────────────────────────────────── */
function VerifiedTick() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ color: 'var(--co-cyan)', display: 'inline', flexShrink: 0 }}
    >
      <path d="M12 1 3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4z" />
    </svg>
  );
}

/* ── Main page ───────────────────────────────────────────────────────── */
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
  const [bidSubmitted, setBidSubmitted] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [acceptRejectError, setAcceptRejectError] = useState('');
  const [navigationBidId, setNavigationBidId] = useState<string | null>(null);
  const [contractNotReadyMsg, setContractNotReadyMsg] = useState('');
  const contractRetryCount = useRef(0);
  const contractRetryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Similar listings — must be called before any early return (Rules of Hooks) */
  const { data: allListings } = useListings({ status: 'OPEN' });

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
    if (listing.budgetMin && listing.budgetMax) return `${listing.currency} ${listing.budgetMin} – ${listing.budgetMax}`;
    if (listing.budgetMin) return `${listing.currency} ${listing.budgetMin}+`;
    if (listing.budgetMax) return `Up to ${listing.currency} ${listing.budgetMax}`;
    return 'TBD';
  })();

  const handleBidSubmit = async (data: Parameters<typeof createBid.mutateAsync>[0]) => {
    setBidError('');
    try {
      await createBid.mutateAsync(data);
      setBidSubmitted(true);
    } catch (err) {
      setBidError(getApiErrorMessage(err) ?? 'Failed to submit bid.');
    }
  };

  const handleAccept = async (bidId: string) => {
    setAcceptingId(bidId);
    setAcceptRejectError('');
    try {
      await acceptBid.mutateAsync(bidId);
    } catch (err) {
      setAcceptRejectError(getApiErrorMessage(err) ?? 'Failed to accept bid. Please try again.');
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
      setAcceptRejectError(getApiErrorMessage(err) ?? 'Failed to reject bid. Please try again.');
    } finally {
      setRejectingId(null);
    }
  };

  const MAX_CONTRACT_RETRIES = 3;

  const handleGoToContract = async (bid: Bid) => {
    setNavigationBidId(bid.id);
    setContractNotReadyMsg('');
    contractRetryCount.current = 0;

    const tryFind = async (): Promise<string | null> => {
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      const fresh = await queryClient.fetchQuery({
        queryKey: ['contracts'],
        queryFn: () => workspaceApi.listContracts(),
        staleTime: 0,
      });
      const found = fresh.find(
        (c) =>
          c.listingId === listing.id &&
          (c.acceptedBidId == null || c.acceptedBidId === bid.id)
      );
      return found?.id ?? null;
    };

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
          contractRetryTimer.current = setTimeout(() => {
            contractRetryTimer.current = null;
            void attempt();
          }, 1000);
        } else {
          setNavigationBidId(null);
          setContractNotReadyMsg('合約建立中，請稍候後至「合約管理」頁面查看，或重新整理此頁面。');
        }
      } catch {
        setNavigationBidId(null);
        setContractNotReadyMsg('無法載入合約，請稍後重試。');
      }
    };

    await attempt();
  };

  /* Derive similarListings after listing is confirmed non-null */
  const similarListings = (allListings ?? []).filter((l) => l.id !== id).slice(0, 3);

  const letter = listing.title.charAt(0).toUpperCase();
  const grad = logoGrad(listing.id);



  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--co-bg)', minHeight: '100%', color: 'var(--co-text)' }}>

      {/* Breadcrumb */}
      <div style={{ padding: '12px 28px 8px 28px', borderBottom: '1px solid var(--co-line)' }}>
        <button
          onClick={() => navigate('/jobs')}
          aria-label="返回專案接案列表"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: P.textViolet,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <Icon.ArrowLeft size={12} />
          專案接案
        </button>
        <span style={{ fontSize: 12, color: 'var(--co-text-muted)' }}>
          {' / '}軟體開發 / {listing.title.slice(0, 24)}…
        </span>
      </div>

      {/* Body: left+right two-column */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) 360px',
          gap: 22,
          padding: '22px 28px 40px 28px',
        }}
        className="jd-body"
      >
        {/* ══════════ LEFT ══════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>

          {/* HERO */}
          <div
            style={{
              background: 'linear-gradient(135deg,rgba(37,99,235,.18),rgba(139,92,246,.12) 60%,rgba(34,211,238,.18))',
              border: '1px solid rgba(99,102,241,.3)',
              borderRadius: 16,
              padding: 24,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Glow */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                right: -60,
                top: -60,
                width: 300,
                height: 300,
                background: 'radial-gradient(circle, rgba(34,211,238,.3), transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
              <div
                aria-hidden="true"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: grad,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 18,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {letter}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--co-text-dim)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span>發布方</span>
                  <VerifiedTick />
                  <span>· {relativeTime}</span>
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '4px 0 8px 0', lineHeight: 1.3 }}>
                  {listing.title}
                </h1>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Badge style={{ background: 'rgba(148,163,184,0.1)', color: 'var(--co-text-dim)', border: '1px solid rgba(148,163,184,0.2)' }}>
                    {listing.status === 'OPEN' ? '進行中' : listing.status}
                  </Badge>
                  {listing.status === 'OPEN' && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 12px',
                        borderRadius: 999,
                        background: 'rgba(239,68,68,.15)',
                        border: '1px solid rgba(239,68,68,.4)',
                        color: P.textRedLt,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 999,
                          background: P.redPulse,
                          display: 'inline-block',
                          boxShadow: '0 0 6px rgba(239,68,68,0.8)',
                        }}
                      />
                      截標中
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stat row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4,1fr)',
                gap: 14,
                marginTop: 18,
              }}
              className="jd-stat-row"
            >
              {[
                { label: '預算',   value: budgetLabel || 'TBD', color: 'var(--co-green)' },
                { label: '截標日', value: '開放中',              color: 'var(--co-amber)' },
                { label: '投標數', value: String(bids.length),   color: 'var(--co-text)' },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  style={{
                    background: 'rgba(15,23,42,.5)',
                    border: '1px solid var(--co-line)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div style={{ fontSize: 10.5, color: 'var(--co-text-dim)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.02em', marginTop: 3, color }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 專案描述 */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 14,
              padding: 20,
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'rgba(99,102,241,.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: P.textViolet,
                }}
              >
                <Icon.FileText size={14} />
              </span>
              專案描述
            </h2>
            <p style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--co-text-dim)', margin: '0 0 10px 0' }}>
              {listing.description}
            </p>
          </div>

          {/* 需求規格 */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 14,
              padding: 20,
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'rgba(99,102,241,.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: P.textViolet,
                }}
              >
                <Icon.Check size={14} />
              </span>
              需求規格
            </h2>
            <EmptyState
              title="需求規格即將推出"
              description="採購方的詳細技術需求將在此顯示，功能正在開發中。"
            />
          </div>

          {/* 付款里程碑 */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 14,
              padding: 20,
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'rgba(99,102,241,.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: P.textViolet,
                }}
              >
                <Icon.Bell size={14} />
              </span>
              付款里程碑
            </h2>
            <EmptyState
              title="付款里程碑即將推出"
              description="合約付款時程與里程碑詳情將在此顯示。"
            />
          </div>

          {/* Q&A section */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 14,
              padding: 20,
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'rgba(99,102,241,.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: P.textViolet,
                }}
              >
                <Icon.MessageSquare size={14} />
              </span>
              專案 Q&amp;A
              <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--co-text-dim)', fontWeight: 400 }}>
                0 則討論 · 公開
              </span>
            </h2>

            <EmptyState
              icon={<Icon.MessageSquare size={32} />}
              title="暫無討論"
              description="Q&A 功能即將推出，敬請期待。"
            />

            {/* Q&A 送出 — coming soon; disabled until API is wired */}
            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              <input
                aria-label="提出你的問題（即將推出）"
                placeholder="提問功能即將推出..."
                disabled
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'var(--co-bg-3)',
                  border: '1px solid var(--co-line)',
                  borderRadius: 10,
                  fontSize: 13,
                  color: 'var(--co-text-dim)',
                  outline: 'none',
                  opacity: 0.55,
                  cursor: 'not-allowed',
                }}
              />
              <button
                aria-label="送出問題（即將推出）"
                disabled
                style={{
                  padding: '10px 16px',
                  borderRadius: 'var(--co-btn-r)',
                  background: 'rgba(148,163,184,0.15)',
                  color: 'var(--co-text-dim)',
                  fontSize: 13,
                  fontWeight: 600,
                  border: '1px solid var(--co-line-strong)',
                  cursor: 'not-allowed',
                  opacity: 0.55,
                }}
              >
                即將推出
              </button>
            </div>
          </div>

          {/* 已投標方 (owner view) or public bidder list */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 14,
              padding: 20,
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'rgba(99,102,241,.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: P.textViolet,
                }}
              >
                <Icon.Users size={14} />
              </span>
              已公開投標方
              <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--co-text-dim)', fontWeight: 400 }}>
                {bids.length} 家 · 採購方審核中
              </span>
            </h2>

            {isOwnerComputed ? (
              <>
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
                      color: P.textRedLt,
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
              </>
            ) : (
              /* Non-owner view: bidder info is confidential */
              <EmptyState
                icon={<Icon.Users size={32} />}
                title="投標方資訊不公開"
                description="依平台規範，投標方資訊僅採購方可見。"
              />
            )}
          </div>
        </div>

        {/* ══════════ RIGHT RAIL ══════════ */}
        <div style={{ minWidth: 0 }}>

          {/* Apply / bid card — sticky */}
          <div
            style={{
              position: 'sticky',
              top: 80,
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 14,
              padding: 20,
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--co-text-dim)', textTransform: 'uppercase', letterSpacing: '.05em' }}>採購預算</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', color: 'var(--co-green)', marginTop: 4 }}>
              {budgetLabel || 'TBD'}
              <span style={{ fontSize: 13, color: 'var(--co-text-dim)', fontWeight: 500, marginLeft: 4 }}>總額</span>
            </div>
            {listing.status === 'OPEN' && (
              <div style={{ fontSize: 12, color: 'var(--co-text-dim)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon.Bell size={12} />
                截標{' '}
                <span style={{ color: P.textRedLt, fontWeight: 600 }}>開放中 (請查看截止日)</span>
              </div>
            )}





            {/* CTA buttons — real bid form for non-owners when open */}
            {!isOwnerComputed && listing.status === 'OPEN' && (
              bidSubmitted ? (
                <div
                  role="status"
                  style={{
                    marginTop: 14,
                    padding: '14px 16px',
                    background: 'rgba(74,222,128,0.1)',
                    border: '1px solid rgba(74,222,128,0.3)',
                    borderRadius: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 600, color: P.textGreenBright }}>投標已送出</div>
                  <p style={{ fontSize: 13, color: 'var(--co-text-dim)', margin: 0, lineHeight: 1.5 }}>
                    您的投標已成功提交，等待案主審核。
                  </p>
                </div>
              ) : (
                <>
                  <BidForm
                    onSubmit={handleBidSubmit}
                    isSubmitting={createBid.isPending}
                    error={bidError}
                  />
                  <button
                    aria-label="收藏此案件"
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 'var(--co-btn-r)',
                      background: 'transparent',
                      border: '1px solid var(--co-line-strong)',
                      color: 'var(--co-text)',
                      fontSize: 12.5,
                      cursor: 'pointer',
                      marginTop: 6,
                    }}
                  >
                    ⭐ 收藏 · 加入觀察清單
                  </button>
                  <button
                    aria-label="私訊採購窗口"
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 'var(--co-btn-r)',
                      background: 'transparent',
                      border: '1px solid var(--co-line-strong)',
                      color: 'var(--co-text)',
                      fontSize: 12.5,
                      cursor: 'pointer',
                      marginTop: 6,
                    }}
                  >
                    📩 私訊採購窗口
                  </button>
                </>
              )
            )}

            {!isOwnerComputed && listing.status !== 'OPEN' && (
              <p style={{ fontSize: 13, color: 'var(--co-text-dim)', marginTop: 14 }}>
                此案件已關閉，不再接受投標。
              </p>
            )}
          </div>

          {/* About company */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 14,
              padding: 16,
              marginTop: 14,
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 12px 0' }}>關於採購方</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div
                aria-hidden="true"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: grad,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#fff',
                }}
              >
                {letter}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  發布方 <VerifiedTick />
                </div>

              </div>
            </div>

          </div>

          {/* Similar projects */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 14,
              padding: 16,
              marginTop: 14,
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              類似案件
              <button
                aria-label="查看全部類似案件"
                style={{ fontSize: 11, color: 'var(--co-text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                查看全部
              </button>
            </h3>
            {similarListings.length === 0 ? (
              <EmptyState title="暫無類似案件" description="目前沒有其他開放案件。" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {similarListings.map((sim) => (
                  <button
                    key={sim.id}
                    onClick={() => navigate(`/jobs/${sim.id}`)}
                    aria-label={`查看案件：${sim.title}`}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      border: '1px solid var(--co-line)',
                      background: 'rgba(15,23,42,.4)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: 'inherit',
                      transition: 'border-color 150ms',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.4)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--co-line)'; }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.4 }}>{sim.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--co-text-dim)', marginTop: 4 }}>
                      <span style={{ color: 'var(--co-green)', fontWeight: 600 }}>
                        {sim.budgetMin != null ? `NT$ ${Number(sim.budgetMin).toLocaleString()}` : 'TBD'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Mobile RWD */}
      <style>{`
        @media (max-width: 1023px) {
          .jd-body { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 767px) {
          .jd-body { padding: 12px 16px 80px 16px !important; }
          .jd-stat-row { grid-template-columns: 1fr 1fr !important; }
          .jd-req-grid { grid-template-columns: 1fr !important; }
          .jd-ms { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default JobDetailPage;
