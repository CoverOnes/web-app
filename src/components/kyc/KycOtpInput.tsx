import { useRef } from 'react';

interface KycOtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * 6-digit OTP input composed of individual single-character inputs.
 * Focus auto-advances to next box; backspace returns to previous.
 */
export function KycOtpInput({ value, onChange, disabled = false }: KycOtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  // padEnd(n, '') with empty fill string does NOT pad — use Array.from instead
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');

  const handleChange = (idx: number, raw: string) => {
    // Only accept digits
    const ch = raw.replace(/\D/g, '').slice(-1);
    if (!ch) return;
    const next = [...digits];
    next[idx] = ch;
    onChange(next.join('').trimEnd());
    // Advance focus
    if (idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...digits];
      if (next[idx]) {
        next[idx] = '';
        onChange(next.join('').trimEnd());
      } else if (idx > 0) {
        next[idx - 1] = '';
        onChange(next.join('').trimEnd());
        refs.current[idx - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      refs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < 5) {
      refs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      onChange(pasted);
      const focusIdx = Math.min(pasted.length, 5);
      refs.current[focusIdx]?.focus();
    }
  };

  return (
    <div
      role="group"
      aria-label="6 位驗證碼"
      style={{ display: 'flex', gap: 8, justifyContent: 'center' }}
      onPaste={handlePaste}
    >
      {digits.map((d, idx) => (
        <input
          key={idx}
          ref={(el) => { refs.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label={`第 ${idx + 1} 位驗證碼`}
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onFocus={(e) => e.target.select()}
          style={{
            width: 44,
            height: 52,
            borderRadius: 10,
            border: `1.5px solid ${d ? 'var(--co-accent)' : 'var(--co-line-strong)'}`,
            background: 'var(--co-bg-card)',
            color: 'var(--co-text)',
            fontSize: 22,
            fontWeight: 700,
            textAlign: 'center',
            outline: 'none',
            cursor: 'text',
            transition: 'border-color 150ms',
          }}
        />
      ))}
    </div>
  );
}

export default KycOtpInput;
