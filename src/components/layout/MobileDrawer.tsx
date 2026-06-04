import { useEffect, useRef, useCallback } from 'react';
import CoverOnesSidebar from './CoverOnesSidebar';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * MobileDrawer — slides in from left, contains the CoverOnes sidebar navigation.
 * Width: 300px per design-reference/chat/project/src/mobile.jsx mobStyles.drawer.
 * Transition: 220ms cubic-bezier(0.2,0.9,0.3,1) per spec.
 * Focus trap: Esc closes; Tab cycles within drawer.
 */
const MobileDrawer = ({ open, onClose }: MobileDrawerProps) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  /* Focus trap */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const drawer = drawerRef.current;
      if (!drawer) return;
      const focusable = drawer.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      const timer = setTimeout(() => {
        const firstBtn = drawerRef.current?.querySelector<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])',
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

  /* Swipe-left to close */
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (dx < -60 && dy < Math.abs(dx)) onClose();
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <>
      {/* Backdrop — shared.css mobStyles.drawerBackdrop */}
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
          transition: 'opacity 220ms',
        }}
      />

      {/* Drawer panel — width 300px per mobile.jsx spec */}
      <div
        ref={drawerRef}
        id="mobile-drawer"
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
          width: 300,
          maxWidth: '85vw',
          zIndex: 200,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 220ms cubic-bezier(0.2,0.9,0.3,1)',
          boxShadow: open ? '0 0 40px rgba(0,0,0,0.5)' : 'none',
          overflow: 'hidden',
        }}
      >
        {/* CoverOnesSidebar handles its own background/border */}
        <CoverOnesSidebar />
      </div>
    </>
  );
};

export default MobileDrawer;
