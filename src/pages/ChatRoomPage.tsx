import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import ChatRoom from '../components/chat/ChatRoom';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { chatApi } from '../api/chat';
import type { Room } from '../types';
import './ChatRoomPage.css';

const ChatRoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const { rooms, setCurrentRoom, currentRoom, setRooms } = useChatStore();

  // 使用 useMemo 同步計算需要的聊天室
  const targetRoom = useMemo(() => {
    if (!roomId) return null;

    // 優先從 router state 獲取
    const state = location.state as { tempRoom?: Room } | null;
    if (state?.tempRoom && state.tempRoom.id === roomId) {
      return state.tempRoom;
    }

    // 檢查 currentRoom 是否匹配
    if (currentRoom && currentRoom.id === roomId) {
      return currentRoom;
    }

    // 從 rooms 列表中找
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      return room;
    }

    // 臨時聊天室：立即創建
    if (roomId.startsWith('temp_')) {
      const contactId = roomId.replace('temp_', '');
      return {
        id: roomId,
        name: '', // 名稱會由 getRoomDisplayName 計算
        type: 'direct' as const,
        owner_id: userId,
        members: [
          { user_id: userId, role: 'admin' as const },
          { user_id: contactId, role: 'member' as const },
        ],
        created_at: Math.floor(Date.now() / 1000),
        isTemporary: true,
        targetContactId: contactId,
      };
    }

    return null;
  }, [roomId, currentRoom, rooms, userId, location.state]);

  // 更新 currentRoom（如果需要）
  useEffect(() => {
    if (targetRoom && (!currentRoom || currentRoom.id !== targetRoom.id)) {
      setCurrentRoom(targetRoom);
    } else if (!targetRoom && currentRoom) {
      // 找不到目標聊天室，清除 currentRoom
      setCurrentRoom(null);
    }
  }, [targetRoom, currentRoom, setCurrentRoom]);

  // 處理未讀訊息
  useEffect(() => {
    if (!roomId || !targetRoom || !userId) return;
    
    if (targetRoom.unread_count && targetRoom.unread_count > 0) {
      setTimeout(() => {
        setRooms((prevRooms) => 
          prevRooms.map(r => r.id === roomId ? { ...r, unread_count: 0 } : r)
        );
        chatApi.markAsRead(roomId, userId).catch(console.error);
      }, 2000);
    }
  }, [roomId, targetRoom, setRooms, userId]);

  // 清除 router state
  useEffect(() => {
    if (location.state) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  if (!roomId) {
    navigate('/messages');
    return null;
  }

  // 找不到聊天室
  if (!targetRoom) {
    if (rooms.length > 0) {
      navigate('/messages');
    }
    return null;
  }

  return (
    <div className="chatroom-page">
      <div className="chatroom-container">
        <ChatRoom />
      </div>
    </div>
  );
};

export default ChatRoomPage;

