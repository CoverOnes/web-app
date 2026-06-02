import { memo } from 'react';
import type { Room } from '../../types';
import { formatMessageTime, formatMessagePreview, getInitials, getDisplayName, getAvatarColor } from '../../utils/formatters';
import { useChatStore } from '../../store/chatStore';


interface RoomItemProps {
  room: Room;
  onClick: () => void;
}

const RoomItem = memo(({ room, onClick }: RoomItemProps) => {
  const { currentRoom, currentUser } = useChatStore();
  const isActive = currentRoom?.id === room.id;

  const getRoomDisplayName = (r: Room): string => {
    if (r.type === 'group') {
      return r.name;
    } else if (r.type === 'direct' && r.members) {
      const otherMember = r.members.find((m) => m.user_id !== currentUser);
      if (otherMember) {
        return getDisplayName(otherMember.user_id);
      }
    }
    return r.name;
  };

  const displayName = getRoomDisplayName(room);
  const rawLastMessage = room.last_message;
  const lastMessage = rawLastMessage ? formatMessagePreview(rawLastMessage) : '開始新對話...';
  const lastTime = room.last_message_time ? formatMessageTime(room.last_message_time) : '';
  const unreadCount = room.unread_count ?? 0;
  const hasUnread = unreadCount > 0;

  let avatarId = room.id;
  if (room.type === 'direct' && room.members) {
    const otherMember = room.members.find((m) => m.user_id !== currentUser);
    if (otherMember) {
      avatarId = otherMember.user_id;
    }
  }
  const avatarColor = getAvatarColor(avatarId);
  const initial = getInitials(displayName);

  return (
    <button
      aria-pressed={isActive}
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-3
        min-h-[72px] rounded-xl mx-1
        text-left
        transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-white/50 focus-visible:ring-inset
        ${isActive
          ? 'bg-primary-600 text-white'
          : 'text-white/85 hover:bg-white/8 active:bg-white/12'
        }
      `}
    >
      {/* Avatar */}
      <div className="relative flex-none">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-base select-none"
          style={{ backgroundColor: avatarColor }}
          aria-hidden="true"
        >
          {initial}
        </div>
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span
            className={`
              text-[15px] truncate
              ${hasUnread ? 'font-semibold' : 'font-medium'}
            `}
          >
            {displayName}
          </span>
          {lastTime && (
            <time
              className={`
                flex-none text-xs ml-2
                ${isActive ? 'text-white/70' : 'text-white/50'}
              `}
            >
              {lastTime}
            </time>
          )}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p
            className={`
              text-sm truncate
              ${isActive ? 'text-white/80' : 'text-white/55'}
              ${hasUnread ? 'font-medium' : ''}
            `}
          >
            {lastMessage}
          </p>
          {unreadCount > 0 && (
            <span
              className="
                flex-none ml-2
                min-w-[18px] h-[18px] px-1
                bg-accent-500 text-white
                text-[10px] font-bold leading-none
                rounded-full
                flex items-center justify-center
              "
              aria-label={`${unreadCount} 則未讀`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
});

RoomItem.displayName = 'RoomItem';

export default RoomItem;
