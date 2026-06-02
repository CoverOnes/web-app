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

const variantMap: Record<StatusVariant, { bg: string; text: string; label: string }> = {
  OPEN:              { bg: '#dcfce7', text: '#16a34a', label: 'Open' },
  AWARDED:           { bg: '#fef3c7', text: '#d97706', label: 'Awarded' },
  CLOSED:            { bg: '#f1f5f9', text: '#64748b', label: 'Closed' },
  PENDING:           { bg: '#fef3c7', text: '#d97706', label: 'Pending' },
  ACCEPTED:          { bg: '#dcfce7', text: '#16a34a', label: 'Accepted' },
  REJECTED:          { bg: '#fee2e2', text: '#dc2626', label: 'Rejected' },
  WITHDRAWN:         { bg: '#f1f5f9', text: '#64748b', label: 'Withdrawn' },
  ACTIVE:            { bg: '#dcfce7', text: '#16a34a', label: 'Active' },
  PENDING_SIGNATURE: { bg: '#fef3c7', text: '#d97706', label: 'Pending Signature' },
  SIGNED:            { bg: '#eff6ff', text: '#4f46e5', label: 'Signed' },
  COMPLETED:         { bg: '#eff6ff', text: '#2563eb', label: 'Completed' },
  CANCELLED:         { bg: '#fee2e2', text: '#dc2626', label: 'Cancelled' }, // WA-M1: double L
  DRAFT:             { bg: '#f1f5f9', text: '#64748b', label: 'Draft' },
  TODO:              { bg: '#f1f5f9', text: '#64748b', label: 'To Do' },
  DOING:             { bg: '#fef3c7', text: '#d97706', label: 'In Progress' }, // WA-M2: DOING maps to friendly label
  DONE:              { bg: '#dcfce7', text: '#16a34a', label: 'Done' },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const v = variantMap[status] ?? { bg: '#f1f5f9', text: '#64748b', label: status };
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
