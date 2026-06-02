import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { CreateTaskRequest } from '../../lib/api/coverones';

interface AddTaskFormProps {
  onSubmit: (data: CreateTaskRequest) => void;
  isSubmitting: boolean;
}

export function AddTaskForm({ onSubmit, isSubmitting }: AddTaskFormProps) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [assigneeUserId, setAssigneeUserId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    setError('');
    onSubmit({
      title: title.trim(),
      assigneeUserId: assigneeUserId.trim() || undefined,
    });
    setTitle('');
    setAssigneeUserId('');
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setExpanded(true)} aria-label="Add a task">
        + Add Task
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
      {error && (
        <p role="alert" style={{ fontSize: 12, color: '#FCA5A5' }}>{error}</p>
      )}
      <Input
        label="Task Title"
        id="new-task-title"
        placeholder="e.g. Design mockup"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <Input
        label="Assignee User ID (optional)"
        id="new-task-assignee"
        placeholder="uuid"
        value={assigneeUserId}
        onChange={(e) => setAssigneeUserId(e.target.value)}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <Button type="submit" variant="primary" size="sm" loading={isSubmitting}>
          Add Task
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default AddTaskForm;
