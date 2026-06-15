/**
 * WaitlistPage — 候補名單申請
 *
 * Route: /waitlist (public, no auth required)
 *
 * Design: No dedicated Waitlist.html in design-reference/. Built following the
 * Login/Register split-layout visual language (left hero | right card) using
 * the same --co-* design tokens from src/index.css and shared.css.
 *
 * API: POST /v1/waitlist { email, company?, interestedIn? }
 *   - /v1/waitlist is a public gateway route; no Authorization header attached.
 *   - Duplicate email returns 202 (privacy-preserving) — treated as success.
 *   - Any 2xx resolves as "已加入候補"; never leaks whether email already existed.
 *
 * Auth interceptor: /v1/waitlist is NOT in isAuthFlowRequest. That function only
 * guards 401-triggered refresh loops. This route never returns 401 (public endpoint),
 * so no interceptor change is required.
 *
 * ARIA: inputs labelled via htmlFor/id, error has role="alert",
 *       success has role="status", submit has aria-busy.
 * RWD: hero hidden on mobile (<768 px), card full-width.
 */

import { useState, useId } from 'react';
import { Link } from 'react-router-dom';
import { useJoinWaitlist } from '../lib/query';

// ─── SVG atoms ────────────────────────────────────────────────────────────────

const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2"/>
    <path d="m3 7 9 6 9-6"/>
  </svg>
);

const IconBuilding = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M9 21V9h6v12"/>
    <path d="M9 9h6"/>
  </svg>
);

const IconStar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 5l7 7-7 7"/>
  </svg>
);

const IconCheckCircle = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const OwlMark = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="9" cy="10" r="2.4" fill="#fff"/>
    <circle cx="15" cy="10" r="2.4" fill="#fff"/>
    <circle cx="9" cy="10" r="1" fill="#0B1220"/>
    <circle cx="15" cy="10" r="1" fill="#0B1220"/>
    <path d="M11 14.5 L12 16 L13 14.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M12 4 L13.6 5.6 M12 4 L10.4 5.6" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

// ─── Main component ───────────────────────────────────────────────────────────

