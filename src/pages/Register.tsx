import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../lib/api/coverones';
import { AuthHeroPanel } from '../components/auth/AuthHeroPanel';
import type { AxiosError } from 'axios';

type AccountType = 'FREELANCER' | 'CLIENT';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('FREELANCER');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fieldStyle: React.CSSProperties = {
    height: 46,
    padding: '0 14px',
    background: 'var(--color-input-bg)',
    border: '1px solid var(--co-line)',
    borderRadius: 11,
    fontSize: 14,
    color: 'var(--co-text)',
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 150ms',
    display: 'block',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--co-text-dim)',
    marginBottom: 7,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !displayName.trim()) {
      setError('All fields are required.');
      return;
    }
    if (password.length < 12) {
      setError('Password must be at least 12 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authApi.register({ email, password, displayName, accountType });
      // Auto-login after register
      const tokenRes = await authApi.login({ email, password });
      const user = await authApi.me();
      login(tokenRes.accessToken, tokenRes.refreshToken, user);
      navigate('/jobs', { replace: true });
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setError(axErr.response?.data?.message ?? 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
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
      {/* Grid texture */}
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

      {/* LEFT: Hero */}
      <AuthHeroPanel
        title="Join CoverOnes Today"
        subtitle="Create your verified account and start connecting with top talent or high-quality clients in Taiwan."
        badge="Taiwan Freelance Marketplace"
      />

      {/* RIGHT: Form */}
      <section style={{ padding: '36px 56px 36px 0', display: 'flex', flexDirection: 'column', alignItems: 'stretch', overflowY: 'auto' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 24, paddingBottom: 24 }}>
          <div style={{
            width: 480,
            background: 'var(--co-bg-card-2)',
            border: '1px solid var(--co-line)',
            borderRadius: 20,
            padding: '36px 36px 28px 36px',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px 0', color: 'var(--co-text)' }}>
              Create Account
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--co-text-dim)', margin: '0 0 24px 0' }}>
              Join the CoverOnes marketplace.
            </p>

            {error && (
              <div
                role="alert"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', marginBottom: 16,
                  background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 10, fontSize: 13, color: '#FCA5A5',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label htmlFor="reg-displayName" style={labelStyle}>Display Name</label>
                <input
                  id="reg-displayName"
                  type="text"
                  autoComplete="name"
                  placeholder="Your full name"
                  maxLength={80}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isLoading}
                  style={fieldStyle}
                />
              </div>

              <div>
                <label htmlFor="reg-email" style={labelStyle}>Email</label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  style={fieldStyle}
                />
              </div>

              <div>
                <label htmlFor="reg-password" style={labelStyle}>Password (min 12 chars)</label>
                <input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  minLength={12}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  style={fieldStyle}
                />
              </div>

              <div>
                <label htmlFor="reg-confirmPassword" style={labelStyle}>Confirm Password</label>
                <input
                  id="reg-confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  style={fieldStyle}
                />
              </div>

              <div>
                <label htmlFor="reg-accountType" style={labelStyle}>Account Type</label>
                <select
                  id="reg-accountType"
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as AccountType)}
                  disabled={isLoading}
                  style={{ ...fieldStyle, appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="FREELANCER">Freelancer</option>
                  <option value="CLIENT">Client</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%', height: 48, borderRadius: 12,
                  background: 'linear-gradient(135deg, #2563EB 0%, #6366F1 50%, #8B5CF6 100%)',
                  color: '#fff', fontWeight: 600, fontSize: 15, border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 10px 24px rgba(99,102,241,0.4)',
                  cursor: isLoading ? 'wait' : 'pointer',
                  opacity: isLoading ? 0.75 : 1,
                  transition: 'opacity 150ms',
                  marginTop: 6,
                }}
              >
                {isLoading && (
                  <span style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} aria-hidden="true" />
                )}
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--co-text-dim)', marginTop: 22, paddingTop: 20, borderTop: '1px solid var(--co-line)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#C7D2FE', fontWeight: 600 }}>
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Register;
