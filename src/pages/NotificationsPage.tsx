/**
 * NotificationsPage — full notification center.
 *
 * Design reference: design-reference/chat/project/Notifications.html
 *
 * Real API wiring:
 *   GET  /api/notification/v1/me/notifications          → notification list
 *   GET  /api/notification/v1/me/notifications/unread-count → badge
 *   POST /api/notification/v1/me/notifications/read-all → bulk mark-read
 *   POST /api/notification/v1/me/notifications/:id/read → single mark-read
 *
 * Tab filtering is derived client-side from the real list (no per-tab API).
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  useNotifications,
  useUnreadCount,
  useMarkAllNotificationsRead,
} from '../lib/query';
import { notificationApi } from '../lib/api/coverones';
import type { Notification, NotificationType } from '../lib/api/coverones';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

// ─── Tab definitions ──────────────────────────────────────────────────────────

type Tab = '全部' | '未讀' | '系統' | '案件' | '合約';

/** Map notification types to tabs. */
function typeToTab(type: NotificationType): Tab {
  switch (type) {
    case 'KYC_TIER_CHANGED':
    case 'KYC_STATUS_CHANGED':
    case 'ACCOUNT_SUSPENDED':
      return '系統';
    case 'BID_RECEIVED':
    case 'BID_ACCEPTED':
    case 'MILESTONE_REACHED':
      return '案件';
    case 'CONTRACT_SIGNED':
      return '合約';
    default:
      return '系統';
  }
}

function filterItems(items: Notification[], tab: Tab): Notification[] {
  switch (tab) {
    case '全部':
      return items;
    case '未讀':
      return items.filter((n) => n.readAt === null);
    case '系統':
      return items.filter((n) => typeToTab(n.type) === '系統');
    case '案件':
      return items.filter((n) => typeToTab(n.type) === '案件');
    case '合約':
      return items.filter((n) => typeToTab(n.type) === '合約');
    default:
      return items;
  }
}

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: zhTW });
  } catch {
    return iso;
  }
}

// ─── Type icon ────────────────────────────────────────────────────────────────

interface TypeIconProps {
  type: NotificationType;
}

function TypeIcon({ type }: TypeIconProps) {
  const base: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  };

  const configs: Record<NotificationType, { bg: string; icon: React.ReactNode }> = {
    KYC_TIER_CHANGED: {
      bg: 'linear-gradient(135deg,#10B981,#22D3EE)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    KYC_STATUS_CHANGED: {
      bg: 'linear-gradient(135deg,#10B981,#22D3EE)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    ACCOUNT_SUSPENDED: {
      bg: 'linear-gradient(135deg,#EF4444,#F59E0B)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
    BID_RECEIVED: {
      bg: 'linear-gradient(135deg,#F59E0B,#EF4444)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" aria-hidden="true">
          <path d="m12 2 3.1 6.3 7 1-5 4.9 1.2 6.9L12 17.8l-6.3 3.3L6.9 14.2l-5-4.9 7-1Z" />
        </svg>
      ),
    },
    BID_ACCEPTED: {
      bg: 'linear-gradient(135deg,#F59E0B,#F97316)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" aria-hidden="true">
          <path d="m12 2 3.1 6.3 7 1-5 4.9 1.2 6.9L12 17.8l-6.3 3.3L6.9 14.2l-5-4.9 7-1Z" />
        </svg>
      ),
    },
    MILESTONE_REACHED: {
      bg: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" aria-hidden="true">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    CONTRACT_SIGNED: {
      bg: 'linear-gradient(135deg,#22D3EE,#0EA5E9)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <polyline points="9 15 11 17 15 13" />
        </svg>
      ),
    },
  };

  const cfg = configs[type] ?? {
    bg: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" aria-hidden="true">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  };

  return (
    <div style={{ ...base, background: cfg.bg }}>
      {cfg.icon}
    </div>
  );
}

// ─── Category chip ────────────────────────────────────────────────────────────

