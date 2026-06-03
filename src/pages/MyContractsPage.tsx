import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContracts } from '../lib/query';
import { ContractRow } from '../components/workspace/ContractRow';
import { PageHead } from '../components/layout/PageHead';
import { StatCard } from '../components/ui/StatCard';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import type { ContractStatus } from '../lib/api/coverones';

type FilterOption = 'ALL' | ContractStatus;

const FILTER_TABS: { id: FilterOption; label: string }[] = [
  { id: 'ALL',               label: '全部' },
  { id: 'PENDING_SIGNATURE', label: '待簽署' },
  { id: 'ACTIVE',            label: '執行中' },
  { id: 'COMPLETED',         label: '已完成' },
];

const MyContractsPage = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL');
  const { data: contracts, isLoading, isError } = useContracts(
    activeFilter !== 'ALL' ? activeFilter : undefined
  );

  const activeCount = contracts?.filter((c) => c.status === 'ACTIVE').length ?? 0;
  const pendingCount = contracts?.filter((c) => c.status === 'PENDING_SIGNATURE').length ?? 0;
  const completedCount = contracts?.filter((c) => c.status === 'COMPLETED').length ?? 0;
  const totalCount = contracts?.length ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--co-bg)', minHeight: '100%' }}>
      <PageHead
        crumb="主選單 / 合約管理"
        title="合約管理"
      />

      {/* Stats */}
      <div style={{ padding: '16px 28px 0 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <StatCard label="執行中" value={activeCount} />
          <StatCard label="待簽署" value={pendingCount} />
          <StatCard label="本月收款" value="—" />
          <StatCard label="完成率" value={totalCount > 0 ? `${Math.round((completedCount / totalCount) * 100)}%` : '—'} />
        </div>
      </div>

      {/* Filter bar */}
      <div
        role="tablist"
        aria-label="依狀態篩選合約"
        style={{
          display: 'flex',
          gap: 8,
          padding: '16px 28px 0 28px',
          flexWrap: 'wrap',
        }}
      >
        {FILTER_TABS.map((tab, idx) => {
          const isOn = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              id={`contracts-tab-${tab.id}`}
              role="tab"
              aria-selected={isOn}
              aria-controls={`contracts-panel-${tab.id}`}
              onClick={() => setActiveFilter(tab.id)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') setActiveFilter(FILTER_TABS[(idx + 1) % FILTER_TABS.length].id);
                else if (e.key === 'ArrowLeft') setActiveFilter(FILTER_TABS[(idx - 1 + FILTER_TABS.length) % FILTER_TABS.length].id);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: isOn ? 600 : 500,
                border: `1px solid ${isOn ? 'var(--co-accent)' : 'var(--co-line-strong)'}`,
                background: isOn ? 'rgba(99,102,241,0.18)' : 'var(--co-bg-3)',
                color: isOn ? '#C7D2FE' : 'var(--co-text-dim)',
                cursor: 'pointer',
                transition: 'background 150ms, border-color 150ms, color 150ms',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`contracts-panel-${activeFilter}`}
        aria-labelledby={`contracts-tab-${activeFilter}`}
        style={{ flex: 1, padding: '16px 28px 40px 28px' }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <LoadingSkeleton count={5} height="h-16" />
          </div>
        ) : isError ? (
          <EmptyState
            icon={<Icon.X size={48} />}
            title="載入失敗"
            description="請重新整理頁面。"
          />
        ) : !contracts || contracts.length === 0 ? (
          <EmptyState
            icon={<Icon.File size={48} />}
            title="目前沒有合約"
            description="投標被接受後，合約將出現在這裡。"
          />
        ) : (
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '44px 1fr auto auto auto auto',
                gap: 16,
                padding: '10px 18px',
                borderBottom: '1px solid var(--co-line)',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--co-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <div />
              <div>合約</div>
              <div>編號</div>
              <div style={{ textAlign: 'right' }}>金額</div>
              <div>日期</div>
              <div>狀態</div>
            </div>

            {/* Rows */}
            {contracts.map((contract) => (
              <ContractRow
                key={contract.id}
                contract={contract}
                onClick={() => navigate(`/contracts/${contract.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyContractsPage;
