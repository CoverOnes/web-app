import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Icon } from '../components/ui/Icon';

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
  /* Derived text / accent colors */
  textViolet:  'var(--co-bdg-dev-text)',
  textCyan:    'var(--co-bdg-design-text)',
  textIndigoLt:'#C7D2FE',  /* indigo-200; no --co-* token */
  textRedLt:   '#FCA5A5',  /* red-300; no --co-* token */
  textAmberLt: 'var(--co-bdg-mfg-text)',
  textGreenBright: '#4ade80', /* green-400; no --co-* token */
  /* Section title gradients */
  gradHotTitle: 'linear-gradient(135deg, var(--co-amber), #F472B6)',
  gradNamePill: 'linear-gradient(135deg, var(--co-bdg-dev-text), var(--co-bdg-design-text))',
  /* Stat card number gradients (stats panel, right column) */
  gradStatCyan:   'linear-gradient(135deg, var(--co-bdg-design-text), var(--co-accent-blue))',
  gradStatPurple: 'linear-gradient(135deg, var(--co-bdg-dev-text), var(--co-pink))',
  /* Feed / Q&A company logos */
  gradTSMC:     'linear-gradient(135deg,var(--co-accent-blue),var(--co-accent))',
  gradEslite:   'linear-gradient(135deg,var(--co-pink),var(--co-accent-2))',
} as const;

/* ── Role badge helpers ─────────────────────────────────────────────── */

type Role = 'dev' | 'design' | 'mfg' | 'mkt';

interface RoleBadgeProps {
  role: Role;
  label: string;
}

function RoleBadge({ role, label }: RoleBadgeProps) {
  const styles: Record<Role, React.CSSProperties> = {
    dev: {
      background: 'var(--co-bdg-dev-bg)',
      color: 'var(--co-bdg-dev-text)',
      border: '1px solid var(--co-bdg-dev-border)',
    },
    design: {
      background: 'var(--co-bdg-design-bg)',
      color: 'var(--co-bdg-design-text)',
      border: '1px solid var(--co-bdg-design-border)',
    },
    mfg: {
      background: 'var(--co-bdg-mfg-bg)',
      color: 'var(--co-bdg-mfg-text)',
      border: '1px solid var(--co-bdg-mfg-border)',
    },
    mkt: {
      background: 'var(--co-bdg-mkt-bg)',
      color: 'var(--co-bdg-mkt-text)',
      border: '1px solid var(--co-bdg-mkt-border)',
    },
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
        ...styles[role],
      }}
    >
      {label}
    </span>
  );
}

/* ── Verified tick ──────────────────────────────────────────────────── */
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

/* ── Static placeholder project data ────────────────────────────────── */
interface ProjectItem {
  id: string;
  logoLetter: string;
  logoBg: string;
  company: string;
  verified: boolean;
  location: string;
  role: Role;
  roleLabel: string;
  title: string;
  desc: string;
  budget: string;
  deadline: string;
  type: string;
  bidders: { letter: string; bg: string }[];
  bidCount: number;
}

