import { useAuthStore } from '../../store/authStore';
import { LogoSquare } from '../ui/LogoSquare';
import { StatusBadge } from '../ui/StatusBadge';
import type { Contract } from '../../lib/api/coverones';

interface ContractRowProps {
  contract: Contract;
  onClick: () => void;
}

export function ContractRow({ contract, onClick }: ContractRowProps) {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const role = contract.clientUserId === userId ? 'Client' : 'Freelancer';
  const letter = contract.title.charAt(0).toUpperCase();

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      tabIndex={0}
      role="button"
      aria-label={`Contract: ${contract.title}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '44px 1fr auto auto auto auto',
        alignItems: 'center',
        gap: 16,
        padding: '14px 18px',
        borderBottom: '1px solid var(--co-line)',
        cursor: 'pointer',
        transition: 'background 150ms',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.05)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {/* Logo */}
      <LogoSquare letter={letter} size={38} />

      {/* Title + subtitle */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--co-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {contract.title}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--co-text-muted)', marginTop: 2 }}>
          {role}
        </div>
      </div>

      {/* Contract number */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--co-text-muted)',
          whiteSpace: 'nowrap',
        }}
      >
        #{contract.id.slice(0, 8)}
      </div>

      {/* Amount */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--co-text)',
          textAlign: 'right',
          whiteSpace: 'nowrap',
        }}
      >
        {contract.currency} {contract.amount}
      </div>

      {/* Created date */}
      <div style={{ fontSize: 12, color: 'var(--co-text-muted)', whiteSpace: 'nowrap' }}>
        {(() => {
          try {
            return new Date(contract.createdAt).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
          } catch {
            return '';
          }
        })()}
      </div>

      {/* Status badge */}
      <StatusBadge status={contract.status} />
    </div>
  );
}

export default ContractRow;
