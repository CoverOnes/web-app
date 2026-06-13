import { useState, useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForgotPassword } from '../lib/query';

/**
 * ForgotPasswordPage — /forgot-password
 *
 * Collects an email and calls POST /v1/auth/forgot-password.
 * CRITICAL anti-enumeration: setSent(true) is called in BOTH the success path
 * AND the catch block — the page never reveals whether the email exists.
 * Copy is intentionally generic: "若該信箱存在，重設連結已寄出".
 *
 * Design source: design-reference/chat/project/ForgotPassword.html (card layout)
 * Tokens: --co-* palette from src/index.css.
 */

const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2"/>
    <path d="m3 7 9 6 9-6"/>
  </svg>
);

const SpinnerIcon = () => (
  <span
    aria-hidden="true"
    style={{
      width: 18, height: 18, borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
      animation: 'spin 0.7s linear infinite', display: 'inline-block',
    }}
  />
);

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);

  const emailId = useId();
  const forgotPassword = useForgotPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      await forgotPassword.mutateAsync(email.trim());
    } catch {
      // INTENTIONAL: swallow the error — anti-enumeration.
      // setSent(true) fires in both success and error paths so the page never
      // reveals whether this email address has a registered account.
    }
    // Set sent=true regardless of API outcome (success or error).
    setSent(true);
  };

  // ── Sent confirmation screen ──────────────────────────────────────────────
  if (sent) {
    return (
      <>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div
          style={{
            minHeight: '100vh',
            background: `
              radial-gradient(1100px 700px at 50% 30%, rgba(99,102,241,0.18), transparent 60%),
              radial-gradient(900px 600px at 50% 100%, rgba(34,211,238,0.08), transparent 60%),
              var(--co-bg)
            `,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            position: 'relative',
          }}
        >
          {/* Grid texture */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundImage: `
                linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)
              `,
              backgroundSize: '64px 64px',
              maskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 70%)',
            }}
          />

          <div
            style={{
              background: 'rgba(15,23,42,0.65)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 18,
              padding: '40px 44px',
              width: '100%',
              maxWidth: 480,
              boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset',
              position: 'relative', zIndex: 2, textAlign: 'center',
            }}
          >
            {/* Green checkmark icon */}
            <div
              aria-hidden="true"
              style={{
                width: 64, height: 64, borderRadius: 16, margin: '0 auto 18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(34,211,238,0.1))',
                border: '1px solid rgba(16,185,129,0.4)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--co-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>

            <h1
              style={{
                fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em',
                margin: '0 0 8px', color: 'var(--co-text)',
              }}
            >
              確認信已寄出
            </h1>

            <p
              role="status"
              style={{
                fontSize: 13.5, color: 'var(--co-text-dim)', lineHeight: 1.6,
                margin: '0 0 26px',
              }}
            >
              若該信箱存在，重設連結已寄出。<br />
              請至您的信箱點擊連結以重設密碼。
            </p>

            {/* Success detail list */}
            <div
              style={{
                background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 11, padding: '14px 16px', marginBottom: 24,
                fontSize: 12.5, color: 'var(--co-text-dim)',
                display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left',
              }}
            >
              {[
                '連結 15 分鐘內有效',
                '若未收到信，請檢查垃圾信件匣',
                '一個連結僅可使用一次',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span
                    aria-hidden="true"
                    style={{
                      width: 18, height: 18, borderRadius: 999, flexShrink: 0,
                      background: 'rgba(16,185,129,0.2)', color: 'var(--co-green)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700,
                    }}
                  >
                    ✓
                  </span>
                  {item}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                width: '100%', height: 48, borderRadius: 12,
                background: 'linear-gradient(135deg, #2563EB 0%, #6366F1 50%, #8B5CF6 100%)',
                color: '#fff', fontWeight: 600, fontSize: 15, border: 'none',
                boxShadow: '0 10px 24px rgba(99,102,241,0.4)', cursor: 'pointer',
                minHeight: 44,
              }}
            >
              返回登入
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Email collection form ─────────────────────────────────────────────────
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          minHeight: '100vh',
          background: `
            radial-gradient(1100px 700px at 50% 30%, rgba(99,102,241,0.18), transparent 60%),
            radial-gradient(900px 600px at 50% 100%, rgba(34,211,238,0.08), transparent 60%),
            var(--co-bg)
          `,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          position: 'relative',
        }}
        className="fp-page"
      >
        {/* Grid texture */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `
              linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 70%)',
          }}
        />

        <div
          style={{
            background: 'rgba(15,23,42,0.65)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid var(--co-line-strong)',
            borderRadius: 18,
            padding: '40px 44px',
            width: '100%',
            maxWidth: 480,
            boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset',
            position: 'relative', zIndex: 2,
          }}
          className="fp-card"
        >
          {/* Purple lock icon */}
          <div
            aria-hidden="true"
            style={{
              width: 64, height: 64, borderRadius: 16, margin: '0 auto 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.12))',
              border: '1px solid rgba(139,92,246,0.4)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--co-accent)" strokeWidth="2" aria-hidden="true">
              <rect x="4" y="11" width="16" height="10" rx="2"/>
              <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
            </svg>
          </div>

          <h1
            style={{
              fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em',
              margin: '0 0 8px', textAlign: 'center', color: 'var(--co-text)',
            }}
          >
            忘記密碼
          </h1>
          <p
            style={{
              fontSize: 13.5, color: 'var(--co-text-dim)', lineHeight: 1.6,
              textAlign: 'center', margin: '0 0 26px',
            }}
          >
            輸入您的 Email，我們將寄送密碼重設連結。
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: 14 }}>
              <label
                htmlFor={emailId}
                style={{
                  display: 'block', fontSize: 12, fontWeight: 600,
                  marginBottom: 7, color: 'var(--co-text)',
                }}
              >
                Email
              </label>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px',
                  background: 'var(--co-bg-3)',
                  border: `1px solid ${emailFocus ? 'var(--co-accent)' : 'var(--co-line-strong)'}`,
                  borderRadius: 10,
                  boxShadow: emailFocus ? '0 0 0 4px rgba(99,102,241,0.15)' : 'none',
                  transition: 'border-color 150ms, box-shadow 150ms',
                }}
              >
                <span style={{ color: 'var(--co-text-muted)', display: 'flex', flexShrink: 0 }}>
                  <IconMail />
                </span>
                <input
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={forgotPassword.isPending}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                  aria-required="true"
                  style={{
                    flex: 1, fontSize: 14, background: 'transparent',
                    border: 'none', outline: 'none', color: 'var(--co-text)',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={forgotPassword.isPending}
              style={{
                width: '100%', height: 48, borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #2563EB 0%, #6366F1 50%, #8B5CF6 100%)',
                color: '#fff', fontWeight: 600, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 8px 26px rgba(99,102,241,0.35)',
                cursor: forgotPassword.isPending ? 'wait' : 'pointer',
                opacity: forgotPassword.isPending ? 0.8 : 1,
                transition: 'opacity 150ms',
                marginBottom: 10, minHeight: 44,
              }}
              aria-busy={forgotPassword.isPending}
            >
              {forgotPassword.isPending && <SpinnerIcon />}
              {forgotPassword.isPending ? '寄送中…' : '寄送重設連結'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              disabled={forgotPassword.isPending}
              style={{
                width: '100%', height: 44, borderRadius: 10,
                background: 'transparent',
                border: '1px solid var(--co-line-strong)',
                color: 'var(--co-text-dim)',
                fontSize: 14, fontWeight: 500,
                cursor: 'pointer', minHeight: 44,
              }}
            >
              返回登入
            </button>
          </form>

          <div
            style={{
              textAlign: 'center', fontSize: 13, color: 'var(--co-text-dim)',
              marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--co-line)',
            }}
          >
            想起密碼了？{' '}
            <Link to="/login" style={{ color: '#C7D2FE', fontWeight: 600 }}>
              返回登入
            </Link>
          </div>
        </div>

        <style>{`
          @media (max-width: 767px) {
            .fp-card {
              padding: 28px 24px !important;
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
