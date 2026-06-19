import type { KeyboardEvent } from 'react';
import { tabButtonId } from '../../utils/tabIds';

interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** Prefix used to build stable tab button ids, e.g. "jobs" → "jobs-tab-ALL". Default: "tab" */
  idPrefix?: string;
}

export function Tabs({ tabs, activeId, onChange, idPrefix = 'tab' }: TabsProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === 'ArrowRight') {
      onChange(tabs[(idx + 1) % tabs.length].id);
    } else if (e.key === 'ArrowLeft') {
      onChange(tabs[(idx - 1 + tabs.length) % tabs.length].id);
    }
  };

  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        gap: 24,
        padding: '0 28px',
        borderBottom: '1px solid var(--co-line)',
      }}
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            id={tabButtonId(idPrefix, tab.id)}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '14px 0',
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--co-text)' : 'var(--co-text-dim)',
              background: 'transparent',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--co-accent)' : '2px solid transparent',
              marginBottom: -1,
              cursor: 'pointer',
              transition: 'color 150ms, border-color 150ms',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                style={{
                  fontSize: 11,
                  padding: '1px 6px',
                  borderRadius: 999,
                  background: isActive ? 'rgba(99,102,241,0.2)' : 'rgba(148,163,184,0.12)',
                  color: isActive ? 'var(--co-indigo-200)' : 'var(--co-text-muted)',
                  fontWeight: 500,
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
