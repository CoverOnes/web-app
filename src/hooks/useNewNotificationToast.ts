/**
 * useNewNotificationToast — fires an in-app toast when unread count increases.
 *
 * Watches the 60-second polling from useUnreadCount().
 * Suppressed when user is already on /notifications page.
 *
 * Called once at the top of CoverOnesLayout.
 *
 * Spurious-toast prevention:
 *   The first time data resolves from undefined we record the baseline count
 *   without toasting.  Only subsequent increases above that baseline fire a toast.
 */
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useUnreadCount } from '../lib/query';
import { addToast } from '../components/notifications/useToast';

export function useNewNotificationToast(): void {
  const { data } = useUnreadCount();
  // null = not yet initialized (data still undefined); number = baseline established
  const prevCount = useRef<number | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Wait until we have a real resolved value
    if (data === undefined) return;

    const curr = data.count;

    if (prevCount.current === null) {
      // First resolved value — seed the baseline, no toast
      prevCount.current = curr;
      return;
    }

    if (curr > prevCount.current && location.pathname !== '/notifications') {
      addToast({
        title: '你有新通知',
        body: `${curr - prevCount.current} 則未讀`,
        type: 'info',
      });
    }
    prevCount.current = curr;
  }, [data, location.pathname]);
}
