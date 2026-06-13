import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import type { Room, Person } from '../../types';
import { getDisplayName } from '../../utils/formatters';
import SidebarBrand from './SidebarBrand';
import SidebarSearchInput from './SidebarSearchInput';
import NavItem from './NavItem';
import RoomRow from './RoomRow';
import PresenceItem from './PresenceItem';
import SidebarFooter from './SidebarFooter';

type NavId = 'all' | 'contacts' | 'groups' | 'starred';

interface SidebarProps {
  activeRoomId?: string | null;
  onSelectRoom?: (roomId: string) => void;
  onOpenCreate?: () => void;
}

// Deterministic gradient colors
const GRADIENT_PALETTE: [string, string][] = [
  ['#2563EB', '#6366F1'],
  ['#059669', '#0D9488'],
  ['#D97706', '#DC2626'],
  ['#7C3AED', '#DB2777'],
  ['#0891B2', '#0D9488'],
  ['#B45309', '#92400E'],
  ['#065F46', '#0F766E'],
];

function getPersonColor(userId: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENT_PALETTE[Math.abs(hash) % GRADIENT_PALETTE.length];
}

// Static online users list (TODO: replace with real presence API)
const ONLINE_USER_IDS = ['user_alice', 'user_bob', 'user_charlie', 'user_david', 'user_emma', 'user_frank', 'user_grace'];

const NAV_ITEMS: { id: NavId; icon: 'MessageSquare' | 'Users' | 'UserGroup' | 'Star'; label: string }[] = [
  { id: 'all', icon: 'MessageSquare', label: '所有對話' },
  { id: 'contacts', icon: 'Users', label: '聯絡人' },
  { id: 'groups', icon: 'UserGroup', label: '群組' },
  { id: 'starred', icon: 'Star', label: '重要訊息' },
];

const Sidebar = ({ activeRoomId, onSelectRoom, onOpenCreate }: SidebarProps) => {
  const navigate = useNavigate();
  const authUserId = useAuthStore((s) => s.user?.id ?? '');
  const authDisplayName = useAuthStore((s) => s.user?.displayName ?? '');
  const { rooms, roomsLoaded, openChatPopup } = useChatStore();
  const [activeNav, setActiveNav] = useState<NavId>('all');
  const [search, setSearch] = useState('');
  const onlineUsers = useMemo((): Person[] => {
    return ONLINE_USER_IDS
      .filter(id => id !== authUserId)
      .map(id => {
        const name = getDisplayName(id);
        return { id, name, zh: name, status: 'online' as const, color: getPersonColor(id) };
      });
  }, [authUserId]);

  const currentUserPerson: Person = useMemo(() => {
    const name = authDisplayName || getDisplayName(authUserId) || authUserId;
    return { id: authUserId, name, zh: name, status: 'online', color: getPersonColor(authUserId) };
  }, [authUserId, authDisplayName]);

  const filteredRooms = useMemo((): Room[] => {
    let filtered = [...rooms];

    // Filter by nav
    if (activeNav === 'groups') {
      filtered = filtered.filter(r => r.type === 'group');
    } else if (activeNav === 'contacts') {
      filtered = filtered.filter(r => r.type === 'direct');
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(r => r.name.toLowerCase().includes(q));
    }

    // Sort by last message time descending
    return filtered.sort((a, b) => {
      const tA = a.last_message_time || a.created_at;
      const tB = b.last_message_time || b.created_at;
      return tB - tA;
    });
  }, [rooms, activeNav, search]);

  const handleSelectRoom = useCallback((roomId: string) => {
    if (onSelectRoom) {
      onSelectRoom(roomId);
      return;
    }
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    openChatPopup(room);
  }, [onSelectRoom, rooms, openChatPopup]);

  const handlePresenceClick = useCallback((person: Person) => {
    if (person.id === authUserId) return;
    if (roomsLoaded) {
      const existingRoom = rooms.find(r => {
        if (r.type !== 'direct') return false;
        if (r.members?.some(m => m.user_id === person.id) && r.members?.some(m => m.user_id === authUserId)) return true;
        if (r.name?.includes(person.id) && r.name?.includes(authUserId)) return true;
        return false;
      });
      if (existingRoom) {
        openChatPopup({ ...existingRoom, members: existingRoom.members || [{ user_id: authUserId, role: 'admin' }, { user_id: person.id, role: 'member' }] });
        return;
      }
    }
    const tempRoom: Room = {
      id: `temp_${person.id}`,
      name: '',
      type: 'direct',
      owner_id: authUserId,
      members: [{ user_id: authUserId, role: 'admin' }, { user_id: person.id, role: 'member' }],
      created_at: Math.floor(Date.now() / 1000),
      isTemporary: true,
      targetContactId: person.id,
    };
    openChatPopup(tempRoom);
  }, [authUserId, rooms, roomsLoaded, openChatPopup]);

  const handleOpenSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  return (
    <aside
      aria-label="對話側欄"
      style={{
        width: 'var(--sidebar-w)',
        height: '100%',
        background: 'var(--color-sb-bg)',
        borderRight: '1px solid var(--color-sb-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Brand */}
      <SidebarBrand onOpenCreate={onOpenCreate ?? (() => {})} />

      {/* Search */}
      <SidebarSearchInput value={search} onChange={setSearch} />

      {/* Nav */}
      <div style={{ padding: '8px 8px 0 8px', flexShrink: 0 }}>
        {NAV_ITEMS.map(n => (
          <NavItem
            key={n.id}
            icon={n.icon}
            label={n.label}
            active={activeNav === n.id}
            onClick={() => setActiveNav(n.id)}
          />
        ))}
      </div>

      {/* Section label + room list */}
      <div style={{
        padding: '14px 16px 6px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.04em',
        color: 'var(--color-sb-text-dim)',
        textTransform: 'uppercase',
        flexShrink: 0,
      }}>
        <span>對話</span>
        <span style={{ textTransform: 'none', fontSize: 11 }}>{filteredRooms.length}</span>
      </div>

      {/* Scrollable room list + presence */}
      <div
        className="sb-scroll"
        style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 8 }}
      >
        {filteredRooms.length === 0 && search && (
          <div style={{ padding: '24px 20px', color: 'var(--color-sb-text-dim)', fontSize: 12.5, textAlign: 'center' }}>
            找不到符合「{search}」的對話
          </div>
        )}

        {filteredRooms.map(room => (
          <RoomRow
            key={room.id}
            room={room}
            active={room.id === (activeRoomId ?? null)}
            onClick={() => handleSelectRoom(room.id)}
            currentUser={authUserId}
          />
        ))}

        {/* Online presence section */}
        {onlineUsers.length > 0 && (
          <>
            <div style={{
              padding: '14px 16px 6px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.04em',
              color: 'var(--color-sb-text-dim)',
              textTransform: 'uppercase',
            }}>
              <span>在線上 ({onlineUsers.length})</span>
            </div>
            <div style={{ padding: '2px 8px 10px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {onlineUsers.map(p => (
                <PresenceItem key={p.id} person={p} onClick={() => handlePresenceClick(p)} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <SidebarFooter currentUser={currentUserPerson} onOpenSettings={handleOpenSettings} />
    </aside>
  );
};

export default Sidebar;
