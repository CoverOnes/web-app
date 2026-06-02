import { memo } from 'react';
import type { Message, Person } from '../../types';
import { Avatar } from '../ui/Avatar';
import EncryptionBadge from './EncryptionBadge';
import ReactionBar from './ReactionBar';
import StatusDot from './StatusDot';

interface MessageGroupProps {
  messages: Message[];
  own: boolean;
  sender: Person;
}

const noop = () => {};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

const MessageGroup = memo(({ messages, own, sender }: MessageGroupProps) => {
  const firstMsg = messages[0];
  const lastMsg = messages[messages.length - 1];

  return (
    <div style={{
      display: 'flex',
      gap: 12,
      flexDirection: own ? 'row-reverse' : 'row',
      marginBottom: 14,
      alignItems: 'flex-start',
    }}>
      {/* Avatar column */}
      {!own ? (
        <Avatar
          name={sender.zh ?? sender.name}
          pixelSize={34}
          color={sender.color}
          status={sender.status}
        />
      ) : (
        <div style={{ width: 34, flexShrink: 0 }} />
      )}

      {/* Content column */}
      <div style={{
        maxWidth: '68%',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: own ? 'flex-end' : 'flex-start',
      }}>
        {/* Sender header (others only) */}
        {!own && (
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginBottom: 4,
            paddingLeft: 2,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-main-text)' }}>
              {sender.zh ?? sender.name}
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-main-text-dim)' }}>
              {sender.name}
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-main-text-dim)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              · {formatTime(firstMsg.created_at)} <EncryptionBadge />
            </span>
          </div>
        )}

        {/* Individual bubbles */}
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className="msg-hover"
            style={{
              position: 'relative',
              marginTop: i === 0 ? 0 : 3,
              maxWidth: '100%',
            }}
          >
            <div style={{
              padding: '9px 13px',
              borderRadius: 12,
              background: own ? 'var(--color-accent)' : 'var(--color-bubble-other)',
              color: own ? '#fff' : 'var(--color-bubble-other-text)',
              fontSize: 14,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              border: own ? 'none' : '1px solid var(--color-main-border)',
              boxShadow: own ? '0 1px 0 rgba(0,0,0,0.1) inset' : 'none',
            }}>
              {msg.content}
            </div>

            {/* Own bubble meta line (on last bubble) */}
            {own && i === messages.length - 1 && (
              <div style={{
                marginTop: 3,
                paddingRight: 4,
                fontSize: 10.5,
                color: 'var(--color-main-text-dim)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                justifyContent: 'flex-end',
              }}>
                <EncryptionBadge />
                <span>{formatTime(lastMsg.created_at)}</span>
                <StatusDot status={msg.status ?? 'sent'} />
              </div>
            )}

            <ReactionBar own={own} onReact={noop} />
          </div>
        ))}
      </div>
    </div>
  );
});

MessageGroup.displayName = 'MessageGroup';

export default MessageGroup;
