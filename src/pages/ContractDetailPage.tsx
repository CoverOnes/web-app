import { useParams } from 'react-router-dom';
import {
  useContract,
  useSignatures,
  useTasks,
  useSignContract,
  useCancelContract,
  useSubmitForSignature,
  useCreateTask,
  useUpdateTask,
} from '../lib/query';
import { useAuthStore } from '../store/authStore';
import { LogoSquare } from '../components/ui/LogoSquare';
import { Button } from '../components/ui/Button';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHead } from '../components/layout/PageHead';
import { TermsPanel } from '../components/workspace/TermsPanel';
import { SignaturePanel } from '../components/workspace/SignaturePanel';
import { TaskList } from '../components/workspace/TaskList';
import { Icon } from '../components/ui/Icon';
import { useState, useEffect, useRef } from 'react';
import type { ContractStatus, TaskStatus } from '../lib/api/coverones';
import { getApiErrorMessage } from '../lib/api/http';

// ─── Step stepper ──────────────────────────────────────────────────────────────

const CONTRACT_STEPS: { label: string; status: ContractStatus }[] = [
  { label: '草稿',   status: 'DRAFT' },
  { label: '待簽署', status: 'PENDING_SIGNATURE' },
  { label: '已簽署', status: 'SIGNED' },
  { label: '執行中', status: 'ACTIVE' },
  { label: '完成',   status: 'COMPLETED' },
];

function getStepIndex(status: ContractStatus): number {
  switch (status) {
    case 'DRAFT':             return 0;
    case 'PENDING_SIGNATURE': return 1;
    case 'SIGNED':            return 2;
    case 'ACTIVE':            return 3;
    case 'COMPLETED':         return 4;
    case 'CANCELLED':         return -1;
    default:                  return 0;
  }
}

function contractStatusLabel(status: ContractStatus): string {
  switch (status) {
    case 'DRAFT':             return '草稿';
    case 'PENDING_SIGNATURE': return '待簽署';
    case 'SIGNED':            return '已簽署';
    case 'ACTIVE':            return '執行中';
    case 'COMPLETED':         return '已完成';
    case 'CANCELLED':         return '已取消';
    default:                  return status;
  }
}

interface StatusChipSmallProps {
  status: ContractStatus;
}

function statusChipColors(status: ContractStatus): { bg: string; color: string; border: string; dot: string } {
  switch (status) {
    case 'ACTIVE':
      return { bg: 'rgba(16,185,129,.15)', color: '#6EE7B7', border: 'rgba(16,185,129,.3)', dot: '#6EE7B7' };
    case 'PENDING_SIGNATURE':
      return { bg: 'rgba(245,158,11,.15)', color: '#FCD34D', border: 'rgba(245,158,11,.3)', dot: '#FCD34D' };
    case 'SIGNED':
      return { bg: 'rgba(34,211,238,.15)', color: '#67E8F9', border: 'rgba(34,211,238,.3)', dot: '#67E8F9' };
    case 'COMPLETED':
      return { bg: 'rgba(148,163,184,.12)', color: 'var(--co-text-dim)', border: 'var(--co-line-strong)', dot: 'var(--co-text-muted)' };
    case 'CANCELLED':
      return { bg: 'rgba(239,68,68,.15)', color: '#FCA5A5', border: 'rgba(239,68,68,.3)', dot: '#FCA5A5' };
    case 'DRAFT':
    default:
      return { bg: 'rgba(148,163,184,.12)', color: 'var(--co-text-dim)', border: 'var(--co-line-strong)', dot: 'var(--co-text-muted)' };
  }
}

function StatusChipSmall({ status }: StatusChipSmallProps) {
  const c = statusChipColors(status);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 9px',
        borderRadius: 6,
        fontSize: 10.5,
        fontWeight: 600,
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: c.dot, flexShrink: 0 }} aria-hidden="true" />
      {contractStatusLabel(status)}
    </span>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

