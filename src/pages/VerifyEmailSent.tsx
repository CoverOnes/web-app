import { useState } from 'react';
import { useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import { useResendVerification } from '../lib/query';
import { AuthHeroPanel } from '../components/auth/AuthHeroPanel';
import type { AxiosError } from 'axios';

interface VerifyEmailSentState {
  email?: string;
}

/**
 * auth Increment 1: shown after a successful POST /v1/auth/register.
 * Register no longer returns tokens — the user must check their inbox and click
 * the verification link before they can log in. This screen does NOT log the
 * user in or route into the app.
 *
 * The registered email is passed via router navigation state. If a user lands
 * here directly (no state), we redirect back to /register.
 */
const VerifyEmailSent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as VerifyEmailSentState | null)?.email ?? '';

  const resend = useResendVerification();
  const [resentOk, setResentOk] = useState(false);
  const [resendError, setResendError] = useState('');

  // Direct hit without an email → nothing to show; send them to register.
  if (!email) {
    return <Navigate to="/register" replace />;
  }

  const handleResend = async () => {
    setResendError('');
    setResentOk(false);
    try {
      await resend.mutateAsync(email);
      setResentOk(true);
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setResendError(axErr.response?.data?.message ?? '重寄失敗，請稍後再試。');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `
          radial-gradient(1200px 700px at 20% 30%, rgba(99,102,241,0.18), transparent 60%),
          radial-gradient(1000px 600px at 90% 80%, rgba(139,92,246,0.14), transparent 60%),
          #060A14
        `,
        display: 'grid',
        gridTemplateColumns: '1fr 560px',
        fontFamily: 'var(--font-sans)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <AuthHeroPanel
        title="差一步就完成了"
        subtitle="我們已寄出一封驗證信。點擊信中的連結即可啟用您的帳號，開始使用 CoverOnes。"
        badge="Check your email"
      />

      <section style={{ padding: '36px 56px 36px 0', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 480,
            background: 'var(--co-bg-card-2)',
            border: '1px solid var(--co-line)',
            borderRadius: 20,
            padding: '36px 36px 28px 36px',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
          }}>
            <div
              aria-hidden="true"
              style={{
                width: 56, height: 56, borderRadius: 16, marginBottom: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28,
                background: 'rgba(99,102,241,0.16)',
                border: '1px solid rgba(99,102,241,0.3)',
              }}
            >
              ✉️
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px 0', color: 'var(--co-text)' }}>
              驗證信已寄出
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--co-text-dim)', margin: '0 0 8px 0', lineHeight: 1.6 }}>
              我們已將驗證連結寄到：
            </p>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--co-text)', margin: '0 0 20px 0', wordBreak: 'break-all' }}>
              {email}
            </p>
            <p style={{ fontSize: 13, color: 'var(--co-text-dim)', margin: '0 0 24px 0', lineHeight: 1.6 }}>
              請至信箱點擊驗證連結以啟用帳號。完成後即可登入並使用發案、投標等功能。
            </p>

            {resentOk && (
              <div
                role="status"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', marginBottom: 16,
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: 10, fontSize: 13, color: '#4ade80',
                }}
              >
                若該信箱存在，我們已重新寄出驗證信。
              </div>
            )}

            {resendError && (
              <div
                role="alert"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', marginBottom: 16,
                  background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 10, fontSize: 13, color: '#FCA5A5',
                }}
              >
                {resendError}
              </div>
            )}

            <button
              type="button"
              onClick={handleResend}
              disabled={resend.isPending}
              style={{
                width: '100%', height: 48, borderRadius: 12,
                background: 'linear-gradient(135deg, #2563EB 0%, #6366F1 50%, #8B5CF6 100%)',
                color: '#fff', fontWeight: 600, fontSize: 15, border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 10px 24px rgba(99,102,241,0.4)',
                cursor: resend.isPending ? 'wait' : 'pointer',
                opacity: resend.isPending ? 0.75 : 1,
                transition: 'opacity 150ms',
              }}
            >
              {resend.isPending && (
                <span style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} aria-hidden="true" />
              )}
              {resend.isPending ? '重寄中…' : '沒收到？重寄驗證信'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                width: '100%', height: 44, borderRadius: 12, marginTop: 12,
                background: 'var(--co-bg-3)', border: '1px solid var(--co-line-strong)',
                color: 'var(--co-text-dim)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              前往登入
            </button>

            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--co-text-dim)', marginTop: 22, paddingTop: 20, borderTop: '1px solid var(--co-line)' }}>
              填錯信箱了？{' '}
              <Link to="/register" style={{ color: '#C7D2FE', fontWeight: 600 }}>
                重新註冊
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default VerifyEmailSent;
