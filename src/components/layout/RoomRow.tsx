import { useState } from 'react';
import type { Room, Person } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { getDisplayName, formatMessageTime, formatMessagePreview } from '../../utils/formatters';

interface RoomRowProps {
  room: Room;
  active: boolean;
  onClick: () => void;
  currentUser: string;
}

// Deterministic gradient colors per user
const GRADIENT_PALETTE: [string, string][] = [
  ['#2563EB', '#6366F1'],
  ['#059669', '#0D9488'],
  ['#D97706', '#DC2626'],
  ['#7C3AED', '#DB2777'],
  ['#0891B2', '#0D9488'],
  ['#B45309', '#92400E'],
  ['#065F46', '#0F766E'],
];

function getPersonColor(userId: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENT_PALETTE[Math.abs(hash) % GRADIENT_PALETTE.length];
}

function buildPerson(userId: string): Person {
  const name = getDisplayName(userId);
  return {
    id: userId,
    name,
    zh: name,
    status: 'online',
    color: getPersonColor(userId),
  };
}


function getRoomTitle(room: Room, currentUser: string): string {
  if (room.type === 'group') return room.name;
  const other = room.members?.find(m => m.user_id !== currentUser);
  if (other) return getDisplayName(other.user_id);
  return room.name || '未知對話';
}

const RoomRow = ({ room, active, onClick, currentUser }: RoomRowProps) => {
  const [hover, setHover] = useState(false);
  const unread = room.unread_count ?? 0;
  const title = getRoomTitle(room, currentUser);
  const timestamp = room.last_message_time ? formatMessageTime(room.last_message_time) : '';

  const otherMemberId = room.members?.find(m => m.user_id !== currentUser)?.user_id;
  const otherPerson = otherMemberId ? buildPerson(otherMemberId) : null;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-pressed={active}
      aria-label={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        margin: '0 8px',
        borderRadius: 10,
        background: active
          ? 'var(--color-sb-active)'
          : hover
          ? 'var(--color-sb-hover)'
          : 'transparent',
        border: 'none',
        cursor: 'pointer',
        width: 'calc(100% - 16px)',
        textAlign: 'left',
        transition: 'background 150ms ease-out',
        position: 'relative',
      }}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
    >
      {active && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: 8,
          bottom: 8,
          width: 3,
          borderRadius: 2,
          background: 'var(--color-accent)',
        }} />
      )}

      {/* Avatar */}
      {room.type === 'direct' && otherPerson ? (
        <Avatar
          name={otherPerson.name}
          pixelSize={34}
          color={otherPerson.color}
          showDot
          status={otherPerson.status}
          ring
        />
      ) : (
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(37,99,235,0.25), rgba(99,102,241,0.2))',
          border: '1px solid rgba(37,99,235,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-accent)',
          flexShrink: 0,
        }}>
          <Icon.Hash size={16} />
        </div>
      )}

      {/* Text block */}
      <div style={{ minWidth: 0, flex: 1 }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 13,
            fontWeight: unread > 0 ? 600 : 500,
            color: 'var(--color-sb-text)',
          }}>
            {title}
          </span>
          {timestamp && (
            <span style={{
              fontSize: 10.5,
              color: 'var(--color-sb-text-dim)',
              fontWeight: unread > 0 ? 600 : 400,
              flexShrink: 0,
            }}>
              {timestamp}
            </span>
          )}
        </div>

        {/* Preview row */}
        <div style={{
          fontSize: 12,
          color: unread > 0 ? 'var(--color-sb-text)' : 'var(--color-sb-text-dim)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginTop: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {formatMessagePreview(room.last_message) || ' '}
          </span>
          {unread > 0 && (
            <span style={{
              fontSize: 10.5,
              fontWeight: 600,
              padding: '0 6px',
              height: 16,
              lineHeight: '16px',
              borderRadius: 999,
              background: 'var(--color-red)',
              color: '#fff',
              minWidth: 16,
              textAlign: 'center',
              flexShrink: 0,
            }}>
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default RoomRow;
