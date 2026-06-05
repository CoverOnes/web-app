/**
 * Register — 企業註冊
 *
 * Design source: design-reference/chat/project/Signup.html + shared.css
 * Route: /register
 *
 * Split layout: left hero (brand + tagline + stats + partner logos) | right form panel
 * RWD: single column below 768px (hero hidden, form full-width)
 *
 * Auth wiring: uses existing authApi.register + validation utils (unchanged).
 * On 201 → navigate to /register/verify-sent.
 *
 * ARIA: all inputs labelled via htmlFor/id, errors as role="alert",
 *       required fields marked with aria-required, no window.alert.
 * Tokens: all colours via --co-* tokens or exact values from Signup.html.
 */

import { useState, useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi, type AccountType, type RegisterRequest } from '../lib/api/coverones';
import {
  validateLegalName,
  validateNationalId,
  validateCompanyName,
  validatePassword,
} from '../utils/validation';
import type { AxiosError } from 'axios';

// ─── Inline SVG atoms ────────────────────────────────────────────────────────

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/>
  </svg>
);

const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
  </svg>
);

const IconId = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M6 14h.01M10 10h8M10 14h4"/>
  </svg>
);

const IconBuilding = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M15 9h.01M15 13h.01"/>
  </svg>
);

const IconCheckmark = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 5l7 7-7 7"/>
  </svg>
);

// ─── Owl brand mark ──────────────────────────────────────────────────────────

const OwlMark = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="9" cy="10" r="2.4" fill="#fff"/><circle cx="15" cy="10" r="2.4" fill="#fff"/>
    <circle cx="9" cy="10" r="1" fill="#0B1220"/><circle cx="15" cy="10" r="1" fill="#0B1220"/>
    <path d="M11 14.5 L12 16 L13 14.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

// ─── Step type ───────────────────────────────────────────────────────────────

type StepStatus = 'done' | 'active' | 'pending';

interface StepDef {
  n: number;
  label: string;
}

const STEPS: StepDef[] = [
  { n: 1, label: '公司' },
  { n: 2, label: '負責人' },
  { n: 3, label: '密碼' },
  { n: 4, label: '邀請團隊' },
];

// ─── Stepper component ───────────────────────────────────────────────────────

interface StepperProps {
  currentStep: number;
}

function Stepper({ currentStep }: StepperProps) {
  return (
    <div
      role="list"
      aria-label="Registration steps"
      style={{
        display: 'flex', gap: 0, marginBottom: 24,
        background: 'rgba(15,23,42,0.5)', border: '1px solid var(--co-line)',
        borderRadius: 11, padding: 5,
      }}
    >
      {STEPS.map((step) => {
        const status: StepStatus = step.n < currentStep ? 'done' : step.n === currentStep ? 'active' : 'pending';
        return (
          <div
            key={step.n}
            role="listitem"
            aria-current={status === 'active' ? 'step' : undefined}
            style={{
              flex: 1, padding: '9px 10px', borderRadius: 7,
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 11.5,
              color: status === 'done' ? 'var(--co-green)' : status === 'active' ? '#fff' : 'var(--co-text-muted)',
              background: status === 'active' ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.1))' : 'transparent',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 20, height: 20, borderRadius: 5,
                background: status === 'active'
                  ? 'linear-gradient(135deg, var(--co-accent), var(--co-accent-2))'
                  : status === 'done'
                    ? 'rgba(16,185,129,0.18)'
                    : 'var(--co-bg-3)',
                border: status === 'active'
                  ? 'none'
                  : status === 'done'
                    ? '1px solid var(--co-green)'
                    : '1px solid var(--co-line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10.5, fontWeight: 700, color: status === 'done' ? 'var(--co-green)' : '#fff',
                flexShrink: 0,
              }}
            >
              {status === 'done' ? <IconCheckmark /> : step.n}
            </div>
            {step.label}
          </div>
        );
      })}
    </div>
  );
}

// ─── Input wrapper component ─────────────────────────────────────────────────

