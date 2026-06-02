import { useQuery } from '@tanstack/react-query';
import { chatApi } from '@/lib/api/chat';

export function useMessages(roomId: string, userId: string) {
  return useQuery({
    queryKey: ['messages', roomId],
    queryFn: () => chatApi.getMessages(roomId, userId, 50),
    staleTime: 30_000,
    enabled: !!roomId && !!userId,
  });
}
