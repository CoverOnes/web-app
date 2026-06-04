import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/* --- Icons (22×22, 1.75 stroke) --- */

const HomeIcon = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

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

/* --- Tab definition --- */

interface TabItem {
  id: string;
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

/*
 * 5 LOCKED TABS (user directive 2026-06-04):
 *   首頁 · 案件 · 招標 · 合約 · 訊息
 * 訊息 routes to the placeholder page (chat deferred).
 * Unread badges are zero-initialized; future: connect to notification store.
 */
const TABS: TabItem[] = [
  { id: 'home',      path: '/',          label: '首頁', icon: <HomeIcon /> },
  { id: 'jobs',      path: '/jobs',      label: '案件', icon: <BriefcaseIcon /> },
  { id: 'bids',      path: '/bids',      label: '招標', icon: <TagIcon /> },
  { id: 'contracts', path: '/contracts', label: '合約', icon: <FileTextIcon /> },
  { id: 'messages',  path: '/messages',  label: '訊息', icon: <MessageSquareIcon />, badge: 0 },
];

const CoverOnesMobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // "/" (index) only matches the root exactly; others use startsWith
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      aria-label="モバイル主要ナビゲーション"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 72,
        /* paddingBottom accounts for iPhone safe-area-inset-bottom */
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'var(--co-bg-card-2)',
        borderTop: '1px solid var(--co-line)',
        display: 'flex',
        alignItems: 'stretch',
        zIndex: 5,
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
              padding: '4px 0',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: active ? 'var(--co-accent)' : 'var(--co-text-dim)',
              /* Minimum touch target 44×44px per WCAG 2.5.5 */
              minWidth: 44,
              minHeight: 44,
              fontSize: 10,
              fontWeight: 500,
              transition: 'color 150ms ease-out',
            }}
          >
            {/* Icon wrapper with optional unread badge */}
            <div style={{ position: 'relative' }}>
              <span
                style={{ color: active ? 'var(--co-accent)' : 'var(--co-text-dim)' }}
                aria-hidden="true"
              >
                {tab.icon}
              </span>
              {/* Unread badge — shared.css .icon-btn .num pattern */}
              {tab.badge != null && tab.badge > 0 && (
                <span
                  aria-label={`${tab.badge} 則未讀訊息`}
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -8,
                    fontSize: 9.5,
                    fontWeight: 700,
                    padding: '0 4px',
                    minWidth: 14,
                    height: 14,
                    lineHeight: '14px',
                    borderRadius: 999,
                    background: 'var(--co-red)',
                    color: '#fff',
                    textAlign: 'center',
                    boxShadow: '0 0 0 2px var(--co-bg-card-2)',
                  }}
                >
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default CoverOnesMobileBottomNav;
