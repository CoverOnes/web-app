/**
 * MessagesPlaceholderPage — shown at /messages while the chat backend is not yet built.
 * Chat is DEFERRED (chat-gateway not built).
 * Per locked decision (2026-06-04): 訊息 tab routes here, NOT to the real chat UI.
 * Un-parking is tracked as a separate task (P3).
 */
import { Icon } from '../components/ui/Icon';

const MessagesPlaceholderPage = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '40px 24px',
        textAlign: 'center',
        gap: 16,
        color: 'var(--co-text)',
      }}
    >
      {/* Icon with accent glow */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--co-accent)',
          marginBottom: 8,
        }}
      >
        <Icon.Chat size={48} />
      </div>

      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}
      >
        聊天功能即將推出
      </div>

      <p
        style={{
          fontSize: 14,
          color: 'var(--co-text-dim)',
          maxWidth: 320,
          lineHeight: 1.7,
        }}
      >
        我們正在打造安全的 B2B 即時通訊功能。
        <br />
        敬請期待！
      </p>

      {/* Coming soon pill badge */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          borderRadius: 999,
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.25)',
          fontSize: 11.5,
          fontWeight: 600,
          color: 'var(--co-accent)',
          letterSpacing: '0.03em',
        }}
      >
        即將推出
      </span>
    </div>
  );
};

export default MessagesPlaceholderPage;
