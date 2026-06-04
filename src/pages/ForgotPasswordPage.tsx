import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * ForgotPasswordPage — /forgot-password
 * P1 route stub: collects email and shows a "sent" confirmation.
 * Full 3-step implementation (ForgotPassword.html) is P2.
 */
const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // P1 stub: UI-only. Real API integration is P2.
    setSent(true);
  };

  if (sent) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--co-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
        }}
      >
        <div
          style={{
            background: 'var(--co-bg-card)',
            border: '1px solid var(--co-line-strong)',
            borderRadius: 16,
            padding: '40px 32px',
            width: '100%',
            maxWidth: 440,
            textAlign: 'center',
          }}
        >
          {/* Checkmark icon */}
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 999,
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'var(--co-green)',
            }}
            aria-hidden="true"
          >
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--co-text)',
              marginBottom: 10,
              letterSpacing: '-0.02em',
            }}
          >
            確認信已寄出
          </h1>

          <p
            style={{
              fontSize: 14,
              color: 'var(--co-text-dim)',
              lineHeight: 1.7,
              marginBottom: 24,
            }}
          >
            密碼重設連結已寄至
            <br />
            <strong style={{ color: 'var(--co-text)' }}>{email}</strong>
          </p>

          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              width: '100%',
              padding: '11px 16px',
              borderRadius: 'var(--co-btn-r)',
              background: 'linear-gradient(135deg, var(--co-btn-primary-from), var(--co-btn-primary-to))',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
              minHeight: 44,
            }}
          >
            返回登入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--co-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          background: 'var(--co-bg-card)',
          border: '1px solid var(--co-line-strong)',
          borderRadius: 16,
          padding: '40px 32px',
          width: '100%',
          maxWidth: 440,
        }}
      >
        {/* Brand mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: 'linear-gradient(135deg, var(--co-accent-blue), var(--co-accent-2))',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 12c0 4.418-3.582 8-8 8-2.548 0-4.82-1.194-6.3-3.065M4 12C4 7.582 7.582 4 12 4c2.548 0 4.82 1.194 6.3 3.065"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span
            style={{ fontSize: 15, fontWeight: 700, color: 'var(--co-text)', letterSpacing: '-0.01em' }}
          >
            CoverOnes
          </span>
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--co-text)',
            marginBottom: 6,
            letterSpacing: '-0.02em',
          }}
        >
          忘記密碼
        </h1>
        <p
          style={{
            fontSize: 13.5,
            color: 'var(--co-text-dim)',
            lineHeight: 1.6,
            marginBottom: 28,
          }}
        >
          輸入您的 Email，我們將寄送密碼重設連結。
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="fp-email"
              style={{
                display: 'block',
                fontSize: 12.5,
                fontWeight: 600,
                color: 'var(--co-text-dim)',
                marginBottom: 6,
                letterSpacing: '0.01em',
              }}
            >
              Email
            </label>
            <input
              id="fp-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              style={{
                width: '100%',
                height: 42,
                padding: '0 14px',
                background: 'var(--co-bg-3)',
                border: '1px solid var(--co-line-strong)',
                borderRadius: 8,
                fontSize: 14,
                color: 'var(--co-text)',
                outline: 'none',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--co-accent)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--co-line-strong)'; }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '11px 16px',
              borderRadius: 'var(--co-btn-r)',
              background: 'linear-gradient(135deg, var(--co-btn-primary-from), var(--co-btn-primary-to))',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
              minHeight: 44,
              marginBottom: 16,
            }}
          >
            寄送重設連結
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 'var(--co-btn-r)',
              background: 'transparent',
              border: '1px solid var(--co-line-strong)',
              color: 'var(--co-text-dim)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            返回登入
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
