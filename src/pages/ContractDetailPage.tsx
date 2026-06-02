import { useParams } from 'react-router-dom';
import {
  useContract,
  useSignatures,
  useTasks,
  useSignContract,
  useCancelContract,
  useCreateTask,
  useUpdateTask,
} from '../lib/query';
import { useAuthStore } from '../store/authStore';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { TermsPanel } from '../components/workspace/TermsPanel';
import { SignaturePanel } from '../components/workspace/SignaturePanel';
import { TaskList } from '../components/workspace/TaskList';
import { Icon } from '../components/ui/Icon';
import type { TaskStatus } from '../lib/api/coverones';

const ContractDetailPage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const { data: contract, isLoading, isError } = useContract(id);
  const { data: signatures = [] } = useSignatures(id);
  const { data: tasks = [] } = useTasks(id);

  const signContract = useSignContract(id);
  const cancelContract = useCancelContract(id);
  const createTask = useCreateTask(id);
  const updateTask = useUpdateTask(id);

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
          title="Contract not found"
          description="This contract may not exist or you don't have access."
        />
      </div>
    );
  }

  const isClient = user?.id === contract.clientUserId;
  const canCancel = isClient && (contract.status === 'DRAFT' || contract.status === 'PENDING_SIGNATURE');

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateTask.mutate({ taskId, data: { status } });
  };

  const handleAddTask = (data: { title: string; assigneeUserId?: string }) => {
    createTask.mutate(data);
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header */}
        <div
          style={{
            background: 'var(--color-main-bg-2)',
            border: '1px solid var(--color-main-border)',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-main-text)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                {contract.title}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--color-main-text-dim)' }}>
                {contract.currency} {contract.amount}
              </p>
            </div>
            <StatusBadge status={contract.status} />
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--color-main-text-dim)', marginBottom: 2 }}>Client</p>
              <p style={{ fontSize: 13, color: 'var(--color-main-text)' }}>
                {contract.clientUserId.slice(0, 12)}...
              </p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--color-main-text-dim)', marginBottom: 2 }}>Freelancer</p>
              <p style={{ fontSize: 13, color: 'var(--color-main-text)' }}>
                {contract.freelancerUserId.slice(0, 12)}...
              </p>
            </div>
          </div>

          {canCancel && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-main-border)' }}>
              <Button
                variant="danger"
                size="sm"
                loading={cancelContract.isPending}
                onClick={() => cancelContract.mutate()}
                aria-label="Cancel contract"
              >
                Cancel Contract
              </Button>
            </div>
          )}
        </div>

        {/* Terms */}
        <div
          style={{
            background: 'var(--color-main-bg-2)',
            border: '1px solid var(--color-main-border)',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-main-text)', marginBottom: 12 }}>
            Contract Terms
          </h2>
          <TermsPanel terms={contract.terms} />
        </div>

        {/* Signatures */}
        <div
          style={{
            background: 'var(--color-main-bg-2)',
            border: '1px solid var(--color-main-border)',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <SignaturePanel
            contract={contract}
            signatures={signatures}
            onSign={(hash) => signContract.mutate(hash)}
            isSigning={signContract.isPending}
          />
        </div>

        {/* Tasks */}
        <div
          style={{
            background: 'var(--color-main-bg-2)',
            border: '1px solid var(--color-main-border)',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-main-text)', marginBottom: 16 }}>
            Tasks
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
    </div>
  );
};

export default ContractDetailPage;
