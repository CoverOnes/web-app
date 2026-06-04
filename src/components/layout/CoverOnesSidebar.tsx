import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { isFeatureEnabled } from '../../features/flags/featureFlags';

const BriefcaseIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const TagIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const FileTextIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const ShieldIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const SettingsIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

interface ActiveNavEntry {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const ACTIVE_NAV_ITEMS: ActiveNavEntry[] = [
  { path: '/jobs',      label: '案件看板',  icon: <BriefcaseIcon /> },
  { path: '/bids',      label: '招標進度',  icon: <TagIcon /> },
  { path: '/contracts', label: '合約管理',  icon: <FileTextIcon /> },
];

const CoverOnesSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const settingsEnabled = isFeatureEnabled('avatarSettings');
  const handleOpenSettings = useCallback(() => {
    if (settingsEnabled) navigate('/settings');
  }, [navigate, settingsEnabled]);

  const isActive = (path: string) => location.pathname.startsWith(path);

  const initial = (user?.displayName ?? 'U').charAt(0).toUpperCase();

  // Inc2: surface a KYC entry until the user reaches tier 2 (which unlocks
  // 發案/投標). Once verified to tier 2 the item drops off the nav.
  const kycTier = user?.kycTier ?? 0;
  const navItems: ActiveNavEntry[] =
    kycTier < 2
      ? [...ACTIVE_NAV_ITEMS, { path: '/kyc', label: '身分認證', icon: <ShieldIcon /> }]
      : ACTIVE_NAV_ITEMS;

  return (
    <aside
      role="complementary"
      aria-label="Main navigation"
      style={{
        width: 'var(--sidebar-w)',
        height: '100%',
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
      {/* Brand */}
      <div
        style={{
          padding: '6px 10px 16px 10px',
          borderBottom: '1px solid var(--co-line)',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <button
          onClick={() => navigate('/jobs')}
          aria-label="CoverOnes - 回到首頁"
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
          {/* Brand mark: 34x34 gradient square with bold C */}
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
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 12c0 4.418-3.582 8-8 8-2.548 0-4.82-1.194-6.3-3.065M4 12C4 7.582 7.582 4 12 4c2.548 0 4.82 1.194 6.3 3.065"
                stroke="#fff"
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
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--co-text)', lineHeight: 1.2 }}>
              CoverOnes
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--co-text-dim)', lineHeight: 1.3 }}>
              罩我·接案媒合
            </div>
          </div>
        </button>
      </div>

      {/* Nav section label */}
      <div
        style={{
          fontSize: 10,
          color: 'var(--co-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          padding: '14px 12px 6px 12px',
          fontWeight: 500,
        }}
      >
        主選單
      </div>

      {/* Active nav items */}
      <nav aria-label="Primary navigation">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <div key={item.path} style={{ position: 'relative' }}>
              {/* Active accent bar (simulated ::before) */}
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
                onClick={() => navigate(item.path)}
                aria-current={active ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: active ? '#fff' : 'var(--co-text-dim)',
                  background: active
                    ? 'linear-gradient(90deg, rgba(99,102,241,0.18), rgba(99,102,241,0.04))'
                    : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'background 150ms ease-out, color 150ms ease-out',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                  if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'var(--co-text)';
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'var(--co-text-dim)';
                }}
              >
                <span
                  style={{
                    color: active ? 'var(--co-accent)' : 'var(--co-text-muted)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>
              </button>
            </div>
          );
        })}
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--co-line)', margin: '8px 4px' }} aria-hidden="true" />

      {/* Settings — gated as "Coming soon" until the settings backend ships (TBD). */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={handleOpenSettings}
          disabled={!settingsEnabled}
          aria-disabled={!settingsEnabled}
          title={!settingsEnabled ? '即將推出 · Coming soon' : undefined}
          aria-current={settingsEnabled && isActive('/settings') ? 'page' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            color: settingsEnabled && isActive('/settings') ? '#fff' : 'var(--co-text-muted)',
            background: settingsEnabled && isActive('/settings')
              ? 'linear-gradient(90deg, rgba(99,102,241,0.18), rgba(99,102,241,0.04))'
              : 'transparent',
            border: 'none',
            cursor: settingsEnabled ? 'pointer' : 'not-allowed',
            opacity: settingsEnabled ? 1 : 0.6,
            width: '100%',
            textAlign: 'left',
            transition: 'background 150ms ease-out, color 150ms ease-out',
          }}
          onMouseEnter={(e) => {
            if (settingsEnabled && !isActive('/settings')) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
          }}
          onMouseLeave={(e) => {
            if (settingsEnabled && !isActive('/settings')) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          <span style={{ color: 'var(--co-text-muted)', flexShrink: 0, display: 'flex', alignItems: 'center' }} aria-hidden="true">
            <SettingsIcon />
          </span>
          <span style={{ flex: 1 }}>Settings</span>
          {!settingsEnabled && (
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: 999,
                background: 'rgba(245,158,11,0.15)',
                color: 'var(--co-amber)',
                border: '1px solid rgba(245,158,11,0.25)',
                flexShrink: 0,
              }}
            >
              TBD
            </span>
          )}
        </button>
      </div>

      {/* Footer */}
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
        {/* Avatar */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
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
          <div style={{ fontSize: 10.5, color: 'var(--co-green)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
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
