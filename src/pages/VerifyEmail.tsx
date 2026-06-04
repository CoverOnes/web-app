import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../lib/api/coverones';
import { useVerifyEmail, useResendVerification } from '../lib/query';
import { AuthHeroPanel } from '../components/auth/AuthHeroPanel';
import type { AxiosError } from 'axios';

type Phase = 'verifying' | 'success' | 'error' | 'no-token';

/**
 * auth Increment 1: /verify-email route. Reads ?token= from the URL and calls
 * POST /v1/auth/verify-email on mount.
 *
 * On success:
 *   - If the user is already logged in, refresh the session so the new access
 *     token carries email_verified=true, optimistically flip the store flag, and
 *     route into the app.
 *   - If not logged in (the common case — they registered but never logged in),
 *     prompt them to log in.
 *
 * On 400 INVALID_VERIFICATION_TOKEN → show "連結無效或已過期" + a resend option.
 */
const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const refreshTokens = useAuthStore((s) => s.refreshTokens);
  const setEmailVerified = useAuthStore((s) => s.setEmailVerified);

  const verify = useVerifyEmail();
  const resend = useResendVerification();

  const [phase, setPhase] = useState<Phase>(token ? 'verifying' : 'no-token');
  const [errorMsg, setErrorMsg] = useState('');

  // Resend (only relevant on the error screen).
  const [resendEmail, setResendEmail] = useState('');
  const [resentOk, setResentOk] = useState(false);
  const [resendError, setResendError] = useState('');

  // Guard against double-invocation (React 19 StrictMode mounts effects twice).
  const ranRef = useRef(false);

  useEffect(() => {
    if (!token || ranRef.current) return;
    ranRef.current = true;

    (async () => {
      try {
        await verify.mutateAsync(token);

        // If a session exists, refresh it so the new access token carries the
        // email_verified=true claim; flip the store flag immediately regardless.
        if (isAuthenticated && refreshToken) {
          try {
            // /v1/auth/refresh is public; the http client unwraps { data }.
            const res = await authApi.refresh(refreshToken);
            refreshTokens(res.accessToken, res.refreshToken);
          } catch {
            // Refresh failed — non-fatal here; the next protected call will
            // re-trigger refresh via the 401 interceptor. Still flip the flag.
          }
        }
        setEmailVerified(true);
        setPhase('success');
      } catch (err) {
        const axErr = err as AxiosError<{ message?: string; code?: string }>;
        setErrorMsg(
          axErr.response?.status === 400
            ? '連結無效或已過期，請重新索取驗證信。'
            : (axErr.response?.data?.message ?? '驗證失敗，請稍後再試。')
        );
        setPhase('error');
      }
    })();
    // We intentionally run this exactly once for the token in the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleResend = async () => {
    setResendError('');
    setResentOk(false);
    if (!resendEmail.trim()) {
      setResendError('請輸入您的 email。');
      return;
    }
    try {
      await resend.mutateAsync(resendEmail.trim());
      setResentOk(true);
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setResendError(axErr.response?.data?.message ?? '重寄失敗，請稍後再試。');
    }
  };

  const continueTarget = isAuthenticated ? '/jobs' : '/login';
  const continueLabel = isAuthenticated ? '進入 CoverOnes' : '前往登入';

  const fieldStyle: React.CSSProperties = {
    height: 46, padding: '0 14px',
    background: 'var(--color-input-bg)', border: '1px solid var(--co-line)',
    borderRadius: 11, fontSize: 14, color: 'var(--co-text)', width: '100%',
    outline: 'none', boxSizing: 'border-box', display: 'block',
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
        title="信箱驗證"
        subtitle="驗證您的信箱後即可解鎖發案、投標與合約等完整功能。"
        badge="Email verification"
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
            {phase === 'verifying' && (
              <div role="status" aria-busy="true" style={{ textAlign: 'center', padding: '20px 0' }}>
                <span
                  style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#8B5CF6', animation: 'spin 0.7s linear infinite', display: 'inline-block', marginBottom: 16 }}
                  aria-hidden="true"
                />
                <p style={{ fontSize: 15, color: 'var(--co-text)', fontWeight: 600, margin: 0 }}>
                  正在驗證您的信箱…
                </p>
              </div>
            )}

            {phase === 'success' && (
              <>
                <div
                  aria-hidden="true"
                  style={{
                    width: 56, height: 56, borderRadius: 16, marginBottom: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
                    background: 'rgba(34,197,94,0.14)', border: '1px solid rgba(34,197,94,0.35)',
                  }}
                >
                  ✓
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px 0', color: 'var(--co-text)' }}>
                  信箱已驗證
                </h2>
                <p style={{ fontSize: 13.5, color: 'var(--co-text-dim)', margin: '0 0 24px 0', lineHeight: 1.6 }}>
                  您的信箱已成功驗證。{isAuthenticated ? '現在即可使用發案、投標等完整功能。' : '請使用您的帳號登入以開始使用。'}
                </p>
                <button
                  type="button"
                  onClick={() => navigate(continueTarget, { replace: true })}
                  style={{
                    width: '100%', height: 48, borderRadius: 12,
                    background: 'linear-gradient(135deg, #2563EB 0%, #6366F1 50%, #8B5CF6 100%)',
                    color: '#fff', fontWeight: 600, fontSize: 15, border: 'none',
                    boxShadow: '0 10px 24px rgba(99,102,241,0.4)', cursor: 'pointer',
                  }}
                >
                  {continueLabel}
                </button>
              </>
            )}

            {phase === 'error' && (
              <>
                <div
                  aria-hidden="true"
                  style={{
                    width: 56, height: 56, borderRadius: 16, marginBottom: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
                    background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.35)',
                  }}
                >
                  ⚠
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px 0', color: 'var(--co-text)' }}>
                  驗證失敗
                </h2>
                <p role="alert" style={{ fontSize: 13.5, color: '#FCA5A5', margin: '0 0 20px 0', lineHeight: 1.6 }}>
                  {errorMsg}
                </p>

                <p style={{ fontSize: 13, color: 'var(--co-text-dim)', margin: '0 0 8px 0' }}>
                  輸入您的 email 以重新索取驗證信：
                </p>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  style={{ ...fieldStyle, marginBottom: 12 }}
                />

                {resentOk && (
                  <div role="status" style={{ padding: '10px 14px', marginBottom: 12, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, fontSize: 13, color: '#4ade80' }}>
                    若該信箱存在，我們已重新寄出驗證信。
                  </div>
                )}
                {resendError && (
                  <div role="alert" style={{ padding: '10px 14px', marginBottom: 12, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#FCA5A5' }}>
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
                    cursor: resend.isPending ? 'wait' : 'pointer', opacity: resend.isPending ? 0.75 : 1,
                  }}
                >
                  {resend.isPending && (
                    <span style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} aria-hidden="true" />
                  )}
                  {resend.isPending ? '重寄中…' : '重寄驗證信'}
                </button>
              </>
            )}

            {phase === 'no-token' && (
              <>
                <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px 0', color: 'var(--co-text)' }}>
                  缺少驗證連結
                </h2>
                <p role="alert" style={{ fontSize: 13.5, color: 'var(--co-text-dim)', margin: '0 0 20px 0', lineHeight: 1.6 }}>
                  此頁面需要從驗證信中的連結進入。請至信箱點擊驗證連結。
                </p>
                <Link
                  to="/login"
                  style={{
                    display: 'block', width: '100%', height: 48, lineHeight: '48px', textAlign: 'center',
                    borderRadius: 12, background: 'var(--co-bg-3)', border: '1px solid var(--co-line-strong)',
                    color: 'var(--co-text-dim)', fontSize: 14, fontWeight: 600, textDecoration: 'none',
                  }}
                >
                  前往登入
                </Link>
              </>
            )}

            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--co-text-dim)', marginTop: 22, paddingTop: 20, borderTop: '1px solid var(--co-line)' }}>
              <Link to="/login" style={{ color: '#C7D2FE', fontWeight: 600 }}>
                返回登入
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default VerifyEmail;
