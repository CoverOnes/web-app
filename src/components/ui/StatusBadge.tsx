type StatusVariant =
  | 'OPEN'
  | 'AWARDED'
  | 'CLOSED'
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'ACTIVE'
  | 'PENDING_SIGNATURE'
  | 'SIGNED'
  | 'COMPLETED'
  | 'CANCELLED'   // WA-M1: backend/SQL uses 'CANCELLED' (double L)
  | 'DRAFT'
  | 'TODO'
  | 'DOING'       // WA-M2: backend uses 'DOING' not 'IN_PROGRESS'
  | 'DONE';

interface StatusBadgeProps {
  status: StatusVariant;
  className?: string;
}

// bg/text values reference CSS tokens defined in src/index.css (--co-status-*).
// All tokens use dark-appropriate values: translucent bg + bright readable text
// matching the app's #060A14 dark canvas.
const variantMap: Record<StatusVariant, { bg: string; text: string; label: string }> = {
  OPEN:              { bg: 'var(--co-status-green-bg)',   text: 'var(--co-status-green-text)',   label: 'Open' },
  AWARDED:           { bg: 'var(--co-status-amber-bg)',   text: 'var(--co-status-amber-text)',   label: 'Awarded' },
  CLOSED:            { bg: 'var(--co-status-neutral-bg)', text: 'var(--co-status-neutral-text)', label: 'Closed' },
  PENDING:           { bg: 'var(--co-status-amber-bg)',   text: 'var(--co-status-amber-text)',   label: 'Pending' },
  ACCEPTED:          { bg: 'var(--co-status-green-bg)',   text: 'var(--co-status-green-text)',   label: 'Accepted' },
  REJECTED:          { bg: 'var(--co-status-red-bg)',     text: 'var(--co-status-red-text)',     label: 'Rejected' },
  WITHDRAWN:         { bg: 'var(--co-status-neutral-bg)', text: 'var(--co-status-neutral-text)', label: 'Withdrawn' },
  ACTIVE:            { bg: 'var(--co-status-green-bg)',   text: 'var(--co-status-green-text)',   label: 'Active' },
  PENDING_SIGNATURE: { bg: 'var(--co-status-amber-bg)',   text: 'var(--co-status-amber-text)',   label: 'Pending Signature' },
  SIGNED:            { bg: 'var(--co-status-indigo-bg)',  text: 'var(--co-status-indigo-text)',  label: 'Signed' },
  COMPLETED:         { bg: 'var(--co-status-indigo-bg)',  text: 'var(--co-status-indigo-text)',  label: 'Completed' },
  CANCELLED:         { bg: 'var(--co-status-red-bg)',     text: 'var(--co-status-red-text)',     label: 'Cancelled' }, // WA-M1: double L
  DRAFT:             { bg: 'var(--co-status-neutral-bg)', text: 'var(--co-status-neutral-text)', label: 'Draft' },
  TODO:              { bg: 'var(--co-status-neutral-bg)', text: 'var(--co-status-neutral-text)', label: 'To Do' },
  DOING:             { bg: 'var(--co-status-amber-bg)',   text: 'var(--co-status-amber-text)',   label: 'In Progress' }, // WA-M2: DOING maps to friendly label
  DONE:              { bg: 'var(--co-status-green-bg)',   text: 'var(--co-status-green-text)',   label: 'Done' },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const v = variantMap[status] ?? { bg: 'var(--co-status-neutral-bg)', text: 'var(--co-status-neutral-text)', label: status };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{ background: v.bg, color: v.text }}
    >
      {v.label}
    </span>
  );
}

export default StatusBadge;
