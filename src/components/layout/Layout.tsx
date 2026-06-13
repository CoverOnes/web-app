import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { chatApi } from '../../api/chat';
import AppShell from './AppShell';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import MobileDrawer from './MobileDrawer';
import ChatPopup from '../chat/ChatPopup';

const MOBILE_BREAKPOINT = 768;

const Layout = () => {
  const location = useLocation();
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const { setRooms, setRoomsLoaded, openPopups } = useChatStore();
  const loadingRef = useRef(false);
  const hasInitialLoadRef = useRef(false);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Track viewport width
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (!e.matches) setDrawerOpen(false);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Swipe from left edge to open drawer on mobile
  useEffect(() => {
    if (!isMobile) return;
    let startX = 0;
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = Math.abs(e.changedTouches[0].clientY - startY);
      // Swipe right from left edge (first 24px)
      if (startX < 24 && dx > 60 && dy < Math.abs(dx)) {
        setDrawerOpen(true);
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [isMobile]);

  // Only load rooms on initial mount
  useEffect(() => {
    if (!userId || loadingRef.current || hasInitialLoadRef.current) return;

    const loadRooms = async () => {
      loadingRef.current = true;
      try {
        const response = await chatApi.getRooms(userId, 50, '');
        if (response.success && response.data) {
          setRooms(response.data);
          setRoomsLoaded(true);
          hasInitialLoadRef.current = true;
        }
      } catch (error) {
        console.error('載入聊天室列表失敗:', error);
        setRoomsLoaded(true);
      } finally {
        loadingRef.current = false;
      }
    };

    loadRooms();
  }, [userId, setRooms, setRoomsLoaded]);

  // Refresh rooms when leaving messages page
  useEffect(() => {
    if (!userId) return;
    const isMessagesPage = location.pathname.startsWith('/messages');

    if (!isMessagesPage && hasInitialLoadRef.current && !loadingRef.current) {
      const refreshRooms = async () => {
        loadingRef.current = true;
        try {
          const response = await chatApi.getRooms(userId, 50, '');
          if (response.success && response.data) {
            setRooms((prevRooms) => {
              const newRooms = response.data!;
              if (prevRooms.length === 0) return newRooms;
              return newRooms.map(newRoom => {
                const prevRoom = prevRooms.find(r => r.id === newRoom.id);
                if (prevRoom && prevRoom.unread_count === 0 && (newRoom.unread_count || 0) > 0) {
                  return { ...newRoom, unread_count: 0 };
                }
                return newRoom;
              });
            });
          }
        } catch (error) {
          console.error('刷新聊天室列表失敗:', error);
        } finally {
          loadingRef.current = false;
        }
      };

      refreshRooms();
    }
  }, [location.pathname, userId, setRooms]);

  return (
    <AppShell>
      {/* Sidebar — hidden on mobile (drawer provides it) */}
      {!isMobile && <Sidebar />}

      {/* Main content area */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          // On mobile, leave room for bottom nav
          paddingBottom: isMobile ? 72 : 0,
        }}
      >
        <Outlet />
      </main>

      {/* Mobile: drawer + bottom nav */}
      {isMobile && (
        <>
          <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
          <MobileBottomNav />
        </>
      )}

      {/* Popup chat windows */}
      {openPopups.map((room, index) => (
        <ChatPopup key={room.id} room={room} index={index} />
      ))}
    </AppShell>
  );
};

export default Layout;
