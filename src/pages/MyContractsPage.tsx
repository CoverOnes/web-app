import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContracts } from '../lib/query';
import { useAuthStore } from '../store/authStore';
import { LogoSquare } from '../components/ui/LogoSquare';
import { PageHead } from '../components/layout/PageHead';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import type { Contract, ContractStatus } from '../lib/api/coverones';

// ─── Status chip (dark themed, matching Contracts.html .st classes) ────────────

interface StatusChipProps {
  status: ContractStatus;
  progress?: number; // 0-100
}

function contractStatusLabel(status: ContractStatus): string {
  switch (status) {
    case 'DRAFT':             return '草稿';
    case 'PENDING_SIGNATURE': return '待簽署';
    case 'SIGNED':            return '已簽署';
    case 'ACTIVE':            return '履約中';
    case 'COMPLETED':         return '已結案';
    case 'CANCELLED':         return '已取消';
    default:                  return status;
  }
}

function statusChipStyle(status: ContractStatus): { bg: string; color: string; border: string; dotBg: string } {
  switch (status) {
    case 'ACTIVE':
      return {
        bg: 'var(--co-status-green-bg)',
        color: 'var(--co-status-green-text)',
        border: '1px solid rgba(16,185,129,.3)',
        dotBg: 'var(--co-status-green-text)',
      };
    case 'PENDING_SIGNATURE':
      return {
        bg: 'var(--co-status-amber-bg)',
        color: 'var(--co-status-amber-text)',
        border: '1px solid rgba(245,158,11,.3)',
        dotBg: 'var(--co-status-amber-text)',
      };
    case 'SIGNED':
      return {
        bg: 'var(--co-status-cyan-bg)',
        color: 'var(--co-status-cyan-text)',
        border: '1px solid rgba(34,211,238,.3)',
        dotBg: 'var(--co-status-cyan-text)',
      };
    case 'COMPLETED':
      return {
        bg: 'rgba(148,163,184,.12)',
        color: 'var(--co-text-dim)',
        border: '1px solid var(--co-line-strong)',
        dotBg: 'var(--co-text-muted)',
      };
    case 'CANCELLED':
      return {
        bg: 'var(--co-status-red-bg)',
        color: 'var(--co-status-red-text)',
        border: '1px solid rgba(239,68,68,.3)',
        dotBg: 'var(--co-status-red-text)',
      };
    case 'DRAFT':
    default:
      return {
        bg: 'rgba(148,163,184,.12)',
        color: 'var(--co-text-dim)',
        border: '1px solid var(--co-line-strong)',
        dotBg: 'var(--co-text-muted)',
      };
  }
}

