import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useListings, useMyBids } from '../lib/query';
import { getApiErrorCode } from '../lib/api/http';

/* Design-system palette constants — all values from shared.css / index.css :root tokens */
const P = {
  textViolet:  'var(--co-bdg-dev-text)',
  textCyan:    'var(--co-bdg-design-text)',
  textIndigoLt:'#C7D2FE',   /* indigo-200; no --co-* token */
  textRedLt:   '#FCA5A5',   /* red-300; no --co-* token */
  textAmberLt: 'var(--co-bdg-mfg-text)',
  textGreenBright: '#4ade80', /* green-400; unified with Home/JobDetail */
  gradBlue:   'linear-gradient(135deg,var(--co-accent-blue),var(--co-accent))',
  gradCyan:   'linear-gradient(135deg,#0EA5E9,var(--co-cyan))',
  gradPurple: 'linear-gradient(135deg,var(--co-pink),var(--co-accent-2))',
  gradGreen:  'linear-gradient(135deg,var(--co-green),#059669)',
  gradAmber:  'linear-gradient(135deg,var(--co-amber),#F97316)',
  gradRose:   'linear-gradient(135deg,var(--co-amber),var(--co-red))',
} as const;
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import type { Listing } from '../lib/api/coverones';
import { formatDistanceToNow } from 'date-fns';

/* ── Types ──────────────────────────────────────────────────────────── */
type TabId = 'ALL' | 'APPLIED' | 'RECOMMEND' | 'HOT' | 'CLOSING' | 'SAVED';

const TABS: { id: TabId; label: string; disabled?: true }[] = [
  // Active tabs — real API filters exist
  { id: 'ALL',       label: '全部專案' },
  { id: 'APPLIED',   label: '已應標' },
  // Coming-soon tabs — no real filter API yet; shown as disabled with hint
  { id: 'RECOMMEND', label: '推薦給你',  disabled: true },
  { id: 'HOT',       label: '熱門',      disabled: true },
  { id: 'CLOSING',   label: '即將截止',  disabled: true },
  { id: 'SAVED',     label: '已收藏',    disabled: true },
];

const FILTER_CHIPS = ['軟體開發', 'UI/UX 設計', '行銷推廣', '硬體製造', '資料分析', '法務財會'];

/* ── Role badge ─────────────────────────────────────────────────────── */
type BadgeVariant = 'dev' | 'design' | 'mfg' | 'mkt' | 'grey' | 'cyan' | 'amber' | 'green';

interface RoleBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

function RoleBadge({ variant, children }: RoleBadgeProps) {
  const s: Record<BadgeVariant, React.CSSProperties> = {
    dev:    { background: 'var(--co-bdg-dev-bg)',    color: 'var(--co-bdg-dev-text)',    border: '1px solid var(--co-bdg-dev-border)' },
    design: { background: 'var(--co-bdg-design-bg)', color: 'var(--co-bdg-design-text)', border: '1px solid var(--co-bdg-design-border)' },
    mfg:    { background: 'var(--co-bdg-mfg-bg)',    color: 'var(--co-bdg-mfg-text)',    border: '1px solid var(--co-bdg-mfg-border)' },
    mkt:    { background: 'var(--co-bdg-mkt-bg)',    color: 'var(--co-bdg-mkt-text)',    border: '1px solid var(--co-bdg-mkt-border)' },
    grey:   { background: 'rgba(148,163,184,0.1)',   color: 'var(--co-text-dim)',         border: '1px solid rgba(148,163,184,0.2)' },
    cyan:   { background: 'rgba(34,211,238,0.12)',   color: P.textCyan,       border: '1px solid rgba(34,211,238,0.3)' },
    amber:  { background: 'rgba(245,158,11,0.15)',   color: P.textAmberLt,    border: '1px solid rgba(245,158,11,0.35)' },
    green:  { background: 'rgba(16,185,129,0.12)',   color: P.textGreenBright, border: '1px solid rgba(16,185,129,0.3)' },
  };
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
        ...s[variant],
      }}
    >
      {children}
    </span>
  );
}

