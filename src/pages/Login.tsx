/**
 * Login — 登入企業帳號
 *
 * Design source: design-reference/chat/project/Login.html + shared.css
 * Route: /login
 *
 * Split layout: left hero (brand + tagline + stats + illustration) | right card
 * RWD: single column below 768px (hero hidden, card full-width)
 *
 * Auth wiring: uses existing authApi.login + authApi.me + useAuthStore.login
 * (identical to previous Login.tsx — only UI is replaced, no auth logic changes)
 *
 * ARIA: form inputs labelled via htmlFor/id, errors as role="alert",
 *       password toggle has aria-label, no window.alert usage.
 * Tokens: all colours via --co-* tokens or exact values from Login.html (no raw hex drift).
 */

import { useState, useId } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { authApi, oauthStartUrl } from '../lib/api/coverones';

// NOTE: No remember-me / remember-device state here — the backend has no
// persistent session / remember-me API.  The field was removed to avoid
// misleading users (auth-honesty PR requirement).

// ─── Inline SVG atoms ────────────────────────────────────────────────────────

const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2"/>
    <path d="m3 7 9 6 9-6"/>
  </svg>
);

const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2"/>
    <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
  </svg>
);

const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 5l7 7-7 7"/>
  </svg>
);

const IconLockSmall = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2"/>
    <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
  </svg>
);


// ─── Owl brand mark SVG ──────────────────────────────────────────────────────

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

// ─── Google coloured logo ────────────────────────────────────────────────────

const IconGoogle = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 1 1-3.3-12.6l5.7-5.7A20 20 0 1 0 44 24a20 20 0 0 0-.4-3.5z"/>
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12a12 12 0 0 1 7.7 2.8l5.7-5.7A20 20 0 0 0 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44a20 20 0 0 0 13.5-5.2l-6.2-5.3A12 12 0 0 1 12.7 28l-6.5 5A20 20 0 0 0 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.5l6.2 5.3C37 39.8 44 34 44 24a20 20 0 0 0-.4-3.5z"/>
  </svg>
);


// LINE
const IconLine = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="1" y="1" width="22" height="22" rx="5" fill="#06C755"/>
    <path d="M19 10.7c0-3.1-3.1-5.7-7-5.7s-7 2.6-7 5.7c0 2.8 2.5 5.2 5.9 5.6.2 0 .5.1.6.3.1.2.1.5 0 .7l-.1.5c0 .2-.2.7.6.4 1-.4 4.7-3 4.9-3.1 1.3-1.1 2.1-2.6 2.1-4.4z" fill="#fff"/>
  </svg>
);

// ─── Hero illustration (city + network nodes) ─────────────────────────────────

