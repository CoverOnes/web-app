/**
 * OAuthCallback — /auth/callback
 *
 * Handles the browser redirect after the backend completes the OAuth provider
 * handshake. Five query-string outcomes:
 *
 *   ?code=<otc>             → exchange for tokens → store → navigate to /jobs
 *   ?register=<regToken>    → provider (e.g. LINE) supplied no email;
 *                             show email-collection form → POST /v1/auth/oauth/register
 *                             → exchange one-time code → log in → /register/verify-sent
 *   ?bind=success           → bind succeeded; invalidate identities query → /settings
 *   ?error=email_exists     → show "use password login + bind in Settings" message
 *   ?error=<other>          → show generic error with back link
 *
 * Design model: Design A (never auto-link). The backend returns error=email_exists
 * when a provider email matches an existing account without an existing link.
 */

import { useEffect, useRef, useState, useId } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../lib/api/coverones';
import axios from 'axios';

// ─── Status machine ───────────────────────────────────────────────────────────

type Status =
  | { kind: 'processing' }
  | { kind: 'needs_email'; regToken: string }
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

// ─── Shared CTA link style ────────────────────────────────────────────────────

const ctaLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 44,
  padding: '0 24px',
  borderRadius: 11,
  border: 'none',
  background:
    'linear-gradient(135deg, var(--co-blue, #2563EB) 0%, var(--co-accent, #6366F1) 50%, var(--co-accent-2, #8B5CF6) 100%)',
  color: '#fff',
  fontWeight: 600,
  fontSize: 14,
  textDecoration: 'none',
  boxShadow: '0 8px 20px rgba(99,102,241,0.4)',
};

// ─── Email input icon ─────────────────────────────────────────────────────────

const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2"/>
    <path d="m3 7 9 6 9-6"/>
  </svg>
);

// ─── Arrow icon ───────────────────────────────────────────────────────────────

const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 5l7 7-7 7"/>
  </svg>
);

// ─── Email validation (same rule as Register.tsx) ─────────────────────────────

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

// ─── OAuthRegisterForm ────────────────────────────────────────────────────────
// Inline form shown when the backend redirects ?register=<regToken> because the
// OAuth provider (e.g. LINE) did not supply an email address. The user provides
// one; we POST /v1/auth/oauth/register and, on success, exchange the returned
// one-time code for session tokens.

interface OAuthRegisterFormProps {
  regToken: string;
  onEmailExists: () => void;
  onError: (message: string) => void;
  onSuccess: () => void;
}

