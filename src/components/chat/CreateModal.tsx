import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '../ui/Icon';
import { Avatar } from '../ui/Avatar';
import { getDisplayName } from '../../utils/formatters';

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreateDM: (userId: string) => void;
  onCreateGroup: (name: string, userIds: string[]) => void;
}

type TabId = 'dm' | 'group';

interface ContactPerson {
  id: string;
  name: string;
  status: 'online' | 'away' | 'offline';
  color: [string, string];
}

// Contact list is empty until the user-directory API is available (GTD task 84a7e46c).
// Do NOT populate with fake/hardcoded users.
const ALL_CONTACTS: ContactPerson[] = [];

interface ContactRowProps {
  person: ContactPerson;
  selected: boolean;
  onToggle: () => void;
  multi: boolean;
}

const ContactRow = ({ person, selected, onToggle, multi }: ContactRowProps) => {
  const displayName = getDisplayName(person.id);
  const statusLabel = person.status === 'online' ? '線上' : person.status === 'away' ? '離開' : '離線';

  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 10px',
        borderRadius: 8,
        background: selected ? 'var(--color-accent-soft)' : 'transparent',
        border: selected ? '1px solid var(--color-accent)' : '1px solid transparent',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'background 120ms ease-out',
        color: 'var(--color-main-text)',
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.background = 'var(--color-sb-hover)';
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.background = 'transparent';
        else e.currentTarget.style.background = 'var(--color-accent-soft)';
      }}
    >
      <Avatar
        name={displayName}
        pixelSize={36}
        color={person.color}
        showDot
        status={person.status}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
          {displayName}
          <span style={{ color: 'var(--color-main-text-dim)', fontWeight: 400, fontSize: 12 }}>
            · {person.name}
          </span>
        </div>
        <div style={{
          fontSize: 11.5,
          color: person.status === 'online'
            ? 'var(--color-green)'
            : 'var(--color-main-text-dim)',
        }}>
          {statusLabel}
        </div>
      </div>
      {multi ? (
        <div style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          border: selected ? 'none' : '1.5px solid rgba(148,163,184,0.5)',
          background: selected ? 'var(--color-accent)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          flexShrink: 0,
        }}>
          {selected && <Icon.Check size={12} />}
        </div>
      ) : selected ? (
        <Icon.Check size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
      ) : null}
    </button>
  );
};

