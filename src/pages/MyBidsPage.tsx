import { useState, useEffect } from 'react';
import { useMyBids, useWithdrawBid } from '../lib/query';
import { useAuthStore } from '../store/authStore';
import { PipelineCard } from '../components/marketplace/PipelineCard';
import { PageHead } from '../components/layout/PageHead';
import { StatCard } from '../components/ui/StatCard';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import type { Bid } from '../lib/api/coverones';
import { stepsForBid } from './MyBidsPage.utils';

type BidStatus = Bid['status'];

// ─── Pipeline column definitions (real API statuses only) ──────────────────
// The mockup shows 5 columns (追蹤中, 準備提案, 已投標, 已得標, 未得標 / 已撤回).
// The backend only supports PENDING | ACCEPTED | REJECTED | WITHDRAWN — we map
// 4 real statuses. "追蹤中" and "準備提案" have no API equivalent and are omitted.
const PIPELINE_COLUMNS: {
  id: BidStatus;
  label: string;
  dot: string;
  borderAlt: string;
}[] = [
  { id: 'PENDING',   label: '已投標',  dot: '#A78BFA', borderAlt: 'rgba(99,102,241,0.4)' },
  { id: 'ACCEPTED',  label: '已得標',  dot: '#10B981', borderAlt: 'rgba(16,185,129,0.4)' },
  { id: 'REJECTED',  label: '未得標',  dot: '#EF4444', borderAlt: 'rgba(239,68,68,0.3)'  },
  { id: 'WITHDRAWN', label: '已撤回',  dot: '#64748B', borderAlt: 'rgba(100,116,139,0.3)' },
];