interface CategoryChipProps {
  type: NotificationType;
}

function CategoryChip({ type }: CategoryChipProps) {
  const chipMap: Record<NotificationType, { label: string; bg: string; color: string }> = {
    KYC_TIER_CHANGED:    { label: '認證結果', bg: 'rgba(148,163,184,0.15)', color: 'var(--co-text-dim)' },
    KYC_STATUS_CHANGED:  { label: '認證結果', bg: 'rgba(148,163,184,0.15)', color: 'var(--co-text-dim)' },
    ACCOUNT_SUSPENDED:   { label: '系統公告', bg: 'rgba(148,163,184,0.15)', color: 'var(--co-text-dim)' },
    BID_RECEIVED:        { label: '投標通知', bg: 'rgba(245,158,11,0.15)',  color: '#FCD34D' },
    BID_ACCEPTED:        { label: '中標結果', bg: 'rgba(245,158,11,0.15)',  color: '#FCD34D' },
    MILESTONE_REACHED:   { label: '里程碑',   bg: 'rgba(99,102,241,0.15)', color: '#A78BFA' },
    CONTRACT_SIGNED:     { label: '合約簽署', bg: 'rgba(34,211,238,0.15)', color: '#67E8F9' },
  };

  const chip = chipMap[type] ?? { label: '通知', bg: 'rgba(148,163,184,0.15)', color: 'var(--co-text-dim)' };

  return (
    <span
      style={{
        padding: '1px 7px',
        borderRadius: 4,
        fontWeight: 500,
        fontSize: 10.5,
        background: chip.bg,
        color: chip.color,
      }}
    >
      {chip.label}
    </span>
  );
}

// ─── Notification row ─────────────────────────────────────────────────────────

interface NotificationRowProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  isMarkingRead: boolean;
}

function NotificationRow({ notification, onMarkRead, isMarkingRead }: NotificationRowProps) {
  const isUnread = notification.readAt === null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '44px 1fr auto',
        gap: 14,
        alignItems: 'center',
        padding: '14px 16px',
        border: `1px solid ${isUnread ? 'rgba(99,102,241,0.25)' : 'var(--co-line-strong)'}`,
        borderRadius: 12,
        background: isUnread
          ? 'linear-gradient(90deg, rgba(99,102,241,0.06), var(--co-bg-card) 30%)'
          : 'var(--co-bg-card)',
        marginBottom: 8,
        position: 'relative',
        transition: 'border-color 150ms',
        cursor: isUnread ? 'pointer' : 'default',
      }}
      onClick={() => { if (isUnread) onMarkRead(notification.id); }}
      role="article"
      aria-label={`${notification.title}${isUnread ? '（未讀）' : ''}`}
    >
      {isUnread && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 6,
            height: 6,
            borderRadius: 999,
            background: 'var(--co-accent)',
            boxShadow: '0 0 0 2px rgba(99,102,241,0.25)',
          }}
        />
      )}

      <TypeIcon type={notification.type} />

      <div>
        <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--co-text)', margin: 0 }}>
          {notification.title}
        </p>
        {notification.body && (
          <div
            style={{
              marginTop: 6,
              padding: '8px 10px',
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid var(--co-line)',
              borderRadius: 8,
              fontSize: 12.5,
              color: 'var(--co-text-dim)',
              lineHeight: 1.5,
            }}
          >
            {notification.body}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
          <CategoryChip type={notification.type} />
          <span style={{ fontSize: 11.5, color: 'var(--co-text-dim)' }}>
            · {relativeTime(notification.createdAt)}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        {isUnread && (
          <button
            style={{
              padding: '5px 10px',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 600,
              background: 'transparent',
              border: '1px solid var(--co-line-strong)',
              color: 'var(--co-text-dim)',
              cursor: isMarkingRead ? 'wait' : 'pointer',
              whiteSpace: 'nowrap',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(notification.id);
            }}
            aria-label="標為已讀"
            disabled={isMarkingRead}
          >
            已讀
          </button>
        )}
        <span style={{ fontSize: 11, color: 'var(--co-text-muted)', whiteSpace: 'nowrap' }}>
          {relativeTime(notification.createdAt)}
        </span>
      </div>
    </div>
  );
}