const ContractDetailPage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const kycTier = user?.kycTier ?? 0;

  const { data: contract, isLoading, isError } = useContract(id);
  const { data: signatures = [] } = useSignatures(id);
  const { data: tasks = [] } = useTasks(id);

  const signContract       = useSignContract(id);
  const cancelContract     = useCancelContract(id);
  const submitForSignature = useSubmitForSignature(id);
  const createTask         = useCreateTask(id);
  const updateTask         = useUpdateTask(id);

  // Hooks must be declared before early returns for stable ordering
  const [actionError, setActionError]           = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const cancelDialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showCancelConfirm) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCancelConfirm(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showCancelConfirm]);

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <LoadingSkeleton count={1} height="h-64" />
      </div>
    );
  }

  if (isError || !contract) {
    return (
      <div style={{ padding: 24 }}>
        <EmptyState
          icon={<Icon.X size={48} />}
          title="找不到合約"
          description="此合約可能不存在或您沒有存取權限。"
        />
      </div>
    );
  }

  const isClient = user?.id === contract.clientUserId;
  const canCancel = isClient && (contract.status === 'DRAFT' || contract.status === 'PENDING_SIGNATURE');
  const canSubmitForSignature = isClient
    && contract.status === 'DRAFT'
    && !isHydrating
    && kycTier >= 2;

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    setActionError('');
    updateTask.mutate({ taskId, data: { status } }, {
      onError: (err) => {
        setActionError(getApiErrorMessage(err) ?? '任務狀態更新失敗。');
      },
    });
  };

  const handleAddTask = (data: { title: string; assigneeUserId?: string }) => {
    setActionError('');
    createTask.mutate(data, {
      onError: (err) => {
        setActionError(getApiErrorMessage(err) ?? '任務新增失敗。');
      },
    });
  };

  const handleConfirmCancel = () => {
    setShowCancelConfirm(false);
    cancelContract.mutate(undefined, {
      onError: (err) => {
        setActionError(getApiErrorMessage(err) ?? '合約取消失敗。');
      },
    });
  };

  const stepIndex = getStepIndex(contract.status);
  const letter = contract.title.charAt(0).toUpperCase();

  const doneTasks = tasks.filter((t) => t.status === 'DONE').length;
  const taskProgress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--co-bg)', minHeight: '100%' }}>

      {/* ── Cancel confirm dialog ── */}
      {showCancelConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-confirm-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.55)',
          }}
          onClick={() => setShowCancelConfirm(false)}
        >
          <div
            ref={cancelDialogRef}
            style={{
              background: 'var(--co-bg-card)',
              border: '1px solid var(--co-line-strong)',
              borderRadius: 16,
              padding: '28px 32px',
              maxWidth: 420,
              width: '90%',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="cancel-confirm-title"
              style={{ fontSize: 16, fontWeight: 700, margin: '0 0 10px 0', color: 'var(--co-text)' }}
            >
              確認取消合約？
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--co-text-dim)', lineHeight: 1.6, margin: '0 0 22px 0' }}>
              取消後合約狀態將變更為「已取消」且無法復原。請確認您已知悉此操作的影響。
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                size="sm"
                autoFocus
                onClick={() => setShowCancelConfirm(false)}
                aria-label="保留合約，返回"
              >
                保留合約
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={cancelContract.isPending}
                onClick={handleConfirmCancel}
                aria-label="確認取消合約"
              >
                確認取消
              </Button>
            </div>
          </div>
        </div>
      )}

      <PageHead
        crumb="合約管理 / 合約詳情"
        title={contract.title}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <StatusChipSmall status={contract.status} />
            {canSubmitForSignature && (
              <Button
                variant="primary"
                size="sm"
                loading={submitForSignature.isPending}
                onClick={() => {
                  setActionError('');
                  submitForSignature.mutate(undefined, {
                    onError: (err) => {
                      setActionError(getApiErrorMessage(err) ?? '送出簽署失敗。');
                    },
                  });
                }}
                aria-label="送出簽署"
              >
                送出簽署
              </Button>
            )}
            {canCancel && (
              <Button
                variant="danger"
                size="sm"
                loading={cancelContract.isPending}
                onClick={() => {
                  setActionError('');
                  setShowCancelConfirm(true);
                }}
                aria-label="取消合約"
              >
                取消合約
              </Button>
            )}
          </div>
        }
      />

      <div style={{ padding: '22px 28px 40px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: 22 }}>

          {/* ── Left column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Error banner */}
            {actionError && (
              <div
                role="alert"
                style={{
                  padding: '10px 14px',
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#FCA5A5',
                }}
              >
                {actionError}
              </div>
            )}

            {/* Header card: logo + title + stepper */}
            <div
              style={{
                background: 'var(--co-bg-card)',
                border: '1px solid var(--co-line)',
                borderRadius: 14,
                padding: 24,
              }}
            >
              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 22 }}>
                <LogoSquare letter={letter} size={56} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: 'var(--co-text)',
                      letterSpacing: '-0.02em',
                      margin: '0 0 6px 0',
                    }}
                  >
                    {contract.title}
                  </h2>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <StatusChipSmall status={contract.status} />
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--co-text-muted)',
                        padding: '1px 6px',
                        background: 'var(--co-bg-3)',
                        borderRadius: 4,
                        border: '1px solid var(--co-line)',
                      }}
                    >
                      #{contract.id.slice(0, 8)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5-step stepper */}
              {contract.status !== 'CANCELLED' && (
                <div
                  role="list"
                  aria-label="合約進度"
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  {CONTRACT_STEPS.map((step, idx) => {
                    const isDone = idx < stepIndex;
                    const isNow  = idx === stepIndex;
                    return (
                      <div
                        key={step.status}
                        role="listitem"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          flex: idx < CONTRACT_STEPS.length - 1 ? 1 : undefined,
                        }}
                      >
                        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div
                            aria-current={isNow ? 'step' : undefined}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 999,
                              background: isDone
                                ? 'var(--co-green)'
                                : isNow
                                  ? 'var(--co-accent)'
                                  : 'var(--co-bg-card-2)',
                              border: `2px solid ${isDone ? 'var(--co-green)' : isNow ? 'var(--co-accent)' : 'var(--co-line)'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: 700,
                              color: isDone || isNow ? '#fff' : 'var(--co-text-muted)',
                            }}
                          >
                            {isDone ? '✓' : idx + 1}
                          </div>
                          <span
                            style={{
                              fontSize: 10.5,
                              color: isNow ? 'var(--co-text)' : 'var(--co-text-muted)',
                              fontWeight: isNow ? 600 : 400,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {step.label}
                          </span>
                        </div>
                        {idx < CONTRACT_STEPS.length - 1 && (
                          <div
                            aria-hidden="true"
                            style={{
                              flex: 1,
                              height: 2,
                              background: isDone ? 'var(--co-green)' : 'var(--co-line)',
                              margin: '0 6px',
                              marginBottom: 20,
                              borderRadius: 1,
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Cancelled banner */}
              {contract.status === 'CANCELLED' && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(239,68,68,0.10)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: 8,
                    fontSize: 12.5,
                    color: '#FCA5A5',
                    lineHeight: 1.5,
                  }}
                >
                  此合約已取消。
                </div>
              )}
            </div>

            {/* Contract terms */}
            <div
              style={{
                background: 'var(--co-bg-card)',
                border: '1px solid var(--co-line)',
                borderRadius: 12,
                padding: 24,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--co-text)', marginBottom: 14 }}>
                合約條款
              </h2>
              <TermsPanel terms={contract.terms} />
            </div>

            {/* Signature panel */}
            <div
              style={{
                background: 'var(--co-bg-card)',
                border: '1px solid var(--co-line)',
                borderRadius: 12,
                padding: 24,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--co-text)', marginBottom: 14 }}>
                電子簽名
              </h2>
              <SignaturePanel
                contract={contract}
                signatures={signatures}
                onSign={(hash) => {
                  setActionError('');
                  signContract.mutate(hash, {
                    onError: (err) => {
                      setActionError(getApiErrorMessage(err) ?? '簽署失敗。');
                    },
                  });
                }}
                isSigning={signContract.isPending}
              />
            </div>

            {/* Deliverables (tasks) */}
            <div
              style={{
                background: 'var(--co-bg-card)',
                border: '1px solid var(--co-line)',
                borderRadius: 12,
                padding: 24,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--co-text)', marginBottom: 16 }}>
                交付項目
              </h2>
              <TaskList
                tasks={tasks}
                onStatusChange={handleStatusChange}
                onAddTask={handleAddTask}
                isUpdating={updateTask.isPending}
                isAdding={createTask.isPending}
              />
            </div>

            {/* Invoice section — no invoice API */}
            <div
              style={{
                background: 'var(--co-bg-card)',
                border: '1px solid var(--co-line)',
                borderRadius: 12,
                padding: 24,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--co-text)', marginBottom: 14 }}>
                請款 / 發票
              </h2>
              <div
                style={{
                  padding: '24px 0',
                  textAlign: 'center',
                  color: 'var(--co-text-muted)',
                  fontSize: 12.5,
                }}
              >
                尚無資料
              </div>
            </div>
          </div>

          {/* ── Right rail: contract summary ── */}
          <div style={{ position: 'sticky', top: 80, alignSelf: 'start' }}>
            <div
              style={{
                background: 'var(--co-bg-card)',
                border: '1px solid var(--co-line)',
                borderRadius: 14,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--co-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                合約摘要
              </div>

              {/* Key-value rows */}
              {([
                {
                  label: '合約金額',
                  value: `${contract.currency} ${Number(contract.amount).toLocaleString('zh-TW')}`,
                  accent: 'var(--co-green)',
                },
                {
                  label: '建立日期',
                  value: new Date(contract.createdAt).toLocaleDateString('zh-TW'),
                },
                {
                  label: '甲方 (客戶)',
                  value: contract.clientUserId.slice(0, 12) + '…',
                },
                {
                  label: '乙方 (接案者)',
                  value: contract.freelancerUserId.slice(0, 12) + '…',
                },
              ] as const).map((row) => (
                <div
                  key={row.label}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}
                >
                  <span style={{ fontSize: 12, color: 'var(--co-text-muted)', flexShrink: 0 }}>{row.label}</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: ('accent' in row && row.accent) ? row.accent : 'var(--co-text)',
                      textAlign: 'right',
                      wordBreak: 'break-all',
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}

              {/* Task progress bar */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    color: 'var(--co-text-muted)',
                    marginBottom: 6,
                  }}
                >
                  <span>任務進度</span>
                  <span>{doneTasks}/{tasks.length}</span>
                </div>
                <div
                  className="co-bar"
                  role="progressbar"
                  aria-valuenow={taskProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`任務進度 ${taskProgress}%`}
                >
                  <span style={{ width: `${taskProgress}%` }} />
                </div>
              </div>

              {/* Milestone section — no milestone API */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--co-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 8,
                  }}
                >
                  里程碑
                </div>
                <div
                  style={{
                    padding: '12px 0',
                    textAlign: 'center',
                    color: 'var(--co-text-muted)',
                    fontSize: 12,
                  }}
                >
                  尚無資料
                </div>
              </div>

              {/* Context-sensitive action hints */}
              {contract.status === 'DRAFT' && isClient && (
                <div
                  style={{
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: 12.5,
                    color: 'var(--co-accent)',
                    lineHeight: 1.5,
                  }}
                >
                  合約草稿已就緒。請確認條款後點擊「送出簽署」，將合約送給雙方進行電子簽名。
                </div>
              )}
              {contract.status === 'PENDING_SIGNATURE' && (
                <div
                  style={{
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: 12.5,
                    color: 'var(--co-amber)',
                    lineHeight: 1.5,
                  }}
                >
                  待您簽署。請至「電子簽名」區塊完成電子簽名。
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractDetailPage;