// ─── Stepper component ─────────────────────────────────────────────────────
function BidStepper({ bid }: { bid: Bid }) {
  const steps = stepsForBid(bid);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${steps.length}, 1fr)`,
        gap: 4,
        margin: '10px 0 14px',
        position: 'relative',
      }}
      role="list"
      aria-label="投標進度"
    >
      {steps.map((step, i) => {
        const isDone = step.state === 'done';
        const isNow  = step.state === 'now';
        const isLast = i === steps.length - 1;
        return (
          // key={i} — steps are a static ordered list; index is stable and safe here.
          // key={step.label} would be fragile because WITHDRAWN step 5 has label '—'.
          <div key={i} style={{ position: 'relative', textAlign: 'center' }} role="listitem">
            {/* Connector line (except last step) */}
            {!isLast && (
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 15,
                  left: '50%',
                  right: '-50%',
                  height: 2,
                  background: isDone ? 'var(--co-green)' : 'var(--co-line-strong)',
                  zIndex: 0,
                }}
              />
            )}
            {/* Ring */}
            <div
              aria-hidden="true"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                margin: '0 auto 6px',
                position: 'relative',
                zIndex: 1,
                background: isDone ? 'var(--co-green)' : isNow ? 'var(--co-accent)' : 'var(--co-bg-3)',
                border: isNow ? 'none' : isDone ? 'none' : '2px solid var(--co-line-strong)',
                color: isDone || isNow ? '#fff' : 'var(--co-text-dim)',
                boxShadow: isNow ? '0 0 0 4px rgba(99,102,241,0.2)' : 'none',
              }}
            >
              {isDone ? '✓' : i + 1}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: isDone || isNow ? 'var(--co-text)' : 'var(--co-text-dim)',
              }}
            >
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── WithdrawButton ────────────────────────────────────────────────────────
// Inline confirm: first click shows "確定撤回?" + cancel; second click fires.
// This prevents accidental destructive actions without a modal overlay.
interface WithdrawButtonProps {
  bidId: string;
  isWithdrawing: boolean;
  onConfirm: (id: string) => void;
  /** Size variant: 'sm' for the kanban overlay button, 'md' for the focus card. */
  size?: 'sm' | 'md';
  withdrawError?: string | null;
}

function WithdrawButton({ bidId, isWithdrawing, onConfirm, size = 'md', withdrawError }: WithdrawButtonProps) {
  const [confirming, setConfirming] = useState(false);

  // Auto-dismiss the confirm state after 8 s to prevent "確定撤回?" buttons
  // persisting forever after an accidental first click.
  useEffect(() => {
    if (!confirming) return;
    const tid = setTimeout(() => setConfirming(false), 8_000);
    return () => clearTimeout(tid);
  }, [confirming]);

  const handleClick = () => {
    if (isWithdrawing) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    onConfirm(bidId);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirming(false);
  };

  if (confirming) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <button
          type="button"
          onClick={handleClick}
          aria-label={`確定撤回投標 ${bidId.slice(0, 8)}`}
          style={{
            height: size === 'sm' ? 22 : 34,
            padding: size === 'sm' ? '0 6px' : '0 12px',
            borderRadius: 8,
            background: 'rgba(239,68,68,0.18)',
            border: '1px solid rgba(239,68,68,0.4)',
            color: 'var(--co-red)',
            fontSize: size === 'sm' ? 10 : 12.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          確定撤回?
        </button>
        <button
          type="button"
          onClick={handleCancel}
          aria-label="取消撤回"
          style={{
            height: size === 'sm' ? 22 : 34,
            padding: size === 'sm' ? '0 5px' : '0 10px',
            borderRadius: 8,
            background: 'rgba(148,163,184,0.1)',
            border: '1px solid var(--co-line)',
            color: 'var(--co-text-dim)',
            fontSize: size === 'sm' ? 10 : 12.5,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          取消
        </button>
        {withdrawError && (
          <span style={{ fontSize: 11, color: 'var(--co-red)', marginLeft: 4 }}>
            {withdrawError}
          </span>
        )}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isWithdrawing}
      aria-label={isWithdrawing ? '撤回中' : `撤回投標 ${bidId.slice(0, 8)}`}
      style={{
        height: size === 'sm' ? 22 : 34,
        padding: size === 'sm' ? '0 6px' : '0 12px',
        borderRadius: size === 'sm' ? 5 : 8,
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.2)',
        color: 'var(--co-red)',
        fontSize: size === 'sm' ? 10 : 12.5,
        fontWeight: 600,
        cursor: isWithdrawing ? 'default' : 'pointer',
        opacity: isWithdrawing ? 0.5 : 1,
      }}
    >
      {isWithdrawing ? (size === 'sm' ? '…' : '撤回中…') : (size === 'sm' ? '撤回' : '撤回投標')}
    </button>
  );
}

// ─── Focus card ────────────────────────────────────────────────────────────
// Shows real bid data. Sections that require a non-existent API
// (competitor count, win probability, activity log) are replaced with EmptyState.
function BidFocusCard({ bid, onWithdraw, isWithdrawing, withdrawError }: {
  bid: Bid;
  onWithdraw: (id: string) => void;
  isWithdrawing: boolean;
  withdrawError: string | null;
}) {
  return (
    <div
      style={{
        background: 'var(--co-bg-card)',
        border: '1px solid var(--co-line-strong)',
        borderRadius: 14,
        padding: '18px',
        marginBottom: 14,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          marginBottom: 14,
          paddingBottom: 14,
          borderBottom: '1px solid var(--co-line)',
          flexWrap: 'wrap',
        }}
      >
        {/* Logo square */}
        <div
          aria-hidden="true"
          className="co-lg co-lg-blue"
          style={{ width: 56, height: 56, fontSize: 18, flexShrink: 0 }}
        >
          標
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--co-text)', lineHeight: 1.3 }}>
            {/* Title: we only have listingId from the Bid; the full listing title
                would require a GET /listings/:id call. We show the ref ID here to
                avoid N+1 fetches and to avoid inventing data. */}
            投標案 #{bid.listingId.slice(0, 8)}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--co-text-dim)', marginTop: 2 }}>
            投標 ID · {bid.id.slice(0, 8)}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 999,
                background: 'var(--co-bdg-dev-bg)',
                color: 'var(--co-bdg-dev-text)',
                border: '1px solid var(--co-bdg-dev-border)',
                fontWeight: 500,
              }}
            >
              {bid.status === 'PENDING'   && '已投標 · 評估中'}
              {bid.status === 'ACCEPTED'  && '✓ 中標'}
              {bid.status === 'REJECTED'  && '未中標'}
              {bid.status === 'WITHDRAWN' && '已撤回'}
            </span>
          </div>
        </div>

        {/* Actions */}
        {bid.status === 'PENDING' && (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
            <WithdrawButton
              bidId={bid.id}
              isWithdrawing={isWithdrawing}
              onConfirm={onWithdraw}
              size="md"
              withdrawError={withdrawError}
            />
          </div>
        )}
      </div>

      {/* Stepper (derived from bid.status — real data) */}
      <BidStepper bid={bid} />

      {/* Detail grid — only real fields: amount, currency, message */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: 12,
        }}
      >
        <div
          style={{
            background: 'rgba(15,23,42,0.5)',
            border: '1px solid var(--co-line)',
            borderRadius: 10,
            padding: 12,
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--co-text-dim)' }}>投標金額</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4, color: 'var(--co-green)', letterSpacing: '-0.01em' }}>
            {bid.currency} {Number(bid.amount).toLocaleString()}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(15,23,42,0.5)',
            border: '1px solid var(--co-line)',
            borderRadius: 10,
            padding: 12,
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--co-text-dim)' }}>幣別</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4, color: 'var(--co-text)', letterSpacing: '-0.01em' }}>
            {bid.currency}
          </div>
        </div>

        {bid.message && (
          <div
            style={{
              background: 'rgba(15,23,42,0.5)',
              border: '1px solid var(--co-line)',
              borderRadius: 10,
              padding: 12,
              gridColumn: 'span 2',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--co-text-dim)', marginBottom: 4 }}>投標留言</div>
            <div style={{ fontSize: 13, color: 'var(--co-text)', lineHeight: 1.5, wordBreak: 'break-word' }}>
              {bid.message}
            </div>
          </div>
        )}
      </div>

      {/* Activity log — no API endpoint exists; show EmptyState */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--co-text)', marginBottom: 8 }}>
          案件動態
        </div>
        <div
          style={{
            background: 'var(--co-bg-card)',
            border: '1px solid var(--co-line)',
            borderRadius: 12,
          }}
        >
          <EmptyState
            icon={<Icon.MessageSquare size={36} />}
            title="案件動態尚未開放"
            description="即時更新與訊息通知功能即將上線。"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
const MyBidsPage = () => {
  // Auth-hydration guard (same pattern as before — see lib/query.ts useMyBids comment).
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const { data: bids, isLoading, isError, isPending, fetchStatus } = useMyBids();
  const withdrawBid = useWithdrawBid();
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [selectedBidId, setSelectedBidId] = useState<string | null>(null);

  const showLoading =
    isLoading || isHydrating || (isPending && fetchStatus === 'idle' && !bids);

  const handleWithdraw = async (bidId: string) => {
    setWithdrawingId(bidId);
    setWithdrawError(null);
    try {
      await withdrawBid.mutateAsync(bidId);
      // Clear focus if the withdrawn bid was selected
      if (selectedBidId === bidId) setSelectedBidId(null);
    } catch {
      setWithdrawError('撤回失敗，請稍後再試。');
    } finally {
      setWithdrawingId(null);
    }
  };

  // Stats derived from real data only.
  // "winRate" — renamed from "本月得標率" to "整體得標率" because there is no
  // date filter applied; the rate spans all bids, not just the current month.
  const pendingCount  = bids?.filter((b) => b.status === 'PENDING').length   ?? 0;
  const acceptedCount = bids?.filter((b) => b.status === 'ACCEPTED').length  ?? 0;
  const rejectedCount = bids?.filter((b) => b.status === 'REJECTED').length  ?? 0;
  const totalCount    = bids?.length ?? 0;
  const winRate: number | null = totalCount > 0 ? Math.round((acceptedCount / totalCount) * 100) : null;

  // Determine the focused bid:
  // 1. selectedBidId match (user clicked a card)
  // 2. first PENDING bid (defaults to most actionable)
  // 3. first bid in the list
  const focusBid: Bid | null = (() => {
    if (!bids || bids.length === 0) return null;
    if (selectedBidId) {
      const found = bids.find((b) => b.id === selectedBidId);
      if (found) return found;
    }
    return bids.find((b) => b.status === 'PENDING') ?? bids[0];
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--co-bg)', minHeight: '100%' }}>
      <PageHead
        crumb="主選單 / 招標進度"
        title="招標進度 · 我的投標管理"
        description={
          bids && bids.length > 0
            ? <>共 <b style={{ color: 'var(--co-text)' }}>{totalCount}</b> 個案件 · <b style={{ color: '#6EE7B7' }}>{acceptedCount}</b> 個已得標</>
            : '追蹤所有進行中的投標案件'
        }
      />

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 28px 0' }}>
        <div
          className="stat-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 12,
            marginBottom: 14,
          }}
        >
          <StatCard label="投標中"    value={pendingCount}  />
          {/* Label is "整體得標率" (not "本月得標率") because no date filter is applied. */}
          <StatCard label="整體得標率" value={winRate !== null ? `${winRate}%` : '—'} />
          {/* Contract total: no aggregate endpoint — placeholder. */}
          <StatCard label="合約金額 (累計)" value="—" />
          <StatCard label="得標件數"   value={acceptedCount} />
          <StatCard label="未得標"     value={rejectedCount} />
        </div>
      </div>

      {/*
        ── Two-column layout (pipeline left, focus panel right) ───────────────
        On mobile the two columns stack vertically (via .bids-layout class).
      */}
      <div
        className="bids-layout"
        style={{
          flex: 1,
          padding: '0 28px 40px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) 320px',
          gap: 22,
          alignItems: 'start',
        }}
      >
        {/* ── LEFT: pipeline kanban ───────────────────────────────────────── */}
        <div>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              margin: '16px 0 10px',
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              color: 'var(--co-text)',
            }}
          >
            投標管線
            <span style={{ fontSize: 11.5, color: 'var(--co-text-dim)', fontWeight: 400 }}>
              · Pipeline View
            </span>
          </h2>

          {showLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {PIPELINE_COLUMNS.map((col) => (
                <div key={col.id}>
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
            <div
              className="pipeline-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4,1fr)',
                gap: 12,
                alignItems: 'start',
              }}
            >
              {PIPELINE_COLUMNS.map((col) => {
                const colBids = bids.filter((b) => b.status === col.id);
                return (
                  <div
                    key={col.id}
                    role="region"
                    aria-label={col.label}
                    style={{
                      background: 'var(--co-bg-card)',
                      border: '1px solid var(--co-line-strong)',
                      borderRadius: 12,
                      padding: 12,
                      minHeight: 180,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Column header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                        padding: '0 4px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: 'var(--co-text)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: col.dot,
                            flexShrink: 0,
                            display: 'inline-block',
                          }}
                        />
                        {col.label}
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--co-text-dim)',
                          padding: '1px 7px',
                          borderRadius: 999,
                          background: 'rgba(148,163,184,0.12)',
                          fontWeight: 600,
                        }}
                      >
                        {colBids.length}
                      </span>
                    </div>

                    {/* Cards */}
                    <div style={{ flex: 1 }}>
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
                            <PipelineCard
                              bid={bid}
                              isSelected={focusBid?.id === bid.id}
                              onClick={() => setSelectedBidId(bid.id)}
                            />
                            {bid.status === 'PENDING' && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 10,
                                  right: 10,
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <WithdrawButton
                                  bidId={bid.id}
                                  isWithdrawing={withdrawingId === bid.id}
                                  onConfirm={handleWithdraw}
                                  size="sm"
                                  withdrawError={withdrawingId === bid.id ? withdrawError : null}
                                />
                              </div>
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

        {/* ── RIGHT: focus panel ──────────────────────────────────────────── */}
        <div style={{ paddingTop: 16 }}>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              margin: '0 0 10px',
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              color: 'var(--co-text)',
            }}
          >
            當前焦點案件
            {focusBid && (
              <span style={{ fontSize: 11.5, color: 'var(--co-text-dim)', fontWeight: 400 }}>
                · #{focusBid.listingId.slice(0, 8)}
              </span>
            )}
          </h2>

          {showLoading ? (
            <LoadingSkeleton count={1} height="h-64" />
          ) : focusBid ? (
            <BidFocusCard
              bid={focusBid}
              onWithdraw={handleWithdraw}
              isWithdrawing={withdrawingId === focusBid.id}
              withdrawError={withdrawingId === focusBid.id ? withdrawError : null}
            />
          ) : (
            <div
              style={{
                background: 'var(--co-bg-card)',
                border: '1px solid var(--co-line-strong)',
                borderRadius: 14,
                padding: 18,
              }}
            >
              <EmptyState
                icon={<Icon.MessageSquare size={36} />}
                title="選擇一個投標案件"
                description="點擊左側看板上的卡片以檢視詳細進度。"
              />
            </div>
          )}

          {/* Deadline / upcoming panel — no deadline field in Bid API → EmptyState */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h3
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--co-text)',
                margin: '0 0 10px',
              }}
            >
              即將截標
            </h3>
            {/* Bid API does not return a deadline field.
                Deadline data requires a listing fetch per bid (N+1) or a
                dedicated /bids/deadlines endpoint that does not yet exist. */}
            <EmptyState
              icon={<Icon.Clock size={32} />}
              title="截標日期尚未提供"
              description="後端 deadline 欄位尚未開放，上線後將自動顯示。"
            />
          </div>
        </div>
      </div>

      {/* ── Mobile responsive overrides ────────────────────────────────────── */}
      <style>{`
        @media (max-width: 767px) {
          .bids-layout { grid-template-columns: 1fr !important; }
          .pipeline-grid { grid-template-columns: repeat(2,1fr) !important; }
          .stat-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 479px) {
          .pipeline-grid { grid-template-columns: 1fr !important; }
          .stat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default MyBidsPage;
