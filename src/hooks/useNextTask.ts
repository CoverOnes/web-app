import { useQuery } from '@tanstack/react-query';
import wbtHttp from '../lib/api/wbt';

export interface Task {
  id: string;
  title: string;
  // Backend sends numeric priority (1=P1 high, 2=P2 medium, 3+=P3 low) from db.Task.Priority (pgtype.Int4).
  priority: number | null;
  status: string;
  due_date?: string;
}

interface NextTaskResponse {
  task: Task | null;
}

async function fetchNextTask(): Promise<NextTaskResponse> {
  const response = await wbtHttp.get<NextTaskResponse>('/dashboard/next-task');
  return response.data;
}

export function useNextTask() {
  return useQuery({
    queryKey: ['dashboard', 'next-task'],
    queryFn: fetchNextTask,
    staleTime: 30_000,
  });
}