const HeroScene = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 720 720"
    fill="none"
    style={{ position: 'absolute', right: -80, top: 80, width: 720, height: 720, zIndex: 1, pointerEvents: 'none' }}
  >
    <defs>
      <radialGradient id="lgGlobeG" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#1E293B" stopOpacity="0.9"/>
        <stop offset="60%" stopColor="#0F172A" stopOpacity="0.5"/>
        <stop offset="100%" stopColor="#0B1220" stopOpacity="0"/>
      </radialGradient>
      <linearGradient id="lgLineG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#6366F1" stopOpacity="0"/>
        <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.9"/>
        <stop offset="100%" stopColor="#22D3EE" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="lgCardG1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1E293B"/>
        <stop offset="100%" stopColor="#0B1220"/>
      </linearGradient>
      <radialGradient id="lgNodeG">
        <stop offset="0%" stopColor="#A78BFA"/>
        <stop offset="100%" stopColor="#6366F1"/>
      </radialGradient>
      <filter id="lgGlow">
        <feGaussianBlur stdDeviation="3" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <circle cx="360" cy="360" r="320" fill="url(#lgGlobeG)"/>
    <circle cx="360" cy="360" r="280" stroke="rgba(148,163,184,0.12)" strokeWidth="1" fill="none"/>
    <circle cx="360" cy="360" r="220" stroke="rgba(148,163,184,0.16)" strokeWidth="1" fill="none" strokeDasharray="2 6"/>
    <circle cx="360" cy="360" r="160" stroke="rgba(148,163,184,0.2)" strokeWidth="1" fill="none"/>
    <circle cx="360" cy="360" r="100" stroke="rgba(99,102,241,0.3)" strokeWidth="1" fill="none"/>
    <g opacity="0.55">
      <path d="M120 460 L120 420 L140 420 L140 380 L160 380 L160 410 L185 410 L185 360 L210 360 L210 340 L225 340 L225 320 L245 320 L245 380 L265 380 L265 350 L290 350 L290 330 L315 330 L315 290 L335 290 L335 270 L355 270 L355 250 L380 250 L380 290 L405 290 L405 320 L425 320 L425 280 L450 280 L450 350 L475 350 L475 310 L500 310 L500 360 L525 360 L525 330 L550 330 L550 380 L575 380 L575 410 L600 410 L600 460 Z"
        fill="#0B1220" stroke="rgba(99,102,241,0.4)" strokeWidth="0.8"/>
      <g fill="#6366F1" opacity="0.7">
        <rect x="130" y="430" width="2" height="3"/><rect x="135" y="430" width="2" height="3"/>
        <rect x="148" y="395" width="2" height="3"/><rect x="148" y="400" width="2" height="3"/>
        <rect x="195" y="380" width="2" height="3"/><rect x="195" y="390" width="2" height="3"/><rect x="200" y="380" width="2" height="3"/>
        <rect x="252" y="395" width="2" height="3"/><rect x="258" y="395" width="2" height="3"/>
        <rect x="320" y="305" width="2" height="3"/><rect x="325" y="310" width="2" height="3"/>
        <rect x="365" y="265" width="2" height="3"/><rect x="370" y="270" width="2" height="3"/>
        <rect x="412" y="305" width="2" height="3"/>
        <rect x="460" y="295" width="2" height="3"/><rect x="465" y="300" width="2" height="3"/>
        <rect x="510" y="345" width="2" height="3"/>
        <rect x="555" y="395" width="2" height="3"/><rect x="560" y="400" width="2" height="3"/>
      </g>
    </g>
    <g strokeLinecap="round" fill="none">
      <path d="M180 250 Q 360 100 540 220" stroke="url(#lgLineG)" strokeWidth="1.5" strokeDasharray="4 6"/>
      <path d="M120 380 Q 250 320 420 380" stroke="url(#lgLineG)" strokeWidth="1.5" strokeDasharray="4 6"/>
      <path d="M540 220 Q 580 350 460 460" stroke="url(#lgLineG)" strokeWidth="1.5" strokeDasharray="4 6"/>
      <path d="M180 250 Q 230 380 340 460" stroke="url(#lgLineG)" strokeWidth="1.2" strokeDasharray="3 5"/>
      <path d="M460 460 Q 380 490 340 460" stroke="rgba(99,102,241,0.3)" strokeWidth="1" strokeDasharray="2 4"/>
    </g>
    <g filter="url(#lgGlow)">
      <g transform="translate(180 250)">
        <circle r="26" fill="url(#lgCardG1)" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5"/>
        <rect x="-9" y="-6" width="18" height="13" rx="2" fill="none" stroke="#A78BFA" strokeWidth="1.5"/>
        <path d="M-5 -6 V-9 H5 V-6" stroke="#A78BFA" strokeWidth="1.5" fill="none"/>
      </g>
      <g transform="translate(540 220)">
        <circle r="30" fill="url(#lgCardG1)" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5"/>
        <path d="M-10 8 V-6 L-2 -10 L-2 -2 L8 -6 V8 Z" fill="none" stroke="#C4B5FD" strokeWidth="1.5"/>
        <rect x="0" y="3" width="4" height="5" fill="#C4B5FD"/>
      </g>
      <g transform="translate(120 380)">
        <circle r="22" fill="url(#lgCardG1)" stroke="rgba(34,211,238,0.5)" strokeWidth="1.5"/>
        <circle cx="-3" cy="-2" r="3.5" fill="none" stroke="#67E8F9" strokeWidth="1.4"/>
        <circle cx="4" cy="-2" r="3.5" fill="none" stroke="#67E8F9" strokeWidth="1.4"/>
        <path d="M-7 7 Q 0 12 7 7" stroke="#67E8F9" strokeWidth="1.4" fill="none"/>
      </g>
      <g transform="translate(420 380)">
        <circle r="34" fill="url(#lgCardG1)" stroke="rgba(99,102,241,0.6)" strokeWidth="1.5"/>
        <path d="M-14 0 L-6 -8 L0 -2 L6 -8 L14 0 L8 6 L4 2 L-4 10 L-10 4 Z"
          fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinejoin="round"/>
      </g>
      <g transform="translate(340 460)">
        <circle r="20" fill="url(#lgCardG1)" stroke="rgba(139,92,246,0.5)" strokeWidth="1.5"/>
        <rect x="-8" y="-6" width="16" height="12" rx="1.5" fill="none" stroke="#C4B5FD" strokeWidth="1.4"/>
        <line x1="-5" y1="-2" x2="5" y2="-2" stroke="#C4B5FD" strokeWidth="1.2"/>
        <line x1="-5" y1="1" x2="5" y2="1" stroke="#C4B5FD" strokeWidth="1.2"/>
        <line x1="-5" y1="4" x2="2" y2="4" stroke="#C4B5FD" strokeWidth="1.2"/>
      </g>
    </g>
    <g>
      <circle cx="280" cy="180" r="3" fill="#A78BFA" opacity="0.7"/>
      <circle cx="460" cy="150" r="2.5" fill="#67E8F9" opacity="0.6"/>
      <circle cx="600" cy="340" r="2.5" fill="#A78BFA" opacity="0.7"/>
      <circle cx="240" cy="500" r="3" fill="#67E8F9" opacity="0.6"/>
      <circle cx="500" cy="540" r="2.5" fill="#A78BFA" opacity="0.7"/>
    </g>
  </svg>
);

