import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useListings } from '../lib/query';
import { Icon } from '../components/ui/Icon';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import type { Listing } from '../lib/api/coverones';

/*
 * Design-system palette constants — all sourced from shared.css / index.css :root tokens.
 * Remaining hex values are for colors with no --co-* token equivalent.
 */
const P = {
  /* Gradient pairs — logo squares (shared.css .lg-* classes) */
  gradBlue:   'linear-gradient(135deg,var(--co-accent-blue),var(--co-accent))',
  gradPurple: 'linear-gradient(135deg,var(--co-pink),var(--co-accent-2))',
  gradGreen:  'linear-gradient(135deg,var(--co-green),#059669)',
  gradAmber:  'linear-gradient(135deg,var(--co-amber),#F97316)',
  gradCyan:   'linear-gradient(135deg,#0EA5E9,var(--co-cyan))',
  gradPink:   'linear-gradient(135deg,var(--co-accent),var(--co-accent-2))',
  gradOrange: 'linear-gradient(135deg,var(--co-pink),#F472B6)',
  gradTeal:   'linear-gradient(135deg,var(--co-green),#34D399)',
  gradRose:   'linear-gradient(135deg,var(--co-amber),var(--co-red))',
  gradViolet: 'linear-gradient(135deg,var(--co-accent-2),var(--co-pink))',
  /* Section title gradients */
  gradHotTitle: 'linear-gradient(135deg, var(--co-amber), #F472B6)',
  gradNamePill: 'linear-gradient(135deg, var(--co-bdg-dev-text), var(--co-bdg-design-text))',
} as const;

/* ── Logo square gradient helpers ───────────────────────────────────── */
const LOGO_GRADIENTS = [
  P.gradBlue, P.gradPurple, P.gradGreen, P.gradAmber, P.gradCyan,
  P.gradPink, P.gradOrange, P.gradTeal, P.gradRose, P.gradViolet,
];

function logoGrad(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return LOGO_GRADIENTS[Math.abs(h) % LOGO_GRADIENTS.length];
}

