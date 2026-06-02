import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore';
import { Icon } from '../ui/Icon';

interface TabItem {
  id: string;
  path: string;
  icon: keyof typeof Icon;
  label: string;
  showUnread?: boolean;
}

const TABS: TabItem[] = [
  { id: 'messages', path: '/messages', icon: 'MessageSquare', label: '對話', showUnread: true },
  { id: 'contacts', path: '/contacts', icon: 'Users', label: '聯絡人' },
  { id: 'groups', path: '/groups', icon: 'UserGroup', label: '群組' },
  { id: 'starred', path: '/starred', icon: 'Star', label: '重要' },
  { id: 'settings', path: '/settings', icon: 'Settings', label: '設定' },
];

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const rooms = useChatStore((s) => s.rooms);

  const totalUnread = rooms.reduce((acc, r) => acc + (r.unread_count || 0), 0);

  const isActive = (path: string) => {
    if (path === '/messages') return location.pathname.startsWith('/messages');
    if (path === '/contacts') return location.pathname.startsWith('/contacts');
    return location.pathname === path;
  };

  return (
    <nav
      aria-label="主要導覽"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 72,
        background: 'var(--color-main-bg-2)',
        borderTop: '1px solid var(--color-main-border)',
        display: 'flex',
        alignItems: 'stretch',
        zIndex: 5 as React.CSSProperties['zIndex'],
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map((tab) => {
        const active = isActive(tab.path);
        const IconComp = Icon[tab.icon] as React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
        const unreadCount = tab.showUnread ? totalUnread : 0;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => navigate(tab.path)}
            aria-label={tab.label}
            aria-current={active ? 'page' : undefined}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: active ? 'var(--color-accent)' : 'var(--color-main-text-dim)',
              minWidth: 44,
              minHeight: 44,
              position: 'relative',
              transition: 'color 150ms ease-out',
            }}
          >
            <div style={{ position: 'relative' }}>
              <IconComp
                size={22}
                style={{
                  color: active ? 'var(--color-accent)' : 'var(--color-main-text-dim)',
                  transition: 'color 150ms ease-out',
                }}
              />
              {unreadCount > 0 && (
                <span
                  aria-label={`${unreadCount} 則未讀訊息`}
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -6,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 'var(--radius-chip)',
                    background: 'var(--color-red)',
                    color: '#fff',
                    fontSize: 10.5,
                    fontWeight: 600,
                    lineHeight: '16px',
                    textAlign: 'center',
                    padding: '0 4px',
                    boxSizing: 'border-box',
                    boxShadow: '0 0 0 2px var(--color-main-bg-2)',
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: 500,
              lineHeight: 1,
              color: active ? 'var(--color-accent)' : 'var(--color-main-text-dim)',
              transition: 'color 150ms ease-out',
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
