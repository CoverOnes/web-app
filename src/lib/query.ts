import { QueryClient, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  authApi,
  kycApi,
  marketplaceApi,
  workspaceApi,
  notificationApi,
  waitlistApi,
  connectionApi,
  companyApi,
  savedApi,
  type ContractStatus,
  type KycSubmitRequest,
  type ResetPasswordRequest,
  type WaitlistJoinRequest,
  type UpdateCompanyRequest,
  type SavedItemType,
  type ListSavedJobsResponse,
  type ListSavedCompaniesResponse,
  type SaveResponse,
  type UnsaveResponse,
} from './api/coverones';
import { useAuthStore } from '../store/authStore';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

// ===== Auth hooks (Increment 1) =====

// Verify the email token read from ?token=. retry:false — a 400
// INVALID_VERIFICATION_TOKEN must NOT be auto-retried (it's deterministic).
export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => authApi.verifyEmail({ token }),
    retry: false,
  });
}

// Resend the verification email. The backend always answers with a generic 202,
// so success here never confirms the address exists. Errors are surfaced to the
// caller via the mutation result (not swallowed).
export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) => authApi.resendVerification({ email }),
    retry: false,
  });
}

// Request a password-reset link. The backend always responds 202 with a generic
// message — never reveals whether the email exists (anti-enumeration).
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword({ email }),
    retry: false,
  });
}

// Consume the reset link token from /reset-password?token=. retry:false because
// 400 INVALID_RESET_TOKEN and 422 WEAK_PASSWORD are deterministic errors.
export function useResetPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authApi.resetPassword(data),
    retry: false,
  });
}

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

// FIX A — bids「載入失敗」race. On a hard reload the in-memory access token is
// null until ProtectedRoute hydrates it (via /me → 401 → /v1/auth/refresh). If
// the list query fired before that, the first request 401'd and surfaced as
// "載入失敗" instead of retrying. We now:
//   1. Gate the query on auth-ready (not hydrating AND a token is present), so
//      it never fires during the hydration window.
//   2. Retry transient 401s a couple of times (the interceptor refreshes the
//      token on the way), so a momentary auth gap recovers instead of erroring.
export function useMyBids() {
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  // Auth is "ready" once hydration finished and we hold a token to send. The
  // refreshToken alone is enough — the 401 interceptor mints an access token.
  const authReady = !isHydrating && (!!accessToken || !!refreshToken);

  return useQuery({
    queryKey: ['my-bids'],
    queryFn: () => marketplaceApi.getMyBids(),
    enabled: authReady,
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      // 401 = transient auth gap → retry (token may still be refreshing).
      // 403 = policy decision (not transient) → must surface immediately, never retry.
      if (status === 401) return failureCount < 2;
      return failureCount < 1;
    },
    retryDelay: (attempt) => Math.min(400 * 2 ** attempt, 2000),
  });
}

// ===== KYC hooks (Increment 2) =====

export function useKycStatus() {
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const authReady = !isHydrating && (!!accessToken || !!refreshToken);

  return useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => kycApi.getStatus(),
    enabled: authReady,
    staleTime: 0,
  });
}

export function useSubmitKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: KycSubmitRequest) => kycApi.submit(data),
    // retry:false — 403 EMAIL_NOT_VERIFIED / 429 RATE_LIMITED are deterministic
    // and must surface to the caller for an inline message, not be auto-retried.
    retry: false,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kyc-status'] }),
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
      qc.invalidateQueries({ queryKey: ['listing', listingId] });
      // Refresh listing list so bid count on cards updates immediately
      qc.invalidateQueries({ queryKey: ['listings'] });
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
      qc.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useRejectBid(listingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: marketplaceApi.rejectBid,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listing-bids', listingId] });
      qc.invalidateQueries({ queryKey: ['listing', listingId] });
      qc.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useWithdrawBid() {
  const qc = useQueryClient();
  return useMutation({
    // Accept either a plain bidId string (legacy callers) or
    // {bidId, listingId} so the caller can pass listingId for cache invalidation.
    mutationFn: (arg: string | { bidId: string; listingId?: string }) => {
      const bidId = typeof arg === 'string' ? arg : arg.bidId;
      return marketplaceApi.withdrawBid(bidId);
    },
    onSuccess: (_data, arg) => {
      qc.invalidateQueries({ queryKey: ['my-bids'] });
      const listingId = typeof arg === 'string' ? undefined : arg.listingId;
      if (listingId) {
        qc.invalidateQueries({ queryKey: ['listing-bids', listingId] });
      }
    },
  });
}

// ===== Workspace hooks =====

export function useContracts(status?: ContractStatus) {
  return useQuery({
    queryKey: status ? ['contracts', status] : ['contracts'],
    queryFn: () => workspaceApi.listContracts(status ? { status } : undefined),
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
  });
}

export function useSubmitForSignature(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => workspaceApi.submitContractForSignature(contractId),
    // retry:false — 403/404 from the backend are deterministic (wrong party or wrong status)
    retry: false,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract', contractId] });
      qc.invalidateQueries({ queryKey: ['contracts'] });
    },
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
  });
}

