import { useState, useEffect, useRef } from 'react';

const LOG_ENTRIES = [
  { ts: '11:42:18', tagClass: 'in', tagLabel: 'DEPLOY', msg: 'AI 媒合模型 v2.4.0 開始部署，預估 12 分鐘' },
  { ts: '11:36:02', tagClass: 'ok', tagLabel: 'DONE', msg: '媒合引擎服務已成功遷移到新叢集' },
  { ts: '11:24:55', tagClass: 'wn', tagLabel: 'NOTE', msg: '郵件通知服務暫停發送，預計於完成後 5 分鐘內補發' },
  { ts: '11:18:30', tagClass: 'ok', tagLabel: 'DONE', msg: '資料庫升級完成，0 件資料異動，回讀驗證通過' },
  { ts: '11:00:00', tagClass: 'in', tagLabel: 'START', msg: '維護視窗開始，所有服務切換至唯讀模式' },
];

const TAG_STYLES: Record<string, React.CSSProperties> = {
  ok: {
    background: 'rgba(16,185,129,.18)',
    color: 'var(--co-green)',
    border: '1px solid rgba(16,185,129,.3)',
  },
  in: {
    background: 'rgba(34,211,238,.18)',
    color: '#67E8F9',
    border: '1px solid rgba(34,211,238,.3)',
  },
  wn: {
    background: 'rgba(245,158,11,.18)',
    color: '#FCD34D',
    border: '1px solid rgba(245,158,11,.3)',
  },
};

interface CountdownState {
  hours: number;
  minutes: number;
  seconds: number;
}