/* ── Logo square ────────────────────────────────────────────────────── */
/* All gradient values come from shared.css .lg-* classes */
const LOGO_GRADIENTS = [
  P.gradBlue,
  'linear-gradient(135deg,var(--co-accent-2),var(--co-pink))',
  P.gradGreen,
  'linear-gradient(135deg,var(--co-pink),var(--co-accent-2))',
  P.gradAmber,
  P.gradCyan,
];

function logoGrad(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return LOGO_GRADIENTS[Math.abs(h) % LOGO_GRADIENTS.length];
}

/* ── Real listing row (from API) ────────────────────────────────────── */
function ListingRow({ listing, onBid }: { listing: Listing; onBid: () => void }) {
  const budgetLabel = (() => {
    if (listing.budgetMin && listing.budgetMax) return `${listing.currency} ${listing.budgetMin} – ${listing.budgetMax}`;
    if (listing.budgetMin) return `${listing.currency} ${listing.budgetMin}+`;
    if (listing.budgetMax) return `Up to ${listing.currency} ${listing.budgetMax}`;
    return 'TBD';
  })();

  const timeAgo = (() => {
    try { return formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true }); } catch { return ''; }
  })();

  const letter = listing.title.charAt(0).toUpperCase();
  const grad = logoGrad(listing.id);
  const isUrgent = (() => {
    try { return Date.now() - new Date(listing.createdAt).getTime() < 3 * 24 * 60 * 60 * 1000; } catch { return false; }
  })();

  return (
    <div
      style={{
        background: 'var(--co-bg-card)',
        border: '1px solid var(--co-line-strong)',
        borderRadius: 'var(--co-card-r)',
        padding: 18,
        display: 'flex',
        gap: 16,
        transition: 'border-color 150ms',
        marginBottom: 12,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.4)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--co-line-strong)'; }}
    >
      {/* Logo */}
      <div
        aria-hidden="true"
        style={{
          width: 52,
          height: 52,
          borderRadius: 10,
          background: grad,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 17,
          color: '#fff',
          flexShrink: 0,
        }}
      >
        {letter}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Head row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.4 }}>{listing.title}</div>
            <div style={{ fontSize: 12, color: 'var(--co-text-dim)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--co-text)', fontWeight: 500 }}>發布方</span>
              {timeAgo && <span>· {timeAgo}</span>}
            </div>
          </div>
          {isUrgent && (
            <span
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: P.textRedLt,
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 10.5,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
              }}
            >
              <Icon.Bell size={10} /> 新發布
            </span>
          )}
          <button
            aria-label={`收藏 ${listing.title}`}
            style={{
              padding: 6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--co-text-dim)',
              borderRadius: 6,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
          >
            <Icon.Star size={16} />
          </button>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: 13,
            color: 'var(--co-text-dim)',
            lineHeight: 1.55,
            margin: '8px 0 10px 0',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {listing.description}
        </p>

        {/* Status tag row */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0 12px 0' }}>
          <RoleBadge variant="dev">{listing.status === 'OPEN' ? '開放中' : listing.status}</RoleBadge>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 10, borderTop: '1px solid var(--co-line)', fontSize: 12, color: 'var(--co-text-dim)', flexWrap: 'wrap' }}>
          <div>
            <span style={{ color: P.textViolet, fontWeight: 600 }}>{budgetLabel}</span>
            {' '}· 預算
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              onClick={() => onBid()}
              aria-label={`查看 ${listing.title} 詳情`}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--co-btn-r)',
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.3)',
                color: P.textIndigoLt,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              了解更多
            </button>
            <button
              onClick={() => onBid()}
              aria-label={`應標 ${listing.title}`}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--co-btn-r)',
                background: 'linear-gradient(135deg, var(--co-accent-blue), var(--co-accent-2))',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(99,102,241,0.25)',
              }}
            >
              立即應標
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────── */
const JobBoardPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const kycTier = user?.kycTier ?? 0;
  const { data: listings, isLoading, isError, error } = useListings({ status: 'OPEN' });
  // APPLIED tab: use real bid data from the user's submitted bids
  const { data: myBids } = useMyBids();
  // Default to first enabled tab ('ALL'); RECOMMEND is disabled / coming-soon
  const [activeTab, setActiveTab] = useState<TabId>('ALL');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const canPost = kycTier >= 2;
  const needsEmailVerification = !!user && !user.emailVerified;
  const errorCode = getApiErrorCode(error);
  const isEmailVerificationError = isError && (errorCode === 'EMAIL_NOT_VERIFIED' || needsEmailVerification);
  const isTierRequiredError = isError && errorCode === 'KYC_TIER_REQUIRED' && !isEmailVerificationError;
  const isOnboardingError = isEmailVerificationError || isTierRequiredError;

  const totalCount = listings?.length ?? 0;

  // Map category chip labels to keywords matched against title + description.
  // NOTE: The API has no category field yet; this is a client-side text filter.
  // TODO (backend): add category/tag field to Listing and filter server-side.
  const CHIP_KEYWORDS: Record<string, string[]> = {
    '軟體開發':  ['軟體', '開發', '程式', 'software', 'dev', 'code', 'api', 'backend', 'frontend', 'golang', 'go ', 'react', 'microservice', '微服務'],
    'UI/UX 設計': ['設計', 'design', 'ui', 'ux', '品牌', 'visual', '介面'],
    '行銷推廣':  ['行銷', 'marketing', 'campaign', 'social', 'kol', '媒體', '推廣'],
    '硬體製造':  ['硬體', 'hardware', 'pcb', '製造', '代工', '機械', '機電', '電路'],
    '資料分析':  ['資料', 'data', 'analytics', 'bi', '分析', 'ml', 'ai', '機器學習'],
    '法務財會':  ['法務', '財會', '會計', '法律', 'legal', 'finance', 'audit', '稽核'],
  };

  function filterListings(items: Listing[]): Listing[] {
    // Category chip filter: client-side keyword match on title + description
    if (activeFilter && CHIP_KEYWORDS[activeFilter]) {
      const keywords = CHIP_KEYWORDS[activeFilter];
      return items.filter((l) => {
        const haystack = `${l.title} ${l.description}`.toLowerCase();
        return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
      });
    }
    return items;
  }

  const displayed = listings ? filterListings(listings) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: 'var(--co-bg)', color: 'var(--co-text)' }}>

      {/* ── Page head ── */}
      <div
        style={{
          padding: '20px 28px 16px 28px',
          borderBottom: '1px solid var(--co-line)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--co-text-muted)', marginBottom: 4 }}>主選單 / 專案接案</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>
              專案接案 · 公開招標市場
            </h1>
            <p style={{ fontSize: 13, color: 'var(--co-text-dim)', margin: 0 }}>
              目前共 <strong style={{ color: 'var(--co-text)' }}>{isLoading ? '…' : totalCount}</strong> 個進行中專案
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              aria-label="進階篩選"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 'var(--co-btn-r)',
                background: 'rgba(148,163,184,0.08)',
                border: '1px solid var(--co-line-strong)',
                color: 'var(--co-text-dim)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <Icon.Settings size={14} />
              進階篩選
            </button>
            {canPost && (
              <button
                onClick={() => navigate('/jobs/new')}
                aria-label="發布需求"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 'var(--co-btn-r)',
                  background: 'linear-gradient(135deg, var(--co-accent-blue), var(--co-accent-2))',
                  border: 'none',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
                }}
              >
                <Icon.Plus size={14} />
                發布需求
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div
        role="tablist"
        aria-label="案件分類"
        style={{
          display: 'flex',
          gap: 0,
          padding: '0 28px',
          borderBottom: '1px solid var(--co-line)',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {TABS.map((tab) => {
          const isTabActive = activeTab === tab.id;
          // Show real count only for tabs with a live filter; disabled tabs show no count
          const liveCount = tab.id === 'ALL' ? totalCount : tab.id === 'APPLIED' ? (myBids?.length ?? 0) : undefined;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`jobs-tab-${tab.id}`}
              aria-selected={isTabActive}
              aria-controls={`jobs-panel-${tab.id}`}
              aria-disabled={tab.disabled}
              disabled={tab.disabled}
              onClick={() => { if (!tab.disabled) setActiveTab(tab.id); }}
              title={tab.disabled ? '即將推出' : undefined}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '12px 16px',
                borderBottom: isTabActive ? '2px solid var(--co-accent)' : '2px solid transparent',
                color: tab.disabled ? 'var(--co-text-muted)' : isTabActive ? 'var(--co-text)' : 'var(--co-text-dim)',
                fontWeight: isTabActive ? 600 : 400,
                fontSize: 13.5,
                background: 'none',
                border: 'none',
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                opacity: tab.disabled ? 0.55 : 1,
                transition: 'color 150ms',
              }}
            >
              {tab.label}
              {tab.disabled && (
                <span
                  style={{
                    fontSize: 9.5,
                    padding: '1px 5px',
                    borderRadius: 999,
                    background: 'rgba(148,163,184,0.1)',
                    color: 'var(--co-text-muted)',
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                  }}
                >
                  即將推出
                </span>
              )}
              {!tab.disabled && liveCount != null && (
                <span
                  style={{
                    fontSize: 11,
                    padding: '0 6px',
                    borderRadius: 999,
                    background: isTabActive ? 'rgba(99,102,241,0.15)' : 'rgba(148,163,184,0.1)',
                    color: isTabActive ? P.textViolet : 'var(--co-text-muted)',
                    fontWeight: 600,
                  }}
                >
                  {liveCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Filter bar ── */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '14px 28px',
          borderBottom: '1px solid var(--co-line)',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => setActiveFilter(null)}
          aria-label="全部類別"
          aria-pressed={activeFilter === null}
          style={{
            padding: '6px 12px',
            borderRadius: 999,
            background: activeFilter === null ? 'rgba(99,102,241,0.18)' : 'var(--co-bg-3)',
            border: activeFilter === null ? '1px solid var(--co-accent)' : '1px solid var(--co-line-strong)',
            color: activeFilter === null ? P.textIndigoLt : 'var(--co-text-dim)',
            fontSize: 12.5,
            fontWeight: activeFilter === null ? 500 : 400,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          全部類別
          <Icon.ChevronDown size={10} />
        </button>

        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => setActiveFilter(activeFilter === chip ? null : chip)}
            aria-pressed={activeFilter === chip}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              background: activeFilter === chip ? 'rgba(99,102,241,0.18)' : 'var(--co-bg-3)',
              border: activeFilter === chip ? '1px solid var(--co-accent)' : '1px solid var(--co-line-strong)',
              color: activeFilter === chip ? P.textIndigoLt : 'var(--co-text-dim)',
              fontSize: 12.5,
              fontWeight: activeFilter === chip ? 500 : 400,
              cursor: 'pointer',
            }}
          >
            {chip}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--co-text-dim)' }}>
          排序：最新發布 ▾
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: 22,
          padding: '22px 28px 40px 28px',
          flex: 1,
        }}
        className="jb-body"
      >
        {/* ── Left: stats + listings ── */}
        <div>
          {/* Section label */}
          <div
            style={{
              fontSize: 11,
              color: 'var(--co-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              fontWeight: 600,
              padding: '2px 4px 8px 4px',
            }}
          >
            ⚡ 開放案件
          </div>

          {/* Listings */}
          <div
            role="tabpanel"
            id={`jobs-panel-${activeTab}`}
            aria-labelledby={`jobs-tab-${activeTab}`}
          >
            {/* APPLIED tab: show real bids from useMyBids(); Bid type doesn't
                map to ListingRow, so render EmptyState with honest bid count */}
            {activeTab === 'APPLIED' ? (
              myBids && myBids.length > 0 ? (
                <EmptyState
                  icon={<Icon.Briefcase size={48} />}
                  title={`已應標 ${myBids.length} 個專案`}
                  description="詳細應標記錄請至各專案頁面查看。"
                />
              ) : (
                <EmptyState
                  icon={<Icon.Briefcase size={48} />}
                  title="尚無應標紀錄"
                  description="瀏覽案件並提交您的第一個投標。"
                />
              )
            ) : isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <LoadingSkeleton count={4} height="h-32" />
              </div>
            ) : isEmailVerificationError ? (
              <EmptyState
                icon={<Icon.Lock size={48} />}
                title="請先驗證 Email"
                description="驗證信已寄出。完成信箱驗證後，案件瀏覽功能即可使用。"
                ctaLabel="查看驗證信狀態"
                onCta={() => navigate('/register/verify-sent', { state: { email: user?.email ?? '' } })}
              />
            ) : isTierRequiredError ? (
              <EmptyState
                icon={<Icon.Lock size={48} />}
                title="完成帳戶驗證後即可查看案件"
                description="前往 KYC 查看下一步。"
                ctaLabel="完成 KYC 認證"
                onCta={() => navigate('/kyc')}
              />
            ) : isError && !isOnboardingError ? (
              <EmptyState
                icon={<Icon.X size={48} />}
                title="載入失敗"
                description="請重新整理頁面。"
              />
            ) : displayed.length === 0 ? (
              <EmptyState
                icon={<Icon.Briefcase size={48} />}
                title="目前沒有案件"
                description={canPost ? '成為第一個發布案件的人。' : '瀏覽案件並提交您的第一個投標。'}
                ctaLabel={canPost ? '發布案件' : undefined}
                onCta={canPost ? () => navigate('/jobs/new') : undefined}
              />
            ) : (
              <>
                {displayed.map((listing) => (
                  <ListingRow
                    key={listing.id}
                    listing={listing}
                    onBid={() => navigate(`/jobs/${listing.id}`)}
                  />
                ))}
                {/* Pagination not yet implemented — disable until cursor-based
                    load-more is wired to the API's next_cursor/has_more fields */}
                <div style={{ textAlign: 'center', padding: 14 }}>
                  <button
                    aria-label="載入更多案件（即將推出）"
                    disabled
                    style={{
                      padding: '8px 20px',
                      borderRadius: 'var(--co-btn-r)',
                      background: 'rgba(148,163,184,0.08)',
                      border: '1px solid var(--co-line-strong)',
                      color: 'var(--co-text-dim)',
                      fontSize: 13,
                      cursor: 'not-allowed',
                      opacity: 0.55,
                    }}
                  >
                    即將推出分頁載入
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right rail ── */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }} aria-label="側邊資訊欄">

          {/* Smart match — no backend source yet */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 'var(--co-card-r)',
              padding: 16,
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon.Bell size={14} />
              智慧媒合提醒
            </h3>
            <EmptyState
              title="媒合功能即將推出"
              description="AI 智慧媒合功能正在開發中，敬請期待。"
            />
          </div>

          {/* Bid progress — link to real bids page */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 'var(--co-card-r)',
              padding: 16,
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              我的應標進度
              <button
                onClick={() => navigate('/bids')}
                aria-label="查看全部應標"
                style={{ fontSize: 11, color: 'var(--co-text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                查看全部
              </button>
            </h3>
            <EmptyState
              icon={<Icon.Star size={32} />}
              title="查看應標紀錄"
              description="前往「我的投標」查看您的應標狀態與進度。"
              ctaLabel="前往我的投標"
              onCta={() => navigate('/bids')}
            />
          </div>

          {/* Saved — no backend source yet */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 'var(--co-card-r)',
              padding: 16,
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 10px 0' }}>
              已收藏
            </h3>
            <EmptyState
              icon={<Icon.Star size={32} />}
              title="收藏功能即將推出"
              description="案件收藏功能正在開發中，敬請期待。"
            />
          </div>

          {/* AI helper */}
          <div
            style={{
              background: 'linear-gradient(135deg,rgba(34,211,238,0.06),rgba(99,102,241,0.04))',
              border: '1px solid rgba(34,211,238,0.2)',
              borderRadius: 'var(--co-card-r)',
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div
                aria-hidden="true"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(34,211,238,0.15)',
                  color: P.textCyan,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon.MessageSquare size={16} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>招標問與答</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--co-text-dim)', lineHeight: 1.5 }}>
              不確定如何撰寫提案？AI 助理可幫你分析需求、產出 RFP 大綱與報價建議。
            </div>
            <button
              aria-label="開始招標諮詢"
              style={{
                width: '100%',
                marginTop: 10,
                padding: '8px 0',
                borderRadius: 'var(--co-btn-r)',
                background: 'rgba(148,163,184,0.08)',
                border: '1px solid var(--co-line-strong)',
                color: 'var(--co-text-dim)',
                fontSize: 12.5,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              開始諮詢
            </button>
          </div>

        </aside>
      </div>

      {/* Mobile RWD */}
      <style>{`
        @media (max-width: 1023px) {
          .jb-body { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 767px) {
          .jb-body { padding: 16px 16px 80px 16px !important; }
        }
      `}</style>
    </div>
  );
};

export default JobBoardPage;
