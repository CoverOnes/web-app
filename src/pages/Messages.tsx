import { useState } from 'react';
import ChatList from '../components/chat/ChatList';
import CreateModal from '../components/chat/CreateModal';
import ChatRoom from '../components/chat/ChatRoom';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { chatApi } from '../api/chat';
import { Icon } from '../components/ui/Icon';
import { getDisplayName } from '../utils/formatters';
import type { Member } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

const Messages = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupCreateError, setGroupCreateError] = useState<string | null>(null);
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const { rooms, currentRoom, setCurrentRoom, addRoom, openChatPopup, setRooms } = useChatStore();

  // On desktop: clicking a room opens popup (existing behavior)
  // On mobile (<768px): clicking a room sets it as currentRoom → full-screen view
  const isMobile = useIsMobile();

  const handleRoomSelect = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    if (isMobile) {
      // Mobile: full-screen chat view
      setCurrentRoom({ ...room, unread_count: 0 });
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, unread_count: 0 } : r));
    } else {
      // Desktop: open popup
      openChatPopup(room);
    }
  };

  const handleCreateDM = async (userId: string) => {
    // Find existing DM room or create a temporary one
    const existingRoom = rooms.find(r => {
      if (r.type !== 'direct') return false;
      return r.members?.some(m => m.user_id === userId) && r.members?.some(m => m.user_id === userId);
    });

    if (existingRoom) {
      if (isMobile) {
        setCurrentRoom(existingRoom);
      } else {
        openChatPopup(existingRoom);
      }
      return;
    }

    // Create new DM room
    try {
      const members: Member[] = [
        { user_id: userId, role: 'admin' },
        { user_id: userId, role: 'member' },
      ];
      const response = await chatApi.createRoom({
        name: `${userId}_${userId}`,
        type: 'direct',
        owner_id: userId,
        members,
      });
      if (response.success && response.data) {
        addRoom(response.data);
        if (isMobile) {
          setCurrentRoom(response.data);
        } else {
          openChatPopup(response.data);
        }
      }
    } catch {
      // Create temporary room for immediate chat
      const tempRoom = {
        id: `temp_${userId}`,
        name: '',
        type: 'direct' as const,
        owner_id: userId,
        members: [
          { user_id: userId, role: 'admin' as const },
          { user_id: userId, role: 'member' as const },
        ],
        created_at: Math.floor(Date.now() / 1000),
        isTemporary: true,
        targetContactId: userId,
      };
      if (isMobile) {
        setCurrentRoom(tempRoom);
      } else {
        openChatPopup(tempRoom);
      }
    }
  };

  const handleCreateGroup = async (name: string, userIds: string[]) => {
    setGroupCreateError(null);
    try {
      const members: Member[] = [
        { user_id: userId, role: 'admin' },
        ...userIds.map(id => ({ user_id: id, role: 'member' as const })),
      ];
      const response = await chatApi.createRoom({
        name,
        type: 'group',
        owner_id: userId,
        members,
      });
      if (response.success && response.data) {
        addRoom(response.data);
        if (isMobile) {
          setCurrentRoom(response.data);
        } else {
          openChatPopup(response.data);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create group';
      setGroupCreateError(msg);
    }
  };

  // Mobile full-screen chat view
  const mobileChatOpen = isMobile && currentRoom !== null;

  // Back handler for mobile
  const handleMobileBack = () => {
    setCurrentRoom(null);
  };

  if (mobileChatOpen && currentRoom) {
    // Derive room display name
    let roomTitle = currentRoom.name;
    if (currentRoom.type === 'direct' && currentRoom.members?.length > 0) {
      const other = currentRoom.members.find(m => m.user_id !== userId);
      if (other) roomTitle = getDisplayName(other.user_id);
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--co-bg)' }}>
        {/* Mobile chat header with back button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderBottom: '1px solid var(--co-line)',
          background: 'var(--co-bg-card-2)',
          flexShrink: 0,
          minHeight: 52,
        }}>
          <button
            type="button"
            onClick={handleMobileBack}
            aria-label="返回聊天室列表"
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--co-text)',
              borderRadius: 8,
              flexShrink: 0,
            }}
          >
            <Icon.ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--co-text)',
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {roomTitle}
            </div>
          </div>
        </div>
        {/* Full-screen chat area */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <ChatRoom />
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
        {/* Chat list panel */}
        <div style={{
          width: 400,
          maxWidth: '100%',
          height: '100%',
          borderRight: '1px solid var(--co-line)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--co-line)',
            flexShrink: 0,
          }}>
            <h1 style={{
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--co-text)',
              margin: 0,
            }}>
              聊天室
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              {groupCreateError && (
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-red, #ef4444)' }}>
                  {groupCreateError}
                </p>
              )}
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              aria-label="建立新對話"
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'var(--color-accent)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                transition: 'background 150ms ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-accent-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-accent)';
              }}
            >
              <Icon.Plus size={18} />
            </button>
            </div>
          </div>

          <ChatList onCreateRoom={() => setShowCreateModal(true)} onSelectRoom={handleRoomSelect} />
        </div>

        {/* Desktop empty state / info panel */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--co-bg)',
        }}>
          <div style={{
            textAlign: 'center',
            padding: 40,
            maxWidth: 400,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              <Icon.MessageSquare size={48} style={{ color: 'var(--co-text-dim)', margin: '0 auto' }} />
            </div>
            <h2 style={{
              fontSize: 20,
              fontWeight: 600,
              color: 'var(--co-text)',
              margin: '0 0 8px 0',
            }}>
              聊天室列表
            </h2>
            <p style={{
              fontSize: 14,
              color: 'var(--co-text-dim)',
              margin: '0 0 24px 0',
              lineHeight: 1.5,
            }}>
              點擊左側對話即可在右下角開啟聊天視窗。<br />
              可同時開啟多個對話！
            </p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '10px 24px',
                background: 'var(--color-accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 150ms ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-accent-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-accent)';
              }}
            >
              開始新對話
            </button>
          </div>
        </div>
      </div>

      <CreateModal
        open={showCreateModal}
        onClose={() => { setShowCreateModal(false); setGroupCreateError(null); }}
        onCreateDM={handleCreateDM}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
};

export default Messages;
