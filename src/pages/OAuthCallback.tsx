/**
 * OAuthCallback — /auth/callback
 *
 * Handles the browser redirect after the backend completes the OAuth provider
 * handshake. Four query-string outcomes:
 *
 *   ?code=<otc>          → exchange for tokens → store → navigate to /jobs
 *   ?bind=success        → bind succeeded; invalidate identities query → navigate to /settings
 *   ?error=email_exists  → show "use password login + bind in Settings" message
 *   ?error=<other>       → show generic error with back link
 *
 * Design model: Design A (never auto-link). The backend returns error=email_exists
 * when a provider email matches an existing account without an existing link.
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../lib/api/coverones';
import axios from 'axios';

// ─── Status machine ───────────────────────────────────────────────────────────

type Status =
  | { kind: 'processing' }
  | { kind: 'success' }
  | { kind: 'bind_success' }
  | { kind: 'email_exists' }
  | { kind: 'error'; message: string };

// ─── Spinner atom ─────────────────────────────────────────────────────────────

const Spinner = () => (
  <>
    <style>{`@keyframes cbSpin { to { transform: rotate(360deg); } }`}</style>
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: '3px solid rgba(99,102,241,0.25)',
        borderTopColor: 'var(--co-accent, #6366F1)',
        animation: 'cbSpin 0.8s linear infinite',
        marginBottom: 20,
      }}
    />
  </>
);

// ─── Card shell — module-level to avoid remount on re-render ──────────────────

const Card = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `
        radial-gradient(1200px 700px at 20% 30%, rgba(99,102,241,0.18), transparent 60%),
        radial-gradient(1000px 600px at 90% 80%, rgba(139,92,246,0.14), transparent 60%),
        var(--co-bg)
      `,
    }}
  >
    <div
      style={{
        width: 440,
        maxWidth: 'calc(100vw - 40px)',
        background: 'linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(11,18,32,0.9) 100%)',
        border: '1px solid rgba(148,163,184,0.16)',
        borderRadius: 20,
        padding: '40px 36px',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  </div>
);

// ─── Shared CTA button style ──────────────────────────────────────────────────

const ctaLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 44,
  padding: '0 24px',
  borderRadius: 11,
  border: 'none',
  background: 'linear-gradient(135deg, var(--co-blue, #2563EB) 0%, var(--co-accent, #6366F1) 50%, var(--co-accent-2, #8B5CF6) 100%)',
  color: '#fff',
  fontWeight: 600,
  fontSize: 14,
  textDecoration: 'none',
  boxShadow: '0 8px 20px rgba(99,102,241,0.4)',
};

// ─── Main component ───────────────────────────────────────────────────────────

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<Status>({ kind: 'processing' });

  // Prevent double-firing in React 19 strict mode / double-mount in dev.
  const exchangedRef = useRef(false);

  useEffect(() => {
    if (exchangedRef.current) return;
    exchangedRef.current = true;

    const code = searchParams.get('code');
    const bind = searchParams.get('bind');
    const error = searchParams.get('error');

    // ── bind=success: the user completed a social-account bind ────────────────
    if (bind === 'success') {
      // Invalidate the identities cache so Settings re-fetches the updated list.
      queryClient.invalidateQueries({ queryKey: ['me', 'identities'] });
      setStatus({ kind: 'bind_success' });
      // Brief pause so the user sees the success state before redirect.
      setTimeout(() => navigate('/settings', { replace: true }), 1500);
      return;
    }

    // ── error param from backend ───────────────────────────────────────────────
    if (error) {
      if (error === 'email_exists') {
        setStatus({ kind: 'email_exists' });
      } else {
        setStatus({ kind: 'error', message: `登入失敗（${error}），請重試。` });
      }
      return;
    }

    // ── code: new login via OAuth ─────────────────────────────────────────────
    if (!code) {
      setStatus({ kind: 'error', message: '未收到授權碼，請重新嘗試登入。' });
      return;
    }

    authApi
      .oauthExchange({ code })
      .then(async ({ accessToken, refreshToken }) => {
        const user = await authApi.me(accessToken);
        login(accessToken, refreshToken, user);
        setStatus({ kind: 'success' });
        navigate('/jobs', { replace: true });
      })
      .catch((err: unknown) => {
        let message = 'OAuth 登入失敗，請稍後再試。';
        if (axios.isAxiosError(err)) {
          type ApiError = { error?: { code?: string; message?: string }; code?: string; message?: string };
          const data = err.response?.data as ApiError | undefined;
          const apiCode = data?.error?.code ?? data?.code;
          if (apiCode === 'email_exists') {
            setStatus({ kind: 'email_exists' });
            return;
          }
          message = data?.error?.message ?? data?.message ?? message;
        }
        setStatus({ kind: 'error', message });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty — runs once on mount only. searchParams, login, navigate,
          // and queryClient are stable refs; re-running would double-exchange the one-time code.

  // ── Render by status ───────────────────────────────────────────────────────

  if (status.kind === 'processing' || status.kind === 'success' || status.kind === 'bind_success') {
    const label =
      status.kind === 'bind_success'
        ? '綁定成功，正在跳轉…'
        : '正在完成登入，請稍候…';
    return (
      <Card>
        <Spinner />
        <p style={{ color: 'var(--co-text)', fontSize: 15, margin: 0 }}>
          {label}
        </p>
      </Card>
    );
  }

  if (status.kind === 'email_exists') {
    return (
      <Card>
        {/* Info icon */}
        <div
          style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--co-accent-2, #A78BFA)" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
        </div>

        <h1
          style={{
            fontSize: 20, fontWeight: 700, color: 'var(--co-text)',
            letterSpacing: '-0.02em', margin: '0 0 12px 0',
          }}
        >
          此 Email 已有帳號
        </h1>

        {/* role="alert" + aria-live so screen-readers announce this immediately */}
        <p
          role="alert"
          aria-live="assertive"
          style={{
            fontSize: 14, lineHeight: 1.7, color: 'var(--co-text-dim)',
            margin: '0 0 24px 0',
          }}
        >
          此 Email 已有帳號，請用密碼登入後到「設定」→「登入方式」綁定 Google／LINE。
        </p>

        <Link to="/login" style={ctaLinkStyle}>
          返回密碼登入
        </Link>
      </Card>
    );
  }

  // Generic error
  return (
    <Card>
      {/* Error icon */}
      <div
        style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--co-error, #FCA5A5)" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4M12 16h.01"/>
        </svg>
      </div>

      <h1
        style={{
          fontSize: 20, fontWeight: 700, color: 'var(--co-text)',
          letterSpacing: '-0.02em', margin: '0 0 12px 0',
        }}
      >
        登入失敗
      </h1>

      <p
        role="alert"
        aria-live="assertive"
        style={{
          fontSize: 14, lineHeight: 1.7, color: 'var(--co-error, #FCA5A5)',
          margin: '0 0 24px 0',
        }}
      >
        {status.message}
      </p>

      <Link to="/login" style={ctaLinkStyle}>
        返回登入頁
      </Link>
    </Card>
  );
};

export default OAuthCallback;
