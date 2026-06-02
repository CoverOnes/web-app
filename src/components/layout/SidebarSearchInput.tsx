import { useState } from 'react';
import { Icon } from '../ui/Icon';

interface SidebarSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SidebarSearchInput = ({ value, onChange, placeholder = '搜尋對話...' }: SidebarSearchInputProps) => {
  const [focus, setFocus] = useState(false);

  return (
    <div style={{ padding: '12px 12px 4px 12px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 34,
        padding: '0 10px',
        background: focus ? 'var(--color-accent-soft)' : 'var(--color-sb-tint)',
        border: `1px solid ${focus ? 'var(--color-accent)' : 'var(--color-sb-border)'}`,
        borderRadius: 8,
        color: 'var(--color-sb-text-dim)',
        transition: 'border-color 150ms ease-out, background 150ms ease-out',
      }}>
        <Icon.Search size={14} style={{ flexShrink: 0 }} />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder={placeholder}
          aria-label={placeholder}
          style={{
            flex: 1,
            background: 'transparent',
            color: 'var(--color-sb-text)',
            fontSize: 13,
            border: 'none',
            outline: 'none',
            minWidth: 0,
          }}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            aria-label="清除搜尋"
            style={{
              display: 'flex',
              color: 'var(--color-sb-text-dim)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
            }}
          >
            <Icon.X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SidebarSearchInput;
