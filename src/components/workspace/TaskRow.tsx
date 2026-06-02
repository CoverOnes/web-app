import { StatusBadge } from '../ui/StatusBadge';
import { Select } from '../ui/Select';
import type { Task, TaskStatus } from '../../lib/api/coverones';

interface TaskRowProps {
  task: Task;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  isUpdating: boolean;
}

// WA-M2: backend task statuses are TODO, DOING, DONE (not IN_PROGRESS)
const STATUS_OPTIONS = [
  { value: 'TODO', label: 'To Do' },
  { value: 'DOING', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
];

export function TaskRow({ task, onStatusChange, isUpdating }: TaskRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid var(--color-main-border)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--color-main-text)' }}>
          {task.title}
        </p>
        {task.assigneeUserId && (
          <p style={{ fontSize: 11, color: 'var(--color-main-text-dim)', marginTop: 2 }}>
            Assignee: {task.assigneeUserId.slice(0, 8)}...
          </p>
        )}
      </div>

      <StatusBadge status={task.status} />

      <Select
        id={`task-status-${task.id}`}
        options={STATUS_OPTIONS}
        value={task.status}
        onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
        disabled={isUpdating}
        aria-label={`Update status for ${task.title}`}
        containerClassName="w-36"
      />
    </div>
  );
}

export default TaskRow;
