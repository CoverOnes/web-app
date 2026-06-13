import { useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { chatApi } from '../../api/chat';
import { validateRoomName } from '../../utils/validation';
import type { Member } from '../../types';

interface CreateRoomModalProps {
  onClose: () => void;
}

const users = [
  { id: 'user_alice', name: 'Alice' },
  { id: 'user_bob', name: 'Bob' },
  { id: 'user_charlie', name: 'Charlie' },
  { id: 'user_david', name: 'David' },
  { id: 'user_emma', name: 'Emma' },
  { id: 'user_frank', name: 'Frank' },
  { id: 'user_grace', name: 'Grace' },
];

const CreateRoomModal = ({ onClose }: CreateRoomModalProps) => {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const { addRoom, openChatPopup } = useChatStore();
  const [roomName, setRoomName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const availableUsers = users.filter(u => u.id !== userId);

  const toggleMember = (userId: string) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const handleCreate = async () => {
    setError('');
    
    if (!roomName.trim()) {
      setError('請輸入群組名稱');
      return;
    }

    if (selectedMembers.length === 0) {
      setError('請至少選擇一個成員');
      return;
    }

    try {
      validateRoomName(roomName);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
      return;
    }

    setLoading(true);
    try {
      const members: Member[] = [
        { user_id: userId, role: 'admin' },
        ...selectedMembers.map(id => ({ user_id: id, role: 'member' as const })),
      ];

      const response = await chatApi.createRoom({
        name: roomName,
        type: 'group',
        owner_id: userId,
        members,
      });

      if (response.success && response.data) {
        // 添加新聊天室並打開彈跳視窗
        addRoom(response.data);
        openChatPopup(response.data);
        onClose();
      }
    } catch (error) {
      console.error('創建群組失敗:', error);
      setError('創建群組失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const btnBase: React.CSSProperties = {
    padding: '10px 24px', border: 'none', borderRadius: 8,
    cursor: 'pointer', fontWeight: 600, fontSize: 15, transition: 'all 150ms',
  };

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 'var(--z-modal)' as React.CSSProperties['zIndex'], animation: 'fadeIn 200ms ease',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-room-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-main-bg-2)', borderRadius: 12,
          width: '90%', maxWidth: 500, maxHeight: '80vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-modal)', border: '1px solid var(--color-main-border)',
          color: 'var(--color-main-text)',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-main-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 id="create-room-modal-title" style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--color-main-text)' }}>創建群組</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            style={{ background: 'var(--color-sb-hover)', border: 'none', fontSize: 24, color: 'var(--color-main-text-dim)', cursor: 'pointer', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >×</button>
        </div>

        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
          {error && <div style={{ background: 'var(--color-error-100)', color: 'var(--color-error-500)', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

          <div style={{ marginBottom: 20 }}>
            <label htmlFor="room-name-input" style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 15, color: 'var(--color-main-text)' }}>群組名稱</label>
            <input
              id="room-name-input"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="輸入群組名稱"
              maxLength={100}
              style={{
                width: '100%', padding: '12px 16px',
                border: '1px solid var(--color-main-border)', borderRadius: 8,
                fontSize: 15, background: 'var(--color-input-bg)', color: 'var(--color-main-text)',
                transition: 'border-color 150ms', outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-main-border)'; }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 15, color: 'var(--color-main-text)' }}>選擇成員（{selectedMembers.length} 已選）</label>
            <div style={{ border: '1px solid var(--color-main-border)', borderRadius: 8, maxHeight: 240, overflowY: 'auto', background: 'var(--color-main-bg)' }}>
              {availableUsers.map(user => {
                const isSelected = selectedMembers.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleMember(user.id)}
                    style={{
                      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
                      cursor: 'pointer', borderBottom: '1px solid var(--color-main-border)',
                      background: isSelected ? 'var(--color-accent-soft)' : 'transparent',
                      transition: 'background 120ms',
                    }}
                  >
                    <input type="checkbox" checked={isSelected} readOnly style={{ cursor: 'pointer', width: 18, height: 18, accentColor: 'var(--color-accent)' }} />
                    <span style={{ fontSize: 15, color: 'var(--color-main-text)', fontWeight: 500 }}>{user.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-main-border)', display: 'flex', gap: 12, justifyContent: 'flex-end', background: 'var(--color-main-bg)' }}>
          <button type="button" onClick={onClose} style={{ ...btnBase, background: 'var(--color-sb-tint)', color: 'var(--color-main-text)' }}>取消</button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            style={{ ...btnBase, background: 'var(--color-accent)', color: '#fff', opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? '創建中...' : '創建群組'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomModal;

