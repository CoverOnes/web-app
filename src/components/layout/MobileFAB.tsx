import type { ReactNode } from 'react';
import { Icon } from '../ui/Icon';

interface MobileFABProps {
  onClick: () => void;
  label: string;
  icon?: ReactNode;
}

/**
 * MobileFAB — floating action button for the primary mobile action.
 * Position: fixed, right 16px, bottom 90px (clears 72px bottom-nav + gap).
 * Spec: design-reference/chat/project/src/mobile.jsx mobStyles.fab.
 * Hidden on desktop via media query.
 */
const MobileFAB = ({ onClick, label, icon }: MobileFABProps) => {
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="mobile-fab"
        style={{
          position: 'fixed',
          right: 16,
          bottom: 90,
          width: 52,
          height: 52,
          borderRadius: 16,
          background: 'var(--co-accent)',
          color: 'var(--co-text-on-accent)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 24px rgba(99,102,241,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
          zIndex: 6,
          /* Minimum touch target */
          minWidth: 52,
          minHeight: 52,
          transition: 'transform 150ms ease-out, box-shadow 150ms ease-out',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        {icon ?? <Icon.Plus size={24} />}
      </button>
    </>
  );
};

export default MobileFAB;