function useCountdown(targetMinutesFromNow: number): CountdownState {
  const endTimeRef = useRef<number>(Date.now() + targetMinutesFromNow * 60 * 1000);
  const [remaining, setRemaining] = useState<CountdownState>(() => {
    const diff = Math.max(0, endTimeRef.current - Date.now());
    return {
      hours: Math.floor(diff / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  });

  useEffect(() => {
    const id = setInterval(() => {
      const diff = Math.max(0, endTimeRef.current - Date.now());
      setRemaining({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return remaining;
}

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div
      style={{
        background: 'rgba(15,23,42,.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--co-line-strong)',
        borderRadius: 14,
        padding: '18px 14px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 'clamp(28px, 6vw, 42px)',
          fontWeight: 800,
          letterSpacing: '-0.025em',
          fontFamily: "'JetBrains Mono', monospace",
          background: 'linear-gradient(180deg,#FCD34D,#F59E0B)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
        }}
      >
        {String(value).padStart(2, '0')}
      </div>
      <div
        style={{
          fontSize: 11,
          color: 'var(--co-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginTop: 8,
          fontWeight: 700,
        }}
      >
        {label}
      </div>
    </div>
  );
}

interface NotifyFormProps {
  onSubmit: (email: string) => void;
}

function NotifyForm({ onSubmit }: NotifyFormProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    onSubmit(email);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        style={{
          padding: '10px 20px',
          borderRadius: 10,
          background: 'rgba(16,185,129,.12)',
          border: '1px solid rgba(16,185,129,.3)',
          color: 'var(--co-green)',
          fontSize: 13.5,
          fontWeight: 600,
        }}
      >
        ✓ 已登記，完成後將通知您
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="輸入 Email 以收到通知"
        aria-label="Email 地址"
        required
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid var(--co-line-strong)',
          background: 'rgba(15,23,42,.7)',
          color: 'var(--co-text)',
          fontSize: 13.5,
          outline: 'none',
          minWidth: 0,
        }}
      />
      <button
        type="submit"
        style={{
          padding: '10px 18px',
          borderRadius: 10,
          border: '1px solid var(--co-line-strong)',
          background: 'transparent',
          color: 'var(--co-text-dim)',
          fontSize: 13.5,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          boxSizing: 'border-box',
        }}
      >
        完成時通知我
      </button>
    </form>
  );
}

const GearSVG = () => (
  <svg viewBox="0 0 240 200" width="240" height="200" aria-hidden="true">
    <defs>
      <linearGradient id="gA" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FCD34D" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      <linearGradient id="gB" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
    </defs>
    <ellipse cx="120" cy="180" rx="90" ry="10" fill="rgba(99,102,241,.15)" />
    <rect x="56" y="110" width="128" height="10" rx="4" fill="#1E293B" stroke="#334155" strokeWidth="1" />
    {/* Left big gear - animated via CSS */}
    <g style={{ animation: 'gear-spin 9s linear infinite', transformOrigin: '72px 92px' }}>
      <g transform="translate(72 92)">
        <circle r="38" fill="url(#gB)" />
        <circle r="22" fill="#1E293B" />
        <circle r="6" fill="#A78BFA" />
        <g fill="url(#gB)">
          <rect x="-6" y="-44" width="12" height="14" rx="2" />
          <rect x="-6" y="30" width="12" height="14" rx="2" />
          <rect x="-44" y="-6" width="14" height="12" rx="2" />
          <rect x="30" y="-6" width="14" height="12" rx="2" />
        </g>
      </g>
    </g>
    {/* Right small gear - reverse */}
    <g style={{ animation: 'gear-spin-r 12s linear infinite reverse', transformOrigin: '168px 88px' }}>
      <g transform="translate(168 88)">
        <circle r="26" fill="url(#gA)" />
        <circle r="14" fill="#1E293B" />
        <circle r="4" fill="#FCD34D" />
        <g fill="url(#gA)">
          <rect x="-4" y="-30" width="8" height="10" rx="1.5" />
          <rect x="-4" y="20" width="8" height="10" rx="1.5" />
          <rect x="-30" y="-4" width="10" height="8" rx="1.5" />
          <rect x="20" y="-4" width="10" height="8" rx="1.5" />
        </g>
      </g>
    </g>
    <circle cx="116" cy="78" r="3" fill="#FCD34D" opacity=".8" />
    <circle cx="130" cy="62" r="2" fill="#67E8F9" opacity=".6" />
    <circle cx="98" cy="50" r="2.5" fill="#F9A8D4" opacity=".7" />
  </svg>
);

export default function MaintenancePage() {
  const countdown = useCountdown(88); // ~1h 28min from page load

  function handleNotify(email: string) {
    // In production this would call an API endpoint
    console.info('[MaintenancePage] Notify registered for:', email);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `
          radial-gradient(1200px 700px at 50% 20%, rgba(245,158,11,.12), transparent 60%),
          radial-gradient(900px 600px at 50% 90%, rgba(99,102,241,.10), transparent 60%),
          var(--co-bg)
        `,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '50px 0',
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
          maskImage:
            'radial-gradient(ellipse at center, #000 30%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, #000 30%, transparent 75%)',
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
            <div style={{ fontSize: 18, fontWeight: 800 }}>ChatOwl</div>
            <div style={{ fontSize: 11, color: 'var(--co-text-dim)' }}>B2B 接案媒合</div>
          </div>
        </div>
        <div
          role="status"
          aria-label="計畫性維護進行中"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 14px',
            background: 'rgba(245,158,11,.12)',
            border: '1px solid rgba(245,158,11,.4)',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            color: '#FCD34D',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: 'var(--co-amber)',
              boxShadow: '0 0 10px var(--co-amber)',
              animation: 'pulse-dot 1.6s ease-in-out infinite',
              display: 'block',
            }}
          />
          計畫性維護進行中
        </div>
      </div>

      {/* Main content stack */}
      <div
        style={{
          width: '100%',
          maxWidth: 880,
          position: 'relative',
          zIndex: 2,
          padding: '0 clamp(20px, 4vw, 40px)',
          marginTop: 80,
        }}
      >
        {/* Gear illustration */}
        <div
          style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}
        >
          <GearSVG />
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: 'clamp(28px, 5vw, 42px)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            margin: '0 0 12px',
            textAlign: 'center',
            lineHeight: 1.15,
          }}
        >
          我們正在
          <span
            style={{
              background: 'linear-gradient(135deg,#FCD34D,#F59E0B,#EC4899)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            升級平台
          </span>
          <br />
          讓 ChatOwl 變更好
        </h1>
        <p
          style={{
            fontSize: 15,
            color: 'var(--co-text-dim)',
            lineHeight: 1.65,
            textAlign: 'center',
            maxWidth: 580,
            margin: '0 auto 30px',
          }}
        >
          我們正進行計畫性系統升級，將同步推出「AI 投標助手 v2」與更精準的媒合演算法。預期在
          90 分鐘內完成，期間會員資料完全不受影響。
        </p>

        {/* Countdown */}
        <div
          role="timer"
          aria-label="維護倒數計時"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 14,
            maxWidth: 520,
            margin: '0 auto 32px',
          }}
        >
          <CountdownBox value={0} label="天" />
          <CountdownBox value={countdown.hours} label="小時" />
          <CountdownBox value={countdown.minutes} label="分" />
          <CountdownBox value={countdown.seconds} label="秒" />
        </div>

        {/* Progress card */}
        <div
          style={{
            background: 'rgba(15,23,42,.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--co-line-strong)',
            borderRadius: 14,
            padding: '22px 26px',
            maxWidth: 680,
            margin: '0 auto 28px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700 }}>升級進度</div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                background: 'linear-gradient(135deg,#67E8F9,#A78BFA)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              68%
            </div>
          </div>
          <div
            role="progressbar"
            aria-valuenow={68}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="升級進度 68%"
            style={{
              height: 10,
              background: 'rgba(15,23,42,.8)',
              border: '1px solid var(--co-line)',
              borderRadius: 5,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                height: '100%',
                width: '68%',
                background: 'linear-gradient(90deg,#06B6D4,#6366F1,#A78BFA)',
                borderRadius: 4,
                position: 'relative',
                boxShadow: '0 0 12px rgba(99,102,241,.5)',
                animation: 'progress-stream 1.8s linear infinite',
              }}
            />
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              marginTop: 16,
            }}
          >
            {[
              { label: '✓ 資料庫遷移', type: 'done' },
              { label: '✓ 媒合引擎部署', type: 'done' },
              { label: '⟳ AI 模型上線中', type: 'active' },
              { label: '服務驗證', type: 'todo' },
            ].map(({ label, type }) => {
              const stgStyles: Record<string, React.CSSProperties> = {
                done: {
                  color: 'var(--co-green)',
                  background: 'rgba(16,185,129,.08)',
                  border: '1px solid rgba(16,185,129,.3)',
                },
                active: {
                  color: '#67E8F9',
                  background: 'rgba(34,211,238,.1)',
                  border: '1px solid rgba(34,211,238,.4)',
                  fontWeight: 700,
                },
                todo: {
                  color: 'var(--co-text-muted)',
                  border: '1px solid var(--co-line)',
                },
              };
              return (
                <div
                  key={label}
                  style={{
                    fontSize: 11,
                    padding: 7,
                    textAlign: 'center',
                    borderRadius: 7,
                    ...stgStyles[type],
                  }}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Notify form */}
        <div
          style={{
            maxWidth: 560,
            margin: '0 auto 30px',
          }}
        >
          <NotifyForm onSubmit={handleNotify} />
        </div>

        {/* Live update log */}
        <div
          aria-live="polite"
          style={{
            background: 'rgba(15,23,42,.6)',
            border: '1px solid var(--co-line)',
            borderRadius: 12,
            padding: '16px 18px',
            maxWidth: 680,
            margin: '0 auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: 12,
              borderBottom: '1px solid var(--co-line)',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--co-text-dim)',
              }}
            >
              即時更新日誌
            </div>
            <div
              style={{
                fontSize: 10.5,
                color: 'var(--co-green)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: 'var(--co-green)',
                  boxShadow: '0 0 6px var(--co-green)',
                  animation: 'pulse-dot 1.6s infinite',
                  display: 'block',
                }}
              />
              LIVE
            </div>
          </div>
          {LOG_ENTRIES.map((entry) => (
            <div
              key={entry.ts}
              style={{
                display: 'grid',
                gridTemplateColumns: '70px 90px 1fr',
                gap: 14,
                padding: '7px 0',
                fontSize: 12,
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'var(--co-text-muted)',
                }}
              >
                {entry.ts}
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  padding: '2px 8px',
                  borderRadius: 5,
                  fontWeight: 600,
                  textAlign: 'center',
                  height: 'fit-content',
                  ...TAG_STYLES[entry.tagClass],
                }}
              >
                {entry.tagLabel}
              </span>
              <span style={{ color: 'var(--co-text-dim)', lineHeight: 1.55 }}>
                {entry.msg}
              </span>
            </div>
          ))}
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
        <a
          href="https://status.chatowl.com"
          style={{ color: 'var(--co-green)' }}
          target="_blank"
          rel="noreferrer"
        >
          ● 狀態頁
        </a>
        <a href="#" style={{ color: 'var(--co-text-muted)' }}>
          服務條款
        </a>
        <a href="#" style={{ color: 'var(--co-text-muted)' }}>
          緊急聯絡
        </a>
        <span>© 2026 ChatOwl Inc.</span>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes pulse-dot {
          50% { opacity: .4; }
        }
        @keyframes gear-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes gear-spin-r {
          to { transform: rotate(-360deg); }
        }
        @keyframes progress-stream {
          from { background-position: -200px 0; }
          to   { background-position: 200px 0; }
        }
      `}</style>
    </div>
  );
}
