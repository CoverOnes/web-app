import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../lib/api/coverones';
import { AuthHeroPanel } from '../components/auth/AuthHeroPanel';
import type { AxiosError } from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required'); return; }
    if (!password.trim()) { setError('Password is required'); return; }

    setIsLoading(true);
    setError('');

    try {
      const tokenRes = await authApi.login({ email, password });
      // Pass token directly — store not yet updated, so interceptor can't see it.
      const user = await authApi.me(tokenRes.accessToken);
      login(tokenRes.accessToken, tokenRes.refreshToken, user);
      navigate('/jobs', { replace: true });
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setError(axErr.response?.data?.message ?? 'Login failed. Please check your credentials.');
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
        title="Work Smarter. Build Faster."
        subtitle="CoverOnes connects verified freelancers with top clients in Taiwan. Post a job or place your first bid today."
      />

      {/* RIGHT: Form */}
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
            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px 0', color: 'var(--co-text)' }}>
              Sign In
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--co-text-dim)', margin: '0 0 26px 0' }}>
              Welcome back to CoverOnes.
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

            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div style={{ marginBottom: 14 }}>
                <label htmlFor="login-email" style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--co-text-dim)', marginBottom: 7 }}>
                  Email
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  height: 46, padding: '0 14px',
                  background: 'var(--color-input-bg)',
                  border: `1px solid ${emailFocus ? 'var(--color-indigo)' : 'var(--co-line)'}`,
                  borderRadius: 11,
                  boxShadow: emailFocus ? '0 0 0 4px rgba(99,102,241,0.16)' : 'none',
                  transition: 'border-color 150ms, box-shadow 150ms',
                }}>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    onFocus={() => setEmailFocus(true)}
                    onBlur={() => setEmailFocus(false)}
                    style={{ flex: 1, fontSize: 14, background: 'transparent', border: 'none', outline: 'none', color: 'var(--co-text)' }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 22 }}>
                <label htmlFor="login-password" style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--co-text-dim)', marginBottom: 7 }}>
                  Password
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  height: 46, padding: '0 14px',
                  background: 'var(--color-input-bg)',
                  border: `1px solid ${passwordFocus ? 'var(--color-indigo)' : 'var(--co-line)'}`,
                  borderRadius: 11,
                  boxShadow: passwordFocus ? '0 0 0 4px rgba(99,102,241,0.16)' : 'none',
                  transition: 'border-color 150ms, box-shadow 150ms',
                }}>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    onFocus={() => setPasswordFocus(true)}
                    onBlur={() => setPasswordFocus(false)}
                    style={{ flex: 1, fontSize: 14, background: 'transparent', border: 'none', outline: 'none', color: 'var(--co-text)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{ color: 'var(--co-text-dim)', fontSize: 12, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Submit */}
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
                }}
              >
                {isLoading && (
                  <span style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} aria-hidden="true" />
                )}
                {isLoading ? 'Signing in...' : 'Sign in to CoverOnes'}
              </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--co-text-dim)', marginTop: 22, paddingTop: 20, borderTop: '1px solid var(--co-line)' }}>
              Don&apos;t have an account?{' '}
              <Link to="/register" style={{ color: '#C7D2FE', fontWeight: 600 }}>
                Register
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Login;