function StatusChip({ status, progress }: StatusChipProps) {
  const s = statusChipStyle(status);
  const label = contractStatusLabel(status);
  const progressLabel = progress !== undefined && progress > 0 ? ` ${progress}%` : '';
  return (
    <div>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 9px',
          borderRadius: 6,
          fontSize: 10.5,
          fontWeight: 600,
          background: s.bg,
          color: s.color,
          border: s.border,
        }}
      >
        <span
          style={{ width: 6, height: 6, borderRadius: 999, background: s.dotBg, flexShrink: 0 }}
          aria-hidden="true"
        />
        {label}{progressLabel}
      </div>
      {progress !== undefined && (
        <div
          className="co-bar"
          style={{ marginTop: 6 }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label} progress: ${progress}%`}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

// ─── Contract row (table body) ─────────────────────────────────────────────────

interface ContractTableRowProps {
  contract: Contract;
  onClick: () => void;
  currentUserId?: string;
}

function ContractTableRow({ contract, onClick, currentUserId }: ContractTableRowProps) {
  const letter = contract.title.charAt(0).toUpperCase();
  // Progress is only available on the detail page (requires per-contract tasks fetch).
  // The list endpoint has no task-count fields; always undefined here.
  const progress: number | undefined = undefined;

  // Determine which party is the counterparty:
  // If current user is the client, counterparty is the freelancer, and vice versa.
  const counterpartyId = currentUserId === contract.clientUserId
    ? contract.freelancerUserId
    : contract.clientUserId;
  const counterpartyRole = currentUserId === contract.clientUserId ? '對方' : '您的客戶';

  const formattedDate = (() => {
    try {
      return new Date(contract.createdAt).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
    } catch {
      return '';
    }
  })();

  return (
    <div
      role="row"
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      tabIndex={0}
      aria-label={`合約：${contract.title}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '60px 1fr 130px 120px 110px 90px 36px',
        gap: 14,
        padding: '14px 16px',
        alignItems: 'center',
        borderBottom: '1px solid var(--co-line)',
        cursor: 'pointer',
        transition: 'background 150ms',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,.05)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {/* Logo */}
      <LogoSquare letter={letter} size={38} />

      {/* Title / project */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--co-text)',
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {contract.title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--co-text-dim)',
            marginTop: 3,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--co-text-muted)',
            }}
          >
            #{contract.id.slice(0, 8)}
          </span>
          <span>{formattedDate} 建立</span>
        </div>
      </div>

      {/* Status + progress */}
      <StatusChip status={contract.status} progress={progress} />

      {/* Amount */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          fontFeatureSettings: '"tnum"',
          color: 'var(--co-text)',
          textAlign: 'right',
          whiteSpace: 'nowrap',
        }}
      >
        {contract.currency} {(() => { const amt = parseFloat(contract.amount); return Number.isNaN(amt) ? '—' : amt.toLocaleString('zh-TW'); })()}
      </div>

      {/* Next milestone — no API backing → empty-state cell */}
      <div style={{ fontSize: 11.5, color: 'var(--co-text-muted)' }}>
        —
      </div>

      {/* Counterparty — show correct side based on current user role */}
      <div style={{ fontSize: 12, color: 'var(--co-text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={counterpartyRole}>
        {counterpartyId.slice(0, 8)}…
      </div>

      {/* Actions */}
      <button
        aria-label={`合約 ${contract.title} 的更多操作`}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 18,
          color: 'var(--co-text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 6,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        ⋯
      </button>
    </div>
  );
}

// ─── Filter options ────────────────────────────────────────────────────────────

type FilterOption = 'ALL' | ContractStatus;

const FILTER_TABS: { id: FilterOption; label: string }[] = [
  { id: 'ALL',               label: '全部' },
  { id: 'PENDING_SIGNATURE', label: '待簽署' },
  { id: 'ACTIVE',            label: '履約中' },
  { id: 'SIGNED',            label: '驗收中' },
  { id: 'COMPLETED',         label: '已結案' },
];

// ─── Main page ─────────────────────────────────────────────────────────────────

const MyContractsPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Status-filtered query — drives the visible table rows only.
  const { data: contracts, isLoading, isError } = useContracts(
    activeFilter !== 'ALL' ? activeFilter : undefined
  );

  // Unfiltered query — always fetches ALL contracts so stats/tab-counts are
  // correct regardless of which tab is active. When the ALL tab is selected
  // this shares the same cache entry as the filtered query above (status=undefined).
  const { data: allContracts, isLoading: allLoading } = useContracts(undefined);

  // Derived stats always come from the unfiltered set.
  const activeCount    = allContracts?.filter((c) => c.status === 'ACTIVE').length ?? 0;
  const pendingCount   = allContracts?.filter((c) => c.status === 'PENDING_SIGNATURE').length ?? 0;
  const completedCount = allContracts?.filter((c) => c.status === 'COMPLETED').length ?? 0;
  const totalCount     = allContracts?.length ?? 0;

  // Client-side search filter (by title or id)
  const filteredContracts = useMemo<Contract[]>(() => {
    if (!contracts) return [];
    if (!searchQuery.trim()) return contracts;
    const q = searchQuery.toLowerCase();
    return contracts.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.currency.toLowerCase().includes(q)
    );
  }, [contracts, searchQuery]);

  // Tab count labels — always derived from the unfiltered set so switching tabs
  // does not zero out the counts for other statuses.
  const tabCount = (id: FilterOption): number => {
    if (!allContracts) return 0;
    if (id === 'ALL') return allContracts.length;
    return allContracts.filter((c) => c.status === id).length;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--co-bg)', minHeight: '100%' }}>
      <PageHead
        crumb="合約 / 全部"
        title="合約管理"
        description="追蹤從簽署、履約、驗收到結案的完整流程"
      />

      <div style={{ padding: '20px 28px 40px' }}>
        {/* ── Stats row ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 18,
          }}
        >
          {/* Stat: 進行中 */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 12,
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--co-text-dim)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>
              進行中合約
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em', marginTop: 4, color: 'var(--co-status-cyan-text)', fontFeatureSettings: '"tnum"' }}>
              {allLoading ? '—' : activeCount}
            </div>
            <div style={{ fontSize: 11, color: 'var(--co-text-dim)', marginTop: 2 }}>
              {allLoading ? '' : `共 ${totalCount} 份合約`}
            </div>
          </div>

          {/* Stat: 本月應收款 — no invoice API → empty-state */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 12,
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--co-text-dim)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>
              本月應收款
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em', marginTop: 4, color: 'var(--co-green)', fontFeatureSettings: '"tnum"' }}>
              —
            </div>
            <div style={{ fontSize: 11, color: 'var(--co-text-dim)', marginTop: 2 }}>
              尚無收款資料
            </div>
          </div>

          {/* Stat: 待簽署 */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 12,
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--co-text-dim)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>
              待簽署
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em', marginTop: 4, color: 'var(--co-amber)', fontFeatureSettings: '"tnum"' }}>
              {allLoading ? '—' : pendingCount}
            </div>
            <div style={{ fontSize: 11, color: 'var(--co-text-dim)', marginTop: 2 }}>
              {pendingCount > 0 ? '請儘快完成簽署' : '無待處理項目'}
            </div>
          </div>

          {/* Stat: 完成率 */}
          <div
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 12,
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--co-text-dim)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>
              本月結案
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em', marginTop: 4, color: 'var(--co-text)', fontFeatureSettings: '"tnum"' }}>
              {allLoading ? '—' : completedCount}
            </div>
            <div style={{ fontSize: 11, color: 'var(--co-text-dim)', marginTop: 2 }}>
              {totalCount > 0 ? `完成率 ${Math.round((completedCount / totalCount) * 100)}%` : '暫無資料'}
            </div>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Filter bar */}
            <div
              style={{
                background: 'var(--co-bg-card)',
                border: '1px solid var(--co-line-strong)',
                borderRadius: 12,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div
                role="tablist"
                aria-label="依狀態篩選合約"
                style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
              >
                {FILTER_TABS.map((tab, idx) => {
                  const isOn = activeFilter === tab.id;
                  const count = tabCount(tab.id);
                  return (
                    <button
                      key={tab.id}
                      id={`contracts-tab-${tab.id}`}
                      role="tab"
                      aria-selected={isOn}
                      aria-controls="contracts-table-panel"
                      onClick={() => setActiveFilter(tab.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowRight') setActiveFilter(FILTER_TABS[(idx + 1) % FILTER_TABS.length].id);
                        else if (e.key === 'ArrowLeft') setActiveFilter(FILTER_TABS[(idx - 1 + FILTER_TABS.length) % FILTER_TABS.length].id);
                      }}
                      style={{
                        padding: '6px 11px',
                        fontSize: 12,
                        borderRadius: 999,
                        background: isOn
                          ? 'linear-gradient(135deg, var(--co-accent), var(--co-accent-2))'
                          : 'var(--co-bg-3)',
                        border: isOn ? '1px solid transparent' : '1px solid var(--co-line)',
                        color: isOn ? '#fff' : 'var(--co-text-dim)',
                        cursor: 'pointer',
                        fontWeight: isOn ? 600 : 400,
                        transition: 'background 150ms, color 150ms',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tab.label}
                      {!isLoading && count > 0 && (
                        <span style={{ opacity: 0.85, marginLeft: 5, fontSize: 10.5 }}>{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div style={{ flex: 1 }} />

              {/* Search input */}
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋合約編號 / 標題..."
                aria-label="搜尋合約"
                style={{
                  flex: 1,
                  minWidth: 160,
                  padding: '7px 12px',
                  background: 'var(--co-bg-3)',
                  border: '1px solid var(--co-line)',
                  borderRadius: 8,
                  fontSize: 12.5,
                  color: 'var(--co-text)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Contract table */}
            <div
              id="contracts-table-panel"
              role="tabpanel"
              aria-labelledby={`contracts-tab-${activeFilter}`}
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
              ) : !filteredContracts || filteredContracts.length === 0 ? (
                <EmptyState
                  icon={<Icon.File size={48} />}
                  title={searchQuery ? '找不到符合的合約' : '目前沒有合約'}
                  description={searchQuery ? '請嘗試其他關鍵字。' : '投標被接受後，合約將出現在這裡。'}
                />
              ) : (
                <div
                  role="table"
                  aria-label="合約列表"
                  style={{
                    background: 'var(--co-bg-card)',
                    border: '1px solid var(--co-line-strong)',
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  {/* Table header — ARIA: role="rowgroup" wrapping role="row" with role="columnheader" cells */}
                  <div role="rowgroup">
                    <div
                      role="row"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '60px 1fr 130px 120px 110px 90px 36px',
                        gap: 14,
                        padding: '9px 16px',
                        background: 'rgba(15,23,42,.6)',
                        fontSize: 10.5,
                        color: 'var(--co-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '.06em',
                        fontWeight: 700,
                        borderBottom: '1px solid var(--co-line)',
                      }}
                    >
                      <div role="columnheader" aria-label="合約圖示" />
                      <div role="columnheader">合約 / 專案</div>
                      <div role="columnheader">狀態 / 進度</div>
                      <div role="columnheader" style={{ textAlign: 'right' }}>金額</div>
                      <div role="columnheader">下個里程碑</div>
                      <div role="columnheader">對方</div>
                      <div role="columnheader" aria-label="操作" />
                    </div>
                  </div>

                  {/* Rows */}
                  <div role="rowgroup">
                    {filteredContracts.map((contract) => (
                      <ContractTableRow
                        key={contract.id}
                        contract={contract}
                        currentUserId={user?.id}
                        onClick={() => navigate(`/contracts/${contract.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Pending actions card — no API backing */}
            <div
              style={{
                background: 'var(--co-bg-card)',
                border: '1px solid var(--co-line-strong)',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: 'var(--co-text)',
                }}
              >
                <span>待處理事項</span>
              </div>
              <div
                style={{
                  padding: '20px 0',
                  textAlign: 'center',
                  color: 'var(--co-text-muted)',
                  fontSize: 12,
                }}
              >
                尚無待處理事項
              </div>
            </div>

            {/* Cashflow card — no invoice API */}
            <div
              style={{
                background: 'var(--co-bg-card)',
                border: '1px solid var(--co-line-strong)',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 12,
                  color: 'var(--co-text)',
                }}
              >
                本月現金流
              </div>
              <div
                style={{
                  padding: '20px 0',
                  textAlign: 'center',
                  color: 'var(--co-text-muted)',
                  fontSize: 12,
                }}
              >
                尚無收款資料
              </div>
            </div>

            {/* Contract templates — no API */}
            <div
              style={{
                background: 'var(--co-bg-card)',
                border: '1px solid var(--co-line-strong)',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 12,
                  color: 'var(--co-text)',
                }}
              >
                常用合約範本
              </div>
              <div
                style={{
                  padding: '20px 0',
                  textAlign: 'center',
                  color: 'var(--co-text-muted)',
                  fontSize: 12,
                }}
              >
                尚無資料
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyContractsPage;
