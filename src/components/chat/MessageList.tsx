import { useEffect, useRef, useCallback, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { chatApi } from '../../api/chat';
import type { Message, Person } from '../../types';
import MessageGroup from './MessageGroup';
import DaySeparator from './DaySeparator';
import EncryptionNotice from './EncryptionNotice';
import { getDisplayName } from '../../utils/formatters';
import { getPersonColor } from '../../lib/avatarColors';

interface MessageListProps {
  roomId: string;
}

function buildPerson(userId: string): Person {
  const name = getDisplayName(userId);
  return { id: userId, name, zh: name, status: 'online', color: getPersonColor(userId) };
}

interface MessageGroupData {
  senderId: string;
  sender: Person;
  messages: Message[];
  dayLabel: string | null;
}

function formatDayLabel(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return '今天';
  if (date.toDateString() === yesterday.toDateString()) return '昨天';
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function getDateString(timestamp: number): string {
  return new Date(timestamp * 1000).toDateString();
}

function groupMessages(messages: Message[]): MessageGroupData[] {
  const groups: MessageGroupData[] = [];
  let currentGroup: MessageGroupData | null = null;
  let lastDay: string | null = null;

  for (const msg of messages) {
    const day = getDateString(msg.created_at);
    const dayChanged = day !== lastDay;
    const dayLabel = dayChanged ? formatDayLabel(msg.created_at) : null;
    lastDay = day;

    const sameGroup =
      currentGroup !== null &&
      currentGroup.senderId === msg.sender_id &&
      !dayChanged &&
      msg.type !== 'system';

    if (sameGroup && currentGroup) {
      currentGroup.messages.push(msg);
    } else {
      currentGroup = {
        senderId: msg.sender_id,
        sender: buildPerson(msg.sender_id),
        messages: [msg],
        dayLabel,
      };
      groups.push(currentGroup);
    }
  }

  return groups;
}

// Virtual item types for heterogeneous list
type VirtualItem =
  | { kind: 'encryptionNotice' }
  | { kind: 'loadMoreBanner' }
  | { kind: 'loadMoreError'; onRetry: () => void }
  | { kind: 'unreadMarker' }
  | { kind: 'daySeparator'; label: string }
  | { kind: 'messageGroup'; group: MessageGroupData; isOwn: boolean };

const MessageList = ({ roomId }: MessageListProps) => {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const {
    messageHistory,
    setMessages,
    prependMessages,
    messagesCursor,
    setMessagesCursor,
    hasMoreMessages,
    setHasMoreMessages,
  } = useChatStore();

  const listRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error' | 'empty'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Fix 2: track load-more failure separately for inline retry affordance
  const [loadMoreError, setLoadMoreError] = useState(false);
  const prevRoomIdRef = useRef<string | null>(null);
  const unreadMarkerRef = useRef<HTMLDivElement>(null);
  const hasScrolledToUnread = useRef(false);
  const initialUnreadIndex = useRef<number>(-1);

  const loadMoreMessages = useCallback(async () => {
    if (isLoadingRef.current) return;
    if (!hasMoreMessages[roomId]) return;

    isLoadingRef.current = true;
    setLoadMoreError(false);
    try {
      const cursor = messagesCursor[roomId] || '';
      const data = await chatApi.getMessages(roomId, userId, 30, cursor);
      const msgs = [...data].reverse();
      prependMessages(roomId, msgs);
      // MVP: pagination cursor/hasMore not available from interceptor-unwrapped response
      setMessagesCursor(roomId, '');
      setHasMoreMessages(roomId, false);
    } catch {
      // Fix 2: surface inline retry affordance instead of silently ignoring
      setLoadMoreError(true);
    } finally {
      isLoadingRef.current = false;
    }
  }, [roomId, userId, messagesCursor, hasMoreMessages, prependMessages, setMessagesCursor, setHasMoreMessages]);

  useEffect(() => {
    prevRoomIdRef.current = roomId;
    // Reset state on room change
    initialUnreadIndex.current = -1;
    hasScrolledToUnread.current = false;
    setLoadMoreError(false);

    if (!roomId || roomId.startsWith('temp_')) {
      setStatus('empty');
      setErrorMsg(null);
      return;
    }

    isLoadingRef.current = false;
    setErrorMsg(null);

    const { messageHistory: latestHistory } = useChatStore.getState();
    const cachedMessages = latestHistory[roomId];
    const hasCache = cachedMessages && cachedMessages.length > 0;

    if (hasCache) {
      const storeState = useChatStore.getState();
      const room = storeState.rooms.find(r => r.id === roomId);
      if (room?.unread_count && room.unread_count > 0) {
        const msgs = storeState.messageHistory[roomId] || [];
        const total = msgs.length;
        const unreadCount = room.unread_count;
        initialUnreadIndex.current = unreadCount >= total ? 0 : total - unreadCount;
        const { setRooms } = useChatStore.getState();
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, unread_count: 0 } : r));
      }

      setStatus('loaded');
      setTimeout(() => {
        if (initialUnreadIndex.current >= 0 && unreadMarkerRef.current) {
          unreadMarkerRef.current.scrollIntoView({ block: 'start' });
          hasScrolledToUnread.current = true;
        } else {
          const container = listRef.current;
          if (container) container.scrollTop = container.scrollHeight;
        }
      }, 50);
      const onlyTemp = cachedMessages.every(m => m.id.startsWith('temp_'));
      if (onlyTemp) return;
    }

    setStatus('loading');

    const loadInitial = async () => {
      isLoadingRef.current = true;
      try {
        const data = await chatApi.getMessages(roomId, userId, 30, '');
        if (prevRoomIdRef.current !== roomId) return;

        const fromServer = [...data].reverse();
        const { messageHistory: cur } = useChatStore.getState();
        const existing = cur[roomId] || [];
        const tempMsgs = existing.filter(m => m.id.startsWith('temp_'));
        const merged = [...fromServer];
        tempMsgs.forEach(t => {
          if (!merged.some(m => m.content === t.content && m.sender_id === t.sender_id)) {
            merged.push(t);
          }
        });

        setMessages(roomId, merged);
        setMessagesCursor(roomId, '');
        setHasMoreMessages(roomId, false);
        setStatus(merged.length === 0 ? 'empty' : 'loaded');

        const storeState = useChatStore.getState();
        const room = storeState.rooms.find(r => r.id === roomId);
        if (room?.unread_count && room.unread_count > 0) {
          const total = merged.length;
          const unreadCount = room.unread_count;
          initialUnreadIndex.current = unreadCount >= total ? 0 : total - unreadCount;
          const { setRooms } = useChatStore.getState();
          setRooms(prev => prev.map(r => r.id === roomId ? { ...r, unread_count: 0 } : r));
        }

        setTimeout(() => {
          if (initialUnreadIndex.current >= 0 && unreadMarkerRef.current) {
            unreadMarkerRef.current.scrollIntoView({ block: 'start' });
            hasScrolledToUnread.current = true;
          } else {
            const container = listRef.current;
            if (container) container.scrollTop = container.scrollHeight;
          }
        }, 50);
      } catch {
        if (prevRoomIdRef.current !== roomId) return;
        setErrorMsg('服務暫時無法使用，請稍後再試');
        setStatus('error');
      } finally {
        isLoadingRef.current = false;
      }
    };

    loadInitial();
  }, [roomId, userId, setMessages, setMessagesCursor, setHasMoreMessages]);

  const messages = messageHistory[roomId] || [];

  // Group messages by sender + day
  const groups = groupMessages(messages);

  // Pre-compute each group's starting index
  let runningIndex = 0;
  const groupStartIndices = groups.map(group => {
    const start = runningIndex;
    runningIndex += group.messages.length;
    return start;
  });

  // Build flat virtual item list from groups
  const virtualItems: VirtualItem[] = [];
  virtualItems.push({ kind: 'encryptionNotice' });
  if (hasMoreMessages[roomId]) {
    virtualItems.push({ kind: 'loadMoreBanner' });
  }
  if (loadMoreError) {
    virtualItems.push({
      kind: 'loadMoreError',
      onRetry: loadMoreMessages,
    });
  }

  groups.forEach((group, idx) => {
    const groupStartIndex = groupStartIndices[idx];
    const showUnreadMarker =
      initialUnreadIndex.current >= 0 &&
      groupStartIndex === initialUnreadIndex.current;

    if (showUnreadMarker) {
      virtualItems.push({ kind: 'unreadMarker' });
    }
    if (group.dayLabel) {
      virtualItems.push({ kind: 'daySeparator', label: group.dayLabel });
    }
    virtualItems.push({
      kind: 'messageGroup',
      group,
      isOwn: group.senderId === userId,
    });
  });

  // Fix 1: useVirtualizer on listRef scroll container
  const virtualizer = useVirtualizer({
    count: virtualItems.length,
    getScrollElement: () => listRef.current,
    estimateSize: (index) => {
      const item = virtualItems[index];
      if (!item) return 60;
      switch (item.kind) {
        case 'encryptionNotice': return 48;
        case 'loadMoreBanner': return 32;
        case 'loadMoreError': return 44;
        case 'unreadMarker': return 32;
        case 'daySeparator': return 36;
        case 'messageGroup': return item.group.messages.length * 56 + 32;
        default: return 60;
      }
    },
    overscan: 5,
  });

  // Auto-scroll to bottom on new messages when already near bottom
  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    if (status !== 'loaded' || messages.length === 0) return;
    if (messages.length <= prevMessageCountRef.current) {
      prevMessageCountRef.current = messages.length;
      return;
    }
    prevMessageCountRef.current = messages.length;

    const container = listRef.current;
    if (!container) return;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 200;
    if (isNearBottom) {
      virtualizer.scrollToIndex(virtualItems.length - 1, { align: 'end' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, status]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    if (el.scrollTop <= 50 && hasMoreMessages[roomId] && !isLoadingRef.current) {
      const prevH = el.scrollHeight;
      loadMoreMessages().then(() => {
        requestAnimationFrame(() => {
          if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight - prevH;
          }
        });
      });
    }
  }, [roomId, hasMoreMessages, loadMoreMessages]);

  const handleRetry = () => {
    setErrorMsg(null);
    setStatus('loading');
    const retry = async () => {
      isLoadingRef.current = true;
      try {
        const data = await chatApi.getMessages(roomId, userId, 30, '');
        const msgs = [...data].reverse();
        setMessages(roomId, msgs);
        setMessagesCursor(roomId, '');
        setHasMoreMessages(roomId, false);
        setStatus(msgs.length === 0 ? 'empty' : 'loaded');
        setTimeout(() => {
          const container = listRef.current;
          if (container) container.scrollTop = container.scrollHeight;
        }, 50);
      } catch {
        setErrorMsg('服務暫時無法使用，請稍後再試');
        setStatus('error');
      } finally {
        isLoadingRef.current = false;
      }
    };
    retry();
  };

  const containerStyle: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '20px 24px 8px 24px',
    display: 'flex',
    flexDirection: 'column',
  };

  if (status === 'error') {
    return (
      <div ref={listRef} style={containerStyle}>
        <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--color-main-text-dim)' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontSize: 14, marginBottom: 12 }}>{errorMsg}</div>
          <button
            onClick={handleRetry}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: 'var(--color-accent)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            重試
          </button>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div ref={listRef} style={containerStyle}>
        <div style={{ margin: 'auto', color: 'var(--color-main-text-dim)', fontSize: 14 }}>載入中...</div>
      </div>
    );
  }

  if (status === 'empty' || messages.length === 0) {
    return (
      <div ref={listRef} style={containerStyle}>
        <div style={{ margin: 'auto', color: 'var(--color-main-text-dim)', fontSize: 14 }}>還沒有訊息</div>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      style={containerStyle}
      onScroll={handleScroll}
    >
      {/* Fix 1: virtualizer outer container — total height reserves scroll space */}
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((vItem) => {
          const item = virtualItems[vItem.index];
          if (!item) return null;

          return (
            <div
              key={vItem.key}
              data-index={vItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${vItem.start}px)`,
              }}
            >
              {item.kind === 'encryptionNotice' && <EncryptionNotice />}

              {item.kind === 'loadMoreBanner' && (
                <div style={{
                  textAlign: 'center',
                  padding: '8px 0',
                  fontSize: 12,
                  color: 'var(--color-main-text-dim)',
                }}>
                  往上滾動載入更多
                </div>
              )}

              {/* Fix 2: inline load-more error with retry affordance */}
              {item.kind === 'loadMoreError' && (
                <div style={{
                  textAlign: 'center',
                  padding: '6px 0',
                  fontSize: 12,
                  color: 'var(--color-main-text-dim)',
                }}>
                  載入失敗，
                  <button
                    onClick={item.onRetry}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-accent)',
                      cursor: 'pointer',
                      fontSize: 12,
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                    aria-label="重試載入更多訊息"
                  >
                    點此重試
                  </button>
                </div>
              )}

              {item.kind === 'unreadMarker' && (
                <div
                  ref={unreadMarkerRef}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 0',
                    margin: '4px 0',
                  }}
                >
                  <div style={{ flex: 1, height: 1, background: 'var(--color-main-border)' }} />
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--color-accent)',
                    whiteSpace: 'nowrap',
                    padding: '0 8px',
                  }}>以下未讀</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-main-border)' }} />
                </div>
              )}

              {item.kind === 'daySeparator' && (
                <DaySeparator label={item.label} />
              )}

              {item.kind === 'messageGroup' && (() => {
                const { group, isOwn } = item;
                if (group.messages[0].type === 'system' || group.messages[0].sender_id === 'system') {
                  return (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                      <span style={{
                        fontSize: 12,
                        color: 'var(--color-main-text-dim)',
                        background: 'var(--color-main-bg-2)',
                        padding: '2px 12px',
                        borderRadius: 999,
                      }}>
                        {group.messages[0].content}
                      </span>
                    </div>
                  );
                }
                return (
                  <MessageGroup
                    messages={group.messages}
                    own={isOwn}
                    sender={group.sender}
                  />
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MessageList;