// ─── Filter sidebar ───────────────────────────────────────────────────────────

interface FilterSidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  counts: Record<Tab, number>;
}

const TAB_CONFIG: Array<{ tab: Tab; dotColor?: string; svgPath?: React.ReactNode }> = [
  {
    tab: '全部',
    svgPath: (
      <>
        <path d="M22 12h-6l-2 3h-4l-2-3H2" />
        <path d="M5 12 2 7l3-4h14l3 4-3 5" />
      </>
    ),
  },
  { tab: '未讀', dotColor: 'var(--co-accent)' },
  { tab: '系統', dotColor: 'var(--co-text-dim)' },
  { tab: '案件', dotColor: '#FCD34D' },
  { tab: '合約', dotColor: '#67E8F9' },
];

function FilterSidebar({ activeTab, onTabChange, counts }: FilterSidebarProps) {
  return (
    <aside style={{ position: 'sticky', top: 80, height: 'fit-content' }} aria-label="通知篩選">
      <p
        style={{
          fontSize: 11,
          color: 'var(--co-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          padding: '0 12px 8px',
          fontWeight: 600,
          margin: 0,
        }}
      >
        收件匣
      </p>

      {TAB_CONFIG.map(({ tab, dotColor, svgPath }) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 8,
              fontSize: 13,
              color: isActive ? '#C7D2FE' : 'var(--co-text-dim)',
              cursor: 'pointer',
              width: '100%',
              background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
              border: 'none',
              fontWeight: isActive ? 600 : 400,
              textAlign: 'left',
            }}
            aria-pressed={isActive}
            aria-label={`篩選：${tab}`}
          >
            {dotColor ? (
              <span
                aria-hidden="true"
                style={{ width: 8, height: 8, borderRadius: 999, background: dotColor, flexShrink: 0 }}
              />
            ) : svgPath ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                {svgPath}
              </svg>
            ) : null}

            {tab}

            <span
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                color: isActive ? '#A78BFA' : 'var(--co-text-muted)',
              }}
            >
              {counts[tab]}
            </span>
          </button>
        );
      })}

      <p
        style={{
          fontSize: 11,
          color: 'var(--co-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          padding: '14px 12px 8px',
          fontWeight: 600,
          margin: 0,
        }}
      >
        設定
      </p>
      <Link
        to="/settings"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '9px 12px',
          borderRadius: 8,
          fontSize: 13,
          color: 'var(--co-text-dim)',
          textDecoration: 'none',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.65 1.65 0 0 0-1.8-.3 1.65 1.65 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.65 1.65 0 0 0-1-1.5 1.65 1.65 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.65 1.65 0 0 0 .3-1.8 1.65 1.65 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.65 1.65 0 0 0 1.5-1z" />
        </svg>
        通知偏好
      </Link>
    </aside>
  );
}

// ─── Inner list (owns single-mark-read side-effects) ─────────────────────────

interface NotificationListProps {
  items: Notification[];
}

