import type { ReactNode } from 'react';
import { Icon } from '../ui/Icon';

interface MobileScreenHeaderProps {
  title: string;
  onMenuOpen: () => void;
  /** Reflects the drawer open state for aria-expanded on the hamburger button */
  open?: boolean;
  action?: ReactNode;
}

/**
 * MobileScreenHeader — 52px header for mobile screen tops.
 * Spec: design-reference/chat/project/src/mobile.jsx mobStyles.screenHeader.
 * Layout: hamburger | title (flex 1) | optional right action.
 * Hidden on desktop via media query.
 */
const MobileScreenHeader = ({ title, onMenuOpen, open = false, action }: MobileScreenHeaderProps) => {
  return (
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
          aria-expanded={open}
          aria-controls="mobile-drawer"
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
          <Icon.Menu size={20} />
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
  );
};

export default MobileScreenHeader;
