import React, { useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { chatApi } from '../../api/chat';
import { getDisplayName } from '../../utils/formatters';

interface RoomSettingsModalProps {
  onClose: () => void;
}

const RoomSettingsModal = ({ onClose }: RoomSettingsModalProps) => {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const { currentRoom, setCurrentRoom, setRooms } = useChatStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!currentRoom || currentRoom.type !== 'group') return null;

  // 移除成員
  const handleRemoveMember = async (userId: string) => {
    if (!confirm('確定要移除此成員嗎？')) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await chatApi.removeMember(currentRoom.id, userId);
      setSuccess('成員移除成功');

      // 樂觀更新：直接從 currentRoom 移除成員
      if (currentRoom.members) {
        const updatedRoom = {
          ...currentRoom,
          members: currentRoom.members.filter(m => m.user_id !== userId)
        };
        setCurrentRoom(updatedRoom);
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('移除成員失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 退出群組
  const handleLeaveRoom = async () => {
    if (!confirm('確定要退出群組嗎？')) return;

    setLoading(true);
    setError('');

    try {
      await chatApi.removeMember(currentRoom.id, userId);
      // 清除當前聊天室
      setCurrentRoom(null);

      // 樂觀更新：直接從 rooms 移除這個聊天室
      setRooms((prevRooms) => prevRooms.filter(r => r.id !== currentRoom.id));

      onClose();
    } catch {
      setError('退出群組失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const btnBase: React.CSSProperties = {
    padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
    fontSize: 14, fontWeight: 500, transition: 'all 150ms',
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
        aria-labelledby="settings-modal-title"
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
          <h3 id="settings-modal-title" style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--color-main-text)' }}>群組設置</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            style={{ background: 'var(--color-sb-hover)', border: 'none', fontSize: 24, color: 'var(--color-main-text-dim)', cursor: 'pointer', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >×</button>
        </div>

        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
          {error && <div style={{ background: 'var(--color-error-100)', color: 'var(--color-error-500)', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}
          {success && <div style={{ background: 'var(--color-success-100)', color: 'var(--color-green)', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{success}</div>}

          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-main-text)', marginBottom: 12 }}>群組成員 ({currentRoom.members?.length || 0})</h4>
            <div style={{ border: '1px solid var(--color-main-border)', borderRadius: 8, maxHeight: 300, overflowY: 'auto', background: 'var(--color-main-bg)' }}>
              {currentRoom.members?.map(member => {
                const isCurrentUser = member.user_id === userId;

                return (
                  <div key={member.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--color-main-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-main-text)' }}>{getDisplayName(member.user_id)}</span>
                      {member.role === 'admin' && <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, fontWeight: 600, background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>管理員</span>}
                      {isCurrentUser && <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: 'var(--color-sb-tint)', color: 'var(--color-main-text-dim)' }}>我</span>}
                    </div>
                    {!isCurrentUser && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.user_id)}
                        disabled={loading}
                        style={{ ...btnBase, background: 'transparent', color: 'var(--color-red)', border: '1px solid var(--color-red)', opacity: loading ? 0.5 : 1 }}
                      >
                        移除
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-main-text)', marginBottom: 12 }}>添加成員</h4>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-main-text-dim)' }}>
              聯絡人功能即將推出，屆時可在此新增群組成員。
            </p>
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-main-border)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleLeaveRoom}
            disabled={loading}
            style={{ ...btnBase, background: 'var(--color-red)', color: 'white', border: 'none', opacity: loading ? 0.5 : 1 }}
          >
            退出群組
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ ...btnBase, background: 'var(--color-sb-tint)', color: 'var(--color-main-text)', border: '1px solid var(--color-main-border)' }}
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomSettingsModal;