const PLACEHOLDER_PROJECTS: ProjectItem[] = [
  {
    id: '1',
    logoLetter: '台',
    logoBg: P.gradBlue,
    company: '台積電子',
    verified: true,
    location: '新竹科學園區',
    role: 'dev',
    roleLabel: '後端開發',
    title: 'EDA 工具 API Gateway 微服務化重構',
    desc: '需有 Go / Kubernetes / gRPC 經驗團隊，協助將既有 monolith 拆分為微服務架構...',
    budget: 'NT$ 1.2M',
    deadline: '5/12',
    type: '技術接案',
    bidders: [
      { letter: '鴻', bg: P.gradRose },
      { letter: '新', bg: P.gradGreen },
      { letter: '奇', bg: P.gradViolet },
    ],
    bidCount: 8,
  },
  {
    id: '2',
    logoLetter: '誠',
    logoBg: P.gradPurple,
    company: '誠品文創',
    verified: true,
    location: '台北信義區',
    role: 'design',
    roleLabel: '品牌設計',
    title: '2026 年度品牌識別系統升級',
    desc: '徵求具有零售業 VI 經驗的設計團隊，需提案 logo、色彩、字體、應用範本...',
    budget: 'NT$ 680K',
    deadline: '5/03',
    type: '創意接案',
    bidders: [
      { letter: '藍', bg: P.gradCyan },
      { letter: '橙', bg: P.gradAmber },
    ],
    bidCount: 5,
  },
  {
    id: '3',
    logoLetter: '中',
    logoBg: P.gradGreen,
    company: '中華電信',
    verified: true,
    location: '全台',
    role: 'mfg',
    roleLabel: '硬體製造',
    title: '5G 中繼設備 PCB 板代工 (5,000 套)',
    desc: '需具備 PCBA 量產經驗、ISO9001 認證，可接受 30 天交期...',
    budget: 'NT$ 4.5M',
    deadline: '5/20',
    type: '招標案',
    bidders: [
      { letter: '紫', bg: P.gradPink },
      { letter: '紅', bg: P.gradRose },
      { letter: '青', bg: P.gradCyan },
    ],
    bidCount: 12,
  },
  {
    id: '4',
    logoLetter: '統',
    logoBg: P.gradAmber,
    company: '統一超商',
    verified: true,
    location: '台北 / 遠端',
    role: 'mkt',
    roleLabel: '數位行銷',
    title: '夏季新品 Social Media Campaign',
    desc: '需有 IG / TikTok 操盤經驗，含 KOL 合作 + 短影音製作 + 投放優化...',
    budget: 'NT$ 920K',
    deadline: '4/30',
    type: '行銷接案',
    bidders: [
      { letter: '粉', bg: P.gradOrange },
      { letter: '綠', bg: P.gradTeal },
    ],
    bidCount: 6,
  },
];

/* ── Suggested companies ─────────────────────────────────────────────── */
const SUGGESTED_COMPANIES = [
  {
    letter: '沛',
    bg: P.gradCyan,
    name: '沛星互動 (Appier)',
    verified: true,
    meta: 'AI / SaaS · 台北',
    mutual: '🤝 12 個共同合作夥伴',
  },
  {
    letter: '鴻',
    bg: P.gradRose,
    name: '鴻海精密',
    verified: true,
    meta: '電子製造 · 新北土城',
    mutual: '🔥 上週發布 8 個新專案',
  },
  {
    letter: '玉',
    bg: P.gradGreen,
    name: '玉山銀行',
    verified: true,
    meta: '金融 · 台北',
    mutual: '🤝 5 個共同合作夥伴',
  },
  {
    letter: '巨',
    bg: P.gradViolet,
    name: '巨大機械',
    verified: false,
    meta: '機械製造 · 台中',
    mutual: '📍 同產業推薦',
  },
];

/* ── Trending topics ─────────────────────────────────────────────────── */
const TRENDING = [
  { rank: '01', tag: '#AI生成式應用', count: '2,840 個專案 · 248 家企業', delta: '▲ 124%' },
  { rank: '02', tag: '#半導體封測',   count: '1,920 個專案 · 86 家企業',  delta: '▲ 48%' },
  { rank: '03', tag: '#永續ESG',      count: '1,560 個專案 · 312 家企業', delta: '▲ 36%' },
  { rank: '04', tag: '#智慧製造',     count: '1,240 個專案 · 184 家企業', delta: '▲ 22%' },
  { rank: '05', tag: '#跨境電商',     count: '980 個專案 · 156 家企業',   delta: '▲ 18%' },
];

