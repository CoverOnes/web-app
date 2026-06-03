import { QueryClient, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  marketplaceApi,
  workspaceApi,
  type ContractStatus,
  type CreateContractRequest,
} from './api/coverones';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

// ===== Marketplace hooks =====

export function useListings(params?: { status?: string; mine?: boolean }) {
  return useQuery({
    queryKey: ['listings', params],
    queryFn: () => marketplaceApi.listListings(params),
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => marketplaceApi.getListing(id),
    enabled: !!id,
  });
}

export function useListingBids(listingId: string, enabled = false) {
  return useQuery({
    queryKey: ['listing-bids', listingId],
    queryFn: () => marketplaceApi.listBidsForListing(listingId),
    enabled: enabled && !!listingId,
  });
}

export function useMyBids() {
  return useQuery({
    queryKey: ['my-bids'],
    queryFn: () => marketplaceApi.getMyBids(),
  });
}

export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: marketplaceApi.createListing,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listings'] }),
  });
}

export function useCreateBid(listingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof marketplaceApi.createBid>[1]) =>
      marketplaceApi.createBid(listingId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listing-bids', listingId] });
      qc.invalidateQueries({ queryKey: ['my-bids'] });
    },
  });
}

export function useAcceptBid(listingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: marketplaceApi.acceptBid,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listing-bids', listingId] });
      qc.invalidateQueries({ queryKey: ['listing', listingId] });
      qc.invalidateQueries({ queryKey: ['contracts'] });
    },
    // WA-m2: surface errors so UI can react; callers inspect mutation.error
    onError: (err) => { console.error('[useAcceptBid]', err); },
  });
}

export function useRejectBid(listingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: marketplaceApi.rejectBid,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listing-bids', listingId] }),
    // WA-m2: also invalidate listings so awarded/closed state refreshes
    onError: (err) => { console.error('[useRejectBid]', err); },
  });
}

export function useWithdrawBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: marketplaceApi.withdrawBid,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-bids'] }),
    onError: (err) => { console.error('[useWithdrawBid]', err); },
  });
}

// ===== Workspace hooks =====

export function useContracts(status?: ContractStatus) {
  return useQuery({
    queryKey: ['contracts', status],
    queryFn: () => workspaceApi.listContracts(status ? { status } : undefined),
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    // WA-fix: create the DRAFT contract, then submit it so it advances to
    // PENDING_SIGNATURE and is immediately signable. Returns the submitted contract.
    mutationFn: async (payload: CreateContractRequest) => {
      const draft = await workspaceApi.createContract(payload);
      return workspaceApi.submitContract(draft.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
    onError: (err) => { console.error('[useCreateContract]', err); },
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: ['contract', id],
    queryFn: () => workspaceApi.getContract(id),
    enabled: !!id,
  });
}

export function useSignatures(contractId: string) {
  return useQuery({
    queryKey: ['signatures', contractId],
    queryFn: () => workspaceApi.getSignatures(contractId),
    enabled: !!contractId,
  });
}

export function useTasks(contractId: string) {
  return useQuery({
    queryKey: ['tasks', contractId],
    queryFn: () => workspaceApi.listTasks(contractId),
    enabled: !!contractId,
  });
}

export function useSignContract(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (signedContentHash: string) =>
      workspaceApi.signContract(contractId, signedContentHash),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract', contractId] });
      qc.invalidateQueries({ queryKey: ['signatures', contractId] });
      // WA-m2: also refresh contracts list so status chip updates everywhere
      qc.invalidateQueries({ queryKey: ['contracts'] });
    },
    onError: (err) => { console.error('[useSignContract]', err); },
  });
}

export function useCancelContract(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => workspaceApi.cancelContract(contractId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract', contractId] });
      qc.invalidateQueries({ queryKey: ['contracts'] });
    },
    onError: (err) => { console.error('[useCancelContract]', err); },
  });
}

export function useCreateTask(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof workspaceApi.createTask>[1]) =>
      workspaceApi.createTask(contractId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', contractId] }),
    onError: (err) => { console.error('[useCreateTask]', err); },
  });
}

export function useUpdateTask(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Parameters<typeof workspaceApi.updateTask>[2] }) =>
      workspaceApi.updateTask(contractId, taskId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', contractId] }),
    onError: (err) => { console.error('[useUpdateTask]', err); },
  });
}
