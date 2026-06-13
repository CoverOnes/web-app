import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { chatApi } from '../../api/chat';
import AppShell from './AppShell';
import CoverOnesSidebar from './CoverOnesSidebar';
import CoverOnesTopbar from './CoverOnesTopbar';
import CoverOnesMobileBottomNav from './CoverOnesMobileBottomNav';
import MobileDrawer from './MobileDrawer';
import ChatPopup from '../chat/ChatPopup';
import { UnverifiedBanner } from '../auth/UnverifiedBanner';
import MobileFABProvider from './MobileFABProvider';

const MOBILE_BREAKPOINT = 768;

const CoverOnesLayout = () => {
  const location = useLocation();
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const { openPopups, setRooms, setRoomsLoaded } = useChatStore();
  const loadingRef = useRef(false);
  const hasInitialLoadRef = useRef(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (!e.matches) setDrawerOpen(false);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  /* Left-edge swipe to open drawer on mobile */
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

  /* Load rooms on initial mount (once per authenticated session) */
  useEffect(() => {
    if (!userId || loadingRef.current || hasInitialLoadRef.current) return;

    const loadRooms = async () => {
      loadingRef.current = true;
      try {
        const response = await chatApi.getRooms(userId, 50, '');
        if (response.success && response.data) {
          setRooms(response.data);
          hasInitialLoadRef.current = true;
        }
      } catch {
        // non-critical; roomsLoaded still set in finally so consumers unblock
      } finally {
        // Always mark attempted so ChatRoomPage / ChatList never wait forever.
        // hasInitialLoadRef.current stays false on error → retries on next userId change.
        setRoomsLoaded(true);
        loadingRef.current = false;
      }
    };

    loadRooms();
  }, [userId, setRooms, setRoomsLoaded]);

  /* Refresh rooms when navigating away from chat pages */
  useEffect(() => {
    if (!userId) return;
    const isMessagesPage =
      location.pathname.startsWith('/messages') ||
      location.pathname.startsWith('/chat');

    if (!isMessagesPage && hasInitialLoadRef.current && !loadingRef.current) {
      const refreshRooms = async () => {
        loadingRef.current = true;
        try {
          const response = await chatApi.getRooms(userId, 50, '');
          if (response.success && response.data) {
            setRooms((prevRooms) => {
              const newRooms = response.data!;
              if (prevRooms.length === 0) return newRooms;
              return newRooms.map((newRoom) => {
                const prevRoom = prevRooms.find((r) => r.id === newRoom.id);
                if (
                  prevRoom &&
                  prevRoom.unread_count === 0 &&
                  (newRoom.unread_count || 0) > 0
                ) {
                  return { ...newRoom, unread_count: 0 };
                }
                return newRoom;
              });
            });
          }
        } catch {
          // non-critical refresh; ignore errors
        } finally {
          loadingRef.current = false;
        }
      };

      refreshRooms();
    }
  }, [location.pathname, userId, setRooms]);

  return (
    <MobileFABProvider>
      <AppShell>
        {/* Desktop sidebar — hidden on mobile (provided via MobileDrawer) */}
        {!isMobile && <CoverOnesSidebar />}

        {/* Main column */}
        <main
          style={{
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            overflow: 'hidden',
            /* Bottom padding reserves space for mobile bottom-nav (72px + safe-area-inset-bottom) */
            paddingBottom: isMobile ? 'calc(72px + env(safe-area-inset-bottom))' : 0,
            background: 'var(--co-bg)',
            /* Main column fills the grid cell height on desktop */
            height: '100dvh',
          }}
        >
          {/* Topbar — sticky within the main column; passes hamburger handler on mobile */}
          <CoverOnesTopbar
            drawerOpen={drawerOpen}
            onMenuOpen={isMobile ? () => setDrawerOpen(true) : undefined}
          />

          {/* Email verification banner */}
          <UnverifiedBanner />

          {/* Scrollable outlet */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              background: 'var(--co-bg)',
            }}
          >
            <Outlet />
          </div>
        </main>

        {/* Mobile overlay chrome */}
        {isMobile && (
          <>
            <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
            <CoverOnesMobileBottomNav />
          </>
        )}

        {/* Desktop chat popups */}
        {openPopups.map((room, index) => (
          <ChatPopup key={room.id} room={room} index={index} />
        ))}
      </AppShell>
    </MobileFABProvider>
  );
};

export default CoverOnesLayout;
