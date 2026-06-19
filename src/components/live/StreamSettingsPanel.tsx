/**
 * StreamSettingsPanel — host settings for the upcoming broadcast.
 *
 * Contains: 直播標題 input, tag FilterChips and language select.
 * All state is lifted to LiveHostPage via controlled props.
 */

const AVAILABLE_TAGS = ['AI', '商業', '科技', '教育', '設計', '行銷', '金融', '製造'];
const LANGUAGE_OPTIONS = [
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
];

interface StreamSettingsPanelProps {
  title: string;
  onTitleChange: (v: string) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  language: string;
  onLanguageChange: (v: string) => void;
}

export function StreamSettingsPanel({
  title,
  onTitleChange,
  selectedTags,
  onTagToggle,
  language,
  onLanguageChange,
}: StreamSettingsPanelProps) {
  return (
    <div
      style={{
        background: 'var(--co-bg-card)',
        border: '1px solid var(--co-line-strong)',
        borderRadius: 'var(--co-card-r)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--co-text)', margin: 0 }}>
        直播設定
      </h3>

      {/* Title input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label
          htmlFor="stream-title"
          style={{ fontSize: 12, color: 'var(--co-text-dim)', fontWeight: 500 }}
        >
          直播標題
        </label>
        <input
          id="stream-title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="輸入直播標題…"
          maxLength={120}
          style={{
            fontSize: 13,
            padding: '8px 12px',
            background: 'var(--co-bg-3)',
            border: '1px solid var(--co-line-strong)',
            borderRadius: 'var(--co-btn-r)',
            color: 'var(--co-text)',
            outline: 'none',
            transition: 'border-color 150ms',
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--co-accent)';
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--co-line-strong)';
          }}
        />
      </div>

      {/* Tag FilterChips */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--co-text-dim)', fontWeight: 500 }}>
          標籤
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {AVAILABLE_TAGS.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onTagToggle(tag)}
                aria-pressed={active}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '3px 10px',
                  borderRadius: 'var(--co-badge-r)',
                  border: active
                    ? '1px solid var(--co-accent)'
                    : '1px solid var(--co-line-strong)',
                  background: active ? 'rgba(99,102,241,0.18)' : 'transparent',
                  color: active ? 'var(--co-indigo-200)' : 'var(--co-text-dim)',
                  cursor: 'pointer',
                  transition: 'background 150ms, border-color 150ms',
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Language select */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label
          htmlFor="stream-language"
          style={{ fontSize: 12, color: 'var(--co-text-dim)', fontWeight: 500 }}
        >
          語言
        </label>
        <select
          id="stream-language"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          style={{
            fontSize: 13,
            padding: '8px 12px',
            background: 'var(--co-bg-3)',
            border: '1px solid var(--co-line-strong)',
            borderRadius: 'var(--co-btn-r)',
            color: 'var(--co-text)',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} style={{ background: 'var(--co-bg-3)' }}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default StreamSettingsPanel;
