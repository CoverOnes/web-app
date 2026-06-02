import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { Person } from '../../types';
import SidebarBrand from './SidebarBrand';
import SidebarFooter from './SidebarFooter';

interface NavEntry {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const BriefcaseIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="12" />
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
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const MessageSquareIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const NAV_ITEMS: NavEntry[] = [
  { path: '/jobs',      label: 'Jobs',       icon: <BriefcaseIcon /> },
  { path: '/bids',      label: 'My Bids',    icon: <TagIcon /> },
  { path: '/contracts', label: 'Contracts',  icon: <FileTextIcon /> },
  { path: '/messages',  label: 'Chat',       icon: <MessageSquareIcon />, badge: 'Coming Soon' },
];

const CoverOnesSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const handleOpenSettings = useCallback(() => navigate('/settings'), [navigate]);

  const currentUserPerson: Person = {
    id: user?.id ?? '',
    name: user?.displayName ?? 'User',
    zh: user?.displayName ?? 'User',
    status: 'online',
    color: ['#2563EB', '#6366F1'],
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <aside
      aria-label="Navigation sidebar"
      style={{
        width: 'var(--sidebar-w)',
        height: '100%',
        background: 'var(--color-sb-bg)',
        borderRight: '1px solid var(--color-sb-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <SidebarBrand onOpenCreate={() => navigate('/jobs/new')} />

      <nav
        aria-label="Main navigation"
        style={{ padding: '12px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: active ? 'var(--color-sb-text)' : 'var(--color-sb-text-dim)',
                background: active ? 'var(--color-sb-active)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                transition: 'background 150ms ease-out, color 150ms ease-out',
              }}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-sb-hover)';
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <span style={{ color: active ? 'var(--color-accent)' : 'currentColor', flexShrink: 0 }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 999,
                    background: 'var(--color-sb-tint-2)',
                    color: 'var(--color-sb-text-dim)',
                    fontWeight: 500,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <SidebarFooter currentUser={currentUserPerson} onOpenSettings={handleOpenSettings} />
    </aside>
  );
};

export default CoverOnesSidebar;
