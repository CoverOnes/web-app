/**
 * NotificationBellButton — topbar bell icon with dropdown panel.
 *
 * Features:
 * - 7px red dot badge when unreadCount > 0 (no number, dot only)
 * - Dropdown panel (360px) toggled on click; closes on outside click / Escape
 * - Shows first 5 notifications from useNotifications()
 * - Click row → markRead(id) + close
 * - "全部標為已讀" ghost button (disabled when unreadCount === 0)
 * - "查看全部通知" footer link → /notifications + close
 * - Loading: 3× skeleton rows
 * - Empty state: centered dim text
 * - Accessibility: aria-haspopup, aria-expanded, aria-live, role=dialog
 *
 * Design tokens: --co-bg-card, --co-line-strong, --co-accent, --co-red, --co-text, --co-text-dim
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useNotifications, useUnreadCount, useMarkNotificationRead, useMarkAllNotificationsRead } from '../../lib/query';
import type { Notification, NotificationType } from '../../lib/api/coverones';
import { Icon } from '../ui/Icon';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: zhTW });
  } catch {
    return '';
  }
}

/** 24px colored dot based on notification type */
function typeColor(type: NotificationType): string {
  switch (type) {
    case 'KYC_TIER_CHANGED':
    case 'KYC_STATUS_CHANGED':
      return '#10B981';
    case 'BID_RECEIVED':
    case 'BID_ACCEPTED':
      return '#6366F1';
    case 'MILESTONE_REACHED':
      return '#22D3EE';
    case 'CONTRACT_SIGNED':
      return '#F59E0B';
    case 'ACCOUNT_SUSPENDED':
      return '#EF4444';
    default:
      return '#94A3B8';
  }
}

// ─── NotificationRow ─────────────────────────────────────────────────────────

interface NotificationRowProps {
  notification: Notification;
  onClose: () => void;
  onMarkRead: (id: string) => void;
}

function NotificationRow({ notification, onClose, onMarkRead }: NotificationRowProps) {
  const isUnread = !notification.readAt;

  const handleClick = () => {
    if (isUnread) {
      onMarkRead(notification.id);
    }
    onClose();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 14px',
        background: 'transparent',
        border: 'none',
        borderLeft: isUnread ? '4px solid var(--co-accent)' : '4px solid transparent',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 120ms',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      {/* Type dot */}
      <div
        aria-hidden="true"
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: typeColor(notification.type),
          flexShrink: 0,
          marginTop: 1,
        }}
      />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: isUnread ? 600 : 400,
            color: 'var(--co-text)',
            lineHeight: 1.35,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {notification.title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--co-text-dim)',
            marginTop: 2,
          }}
        >
          {relativeTime(notification.createdAt)}
        </div>
      </div>
    </button>
  );
}

// ─── NotificationBellButton ───────────────────────────────────────────────────

const NotificationBellButton = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: unreadData } = useUnreadCount();
  const { data: notificationsData, isLoading } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();

  const unreadCount = unreadData?.count ?? 0;
  const notifications = (notificationsData?.items ?? []).slice(0, 5);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleMarkAllRead = () => {
    markAllRead();
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate('/notifications');
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `${unreadCount} 則未讀通知` : '通知'}
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          color: 'var(--co-text-dim)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'background 150ms',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--co-text)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--co-text-dim)';
        }}
      >
        <Icon.Bell size={18} />

        {/* Screen-reader count label */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: 'hidden',
              clip: 'rect(0,0,0,0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          >
            {unreadCount} 則未讀通知
          </span>
        )}

        {/* 7px red dot badge */}
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--co-red)',
              boxShadow: '0 0 0 2px var(--co-bg)',
            }}
          />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="dialog"
          aria-label="通知列表"
          aria-live="polite"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: 360,
            background: 'var(--co-bg-card)',
            border: '1px solid var(--co-line-strong)',
            borderRadius: 12,
            boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
            zIndex: 30,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px 10px',
              borderBottom: '1px solid var(--co-line-strong)',
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--co-text)',
              }}
            >
              通知
            </span>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              style={{
                fontSize: 12,
                color: unreadCount === 0 ? 'var(--co-text-muted)' : 'var(--co-accent)',
                background: 'transparent',
                border: 'none',
                cursor: unreadCount === 0 ? 'default' : 'pointer',
                padding: '2px 4px',
                borderRadius: 4,
              }}
            >
              全部標為已讀
            </button>
          </div>

          {/* Body */}
          <div>
            {isLoading ? (
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <LoadingSkeleton count={3} height="h-10" />
              </div>
            ) : notifications.length === 0 ? (
              <div
                style={{
                  minHeight: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  color: 'var(--co-text-dim)',
                }}
              >
                目前沒有通知
              </div>
            ) : (
              notifications.map((n: Notification) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onClose={() => setOpen(false)}
                  onMarkRead={(id) => markRead(id)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <button
            type="button"
            onClick={handleViewAll}
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: 13,
              color: 'var(--co-accent)',
              background: 'transparent',
              border: 'none',
              borderTop: '1px solid var(--co-line-strong)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'background 120ms',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.06)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            查看全部通知
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationBellButton;
