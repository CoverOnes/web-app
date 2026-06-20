/**
 * ToastContainer — renders in-app toast notifications.
 *
 * Placement: fixed bottom-4 right-4 z-[500] (above everything per --z-toast: 500).
 * Wired into CoverOnesLayout so it's available on all authenticated pages.
 *
 * Design tokens used:
 *   --co-bg-card, --co-line-strong, --co-accent, --co-text, --co-text-dim
 */
import { useToast, removeToast } from './useToast';
import { Icon } from '../ui/Icon';

export function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          style={{
            width: 320,
            background: 'var(--co-bg-card)',
            border: '1px solid var(--co-line-strong)',
            borderLeft: '4px solid var(--co-accent)',
            borderRadius: 12,
            boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            pointerEvents: 'auto',
            animation: 'toast-in 200ms ease forwards',
          }}
        >
          {/* Bell icon */}
          <div style={{ flexShrink: 0, marginTop: 1 }}>
            <Icon.Bell
              size={18}
              style={{ color: 'var(--co-accent)' }}
            />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--co-text)',
                lineHeight: 1.3,
                marginBottom: 2,
              }}
            >
              {toast.title}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--co-text-dim)',
                lineHeight: 1.4,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {toast.body}
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            aria-label="關閉通知"
            style={{
              flexShrink: 0,
              background: 'transparent',
              border: 'none',
              padding: 2,
              cursor: 'pointer',
              color: 'var(--co-text-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
              marginTop: -2,
            }}
          >
            <Icon.X size={14} />
          </button>
        </div>
      ))}

      {/* Mount animation keyframes injected once */}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  );
}

export default ToastContainer;
