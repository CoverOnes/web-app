import React from 'react';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell — outer structural wrapper.
 * Desktop (≥768px): CSS grid with sidebar column (240px) + main column (1fr).
 * Mobile (<768px): single column flex, sidebar provided via MobileDrawer.
 */
const AppShell = ({ children }: AppShellProps) => {
  return (
    <div
      style={{
        /* Mobile first: single column */
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        overflow: 'hidden',
        background: 'var(--co-bg)',
      }}
      className="app-shell"
    >
      {children}
      <style>{`
        @media (min-width: 768px) {
          .app-shell {
            display: grid !important;
            grid-template-columns: var(--co-sidebar-w) 1fr !important;
            flex-direction: unset !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AppShell;
