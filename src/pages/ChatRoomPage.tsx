import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import ChatRoom from '../components/chat/ChatRoom';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { chatApi } from '../api/chat';
import type { Room } from '../types';
import './ChatRoomPage.css';

// Shown on cold deep-link while the layout is still loading rooms.
const RoomsLoadingScreen = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: 'var(--color-main-text-dim)',
      fontSize: 14,
    }}
  >
    載入中...
  </div>
);

const ChatRoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const { rooms, roomsLoaded, setCurrentRoom, currentRoom, setRooms } = useChatStore();

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

  // Major finding fix: navigate calls moved OUT of render body into useEffect.
  // !roomId guard: should be unreachable under normal routing but kept as safety net.
  useEffect(() => {
    if (!roomId) {
      navigate('/chat', { replace: true });
    }
  }, [roomId, navigate]);

  // Finding 1 + 4: redirect when rooms are loaded and the target room is not found.
  useEffect(() => {
    if (roomId && roomsLoaded && !targetRoom) {
      navigate('/chat', { replace: true });
    }
  }, [roomId, roomsLoaded, targetRoom, navigate]);

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

  // 清除 router state（使用 react-router navigate 而非 window.history 直接操作）
  useEffect(() => {
    if (location.state) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  // Finding 4: roomsLoaded guard MUST fire before targetRoom check so a cold
  // deep-link waits for rooms to arrive before deciding to redirect.
  if (!roomId || !roomsLoaded) {
    return <RoomsLoadingScreen />;
  }

  // Still loading the specific room (targetRoom not resolved yet)
  if (!targetRoom) {
    return <RoomsLoadingScreen />;
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