// ─── Floating promo cards ─────────────────────────────────────────────────────

const FloatingCards = () => (
  <>
    {/* Card 1 — company card */}
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', right: 80, top: 180, width: 220, zIndex: 3,
        background: 'rgba(15,23,42,0.85)', border: '1px solid var(--co-line-strong)',
        borderRadius: 12, padding: '12px 14px', backdropFilter: 'blur(12px)',
        boxShadow: '0 12px 30px rgba(0,0,0,0.5)', fontSize: 12,
        animation: 'lgFloat1 6s ease-in-out infinite',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg, var(--co-accent-blue), var(--co-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>B</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--co-text)' }}>採購方 B</div>
          <div style={{ fontSize: 10.5, color: 'var(--co-text-muted)' }}>已驗證 · 科技業</div>
        </div>
        <span style={{ marginLeft: 'auto', width: 16, height: 16, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', color: 'var(--co-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--co-text-dim)', lineHeight: 1.5 }}>正在尋找合作夥伴</div>
    </div>

    {/* Card 2 — live match */}
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', right: 320, top: 540, width: 240, zIndex: 3,
        background: 'rgba(15,23,42,0.85)', border: '1px solid var(--co-line-strong)',
        borderRadius: 12, padding: '12px 14px', backdropFilter: 'blur(12px)',
        boxShadow: '0 12px 30px rgba(0,0,0,0.5)', fontSize: 12,
        animation: 'lgFloat2 7s ease-in-out infinite',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--co-cyan)', marginBottom: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--co-cyan)', boxShadow: '0 0 8px var(--co-cyan)', flexShrink: 0 }}></span>
        即時媒合 · 3 家企業正在洽談
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {[
          ['A', 'linear-gradient(135deg,var(--co-amber),var(--co-red))'],
          ['B', 'linear-gradient(135deg,var(--co-green),#059669)'],
          ['C', 'linear-gradient(135deg,var(--co-accent-2),var(--co-pink))'],
        ].map(([ch, bg], i) => (
          <div key={ch} style={{ width: 28, height: 28, borderRadius: 7, background: bg, border: '2px solid var(--co-bg-3)', marginLeft: i > 0 ? -10 : 0, fontSize: 11, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 3 - i }}>{ch}</div>
        ))}
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--co-text)' }}>企業數位轉型專案</div>
      <div style={{ fontSize: 10.5, color: 'var(--co-text-muted)', marginTop: 2 }}>已有多家廠商洽談中</div>
    </div>

    {/* Card 3 — encryption */}
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', left: 60, top: 480, width: 200, zIndex: 3,
        background: 'rgba(15,23,42,0.85)', border: '1px solid var(--co-line-strong)',
        borderRadius: 12, padding: '12px 14px', backdropFilter: 'blur(12px)',
        boxShadow: '0 12px 30px rgba(0,0,0,0.5)', fontSize: 12,
        animation: 'lgFloat1 8s ease-in-out infinite',
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(34,211,238,0.15)', color: 'var(--co-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--co-text)' }}>端對端加密</div>
          <div style={{ fontSize: 10.5, color: 'var(--co-text-muted)' }}>商業機密安全傳輸</div>
        </div>
      </div>
    </div>
  </>
);

