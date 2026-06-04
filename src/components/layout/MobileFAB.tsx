import type { ReactNode } from 'react';

const PlusIcon = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

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
          color: '#fff',
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
        {icon ?? <PlusIcon />}
      </button>
      {/* Hide on desktop */}
      <style>{`
        @media (min-width: 768px) { .mobile-fab { display: none !important; } }
      `}</style>
    </>
  );
};

export default MobileFAB;