/* ── ProjectCard (mini, used on homepage grid) ──────────────────────── */
function HomeProjCard({ proj, onBid }: { proj: ProjectItem; onBid: () => void }) {
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
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: proj.logoBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 13,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {proj.logoLetter}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
            {proj.company}
            {proj.verified && <VerifiedTick />}
          </div>
          <div style={{ fontSize: 11, color: 'var(--co-text-dim)' }}>📍 {proj.location}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <RoleBadge role={proj.role} label={proj.roleLabel} />
        </div>
      </div>

      {/* Title */}
      <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{proj.title}</div>

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
        {proj.desc}
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          paddingTop: 10,
          borderTop: '1px dashed var(--co-line)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 10, color: 'var(--co-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>預算</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--co-green)' }}>{proj.budget}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 10, color: 'var(--co-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>截標</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--co-amber)' }}>{proj.deadline}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 10, color: 'var(--co-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>類型</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{proj.type}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8 }}>
        {/* Bidder avatars */}
        <div style={{ display: 'flex' }}>
          {proj.bidders.map((b, i) => (
            <div
              key={i}
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: '2px solid var(--co-bg-card)',
                marginLeft: i === 0 ? 0 : -6,
                background: b.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9.5,
                fontWeight: 700,
                color: '#fff',
              }}
            >
              {b.letter}
            </div>
          ))}
        </div>
        <span style={{ fontSize: 11, color: 'var(--co-text-dim)', marginLeft: 2 }}>+{proj.bidCount} 家投標中</span>
        <button
          onClick={onBid}
          aria-label={`應標 ${proj.title}`}
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

// ─── Demo flag ───────────────────────────────────────────────────────────────
// Home dashboard currently renders placeholder design-spec fixtures instead of
// live API data. The VITE_DEMO_HOME flag (default OFF in production) controls
// a visible banner so users always know they are seeing mock content.
// TODO (P3): replace PLACEHOLDER_PROJECTS / SUGGESTED_COMPANIES / TRENDING with
// real hooks (useListings, useContracts, useMyBids) once those endpoints are
// stabilised. Track at: https://github.com/coverones/web-app/issues/XX
const IS_DEMO_HOME = import.meta.env.VITE_DEMO_HOME === 'true' || true; // always ON until real data wired