// ─── Main component ───────────────────────────────────────────────────────────

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  // resetSuccess is set by ResetPasswordPage after a successful password reset.
  const resetSuccess = (location.state as { resetSuccess?: boolean } | null)?.resetSuccess === true;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);

  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('請輸入 Email。'); return; }
    if (!password.trim()) { setError('請輸入密碼。'); return; }

    setIsLoading(true);
    setError('');

    try {
      const tokenRes = await authApi.login({ email, password });
      const user = await authApi.me(tokenRes.accessToken);
      login(tokenRes.accessToken, tokenRes.refreshToken, user);
      navigate('/jobs', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        // Backend returns {"error":{"code":"...","message":"..."}} nested under "error"
        type ApiError = { error?: { code?: string; message?: string }; code?: string; message?: string };
        const data = err.response?.data as ApiError | undefined;
        const code = data?.error?.code ?? data?.code;
        const byCode: Record<string, string> = {
          RATE_LIMITED: '操作過於頻繁，請稍後再試。',
          INVALID_CREDENTIALS: '帳號或密碼錯誤，請再試一次。',
          ACCOUNT_DISABLED: '此帳號已停用，請聯絡客服。',
        };
        setError(
          (code && byCode[code]) ??
            data?.error?.message ??
            data?.message ??
            '登入失敗，請確認您的帳號與密碼。'
        );
      } else {
        setError('登入失敗，請確認您的帳號與密碼。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Keyframe animations */}
      <style>{`
        @keyframes lgFloat1 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes lgFloat2 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
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
          display: 'grid',
          /* Desktop: 1fr | 560px. Mobile (<768px): single column via @media below */
        }}
        className="lg-page"
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
          className="lg-hero"
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
              <span style={{ width: 18, height: 18, borderRadius: 999, background: 'linear-gradient(135deg, var(--co-accent), var(--co-accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600 }}>B2B</span>
              <span>專為台灣企業打造的合作網絡</span>
            </div>

            {/* Tagline */}
            <h1
              style={{
                fontFamily: "'Noto Sans TC','Inter',sans-serif",
                fontWeight: 700, fontSize: 'clamp(40px, 4.5vw, 64px)',
                lineHeight: 1.08, letterSpacing: '-0.025em', margin: '0 0 20px 0',
                background: 'linear-gradient(180deg, #FFFFFF 0%, #C7D2FE 100%)',
                WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
              }}
            >
              連結企業
              <span style={{ color: 'var(--co-accent)', WebkitTextFillColor: 'var(--co-accent)', margin: '0 4px' }}>．</span>
              媒合專案
              <span style={{ color: 'var(--co-accent)', WebkitTextFillColor: 'var(--co-accent)', margin: '0 4px' }}>．</span>
              共創商機
            </h1>

            <p style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--co-text-dim)', maxWidth: 520, margin: '0 0 36px 0', fontWeight: 400 }}>
              從上市公司到新創團隊，CoverOnes 連結企業合作夥伴、媒合專案需求，並以加密通訊安心協作。
            </p>

            {/* Brand trust strip — no fabricated numbers */}
            <div style={{ display: 'flex', gap: 24, marginTop: 16, paddingTop: 28, borderTop: '1px solid var(--co-line)', flexWrap: 'wrap' }}>
              {['統編驗證', 'AI 智慧媒合', '合約簽署', '發票結算'].map((feat) => (
                <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--co-accent)', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--co-text-dim)', fontWeight: 500 }}>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero illustration + floating cards */}
          <HeroScene />
          <FloatingCards />
        </section>

        {/* ── RIGHT: Login card ── */}
        <section style={{ padding: '36px 56px 36px 0', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }} className="lg-right">
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
              🌐 繁體中文 ▾
            </span>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 999,
                background: 'rgba(15,23,42,0.6)', border: '1px solid var(--co-line)',
                fontSize: 12, color: 'var(--co-text-dim)', backdropFilter: 'blur(10px)',
              }}
            >
              需要協助？
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
              <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px 0', color: 'var(--co-text)' }}>
                登入企業帳號
              </h2>
              <p style={{ fontSize: 13.5, color: 'var(--co-text-dim)', margin: '0 0 26px 0' }}>
                使用您的公司 Email 登入，開始探索合作機會。
              </p>

              {/* Reset-success banner (shown after a successful password reset) */}
              {resetSuccess && (
                <div
                  role="status"
                  style={{
                    padding: '10px 14px', marginBottom: 16,
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: 10, fontSize: 13, color: '#4ade80',
                  }}
                >
                  密碼已重設，請使用新密碼登入。
                </div>
              )}

              {/* Error banner */}
              {error && (
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
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate aria-describedby={error ? errorId : undefined}>
                {/* Email field */}
                <div style={{ marginBottom: 14 }}>
                  <label
                    htmlFor={emailId}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--co-text-dim)', marginBottom: 7, fontWeight: 500 }}
                  >
                    電子郵件
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
                      disabled={isLoading}
                      onFocus={() => setEmailFocus(true)}
                      onBlur={() => setEmailFocus(false)}
                      aria-required="true"
                      style={{ flex: 1, fontSize: 14, background: 'transparent', border: 'none', outline: 'none', color: 'var(--co-text)' }}
                    />
                  </div>
                </div>

                {/* Password field */}
                <div style={{ marginBottom: 4 }}>
                  <label
                    htmlFor={passwordId}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--co-text-dim)', marginBottom: 7, fontWeight: 500 }}
                  >
                    密碼
                  </label>
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      height: 46, padding: '0 14px',
                      background: passwordFocus ? 'rgba(6,10,20,0.8)' : 'rgba(6,10,20,0.6)',
                      border: `1px solid ${passwordFocus ? 'var(--co-accent)' : 'var(--co-line-strong)'}`,
                      borderRadius: 11,
                      boxShadow: passwordFocus ? '0 0 0 4px rgba(99,102,241,0.16)' : 'none',
                      transition: 'border-color 150ms, box-shadow 150ms, background 150ms',
                    }}
                  >
                    <span style={{ color: 'var(--co-text-muted)', display: 'flex', flexShrink: 0 }}>
                      <IconLock />
                    </span>
                    <input
                      id={passwordId}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      onFocus={() => setPasswordFocus(true)}
                      onBlur={() => setPasswordFocus(false)}
                      aria-required="true"
                      style={{ flex: 1, fontSize: 14, background: 'transparent', border: 'none', outline: 'none', color: 'var(--co-text)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
                      style={{ color: 'var(--co-text-muted)', fontSize: 12, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                    >
                      {showPassword ? '隱藏' : '顯示'}
                    </button>
                  </div>
                </div>

                {/* Forgot password */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '4px 0 22px 0' }}>
                  <Link to="/forgot-password" style={{ fontSize: 13, color: '#C7D2FE' }}>
                    忘記密碼？
                  </Link>
                </div>

                {/* Primary CTA */}
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%', height: 48, borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg, #2563EB 0%, #6366F1 50%, #8B5CF6 100%)',
                    color: '#fff', fontWeight: 600, fontSize: 15,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: '0 10px 24px rgba(99,102,241,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset, 0 -2px 0 rgba(0,0,0,0.15) inset',
                    letterSpacing: '0.02em',
                    cursor: isLoading ? 'wait' : 'pointer',
                    opacity: isLoading ? 0.8 : 1,
                    transition: 'opacity 150ms',
                  }}
                  aria-busy={isLoading}
                >
                  {isLoading && (
                    <span
                      aria-hidden="true"
                      style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }}
                    />
                  )}
                  {isLoading ? '登入中…' : '登入 CoverOnes'}
                  {!isLoading && <IconArrowRight />}
                </button>
              </form>

              {/* SSO divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0 16px 0', color: 'var(--co-text-muted)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                <span style={{ flex: 1, height: 1, background: 'var(--co-line)' }} />
                或使用 SSO 登入
                <span style={{ flex: 1, height: 1, background: 'var(--co-line)' }} />
              </div>

              {/* SSO grid — Google + LINE only (full-page redirect to backend OAuth start) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                {(
                  [
                    { icon: <IconGoogle />, label: 'Google', provider: 'google' },
                    { icon: <IconLine />, label: 'LINE', provider: 'line' },
                  ] as const
                ).map(({ icon, label, provider }) => (
                  <button
                    key={provider}
                    type="button"
                    aria-label={`使用 ${label} 登入`}
                    onClick={() => { window.location.href = oauthStartUrl(provider, '/jobs'); }}
                    style={{
                      height: 42, borderRadius: 10, border: 'none',
                      background: 'rgba(15,23,42,0.5)', borderStyle: 'solid', borderWidth: 1, borderColor: 'var(--co-line-strong)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      fontSize: 13, fontWeight: 500, color: 'var(--co-text)',
                      cursor: 'pointer',
                      opacity: 1,
                      transition: 'background 150ms, border-color 150ms',
                    }}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>

              {/* Footer: sign up link */}
              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--co-text-dim)', marginTop: 22, paddingTop: 20, borderTop: '1px solid var(--co-line)' }}>
                還沒有公司帳號？
                <Link to="/register" style={{ color: '#C7D2FE', fontWeight: 600, marginLeft: 4 }}>
                  立即註冊企業
                </Link>
              </div>

              {/* Legal */}
              <div style={{ paddingTop: 16, textAlign: 'center', fontSize: 11, color: 'var(--co-text-muted)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--co-cyan)', marginRight: 8 }}>
                  <IconLockSmall />
                  SOC 2 Type II · ISO 27001
                </span>
                <Link to="/terms" style={{ color: 'var(--co-text-dim)', margin: '0 6px' }}>服務條款</Link>
                ·
                <Link to="/privacy" style={{ color: 'var(--co-text-dim)', margin: '0 6px' }}>隱私政策</Link>
                ·
                <Link to="/enterprise" style={{ color: 'var(--co-text-dim)', margin: '0 6px' }}>企業合約</Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* RWD styles */}
      <style>{`
        .lg-page {
          grid-template-columns: 1fr 560px;
        }
        .lg-hero {
          display: flex;
        }
        @media (max-width: 767px) {
          .lg-page {
            grid-template-columns: 1fr !important;
          }
          .lg-hero {
            display: none !important;
          }
          .lg-right {
            padding: 24px 20px !important;
          }
          .lg-right > div:last-child {
            padding: 20px 0 !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1199px) {
          .lg-page {
            grid-template-columns: 1fr 480px !important;
          }
        }
      `}</style>
    </>
  );
};

export default Login;
