import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Icon } from '../ui/Icon';

interface CoverOnesTopbarProps {
  drawerOpen?: boolean;
  onMenuOpen?: () => void;
}

const CoverOnesTopbar = ({ drawerOpen = false, onMenuOpen }: CoverOnesTopbarProps) => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSearchSubmit = () => {
    const q = searchQuery.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

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

  const handleProfile = () => {
    setMenuOpen(false);
    navigate('/profile');
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
      {/* Hamburger — mobile only (<768px), wired to drawer open handler */}
      {onMenuOpen && (
        <button
          type="button"
          onClick={onMenuOpen}
          aria-label="開啟選單"
          aria-expanded={drawerOpen}
          aria-controls="mobile-drawer"
          className="topbar-hamburger"
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            display: 'none', /* shown via .topbar-hamburger media query below */
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--co-text)',
            flexShrink: 0,
          }}
        >
          <Icon.Menu size={22} />
        </button>
      )}

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
        <button
          type="button"
          onClick={handleSearchSubmit}
          aria-label="執行搜尋"
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: 'inherit',
            flexShrink: 0,
          }}
        >
          <Icon.Search size={16} />
        </button>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="搜尋案件、關鍵字..."
          aria-label="搜尋案件或關鍵字"
          style={{
            flex: 1,
            fontSize: 13,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--co-text)',
            cursor: 'text',
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
            onClick={() => navigate('/notifications')}
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
            <Icon.Bell size={18} />
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
                background: 'linear-gradient(135deg, var(--co-accent-blue), var(--co-accent))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--co-text-on-accent)',
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
            <Icon.ChevronDown size={14} />
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
                onClick={handleProfile}
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
                個人檔案
              </button>
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
