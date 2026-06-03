import React from 'react';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell — outer structural wrapper.
 * Desktop: flex row, full 100vh, no overflow.
 * Mobile (<768px): full width, sidebar hidden (MobileDrawer provides it).
 */
const AppShell = ({ children }: AppShellProps) => {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--co-bg)',
      }}
    >
      {children}
    </div>
  );
};

export default AppShell;