const WaitlistPage = () => {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [interestedIn, setInterestedIn] = useState('');
  const [emailFocus, setEmailFocus] = useState(false);
  const [companyFocus, setCompanyFocus] = useState(false);
  const [interestedInFocus, setInterestedInFocus] = useState(false);
  const [validationError, setValidationError] = useState('');

  const emailId = useId();
  const companyId = useId();
  const interestedInId = useId();
  const errorId = useId();

  const { mutate, isPending, isSuccess, isError, error } = useJoinWaitlist();

  // Derive a display-friendly network error message.
  // Any 2xx (including 202 duplicate) is already success — this branch only fires
  // on genuine network/server errors (5xx, connection refused, etc.).
  const networkError: string | null = (() => {
    if (!isError || !error) return null;
    const axiosLike = error as { response?: { data?: { error?: { message?: string }; message?: string } }; message?: string };
    return (
      axiosLike.response?.data?.error?.message ??
      axiosLike.response?.data?.message ??
      axiosLike.message ??
      '提交失敗，請稍後再試。'
    );
  })();

  const displayError = validationError || networkError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setValidationError('請輸入 Email。');
      return;
    }
    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setValidationError('請輸入有效的 Email 格式。');
      return;
    }

    mutate({
      email: trimmedEmail,
      company: company.trim() || undefined,
      interestedIn: interestedIn.trim() || undefined,
    });
  };

  return (
    <>
      <style>{`
        @keyframes wlFloat1 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes wlFloat2 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          background: `
            radial-gradient(1200px 700px at 20% 30%, rgba(99,102,241,0.18), transparent 60%),
            radial-gradient(1000px 600px at 90% 80%, rgba(139,92,246,0.14), transparent 60%),
            radial-gradient(800px 600px at 50% 100%, rgba(34,211,238,0.06), transparent 50%),
            var(--co-bg)
          `,
          position: 'relative',
          overflow: 'hidden',
        }}
        className="wl-page"
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

        {/* ── LEFT: Hero ── */}
        <section
          aria-hidden="true"
          style={{
            position: 'relative', padding: '36px 56px',
            display: 'flex', flexDirection: 'column', minHeight: '100vh',
          }}
          className="wl-hero"
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 4 }}>
            <div
              style={{
                width: 40, height: 40, borderRadius: 11,
                background: 'linear-gradient(135deg, #2563EB, #8B5CF6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(99,102,241,0.35), 0 0 0 1px rgba(255,255,255,0.06) inset',
              }}
            >
              <OwlMark />
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--co-text)' }}>CoverOnes</div>
              <div style={{ fontSize: 12, color: 'var(--co-text-dim)', marginTop: 1, letterSpacing: '0.02em' }}>企業即時通訊・接案媒合平台</div>
            </div>
          </div>

          {/* Hero body */}
          <div
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
              maxWidth: 640, position: 'relative', zIndex: 2,
            }}
          >
            {/* Eyebrow badge */}
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '5px 11px 5px 6px', borderRadius: 999,
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
                fontSize: 12, color: '#C7D2FE', width: 'fit-content', marginBottom: 22,
              }}
            >
              <span
                style={{
                  width: 18, height: 18, borderRadius: 999,
                  background: 'linear-gradient(135deg, var(--co-accent), var(--co-accent-2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 10, fontWeight: 600,
                }}
              >搶</span>
              <span>搶先體驗 CoverOnes 企業平台</span>
            </div>

            {/* Tagline */}
            <h1
              style={{
                fontFamily: "'Noto Sans TC','Inter',sans-serif",
                fontWeight: 700, fontSize: 'clamp(36px, 4vw, 56px)',
                lineHeight: 1.1, letterSpacing: '-0.025em', margin: '0 0 20px 0',
                background: 'linear-gradient(180deg, #FFFFFF 0%, #C7D2FE 100%)',
                WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
              }}
            >
              加入候補
              <span style={{ color: 'var(--co-accent)', WebkitTextFillColor: 'var(--co-accent)', margin: '0 6px' }}>．</span>
              優先開通
            </h1>

            <p style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--co-text-dim)', maxWidth: 520, margin: '0 0 36px 0', fontWeight: 400 }}>
              CoverOnes 即將正式上線。留下您的 Email，我們將在開放名額時優先通知您，讓您第一時間體驗企業媒合與協作平台。
            </p>

            {/* Feature list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 28, borderTop: '1px solid var(--co-line)' }}>
              {[
                { label: '統編驗證企業身份，安心媒合' },
                { label: 'AI 智慧推薦合適合作夥伴' },
                { label: '端對端加密合約簽署' },
                { label: '發票管理與結算一站處理' },
              ].map(({ label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      width: 20, height: 20, borderRadius: 999,
                      background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--co-accent)', flexShrink: 0, fontSize: 11,
                    }}
                  >✓</span>
                  <span style={{ fontSize: 14, color: 'var(--co-text-dim)', fontWeight: 500 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── RIGHT: Waitlist card ── */}
        <section style={{ padding: '36px 56px 36px 0', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }} className="wl-right">
          {/* Top actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 999,
                background: 'rgba(15,23,42,0.6)', border: '1px solid var(--co-line)',
                fontSize: 12, color: 'var(--co-text-dim)', backdropFilter: 'blur(10px)',
              }}
            >
              已有帳號？
              <Link to="/login" style={{ color: '#C7D2FE', fontWeight: 600 }}>登入</Link>
            </span>
          </div>

          {/* Card wrap */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                width: 480,
                background: 'linear-gradient(180deg, rgba(15,23,42,0.85) 0%, rgba(11,18,32,0.85) 100%)',
                border: '1px solid rgba(148,163,184,0.16)', borderRadius: 20,
                padding: '36px 36px 28px 36px',
                backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 -1px 0 rgba(255,255,255,0.06) inset',
                position: 'relative',
              }}
            >
              {/* Success state */}
              {isSuccess ? (
                <div style={{ textAlign: 'center', padding: '24px 0 8px 0' }}>
                  <div
                    role="status"
                    aria-live="polite"
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
                    }}
                  >
                    <span
                      style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--co-green)',
                      }}
                    >
                      <IconCheckCircle />
                    </span>
                    <h2
                      style={{
                        fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em',
                        margin: 0, color: 'var(--co-text)',
                      }}
                    >
                      已加入候補！
                    </h2>
                    <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--co-text-dim)', margin: 0, maxWidth: 340 }}>
                      感謝您的申請。我們會在開放名額時以 Email 通知您，請留意收件匣。
                    </p>
                    <Link
                      to="/login"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        marginTop: 8, padding: '10px 20px', borderRadius: 10,
                        background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                        color: '#C7D2FE', fontSize: 13, fontWeight: 500,
                        textDecoration: 'none',
                      }}
                    >
                      返回登入
                      <IconArrowRight />
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px 0', color: 'var(--co-text)' }}>
                    申請加入候補名單
                  </h2>
                  <p style={{ fontSize: 13.5, color: 'var(--co-text-dim)', margin: '0 0 26px 0' }}>
                    留下您的資訊，搶先體驗 CoverOnes 企業媒合平台。
                  </p>

                  {/* Error banner */}
                  {displayError && (
                    <div
                      id={errorId}
                      role="alert"
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                        padding: '10px 14px', marginBottom: 16,
                        background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 10, fontSize: 13, color: '#FCA5A5',
                      }}
                    >
                      {displayError}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} noValidate aria-describedby={displayError ? errorId : undefined}>
                    {/* Email — required */}
                    <div style={{ marginBottom: 14 }}>
                      <label
                        htmlFor={emailId}
                        style={{
                          display: 'block', fontSize: 12, color: 'var(--co-text-dim)',
                          marginBottom: 7, fontWeight: 500,
                        }}
                      >
                        電子郵件
                        <span style={{ color: 'var(--co-red)', marginLeft: 4 }} aria-hidden="true">*</span>
                      </label>
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          height: 46, padding: '0 14px',
                          background: emailFocus ? 'rgba(6,10,20,0.8)' : 'rgba(6,10,20,0.6)',
                          border: `1px solid ${emailFocus ? 'var(--co-accent)' : 'var(--co-line-strong)'}`,
                          borderRadius: 11,
                          boxShadow: emailFocus ? '0 0 0 4px rgba(99,102,241,0.16)' : 'none',
                          transition: 'border-color 150ms, box-shadow 150ms, background 150ms',
                        }}
                      >
                        <span style={{ color: 'var(--co-text-muted)', display: 'flex', flexShrink: 0 }}>
                          <IconMail />
                        </span>
                        <input
                          id={emailId}
                          type="email"
                          autoComplete="email"
                          placeholder="company@example.com.tw"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isPending}
                          onFocus={() => setEmailFocus(true)}
                          onBlur={() => setEmailFocus(false)}
                          aria-required="true"
                          aria-invalid={validationError ? true : undefined}
                          aria-describedby={validationError ? errorId : undefined}
                          style={{
                            flex: 1, fontSize: 14, background: 'transparent',
                            border: 'none', outline: 'none', color: 'var(--co-text)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Company — optional */}
                    <div style={{ marginBottom: 14 }}>
                      <label
                        htmlFor={companyId}
                        style={{
                          display: 'block', fontSize: 12, color: 'var(--co-text-dim)',
                          marginBottom: 7, fontWeight: 500,
                        }}
                      >
                        公司名稱
                        <span style={{ color: 'var(--co-text-muted)', marginLeft: 4, fontWeight: 400 }}>（選填）</span>
                      </label>
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          height: 46, padding: '0 14px',
                          background: companyFocus ? 'rgba(6,10,20,0.8)' : 'rgba(6,10,20,0.6)',
                          border: `1px solid ${companyFocus ? 'var(--co-accent)' : 'var(--co-line-strong)'}`,
                          borderRadius: 11,
                          boxShadow: companyFocus ? '0 0 0 4px rgba(99,102,241,0.16)' : 'none',
                          transition: 'border-color 150ms, box-shadow 150ms, background 150ms',
                        }}
                      >
                        <span style={{ color: 'var(--co-text-muted)', display: 'flex', flexShrink: 0 }}>
                          <IconBuilding />
                        </span>
                        <input
                          id={companyId}
                          type="text"
                          autoComplete="organization"
                          placeholder="台灣科技股份有限公司"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          disabled={isPending}
                          onFocus={() => setCompanyFocus(true)}
                          onBlur={() => setCompanyFocus(false)}
                          style={{
                            flex: 1, fontSize: 14, background: 'transparent',
                            border: 'none', outline: 'none', color: 'var(--co-text)',
                          }}
                        />
                      </div>
                    </div>

                    {/* interestedIn — optional */}
                    <div style={{ marginBottom: 24 }}>
                      <label
                        htmlFor={interestedInId}
                        style={{
                          display: 'block', fontSize: 12, color: 'var(--co-text-dim)',
                          marginBottom: 7, fontWeight: 500,
                        }}
                      >
                        感興趣的功能
                        <span style={{ color: 'var(--co-text-muted)', marginLeft: 4, fontWeight: 400 }}>（選填）</span>
                      </label>
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          height: 46, padding: '0 14px',
                          background: interestedInFocus ? 'rgba(6,10,20,0.8)' : 'rgba(6,10,20,0.6)',
                          border: `1px solid ${interestedInFocus ? 'var(--co-accent)' : 'var(--co-line-strong)'}`,
                          borderRadius: 11,
                          boxShadow: interestedInFocus ? '0 0 0 4px rgba(99,102,241,0.16)' : 'none',
                          transition: 'border-color 150ms, box-shadow 150ms, background 150ms',
                        }}
                      >
                        <span style={{ color: 'var(--co-text-muted)', display: 'flex', flexShrink: 0 }}>
                          <IconStar />
                        </span>
                        <input
                          id={interestedInId}
                          type="text"
                          placeholder="媒合平台、合約簽署、聊天功能…"
                          value={interestedIn}
                          onChange={(e) => setInterestedIn(e.target.value)}
                          disabled={isPending}
                          onFocus={() => setInterestedInFocus(true)}
                          onBlur={() => setInterestedInFocus(false)}
                          style={{
                            flex: 1, fontSize: 14, background: 'transparent',
                            border: 'none', outline: 'none', color: 'var(--co-text)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Submit CTA */}
                    <button
                      type="submit"
                      disabled={isPending}
                      aria-busy={isPending}
                      style={{
                        width: '100%', height: 48, borderRadius: 12, border: 'none',
                        background: 'linear-gradient(135deg, #2563EB 0%, #6366F1 50%, #8B5CF6 100%)',
                        color: '#fff', fontWeight: 600, fontSize: 15,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        boxShadow: '0 10px 24px rgba(99,102,241,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset, 0 -2px 0 rgba(0,0,0,0.15) inset',
                        letterSpacing: '0.02em',
                        cursor: isPending ? 'wait' : 'pointer',
                        opacity: isPending ? 0.8 : 1,
                        transition: 'opacity 150ms',
                      }}
                    >
                      {isPending && (
                        <span
                          aria-hidden="true"
                          style={{
                            width: 18, height: 18, borderRadius: '50%',
                            border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                            animation: 'spin 0.7s linear infinite', display: 'inline-block',
                          }}
                        />
                      )}
                      {isPending ? '提交中…' : '申請加入候補'}
                      {!isPending && <IconArrowRight />}
                    </button>
                  </form>

                  {/* Footer */}
                  <div
                    style={{
                      textAlign: 'center', fontSize: 13, color: 'var(--co-text-dim)',
                      marginTop: 22, paddingTop: 20, borderTop: '1px solid var(--co-line)',
                    }}
                  >
                    已有帳號？
                    <Link to="/login" style={{ color: '#C7D2FE', fontWeight: 600, marginLeft: 4 }}>
                      立即登入
                    </Link>
                  </div>

                  {/* Legal */}
                  <div style={{ paddingTop: 14, textAlign: 'center', fontSize: 11, color: 'var(--co-text-muted)' }}>
                    提交即代表您同意
                    <Link to="/terms" style={{ color: 'var(--co-text-dim)', margin: '0 4px' }}>服務條款</Link>
                    及
                    <Link to="/privacy" style={{ color: 'var(--co-text-dim)', margin: '0 4px' }}>隱私政策</Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* RWD styles */}
      <style>{`
        .wl-page {
          display: grid;
          grid-template-columns: 1fr 560px;
        }
        .wl-hero {
          display: flex;
        }
        @media (max-width: 767px) {
          .wl-page {
            grid-template-columns: 1fr !important;
          }
          .wl-hero {
            display: none !important;
          }
          .wl-right {
            padding: 24px 20px !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1199px) {
          .wl-page {
            grid-template-columns: 1fr 480px !important;
          }
        }
      `}</style>
    </>
  );
};

export default WaitlistPage;
