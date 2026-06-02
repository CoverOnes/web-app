import { useState, useRef, type KeyboardEvent, type FormEvent } from 'react';
import { validateMessage } from '../../utils/validation';
import { sanitizeInput } from '../../utils/sanitize';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

const SendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const MessageInput = ({ onSend, disabled = false }: MessageInputProps) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const isSendingRef = useRef(false);

  const handleSend = (e?: FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) return;
    if (isSendingRef.current) return;

    isSendingRef.current = true;

    try {
      const sanitized = sanitizeInput(trimmedContent);
      validateMessage(sanitized);

      setContent('');
      setError('');

      onSend(sanitized);

      setTimeout(() => {
        isSendingRef.current = false;
      }, 300);
    } catch (err) {
      isSendingRef.current = false;

      if (err instanceof Error) {
        setError(err.message);
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      e.stopPropagation();
      handleSend();
    }
  };

  return (
    <div className="flex-none border-t border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
      {error && (
        <div className="px-4 pt-2">
          <p className="text-xs text-error-500">{error}</p>
        </div>
      )}
      <div className="flex items-end gap-2 p-3">
        <textarea
          rows={1}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="輸入訊息..."
          aria-label="輸入訊息"
          disabled={disabled}
          className="
            flex-1 min-h-[44px] max-h-[120px]
            px-4 py-2.5
            bg-neutral-50 border border-neutral-200
            dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100
            rounded-2xl
            text-[15px] text-neutral-900
            placeholder:text-neutral-400
            resize-none
            focus-visible:outline-none
            focus-visible:border-accent-500
            focus-visible:ring-2 focus-visible:ring-accent-500/20
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-colors duration-150
          "
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={disabled || !content.trim()}
          aria-label="送出訊息"
          className="
            flex-none flex items-center justify-center
            w-11 h-11 rounded-full
            bg-primary-500 hover:bg-primary-400 active:bg-primary-600
            text-white
            transition-colors duration-150
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-accent-500 focus-visible:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
