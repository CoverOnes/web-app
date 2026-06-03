import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import { getDisplayName, getInitials, formatMessagePreview, formatMessageTime } from '../utils/formatters';
import type { Room } from '../types';
import { NextTaskCard } from '../components/dashboard/NextTaskCard';

// Deterministic gradient colors for avatars
const GRADIENT_PALETTE: [string, string][] = [
  ['#2563EB', '#6366F1'],
  ['#059669', '#0D9488'],
  ['#D97706', '#DC2626'],
  ['#7C3AED', '#DB2777'],
  ['#0891B2', '#0D9488'],
  ['#B45309', '#92400E'],
  ['#065F46', '#0F766E'],
];

// Static online users list (TODO: replace with real presence API)
const ONLINE_USER_IDS = ['user_alice', 'user_bob', 'user_charlie', 'user_david', 'user_emma', 'user_frank', 'user_grace'];

function getRoomGradient(id: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENT_PALETTE[Math.abs(hash) % GRADIENT_PALETTE.length];
}

function getPersonColor(userId: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENT_PALETTE[Math.abs(hash) % GRADIENT_PALETTE.length];
}

function getRoomDisplayName(room: Room, currentUser: string): string {
  if (room.type === 'group') return room.name;
  if (room.type === 'direct' && room.members) {
    const other = room.members.find(m => m.user_id !== currentUser);
    if (other) return getDisplayName(other.user_id);
  }
  return room.name;
}

const PANEL_STYLE: React.CSSProperties = {
  background: 'var(--co-bg-card-2)',
  border: '1px solid var(--co-line)',
  borderRadius: 12,
  padding: 16,
};

const STAT_CELL_STYLE: React.CSSProperties = {
  background: 'rgba(15,23,42,0.6)',
  border: '1px solid rgba(148,163,184,0.1)',
  borderRadius: 10,
  padding: 12,
};

