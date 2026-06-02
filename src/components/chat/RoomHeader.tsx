import { useState } from 'react';
import type { Room, Person } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import EncryptionBadge from './EncryptionBadge';
import { getDisplayName } from '../../utils/formatters';

interface RoomHeaderProps {
  room: Room;
  currentUser: string;
  onOpenCall?: () => void;
  onOpenVideo?: () => void;
  onOpenMore?: () => void;
}

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
  return { id: userId, name, zh: name, status: 'online', color: getPersonColor(userId) };
}

interface IconBtnProps {
  icon: React.ReactNode;
  ariaLabel: string;
  onClick?: () => void;
}

const IconBtn = ({ icon, ariaLabel, onClick }: IconBtnProps) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-main-text-dim)',
        background: hover ? 'var(--color-main-bg)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 150ms ease-out, color 150ms ease-out',
      }}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
    >
      {icon}
    </button>
  );
};

const RoomHeader = ({ room, currentUser, onOpenCall, onOpenVideo, onOpenMore }: RoomHeaderProps) => {
  const otherMemberId = room.type === 'direct'
    ? room.members?.find(m => m.user_id !== currentUser)?.user_id
    : undefined;
  const otherPerson = otherMemberId ? buildPerson(otherMemberId) : null;
  const memberCount = room.members?.length ?? 0;

  const title = room.type === 'group'
    ? room.name
    : (otherPerson?.name ?? room.name);

  const groupMembers = room.type === 'group'
    ? (room.members ?? []).slice(0, 5).map(m => buildPerson(m.user_id))
    : [];
  const extraCount = room.type === 'group' ? Math.max(0, memberCount - 5) : 0;

  return (
    <div style={{
      height: 64,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 24px',
      borderBottom: '1px solid var(--color-main-border)',
      flexShrink: 0,
      background: 'var(--color-main-bg-2)',
    }}>
      {/* Avatar */}
      {room.type === 'direct' && otherPerson ? (
        <Avatar name={otherPerson.name} pixelSize={38} color={otherPerson.color} showDot status={otherPerson.status} />
      ) : (
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: 'linear-gradient(135deg, var(--color-accent), var(--color-indigo))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          flexShrink: 0,
        }}>
          <Icon.Hash size={18} />
        </div>
      )}

      {/* Info */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-main-text)' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
          <EncryptionBadge />
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-main-text-dim)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
          {room.type === 'direct' && otherPerson ? (
            <>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--color-green)', flexShrink: 0 }} />
              線上 · {otherPerson.name}
            </>
          ) : (
            <>{`${memberCount} 位成員`}</>
          )}
        </div>
      </div>

      {/* Group member stack */}
      {room.type === 'group' && groupMembers.length > 0 && (
        <div style={{ display: 'flex', marginRight: 8 }}>
          {groupMembers.map((p, i) => (
            <div key={p.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
              <Avatar name={p.name} pixelSize={26} color={p.color} ring />
            </div>
          ))}
          {extraCount > 0 && (
            <div style={{
              marginLeft: -8,
              width: 26,
              height: 26,
              borderRadius: 8,
              background: 'var(--color-main-bg)',
              border: '2px solid var(--color-main-bg-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--color-main-text-dim)',
            }}>
              +{extraCount}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <IconBtn icon={<Icon.Phone size={17} />} ariaLabel="語音通話" onClick={onOpenCall} />
      <IconBtn icon={<Icon.Video size={17} />} ariaLabel="視訊通話" onClick={onOpenVideo} />
      <IconBtn icon={<Icon.MoreH size={17} />} ariaLabel="更多選項" onClick={onOpenMore} />
    </div>
  );
};

export default RoomHeader;
