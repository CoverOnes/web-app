import { useMyBids, useWithdrawBid } from '../lib/query';
import { PipelineCard } from '../components/marketplace/PipelineCard';
import { PageHead } from '../components/layout/PageHead';
import { StatCard } from '../components/ui/StatCard';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { useState } from 'react';
import type { Bid } from '../lib/api/coverones';

type BidStatus = Bid['status'];

const PIPELINE_COLUMNS: { id: BidStatus | 'ALL'; label: string }[] = [
  { id: 'PENDING',   label: '已投標' },
  { id: 'ACCEPTED',  label: '得標' },
  { id: 'REJECTED',  label: '未得標' },
  { id: 'WITHDRAWN', label: '已撤回' },
];

const MyBidsPage = () => {
  const { data: bids, isLoading, isError } = useMyBids();
  const withdrawBid = useWithdrawBid();
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const handleWithdraw = async (bidId: string) => {
    setWithdrawingId(bidId);
    try {
      await withdrawBid.mutateAsync(bidId);
    } finally {
      setWithdrawingId(null);
    }
  };

  const pendingCount = bids?.filter((b) => b.status === 'PENDING').length ?? 0;
  const acceptedCount = bids?.filter((b) => b.status === 'ACCEPTED').length ?? 0;
  const totalCount = bids?.length ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--co-bg)', minHeight: '100%' }}>
      <PageHead
        crumb="主選單 / 招標進度"
        title="我的投標"
        description="追蹤所有進行中的投標案件"
      />

      {/* Stats */}
      <div style={{ padding: '16px 28px 0 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          <StatCard label="投標中" value={pendingCount} />
          <StatCard label="審核中" value={pendingCount} />
          <StatCard label="得標" value={acceptedCount} />
          <StatCard label="總計" value={totalCount} />
          <StatCard label="成功率" value={totalCount > 0 ? `${Math.round((acceptedCount / totalCount) * 100)}%` : '—'} />
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 28px 40px 28px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', gap: 12 }}>
            {PIPELINE_COLUMNS.map((col) => (
              <div key={col.id} style={{ flex: 1 }}>
                <LoadingSkeleton count={3} height="h-24" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={<Icon.X size={48} />}
            title="載入失敗"
            description="請重新整理頁面。"
          />
        ) : !bids || bids.length === 0 ? (
          <EmptyState
            icon={<Icon.MessageSquare size={48} />}
            title="尚無投標記錄"
            description="瀏覽案件看板並提交您的第一個投標。"
          />
        ) : (
          /* Pipeline kanban */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, alignItems: 'start' }}>
            {PIPELINE_COLUMNS.map((col) => {
              const colBids = bids.filter((b) => b.status === col.id);
              return (
                <div key={col.id}>
                  {/* Column header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 10,
                      padding: '0 2px',
                    }}
                  >
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--co-text-dim)' }}>
                      {col.label}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '1px 7px',
                        borderRadius: 999,
                        background: 'rgba(148,163,184,0.12)',
                        color: 'var(--co-text-muted)',
                        fontWeight: 500,
                      }}
                    >
                      {colBids.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div>
                    {colBids.length === 0 ? (
                      <div
                        style={{
                          padding: '16px 12px',
                          textAlign: 'center',
                          fontSize: 12,
                          color: 'var(--co-text-muted)',
                          border: '1px dashed var(--co-line)',
                          borderRadius: 9,
                        }}
                      >
                        無
                      </div>
                    ) : (
                      colBids.map((bid) => (
                        <div key={bid.id} style={{ position: 'relative' }}>
                          <PipelineCard bid={bid} />
                          {bid.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => handleWithdraw(bid.id)}
                              disabled={withdrawingId === bid.id}
                              aria-label={`撤回投標 ${bid.id.slice(0, 8)}`}
                              style={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                fontSize: 10,
                                padding: '2px 7px',
                                borderRadius: 5,
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                color: 'var(--co-red)',
                                cursor: 'pointer',
                                opacity: withdrawingId === bid.id ? 0.5 : 1,
                              }}
                            >
                              {withdrawingId === bid.id ? '...' : '撤回'}
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBidsPage;