/* ── Main component ──────────────────────────────────────────────────── */
const Home = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Alex';

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
      {/* ── Demo data notice (shown whenever IS_DEMO_HOME is true) ── */}
      {IS_DEMO_HOME && (
        <div
          role="status"
          aria-live="polite"
          style={{
            margin: '12px 28px 0 28px',
            padding: '10px 16px',
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.35)',
            borderRadius: 10,
            fontSize: 12.5,
            color: 'var(--co-bdg-mfg-text)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span aria-hidden="true">⚠</span>
          目前顯示的數據為展示用範例資料，並非您的真實帳戶資訊。功能持續開發中，敬請期待。
        </div>
      )}
      {/* ── Desktop body grid (1fr + 320px sidebar) ── */}
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
        {/* ══════════ LEFT COLUMN ══════════ */}
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
            {/* Radial glow */}
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
              早安，
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
              ！今天有
              {' '}
              <span style={{ color: 'var(--co-cyan)', fontWeight: 800, WebkitTextFillColor: 'var(--co-cyan)' }}>
                3
              </span>
              {' '}個新專案媒合機會
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--co-text-dim)', margin: 0, position: 'relative' }}>
              你的公司資料完整度 <strong style={{ color: 'var(--co-text)' }}>92%</strong> · 過去 7 天有{' '}
              <strong style={{ color: 'var(--co-cyan)' }}>14 家企業</strong>瀏覽過你的檔案
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', position: 'relative' }}>
              {[
                { label: '📥 收件匣', num: '12' },
                { label: '⏳ 待回應邀請', num: '5' },
                { label: '🤝 進行中合作', num: '8' },
                { label: '💎 我的標案', num: '3' },
              ].map((pill) => (
                <span
                  key={pill.label}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 999,
                    background: 'rgba(15,23,42,0.6)',
                    border: '1px solid var(--co-line-strong)',
                    fontSize: 12,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {pill.label}
                  {' '}
                  <span style={{ fontWeight: 700, color: 'var(--co-cyan)' }}>{pill.num}</span>
                </span>
              ))}
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
              {displayName.charAt(0).toUpperCase()}
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

          {/* Hot section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>
                🔥{' '}
                <span
                  style={{
                    background: P.gradHotTitle,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  本週熱門接案
                </span>
              </div>
              <button
                onClick={() => navigate('/jobs')}
                aria-label="查看全部熱門案件"
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

            {/* Carousel: 3 hero cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1fr 1fr',
                gap: 12,
              }}
              className="hero-carousel"
            >
              {/* Big card */}
              <div
                style={{
                  borderRadius: 14,
                  padding: 18,
                  border: '1px solid var(--co-line-strong)',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: 160,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: 'radial-gradient(400px 200px at 100% 0%, rgba(34,211,238,0.2), transparent), linear-gradient(135deg, var(--co-bg-3), var(--co-bg-card-2))',
                }}
              >
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '3px 8px',
                      borderRadius: 999,
                      background: 'rgba(239,68,68,0.15)',
                      border: '1px solid rgba(239,68,68,0.4)',
                      color: P.textRedLt,
                      fontSize: 10.5,
                      fontWeight: 600,
                    }}
                  >
                    ● 限時 · 4 天截標
                  </span>
                  <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.4, margin: '10px 0 8px 0' }}>
                    智慧工廠 IoT 平台 — 全棧開發團隊招募
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--co-text-dim)', lineHeight: 1.5 }}>
                    某半導體龍頭企業徵求具備 MES/SCADA 整合經驗的接案團隊...
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--co-text-dim)', flexWrap: 'wrap' }}>
                  <span>💰 預算 <strong style={{ color: 'var(--co-text)' }}>NT$ 2,800,000</strong></span>
                  <span>📅 週期 <strong style={{ color: 'var(--co-text)' }}>6 個月</strong></span>
                  <span>🏢 已 <strong style={{ color: 'var(--co-text)' }}>23 家</strong>企業關注</span>
                </div>
              </div>

              {/* Med card */}
              <div
                style={{
                  borderRadius: 14,
                  padding: 18,
                  border: '1px solid var(--co-line-strong)',
                  minHeight: 160,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: 'radial-gradient(300px 200px at 100% 100%, rgba(139,92,246,0.18), transparent), linear-gradient(135deg, var(--co-bg-3), var(--co-bg-card-2))',
                }}
              >
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '3px 8px',
                      borderRadius: 999,
                      background: 'rgba(245,158,11,0.15)',
                      border: '1px solid rgba(245,158,11,0.4)',
                      color: P.textAmberLt,
                      fontSize: 10.5,
                      fontWeight: 600,
                    }}
                  >
                    ⚡ 加急
                  </span>
                  <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.4, margin: '10px 0 8px 0' }}>
                    品牌官網改版 + CMS 整合
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--co-text-dim)' }}>
                  <span>💰 <strong style={{ color: 'var(--co-text)' }}>NT$ 480K</strong></span>
                  <span>📅 <strong style={{ color: 'var(--co-text)' }}>2 個月</strong></span>
                </div>
              </div>

              {/* Sm card */}
              <div
                style={{
                  borderRadius: 14,
                  padding: 18,
                  border: '1px solid var(--co-line-strong)',
                  minHeight: 160,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: 'radial-gradient(300px 200px at 0% 0%, rgba(245,158,11,0.15), transparent), linear-gradient(135deg, var(--co-bg-3), var(--co-bg-card-2))',
                }}
              >
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '3px 8px',
                      borderRadius: 999,
                      background: 'rgba(34,211,238,0.15)',
                      border: '1px solid rgba(34,211,238,0.4)',
                      color: P.textCyan,
                      fontSize: 10.5,
                      fontWeight: 600,
                    }}
                  >
                    🆕 新發布
                  </span>
                  <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.4, margin: '10px 0 8px 0' }}>
                    電商 App UI/UX 重新設計
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--co-text-dim)' }}>
                  <span>💰 <strong style={{ color: 'var(--co-text)' }}>NT$ 320K</strong></span>
                  <span>📅 <strong style={{ color: 'var(--co-text)' }}>3 個月</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended projects */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>
                推薦專案
                {' '}
                <span style={{ color: 'var(--co-text-dim)', fontWeight: 400, fontSize: 13 }}>· 為 奇點科技 量身挑選</span>
              </div>
              <button
                onClick={() => navigate('/jobs')}
                aria-label="前往案件看板篩選"
                style={{
                  fontSize: 12,
                  color: 'var(--co-text-dim)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                篩選 ⚙
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="proj-grid">
              {PLACEHOLDER_PROJECTS.map((proj) => (
                <HomeProjCard
                  key={proj.id}
                  proj={proj}
                  onBid={() => navigate('/jobs')}
                />
              ))}
            </div>
          </div>

          {/* Feed: 企業動態 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>企業動態</div>
              <button
                style={{ fontSize: 12, color: 'var(--co-text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                最新 ▾
              </button>
            </div>

            {/* Feed card 1 */}
            <div
              style={{
                background: 'var(--co-bg-card)',
                border: '1px solid var(--co-line-strong)',
                borderRadius: 'var(--co-card-r)',
                padding: 16,
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div
                  aria-hidden="true"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 9,
                    background: P.gradBlue,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#fff',
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  台
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                    台積電子 <VerifiedTick />
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--co-text-dim)' }}>半導體 · 12,400 位追蹤者</div>
                  <div style={{ fontSize: 11, color: 'var(--co-text-muted)', marginTop: 1 }}>2 小時前 · 🌐 公開</div>
                </div>
                <button
                  aria-label="追蹤台積電子"
                  style={{
                    padding: '5px 12px',
                    borderRadius: 7,
                    border: '1px solid var(--co-accent)',
                    color: P.textIndigoLt,
                    fontSize: 12,
                    fontWeight: 500,
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  + 追蹤
                </button>
              </div>

              <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--co-text)', margin: '12px 0' }}>
                我們正在尋找具備{' '}
                <span style={{ color: P.textViolet, fontWeight: 500 }}>@AI 視覺檢測</span>
                實戰經驗的台灣團隊，協助開發新一代晶圓良率分析平台。歡迎有意願的公司主動聯繫合作 🤝
                <br />
                <span style={{ color: 'var(--co-cyan)' }}>#AI #半導體 #接案媒合 #智慧製造</span>
              </div>

              {/* Attachment */}
              <div
                style={{
                  border: '1px solid var(--co-line)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  background: 'rgba(15,23,42,0.5)',
                  marginBottom: 12,
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 9,
                    background: 'linear-gradient(135deg, var(--co-accent), var(--co-accent-2))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon.File size={20} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>AI 視覺檢測平台開發 — RFP 文件</div>
                  <div style={{ fontSize: 11.5, color: 'var(--co-text-dim)', marginTop: 2 }}>12 頁 PDF · 預算 NT$ 3.2M · 截標 5/15</div>
                </div>
                <button
                  aria-label="查看 RFP 文件"
                  style={{
                    marginLeft: 'auto',
                    padding: '6px 12px',
                    borderRadius: 7,
                    background: 'rgba(99,102,241,0.15)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    fontSize: 12,
                    color: P.textIndigoLt,
                    cursor: 'pointer',
                  }}
                >
                  查看 RFP
                </button>
              </div>

              <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: 'var(--co-text-dim)', padding: '8px 0', borderTop: '1px solid var(--co-line)' }}>
                <span>👍 248 個讚 · 32 家企業已轉發</span>
                <span style={{ marginLeft: 'auto' }}>18 則留言</span>
              </div>
              <div style={{ display: 'flex', gap: 4, paddingTop: 6, borderTop: '1px solid var(--co-line)' }}>
                {['👍 讚', '💬 留言', '🔁 轉發', '📩 私訊洽談'].map((a) => (
                  <button
                    key={a}
                    aria-label={a}
                    style={{
                      flex: 1,
                      padding: 8,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      fontSize: 12.5,
                      color: 'var(--co-text-dim)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--co-text)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--co-text-dim)'; }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Feed card 2 */}
            <div
              style={{
                background: 'var(--co-bg-card)',
                border: '1px solid var(--co-line-strong)',
                borderRadius: 'var(--co-card-r)',
                padding: 16,
                marginTop: 14,
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div
                  aria-hidden="true"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 9,
                    background: P.gradPurple,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#fff',
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  誠
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                    誠品文創 <VerifiedTick />
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--co-text-dim)' }}>零售 / 文創 · 8,200 位追蹤者</div>
                  <div style={{ fontSize: 11, color: 'var(--co-text-muted)', marginTop: 1 }}>5 小時前</div>
                </div>
                <button
                  aria-label="追蹤誠品文創"
                  style={{
                    padding: '5px 12px',
                    borderRadius: 7,
                    border: '1px solid var(--co-accent)',
                    color: P.textIndigoLt,
                    fontSize: 12,
                    fontWeight: 500,
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  + 追蹤
                </button>
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--co-text)', margin: '12px 0' }}>
                和 <span style={{ color: P.textViolet, fontWeight: 500 }}>@奇點科技</span> 合作的會員 App 改版專案順利上線 🎉
                三個月時間，新版下載量提升{' '}
                <strong style={{ color: 'var(--co-green)' }}>+340%</strong>。感謝整個團隊的努力！
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: 'var(--co-text-dim)', padding: '8px 0', borderTop: '1px solid var(--co-line)' }}>
                <span>👍 412 個讚 · 6 位夥伴標註</span>
                <span style={{ marginLeft: 'auto' }}>42 則留言</span>
              </div>
              <div style={{ display: 'flex', gap: 4, paddingTop: 6, borderTop: '1px solid var(--co-line)' }}>
                {['👍 讚', '💬 留言', '🔁 轉發', '📩 私訊洽談'].map((a) => (
                  <button
                    key={a}
                    aria-label={a}
                    style={{
                      flex: 1,
                      padding: 8,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      fontSize: 12.5,
                      color: 'var(--co-text-dim)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--co-text)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--co-text-dim)'; }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ══════════ RIGHT COLUMN ══════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Stats panel */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 'var(--co-card-r)',
              padding: 16,
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              我的接案統計
              <span style={{ fontSize: 11, color: 'var(--co-text-dim)', fontWeight: 400 }}>本月</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: '中標數',    value: '14',   colorClass: 'cyan',   delta: '▲ 23% MoM' },
                { label: '進行中專案', value: '8',    colorClass: 'purple', delta: '▲ 2 vs 上月' },
                { label: '合作企業數', value: '42',   colorClass: 'green',  delta: '▲ 6' },
                { label: '營收 (NT$)', value: '3.2M', colorClass: 'amber',  delta: '▲ 18%' },
              ].map(({ label, value, colorClass, delta }) => {
                const gradMap: Record<string, React.CSSProperties> = {
                  cyan:   { background: P.gradStatCyan,   WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' },
                  purple: { background: P.gradStatPurple, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' },
                  green:  { color: 'var(--co-green)' },
                  amber:  { color: 'var(--co-amber)' },
                };
                return (
                  <div
                    key={label}
                    style={{
                      background: 'rgba(15,23,42,0.6)',
                      border: '1px solid var(--co-line)',
                      borderRadius: 10,
                      padding: 12,
                    }}
                  >
                    <div style={{ fontSize: 10.5, color: 'var(--co-text-dim)' }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: '4px 0 2px 0', ...gradMap[colorClass] }}>{value}</div>
                    <span style={{ fontSize: 10.5, color: 'var(--co-green)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>{delta}</span>
                  </div>
                );
              })}
            </div>

            {/* Progress bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 10, borderTop: '1px solid var(--co-line)', marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                <span style={{ color: 'var(--co-text-dim)' }}>月度目標達成</span>
                <span style={{ fontWeight: 600 }}>68%</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: 'rgba(148,163,184,0.1)', overflow: 'hidden' }}>
                <span style={{ display: 'block', width: '68%', height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, var(--co-accent), var(--co-cyan))' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                <span style={{ color: 'var(--co-text-dim)' }}>企業檔案完整度</span>
                <span style={{ fontWeight: 600 }}>92%</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: 'rgba(148,163,184,0.1)', overflow: 'hidden' }}>
                <span style={{ display: 'block', width: '92%', height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, var(--co-green), var(--co-cyan))' }} />
              </div>
            </div>
          </div>

          {/* Suggested companies */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 'var(--co-card-r)',
              padding: 16,
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              為你推薦的公司
              <span style={{ fontSize: 11, color: 'var(--co-text-dim)', fontWeight: 400, cursor: 'pointer' }}>查看全部</span>
            </h3>
            {SUGGESTED_COMPANIES.map((co, i) => (
              <div
                key={co.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: i === 0 ? '0 0 10px 0' : '10px 0',
                  borderBottom: i < SUGGESTED_COMPANIES.length - 1 ? '1px solid var(--co-line)' : 'none',
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: co.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 13,
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {co.letter}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {co.name}
                    {co.verified && <VerifiedTick />}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--co-text-dim)', marginTop: 1 }}>{co.meta}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--co-text-muted)', marginTop: 2 }}>{co.mutual}</div>
                </div>
                <button
                  aria-label={`連結 ${co.name}`}
                  style={{
                    padding: '5px 11px',
                    borderRadius: 7,
                    background: 'transparent',
                    border: '1px solid var(--co-accent)',
                    color: P.textIndigoLt,
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.1)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  ＋ 連結
                </button>
              </div>
            ))}
          </div>

          {/* Trending */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 'var(--co-card-r)',
              padding: 16,
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              🔥 熱門產業趨勢
              <span style={{ fontSize: 11, color: 'var(--co-text-dim)', fontWeight: 400 }}>本週</span>
            </h3>
            {TRENDING.map((t, i) => (
              <div
                key={t.tag}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: i === 0 ? '0 0 9px 0' : '9px 0',
                  borderBottom: i < TRENDING.length - 1 ? '1px solid var(--co-line)' : 'none',
                }}
              >
                <span style={{ fontSize: 11, color: 'var(--co-text-muted)', width: 16 }}>{t.rank}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--co-cyan)' }}>{t.tag}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--co-text-dim)' }}>{t.count}</div>
                </div>
                <span style={{ fontSize: 10.5, color: 'var(--co-green)' }}>{t.delta}</span>
              </div>
            ))}
          </div>

          {/* Activity ping */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(34,211,238,0.1), rgba(99,102,241,0.05))',
              border: '1px solid rgba(34,211,238,0.3)',
              borderRadius: 'var(--co-card-r)',
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--co-cyan)', marginBottom: 10 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: 'var(--co-cyan)',
                  boxShadow: '0 0 8px var(--co-cyan)',
                  display: 'inline-block',
                }}
              />
              即時活動
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45 }}>
              <strong style={{ color: P.textCyan }}>台積電子</strong> 剛瀏覽了你的公司檔案
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--co-text-dim)', marginTop: 4 }}>12 分鐘前 · 主動聯繫機會</div>
            <button
              aria-label="發送合作邀請給台積電子"
              style={{
                marginTop: 12,
                width: '100%',
                padding: '9px 0',
                borderRadius: 8,
                background: 'linear-gradient(135deg, var(--co-accent-blue), var(--co-accent-2))',
                color: '#fff',
                fontWeight: 600,
                fontSize: 12.5,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              發送合作邀請 →
            </button>
          </div>

        </div>
      </div>

      {/* Mobile: collapse to single column via CSS (overrides grid) */}
      <style>{`
        @media (max-width: 767px) {
          .home-grid {
            grid-template-columns: 1fr !important;
            padding: 12px 16px 80px 16px !important;
          }
          .hero-carousel {
            grid-template-columns: 1fr !important;
          }
          .proj-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .home-grid {
            grid-template-columns: 1fr !important;
          }
          .hero-carousel {
            grid-template-columns: 1fr 1fr !important;
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
