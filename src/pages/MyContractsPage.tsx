import { useState } from 'react';
import { useContracts } from '../lib/query';
import { ContractCard } from '../components/workspace/ContractCard';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import type { ContractStatus } from '../lib/api/coverones';

type FilterOption = 'ALL' | ContractStatus;

const FILTER_TABS: { id: FilterOption; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'PENDING_SIGNATURE', label: 'Pending Signature' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'COMPLETED', label: 'Completed' },
];

const MyContractsPage = () => {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL');
  const { data: contracts, isLoading, isError } = useContracts(
    activeFilter !== 'ALL' ? activeFilter : undefined
  );

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-main-text)', marginBottom: 20, letterSpacing: '-0.02em' }}>
        Contracts
      </h1>

      {/* WA-m1: accessible filter tab strip */}
      <div role="tablist" aria-label="Filter contracts by status" style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeFilter === tab.id}
            onClick={() => setActiveFilter(tab.id)}
            onKeyDown={(e) => {
              const idx = FILTER_TABS.findIndex((t) => t.id === tab.id);
              if (e.key === 'ArrowRight') {
                setActiveFilter(FILTER_TABS[(idx + 1) % FILTER_TABS.length].id);
              } else if (e.key === 'ArrowLeft') {
                setActiveFilter(FILTER_TABS[(idx - 1 + FILTER_TABS.length) % FILTER_TABS.length].id);
              }
            }}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 500,
              border: '1px solid var(--color-main-border)',
              background: activeFilter === tab.id ? 'var(--color-accent)' : 'transparent',
              color: activeFilter === tab.id ? '#fff' : 'var(--color-main-text-dim)',
              cursor: 'pointer',
              transition: 'background 150ms',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          <LoadingSkeleton count={4} height="h-28" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={<Icon.X size={48} />}
          title="Failed to load contracts"
          description="Something went wrong. Please refresh."
        />
      ) : !contracts || contracts.length === 0 ? (
        <EmptyState
          icon={<Icon.File size={48} />}
          title="No contracts"
          description="Contracts will appear here after a bid is accepted."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {contracts.map((contract) => (
            <ContractCard key={contract.id} contract={contract} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyContractsPage;
