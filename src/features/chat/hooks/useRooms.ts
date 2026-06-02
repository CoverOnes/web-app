import { useQuery } from '@tanstack/react-query';
import { chatApi } from '@/lib/api/chat';

export function useRooms(userId: string) {
  return useQuery({
    queryKey: ['rooms', userId],
    queryFn: () => chatApi.getRooms(userId, 50),
    staleTime: 60_000,
    enabled: !!userId,
  });
}
