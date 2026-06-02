import { useEffect, useRef, useCallback } from 'react';
import Sidebar from './Sidebar';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

const MobileDrawer = ({ open, onClose }: MobileDrawerProps) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Focus trap when open
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const drawer = drawerRef.current;
    if (!drawer) return;
    const focusable = drawer.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      // Move focus into drawer
      const timer = setTimeout(() => {
        const firstBtn = drawerRef.current?.querySelector<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])'
        );
        firstBtn?.focus();
      }, 250);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        clearTimeout(timer);
      };
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  // Swipe gestures: swipe-left or downward drag to close
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    // Swipe left (dx < -60) and more horizontal than vertical
    if (dx < -60 && dy < Math.abs(dx)) {
      onClose();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 150,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 250ms ease-out',
        }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="選單"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 'var(--sidebar-w)',
          maxWidth: '85vw',
          zIndex: 200,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: `transform 220ms cubic-bezier(0.2,0.9,0.3,1)`,
          boxShadow: open ? 'var(--shadow-pop)' : 'none',
        }}
      >
        <Sidebar />
      </div>
    </>
  );
};

export default MobileDrawer;
