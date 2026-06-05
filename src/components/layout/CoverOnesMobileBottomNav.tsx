import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '../ui/Icon';

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
 *
 * P2a: 首頁 points to '/' (Homepage dashboard now renders at that route).
 */
const TABS: TabItem[] = [
  { id: 'home',      path: '/',          label: '首頁', icon: <Icon.Home size={22} /> },
  { id: 'jobs',      path: '/jobs',      label: '案件', icon: <Icon.Briefcase size={22} /> },
  { id: 'bids',      path: '/bids',      label: '招標', icon: <Icon.Tag size={22} /> },
  { id: 'contracts', path: '/contracts', label: '合約', icon: <Icon.FileText size={22} /> },
  { id: 'messages',  path: '/messages',  label: '訊息', icon: <Icon.Chat size={22} />, badge: 0 },
];

const CoverOnesMobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // P2a: 首頁 at '/' uses exact match to avoid matching every sub-path.
  // Other tabs use prefix match (startsWith) — first match wins.
  const activeTabId = (() => {
    for (const tab of TABS) {
      if (tab.path === '/') {
        if (location.pathname === '/') return tab.id;
      } else if (location.pathname.startsWith(tab.path)) {
        return tab.id;
      }
    }
    return null;
  })();

  return (
    <nav
      aria-label="主要導覽"
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
        const active = activeTabId === tab.id;
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
                    color: 'var(--co-text-on-accent)',
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
