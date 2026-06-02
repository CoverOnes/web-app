import { useCallback } from 'react';
import { useChatStore } from '../../store/chatStore';
import { chatApi } from '../../api/chat';
import { useSSE } from '../../hooks/useSSE';
import MessageList from './MessageList';
import Composer from './Composer';
import RoomHeader from './RoomHeader';
import MembersPanel from './MembersPanel';
import RoomSettingsModal from './RoomSettingsModal';
import { getDisplayName } from '../../utils/formatters';
import { useState } from 'react';

const ChatRoom = () => {
  const { currentUser, currentRoom, addMessage, addRoom, setCurrentRoom } = useChatStore();
  const messageHistory = useChatStore((s) => s.messageHistory);
  const setMessages = useChatStore((s) => s.setMessages);
  const [showMembers, setShowMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useSSE({
    roomId: currentRoom?.id ?? '',
    userId: currentUser,
    onMessage: (message) => {
      if (!currentRoom) return;
      if (message.room_id === currentRoom.id) {
        addMessage(currentRoom.id, message);
        requestAnimationFrame(() => {
          const el = document.querySelector('[data-messages-container]');
          if (el) el.scrollTop = el.scrollHeight;
        });
        if (!currentRoom.isTemporary) {
          chatApi.markAsRead(currentRoom.id, currentUser).catch(() => undefined);
        }
      }
    },
    onError: () => undefined,
  });

  const getRoomDisplayName = useCallback((): string => {
    if (!currentRoom) return '';
    if (currentRoom.type === 'group') return currentRoom.name;
    if (currentRoom.type === 'direct' && currentRoom.members?.length > 0) {
      const other = currentRoom.members.find(m => m.user_id !== currentUser);
      if (other) return getDisplayName(other.user_id);
    }
    if (currentRoom.type === 'direct' && currentRoom.name) {
      const match = currentRoom.name.match(/user_(\w+)_user_(\w+)/);
      if (match) {
        const u1 = `user_${match[1]}`;
        const u2 = `user_${match[2]}`;
        return getDisplayName(u1 === currentUser ? u2 : u1);
      }
    }
    return currentRoom.name || '未知聊天室';
  }, [currentRoom, currentUser]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!currentRoom) return;
    try {
      let roomId = currentRoom.id;
      let actualRoom = currentRoom;

      if (currentRoom.isTemporary) {
        const other = currentRoom.members?.find(m => m.user_id !== currentUser);
        const roomName = other ? `${currentUser}_${other.user_id}` : `${currentUser}_chat`;
        const createResponse = await chatApi.createRoom({
          name: roomName,
          type: 'direct',
          owner_id: currentUser,
          members: currentRoom.members,
        });
        if (!createResponse.success || !createResponse.data) {
          alert('創建聊天室失敗');
          return;
        }
        roomId = createResponse.data.id;
        actualRoom = { ...createResponse.data, members: createResponse.data.members || currentRoom.members };
        addRoom(actualRoom);
        setMessages(roomId, []);
        setCurrentRoom(actualRoom);
      }

      const tempMessage = {
        id: `temp_${Date.now()}`,
        room_id: roomId,
        sender_id: currentUser,
        content,
        type: 'text' as const,
        created_at: Math.floor(Date.now() / 1000),
        read_by: [currentUser],
      };

      addMessage(roomId, tempMessage);

      const response = await chatApi.sendMessage({ room_id: roomId, sender_id: currentUser, content, type: 'text' });

      if (response.success && response.data) {
        const msgs = messageHistory[roomId] || [];
        const withoutTemp = msgs.filter(m => m.id !== tempMessage.id);
        const exists = withoutTemp.some(m => m.id === response.data!.id);
        setMessages(roomId, exists ? withoutTemp : [...withoutTemp, response.data]);
      } else {
        const msgs = messageHistory[roomId] || [];
        setMessages(roomId, msgs.filter(m => m.id !== tempMessage.id));
      }
    } catch {
      alert('發送訊息失敗，請稍後再試');
    }
  }, [currentRoom, currentUser, addRoom, setCurrentRoom, addMessage, messageHistory, setMessages]);

  if (!currentRoom) return null;

  const roomDisplayName = getRoomDisplayName();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-main-bg)' }}>
      <RoomHeader
        room={currentRoom}
        currentUser={currentUser}
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

      <Composer onSend={handleSendMessage} roomTitle={roomDisplayName} />

      {showSettings && <RoomSettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default ChatRoom;
