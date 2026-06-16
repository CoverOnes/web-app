import { useCallback, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { chatApi } from '../../api/chat';
import { useSSE } from '../../hooks/useSSE';
import MessageList from './MessageList';
import Composer from './Composer';
import RoomHeader from './RoomHeader';
import MembersPanel from './MembersPanel';
import RoomSettingsModal from './RoomSettingsModal';
import { getDisplayName } from '../../utils/formatters';
import type { MessageAttachment } from '../../types';

const ChatRoom = () => {
  // Identity comes from authStore (logged-in user), not chatStore.currentUser.
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const { currentRoom, addMessage, addRoom, setCurrentRoom } = useChatStore();
  const messageHistory = useChatStore((s) => s.messageHistory);
  const setMessages = useChatStore((s) => s.setMessages);
  const [showMembers, setShowMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useSSE({
    roomId: currentRoom?.id ?? '',
    userId,
    onMessage: (message) => {
      if (!currentRoom) return;
      if (message.room_id === currentRoom.id) {
        addMessage(currentRoom.id, message);
        requestAnimationFrame(() => {
          const el = document.querySelector('[data-messages-container]');
          if (el) el.scrollTop = el.scrollHeight;
        });
        if (!currentRoom.isTemporary) {
          chatApi.markAsRead(currentRoom.id, userId).catch(() => undefined);
        }
      }
    },
    onError: () => undefined,
  });

  const getRoomDisplayName = useCallback((): string => {
    if (!currentRoom) return '';
    if (currentRoom.type === 'group') return currentRoom.name;
    if (currentRoom.type === 'direct' && currentRoom.members?.length > 0) {
      const other = currentRoom.members.find(m => m.user_id !== userId);
      if (other) return getDisplayName(other.user_id);
    }
    if (currentRoom.type === 'direct' && currentRoom.name) {
      const match = currentRoom.name.match(/user_(\w+)_user_(\w+)/);
      if (match) {
        const u1 = `user_${match[1]}`;
        const u2 = `user_${match[2]}`;
        return getDisplayName(u1 === userId ? u2 : u1);
      }
    }
    return currentRoom.name || '未知聊天室';
  }, [currentRoom, userId]);

  const handleSendMessage = useCallback(async (
    content: string,
    attachment?: MessageAttachment,
    attachmentType?: 'file' | 'image',
  ) => {
    if (!currentRoom) return;
    try {
      let roomId = currentRoom.id;
      let actualRoom = currentRoom;

      if (currentRoom.isTemporary) {
        const other = currentRoom.members?.find(m => m.user_id !== userId);
        const roomName = other ? `${userId}_${other.user_id}` : `${userId}_chat`;
        const createdRoom = await chatApi.createRoom({
          name: roomName,
          type: 'direct',
          owner_id: userId,
          members: currentRoom.members,
        });
        roomId = createdRoom.id;
        actualRoom = { ...createdRoom, members: createdRoom.members || currentRoom.members };
        addRoom(actualRoom);
        setMessages(roomId, []);
        setCurrentRoom(actualRoom);
      }

      const msgType = attachment ? (attachmentType ?? 'file') : 'text';

      const tempMessage = {
        id: `temp_${Date.now()}`,
        room_id: roomId,
        sender_id: userId,
        content,
        type: msgType as 'text' | 'file' | 'image',
        created_at: Math.floor(Date.now() / 1000),
        read_by: [userId],
        attachment,
      };

      addMessage(roomId, tempMessage);

      const sentMsg = await chatApi.sendMessage({
        room_id: roomId,
        sender_id: userId,
        content,
        type: msgType as 'text' | 'file' | 'image',
        attachment,
      });

      const msgs = messageHistory[roomId] || [];
      const withoutTemp = msgs.filter(m => m.id !== tempMessage.id);
      const exists = withoutTemp.some(m => m.id === sentMsg.id);
      setMessages(roomId, exists ? withoutTemp : [...withoutTemp, sentMsg]);
    } catch {
      setSendError('發送訊息失敗，請稍後再試');
      setTimeout(() => setSendError(null), 4000);
    }
  }, [currentRoom, userId, addRoom, setCurrentRoom, addMessage, messageHistory, setMessages]);

  if (!currentRoom) return null;

  const roomDisplayName = getRoomDisplayName();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-main-bg)' }}>
      <RoomHeader
        room={currentRoom}
        currentUser={userId}
        onOpenMore={() => {
          if (currentRoom.type === 'group' && !currentRoom.isTemporary) {
            setShowSettings(true);
          }
        }}
      />

      <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <MessageList roomId={currentRoom.id} />
        </div>
        {showMembers && <MembersPanel onClose={() => setShowMembers(false)} />}
      </div>

      {sendError && (
        <div style={{
          padding: '6px 24px',
          fontSize: 12,
          color: 'var(--color-red)',
          background: 'var(--color-main-bg)',
          borderTop: '1px solid var(--color-main-border)',
        }}>
          {sendError}
        </div>
      )}
      <Composer onSend={handleSendMessage} roomTitle={roomDisplayName} />

      {showSettings && <RoomSettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default ChatRoom;
