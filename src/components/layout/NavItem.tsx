import { useState } from 'react';
import type { IconName } from '../ui/Icon';
import { Icon } from '../ui/Icon';

interface NavItemProps {
  icon: IconName;
  label: string;
  count?: number | null;
  active: boolean;
  onClick: () => void;
}

const NavItem = ({ icon, label, count, active, onClick }: NavItemProps) => {
  const [hover, setHover] = useState(false);
  const IconComponent = Icon[icon];

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 10px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        color: active ? 'var(--color-sb-text)' : 'var(--color-sb-text-dim)',
        background: active
          ? 'var(--color-sb-active)'
          : hover
          ? 'var(--color-sb-hover)'
          : 'transparent',
        border: 'none',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'background 150ms ease-out, color 150ms ease-out',
      }}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
    >
      <IconComponent
        size={16}
        style={{ color: active ? 'var(--color-accent)' : 'currentColor', flexShrink: 0 }}
      />
      <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
      {count != null && (
        <span style={{
          fontSize: 11,
          padding: '1px 7px',
          borderRadius: 999,
          background: 'var(--color-sb-tint-2)',
          color: 'var(--color-sb-text-dim)',
          fontWeight: 500,
        }}>
          {count}
        </span>
      )}
    </button>
  );
};

export default NavItem;
