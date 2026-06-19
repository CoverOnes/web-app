/**
 * AvatarConnectingOverlay — shown inside LiveVideoArea when no real stream exists.
 *
 * Normal variant: Video icon (muted, opacity 0.35) + "連線中・即將上線" + spinner
 * Error variant:  WifiOff icon + "連線中斷，嘗試重新連線…" + 重新連線 button
 */

import { Icon } from '../ui/Icon';

interface AvatarConnectingOverlayProps {
  variant?: 'connecting' | 'error';
  onRetry?: () => void;
}

/** Minimal spinner using the existing shimmer/spin keyframe from index.css */
function Spinner() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: 20,
        height: 20,
        border: '2px solid rgba(148,163,184,0.25)',
        borderTopColor: 'var(--co-accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );
}

export function AvatarConnectingOverlay({
  variant = 'connecting',
  onRetry,
}: AvatarConnectingOverlayProps) {
  const isError = variant === 'error';

  return (
    <div
      aria-label="替身直播影像"
      role="img"
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--co-bg-3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderRadius: 'inherit',
      }}
    >
      {/* Icon */}
      <span
        aria-hidden="true"
        style={{
          color: isError ? 'var(--co-red)' : 'var(--co-text-dim)',
          opacity: isError ? 0.7 : 0.35,
        }}
      >
        {isError ? <Icon.WifiOff size={48} /> : <Icon.Video size={48} />}
      </span>

      {/* Label */}
      <p
        style={{
          fontSize: 14,
          color: 'var(--co-text-dim)',
          fontWeight: 500,
          letterSpacing: 0.2,
          margin: 0,
        }}
      >
        {isError ? '連線中斷，嘗試重新連線…' : '連線中・即將上線'}
      </p>

      {/* Spinner (connecting) or Retry button (error) */}
      {isError ? (
        <button
          type="button"
          onClick={onRetry}
          aria-label="重新連線"
          style={{
            marginTop: 4,
            padding: '6px 16px',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 'var(--co-btn-r)',
            border: '1px solid var(--co-line-strong)',
            background: 'var(--co-bg-card)',
            color: 'var(--co-text)',
            cursor: 'pointer',
            transition: 'background 150ms',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--co-bg-card-2)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--co-bg-card)';
          }}
        >
          重新連線
        </button>
      ) : (
        <Spinner />
      )}
    </div>
  );
}

export default AvatarConnectingOverlay;
