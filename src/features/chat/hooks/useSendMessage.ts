import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/lib/api/chat';

type SendMessageVars = Parameters<typeof chatApi.sendMessage>[0];

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.sendMessage,
    onMutate: async (vars: SendMessageVars) => {
      await queryClient.cancelQueries({ queryKey: ['messages', vars.room_id] });
      const snapshot = queryClient.getQueryData(['messages', vars.room_id]);
      return { snapshot };
    },
    onError: (_err, vars: SendMessageVars, ctx) => {
      if (ctx?.snapshot) {
        queryClient.setQueryData(['messages', vars.room_id], ctx.snapshot);
      }
    },
    onSettled: (_data, _err, vars: SendMessageVars) => {
      void queryClient.invalidateQueries({ queryKey: ['messages', vars.room_id] });
    },
  });
}
