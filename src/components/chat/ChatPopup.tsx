import { useState, useCallback, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { chatApi } from '../../api/chat';
import { useSSE } from '../../hooks/useSSE';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { getDisplayName, getInitials } from '../../utils/formatters';
import type { Room } from '../../types';

interface ChatPopupProps {
  room: Room;
  index: number;
}

const ChatPopup = ({ room, index }: ChatPopupProps) => {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const {
    addMessage,
    addRoom,
    closeChatPopup,
    minimizeChatPopup,
    minimizedPopups,
    rooms
  } = useChatStore();
  
  // 使用 ref 來追蹤實際的 roomId（處理臨時房間轉真實房間的情況）
  const actualRoomIdRef = useRef(room.id);
  const [actualRoom, setActualRoom] = useState<Room>(room);
  const [connectionError, setConnectionError] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const isMinimized = minimizedPopups[room.id] || false;
  
  // 當臨時房間轉換成真實房間時更新
  if (room.id !== actualRoomIdRef.current && !room.id.startsWith('temp_')) {
    actualRoomIdRef.current = room.id;
    setActualRoom(room);
  }

  // 監聽 rooms 變化 - 當後端數據載入後，自動更新臨時房間為真實房間
  useEffect(() => {
    // 只有當目前是臨時房間時才需要檢查
    if (!room.id.startsWith('temp_')) {
      setConnectionError(false);
      return;
    }

    // 如果 rooms 有數據，嘗試匹配
    if (rooms.length > 0) {
      // 從臨時房間 ID 獲取聯絡人 ID（格式：temp_user_xxx）
      const contactId = room.targetContactId || room.id.replace('temp_', '');

      // 在 rooms 中尋找匹配的真實聊天室
      const matchingRoom = rooms.find(r => {
        if (r.type !== 'direct') return false;
        
        // 方法1: 通過 members 匹配
        if (r.members && r.members.length > 0) {
          const hasContact = r.members.some(m => m.user_id === contactId);
          const hasCurrentUser = r.members.some(m => m.user_id === userId);
          if (hasContact && hasCurrentUser) return true;
        }
        
        // 方法2: 通過 room.name 匹配
        if (r.name) {
          const nameIncludesContact = r.name.includes(contactId);
          const nameIncludesCurrentUser = r.name.includes(userId);
          if (nameIncludesContact && nameIncludesCurrentUser) return true;
        }
        
        return false;
      });

      if (matchingRoom) {
        // 找到真實房間，更新 popup
        const contactId = room.targetContactId || room.id.replace('temp_', '');
        const roomWithMembers: Room = {
          ...matchingRoom,
          members: matchingRoom.members || [
            { user_id: userId, role: 'admin' },
            { user_id: contactId, role: 'member' },
          ],
        };
        
        actualRoomIdRef.current = matchingRoom.id;
        setActualRoom(roomWithMembers);
        setConnectionError(false);
        
        // 更新 openPopups 中的 room
        const { openPopups: currentPopups } = useChatStore.getState();
        useChatStore.setState({
          openPopups: currentPopups.map(r => r.id === room.id ? roomWithMembers : r)
        });
        return;
      }
    }
  }, [rooms, room.id, room.targetContactId, userId]);

  // 如果 room 標記為連線超時，直接顯示錯誤
  useEffect(() => {
    if (room.connectionTimeout) {
      setConnectionError(true);
    }
  }, [room.connectionTimeout]);

  // 使用 room prop 或 actualRoom（處理臨時轉真實的情況）
  const currentRoom = actualRoom.id.startsWith('temp_') ? room : actualRoom;
  const roomIdForMessages = currentRoom.id;

  // SSE 連接（只在非臨時房間時啟動）
  useSSE({
    roomId: roomIdForMessages,
    userId: userId,
    onMessage: (message) => {
      if (message.room_id === roomIdForMessages) {
        addMessage(roomIdForMessages, message);
        
        // 自動標記為已讀
        if (!currentRoom.isTemporary) {
          chatApi.markAsRead(roomIdForMessages, userId).catch(console.error);
        }
      }
    },
    onError: (error) => {
      console.error('SSE 連接錯誤:', error);
    },
  });

  // 獲取顯示名稱
  const getRoomDisplayName = (): string => {
    if (!currentRoom) return '';
    
    if (currentRoom.type === 'group') {
      return currentRoom.name;
    } else if (currentRoom.type === 'direct' && currentRoom.members && currentRoom.members.length > 0) {
      const otherMember = currentRoom.members.find(m => m.user_id !== userId);
      if (otherMember) {
        return getDisplayName(otherMember.user_id);
      }
    }
    
    // 如果找不到 members，嘗試從 room.name 中解析
    if (currentRoom.type === 'direct' && currentRoom.name) {
      const namePattern = /user_(\w+)_user_(\w+)/;
      const match = currentRoom.name.match(namePattern);
      
      if (match) {
        const user1 = `user_${match[1]}`;
        const user2 = `user_${match[2]}`;
        const otherUserId = user1 === userId ? user2 : user1;
        return getDisplayName(otherUserId);
      }
    }
    
    return currentRoom.name || '未知聊天室';
  };

  // 獲取頭像
  const getAvatarName = (): string => {
    if (currentRoom.type === 'group') {
      return currentRoom.name;
    }
    const otherMember = currentRoom.members?.find(m => m.user_id !== userId);
    return otherMember ? otherMember.user_id : currentRoom.name;
  };

  // 發送訊息
  const handleSendMessage = useCallback(async (content: string) => {
    if (!currentRoom) return;
    
    try {
      let roomId = currentRoom.id;
      let newRoom = currentRoom;
      
      // 如果是臨時聊天室，先創建聊天室
      if (currentRoom.isTemporary) {
        const otherMember = currentRoom.members?.find(m => m.user_id !== userId);
        const roomName = otherMember ? `${userId}_${otherMember.user_id}` : `${userId}_chat`;
        
        const createdRoom = await chatApi.createRoom({
          name: roomName,
          type: 'direct',
          owner_id: userId,
          members: currentRoom.members,
        });

        roomId = createdRoom.id;
        newRoom = {
          ...createdRoom,
          members: createdRoom.members || currentRoom.members
        };
        
        addRoom(newRoom);
        
        // 不要在這裡清空訊息，讓 MessageList 自己處理
        // 直接先把臨時訊息加入（使用新的 roomId）
        const tempMessage = {
          id: `temp_${Date.now()}`,
          room_id: roomId,
          sender_id: userId,
          content: content,
          type: 'text' as const,
          created_at: Math.floor(Date.now() / 1000),
          read_by: [userId],
        };
        
        // 先設置訊息（包含臨時訊息）
        const { setMessages: initMessages } = useChatStore.getState();
        initMessages(roomId, [tempMessage]);
        
        // 更新本地狀態
        actualRoomIdRef.current = roomId;
        setActualRoom(newRoom);
        
        // 更新 openPopups 中的 room
        const { openPopups: currentPopups } = useChatStore.getState();
        useChatStore.setState({
          openPopups: currentPopups.map(r => r.id === room.id ? newRoom : r)
        });

        // 發送訊息到後端
        const sendResponse = await chatApi.sendMessage({
          room_id: roomId,
          sender_id: userId,
          content,
          type: 'text',
        });

        {
          const { messageHistory, setMessages } = useChatStore.getState();
          const messages = messageHistory[roomId] || [];
          const withoutTemp = messages.filter(msg => msg.id !== tempMessage.id);
          const realMessageExists = withoutTemp.some(msg => msg.id === sendResponse.id);
          const updatedMessages = realMessageExists ? withoutTemp : [...withoutTemp, sendResponse];
          setMessages(roomId, updatedMessages);
        }
        
        // 滾動到底部
        requestAnimationFrame(() => {
          if (popupRef.current) {
            const container = popupRef.current.querySelector('.messages-container');
            if (container) {
              container.scrollTop = container.scrollHeight;
            }
          }
        });
        
        return; // 新房間的訊息處理完成，直接返回
      }

      // 創建臨時訊息對象（樂觀更新）
      const tempMessage = {
        id: `temp_${Date.now()}`,
        room_id: roomId,
        sender_id: userId,
        content: content,
        type: 'text' as const,
        created_at: Math.floor(Date.now() / 1000),
        read_by: [userId],
      };
      
      addMessage(roomId, tempMessage);
      
      // 立即滾動到底部
      requestAnimationFrame(() => {
        if (popupRef.current) {
          const container = popupRef.current.querySelector('.messages-container');
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }
      });

      // 發送訊息到後端
      const response = await chatApi.sendMessage({
        room_id: roomId,
        sender_id: userId,
        content,
        type: 'text',
      });

      {
        const { messageHistory, setMessages } = useChatStore.getState();
        const messages = messageHistory[roomId] || [];
        const withoutTemp = messages.filter(msg => msg.id !== tempMessage.id);
        const realMessageExists = withoutTemp.some(msg => msg.id === response.id);
        const updatedMessages = realMessageExists ? withoutTemp : [...withoutTemp, response];
        setMessages(roomId, updatedMessages);
      }
    } catch (error) {
      console.warn('[ChatPopup] sendMessage error:', error);
      console.error('發送訊息失敗:', error);
      alert('發送訊息失敗，請稍後再試');
    }
  }, [currentRoom, userId, addRoom, addMessage, room.id]);

  const displayName = getRoomDisplayName();
  const avatarName = getAvatarName();

  return (
    <div
      ref={popupRef}
      style={{
        position: 'fixed',
        bottom: 0,
        right: `${20 + index * 340}px`,
        width: 328,
        height: isMinimized ? 48 : 455,
        borderRadius: '12px 12px 0 0',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.35)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 'var(--z-popup)' as React.CSSProperties['zIndex'],
        transition: 'height 0.2s ease',
        overflow: 'hidden',
        background: 'var(--color-main-bg-2)',
        border: '1px solid var(--color-main-border)',
        borderBottom: 'none',
      }}
    >
      {/* Header */}
      <div
        onClick={() => isMinimized && minimizeChatPopup(room.id, false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-indigo) 100%)',
          color: 'white',
          minHeight: 48,
          borderRadius: '12px 12px 0 0',
          cursor: isMinimized ? 'pointer' : 'default',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, color: 'white', flexShrink: 0,
          }}>
            {getInitials(avatarName)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</span>
            <span style={{ fontSize: 11, opacity: 0.85 }}>
              {currentRoom.type === 'direct' ? '在線' : `${currentRoom.members?.length || 0} 位成員`}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); minimizeChatPopup(room.id, !isMinimized); }}
            title={isMinimized ? '展開' : '最小化'}
            aria-label={isMinimized ? '展開' : '最小化'}
            style={{
              width: 28, height: 28, border: 'none',
              background: 'rgba(255,255,255,0.15)', color: 'white',
              borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
            }}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); closeChatPopup(room.id); }}
            title="關閉"
            aria-label="關閉對話視窗"
            style={{
              width: 28, height: 28, border: 'none',
              background: 'rgba(255,255,255,0.15)', color: 'white',
              borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body - 只在非最小化時顯示 */}
      {!isMinimized && (
        <>
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative', background: 'var(--color-main-bg-2)', display: 'flex', flexDirection: 'column' }}>
            {connectionError ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-main-text)', marginBottom: 8 }}>無法連接伺服器</div>
                <div style={{ fontSize: 13, color: 'var(--color-main-text-dim)', marginBottom: 16 }}>服務暫時無法使用，請稍後再試</div>
                <button
                  type="button"
                  onClick={() => {
                    setConnectionError(false);
                    setTimeout(() => {
                      if (actualRoomIdRef.current.startsWith('temp_')) {
                        setConnectionError(true);
                      }
                    }, 5000);
                  }}
                  style={{
                    padding: '8px 20px',
                    background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-indigo) 100%)',
                    color: 'white', border: 'none', borderRadius: 6,
                    fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  重試
                </button>
              </div>
            ) : (
              <MessageList roomId={roomIdForMessages} />
            )}
          </div>
          <div style={{ borderTop: '1px solid var(--color-main-border)', background: 'var(--color-main-bg-2)' }}>
            <MessageInput onSend={handleSendMessage} disabled={connectionError} />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatPopup;

