import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useResendVerification } from '../../lib/query';
import { Icon } from '../ui/Icon';
import type { AxiosError } from 'axios';

const DISMISS_KEY = 'coverones_unverified_banner_dismissed';

// Cooldown duration in seconds after a successful resend.
// NOTE: this client-side cooldown is a UX affordance only — the real rate-limit
// is enforced server-side by NewEmailVerificationLimiter in
// user/internal/platform/middleware/ratelimit.go. Do not rely on this timer as
// a security control.
const RESEND_COOLDOWN_SEC = 60;

/**
 * auth Increment 1: persistent, dismissible-per-session banner shown across the
 * app whenever the logged-in user's emailVerified === false. Dismissal is stored
 * in sessionStorage, so it reappears on a new session (browser/tab restart) until
 * the user actually verifies.
 *
 * Rendered once inside the app layout (CoverOnesLayout), above the page outlet.
 *
 * auth-polish (B):
 * 1. Clear the sessionStorage dismiss flag on successful email verification so
 *    the banner re-evaluates (it will hide naturally because emailVerified becomes
 *    true, but the stale dismiss key is cleaned up to avoid confusion on re-login).
 * 2. Resend button uses a countdown cooldown instead of permanently disabling on
 *    success, so users can retry after the cooldown expires.
 */
export function UnverifiedBanner() {
  const user = useAuthStore((s) => s.user);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const emailVerified = useAuthStore((s) => s.user?.emailVerified);
  const resend = useResendVerification();

  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === '1'
  );
  const [resentOk, setResentOk] = useState(false);
  const [resendError, setResendError] = useState('');

  // Cooldown countdown: null = no cooldown active, number = seconds remaining.
  const [cooldown, setCooldown] = useState<number | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // When emailVerified flips to true, clear the dismiss flag in sessionStorage
  // so the state is clean for any future session (e.g. logout → re-login).
  useEffect(() => {
    if (emailVerified) {
      sessionStorage.removeItem(DISMISS_KEY);
    }
  }, [emailVerified]);

  // Cleanup interval on unmount.
  useEffect(() => {
    return () => {
      if (cooldownRef.current !== null) clearInterval(cooldownRef.current);
    };
  }, []);

  // Don't flash while auth is hydrating; hide once verified or dismissed.
  if (isHydrating || !user || user.emailVerified || dismissed) {
    return null;
  }

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_SEC);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev === null || prev <= 1) {
          if (cooldownRef.current !== null) clearInterval(cooldownRef.current);
          cooldownRef.current = null;
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  const handleResend = async () => {
    if (cooldown !== null || resend.isPending) return;
    setResendError('');
    setResentOk(false);
    try {
      await resend.mutateAsync(user.email);
      setResentOk(true);
      // Start cooldown after success so the button re-enables after 60 s.
      startCooldown();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setResendError(axErr.response?.data?.message ?? '重寄失敗，請稍後再試。');
    }
  };

  // Button label varies: sending → cooldown → idle
  const buttonLabel = (() => {
    if (resend.isPending) return '重寄中…';
    if (cooldown !== null) return `${cooldown}s 後重試`;
    return '重寄驗證信';
  })();

  // aria-label: guard against "0 秒後可重試" showing during resend.isPending state.
  const buttonAriaLabel = (() => {
    if (resend.isPending) return '重寄中';
    if (cooldown !== null) return `${cooldown} 秒後可重試`;
    return '重寄驗證信';
  })();

  const buttonDisabled = resend.isPending || cooldown !== null;

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        // Use --co-* design tokens; no raw hex colours.
        background: 'rgba(245,158,11,0.12)',
        borderBottom: '1px solid rgba(245,158,11,0.4)',
        color: 'var(--co-text)',
        fontSize: 13.5,
      }}
    >
      <Icon.Lock size={16} style={{ color: 'var(--co-amber)', flexShrink: 0 }} />
      <span style={{ flex: 1, lineHeight: 1.4 }}>
        {resentOk
          ? '驗證信已重新寄出，請至信箱查收。'
          : '請先驗證 email 才能使用發案/投標等功能。'}
        {resendError && (
          <span style={{ color: 'var(--co-red)', marginLeft: 8 }}>{resendError}</span>
        )}
      </span>

      <button
        type="button"
        onClick={handleResend}
        disabled={buttonDisabled}
        aria-label={buttonAriaLabel}
        style={{
          flexShrink: 0,
          height: 30,
          padding: '0 12px',
          borderRadius: 8,
          background: 'var(--co-amber)',
          border: 'none',
          color: '#fff',
          fontSize: 12.5,
          fontWeight: 600,
          cursor: buttonDisabled ? 'default' : 'pointer',
          opacity: buttonDisabled ? 0.7 : 1,
          minWidth: 88,
          transition: 'opacity 200ms',
        }}
      >
        {buttonLabel}
      </button>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="關閉提醒"
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          background: 'transparent',
          border: 'none',
          color: 'var(--co-text-dim)',
          cursor: 'pointer',
        }}
      >
        <Icon.X size={16} />
      </button>
    </div>
  );
}

export default UnverifiedBanner;