const CreateModal = ({ open, onClose, onCreateDM, onCreateGroup }: CreateModalProps) => {
  const [tab, setTab] = useState<TabId>('dm');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');

  const backdropRef = useRef<HTMLDivElement>(null);
  const dmSearchRef = useRef<HTMLInputElement>(null);
  const groupNameRef = useRef<HTMLInputElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setTab('dm');
      setQuery('');
      setSelected([]);
      setGroupName('');
    }
  }, [open]);

  // Focus first element when opened
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      if (tab === 'dm') {
        dmSearchRef.current?.focus();
      } else {
        groupNameRef.current?.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [open, tab]);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const modal = e.currentTarget;
    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  if (!open) return null;

  const filteredContacts = ALL_CONTACTS.filter(p => {
    const q = query.toLowerCase();
    return getDisplayName(p.id).toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
  });

  const toggle = (id: string) => {
    if (tab === 'dm') {
      setSelected([id]);
    } else {
      setSelected(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    }
  };

  const canCreate = tab === 'dm'
    ? selected.length === 1
    : selected.length >= 1 && groupName.trim().length > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    if (tab === 'dm') {
      onCreateDM(selected[0]);
    } else {
      onCreateGroup(groupName.trim(), selected);
    }
    onClose();
  };

  return (
    <div
      ref={backdropRef}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3,7,18,0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 'var(--z-modal)' as React.CSSProperties['zIndex'],
        animation: 'fadeIn 180ms ease-out',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onKeyDown={handleKeyDown}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: 480,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: '80vh',
          background: 'var(--color-main-bg-2)',
          border: '1px solid var(--color-main-border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-modal)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'popIn 200ms cubic-bezier(0.2, 0.9, 0.3, 1.2)',
          color: 'var(--color-main-text)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-main-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--color-accent-soft)',
            color: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon.Plus size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div id="modal-title" style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>新增對話</div>
            <div style={{ fontSize: 12, color: 'var(--color-main-text-dim)', marginTop: 2 }}>
              所有新對話預設啟用端對端加密
            </div>
          </div>
          <button
            ref={firstFocusableRef}
            type="button"
            onClick={onClose}
            aria-label="關閉對話框"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-main-text-dim)',
              background: 'transparent',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-sb-tint)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Icon.X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 0,
          padding: '0 20px',
          borderBottom: '1px solid var(--color-main-border)',
        }}>
          <button
            type="button"
            onClick={() => { setTab('dm'); setSelected([]); }}
            style={{
              padding: '12px 4px',
              margin: '0 14px 0 0',
              fontSize: 13,
              fontWeight: 500,
              color: tab === 'dm' ? 'var(--color-main-text)' : 'var(--color-main-text-dim)',
              borderBottom: `2px solid ${tab === 'dm' ? 'var(--color-accent)' : 'transparent'}`,
              marginBottom: -1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              cursor: 'pointer',
              transition: 'color 150ms ease-out',
            }}
          >
            <Icon.MessageSquare size={14} />
            私訊
          </button>
          <button
            type="button"
            onClick={() => { setTab('group'); setSelected([]); }}
            style={{
              padding: '12px 4px',
              margin: '0 14px 0 0',
              fontSize: 13,
              fontWeight: 500,
              color: tab === 'group' ? 'var(--color-main-text)' : 'var(--color-main-text-dim)',
              borderBottom: `2px solid ${tab === 'group' ? 'var(--color-accent)' : 'transparent'}`,
              marginBottom: -1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              cursor: 'pointer',
              transition: 'color 150ms ease-out',
            }}
          >
            <Icon.UserGroup size={14} />
            群組
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 16, overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {tab === 'group' && (
            <div style={{ marginBottom: 12 }}>
              <label
                htmlFor="group-name-input"
                style={{
                  fontSize: 11,
                  color: 'var(--color-main-text-dim)',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  display: 'block',
                }}
              >
                群組名稱
              </label>
              <input
                id="group-name-input"
                ref={groupNameRef}
                autoFocus
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="例如：產品發布小組"
                style={{
                  width: '100%',
                  height: 38,
                  padding: '0 12px',
                  background: 'var(--color-input-bg)',
                  border: '1px solid var(--color-main-border)',
                  borderRadius: 'var(--radius-input)',
                  fontSize: 14,
                  color: 'var(--color-main-text)',
                  transition: 'border-color 150ms, box-shadow 150ms',
                  marginTop: 6,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-accent)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-accent-soft)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-main-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              {selected.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selected.map(id => {
                    const person = ALL_CONTACTS.find(p => p.id === id);
                    if (!person) return null;
                    const displayName = getDisplayName(id);
                    return (
                      <span
                        key={id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '3px 4px 3px 3px',
                          borderRadius: 'var(--radius-chip)',
                          background: 'var(--color-accent-soft)',
                          border: '1px solid var(--color-accent)',
                          fontSize: 12,
                          color: 'var(--color-main-text)',
                        }}
                      >
                        <Avatar name={displayName} pixelSize={18} color={person.color} />
                        {displayName}
                        <button
                          type="button"
                          onClick={() => toggle(id)}
                          aria-label={`移除 ${displayName}`}
                          style={{
                            color: 'var(--color-main-text-dim)',
                            display: 'flex',
                            padding: 2,
                            background: 'transparent',
                            cursor: 'pointer',
                          }}
                        >
                          <Icon.X size={11} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Search input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 36,
            padding: '0 10px',
            background: 'var(--color-input-bg)',
            border: '1px solid var(--color-main-border)',
            borderRadius: 8,
            marginBottom: 12,
          }}>
            <Icon.Search size={14} style={{ color: 'var(--color-main-text-dim)', flexShrink: 0 }} />
            <input
              ref={dmSearchRef}
              type="text"
              autoFocus={tab === 'dm'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋聯絡人..."
              aria-label="搜尋聯絡人"
              style={{
                flex: 1,
                background: 'transparent',
                fontSize: 13,
                color: 'var(--color-main-text)',
                border: 'none',
                outline: 'none',
              }}
            />
          </div>

          {/* Contact list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredContacts.map(person => (
              <ContactRow
                key={person.id}
                person={person}
                multi={tab === 'group'}
                selected={selected.includes(person.id)}
                onToggle={() => toggle(person.id)}
              />
            ))}
            {filteredContacts.length === 0 && (
              <div style={{
                padding: 24,
                textAlign: 'center',
                color: 'var(--color-main-text-dim)',
                fontSize: 13,
              }}>
                {query ? `找不到「${query}」` : '聯絡人功能即將推出'}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--color-main-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            fontSize: 11.5,
            color: 'var(--color-main-text-dim)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}>
            <Icon.LockSmall size={10} style={{ color: 'var(--color-cyan)' }} />
            AES-256-GCM · end-to-end encrypted
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 34,
                padding: '0 14px',
                borderRadius: 8,
                background: 'transparent',
                color: 'var(--color-main-text-dim)',
                fontSize: 13,
                fontWeight: 500,
                border: '1px solid var(--color-main-border)',
                cursor: 'pointer',
                transition: 'background 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-sb-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!canCreate}
              aria-disabled={!canCreate}
              style={{
                height: 34,
                padding: '0 16px',
                borderRadius: 8,
                background: canCreate ? 'var(--color-accent)' : 'var(--color-sb-tint-2)',
                color: canCreate ? '#fff' : 'var(--color-main-text-dim)',
                fontSize: 13,
                fontWeight: 500,
                border: 'none',
                cursor: canCreate ? 'pointer' : 'not-allowed',
                transition: 'background 150ms',
              }}
            >
              建立{tab === 'group' ? '群組' : '私訊'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateModal;
