import { useState, useId } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useResetPassword } from '../lib/query';
import { getApiErrorCode } from '../lib/api/http';

/**
 * ResetPasswordPage — /reset-password
 *
 * Parses ?token= from the URL.
 * - No token → "缺少重設連結" phase (no form rendered).
 * - With token → shows newPassword + confirmPassword form.
 *   Client-validates: min 12 chars + passwords must match.
 *   Calls POST /v1/auth/reset-password on submit.
 *   On success → navigate('/login', { replace: true, state: { resetSuccess: true } })
 *   On error:
 *     INVALID_RESET_TOKEN → "連結無效或已過期" + link to /forgot-password
 *     WEAK_PASSWORD → "密碼至少 12 個字元"
 *
 * Security notes:
 *   - Input type=password autoComplete=new-password (no browser autofill from saved creds)
 *   - Token is NEVER written to authStore — no auto-login after reset.
 *
 * Design source: design-reference/chat/project/ForgotPassword.html (Step 3: new password)
 * Tokens: --co-* palette from src/index.css.
 */

type Phase = 'form' | 'no-token';

const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2"/>
    <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
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

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}

const PasswordField = ({ id, label, value, onChange, disabled }: PasswordFieldProps) => {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);

  return (
    <div style={{ marginBottom: 14 }}>
      <label
        htmlFor={id}
        style={{
          display: 'block', fontSize: 12, fontWeight: 600,
          marginBottom: 7, color: 'var(--co-text)',
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px',
          background: 'var(--co-bg-3)',
          border: `1px solid ${focused ? 'var(--co-accent)' : 'var(--co-line-strong)'}`,
          borderRadius: 10,
          boxShadow: focused ? '0 0 0 4px rgba(99,102,241,0.15)' : 'none',
          transition: 'border-color 150ms, box-shadow 150ms',
        }}
      >
        <span style={{ color: 'var(--co-text-muted)', display: 'flex', flexShrink: 0 }}>
          <IconLock />
        </span>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-required="true"
          style={{
            flex: 1, fontSize: 14, background: 'transparent',
            border: 'none', outline: 'none', color: 'var(--co-text)',
          }}
          placeholder="••••••••••••"
        />
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          aria-label={show ? '隱藏密碼' : '顯示密碼'}
          style={{
            color: 'var(--co-text-muted)', fontSize: 12,
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: 0, flexShrink: 0,
          }}
        >
          {show ? '隱藏' : '顯示'}
        </button>
      </div>
    </div>
  );
};

// ── Password strength checks ────────────────────────────────────────────────

const MIN_LENGTH = 12;

interface StrengthBarProps {
  password: string;
}