export function useCreateTask(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof workspaceApi.createTask>[1]) =>
      workspaceApi.createTask(contractId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', contractId] }),
  });
}

export function useUpdateTask(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Parameters<typeof workspaceApi.updateTask>[2] }) =>
      workspaceApi.updateTask(contractId, taskId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', contractId] }),
  });
}

// ===== Notification hooks =====

// Gate on auth readiness (same pattern as useMyBids / useKycStatus).
function useAuthReady() {
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  return !isHydrating && (!!accessToken || !!refreshToken);
}

// useNotifications — cursor-paginated list.
// Pass cursor=undefined for the first page.
export function useNotifications(cursor?: string) {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: ['notifications', cursor],
    queryFn: () => notificationApi.list(cursor ? { cursor } : undefined),
    enabled: authReady,
    staleTime: 30_000,
  });
}

// useUnreadCount — lightweight badge counter, polled every 60 s.
export function useUnreadCount() {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationApi.unreadCount(),
    enabled: authReady,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

// useMarkNotificationRead — mark a single notification read.
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

// useMarkAllNotificationsRead — bulk mark-all-read.
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

// ===== Waitlist hook =====

// useJoinWaitlist — public mutation; no auth required.
// POST /v1/waitlist → any 2xx (including 202 for duplicate email) resolves as success.
// retry:false — a network error should surface inline; the user can retry manually.
// The hook does NOT need to invalidate any cache — it is a one-shot side-effect.
export function useJoinWaitlist() {
  return useMutation({
    mutationFn: (data: WaitlistJoinRequest) => waitlistApi.join(data),
    retry: false,
  });
}

// ===== Connections / Network hooks (P4) =====
// Both queries gate on useAuthReady() (avoids the hydration 401 race). Mutations
// use retry:false (deterministic 4xx must surface inline) + invalidateQueries
// (not optimistic). Errors are surfaced via the mutation result; callers map the
// code via getApiErrorCode/Message for inline messages.

// useConnections — accepted-connections list (['connections']).
export function useConnections() {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: ['connections'],
    queryFn: () => connectionApi.list(),
    enabled: authReady,
  });
}

// usePendingInvites — incoming + outgoing pending invites (['connections','pending']).
export function usePendingInvites() {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: ['connections', 'pending'],
    queryFn: () => connectionApi.listPending(),
    enabled: authReady,
  });
}

// useSendInvite — send a connection invite by addressee userId.
// Invalidate pending (the new edge appears under outgoing). 4xx surfaces inline.
export function useSendInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (addresseeUserId: string) => connectionApi.send(addresseeUserId),
    retry: false,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['connections', 'pending'] });
    },
  });
}

// useAcceptInvite — accept a pending invite; invalidate both lists (it leaves
// pending and joins accepted).
export function useAcceptInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => connectionApi.accept(id),
    retry: false,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['connections', 'pending'] });
      qc.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}

// useDeclineInvite — decline (ignore) a pending invite; invalidate pending.
export function useDeclineInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => connectionApi.decline(id),
    retry: false,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['connections', 'pending'] });
    },
  });
}

// ===== Company hooks (P4) =====
// Public queries gate on !!id (no auth needed); useMyCompany gates on
// useAuthReady() (avoids the hydration 401 race). The mutation uses retry:false
// (deterministic 4xx must surface inline) + invalidate ['company','my']. Error
// codes (HANDLE_TAKEN / VALIDATION_ERROR / NOT_COMPANY_OWNER) are surfaced via
// the mutation result; the page maps them via getApiErrorCode for inline text.

// useMyCompany — authed owner view (['company','my']). Resolves the caller's
// company server-side via /v1/me/company.
export function useMyCompany() {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: ['company', 'my'],
    queryFn: () => companyApi.getMyCompany(),
    enabled: authReady,
  });
}

