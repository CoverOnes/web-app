import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const OwlSVG = () => (
  <svg viewBox="0 0 200 200" width="180" height="180" aria-hidden="true">
    <defs>
      <radialGradient id="owl-grad" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="100%" stopColor="#4338CA" />
      </radialGradient>
    </defs>
    <ellipse cx="100" cy="115" rx="68" ry="72" fill="url(#owl-grad)" />
    <ellipse cx="100" cy="50" rx="50" ry="20" fill="#312E81" />
    <path d="M60 38 L52 18 L72 32 Z" fill="#312E81" />
    <path d="M140 38 L148 18 L128 32 Z" fill="#312E81" />
    <circle cx="78" cy="92" r="32" fill="#fff" />
    <circle cx="122" cy="92" r="32" fill="#fff" />
    <circle cx="88" cy="92" r="14" fill="#0B1220" />
    <circle cx="132" cy="92" r="14" fill="#0B1220" />
    <circle cx="92" cy="89" r="4" fill="#fff" />
    <circle cx="136" cy="89" r="4" fill="#fff" />
    <path d="M100 108 L92 122 L108 122 Z" fill="#FCD34D" />
    <path d="M40 130 Q50 105 70 110 L60 165 Q40 160 40 130 Z" fill="#312E81" opacity="0.7" />
    <path d="M160 130 Q150 105 130 110 L140 165 Q160 160 160 130 Z" fill="#312E81" opacity="0.7" />
    <path
      d="M85 178 L80 192 M95 178 L92 192 M105 178 L108 192 M115 178 L120 192"
      stroke="#FCD34D"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

const SUGGESTIONS = [
  {
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <rect x="3" y="6" width="18" height="14" rx="2" />
        <path d="M8 6V4h8v2" />
      </svg>
    ),
    colorClass: 'p',
    title: '瀏覽接案案件',
    desc: '探索最新案件，立即應標',
    href: '/jobs',
  },
  {
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M3 9h18l-2 11H5L3 9z" />
      </svg>
    ),
    colorClass: 'c',
    title: '我的招標進度',
    desc: '查看進行中的投標狀態',
    href: '/bids',
  },
  {
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M3 3v18h18" />
        <path d="m7 14 3-3 3 3 5-6" />
      </svg>
    ),
    colorClass: 'g',
    title: '數據洞察',
    desc: '查看媒合與成效數據',
    href: '/insights',
  },
];

const SUGGESTION_ICON_COLORS: Record<string, { bg: string; color: string }> = {
  p: { bg: 'rgba(99,102,241,.18)', color: '#A78BFA' },
  c: { bg: 'rgba(34,211,238,.18)', color: '#67E8F9' },
  g: { bg: 'rgba(16,185,129,.18)', color: '#6EE7B7' },
};

