import type { ReactNode } from 'react';

const MenuIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

interface MobileScreenHeaderProps {
  title: string;
  onMenuOpen: () => void;
  action?: ReactNode;
}

/**
 * MobileScreenHeader — 52px header for mobile screen tops.
 * Spec: design-reference/chat/project/src/mobile.jsx mobStyles.screenHeader.
 * Layout: hamburger | title (flex 1) | optional right action.
 * Hidden on desktop via media query.
 */
const MobileScreenHeader = ({ title, onMenuOpen, action }: MobileScreenHeaderProps) => {
  return (
    <>
      <div
        className="mobile-screen-header"
        style={{
          height: 52,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'var(--co-bg-card)',
          borderBottom: '1px solid var(--co-line)',
          flexShrink: 0,
        }}
      >
        {/* Hamburger — opens the drawer */}
        <button
          type="button"
          onClick={onMenuOpen}
          aria-label="開啟選單"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--co-text)',
            /* Minimum touch target */
            minWidth: 44,
            minHeight: 44,
          }}
        >
          <MenuIcon />
        </button>

        {/* Page title */}
        <div
          style={{
            flex: 1,
            fontSize: 17,
            fontWeight: 600,
            color: 'var(--co-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>

        {/* Right action slot (optional) */}
        {action && (
          <div style={{ flexShrink: 0 }}>
            {action}
          </div>
        )}
      </div>
      {/* Hide on desktop */}
      <style>{`
        @media (min-width: 768px) { .mobile-screen-header { display: none !important; } }
      `}</style>
    </>
  );
};

export default MobileScreenHeader;
