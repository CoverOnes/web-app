import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore';
import AppShell from './AppShell';
import CoverOnesSidebar from './CoverOnesSidebar';
import CoverOnesMobileBottomNav from './CoverOnesMobileBottomNav';
import MobileDrawer from './MobileDrawer';
import ChatPopup from '../chat/ChatPopup';

const MOBILE_BREAKPOINT = 768;

const CoverOnesLayout = () => {
  const { openPopups } = useChatStore();
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

  return (
    <AppShell>
      {!isMobile && <CoverOnesSidebar />}

      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          paddingBottom: isMobile ? 72 : 0,
        }}
      >
        <Outlet />
      </main>

      {isMobile && (
        <>
          <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
          <CoverOnesMobileBottomNav />
        </>
      )}

      {openPopups.map((room, index) => (
        <ChatPopup key={room.id} room={room} index={index} />
      ))}
    </AppShell>
  );
};

export default CoverOnesLayout;