const OAuthRegisterForm = ({
  regToken,
  onEmailExists,
  onError,
  onSuccess,
}: OAuthRegisterFormProps) => {
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const emailId = useId();
  const errorId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setFieldError('請輸入 Email。');
      return;
    }
    if (!isValidEmail(email)) {
      setFieldError('請輸入有效的 Email 格式。');
      return;
    }

    setFieldError('');
    setIsLoading(true);

    try {
      // POST /v1/auth/oauth/register → { code }
      const { code } = await authApi.oauthRegister({ regToken, email: email.trim() });

      // Exchange the one-time code for session tokens (same path as normal OAuth login).
      const { accessToken, refreshToken } = await authApi.oauthExchange({ code });
      const user = await authApi.me(accessToken);
      login(accessToken, refreshToken, user);

      onSuccess();
      // User is now logged in but email-unverified (PENDING_VERIFICATION).
      // Route to verify-sent so they are nudged to check their inbox.
      navigate('/register/verify-sent', { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        type ApiError = { error?: { code?: string; message?: string }; code?: string; message?: string };
        const data = err.response?.data as ApiError | undefined;
        const apiCode = data?.error?.code ?? data?.code;

        if (apiCode === 'EMAIL_EXISTS' || apiCode === 'email_exists') {
          onEmailExists();
          return;
        }
        const msg = data?.error?.message ?? data?.message ?? 'OAuth 註冊失敗，請稍後再試。';
        onError(msg);
      } else {
        onError('OAuth 註冊失敗，請稍後再試。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'left' }}>
      {/* Header */}
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--co-text)',
          letterSpacing: '-0.02em',
          margin: '0 0 8px 0',
          textAlign: 'center',
        }}
      >
        完成帳號設定
      </h1>

      <p
        style={{
          fontSize: 13.5,
          lineHeight: 1.65,
          color: 'var(--co-text-dim)',
          margin: '0 0 24px 0',
          textAlign: 'center',
        }}
      >
        您的登入方式沒有提供 Email，請輸入一個 Email 以完成帳號建立。完成後我們會寄送驗證信。
      </p>

      {/* Field-level error */}
      {fieldError && (
        <div
          id={errorId}
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: '10px 14px',
            marginBottom: 14,
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10,
            fontSize: 13,
            color: 'var(--co-error, #FCA5A5)',
          }}
        >
          {fieldError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate aria-describedby={fieldError ? errorId : undefined}>
        {/* Email input */}
        <div style={{ marginBottom: 20 }}>
          <label
            htmlFor={emailId}
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--co-text-dim)',
              marginBottom: 7,
            }}
          >
            電子郵件
          </label>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              height: 46,
              padding: '0 14px',
              background: focused ? 'rgba(6,10,20,0.8)' : 'rgba(6,10,20,0.6)',
              border: `1px solid ${focused ? 'var(--co-accent, #6366F1)' : 'var(--co-line-strong)'}`,
              borderRadius: 11,
              boxShadow: focused ? '0 0 0 4px rgba(99,102,241,0.16)' : 'none',
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
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldError) setFieldError('');
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              disabled={isLoading}
              aria-required="true"
              style={{
                flex: 1,
                fontSize: 14,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--co-text)',
              }}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            height: 48,
            borderRadius: 12,
            border: 'none',
            background:
              'linear-gradient(135deg, var(--co-blue, #2563EB) 0%, var(--co-accent, #6366F1) 50%, var(--co-accent-2, #8B5CF6) 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: '0 10px 24px rgba(99,102,241,0.4)',
            cursor: isLoading ? 'wait' : 'pointer',
            opacity: isLoading ? 0.8 : 1,
            transition: 'opacity 150ms',
          }}
          aria-busy={isLoading}
        >
          {isLoading && (
            <span
              aria-hidden="true"
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                animation: 'cbSpin 0.7s linear infinite',
                display: 'inline-block',
              }}
            />
          )}
          {isLoading ? '處理中…' : '繼續'}
          {!isLoading && <IconArrow />}
        </button>
      </form>

      {/* Back link */}
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <Link
          to="/login"
          style={{ fontSize: 13, color: 'var(--co-text-dim)', textDecoration: 'none' }}
        >
          取消，返回登入頁
        </Link>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  // Zustand actions are stable references — safe to capture in the effect closure.
  const login = useAuthStore((s) => s.login);

  const [status, setStatus] = useState<Status>({ kind: 'processing' });

  // Prevent double-firing in React 19 strict mode / double-mount in dev.
  const exchangedRef = useRef(false);

  useEffect(() => {
    if (exchangedRef.current) return;
    exchangedRef.current = true;

    const code = searchParams.get('code');
    const regToken = searchParams.get('register');
    const bind = searchParams.get('bind');
    const error = searchParams.get('error');

    // ── register=<regToken>: provider did not supply email ────────────────────
    if (regToken) {
      setStatus({ kind: 'needs_email', regToken });
      return;
    }

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
  }, []); // Intentionally empty — runs once on mount only. searchParams, navigate,
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

  // ── OAuth registration email-collection form ──────────────────────────────

  if (status.kind === 'needs_email') {
    return (
      <Card>
        <OAuthRegisterForm
          regToken={status.regToken}
          onEmailExists={() => setStatus({ kind: 'email_exists' })}
          onError={(message) => setStatus({ kind: 'error', message })}
          onSuccess={() => {
            // Navigation to /register/verify-sent is handled inside the form.
            // Set status to success so if somehow the user lands back here,
            // we show a neutral processing state rather than re-rendering the form.
            setStatus({ kind: 'success' });
          }}
        />
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
