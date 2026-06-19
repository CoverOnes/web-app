import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import type { Message } from '../types';

interface UseSSEOptions {
  roomId: string;
  userId: string;
  onMessage?: (message: Message) => void;
  onError?: (error: Event) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * SSE (Server-Sent Events) Hook
 * 用於接收即時訊息。
 * SSE stream URL: /api/chat/v1/messages/stream?room_id=<id>&access_token=<jwt>
 * EventSource cannot send Authorization headers, so the JWT is passed as a query param
 * (gateway validates it for this SSE-only route per locked contract decision 5adf4b20).
 */
export const useSSE = ({ roomId, userId, onMessage, onError }: UseSSEOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 使用 ref 保存回調函數，避免依賴變化導致重連
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
  }, [onMessage, onError]);

  const accessToken = useAuthStore((s) => s.accessToken ?? '');

  useEffect(() => {
    // 不連接臨時聊天室或空 roomId
    // Fix 5: also guard empty accessToken — skip connect until token is present.
    // accessToken is in the dep array so a token refresh re-establishes the
    // SSE connection automatically.
    if (!roomId || !userId || roomId.startsWith('temp_') || accessToken === '') {
      return;
    }

    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;

      // 清除舊的連接
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // 清除重試計時器
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      // 建立新的 SSE 連接
      // access_token passed as query param: EventSource cannot send Authorization headers.
      // Gateway validates the token for this route only (decision 5adf4b20).
      // accessToken is captured from the effect closure (Zustand selector); using
      // .getState() here would be stale on reconnect after a token refresh.
      const url = `${API_BASE_URL}/api/chat/v1/messages/stream?room_id=${encodeURIComponent(roomId)}&access_token=${encodeURIComponent(accessToken)}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      // 連接打開
      eventSource.onopen = () => {
        if (isMounted) {
          setIsConnected(true);
          retryCountRef.current = 0;
        }
      };

      // 監聽連接確認事件
      eventSource.addEventListener('connected', () => {
        if (isMounted) {
          setIsConnected(true);
        }
      });

      // 監聽心跳事件
      eventSource.addEventListener('ping', () => {
        // 保持連接活躍
      });

      // 監聽訊息事件
      eventSource.addEventListener('message', (e) => {
        try {
          const message: Message = JSON.parse(e.data);
          if (message.room_id === roomId && isMounted) {
            onMessageRef.current?.(message);
          }
        } catch {
          if (import.meta.env.DEV) console.warn('[useSSE] message parse failed: invalid JSON');
        }
      });

      // 錯誤處理
      eventSource.onerror = (error) => {
        if (!isMounted) return;

        setIsConnected(false);
        onErrorRef.current?.(error);

        // 關閉舊連接
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }

        // 指數退避重連（最多 5 次，延遲上限 16 秒）
        retryCountRef.current += 1;
        if (retryCountRef.current <= 5 && isMounted) {
          const delay = Math.min(16000, 1000 * Math.pow(2, retryCountRef.current - 1));
          retryTimerRef.current = setTimeout(() => {
            if (isMounted) {
              connect();
            }
          }, delay);
        }
      };
    };

    connect();

    // 清理函數
    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [roomId, userId, accessToken]);

  return { isConnected };
};

export default useSSE;