function NotificationList({ items }: NotificationListProps) {
  const qc = useQueryClient();
  const [markingIds, setMarkingIds] = useState<Set<string>>(new Set());

  const handleMarkRead = async (id: string) => {
    if (markingIds.has(id)) return;
    setMarkingIds((prev) => new Set(prev).add(id));
    try {
      await notificationApi.markRead(id);
      await qc.invalidateQueries({ queryKey: ['notifications'] });
      await qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    } catch {
      // Non-fatal: silently swallow; row will still appear unread on next refetch
    } finally {
      setMarkingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div>
      {items.map((n) => (
        <NotificationRow
          key={n.id}
          notification={n}
          onMarkRead={handleMarkRead}
          isMarkingRead={markingIds.has(n.id)}
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('全部');

  const { data, isLoading, isError } = useNotifications();
  const { data: unreadData } = useUnreadCount();
  const markAllRead = useMarkAllNotificationsRead();

  const allItems = useMemo<Notification[]>(
    () => data?.items ?? [],
    [data]
  );

  const tabCounts = useMemo<Record<Tab, number>>(() => ({
    全部:   allItems.length,
    未讀:   allItems.filter((n) => n.readAt === null).length,
    系統:   allItems.filter((n) => typeToTab(n.type) === '系統').length,
    案件:   allItems.filter((n) => typeToTab(n.type) === '案件').length,
    合約:   allItems.filter((n) => typeToTab(n.type) === '合約').length,
  }), [allItems]);

  const filteredItems = useMemo(
    () => filterItems(allItems, activeTab),
    [allItems, activeTab]
  );

  // Prefer the server-side unread count (updated by polling), fall back to client-side.
  const unreadCount = unreadData?.count ?? tabCounts['未讀'];

  return (
    <div style={{ padding: '22px 28px 40px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px minmax(0,1fr)',
          gap: 20,
          maxWidth: 1160,
        }}
      >
        {/* Sidebar */}
        <FilterSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={tabCounts}
        />

        {/* Main */}
        <main>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, color: 'var(--co-text)' }}>
              通知中心
            </h1>
            {!isLoading && !isError && (
              <span style={{ fontSize: 13, color: 'var(--co-text-dim)', marginLeft: 6 }}>
                {allItems.length} 則{unreadCount > 0 ? ` · ${unreadCount} 未讀` : ''}
              </span>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending || unreadCount === 0}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  background: 'var(--co-bg-card-2)',
                  border: '1px solid var(--co-line-strong)',
                  color: unreadCount === 0 ? 'var(--co-text-muted)' : 'var(--co-text-dim)',
                  cursor: unreadCount === 0 ? 'not-allowed' : 'pointer',
                  opacity: unreadCount === 0 ? 0.5 : 1,
                  minWidth: 44,
                  minHeight: 44,
                }}
                aria-label="全部標為已讀"
              >
                {markAllRead.isPending ? '處理中...' : '全部標為已讀'}
              </button>
              <Link
                to="/settings"
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  background: 'transparent',
                  border: '1px solid var(--co-line-strong)',
                  color: 'var(--co-text-dim)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  minWidth: 44,
                  minHeight: 44,
                }}
                aria-label="通知設定"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.65 1.65 0 0 0-1.8-.3 1.65 1.65 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.65 1.65 0 0 0-1-1.5 1.65 1.65 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.65 1.65 0 0 0 .3-1.8 1.65 1.65 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.65 1.65 0 0 0 1.5-1z" />
                </svg>
                設定
              </Link>
            </div>
          </div>

          {markAllRead.isError && (
            <p role="alert" style={{ fontSize: 13, color: 'var(--co-red)', marginBottom: 12, textAlign: 'center' }}>
              操作失敗，請稍後再試。
            </p>
          )}

          {/* Loading */}
          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} aria-busy="true" aria-label="載入中">
              <LoadingSkeleton count={6} height="h-20" />
            </div>
          )}

          {/* Error */}
          {isError && !isLoading && (
            <EmptyState
              title="載入失敗"
              description="無法取得通知，請稍後再試。"
              icon={
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              }
            />
          )}

          {/* Empty */}
          {!isLoading && !isError && filteredItems.length === 0 && (
            <EmptyState
              title={activeTab === '全部' ? '目前沒有通知' : `沒有「${activeTab}」通知`}
              description={
                activeTab === '未讀' ? '所有通知皆已閱讀。' : '此分類目前沒有任何通知。'
              }
              icon={
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              }
            />
          )}

          {/* List */}
          {!isLoading && !isError && filteredItems.length > 0 && (
            <NotificationList items={filteredItems} />
          )}
        </main>
      </div>
    </div>
  );
}