// usePublicCompany — public company profile by id (['company', id]).
export function usePublicCompany(companyId: string | undefined) {
  return useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyApi.getPublicCompany(companyId!),
    enabled: !!companyId,
  });
}

// useCompanyMembers — public member roster by id (['company', id, 'members']).
export function useCompanyMembers(companyId: string | undefined) {
  return useQuery({
    queryKey: ['company', companyId, 'members'],
    queryFn: () => companyApi.getCompanyMembers(companyId!),
    enabled: !!companyId,
  });
}

// useUpdateMyCompany — owner full-replace update; invalidate ['company','my'].
// retry:false so deterministic 4xx (HANDLE_TAKEN / VALIDATION_ERROR /
// NOT_COMPANY_OWNER) surface inline instead of being auto-retried.
export function useUpdateMyCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCompanyRequest) => companyApi.updateMyCompany(data),
    retry: false,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company', 'my'] });
    },
  });
}

// ===== Saved items / Bookmarks (P4) =====
// Server state lives in TanStack Query (NEVER Zustand). Both list queries gate on
// useAuthReady() (avoids the hydration 401 race). The toggle mutation is OPTIMISTIC
// with revert-on-error: onMutate snapshots + applies the change, onError rolls back
// to the snapshot, onSettled invalidates to reconcile with the server.

// useSavedJobs — the user's saved JOB references (['saved','job']). Each ref is
// hydrated to a Listing card by <SavedJobCard> via useListing(itemId).
export function useSavedJobs() {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: ['saved', 'job'],
    queryFn: () => savedApi.listJobs(),
    enabled: authReady,
  });
}

// useSavedCompanies — the user's followed companies (['saved','company']) with the
// PII-safe company projection joined in-service (rendered directly, no hydration).
export function useSavedCompanies() {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: ['saved', 'company'],
    queryFn: () => savedApi.listCompanies(),
    enabled: authReady,
  });
}

// Common shape of both saved-list caches for the optimistic updater. Both
// ListSavedJobsResponse and ListSavedCompaniesResponse have `items` whose entries
// carry an `itemId`, which is all the optimistic remove needs.
type SavedListCache = ListSavedJobsResponse | ListSavedCompaniesResponse;

// useToggleSaved — optimistic bookmark toggle for one item type, with
// revert-on-error (HARD requirement). On the SavedPage the star is always
// "currently saved" (you are viewing your saved list), so a toggle = unsave →
// the card is removed optimistically; a rejected request restores it via onError.
//
//   onMutate:  cancel in-flight refetches, snapshot the list, optimistically drop
//              the toggled item (when unsaving) so the UI updates immediately.
//   onError:   roll the cache back to the pre-mutation snapshot (REVERT).
//   onSettled: invalidate so the server's truth reconciles the (possibly stale) cache.
// retry:false — deterministic 4xx (409/404/400) must surface, not auto-retry.
export function useToggleSaved(itemType: SavedItemType) {
  const qc = useQueryClient();
  const key = ['saved', itemType] as const;
  return useMutation({
    // The result type is the union of save/unsave responses; we never read it
    // (the cache is updated optimistically), so the explicit annotation just
    // keeps both branches assignable to the same MutationFunction.
    mutationFn: ({
      itemId,
      currentlySaved,
    }: {
      itemId: string;
      currentlySaved: boolean;
    }): Promise<SaveResponse | UnsaveResponse> =>
      currentlySaved ? savedApi.unsave(itemType, itemId) : savedApi.save(itemType, itemId),
    retry: false,
    onMutate: async ({ itemId, currentlySaved }: { itemId: string; currentlySaved: boolean }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<SavedListCache>(key);
      // Optimistic removal only applies when unsaving (the SavedPage case). A
      // save-from-elsewhere would add a row, but that flow lives on other pages.
      if (currentlySaved && prev) {
        qc.setQueryData<SavedListCache>(key, {
          // The cast narrows the union to a homogeneous list — both variants share
          // the `itemId` field used for the filter, so the filtered result keeps
          // each variant's element type intact.
          items: (prev.items as Array<{ itemId: string }>).filter((i) => i.itemId !== itemId),
        } as SavedListCache);
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      // REVERT to the snapshot taken in onMutate.
      if (ctx?.prev) qc.setQueryData<SavedListCache>(key, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
    },
  });
}
