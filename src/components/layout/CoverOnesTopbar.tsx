import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const BellIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const SearchIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CoverOnesTopbar = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initial = (user?.displayName ?? 'U').charAt(0).toUpperCase();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  const handleSettings = () => {
    setMenuOpen(false);
    navigate('/settings');
  };

  return (
    <header
      style={{
        height: 'var(--co-topbar-h)',
        background: 'rgba(11,18,32,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--co-line)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {/* Search box — shared.css .search */}
      <div
        role="search"
        style={{
          flex: 1,
          maxWidth: 540,
          height: 38,
          padding: '0 14px',
          background: 'var(--co-bg-3)',
          border: '1px solid var(--co-line-strong)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: 'var(--co-text-dim)',
        }}
      >
        <SearchIcon />
        <input
          disabled
          placeholder="搜尋案件、關鍵字..."
          aria-label="搜尋（即將推出）"
          style={{
            flex: 1,
            fontSize: 13,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--co-text-dim)',
            cursor: 'not-allowed',
          }}
        />
        {/* Keyboard shortcut badge — shared.css .search .kbd */}
        <kbd
          style={{
            fontSize: 10.5,
            padding: '1px 6px',
            borderRadius: 4,
            background: 'rgba(148,163,184,0.1)',
            color: 'var(--co-text-muted)',
            fontFamily: 'var(--font-mono)',
            border: '1px solid rgba(148,163,184,0.15)',
            lineHeight: 1.6,
          }}
        >
          ⌘K
        </kbd>
      </div>

      {/* Right actions — shared.css .top-actions */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Bell icon-btn — shared.css .icon-btn */}
        <div style={{ position: 'relative' }}>
          <button
            aria-label="通知"
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              color: 'var(--co-text-dim)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'background 150ms',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--co-text)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--co-text-dim)'; }}
          >
            <BellIcon />
          </button>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 24, background: 'var(--co-line)', margin: '0 4px' }} aria-hidden="true" />

        {/* Me-pill — shared.css .me-pill */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="使用者選單"
            aria-expanded={menuOpen}
            aria-haspopup="true"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 8px 4px 4px',
              borderRadius: 999,
              background: 'var(--co-bg-3)',
              border: '1px solid var(--co-line-strong)',
              cursor: 'pointer',
            }}
          >
            {/* Avatar — shared.css .me-pill .av */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                background: 'linear-gradient(135deg, #2563EB, #6366F1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              {initial}
            </div>
            {/* Name + role — shared.css .me-pill .nm / .role */}
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: 'var(--co-text)',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.displayName ?? 'User'}
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  color: 'var(--co-text-dim)',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.accountType ?? ''}
              </div>
            </div>
            <ChevronDownIcon />
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div
              role="menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                background: 'var(--co-bg-card)',
                border: '1px solid var(--co-line-strong)',
                borderRadius: 10,
                padding: '6px 4px',
                minWidth: 160,
                boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                zIndex: 20,
              }}
            >
              <button
                role="menuitem"
                onClick={handleSettings}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: 13,
                  color: 'var(--co-text-dim)',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'block',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                設定
              </button>
              <div style={{ height: 1, background: 'var(--co-line)', margin: '4px 0' }} aria-hidden="true" />
              <button
                role="menuitem"
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: 13,
                  color: 'var(--co-red)',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'block',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                登出
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default CoverOnesTopbar;