const StrengthBar = ({ password }: StrengthBarProps) => {
  const checks = [
    { label: `至少 ${MIN_LENGTH} 個字元`, pass: password.length >= MIN_LENGTH },
    { label: '含大寫字母', pass: /[A-Z]/.test(password) },
    { label: '含數字', pass: /\d/.test(password) },
    { label: '含特殊符號', pass: /[^a-zA-Z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;

  if (!password) return null;

  const barColor = score <= 1 ? '#EF4444' : score === 2 ? '#F59E0B' : score === 3 ? '#22D3EE' : '#10B981';

  return (
    <div
      style={{
        marginTop: 8, padding: '10px 12px',
        background: 'rgba(15,23,42,0.4)', border: '1px solid var(--co-line)',
        borderRadius: 8,
      }}
    >
      <div
        style={{
          height: 6, background: 'var(--co-bg-3)', borderRadius: 3,
          overflow: 'hidden', marginBottom: 8, display: 'flex', gap: 3,
        }}
      >
        {checks.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1, borderRadius: 2,
              background: i < score ? barColor : 'var(--co-bg-3)',
              transition: 'background 200ms',
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '4px 14px',
        }}
      >
        {checks.map(({ label, pass }) => (
          <div
            key={label}
            style={{
              fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6,
              color: pass ? 'var(--co-green)' : 'var(--co-text-muted)',
            }}
          >
            <span aria-hidden="true">{pass ? '✓' : '○'}</span>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Page wrapper shared between phases ─────────────────────────────────────

const PageShell = ({ children }: { children: React.ReactNode }) => (
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
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', position: 'relative',
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
          width: '100%', maxWidth: 480,
          boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset',
          position: 'relative', zIndex: 2,
        }}
        className="rp-card"
      >
        {children}
      </div>
      <style>{`
        @media (max-width: 767px) {
          .rp-card { padding: 28px 24px !important; }
        }
      `}</style>
    </div>
  </>
);

// ── Main component ──────────────────────────────────────────────────────────

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const phase: Phase = token ? 'form' : 'no-token';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clientError, setClientError] = useState('');

  const newPasswordId = useId();
  const confirmPasswordId = useId();
  const errorId = useId();

  const resetPassword = useResetPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError('');

    // Client-side validation
    if (newPassword.length < MIN_LENGTH) {
      setClientError(`密碼至少 ${MIN_LENGTH} 個字元`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setClientError('兩次輸入的密碼不一致');
      return;
    }

    try {
      await resetPassword.mutateAsync({ token, newPassword });
      // No auto-login — navigate to /login with resetSuccess state so
      // the Login page can show a success banner.
      navigate('/login', { replace: true, state: { resetSuccess: true } });
    } catch (err) {
      const code = getApiErrorCode(err);
      if (code === 'INVALID_RESET_TOKEN') {
        setClientError('連結無效或已過期，請重新申請。');
      } else if (code === 'WEAK_PASSWORD') {
        setClientError(`密碼至少 ${MIN_LENGTH} 個字元`);
      } else {
        setClientError('重設失敗，請稍後再試。');
      }
    }
  };

  // ── No-token phase ──────────────────────────────────────────────────────

  if (phase === 'no-token') {
    return (
      <PageShell>
        <div
          aria-hidden="true"
          style={{
            width: 64, height: 64, borderRadius: 16, margin: '0 auto 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.35)',
            fontSize: 28,
          }}
        >
          ⚠
        </div>
        <h1
          style={{
            fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em',
            margin: '0 0 6px', textAlign: 'center', color: 'var(--co-text)',
          }}
        >
          缺少重設連結
        </h1>
        <p
          role="alert"
          style={{
            fontSize: 13.5, color: 'var(--co-text-dim)', lineHeight: 1.6,
            margin: '0 0 24px', textAlign: 'center',
          }}
        >
          此頁面需要從密碼重設信中的連結進入。<br />
          請至信箱點擊連結，或重新申請。
        </p>
        <Link
          to="/forgot-password"
          style={{
            display: 'block', width: '100%', height: 48, lineHeight: '48px',
            textAlign: 'center', borderRadius: 12,
            background: 'linear-gradient(135deg, #2563EB 0%, #6366F1 50%, #8B5CF6 100%)',
            color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none',
            boxShadow: '0 10px 24px rgba(99,102,241,0.4)', marginBottom: 12,
          }}
        >
          重新申請重設連結
        </Link>
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--co-text-dim)', marginTop: 16 }}>
          <Link to="/login" style={{ color: '#C7D2FE', fontWeight: 600 }}>
            返回登入
          </Link>
        </div>
      </PageShell>
    );
  }

  // ── Invalid token error (from API, not from clientError state) ────────────
  // Shown inline within the form phase after an INVALID_RESET_TOKEN response
  const isInvalidToken = clientError === '連結無效或已過期，請重新申請。';

  // ── Form phase ──────────────────────────────────────────────────────────

  return (
    <PageShell>
      {/* Cyan lock icon */}
      <div
        aria-hidden="true"
        style={{
          width: 64, height: 64, borderRadius: 16, margin: '0 auto 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(34,211,238,0.18), rgba(99,102,241,0.1))',
          border: '1px solid rgba(34,211,238,0.4)',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--co-cyan)" strokeWidth="2" aria-hidden="true">
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
        設定新密碼
      </h1>
      <p
        style={{
          fontSize: 13.5, color: 'var(--co-text-dim)', lineHeight: 1.6,
          textAlign: 'center', margin: '0 0 26px',
        }}
      >
        請輸入新密碼。密碼至少 {MIN_LENGTH} 個字元。
      </p>

      {/* Error banner */}
      {clientError && (
        <div
          id={errorId}
          role="alert"
          style={{
            padding: '10px 14px', marginBottom: 16,
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10, fontSize: 13, color: '#FCA5A5',
          }}
        >
          {clientError}
          {isInvalidToken && (
            <>
              {' '}
              <Link to="/forgot-password" style={{ color: '#C7D2FE', fontWeight: 600 }}>
                重新申請
              </Link>
            </>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate aria-describedby={clientError ? errorId : undefined}>
        <PasswordField
          id={newPasswordId}
          label="新密碼"
          value={newPassword}
          onChange={setNewPassword}
          disabled={resetPassword.isPending}
        />
        <StrengthBar password={newPassword} />

        <div style={{ marginTop: 14 }}>
          <PasswordField
            id={confirmPasswordId}
            label="確認新密碼"
            value={confirmPassword}
            onChange={setConfirmPassword}
            disabled={resetPassword.isPending}
          />
        </div>

        <button
          type="submit"
          disabled={resetPassword.isPending}
          style={{
            width: '100%', height: 48, borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #2563EB 0%, #6366F1 50%, #8B5CF6 100%)',
            color: '#fff', fontWeight: 600, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 8px 26px rgba(99,102,241,0.35)',
            cursor: resetPassword.isPending ? 'wait' : 'pointer',
            opacity: resetPassword.isPending ? 0.8 : 1,
            transition: 'opacity 150ms',
            marginTop: 18, marginBottom: 10, minHeight: 44,
          }}
          aria-busy={resetPassword.isPending}
        >
          {resetPassword.isPending && <SpinnerIcon />}
          {resetPassword.isPending ? '重設中…' : '確認重設密碼'}
        </button>
      </form>

      <div
        style={{
          textAlign: 'center', fontSize: 13, color: 'var(--co-text-dim)',
          marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--co-line)',
        }}
      >
        <Link to="/login" style={{ color: '#C7D2FE', fontWeight: 600 }}>
          返回登入
        </Link>
      </div>
    </PageShell>
  );
};

export default ResetPasswordPage;
