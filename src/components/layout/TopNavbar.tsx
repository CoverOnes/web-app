import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Person } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { useChatStore } from '../../store/chatStore';

interface TopNavbarProps {
  onOpenCreate?: () => void;
  currentUser: Person;
  totalUnread: number;
}

const TopNavbar = ({ currentUser, totalUnread }: TopNavbarProps) => {
  const navigate = useNavigate();
  const { logout } = useChatStore();
  const [menuHover, setMenuHover] = useState(false);
  const [bellHover, setBellHover] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <div style={{
      height: 'var(--navbar-h)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 20px',
      background: 'var(--color-main-bg-2)',
      borderBottom: '1px solid var(--color-main-border)',
      flexShrink: 0,
      zIndex: 'var(--z-navbar)' as React.CSSProperties['zIndex'],
    }}>
      {/* Global search */}
      <button
        role="searchbox"
        aria-label="搜尋訊息、人員或檔案"
        style={{
          maxWidth: 420,
          width: '100%',
          height: 34,
          borderRadius: 8,
          background: 'var(--color-main-bg)',
          border: '1px solid var(--color-main-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 12px',
          color: 'var(--color-main-text-dim)',
          fontSize: 13,
          margin: '0 auto',
          cursor: 'pointer',
          textAlign: 'left',
        }}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      >
        <Icon.Search size={14} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>搜尋訊息、人員或檔案...</span>
        <span style={{
          marginLeft: 'auto',
          fontSize: 10.5,
          padding: '1px 6px',
          borderRadius: 4,
          background: 'var(--color-main-bg-2)',
          border: '1px solid var(--color-main-border)',
          color: 'var(--color-main-text-dim)',
          fontFamily: 'var(--font-mono)',
          flexShrink: 0,
        }}>
          ⌘K
        </span>
      </button>

      {/* Bell */}
      <button
        aria-label={totalUnread > 0 ? `${totalUnread} 則通知` : '通知'}
        onClick={() => navigate('/messages')}
        onMouseEnter={() => setBellHover(true)}
        onMouseLeave={() => setBellHover(false)}
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-main-text-dim)',
          background: bellHover ? 'var(--color-main-bg)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 150ms ease-out',
          flexShrink: 0,
        }}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      >
        <Icon.Bell size={16} />
        {totalUnread > 0 && (
          <span style={{
            position: 'absolute',
            top: 7,
            right: 7,
            width: 7,
            height: 7,
            borderRadius: 999,
            background: 'var(--color-red)',
            boxShadow: '0 0 0 2px var(--color-main-bg-2)',
          }} aria-hidden="true" />
        )}
      </button>

      {/* User avatar */}
      <button
        aria-label="使用者選單"
        onMouseEnter={() => setMenuHover(true)}
        onMouseLeave={() => setMenuHover(false)}
        onClick={handleLogout}
        title="點擊登出"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 6px 4px 4px',
          borderRadius: 8,
          background: menuHover ? 'var(--color-main-bg)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 150ms ease-out',
          flexShrink: 0,
        }}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      >
        <Avatar
          name={currentUser.zh ?? currentUser.name}
          pixelSize={28}
          color={currentUser.color}
          showDot
          status={currentUser.status}
        />
        <Icon.ChevronDown size={14} style={{ color: 'var(--color-main-text-dim)' }} />
      </button>
    </div>
  );
};

export default TopNavbar;
