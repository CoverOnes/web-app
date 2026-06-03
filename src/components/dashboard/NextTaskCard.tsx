import { useNavigate } from 'react-router-dom';
import { useNextTask } from '../../hooks/useNextTask';

type PriorityLevel = 'high' | 'medium' | 'low';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PRIORITY_CONFIG: Record<PriorityLevel, { label: string; bg: string; border: string; color: string }> = {
  high: {
    label: 'P1 高優先',
    bg: 'rgba(239,68,68,0.15)',
    border: 'rgba(239,68,68,0.4)',
    color: '#FCA5A5',
  },
  medium: {
    label: 'P2 中優先',
    bg: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.4)',
    color: '#FCD34D',
  },
  low: {
    label: 'P3+ 低優先',
    bg: 'rgba(34,211,238,0.15)',
    border: 'rgba(34,211,238,0.4)',
    color: '#67E8F9',
  },
};

function numericPriorityLevel(p: number | null): PriorityLevel | null {
  if (p === 1) return 'high';
  if (p === 2) return 'medium';
  if (p === null) return null;
  return 'low';
}

export function NextTaskCard() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useNextTask();

  const handleClick = () => {
    if (data?.task && UUID_RE.test(data.task.id)) {
      navigate(`/gtd?task_id=${encodeURIComponent(data.task.id)}`);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        style={{
          background: 'var(--co-bg-card-2)',
          border: '1px solid var(--co-line)',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--co-text-dim)', marginBottom: 12 }}>
          下一步任務
        </div>
        <div
          aria-label="載入中"
          style={{
            height: 14,
            borderRadius: 6,
            background: 'rgba(148,163,184,0.12)',
            marginBottom: 8,
            width: '80%',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <div
          style={{
            height: 12,
            borderRadius: 6,
            background: 'rgba(148,163,184,0.08)',
            width: '50%',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div
        style={{
          background: 'var(--co-bg-card-2)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--co-text-dim)', marginBottom: 8 }}>
          下一步任務
        </div>
        <div style={{ fontSize: 12, color: '#FCA5A5' }}>無法載入任務資料</div>
      </div>
    );
  }

  const task = data?.task ?? null;
  const priorityLevel = task ? numericPriorityLevel(task.priority) : null;
  const priorityCfg = priorityLevel ? PRIORITY_CONFIG[priorityLevel] : null;

  // No task placeholder
  if (!task) {
    return (
      <div
        style={{
          background: 'var(--co-bg-card-2)',
          border: '1px solid var(--co-line)',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          下一步任務
          <span style={{
            fontSize: 10.5, fontWeight: 600,
            padding: '2px 8px', borderRadius: 999,
            background: 'rgba(34,211,238,0.12)',
            border: '1px solid rgba(34,211,238,0.25)',
            color: '#67E8F9',
          }}>
            GTD
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '18px 0', flexDirection: 'column', gap: 6,
        }}>
          <span style={{ fontSize: 22 }}>✓</span>
          <span style={{ fontSize: 12.5, color: 'var(--co-text-dim)' }}>
            沒有待辦任務
          </span>
        </div>
      </div>
    );
  }

  // Task card
  return (
    <button
      onClick={handleClick}
      aria-label={`前往 GTD 任務：${task.title}`}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-[12px]"
      style={{
        width: '100%',
        background: 'var(--co-bg-card-2)',
        border: '1px solid var(--co-line)',
        borderRadius: 12,
        padding: 16,
        cursor: 'pointer',
        color: 'inherit',
        textAlign: 'left',
        transition: 'border-color 150ms',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.4)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--co-line)';
      }}
    >
      <div style={{
        fontSize: 13, fontWeight: 600, marginBottom: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        下一步任務
        <span style={{
          fontSize: 10.5, fontWeight: 600,
          padding: '2px 8px', borderRadius: 999,
          background: 'rgba(34,211,238,0.12)',
          border: '1px solid rgba(34,211,238,0.25)',
          color: '#67E8F9',
        }}>
          GTD
        </span>
      </div>

      {/* Priority badge */}
      {priorityCfg && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 8px', borderRadius: 999,
          background: priorityCfg.bg,
          border: `1px solid ${priorityCfg.border}`,
          color: priorityCfg.color,
          fontSize: 10.5, fontWeight: 600,
          marginBottom: 8,
        }}>
          {priorityCfg.label}
        </span>
      )}

      {/* Task title */}
      <div style={{
        fontSize: 13.5,
        fontWeight: 600,
        lineHeight: 1.4,
        color: 'var(--co-text)',
        marginBottom: 10,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {task.title}
      </div>

      {/* Footer hint */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        fontSize: 11, color: 'var(--co-text-dim)',
      }}>
        點擊前往 GTD →
      </div>
    </button>
  );
}

export default NextTaskCard;
