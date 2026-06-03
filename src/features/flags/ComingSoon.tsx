import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';

interface ComingSoonProps {
  /** Feature name shown in the heading, e.g. "聊天" / "KYC 驗證". */
  feature: string;
  /** Optional longer explanation. */
  description?: string;
}

/**
 * Full-page placeholder for TBD features whose backend isn't live yet.
 * Routed in place of the real page so a user can never reach a screen that
 * fires a non-existent API and crashes. The original component is preserved;
 * only the route target is swapped behind a feature flag.
 */
export function ComingSoon({ feature, description }: ComingSoonProps) {
  const navigate = useNavigate();

  return (
    <div
      role="status"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        minHeight: '60vh',
        padding: 32,
        textAlign: 'center',
        background: 'var(--co-bg)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid var(--co-line-strong)',
          marginBottom: 20,
        }}
      >
        <Icon.Lock size={26} style={{ color: 'var(--color-accent)' }} />
      </div>

      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 10px',
          borderRadius: 999,
          background: 'rgba(245,158,11,0.15)',
          color: 'var(--co-amber)',
          fontSize: 11,
          fontWeight: 600,
          border: '1px solid rgba(245,158,11,0.25)',
          marginBottom: 14,
          letterSpacing: '0.02em',
        }}
      >
        即將推出 · Coming soon
      </span>

      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--co-text)', margin: '0 0 8px 0' }}>
        {feature}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--co-text-dim)', maxWidth: 420, lineHeight: 1.6, margin: '0 0 24px 0' }}>
        {description ?? '此功能正在開發中，敬請期待。'}
      </p>

      <button
        type="button"
        onClick={() => navigate('/jobs')}
        style={{
          padding: '10px 22px',
          borderRadius: 10,
          background: 'var(--color-accent)',
          color: '#fff',
          border: 'none',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        返回案件看板
      </button>
    </div>
  );
}

export default ComingSoon;