const Home = () => {
  const navigate = useNavigate();
  const { rooms, currentUser, openChatPopup, roomsLoaded } = useChatStore();

  const { recentRooms, totalUnread, todayMsgs, mostActive, latestRoom, feedRooms, activityRoom } = useMemo(() => {
    const sorted = [...rooms].sort((a, b) => {
      const tA = a.last_message_time || a.created_at;
      const tB = b.last_message_time || b.created_at;
      return tB - tA;
    });
    const feed = sorted.filter(r => r.last_message).slice(0, 2);
    const activity = sorted.find(r => (r.unread_count || 0) > 0) || sorted[0];
    return {
      recentRooms: sorted.slice(0, 5),
      totalUnread: rooms.reduce((sum, r) => sum + (r.unread_count || 0), 0),
      todayMsgs: rooms.filter(r => {
        if (!r.last_message_time) return false;
        const d = new Date(r.last_message_time * 1000);
        return d.toDateString() === new Date().toDateString();
      }).length,
      mostActive: sorted.find(r => r.last_message),
      latestRoom: sorted[0],
      feedRooms: feed,
      activityRoom: activity,
    };
  }, [rooms]);

  const onlineContactIds = useMemo(
    () => ONLINE_USER_IDS.filter(id => id !== currentUser),
    [currentUser]
  );

  const handleViewRoom = (room: Room) => {
    openChatPopup(room);
  };

  const handleContactClick = (userId: string) => {
    if (!roomsLoaded) return;
    const existingRoom = rooms.find(r => {
      if (r.type !== 'direct') return false;
      if (r.members?.some(m => m.user_id === userId) && r.members?.some(m => m.user_id === currentUser)) return true;
      if (r.name?.includes(userId) && r.name?.includes(currentUser)) return true;
      return false;
    });
    if (existingRoom) {
      openChatPopup({ ...existingRoom, members: existingRoom.members || [{ user_id: currentUser, role: 'admin' }, { user_id: userId, role: 'member' }] });
      return;
    }
    const tempRoom: Room = {
      id: `temp_${userId}`,
      name: '',
      type: 'direct',
      owner_id: currentUser,
      members: [{ user_id: currentUser, role: 'admin' }, { user_id: userId, role: 'member' }],
      created_at: Math.floor(Date.now() / 1000),
      isTemporary: true,
      targetContactId: userId,
    };
    openChatPopup(tempRoom);
  };

  const displayName = getDisplayName(currentUser) || currentUser;

  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      overflowY: 'auto',
      background: 'var(--co-bg)',
      color: 'var(--co-text)',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gap: 20,
        padding: '24px 28px 48px 28px',
        maxWidth: 1200,
        margin: '0 auto',
        alignItems: 'start',
      }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Welcome banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.18) 0%, rgba(99,102,241,0.12) 50%, rgba(139,92,246,0.18) 100%)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 16,
            padding: '22px 26px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              right: -40,
              top: -40,
              width: 240,
              height: 240,
              background: 'radial-gradient(circle, rgba(139,92,246,0.35), transparent 70%)',
              pointerEvents: 'none',
            }} />
            <h1 style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 6px 0',
              position: 'relative',
            }}>
              歡迎回來，{' '}
              <span style={{
                background: 'linear-gradient(135deg, #A78BFA, #67E8F9)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {displayName}
              </span>
              ！今天有{' '}
              <span style={{ color: 'var(--color-cyan)', fontWeight: 800 }}>
                {totalUnread}
              </span>
              {' '}則未讀訊息
            </h1>
            <p style={{
              fontSize: 13.5,
              color: 'var(--co-text-dim)',
              margin: 0,
              position: 'relative',
            }}>
              共 <strong style={{ color: 'var(--co-text)' }}>{rooms.length}</strong> 個對話室，
              繼續與你的聯絡人保持連線
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', position: 'relative' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 999,
                background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.18)',
                fontSize: 12, backdropFilter: 'blur(8px)',
              }}>
                未讀{' '}
                <span style={{ fontWeight: 700, color: 'var(--color-cyan)' }}>{totalUnread}</span>
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 999,
                background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.18)',
                fontSize: 12, backdropFilter: 'blur(8px)',
              }}>
                今日{' '}
                <span style={{ fontWeight: 700, color: 'var(--color-cyan)' }}>{todayMsgs}</span>
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 999,
                background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.18)',
                fontSize: 12, backdropFilter: 'blur(8px)',
              }}>
                聊天室{' '}
                <span style={{ fontWeight: 700, color: 'var(--color-cyan)' }}>{rooms.length}</span>
              </span>
            </div>
          </div>

          {/* Quick action row */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => navigate('/messages')}
              aria-label="開始新對話"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-[12px]"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px 18px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(99,102,241,0.1))',
                border: '1px solid rgba(99,102,241,0.3)',
                cursor: 'pointer',
                color: 'inherit',
                textAlign: 'left',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'linear-gradient(135deg, var(--color-accent), var(--color-indigo))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, color: '#fff', flexShrink: 0,
              }}>
                +
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--co-text)', marginBottom: 3 }}>
                  開始新對話
                </div>
                <div style={{ fontSize: 12, color: 'var(--co-text-dim)' }}>
                  開始新的聊天
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/messages')}
              aria-label="新增群組"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-[12px]"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px 18px',
                borderRadius: 12,
                background: 'var(--co-bg-card-2)',
                border: '1px solid var(--co-line)',
                cursor: 'pointer',
                color: 'inherit',
                textAlign: 'left',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'linear-gradient(135deg, #059669, #0D9488)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: '#fff', flexShrink: 0,
              }}>
                #
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--co-text)', marginBottom: 3 }}>
                  新增群組
                </div>
                <div style={{ fontSize: 12, color: 'var(--co-text-dim)' }}>
                  建立群組對話
                </div>
              </div>
            </button>
          </div>

          {/* Hero carousel: 3 stat cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>
                對話總覽
              </div>
              <button
                onClick={() => navigate('/messages')}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
                style={{
                  fontSize: 12, color: 'var(--co-text-dim)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}
              >
                查看全部 →
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 12 }}>
              {/* Card 1: Most active */}
              <div style={{
                borderRadius: 14, padding: 18, border: '1px solid rgba(148,163,184,0.18)',
                minHeight: 160, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                background: 'radial-gradient(400px 200px at 100% 0%, rgba(34,211,238,0.2), transparent), linear-gradient(135deg, var(--co-bg-card-2), var(--co-bg-card-2))',
                position: 'relative', overflow: 'hidden',
              }}>
                <div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px',
                    borderRadius: 999, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                    color: '#FCA5A5', fontSize: 10.5, fontWeight: 600,
                  }}>
                    最活躍對話
                  </span>
                  <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, margin: '10px 0 8px 0' }}>
                    {mostActive ? getRoomDisplayName(mostActive, currentUser) : '尚無對話'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--co-text-dim)', lineHeight: 1.5 }}>
                    {mostActive?.last_message
                      ? formatMessagePreview(mostActive.last_message)
                      : '還沒有訊息'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--co-text-dim)', flexWrap: 'wrap' }}>
                  {mostActive && (
                    <>
                      <span>類型 <strong style={{ color: 'var(--co-text)' }}>
                        {mostActive.type === 'group' ? '群組' : '私訊'}
                      </strong></span>
                      {mostActive.unread_count ? (
                        <span>未讀 <strong style={{ color: 'var(--color-cyan)' }}>{mostActive.unread_count}</strong></span>
                      ) : null}
                    </>
                  )}
                </div>
              </div>

              {/* Card 2: Latest message */}
              <div style={{
                borderRadius: 14, padding: 18, border: '1px solid rgba(148,163,184,0.18)',
                minHeight: 160, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                background: 'radial-gradient(300px 200px at 100% 100%, rgba(139,92,246,0.18), transparent), linear-gradient(135deg, var(--co-bg-card-2), var(--co-bg-card-2))',
              }}>
                <div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px',
                    borderRadius: 999, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)',
                    color: '#FCD34D', fontSize: 10.5, fontWeight: 600,
                  }}>
                    最新訊息
                  </span>
                  <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, margin: '10px 0 8px 0' }}>
                    {latestRoom ? getRoomDisplayName(latestRoom, currentUser) : '尚無對話'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--co-text-dim)' }}>
                  {latestRoom?.last_message_time && (
                    <span>{formatMessageTime(latestRoom.last_message_time)}</span>
                  )}
                </div>
              </div>

              {/* Card 3: Today activity */}
              <div style={{
                borderRadius: 14, padding: 18, border: '1px solid rgba(148,163,184,0.18)',
                minHeight: 160, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                background: 'radial-gradient(300px 200px at 0% 0%, rgba(245,158,11,0.15), transparent), linear-gradient(135deg, var(--co-bg-card-2), var(--co-bg-card-2))',
              }}>
                <div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px',
                    borderRadius: 999, background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.4)',
                    color: '#67E8F9', fontSize: 10.5, fontWeight: 600,
                  }}>
                    今日活動
                  </span>
                  <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, margin: '10px 0 8px 0' }}>
                    {todayMsgs} 個對話有新消息
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--co-text-dim)' }}>
                  <span>總計 <strong style={{ color: 'var(--co-text)' }}>{rooms.length}</strong> 個聊天室</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent chats section */}
          {recentRooms.length > 0 && (
            <div>
              <div style={{
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12,
              }}>
                <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>
                  最近對話
                </div>
                <button
                  onClick={() => navigate('/messages')}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
                  style={{ fontSize: 12, color: 'var(--co-text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  查看全部
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recentRooms.map(room => {
                  const name = getRoomDisplayName(room, currentUser);
                  const [gradFrom, gradTo] = getRoomGradient(room.id);
                  const initials = getInitials(name);
                  return (
                    <button
                      key={room.id}
                      onClick={() => handleViewRoom(room)}
                      aria-label={`開啟與 ${name} 的對話`}
                      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1 rounded-[12px]"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 14px', borderRadius: 12,
                        background: 'var(--co-bg-card-2)', border: '1px solid var(--co-line)',
                        cursor: 'pointer', textAlign: 'left', color: 'inherit',
                        transition: 'border-color 150ms', width: '100%',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.4)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--co-line)'; }}
                    >
                      <div style={{
                        width: 42, height: 42, borderRadius: 10,
                        background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13.5, fontWeight: 600, color: 'var(--co-text)',
                          marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                          {name}
                          {room.type === 'group' && (
                            <span style={{
                              fontSize: 10, padding: '1px 6px', borderRadius: 999,
                              background: 'rgba(99,102,241,0.15)', color: '#A78BFA',
                              border: '1px solid rgba(99,102,241,0.3)', fontWeight: 500,
                            }}>
                              群組
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: 12, color: 'var(--co-text-dim)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {formatMessagePreview(room.last_message) || '開始對話...'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        {room.last_message_time && (
                          <span style={{ fontSize: 11, color: 'var(--co-text-dim)' }}>
                            {formatMessageTime(room.last_message_time)}
                          </span>
                        )}
                        {(room.unread_count || 0) > 0 && (
                          <span style={{
                            fontSize: 11, fontWeight: 700, color: '#fff',
                            background: 'var(--color-accent)', padding: '1px 7px',
                            borderRadius: 999, minWidth: 20, textAlign: 'center',
                          }}>
                            {room.unread_count}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Message feed — 最新動態 */}
          {feedRooms.length > 0 && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 12 }}>
                最新動態
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {feedRooms.map(room => {
                  const name = getRoomDisplayName(room, currentUser);
                  const [gradFrom, gradTo] = getRoomGradient(room.id);
                  const initials = getInitials(name);
                  return (
                    <div
                      key={room.id}
                      style={{
                        background: 'var(--co-bg-card-2)',
                        border: '1px solid var(--co-line)',
                        borderRadius: 12,
                        padding: 16,
                      }}
                    >
                      {/* Feed header */}
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 9,
                          background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, color: '#fff', fontSize: 14, flexShrink: 0,
                        }}>
                          {initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                            {name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--co-text-dim)', marginTop: 1 }}>
                            {room.last_message_time ? formatMessageTime(room.last_message_time) : ''}
                          </div>
                        </div>
                      </div>

                      {/* Feed body */}
                      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--co-text)', margin: '12px 0' }}>
                        {formatMessagePreview(room.last_message) || '（無訊息）'}
                      </div>

                      {/* Feed actions */}
                      <div style={{
                        display: 'flex', gap: 4, paddingTop: 6,
                        borderTop: '1px solid var(--co-line)',
                      }}>
                        <button
                          onClick={() => handleViewRoom(room)}
                          aria-label={`回覆 ${name}`}
                          style={{
                            flex: 1, padding: 8, borderRadius: 8,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            fontSize: 12.5, color: 'var(--co-text-dim)',
                            background: 'none', border: 'none', cursor: 'pointer',
                            transition: 'background 150ms',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                        >
                          💬 回覆
                        </button>
                        <button
                          onClick={() => handleViewRoom(room)}
                          aria-label={`查看與 ${name} 的對話`}
                          style={{
                            flex: 1, padding: 8, borderRadius: 8,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            fontSize: 12.5, color: 'var(--co-text-dim)',
                            background: 'none', border: 'none', cursor: 'pointer',
                            transition: 'background 150ms',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                        >
                          查看對話
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Next GTD Task */}
          <NextTaskCard />

          {/* Stats panel */}
          <div style={PANEL_STYLE}>
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              對話統計
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={STAT_CELL_STYLE}>
                <div style={{ fontSize: 10.5, color: 'var(--co-text-dim)' }}>總對話室</div>
                <div style={{
                  fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: '4px 0 2px 0',
                  background: 'linear-gradient(135deg, #67E8F9, #2563EB)',
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  {rooms.length}
                </div>
              </div>
              <div style={STAT_CELL_STYLE}>
                <div style={{ fontSize: 10.5, color: 'var(--co-text-dim)' }}>未讀訊息</div>
                <div style={{
                  fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: '4px 0 2px 0',
                  background: 'linear-gradient(135deg, #A78BFA, #EC4899)',
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  {totalUnread}
                </div>
              </div>
              <div style={STAT_CELL_STYLE}>
                <div style={{ fontSize: 10.5, color: 'var(--co-text-dim)' }}>今日活躍</div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: '4px 0 2px 0', color: '#10B981' }}>
                  {todayMsgs}
                </div>
              </div>
              <div style={STAT_CELL_STYLE}>
                <div style={{ fontSize: 10.5, color: 'var(--co-text-dim)' }}>在線聯絡人</div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: '4px 0 2px 0', color: '#F59E0B' }}>
                  {onlineContactIds.length}
                </div>
              </div>
            </div>
          </div>

          {/* Online contacts panel */}
          <div style={PANEL_STYLE}>
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              在線聯絡人
              <span style={{
                fontSize: 11, fontWeight: 600, color: '#fff',
                background: 'var(--color-accent)', padding: '1px 7px',
                borderRadius: 999, minWidth: 20, textAlign: 'center',
              }}>
                {onlineContactIds.length}
              </span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {onlineContactIds.map(userId => {
                const name = getDisplayName(userId);
                const [gradFrom, gradTo] = getPersonColor(userId);
                const initials = getInitials(name);
                return (
                  <button
                    key={userId}
                    onClick={() => handleContactClick(userId)}
                    aria-label={`開啟與 ${name} 的對話`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 6px', borderRadius: 8,
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'inherit', textAlign: 'left', width: '100%',
                      transition: 'background 150ms',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: '#fff',
                    }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {name}
                      </div>
                      <div style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 999, background: '#10B981', display: 'inline-block' }} />
                        在線
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity ping card */}
          {activityRoom && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(34,211,238,0.1), rgba(99,102,241,0.05))',
              border: '1px solid rgba(34,211,238,0.3)',
              borderRadius: 12,
              padding: 16,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#22D3EE', marginBottom: 10 }}>
                ● 即時活動
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--co-text)', lineHeight: 1.6, marginBottom: 12 }}>
                {(activityRoom.unread_count || 0) > 0
                  ? `${getRoomDisplayName(activityRoom, currentUser)} 有新訊息`
                  : `你有 ${totalUnread} 則未讀訊息等待回覆`
                }
              </div>
              <button
                onClick={() => handleViewRoom(activityRoom)}
                aria-label="立即回覆"
                style={{
                  width: '100%', padding: '10px 0', borderRadius: 8,
                  background: 'linear-gradient(135deg, #22D3EE, #6366F1)',
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(34,211,238,0.2)',
                }}
              >
                立即回覆 →
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default Home;
