import { useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { getInitials, getAvatarColor } from '../../utils/formatters';
import type { Room } from '../../types';

const users = [
  { id: 'user_alice', name: 'Alice', online: true },
  { id: 'user_bob', name: 'Bob', online: true },
  { id: 'user_charlie', name: 'Charlie', online: false },
  { id: 'user_david', name: 'David', online: false },
  { id: 'user_emma', name: 'Emma', online: true },
  { id: 'user_frank', name: 'Frank', online: true },
  { id: 'user_grace', name: 'Grace', online: false },
];

const ContactList = () => {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const { roomsLoaded, openChatPopup } = useChatStore();
  const [loading, setLoading] = useState<string | null>(null);

  // 尋找已存在的聊天室
  const findExistingRoom = (contactId: string, roomsList: Room[]): Room | undefined => {
    return roomsList.find(room => {
      if (room.type !== 'direct') return false;
      
      // 方法1: 通過 members 匹配
      if (room.members && room.members.length > 0) {
        const hasContact = room.members.some(m => m.user_id === contactId);
        const hasCurrentUser = room.members.some(m => m.user_id === userId);
        if (hasContact && hasCurrentUser) return true;
      }
      
      // 方法2: 通過 room.name 匹配（格式：user_alice_user_charlie）
      if (room.name) {
        const nameIncludesContact = room.name.includes(contactId);
        const nameIncludesCurrentUser = room.name.includes(userId);
        if (nameIncludesContact && nameIncludesCurrentUser) return true;
      }
      
      return false;
    });
  };

  const handleStartChat = async (contactId: string) => {
    if (contactId === userId || loading) return;
    
    // 如果 rooms 已經載入完成，直接檢查
    if (roomsLoaded) {
      const { rooms } = useChatStore.getState();
      const existingRoom = findExistingRoom(contactId, rooms);

      if (existingRoom) {
        const roomWithMembers: Room = {
          ...existingRoom,
          members: existingRoom.members || [
            { user_id: userId, role: 'admin' },
            { user_id: contactId, role: 'member' },
          ],
        };
        openChatPopup(roomWithMembers);
        return;
      }

      // rooms 已載入但找不到聊天室，創建臨時聊天室
      const tempRoom: Room = {
        id: `temp_${contactId}`,
        name: '',
        type: 'direct',
        owner_id: userId,
        members: [
          { user_id: userId, role: 'admin' },
          { user_id: contactId, role: 'member' },
        ],
        created_at: Math.floor(Date.now() / 1000),
        isTemporary: true,
        targetContactId: contactId,
      };
      openChatPopup(tempRoom);
      return;
    }

    // rooms 還沒載入完成，等待最多 5 秒
    setLoading(contactId);
    
    const startTime = Date.now();
    const maxWaitTime = 5000; // 5 秒

    const checkAndOpen = () => {
      const { rooms: latestRooms, roomsLoaded: loaded } = useChatStore.getState();
      
      // 如果已載入，檢查聊天室
      if (loaded) {
        setLoading(null);
        
        const existingRoom = findExistingRoom(contactId, latestRooms);

        if (existingRoom) {
          const roomWithMembers: Room = {
            ...existingRoom,
            members: existingRoom.members || [
              { user_id: userId, role: 'admin' },
              { user_id: contactId, role: 'member' },
            ],
          };
          openChatPopup(roomWithMembers);
        } else {
          // 找不到，創建臨時聊天室
          const tempRoom: Room = {
            id: `temp_${contactId}`,
            name: '',
            type: 'direct',
            owner_id: userId,
            members: [
              { user_id: userId, role: 'admin' },
              { user_id: contactId, role: 'member' },
            ],
            created_at: Math.floor(Date.now() / 1000),
            isTemporary: true,
            targetContactId: contactId,
          };
          openChatPopup(tempRoom);
        }
        return;
      }

      // 檢查是否超時
      if (Date.now() - startTime >= maxWaitTime) {
        setLoading(null);
        // 超時，打開臨時聊天室並標記為連線超時
        const tempRoom: Room = {
          id: `temp_${contactId}`,
          name: '',
          type: 'direct',
          owner_id: userId,
          members: [
            { user_id: userId, role: 'admin' },
            { user_id: contactId, role: 'member' },
          ],
          created_at: Math.floor(Date.now() / 1000),
          isTemporary: true,
          targetContactId: contactId,
          connectionTimeout: true, // 標記為連線超時
        };
        openChatPopup(tempRoom);
        return;
      }

      // 繼續等待
      setTimeout(checkAndOpen, 100);
    };

    checkAndOpen();
  };

  const availableContacts = users.filter(u => u.id !== userId);

  return (
    <div style={{ marginBottom: 8 }}>
      <h4 style={{ margin: 0, padding: '12px 20px 8px', fontSize: 12, fontWeight: 600, color: 'var(--color-main-text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>聯絡人</h4>
      <div>
        {availableContacts.map(contact => {
          const avatarColor = getAvatarColor(contact.id);
          const isLoading = loading === contact.id;
          return (
            <div
              key={contact.id}
              onClick={() => handleStartChat(contact.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 16px',
                cursor: 'pointer',
                opacity: isLoading ? 0.6 : 1,
                pointerEvents: isLoading ? 'none' : 'auto',
                transition: 'background 150ms ease',
                background: 'transparent',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-main-border)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: avatarColor,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: 20,
                  marginRight: 12,
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                {getInitials(contact.name)}
                {contact.online && (
                  <span style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    width: 12,
                    height: 12,
                    background: 'var(--color-green)',
                    border: '2px solid var(--color-main-bg)',
                    borderRadius: '50%',
                  }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 15, color: 'var(--color-main-text)', marginBottom: 2 }}>{contact.name}</div>
                <div style={{ fontSize: 13, color: 'var(--color-main-text-dim)' }}>
                  {isLoading ? '連線中...' : (contact.online ? '在線上' : '離線')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContactList;
