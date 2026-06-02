import { useState, useRef, useEffect } from 'react';
import { validateMessage } from '../../utils/validation';
import { sanitizeInput } from '../../utils/sanitize';
import { Icon } from '../ui/Icon';

interface ComposerProps {
  onSend: (content: string) => void;
  roomTitle: string;
  disabled?: boolean;
}

const Composer = ({ onSend, roomTitle, disabled = false }: ComposerProps) => {
  const [val, setVal] = useState('');
  const [focus, setFocus] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSendingRef = useRef(false);

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(140, ta.scrollHeight) + 'px';
  }, [val]);

  const handleSend = () => {
    const trimmed = val.trim();
    if (!trimmed || isSendingRef.current || disabled) return;
    isSendingRef.current = true;

    try {
      const sanitized = sanitizeInput(trimmed);
      validateMessage(sanitized);
      setVal('');
      setError('');
      onSend(sanitized);
      setTimeout(() => { isSendingRef.current = false; }, 300);
    } catch (err) {
      isSendingRef.current = false;
      if (err instanceof Error) {
        setError(err.message);
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasContent = val.trim().length > 0;

  return (
    <div style={{
      padding: '10px 24px 18px 24px',
      borderTop: '1px solid var(--color-main-border)',
      flexShrink: 0,
      background: 'var(--color-main-bg)',
    }}>
      {error && (
        <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--color-red)' }}>{error}</div>
      )}

      {/* Composer box */}
      <div style={{
        background: 'var(--color-input-bg)',
        border: `1px solid ${focus ? 'var(--color-accent)' : 'var(--color-main-border)'}`,
        borderRadius: 10,
        padding: '10px 12px',
        transition: 'border-color 150ms ease-out, box-shadow 150ms ease-out',
        boxShadow: focus ? '0 0 0 3px var(--color-accent-soft)' : 'none',
      }}>
        <textarea
          ref={textareaRef}
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder={`傳訊息到 ${roomTitle}...`}
          aria-label="輸入訊息"
          disabled={disabled}
          rows={1}
          style={{
            width: '100%',
            background: 'transparent',
            color: 'var(--color-main-text)',
            resize: 'none',
            minHeight: 22,
            maxHeight: 140,
            fontSize: 14,
            border: 'none',
            outline: 'none',
            padding: 0,
            fontFamily: 'inherit',
            lineHeight: 1.5,
            display: 'block',
          }}
        />

        {/* Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          marginTop: 8,
        }}>
          {/* Attachment buttons */}
          {(['Paperclip', 'Image', 'Smile'] as const).map((iconName, idx) => {
            const labels = ['附件', '圖片', '表情符號'];
            const IconComp = Icon[iconName];
            return (
              <button
                key={iconName}
                aria-label={labels[idx]}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-main-text-dim)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 120ms',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(148,163,184,0.12)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <IconComp size={16} />
              </button>
            );
          })}

          {/* Encryption badge center */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            color: 'var(--color-main-text-dim)',
            fontSize: 11,
          }}>
            <Icon.LockSmall size={10} style={{ color: 'var(--color-cyan)' }} />
            <span>AES-256-GCM · end-to-end encrypted</span>
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!hasContent || disabled}
            aria-label="傳送訊息"
            style={{
              height: 30,
              padding: '0 12px',
              borderRadius: 8,
              background: hasContent ? 'var(--color-accent)' : 'rgba(148,163,184,0.15)',
              color: hasContent ? '#fff' : 'var(--color-main-text-dim)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
              border: 'none',
              cursor: hasContent ? 'pointer' : 'default',
              transition: 'background 150ms ease-out',
            }}
          >
            <Icon.Send size={14} />
            傳送
          </button>
        </div>
      </div>
    </div>
  );
};

export default Composer;
