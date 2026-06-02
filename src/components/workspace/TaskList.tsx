import { useState } from 'react';
import { TaskRow } from './TaskRow';
import { AddTaskForm } from './AddTaskForm';
import { EmptyState } from '../ui/EmptyState';
import type { Task, TaskStatus } from '../../lib/api/coverones';

interface TaskListProps {
  tasks: Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onAddTask: (data: { title: string; assigneeUserId?: string }) => void;
  isUpdating: boolean;
  isAdding: boolean;
}

type FilterTab = 'ALL' | TaskStatus;

// WA-M2: DOING replaces IN_PROGRESS to match backend task statuses
const TABS: { id: FilterTab; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'TODO', label: 'To Do' },
  { id: 'DOING', label: 'In Progress' },
  { id: 'DONE', label: 'Done' },
];

export function TaskList({ tasks, onStatusChange, onAddTask, isUpdating, isAdding }: TaskListProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const filtered = activeTab === 'ALL' ? tasks : tasks.filter((t) => t.status === activeTab);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* WA-m1: accessible tab strip with role=tablist + role=tab + aria-selected */}
      <div role="tablist" aria-label="Filter tasks by status" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => {
              const idx = TABS.findIndex((t) => t.id === tab.id);
              if (e.key === 'ArrowRight') {
                const next = TABS[(idx + 1) % TABS.length];
                setActiveTab(next.id);
              } else if (e.key === 'ArrowLeft') {
                const prev = TABS[(idx - 1 + TABS.length) % TABS.length];
                setActiveTab(prev.id);
              }
            }}
            style={{
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 500,
              border: '1px solid var(--color-main-border)',
              background: activeTab === tab.id ? 'var(--color-accent)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--color-main-text-dim)',
              cursor: 'pointer',
              transition: 'background 150ms',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {filtered.length === 0 ? (
          <EmptyState title="No tasks" description="No tasks match the selected filter." />
        ) : (
          filtered.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              isUpdating={isUpdating}
            />
          ))
        )}
      </div>

      <AddTaskForm onSubmit={onAddTask} isSubmitting={isAdding} />
    </div>
  );
}

export default TaskList;
