import { useState } from 'react';
import type { Person } from '../../types';
import { Avatar } from '../ui/Avatar';

interface PresenceItemProps {
  person: Person;
  onClick?: () => void;
}

const PresenceItem = ({ person, onClick }: PresenceItemProps) => {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 10px',
        borderRadius: 8,
        fontSize: 13,
        color: 'var(--color-sb-text)',
        background: hover ? 'var(--color-sb-hover)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'background 150ms ease-out',
      }}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
    >
      <Avatar
        name={person.zh ?? person.name}
        pixelSize={24}
        color={person.color}
        showDot
        status={person.status}
      />
      <span style={{ flex: 1, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {person.zh ?? person.name}
      </span>
      <span style={{ fontSize: 11, color: 'var(--color-sb-text-dim)', flexShrink: 0 }}>
        {person.name.split(' ')[0]}
      </span>
    </button>
  );
};

export default PresenceItem;