export default function NotFoundPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `
          radial-gradient(1100px 700px at 50% 30%, rgba(99,102,241,.18), transparent 60%),
          radial-gradient(900px 600px at 50% 90%, rgba(34,211,238,.08), transparent 60%),
          var(--co-bg)
        `,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', 'Noto Sans TC', sans-serif",
        color: 'var(--co-text)',
      }}
    >
      {/* Grid bg */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(148,163,184,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,.04) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 70%)',
        }}
      />

      {/* Topnav */}
      <div
        style={{
          position: 'absolute',
          top: 30,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 clamp(20px, 4vw, 56px)',
          zIndex: 5,
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            aria-hidden="true"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg,var(--co-accent),var(--co-accent-2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 24px rgba(99,102,241,.4)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="9" cy="10" r="2.4" fill="#fff" />
              <circle cx="15" cy="10" r="2.4" fill="#fff" />
              <circle cx="9" cy="10" r="1" fill="#0B1220" />
              <circle cx="15" cy="10" r="1" fill="#0B1220" />
              <path
                d="M11 14.5 L12 16 L13 14.5"
                stroke="#fff"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>
              ChatOwl
            </div>
            <div style={{ fontSize: 11, color: 'var(--co-text-dim)' }}>B2B 接案媒合</div>
          </div>
        </div>
        <Link
          to="/help"
          style={{
            fontSize: 13,
            color: 'var(--co-text-dim)',
            padding: '8px 14px',
            borderRadius: 8,
            textDecoration: 'none',
          }}
        >
          需要協助？
        </Link>
      </div>

      {/* Main stack */}
      <div
        style={{
          width: '100%',
          maxWidth: 760,
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
          padding: '0 clamp(20px, 4vw, 40px)',
          marginTop: 80,
        }}
      >
        {/* 404 + owl */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 28,
          }}
          aria-label="404"
        >
          <div
            aria-hidden="true"
            style={{
              fontSize: 'clamp(80px, 15vw, 200px)',
              fontWeight: 900,
              letterSpacing: '-0.06em',
              lineHeight: 1,
              background: 'linear-gradient(180deg, #6366F1 0%, #8B5CF6 50%, #312E81 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            4
          </div>
          <div
            style={{
              position: 'relative',
              width: 'clamp(100px, 18vw, 180px)',
              height: 'clamp(100px, 18vw, 180px)',
            }}
          >
            <OwlSVG />
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: -6,
                right: 14,
                fontSize: 36,
                fontWeight: 800,
                color: '#FCD34D',
                textShadow: '0 0 16px rgba(252,211,77,.5)',
                animation: 'bob-q 2s ease-in-out infinite',
              }}
            >
              ?
            </span>
          </div>
          <div
            aria-hidden="true"
            style={{
              fontSize: 'clamp(80px, 15vw, 200px)',
              fontWeight: 900,
              letterSpacing: '-0.06em',
              lineHeight: 1,
              background: 'linear-gradient(180deg, #6366F1 0%, #8B5CF6 50%, #312E81 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            4
          </div>
        </div>

        <h1
          style={{
            fontSize: 'clamp(22px, 4vw, 34px)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            margin: '0 0 12px',
          }}
        >
          這隻貓頭鷹也找不到這頁 🦉
        </h1>
        <p
          style={{
            fontSize: 15,
            color: 'var(--co-text-dim)',
            lineHeight: 1.65,
            maxWidth: 520,
            margin: '0 auto 28px',
          }}
        >
          您訪問的頁面可能已被移除、改名，或者從來不存在。要不要試試以下幾條路？
        </p>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          role="search"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '13px 16px',
            background: 'rgba(15,23,42,.7)',
            border: '1px solid var(--co-line-strong)',
            borderRadius: 12,
            maxWidth: 480,
            margin: '0 auto 28px',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            style={{ color: 'var(--co-text-muted)', flexShrink: 0 }}
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋專案、公司、文件..."
            aria-label="搜尋"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--co-text)',
              fontSize: 14,
              minWidth: 0,
            }}
          />
          <span
            aria-hidden="true"
            style={{
              padding: '3px 7px',
              borderRadius: 5,
              background: 'var(--co-bg-3)',
              border: '1px solid var(--co-line)',
              fontSize: 10.5,
              color: 'var(--co-text-muted)',
              fontFamily: "'Menlo', monospace",
              flexShrink: 0,
            }}
          >
            ⌘K
          </span>
        </form>

        {/* CTA buttons */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            marginBottom: 36,
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: '13px 22px',
              borderRadius: 10,
              fontSize: 13.5,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              border: '1px solid var(--co-line-strong)',
              color: 'var(--co-text-dim)',
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            ← 返回上一頁
          </button>
          <Link
            to="/jobs"
            style={{
              padding: '13px 22px',
              borderRadius: 10,
              fontSize: 13.5,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg,var(--co-accent),var(--co-accent-2))',
              color: '#fff',
              boxShadow: '0 8px 26px rgba(99,102,241,.35)',
              textDecoration: 'none',
              minHeight: 44,
            }}
          >
            回首頁 →
          </Link>
        </div>

        {/* Suggestions */}
        <div
          style={{
            fontSize: 11,
            color: 'var(--co-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            fontWeight: 700,
            marginBottom: 14,
          }}
        >
          您可能在找這些
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
            maxWidth: 680,
            margin: '0 auto',
          }}
        >
          {SUGGESTIONS.map((sg) => {
            const colors = SUGGESTION_ICON_COLORS[sg.colorClass];
            return (
              <Link
                key={sg.href}
                to={sg.href}
                style={{
                  background: 'rgba(15,23,42,.6)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid var(--co-line)',
                  borderRadius: 12,
                  padding: 16,
                  textAlign: 'left',
                  textDecoration: 'none',
                  display: 'block',
                  color: 'var(--co-text)',
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                    background: colors.bg,
                    color: colors.color,
                  }}
                >
                  {sg.icon}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{sg.title}</div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: 'var(--co-text-dim)',
                    marginTop: 3,
                    lineHeight: 1.5,
                  }}
                >
                  {sg.desc}
                </div>
              </Link>
            );
          })}
        </div>

        <div style={{ marginTop: 30, fontSize: 12, color: 'var(--co-text-muted)' }}>
          錯誤代碼：
          <code style={{ fontFamily: "'Menlo', monospace", color: '#A78BFA' }}>
            CO_NOT_FOUND_404
          </code>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 30,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 18,
          fontSize: 11.5,
          color: 'var(--co-text-muted)',
          zIndex: 2,
          flexWrap: 'wrap',
          padding: '0 20px',
        }}
      >
        <a href="#" style={{ color: 'var(--co-text-muted)' }}>
          服務條款
        </a>
        <a href="#" style={{ color: 'var(--co-text-muted)' }}>
          隱私政策
        </a>
        <Link to="/help" style={{ color: 'var(--co-text-muted)', textDecoration: 'none' }}>
          回報問題
        </Link>
        <span>© 2026 ChatOwl Inc.</span>
      </div>

      <style>{`
        @keyframes bob-q {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
