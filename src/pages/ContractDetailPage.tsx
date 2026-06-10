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
import { StatusBadge } from '../components/ui/StatusBadge';
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
import type { TaskStatus } from '../lib/api/coverones';
import { getApiErrorMessage } from '../lib/api/http';

const CONTRACT_STEPS = ['草稿', '待簽署', '生效中', '執行中', '完成'];

function getStepIndex(status: string): number {
  switch (status) {
    case 'DRAFT': return 0;
    case 'PENDING_SIGNATURE': return 1;
    case 'SIGNED': return 2;
    case 'ACTIVE': return 3;
    case 'COMPLETED': return 4;
    case 'CANCELLED': return -1;
    default: return 0;
  }
}

const ContractDetailPage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const kycTier = user?.kycTier ?? 0;

  const { data: contract, isLoading, isError } = useContract(id);
  const { data: signatures = [] } = useSignatures(id);
  const { data: tasks = [] } = useTasks(id);

  const signContract = useSignContract(id);
  const cancelContract = useCancelContract(id);
  const submitForSignature = useSubmitForSignature(id);
  const createTask = useCreateTask(id);
  const updateTask = useUpdateTask(id);

  // Must be declared before early returns so hook order is stable
  const [actionError, setActionError] = useState('');
  // Confirm dialog state for irreversible cancel action
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  // Ref for the dialog panel — used to move focus into it on open (a11y)
  const cancelDialogRef = useRef<HTMLDivElement>(null);

  // a11y: close on Escape; only active while the dialog is open
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
  // "送出簽署" is only shown to the client on a DRAFT contract when KYC Tier ≥ 2.
  // Gate on !isHydrating so a false "KYC required" never flashes before hydration completes.
  const canSubmitForSignature = isClient
    && contract.status === 'DRAFT'
    && !isHydrating
    && kycTier >= 2;

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    setActionError('');
    updateTask.mutate({ taskId, data: { status } }, {
      onError: (err) => {
        setActionError(getApiErrorMessage(err) ?? 'Failed to update task status.');
      },
    });
  };

  const handleAddTask = (data: { title: string; assigneeUserId?: string }) => {
    setActionError('');
    createTask.mutate(data, {
      onError: (err) => {
        setActionError(getApiErrorMessage(err) ?? 'Failed to create task.');
      },
    });
  };

  const stepIndex = getStepIndex(contract.status);
  const letter = contract.title.charAt(0).toUpperCase();

  const handleConfirmCancel = () => {
    setShowCancelConfirm(false);
    cancelContract.mutate(undefined, {
      onError: (err) => {
        setActionError(getApiErrorMessage(err) ?? 'Failed to cancel contract.');
      },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--co-bg)', minHeight: '100%' }}>
      {/* ── Cancel-contract confirm dialog ── */}
      {showCancelConfirm && (
        /* a11y: backdrop click closes the dialog */
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
          {/* a11y: stopPropagation prevents backdrop click from firing on inner panel */}
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
              {/* autoFocus: focus moves into the dialog on open; default to the safe "keep" action */}
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
            <StatusBadge status={contract.status} />
            {canSubmitForSignature && (
              <Button
                variant="primary"
                size="sm"
                loading={submitForSignature.isPending}
                onClick={() => {
                  setActionError('');
                  submitForSignature.mutate(undefined, {
                    onError: (err) => {
                      setActionError(getApiErrorMessage(err) ?? 'Failed to submit for signature.');
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
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Action error banner */}
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
            {/* Header card */}
            <div
              style={{
                background: 'var(--co-bg-card)',
                border: '1px solid var(--co-line)',
                borderRadius: 14,
                padding: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                <LogoSquare letter={letter} size={56} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--co-text)', letterSpacing: '-0.02em', margin: '0 0 6px 0' }}>
                    {contract.title}
                  </h2>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <StatusBadge status={contract.status} />
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  {CONTRACT_STEPS.map((step, idx) => {
                    const isDone = idx < stepIndex;
                    const isNow = idx === stepIndex;
                    return (
                      <div key={step} style={{ display: 'flex', alignItems: 'center', flex: idx < CONTRACT_STEPS.length - 1 ? 1 : undefined }}>
                        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 999,
                              background: isDone ? 'var(--co-green)'
                                : isNow ? 'var(--co-accent)'
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
                          <span style={{ fontSize: 10.5, color: isNow ? 'var(--co-text)' : 'var(--co-text-muted)', fontWeight: isNow ? 600 : 400 }}>
                            {step}
                          </span>
                        </div>
                        {idx < CONTRACT_STEPS.length - 1 && (
                          <div
                            style={{
                              flex: 1,
                              height: 2,
                              background: isDone ? 'var(--co-green)' : 'var(--co-line)',
                              margin: '0 6px',
                              marginBottom: 20,
                              borderRadius: 1,
                            }}
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Terms panel */}
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
              <SignaturePanel
                contract={contract}
                signatures={signatures}
                onSign={(hash) => {
                  setActionError('');
                  signContract.mutate(hash, {
                    onError: (err) => {
                      setActionError(getApiErrorMessage(err) ?? 'Failed to sign contract.');
                    },
                  });
                }}
                isSigning={signContract.isPending}
              />
            </div>

            {/* Tasks */}
            <div
              style={{
                background: 'var(--co-bg-card)',
                border: '1px solid var(--co-line)',
                borderRadius: 12,
                padding: 24,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--co-text)', marginBottom: 16 }}>
                任務清單
              </h2>
              <TaskList
                tasks={tasks}
                onStatusChange={handleStatusChange}
                onAddTask={handleAddTask}
                isUpdating={updateTask.isPending}
                isAdding={createTask.isPending}
              />
            </div>
          </div>

          {/* Right rail: contract summary */}
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
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--co-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                合約摘要
              </div>

              {/* Key-value list */}
              {[
                { label: '合約金額', value: `${contract.currency} ${contract.amount}`, accent: 'var(--co-green)' },
                { label: '建立日期', value: new Date(contract.createdAt).toLocaleDateString('zh-TW') },
                { label: '甲方 (客戶)', value: contract.clientUserId.slice(0, 12) + '...' },
                { label: '乙方 (接案者)', value: contract.freelancerUserId.slice(0, 12) + '...' },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--co-text-muted)', flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: row.accent ?? 'var(--co-text)', textAlign: 'right', wordBreak: 'break-all' }}>
                    {row.value}
                  </span>
                </div>
              ))}

              {/* Progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--co-text-muted)', marginBottom: 6 }}>
                  <span>任務進度</span>
                  <span>
                    {tasks.filter(t => t.status === 'DONE').length}/{tasks.length}
                  </span>
                </div>
                <div className="co-bar">
                  <span
                    style={{
                      width: tasks.length > 0
                        ? `${Math.round((tasks.filter(t => t.status === 'DONE').length / tasks.length) * 100)}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>

              {/* Action card for DRAFT — prompt client to submit for signature */}
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
              {/* Action card for pending signature */}
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
                  待您簽署。請至「合約條款」區塊完成電子簽名。
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
