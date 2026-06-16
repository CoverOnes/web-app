import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUnreadCount } from '../../lib/query';
import { Icon } from '../ui/Icon';

/* --- Nav item definition --- */

interface NavEntry {
  path: string;
  label: string;
  icon: (size?: number) => React.ReactNode;
  badge?: number;
  disabled?: boolean;
  disabledLabel?: string;
}

/* --- NavItem sub-component --- */

interface NavItemProps {
  entry: NavEntry;
  active: boolean;
  onClick: () => void;
}

const NavItem = ({ entry, active, onClick }: NavItemProps) => {
  return (
    <div style={{ position: 'relative' }}>
      {/* Active accent bar matching shared.css .nav-item.active::before */}
      {active && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            top: 8,
            bottom: 8,
            width: 3,
            borderRadius: 2,
            background: 'var(--co-accent)',
          }}
        />
      )}
      <button
        onClick={onClick}
        disabled={entry.disabled}
        aria-current={active ? 'page' : undefined}
        aria-disabled={entry.disabled}
        title={entry.disabled ? (entry.disabledLabel ?? '即將推出') : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          padding: '8px 12px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          width: '100%',
          textAlign: 'left',
          border: 'none',
          cursor: entry.disabled ? 'not-allowed' : 'pointer',
          opacity: entry.disabled ? 0.6 : 1,
          color: active ? 'var(--co-text-on-accent)' : 'var(--co-text-dim)',
          background: active
            ? 'linear-gradient(90deg, rgba(99,102,241,0.18), rgba(99,102,241,0.04))'
            : 'transparent',
          transition: 'background 150ms, color 150ms',
        }}
        onMouseEnter={(e) => {
          if (!active && !entry.disabled) {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--co-text)';
          }
        }}
        onMouseLeave={(e) => {
          if (!active && !entry.disabled) {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--co-text-dim)';
          }
        }}
      >
        {/* Icon */}
        <span
          aria-hidden="true"
          style={{
            color: active ? 'var(--co-accent)' : 'var(--co-text-muted)',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          {entry.icon(16)}
        </span>

        {/* Label */}
        <span style={{ flex: 1 }}>{entry.label}</span>

        {/* Unread badge */}
        {entry.badge != null && entry.badge > 0 && (
          <span
            style={{
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 999,
              background: 'var(--co-red)',
              color: 'var(--co-text-on-accent)',
              fontWeight: 600,
              minWidth: 16,
              textAlign: 'center',
            }}
          >
            {entry.badge > 99 ? '99+' : entry.badge}
          </span>
        )}
      </button>
    </div>
  );
};

/* --- Section label --- */

const NavSectionLabel = ({ label }: { label: string }) => (
  <div
    style={{
      fontSize: 10,
      color: 'var(--co-text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      padding: '14px 12px 6px 12px',
      fontWeight: 600,
    }}
  >
    {label}
  </div>
);

/* --- Main sidebar component --- */

const CoverOnesSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const settingsEnabled = true;
  const handleOpenSettings = useCallback(() => {
    if (settingsEnabled) navigate('/settings');
  }, [navigate, settingsEnabled]);

  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;

  // Use exact match for '/' so 首頁 only lights up on the dashboard,
  // not on every route (mirrors CoverOnesMobileBottomNav's pathname === '/' guard).
  // Chat canonical route is /chat; also match legacy /messages path.
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/chat') {
      return location.pathname.startsWith('/chat') || location.pathname.startsWith('/messages');
    }
    return location.pathname.startsWith(path);
  };

  const initial = (user?.displayName ?? 'U').charAt(0).toUpperCase();

  // KYC: show verification entry until tier 2
  const kycTier = user?.kycTier ?? 0;

  // Core nav items (主選單)
  const coreNav: NavEntry[] = [
    { path: '/',               label: '首頁',      icon: (s) => <Icon.Home size={s} /> },
    { path: '/jobs',           label: '案件看板',  icon: (s) => <Icon.Briefcase size={s} /> },
    { path: '/bids',           label: '招標進度',  icon: (s) => <Icon.Tag size={s} /> },
    { path: '/contracts',      label: '合約管理',  icon: (s) => <Icon.FileText size={s} /> },
    // 訊息: canonical route is /chat; isActive also matches legacy /messages
    { path: '/chat',           label: '訊息',      icon: (s) => <Icon.MessageSquare size={s} /> },
    { path: '/discover',        label: '探索企業',  icon: (s) => <Icon.Compass size={s} /> },
    { path: '/network',        label: '網路人脈',  icon: (s) => <Icon.Users size={s} /> },
    // 我的公司: Icon.Building does not exist in the Icon set; Icon.Briefcase is the
    // closest existing semantic match (a building/case glyph) per house convention.
    { path: '/company',        label: '我的公司',  icon: (s) => <Icon.Briefcase size={s} /> },
    { path: '/search',         label: '搜尋',      icon: (s) => <Icon.Search size={s} /> },
    { path: '/notifications',  label: '通知',      icon: (s) => <Icon.Bell size={s} />, badge: unreadCount },
  ];

  // Account nav items (帳號)
  const accountNav: NavEntry[] = [
    ...(kycTier < 2 ? [{ path: '/kyc', label: '身分認證', icon: (s: number | undefined) => <Icon.Shield size={s} /> }] : []),
    {
      path: '/settings',
      label: '設定',
      icon: (s: number | undefined) => <Icon.Settings size={s} />,
      disabled: !settingsEnabled,
      disabledLabel: '設定功能即將推出',
    },
  ];

  return (
    <aside
      role="complementary"
      aria-label="Main navigation"
      style={{
        width: 'var(--co-sidebar-w)',
        height: '100vh',
        background: 'var(--co-bg-2)',
        borderRight: '1px solid var(--co-line)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
        padding: '18px 12px',
        gap: 4,
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Brand — shared.css .sb-brand */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 10px 16px 10px',
          borderBottom: '1px solid var(--co-line)',
          marginBottom: 10,
        }}
      >
        <button
          onClick={() => navigate('/')}
          aria-label="CoverOnes 首頁"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: 'inherit',
          }}
        >
          {/* Brand mark: 34×34 gradient square */}
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: 'linear-gradient(135deg, var(--co-accent-blue), var(--co-accent-2))',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 12c0 4.418-3.582 8-8 8-2.548 0-4.82-1.194-6.3-3.065M4 12C4 7.582 7.582 4 12 4c2.548 0 4.82 1.194 6.3 3.065"
                style={{ stroke: 'var(--co-text-on-accent)' }}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M12 8v8M9 12h6"
                stroke="rgba(255,255,255,0.55)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--co-text)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
              CoverOnes
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--co-text-dim)', lineHeight: 1.3 }}>
              B2B 企業媒合平台
            </div>
          </div>
        </button>
      </div>

      {/* Company display — navigates to 我的公司 (/company); no switcher widget */}
      <button
        type="button"
        onClick={() => navigate('/company')}
        style={{
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          margin: '0 0 14px 0',
          padding: '10px 12px',
          background: 'linear-gradient(180deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
        aria-label="前往我的公司頁"
      >
        {/* Company logo square (amber-to-red gradient per shared.css .company-switcher .logo) */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 7,
            background: 'linear-gradient(135deg, var(--co-amber), var(--co-red))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 12,
            color: 'var(--co-text-on-accent)',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {(user?.displayName ?? 'C').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--co-text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user?.displayName ?? 'My Company'}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--co-text-dim)' }}>
            {user?.accountType === 'PERSONAL' ? '個人帳號' : '企業帳號'}
          </div>
        </div>
      </button>

      {/* 主選單 section */}
      <NavSectionLabel label="主選單" />
      <nav aria-label="主選單">
        {coreNav.map((entry) => (
          <NavItem
            key={entry.path}
            entry={entry}
            active={isActive(entry.path)}
            onClick={() => navigate(entry.path)}
          />
        ))}
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--co-line)', margin: '8px 4px' }} aria-hidden="true" />

      {/* 帳號 section */}
      <NavSectionLabel label="帳號" />
      <nav aria-label="帳號設定">
        {accountNav.map((entry) => (
          <NavItem
            key={entry.path}
            entry={entry}
            active={!entry.disabled && isActive(entry.path)}
            onClick={() => {
              if (entry.path === '/settings') handleOpenSettings();
              else navigate(entry.path);
            }}
          />
        ))}
      </nav>

      {/* Footer — shared.css .sb-footer */}
      <div
        style={{
          marginTop: 'auto',
          padding: 10,
          borderTop: '1px solid var(--co-line)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}
      >
        {/* Avatar — shared.css .sb-footer .av */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--co-text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user?.displayName ?? 'User'}
          </div>
          <div
            style={{
              fontSize: 10.5,
              color: 'var(--co-green)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 2,
            }}
          >
            <span
              style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--co-green)', flexShrink: 0 }}
              aria-hidden="true"
            />
            線上
          </div>
        </div>
      </div>
    </aside>
  );
};

export default CoverOnesSidebar;
