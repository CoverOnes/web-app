import { useState } from 'react';
import type { Person } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';

interface SidebarFooterProps {
  currentUser: Person;
  onOpenSettings: () => void;
}

const SidebarFooter = ({ currentUser, onOpenSettings }: SidebarFooterProps) => {
  const [settingsHover, setSettingsHover] = useState(false);

  return (
    <div style={{
      padding: '10px 12px',
      borderTop: '1px solid var(--color-sb-border)',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexShrink: 0,
    }}>
      <Avatar
        name={currentUser.zh ?? currentUser.name}
        pixelSize={32}
        color={currentUser.color}
        showDot
        status={currentUser.status}
        ring
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-sb-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          你 · {currentUser.zh ?? currentUser.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-green)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: 'var(--color-green)',
            boxShadow: '0 0 6px rgba(5,150,105,0.6)',
            flexShrink: 0,
          }} />
          線上 · End-to-end encrypted
        </div>
      </div>
      <button
        onClick={onOpenSettings}
        onMouseEnter={() => setSettingsHover(true)}
        onMouseLeave={() => setSettingsHover(false)}
        aria-label="開啟設定"
        style={{
          padding: 6,
          borderRadius: 6,
          color: 'var(--color-sb-text-dim)',
          background: settingsHover ? 'var(--color-sb-hover)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 150ms ease-out',
          flexShrink: 0,
        }}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        <Icon.Settings size={16} />
      </button>
    </div>
  );
};

export default SidebarFooter;
