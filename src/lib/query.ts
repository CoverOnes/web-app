import { QueryClient, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  authApi,
  identitiesApi,
  kycApi,
  marketplaceApi,
  workspaceApi,
  notificationApi,
  type ContractStatus,
  type KycSubmitRequest,
  type OAuthProvider,
  type ResetPasswordRequest,
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
      // Transient auth gap → retry (token may still be refreshing). Other errors
      // fall back to the default single retry.
      if (status === 401 || status === 403) return failureCount < 2;
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

// ===== OAuth social-binding hooks (Settings → 社群帳號綁定) =====

export function useIdentities() {
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const authReady = !isHydrating && (!!accessToken || !!refreshToken);

  return useQuery({
    queryKey: ['identities'],
    queryFn: () => identitiesApi.list(),
    enabled: authReady,
    staleTime: 0,
  });
}

export function useUnlinkIdentity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: OAuthProvider) => identitiesApi.unlink(provider),
    // retry:false — 409 LAST_LOGIN_METHOD / 404 IDENTITY_NOT_FOUND are deterministic
    // and must surface to the caller for an inline message, not be auto-retried.
    retry: false,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['identities'] }),
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
    onError: (err) => { console.error('[useSubmitForSignature]', err); },
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