interface InputFieldProps {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  optionalText?: string;
  hint?: string;
  hintOk?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

function InputField({ id, label, required, optional, optionalText, hint, hintOk, icon, children }: InputFieldProps) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        htmlFor={id}
        style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--co-text)' }}
      >
        {label}
        {required && <span aria-hidden="true" style={{ color: '#FCA5A5', marginLeft: 3 }}>*</span>}
        {optional && <span style={{ color: 'var(--co-text-muted)', fontWeight: 400, marginLeft: 6, fontSize: 11 }}>{optionalText ?? '選填'}</span>}
      </label>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 13px',
          background: 'var(--co-bg-3)',
          border: '1px solid var(--co-line-strong)',
          borderRadius: 10,
          transition: 'all 150ms',
        }}
        className="rg-input-wrap"
      >
        {icon && <span style={{ color: 'var(--co-text-muted)', flexShrink: 0, display: 'flex' }}>{icon}</span>}
        {children}
      </div>
      {hint && (
        <div style={{ fontSize: 11, color: hintOk ? 'var(--co-green)' : 'var(--co-text-muted)', marginTop: 5 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const Register = () => {
  const navigate = useNavigate();

  // Form state — identical contract to previous Register.tsx
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('PERSONAL');
  const [legalName, setLegalName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isPersonal = accountType === 'PERSONAL';
  const isCompany = accountType === 'COMPANY';

  // IDs for ARIA
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const displayNameId = useId();
  const legalNameId = useId();
  const accountTypeId = useId();
  const nationalIdId = useId();
  const companyNameId = useId();
  const errorId = useId();

  const inputStyle: React.CSSProperties = {
    flex: 1, fontSize: 13.5, background: 'transparent', border: 'none', outline: 'none', color: 'var(--co-text)',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim() || !displayName.trim()) {
      setError('請填寫所有必填欄位。');
      return;
    }
    const legalNameErr = validateLegalName(legalName);
    if (legalNameErr) { setError(legalNameErr); return; }

    if (isPersonal) {
      const idErr = validateNationalId(nationalId);
      if (idErr) { setError(idErr); return; }
    }
    if (isCompany) {
      const companyErr = validateCompanyName(companyName);
      if (companyErr) { setError(companyErr); return; }
    }

    const pwErr = validatePassword(password);
    if (pwErr) { setError(pwErr); return; }
    if (password !== confirmPassword) {
      setError('兩次輸入的密碼不一致。');
      return;
    }

    setIsLoading(true);
    setError('');

    const payload: RegisterRequest = isPersonal
      ? {
          email: email.trim(), password, displayName: displayName.trim(),
          accountType: 'PERSONAL', legalName: legalName.trim(),
          nationalId: nationalId.trim().toUpperCase(),
        }
      : {
          email: email.trim(), password, displayName: displayName.trim(),
          accountType: 'COMPANY', legalName: legalName.trim(),
          companyName: companyName.trim(),
        };

    try {
      await authApi.register(payload);
      navigate('/register/verify-sent', { replace: true, state: { email: email.trim() } });
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string; code?: string }>;
      const code = axErr.response?.data?.code;
      const byCode: Record<string, string> = {
        EMAIL_TAKEN: '此 email 已被註冊，請改用其他信箱或直接登入。',
        WEAK_PASSWORD: '密碼強度不足，請使用更長或更複雜的密碼（至少 12 字元）。',
        VALIDATION_ERROR: '輸入資料有誤，請檢查後再試一次。',
        RATE_LIMITED: '操作過於頻繁，請稍後再試。',
      };
      setError(
        (code && byCode[code]) ??
          axErr.response?.data?.message ??
          '註冊失敗，請稍後再試。'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .rg-input-wrap:focus-within {
          border-color: var(--co-accent) !important;
          box-shadow: 0 0 0 4px rgba(99,102,241,0.15);
        }
        .rg-page {
          grid-template-columns: 1fr 620px;
        }
        .rg-hero {
          display: flex;
        }
        @media (max-width: 767px) {
          .rg-page {
            grid-template-columns: 1fr !important;
          }
          .rg-hero {
            display: none !important;
          }
          .rg-right {
            padding: 24px 20px !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1199px) {
          .rg-page {
            grid-template-columns: 1fr 500px !important;
          }
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          background: `
            radial-gradient(1100px 700px at 20% 20%, rgba(99,102,241,0.18), transparent 60%),
            radial-gradient(900px 600px at 90% 80%, rgba(139,92,246,0.12), transparent 60%),
            var(--co-bg)
          `,
          position: 'relative', overflow: 'hidden',
        }}
        className="rg-page"
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
            maskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 80%)',
          }}
        />

        {/* ── LEFT: Hero ── */}
        <section
          aria-hidden="true"
          style={{ padding: '38px 56px', display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}
          className="rg-hero"
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, var(--co-accent), var(--co-accent-2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 24px rgba(99,102,241,0.4)',
              }}
            >
              <OwlMark />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--co-text)' }}>CoverOnes</div>
              <div style={{ fontSize: 11, color: 'var(--co-text-dim)' }}>B2B 接案媒合</div>
            </div>
          </div>

          {/* Hero content */}
          <div style={{ marginTop: 'auto', marginBottom: 'auto', maxWidth: 560, position: 'relative', zIndex: 2 }}>
            {/* Tag */}
            <div
              style={{
                display: 'inline-flex', gap: 8, alignItems: 'center',
                padding: '6px 12px', borderRadius: 999,
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
                fontSize: 11.5, color: '#C7D2FE', fontWeight: 600, marginBottom: 18,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--co-accent)', boxShadow: '0 0 8px var(--co-accent)' }} />
              限時優惠 · 開戶送 90 天 PRO 試用
            </div>

            <h1
              style={{
                fontSize: 'clamp(36px, 3.5vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em',
                lineHeight: 1.1, margin: '0 0 18px', color: 'var(--co-text)',
              }}
            >
              讓您的公司<br />
              <span style={{ background: 'linear-gradient(135deg, #67E8F9 0%, #A78BFA 50%, #F9A8D4 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                被對的買家發現
              </span>
            </h1>

            <p style={{ fontSize: 16, color: 'var(--co-text-dim)', lineHeight: 1.65, margin: '0 0 32px' }}>
              CoverOnes 為台灣 B2B 而生。從統編一鍵驗證、AI 智慧媒合，到合約簽署、發票結算 — 全流程數位化。
            </p>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: 32, marginBottom: 32 }}>
              {[
                { v: '3,420+', l: '已驗證企業' },
                { v: 'NT$ 2.8B', l: '媒合金額' },
                { v: '2.4 天', l: '平均媒合時間' },
              ].map((s) => (
                <div key={s.l}>
                  <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #67E8F9, #A78BFA)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {s.v}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--co-text-dim)', marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Partner logos */}
            <div style={{ fontSize: 11, color: 'var(--co-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, fontWeight: 600 }}>
              合作夥伴
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              {['台積電子', '沛星互動', '中華電信', '玉山銀行', '+ 218 家'].map((name) => (
                <div
                  key={name}
                  style={{
                    padding: '8px 14px', background: 'rgba(15,23,42,0.6)',
                    border: '1px solid var(--co-line)', borderRadius: 8,
                    fontSize: 12.5, fontWeight: 600, color: 'var(--co-text-dim)',
                  }}
                >
                  {name}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 'auto', fontSize: 11.5, color: 'var(--co-text-muted)', display: 'flex', gap: 18 }}>
            <Link to="/terms" style={{ color: 'var(--co-text-muted)' }}>服務條款</Link>
            <Link to="/privacy" style={{ color: 'var(--co-text-muted)' }}>隱私政策</Link>
            <span>© 2026 CoverOnes Inc.</span>
          </div>
        </section>

        {/* ── RIGHT: Form panel ── */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(11,18,32,0.95), rgba(6,10,20,0.99))',
            borderLeft: '1px solid var(--co-line-strong)',
            padding: '36px 48px 40px', overflowY: 'auto', maxHeight: '100vh',
          }}
          className="rg-right"
        >
          {/* Top meta */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ fontSize: 11.5, color: 'var(--co-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Step 1 of 4 · 約需 3 分鐘
            </div>
            <Link to="/login" style={{ fontSize: 13, color: 'var(--co-text-dim)' }}>
              已有帳號？<strong style={{ color: '#A78BFA' }}>登入</strong>
            </Link>
          </div>

          {/* Stepper */}
          <Stepper currentStep={1} />

          <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px', color: 'var(--co-text)' }}>
            建立企業帳號
          </h2>
          <p style={{ fontSize: 13, color: 'var(--co-text-dim)', margin: '0 0 22px', lineHeight: 1.55 }}>
            加入超過 3,000 家台灣企業，開始您的數位化協作之旅。
          </p>

          {/* Error banner */}
          {error && (
            <div
              id={errorId}
              role="alert"
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '10px 14px', marginBottom: 18,
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 10, fontSize: 13, color: '#FCA5A5',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate aria-describedby={error ? errorId : undefined}>
            {/* Display Name */}
            <InputField id={displayNameId} label="顯示名稱" required icon={<IconUser />}>
              <input
                id={displayNameId}
                type="text"
                autoComplete="nickname"
                placeholder="您的暱稱"
                maxLength={80}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
                aria-required="true"
                style={inputStyle}
              />
            </InputField>

            {/* Legal Name */}
            <InputField id={legalNameId} label="真實姓名" required optional optionalText="需與身分證一致" icon={<IconUser />}>
              <input
                id={legalNameId}
                type="text"
                autoComplete="name"
                placeholder="與證件相符的真實姓名"
                maxLength={100}
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                disabled={isLoading}
                aria-required="true"
                style={inputStyle}
              />
            </InputField>

            {/* Email */}
            <InputField id={emailId} label="企業 Email" required optional optionalText="用於接收驗證碼與通知" icon={<IconMail />}>
              <input
                id={emailId}
                type="email"
                autoComplete="email"
                placeholder="you@company.com.tw"
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                aria-required="true"
                style={inputStyle}
              />
            </InputField>

            {/* Account type */}
            <div style={{ marginBottom: 14 }}>
              <label htmlFor={accountTypeId} style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--co-text)' }}>
                帳號類型<span aria-hidden="true" style={{ color: '#FCA5A5', marginLeft: 3 }}>*</span>
              </label>
              <div className="rg-input-wrap" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: 'var(--co-bg-3)', border: '1px solid var(--co-line-strong)', borderRadius: 10, transition: 'all 150ms' }}>
                <select
                  id={accountTypeId}
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as AccountType)}
                  disabled={isLoading}
                  aria-required="true"
                  style={{ flex: 1, fontSize: 13.5, background: 'transparent', border: 'none', outline: 'none', color: 'var(--co-text)', appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="PERSONAL">接案者 / 個人 (Freelancer)</option>
                  <option value="COMPANY">發案方 / 公司 (Client / Company)</option>
                </select>
              </div>
            </div>

            {/* PERSONAL only — national ID */}
            {isPersonal && (
              <InputField id={nationalIdId} label="身分證字號" required icon={<IconId />}>
                <input
                  id={nationalIdId}
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  placeholder="例：A123456789"
                  maxLength={10}
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value.toUpperCase())}
                  disabled={isLoading}
                  aria-required="true"
                  style={{ ...inputStyle, textTransform: 'uppercase' }}
                />
              </InputField>
            )}

            {/* COMPANY only — company name */}
            {isCompany && (
              <InputField id={companyNameId} label="公司名稱" required icon={<IconBuilding />}>
                <input
                  id={companyNameId}
                  type="text"
                  autoComplete="organization"
                  placeholder="貴公司全名"
                  maxLength={100}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={isLoading}
                  aria-required="true"
                  style={inputStyle}
                />
              </InputField>
            )}

            {/* Password */}
            <InputField id={passwordId} label="密碼" required optional optionalText="至少 12 字元" icon={<IconLock />}>
              <input
                id={passwordId}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="建立一個強密碼"
                minLength={12}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                aria-required="true"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
                style={{ color: 'var(--co-text-muted)', fontSize: 12, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
              >
                {showPassword ? '隱藏' : '顯示'}
              </button>
            </InputField>

            {/* Confirm password */}
            <InputField id={confirmId} label="確認密碼" required icon={<IconLock />}>
              <input
                id={confirmId}
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="再次輸入密碼"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                aria-required="true"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                aria-label={showConfirm ? '隱藏確認密碼' : '顯示確認密碼'}
                style={{ color: 'var(--co-text-muted)', fontSize: 12, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
              >
                {showConfirm ? '隱藏' : '顯示'}
              </button>
            </InputField>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              style={{
                padding: 13, borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600,
                background: 'linear-gradient(135deg, var(--co-accent), var(--co-accent-2))',
                color: '#fff', boxShadow: '0 8px 26px rgba(99,102,241,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
                cursor: isLoading ? 'wait' : 'pointer',
                opacity: isLoading ? 0.8 : 1,
                transition: 'all 150ms', marginTop: 6,
              }}
            >
              {isLoading && (
                <span
                  aria-hidden="true"
                  style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }}
                />
              )}
              {isLoading ? '建立帳號中…' : (
                <>
                  下一步：設定公司資料
                  <IconArrow />
                </>
              )}
            </button>
          </form>

          {/* Terms */}
          <div style={{ fontSize: 11.5, color: 'var(--co-text-muted)', marginTop: 14, textAlign: 'center', lineHeight: 1.55 }}>
            點擊「下一步」表示您同意{' '}
            <Link to="/terms" style={{ color: '#A78BFA' }}>服務條款</Link>、
            <Link to="/privacy" style={{ color: '#A78BFA' }}>隱私政策</Link>{' '}
            及{' '}
            <Link to="/b2b-terms" style={{ color: '#A78BFA' }}>B2B 商業條款</Link>
          </div>

          {/* Login link */}
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--co-text-dim)', marginTop: 14 }}>
            已有帳號？
            <Link to="/login" style={{ color: '#A78BFA', fontWeight: 600, marginLeft: 4 }}>
              直接登入 →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