/* ── Listing card (homepage grid, real API data) ────────────────────── */
function HomeProjCard({ listing, onBid }: { listing: Listing; onBid: () => void }) {
  const letter = listing.title.charAt(0).toUpperCase();
  const grad = logoGrad(listing.id);

  const budgetLabel = (() => {
    if (listing.budgetMin && listing.budgetMax)
      return `${listing.currency} ${listing.budgetMin}–${listing.budgetMax}`;
    if (listing.budgetMin) return `${listing.currency} ${listing.budgetMin}+`;
    if (listing.budgetMax) return `≤ ${listing.currency} ${listing.budgetMax}`;
    return 'TBD';
  })();

  return (
    <div
      style={{
        background: 'var(--co-bg-card)',
        border: '1px solid var(--co-line-strong)',
        borderRadius: 'var(--co-card-r)',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'border-color 150ms, transform 150ms',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.4)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--co-line-strong)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          aria-hidden="true"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: grad,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 13,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {letter}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>發布方</div>
          <div style={{ fontSize: 11, color: 'var(--co-text-dim)' }}>
            {listing.status === 'OPEN' ? '開放中' : listing.status}
          </div>
        </div>
      </div>

      {/* Title */}
      <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{listing.title}</div>

      {/* Desc */}
      <div
        style={{
          fontSize: 12,
          color: 'var(--co-text-dim)',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {listing.description}
      </div>

      {/* Budget */}
      <div style={{ paddingTop: 10, borderTop: '1px dashed var(--co-line)' }}>
        <span style={{ fontSize: 10, color: 'var(--co-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>預算</span>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--co-green)', marginTop: 2 }}>{budgetLabel}</div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 8 }}>
        <button
          onClick={onBid}
          aria-label={`應標 ${listing.title}`}
          style={{
            marginLeft: 'auto',
            padding: '7px 14px',
            borderRadius: 'var(--co-btn-r)',
            background: 'linear-gradient(135deg, var(--co-accent-blue), var(--co-accent-2))',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
            transition: 'opacity 150ms',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        >
          立即應標
        </button>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────── */
const Home = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const displayName = user?.displayName || user?.email?.split('@')[0] || '';

  /* Real listings — up to 4 OPEN listings for the homepage preview */
  const { data: listings, isLoading: listingsLoading } = useListings({ status: 'OPEN' });
  const previewListings = (listings ?? []).slice(0, 4);

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        overflowY: 'auto',
        background: 'var(--co-bg)',
        color: 'var(--co-text)',
      }}
    >
      {/* Desktop body grid (1fr + 320px sidebar) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: 24,
          padding: '24px 28px 40px 28px',
          maxWidth: 1200,
          width: '100%',
          margin: '0 auto',
          alignItems: 'start',
        }}
        className="home-grid"
      >
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>

          {/* Welcome banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(37,99,235,0.18) 0%, rgba(99,102,241,0.12) 50%, rgba(139,92,246,0.18) 100%)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: 16,
              padding: '22px 26px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                right: -40,
                top: -40,
                width: 240,
                height: 240,
                background: 'radial-gradient(circle, rgba(139,92,246,0.4), transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: '0 0 6px 0',
                position: 'relative',
              }}
            >
              {displayName ? (
                <>
                  歡迎，
                  <span
                    style={{
                      background: P.gradNamePill,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {displayName}
                  </span>
                  ！
                </>
              ) : (
                '歡迎回來！'
              )}
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--co-text-dim)', margin: 0, position: 'relative' }}>
              探索最新開放接案專案，找到最佳合作夥伴。
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', position: 'relative' }}>
              <button
                onClick={() => navigate('/jobs')}
                aria-label="瀏覽所有開放案件"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 'var(--co-btn-r)',
                  background: 'linear-gradient(135deg, var(--co-accent-blue), var(--co-accent-2))',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Icon.Briefcase size={14} />
                瀏覽案件
              </button>
              <button
                onClick={() => navigate('/jobs/new')}
                aria-label="發布新專案"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 'var(--co-btn-r)',
                  background: 'rgba(15,23,42,0.6)',
                  border: '1px solid var(--co-line-strong)',
                  fontSize: 13,
                  backdropFilter: 'blur(8px)',
                  color: 'var(--co-text)',
                  cursor: 'pointer',
                }}
              >
                <Icon.Plus size={14} />
                發布專案
              </button>
            </div>
          </div>

          {/* Composer */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 'var(--co-card-r)',
              padding: 14,
              display: 'flex',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: 'linear-gradient(135deg, var(--co-accent-blue), var(--co-accent))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {displayName ? displayName.charAt(0).toUpperCase() : '?'}
            </div>
            <div
              style={{
                flex: 1,
                padding: '9px 14px',
                background: 'var(--co-bg-3)',
                border: '1px solid var(--co-line)',
                borderRadius: 999,
                fontSize: 13,
                color: 'var(--co-text-dim)',
                cursor: 'text',
              }}
            >
              分享公司動態，或發布合作機會...
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                aria-label="附加圖片"
                style={{
                  padding: '7px 10px',
                  borderRadius: 7,
                  fontSize: 12,
                  color: 'var(--co-text-dim)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Icon.Image size={14} />
                圖片
              </button>
              <button
                onClick={() => navigate('/jobs/new')}
                aria-label="發布新專案"
                style={{
                  padding: '7px 14px',
                  borderRadius: 7,
                  fontSize: 12,
                  background: 'var(--co-accent)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontWeight: 500,
                }}
              >
                <Icon.Plus size={14} />
                發布專案
              </button>
            </div>
          </div>

          {/* Open listings — real API data */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>
                {'🔥'}{' '}
                <span
                  style={{
                    background: P.gradHotTitle,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  最新開放案件
                </span>
              </div>
              <button
                onClick={() => navigate('/jobs')}
                aria-label="查看全部案件"
                style={{
                  fontSize: 12,
                  color: 'var(--co-text-dim)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                查看全部 →
              </button>
            </div>

            {listingsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <LoadingSkeleton count={2} height="h-28" />
              </div>
            ) : previewListings.length === 0 ? (
              <EmptyState
                icon={<Icon.Briefcase size={40} />}
                title="目前沒有開放案件"
                description="成為第一個發布案件的人，或稍後再查看。"
                ctaLabel="發布案件"
                onCta={() => navigate('/jobs/new')}
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="proj-grid">
                {previewListings.map((listing) => (
                  <HomeProjCard
                    key={listing.id}
                    listing={listing}
                    onBid={() => navigate(`/jobs/${listing.id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Feed — no backend source yet */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>企業動態</div>
            </div>
            <EmptyState
              icon={<Icon.MessageSquare size={40} />}
              title="動態功能即將推出"
              description="企業發文、互動與動態牆功能正在開發中，敬請期待。"
            />
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Quick actions */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 'var(--co-card-r)',
              padding: 16,
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 14px 0' }}>快速導覽</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: '瀏覽所有案件', path: '/jobs',      icon: <Icon.Briefcase size={14} /> },
                { label: '我的投標',             path: '/bids',      icon: <Icon.Star size={14} /> },
                { label: '合約管理',             path: '/contracts', icon: <Icon.File size={14} /> },
                { label: '發布新案件',     path: '/jobs/new',  icon: <Icon.Plus size={14} /> },
              ].map(({ label, path, icon }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  aria-label={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(15,23,42,0.4)',
                    border: '1px solid var(--co-line)',
                    color: 'var(--co-text)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 150ms',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.4)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--co-line)'; }}
                >
                  <span style={{ color: 'var(--co-text-dim)' }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Suggested companies — no backend source */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 'var(--co-card-r)',
              padding: 16,
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 14px 0' }}>
              為你推薦的公司
            </h3>
            <EmptyState
              icon={<Icon.Users size={32} />}
              title="推薦即將推出"
              description="企業媒合與推薦功能正在開發中。"
            />
          </div>

          {/* Trending — no backend source */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 'var(--co-card-r)',
              padding: 16,
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {'🔥'} 熱門產業趨勢
              <span style={{ fontSize: 11, color: 'var(--co-text-dim)', fontWeight: 400 }}>本週</span>
            </h3>
            <EmptyState
              icon={<Icon.Bell size={32} />}
              title="趨勢資料即將推出"
              description="產業熱門趨勢分析功能正在開發中。"
            />
          </div>

        </div>
      </div>

      {/* Mobile RWD */}
      <style>{`
        @media (max-width: 767px) {
          .home-grid {
            grid-template-columns: 1fr !important;
            padding: 12px 16px 80px 16px !important;
          }
          .proj-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .home-grid {
            grid-template-columns: 1fr !important;
          }
          .proj-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
