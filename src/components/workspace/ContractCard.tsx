import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../ui/StatusBadge';
import type { Contract } from '../../lib/api/coverones';
import { useAuthStore } from '../../store/authStore';

interface ContractCardProps {
  contract: Contract;
}

export function ContractCard({ contract }: ContractCardProps) {
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const role = contract.clientUserId === userId ? 'Client' : 'Freelancer';

  return (
    <div
      onClick={() => navigate(`/contracts/${contract.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') navigate(`/contracts/${contract.id}`);
      }}
      tabIndex={0}
      role="button"
      aria-label={`Contract: ${contract.title}`}
      style={{
        background: 'var(--co-bg-card-2)',
        border: '1px solid var(--co-line)',
        borderRadius: 'var(--radius-card)',
        padding: 16,
        cursor: 'pointer',
        transition: 'border-color 150ms ease-out',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50 hover:border-accent-500/40"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--co-text)', flex: 1 }}>
          {contract.title}
        </h3>
        <StatusBadge status={contract.status} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-accent)' }}>
          {contract.currency} {contract.amount}
        </span>
        <span
          style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 999,
            background: 'rgba(37,99,235,0.12)',
            color: '#93c5fd',
            fontWeight: 500,
          }}
        >
          {role}
        </span>
      </div>

      <p style={{ fontSize: 12, color: 'var(--co-text-dim)' }}>
        Counterparty: {role === 'Client' ? contract.freelancerUserId.slice(0, 8) : contract.clientUserId.slice(0, 8)}...
      </p>
    </div>
  );
}

export default ContractCard;
