/**
 * LiveChatPanel — scrollable live-chat sidebar for the viewer page.
 *
 * Renders a message list (with empty-state when empty), and an input + send
 * button at the bottom. Chat messages are client-side only for now (no backend
 * WebSocket yet — scaffold only).
 */

import { useState, useRef, useEffect } from 'react';
import { Icon } from '../ui/Icon';

interface ChatMessage {
  id: string;
  author: string;
  text: string;
  color: string;
}

const AUTHOR_COLORS = [
  'var(--co-accent)',
  'var(--co-cyan)',
  'var(--co-green)',
  'var(--co-amber)',
  'var(--co-pink)',
];

export function LiveChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;
    const newMsg: ChatMessage = {
      id: `${Date.now()}`,
      author: '我',
      text,
      color: AUTHOR_COLORS[0],
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--co-bg-card)',
        border: '1px solid var(--co-line-strong)',
        borderRadius: 'var(--co-card-r)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--co-line)',
          flexShrink: 0,
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--co-text)',
        }}
      >
        直播聊天
      </div>

      {/* Message list */}
      <div
        ref={listRef}
        role="log"
        aria-label="直播聊天訊息"
        aria-live="polite"
        aria-atomic="false"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 8,
              color: 'var(--co-text-muted)',
            }}
          >
            <Icon.MessageSquare size={28} style={{ opacity: 0.3 }} />
            <span style={{ fontSize: 13 }}>目前還沒有人說話</span>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} style={{ fontSize: 13, lineHeight: 1.5 }}>
              <span style={{ fontWeight: 600, color: msg.color, marginRight: 6 }}>
                {msg.author}
              </span>
              <span style={{ color: 'var(--co-text)' }}>{msg.text}</span>
            </div>
          ))
        )}
      </div>

      {/* Input row */}
      <div
        style={{
          padding: '8px 10px',
          borderTop: '1px solid var(--co-line)',
          display: 'flex',
          gap: 6,
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          aria-label="聊天訊息輸入"
          placeholder="傳送訊息…"
          value={inputValue}
          maxLength={500}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            fontSize: 13,
            padding: '6px 10px',
            background: 'var(--co-bg-3)',
            border: '1px solid var(--co-line-strong)',
            borderRadius: 'var(--co-btn-r)',
            color: 'var(--co-text)',
            outline: 'none',
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--co-accent)';
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--co-line-strong)';
          }}
        />
        <button
          type="button"
          aria-label="傳送訊息"
          onClick={handleSend}
          style={{
            width: 34,
            height: 34,
            flexShrink: 0,
            background: 'var(--co-accent)',
            border: 'none',
            borderRadius: 'var(--co-btn-r)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--co-text-on-accent)',
            transition: 'opacity 150ms',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '0.85';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '1';
          }}
        >
          <Icon.Send size={14} />
        </button>
      </div>
    </div>
  );
}

export default LiveChatPanel;
