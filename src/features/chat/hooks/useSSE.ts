import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Message } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export function useSSE(roomId: string, userId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!roomId || !userId) return;
    let es: EventSource | null = null;
    let retryDelay = 1000;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let active = true;

    function connect() {
      if (!active) return;
      const url = `${API_BASE_URL}/messages/stream?room_id=${roomId}&user_id=${userId}`;
      es = new EventSource(url);

      es.addEventListener('message', (e: MessageEvent) => {
        try {
          const msg = JSON.parse(e.data as string) as Message;
          queryClient.setQueryData(['messages', roomId], (old: unknown) => {
            const arr = (old as Message[] | undefined) ?? [];
            return arr.some((m) => m.id === msg.id) ? arr : [...arr, msg];
          });
          retryDelay = 1000;
        } catch {
          // ignore parse errors
        }
      });

      es.addEventListener('error', () => {
        es?.close();
        if (!active) return;
        const delay = retryDelay;
        retryDelay = Math.min(retryDelay * 2, 30_000);
        retryTimer = setTimeout(() => {
          connect();
        }, delay);
      });
    }

    connect();
    return () => {
      active = false;
      es?.close();
      clearTimeout(retryTimer);
    };
  }, [roomId, userId, queryClient]);
}
