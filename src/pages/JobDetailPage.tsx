import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useListing, useListingBids, useCreateBid, useAcceptBid, useRejectBid } from '../lib/query';
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

  const letter = listing.title.charAt(0).toUpperCase();
  const grad = logoGrad(listing.id);

  /* ── Static placeholder Q&A / bidder list (design mockup fixtures) ── */
  const QA_ITEMS = [
    {
      letter: '奇',
      bg: P.gradViolet,
      questioner: '奇點科技 · Alex Chen',
      whenQ: '2 天前 · 已驗證投標方',
      q: '請問 PoC 階段是否允許使用團隊既有的 Go gRPC framework？我們有開源實績可提供。另想確認 NDA 的限制範圍是否涵蓋技術 blog 撰寫？',
      answerer: '採購窗口',
      a: 'PoC 階段歡迎使用既有 framework，但須確認 license 相容性。NDA 限制核心業務邏輯，技術架構討論在去識別化後可發布 blog，需事前審核。',
    },
    {
      letter: '沛',
      bg: P.gradCyan,
      questioner: '沛星互動',
      whenQ: '3 天前',
      q: '原系統的 monolith 是用什麼語言？預期遷移期間是否有機會接觸到正式生產流量做壓測？',
      answerer: '技術窗口',
      a: '原系統為 Java 11 + Spring Boot。簽 NDA 後可申請開發環境，含影子流量回放，但正式生產壓測需個案核准。',
    },
    {
      letter: '綠',
      bg: P.gradGreen,
      questioner: '綠源資安',
      whenQ: '5 天前',
      q: '是否提供現有 API 的流量分析資料？以利我們評估服務拆分粒度的合理性。',
      answerer: null,
      a: null,
    },
  ];

  const SIMILAR = [
    { title: '中華電信 - 微服務治理平台導入', budget: 'NT$ 980K', deadline: '5/30', bidCount: 7 },
    { title: '玉山銀行 - Core Banking API Gateway', budget: 'NT$ 2.4M', deadline: '6/15', bidCount: 14 },
    { title: 'Appier - K8s 平台維運外包', budget: 'NT$ 720K / 年', deadline: '長期', bidCount: 0 },
  ];

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
                  <Badge style={{ background: 'var(--co-bdg-dev-bg)', color: 'var(--co-bdg-dev-text)', border: '1px solid var(--co-bdg-dev-border)' }}>
                    後端開發
                  </Badge>
                  <Badge style={{ background: 'rgba(34,211,238,0.12)', color: P.textCyan, border: '1px solid rgba(34,211,238,0.3)' }}>
                    技術接案
                  </Badge>
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
                      截標倒數 4 天
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
                { label: '關注',   value: '86',                  color: P.textCyan },
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }} className="jd-req-grid">
              {[
                { n: '01', title: '技術棧',     desc: 'Go 1.21+ 為主、Kubernetes 1.28+、gRPC + Protocol Buffers、PostgreSQL、Redis' },
                { n: '02', title: '團隊規模',   desc: '至少 1 名架構師 + 4 名後端 + 1 名 DevOps，全程駐廠或混合辦公' },
                { n: '03', title: '過往實績',   desc: '需提供至少 2 個千萬級 QPS 系統重構案例文件，含技術 Blog 或開源貢獻' },
                { n: '04', title: '交付標準',   desc: '不停機 SLO 99.95%、回滾機制、完整 OpenAPI 規範與內部 SDK' },
                { n: '05', title: '合規',       desc: '需通過 ISO 27001 認證、簽署 NDA 與利益迴避條款' },
                { n: '06', title: '語言',       desc: '繁體中文 / 英文均可，技術文件需中英對照' },
              ].map(({ n, title, desc }) => (
                <div
                  key={n}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: 'rgba(15,23,42,.6)',
                    border: '1px solid var(--co-line)',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 7,
                      background: 'linear-gradient(135deg,var(--co-accent),var(--co-accent-2))',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {n}
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--co-text-dim)', marginTop: 2, lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Skill tags */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
              {['Go', 'Kubernetes', 'gRPC', 'Microservices', 'Service Mesh', 'Istio', 'PostgreSQL', 'Redis', 'CI/CD', 'Observability'].map((skill) => (
                <span
                  key={skill}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: 11.5,
                    background: 'rgba(99,102,241,.12)',
                    border: '1px solid rgba(99,102,241,.25)',
                    color: P.textIndigoLt,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
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
            <div style={{ display: 'grid', gap: 12, marginTop: 6 }}>
              {[
                { when: 'M1 · 第 1 月', what: '技術 PoC 與架構設計',     detail: '提交完整 ADR 文件、選型驗證',     pay: 'NT$ 180K' },
                { when: 'M2 · 第 4 月', what: '前 4 個服務上線',         detail: '含監控、灰度發布驗證',           pay: 'NT$ 360K' },
                { when: 'M3 · 第 8 月', what: '全部服務拆分完成',         detail: '舊系統流量 100% 遷移',           pay: 'NT$ 480K' },
                { when: 'M4 · 第 12 月', what: '驗收 + 知識轉移',        detail: '完整文件、Runbook、3 個月維護',  pay: 'NT$ 180K' },
              ].map(({ when, what, detail, pay }) => (
                <div
                  key={when}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '90px 1fr auto',
                    gap: 14,
                    padding: 14,
                    borderRadius: 10,
                    border: '1px solid var(--co-line)',
                    background: 'rgba(15,23,42,.4)',
                    alignItems: 'center',
                  }}
                  className="jd-ms"
                >
                  <div style={{ fontSize: 11, color: 'var(--co-text-dim)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{when}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{what}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--co-text-dim)', fontWeight: 400, marginTop: 2 }}>{detail}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--co-green)', whiteSpace: 'nowrap' }}>{pay}</div>
                </div>
              ))}
            </div>
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
                {QA_ITEMS.length} 則討論 · 公開
              </span>
            </h2>

            {QA_ITEMS.map(({ letter: l, bg, questioner, whenQ, q, answerer, a }) => (
              <div
                key={questioner}
                style={{
                  paddingTop: 14,
                  borderTop: '1px solid var(--co-line)',
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div
                    aria-hidden="true"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: '#fff',
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    {l}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{questioner}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--co-text-dim)', marginBottom: 6 }}>{whenQ}</div>
                    <div style={{ fontSize: 13, color: 'var(--co-text-dim)', lineHeight: 1.65 }}>{q}</div>
                  </div>
                </div>
                {answerer && a && (
                  <div
                    style={{
                      marginTop: 10,
                      marginLeft: 42,
                      padding: 12,
                      borderLeft: '2px solid var(--co-accent)',
                      background: 'rgba(99,102,241,.06)',
                      borderRadius: '0 10px 10px 0',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: P.textViolet, marginBottom: 4 }}>
                      ↳ {answerer}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--co-text)', lineHeight: 1.6 }}>{a}</div>
                  </div>
                )}
              </div>
            ))}

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
              /* Public bidder placeholder rows — shown to non-owners.
                 NOTE: This list is design-spec sample data. Real bidder
                 anonymisation API is not yet implemented (Coming Soon). */
              <>
                <div
                  role="status"
                  style={{
                    marginBottom: 12,
                    padding: '8px 12px',
                    background: 'rgba(245,158,11,0.10)',
                    border: '1px solid rgba(245,158,11,0.28)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'var(--co-bdg-mfg-text)',
                  }}
                >
                  ⚠ 以下為展示資料，實際投標方資訊即將推出
                </div>
                {[
                  { letter: '鴻', bg: P.gradRose, name: '鴻海資訊', verified: true, meta: '資訊服務 · 200+ 員工 · 2 天前投標', quote: 'NT$ 1.18M', duration: '12 個月' },
                  { letter: '沛', bg: P.gradCyan,  name: '沛星互動', verified: true, meta: 'AI / SaaS · 80 員工 · 3 天前投標',  quote: 'NT$ 1.24M', duration: '11 個月' },
                  { letter: '綠', bg: P.gradGreen, name: '綠源資安', verified: false, meta: '資訊安全 · 50 員工 · 5 天前投標',  quote: 'NT$ 1.32M', duration: '14 個月' },
                ].map(({ letter: l, bg, name, verified, meta, quote, duration }) => (
                  <div
                    key={name}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto',
                      gap: 12,
                      padding: '12px 0',
                      borderBottom: '1px solid var(--co-line)',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      aria-hidden="true"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        color: '#fff',
                        fontSize: 13,
                      }}
                    >
                      {l}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {name}
                        {verified && <VerifiedTick />}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--co-text-dim)', marginTop: 1 }}>{meta}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{quote}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--co-text-dim)', fontWeight: 400 }}>{duration}</div>
                    </div>
                  </div>
                ))}
                <div style={{ textAlign: 'center', marginTop: 10 }}>
                  <button
                    aria-label="展開全部投標方（即將推出）"
                    disabled
                    style={{
                      padding: '7px 16px',
                      borderRadius: 'var(--co-btn-r)',
                      background: 'none',
                      border: '1px solid var(--co-line-strong)',
                      color: 'var(--co-text-dim)',
                      fontSize: 12.5,
                      cursor: 'not-allowed',
                      opacity: 0.55,
                    }}
                  >
                    即將推出 ▾
                  </button>
                </div>
              </>
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

            {/* Match score */}
            <div
              style={{
                background: 'linear-gradient(135deg,rgba(34,211,238,.1),rgba(99,102,241,.05))',
                border: '1px solid rgba(34,211,238,.25)',
                borderRadius: 10,
                padding: 12,
                marginTop: 14,
              }}
            >
              <div style={{ fontSize: 11.5, color: P.textCyan, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <Icon.Star size={12} />
                媒合度
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  marginTop: 2,
                  background: P.gradMatchScore,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                94
                <span style={{ fontSize: 14, color: 'var(--co-text-dim)', fontWeight: 600 }}> / 100</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--co-text-dim)' }}>技能 100% · 規模 90% · 過往實績 95%</div>
            </div>

            {/* Info rows */}
            <div style={{ marginTop: 14 }}>
              {[
                { l: '類別',     v: '技術接案 · 微服務' },
                { l: '付款方式', v: '里程碑分期' },
                { l: '合約期間', v: '12 個月' },
                { l: '工作模式', v: '混合辦公' },
                { l: '需 NDA',   v: '是', red: true },
                { l: '採購窗口', v: '林經理' },
              ].map(({ l, v, red }, i, arr) => (
                <div
                  key={l}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '9px 0',
                    fontSize: 12.5,
                    borderBottom: i < arr.length - 1 ? '1px dashed var(--co-line)' : 'none',
                  }}
                >
                  <span style={{ color: 'var(--co-text-dim)' }}>{l}</span>
                  <span style={{ color: red ? P.textRedLt : 'var(--co-text)', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>

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
                <div style={{ fontSize: 11.5, color: 'var(--co-text-dim)' }}>業界領先 · 精英企業</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
              {[
                { label: '總發案',   value: '142' },
                { label: '完成率',   value: '98%', green: true },
                { label: '準時付款', value: '⭐ 4.9', cyan: true },
                { label: '合作廠商', value: '86' },
              ].map(({ label, value, green, cyan }) => (
                <div
                  key={label}
                  style={{
                    padding: 10,
                    background: 'rgba(15,23,42,.5)',
                    border: '1px solid var(--co-line)',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ fontSize: 10, color: 'var(--co-text-dim)', textTransform: 'uppercase' }}>{label}</div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      marginTop: 2,
                      color: green ? 'var(--co-green)' : cyan ? 'var(--co-cyan)' : 'var(--co-text)',
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SIMILAR.map(({ title, budget, deadline, bidCount }) => (
                <button
                  key={title}
                  onClick={() => navigate('/jobs')}
                  aria-label={`查看案件：${title}`}
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
                  <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.4 }}>{title}</div>
                  <div style={{ fontSize: 11, color: 'var(--co-text-dim)', marginTop: 4, display: 'flex', gap: 8 }}>
                    <span style={{ color: 'var(--co-green)', fontWeight: 600 }}>{budget}</span>
                    <span>· 截標 {deadline}</span>
                    {bidCount > 0 && <span>· {bidCount} 投標</span>}
                  </div>
                </button>
              ))}
            </div>
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
