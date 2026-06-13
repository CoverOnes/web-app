import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { getInitials, getDisplayName } from '../../utils/formatters';

interface MembersPanelProps {
  onClose: () => void;
}

const MembersPanel = ({ onClose }: MembersPanelProps) => {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const { currentRoom } = useChatStore();

  if (!currentRoom || currentRoom.type !== 'group') return null;

  return (
    <div style={{ width: 280, background: 'var(--color-main-bg-2)', borderLeft: '1px solid var(--color-main-border)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-main-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--color-main-text)' }}>群組成員</h4>
        <button
          type="button"
          onClick={onClose}
          aria-label="關閉成員面板"
          style={{
            background: 'var(--color-sb-hover)', border: 'none', width: 32, height: 32,
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 18, color: 'var(--color-main-text-dim)', transition: 'background 150ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-sb-active)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-sb-hover)'; }}
        >
          ✕
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {currentRoom.members?.map(member => {
          const isCurrentUser = member.user_id === userId;
          const displayName = getDisplayName(member.user_id);

          return (
            <div key={member.user_id} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: 8, marginBottom: 4 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 600, fontSize: 16, marginRight: 12, flexShrink: 0,
              }}>
                {getInitials(displayName)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-main-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {displayName}
                  {isCurrentUser && <span style={{ fontSize: 12, color: 'var(--color-main-text-dim)', fontWeight: 400 }}>你</span>}
                </div>
                {member.role === 'admin' && (
                  <div style={{ fontSize: 13, color: 'var(--color-accent)', marginTop: 2 }}>管理員</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MembersPanel;

