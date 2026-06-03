import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isFeatureEnabled } from '../../features/flags/featureFlags';

interface TabItem {
  id: string;
  path: string;
  label: string;
  icon: React.ReactNode;
}

const BriefcaseIcon = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
);

const TagIcon = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const FileTextIcon = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const MessageSquareIcon = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ALL_TABS: (TabItem & { flag?: Parameters<typeof isFeatureEnabled>[0] })[] = [
  { id: 'jobs',      path: '/jobs',      label: 'Jobs',      icon: <BriefcaseIcon /> },
  { id: 'bids',      path: '/bids',      label: 'Bids',      icon: <TagIcon /> },
  { id: 'contracts', path: '/contracts', label: 'Contracts', icon: <FileTextIcon /> },
  // Chat is TBD — only shown when the chat feature flag is enabled.
  { id: 'messages',  path: '/messages',  label: 'Chat',      icon: <MessageSquareIcon />, flag: 'chat' },
];

// Drop tabs whose feature flag is disabled so users can't navigate to a TBD page.
const TABS: TabItem[] = ALL_TABS.filter((t) => !t.flag || isFeatureEnabled(t.flag));

const CoverOnesMobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 72,
        background: 'var(--co-bg-card-2)',
        borderTop: '1px solid var(--co-line)',
        display: 'flex',
        alignItems: 'stretch',
        zIndex: 5 as React.CSSProperties['zIndex'],
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map((tab) => {
        const active = isActive(tab.path);
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
              color: active ? 'var(--color-accent)' : 'var(--co-text-dim)',
              minWidth: 44,
              minHeight: 44,
              transition: 'color 150ms ease-out',
            }}
          >
            <span style={{ color: active ? 'var(--color-accent)' : 'var(--co-text-dim)' }}>
              {tab.icon}
            </span>
            <span style={{ fontSize: 10, fontWeight: 500, lineHeight: 1 }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default CoverOnesMobileBottomNav;
