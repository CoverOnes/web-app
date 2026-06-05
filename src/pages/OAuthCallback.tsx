/**
 * OAuthCallback — social-login (Google OIDC / LINE v2.1) landing page.
 *
 * Route: /oauth/callback (public). The user service 302-redirects the browser
 * here after the provider handshake. See the social-login contract §2.6 / §5.3.
 *
 * Success (login or new user):
 *   Location ...#refresh_token=<rt>&redirect=<safe-path>[&new=1]
 *   - The refresh token arrives in the URL FRAGMENT (never query / never logged).
 *   - The access token is NOT in the URL — we exchange the refresh token via the
 *     existing public POST /v1/auth/refresh, then GET /me, then authStore.login.
 *   - The fragment is scrubbed from history BEFORE navigating so the refresh
 *     token never lingers.
 *   - new=1 → route the new social user into the existing 實名制/KYC flow (/kyc),
 *     they are logged in but PENDING_VERIFICATION; write actions stay gated.
 *
 * Error (query, carries no secret):
 *   Location ...?oauth_error=<code>[&provider=...&email=<masked>]
 *   - NEVER auto-link on email: email_exists tells the user to log in with their
 *     existing method first, then bind in Settings (contract §5.5). We do NOT log
 *     them in and do NOT link.
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../lib/api/coverones';
import { AuthHeroPanel } from '../components/auth/AuthHeroPanel';

type Phase = 'exchanging' | 'error';

interface ErrorView {
  title: string;
  body: string;
  // Primary CTA target + label.
  ctaTo: string;
  ctaLabel: string;
}

// Map an oauth_error code (+ optional provider/email) to a localized message.
// email_exists / identity_taken are the never-auto-link outcomes (contract §5.5).
function buildErrorView(code: string, provider: string | null, maskedEmail: string | null): ErrorView {
  const providerLabel = provider === 'google' ? 'Google' : provider === 'line' ? 'LINE' : '社群帳號';
  switch (code) {
    case 'email_exists':
      return {
        title: '此 email 已有帳號',
        body:
          `此 email${maskedEmail ? `（${maskedEmail}）` : ''}已有 CoverOnes 帳號。` +
          `請先用你原本的方式登入，登入後到「設定 → 社群帳號綁定」綁定 ${providerLabel}。`,
        ctaTo: '/login',
        ctaLabel: '前往登入',
      };
    case 'identity_taken':
      return {
        title: '帳號已被綁定',
        body: `此 ${providerLabel} 帳號已綁定到其他 CoverOnes 帳號，無法重複綁定。`,
        ctaTo: '/login',
        ctaLabel: '前往登入',
      };
    case 'cancelled':
      return { title: '已取消登入', body: '您已取消這次的社群登入。', ctaTo: '/login', ctaLabel: '重新登入' };
    case 'account_suspended':
      return { title: '帳號已停用', body: '此帳號已停用，請聯絡客服。', ctaTo: '/login', ctaLabel: '返回登入' };
    case 'invalid_state':
    case 'verification_failed':
    default:
      return { title: '登入驗證失敗', body: '登入驗證失敗，請重試。', ctaTo: '/login', ctaLabel: '重新登入' };
  }
}

const OAuthCallback = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const clearStaleSession = useAuthStore((s) => s.clearStaleSession);

  const [phase, setPhase] = useState<Phase>('exchanging');
  const [errorView, setErrorView] = useState<ErrorView | null>(null);

  // Guard against React 19 StrictMode double-invocation.
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    // Errors arrive in the query string (no secret); tokens in the fragment.
    const search = new URLSearchParams(window.location.search);
    const oauthError = search.get('oauth_error');
    if (oauthError) {
      setErrorView(
        buildErrorView(oauthError, search.get('provider'), search.get('email')),
      );
      setPhase('error');
      return;
    }

    // Strip the leading '#'; parse the fragment for the refresh token + flags.
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const refreshToken = fragment.get('refresh_token');
    const redirect = fragment.get('redirect');
    const isNew = fragment.get('new') === '1';

    if (!refreshToken) {
      setErrorView(buildErrorView('verification_failed', null, null));
      setPhase('error');
      return;
    }

    // Scrub the fragment from history immediately so the refresh token never
    // lingers in the address bar / back-forward cache.
    window.history.replaceState(null, '', '/oauth/callback');

    // Safe relative-path guard for the redirect target.
    const safeRedirect =
      redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/jobs';

    (async () => {
      try {
        // Exchange the refresh token for an access token (public route), then
        // hydrate the user — identical to the existing post-login path.
        const { accessToken, refreshToken: newRefresh } = await authApi.refresh(refreshToken);
        const user = await authApi.me(accessToken);
        login(accessToken, newRefresh, user);
        // New social users go through the existing 實名制/KYC profile-completion flow.
        navigate(isNew ? '/kyc' : safeRedirect, { replace: true });
      } catch {
        // Token exchange failed → drop any partial state and bounce to login.
        clearStaleSession();
        setErrorView(buildErrorView('verification_failed', null, null));
        setPhase('error');
      }
    })();
  }, [login, clearStaleSession, navigate]);

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
      className="oc-page"
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
        title="社群登入"
        subtitle="正在為您完成登入，請稍候。"
        badge="Social login"
      />

      <section style={{ padding: '36px 56px 36px 0', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }} className="oc-right">
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
            {phase === 'exchanging' && (
              <div role="status" aria-busy="true" style={{ textAlign: 'center', padding: '20px 0' }}>
                <span
                  style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#8B5CF6', animation: 'spin 0.7s linear infinite', display: 'inline-block', marginBottom: 16 }}
                  aria-hidden="true"
                />
                <p style={{ fontSize: 15, color: 'var(--co-text)', fontWeight: 600, margin: 0 }}>
                  正在完成社群登入…
                </p>
              </div>
            )}

            {phase === 'error' && errorView && (
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
                  {errorView.title}
                </h2>
                <p role="alert" style={{ fontSize: 13.5, color: 'var(--co-text-dim)', margin: '0 0 24px 0', lineHeight: 1.6 }}>
                  {errorView.body}
                </p>
                <button
                  type="button"
                  onClick={() => navigate(errorView.ctaTo, { replace: true })}
                  style={{
                    width: '100%', height: 48, borderRadius: 12,
                    background: 'linear-gradient(135deg, #2563EB 0%, #6366F1 50%, #8B5CF6 100%)',
                    color: '#fff', fontWeight: 600, fontSize: 15, border: 'none',
                    boxShadow: '0 10px 24px rgba(99,102,241,0.4)', cursor: 'pointer',
                  }}
                >
                  {errorView.ctaLabel}
                </button>
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 767px) {
          .oc-page { grid-template-columns: 1fr !important; }
          .oc-right { padding: 24px 20px !important; }
        }
      `}</style>
    </div>
  );
};

export default OAuthCallback;
