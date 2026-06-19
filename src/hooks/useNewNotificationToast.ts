/**
 * useNewNotificationToast — fires an in-app toast when unread count increases.
 *
 * Watches the 60-second polling from useUnreadCount().
 * Suppressed when user is already on /notifications page.
 *
 * Called once at the top of CoverOnesLayout.
 */
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useUnreadCount } from '../lib/query';
import { addToast } from '../components/notifications/useToast';

export function useNewNotificationToast(): void {
  const { data } = useUnreadCount();
  const prevCount = useRef<number>(data?.count ?? 0);
  const location = useLocation();

  useEffect(() => {
    const curr = data?.count ?? 0;
    if (curr > prevCount.current && location.pathname !== '/notifications') {
      addToast({
        title: '你有新通知',
        body: `${curr - prevCount.current} 則未讀`,
        type: 'info',
      });
    }
    prevCount.current = curr;
  }, [data?.count, location.pathname]);
}
