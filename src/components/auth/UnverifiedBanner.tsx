import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useResendVerification } from '../../lib/query';
import { Icon } from '../ui/Icon';
import type { AxiosError } from 'axios';

const DISMISS_KEY = 'coverones_unverified_banner_dismissed';

/**
 * auth Increment 1: persistent, dismissible-per-session banner shown across the
 * app whenever the logged-in user's emailVerified === false. Dismissal is stored
 * in sessionStorage, so it reappears on a new session (browser/tab restart) until
 * the user actually verifies.
 *
 * Rendered once inside the app layout (CoverOnesLayout), above the page outlet.
 */
export function UnverifiedBanner() {
  const user = useAuthStore((s) => s.user);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const resend = useResendVerification();

  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === '1'
  );
  const [resentOk, setResentOk] = useState(false);
  const [resendError, setResendError] = useState('');

  // Don't flash while auth is hydrating; hide once verified or dismissed.
  if (isHydrating || !user || user.emailVerified || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  const handleResend = async () => {
    setResendError('');
    setResentOk(false);
    try {
      await resend.mutateAsync(user.email);
      setResentOk(true);
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setResendError(axErr.response?.data?.message ?? '重寄失敗，請稍後再試。');
    }
  };

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        background: 'var(--color-warning-100, rgba(245,158,11,0.12))',
        borderBottom: '1px solid var(--color-amber, rgba(245,158,11,0.4))',
        color: '#92400e',
        fontSize: 13.5,
      }}
    >
      <Icon.Lock size={16} style={{ color: '#d97706', flexShrink: 0 }} />
      <span style={{ flex: 1, lineHeight: 1.4 }}>
        {resentOk
          ? '驗證信已重新寄出，請至信箱查收。'
          : '請先驗證 email 才能使用發案/投標等功能。'}
        {resendError && (
          <span style={{ color: '#b91c1c', marginLeft: 8 }}>{resendError}</span>
        )}
      </span>

      <button
        type="button"
        onClick={handleResend}
        disabled={resend.isPending || resentOk}
        style={{
          flexShrink: 0,
          height: 30,
          padding: '0 12px',
          borderRadius: 8,
          background: '#d97706',
          border: 'none',
          color: '#fff',
          fontSize: 12.5,
          fontWeight: 600,
          cursor: resend.isPending || resentOk ? 'default' : 'pointer',
          opacity: resend.isPending || resentOk ? 0.7 : 1,
        }}
      >
        {resend.isPending ? '重寄中…' : '重寄驗證信'}
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
          color: '#92400e',
          cursor: 'pointer',
        }}
      >
        <Icon.X size={16} />
      </button>
    </div>
  );
}

export default UnverifiedBanner;
