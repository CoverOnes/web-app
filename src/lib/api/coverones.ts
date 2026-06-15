import { http, publicHttp } from './http';
import type { AuthUser } from '../../store/authStore';

// ===== Auth =====
export type AccountType = 'PERSONAL' | 'COMPANY';

// auth Increment 1: register payload is a discriminated union on accountType.
// Shared fields apply to both; variant-specific fields are required only for
// their account type (PERSONAL → nationalId, COMPANY → companyName).
interface RegisterBase {
  email: string;
  password: string;
  displayName: string;
  // Real name / legal name — REQUIRED for both account types (1-100 chars).
  legalName: string;
}

export interface RegisterPersonalRequest extends RegisterBase {
  accountType: 'PERSONAL';
  // TW national ID (e.g. A123456789) — required only for PERSONAL accounts.
  nationalId: string;
}

export interface RegisterCompanyRequest extends RegisterBase {
  accountType: 'COMPANY';
  // Company name — required only for COMPANY accounts.
  companyName: string;
}

export type RegisterRequest = RegisterPersonalRequest | RegisterCompanyRequest;

export interface LoginRequest {
  email: string;
  password: string;
  deviceFingerprint?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

// auth Increment 1: register no longer returns tokens. The user is created in
// PENDING_VERIFICATION with emailVerified=false and must verify before login.
export interface RegisterResponse {
  user: AuthUser;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  emailVerified: boolean;
  kycTier?: number;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  // Always a generic message regardless of whether the email exists.
  message: string;
}

// ── Password reset ──────────────────────────────────────────────────────────

export interface ForgotPasswordRequest {
  email: string;
}

// Backend always returns a generic 202 — never reveals whether the email exists.
export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// 200 { reset: true } on success; 400 INVALID_RESET_TOKEN / 422 WEAK_PASSWORD on error.
export interface ResetPasswordResponse {
  reset: boolean;
}

// ===== OAuth / Social Login =====

export type OAuthProvider = 'google' | 'line';

export interface OAuthExchangeRequest {
  code: string;
}

// Exchange response mirrors LoginResponse shape (tokenType confirmed by contract).
export interface OAuthExchangeResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn?: number;
}

export interface OAuthIdentity {
  provider: OAuthProvider;
  // Provider-registered email for this identity.
  email: string;
  linkedAt: string;
}

// GET /api/user/v1/me/identities response envelope.
// hasPassword: true when the user has a password-based login method —
// used to decide whether unbinding the last social identity is safe.
export interface ListIdentitiesResponse {
  identities: OAuthIdentity[];
  hasPassword: boolean;
}

// POST /api/user/v1/me/identities/:provider → { authorizeUrl }
// FE follows the URL with window.location.href to start the bind flow.
export interface OAuthBindStartResponse {
  authorizeUrl: string;
}

// ── OAuth registration (no-email provider e.g. LINE) ──────────────────────────
// When a provider (e.g. LINE) does not supply an email address the backend
// cannot complete registration automatically. Instead of silently creating a
// placeholder account it redirects to /auth/callback?register=<regToken>.
// The FE collects an email, then calls POST /v1/auth/oauth/register.

export interface OAuthRegisterRequest {
  // Opaque short-lived token issued by the backend identifying the pending
  // OAuth registration session.
  regToken: string;
  // Email collected from the user (provider did not supply one).
  email: string;
}

// Backend returns a one-time code to exchange for tokens (same as normal OAuth
// login code flow), or email_exists if the email is already registered.
// FLAG: field name `code` assumed — reconcile with eng-oauth-be if the backend
//       returns tokens directly instead of a code. The current assumption is:
//       201 { code: string } → FE calls oauthExchange({ code }) to get tokens.
export interface OAuthRegisterResponse {
  // One-time code to pass to oauthExchange. Backend issues this so the same
  // exchange path is reused regardless of whether this is a first-time login
  // or registration completion.
  code: string;
}

// ===== Marketplace =====
export interface Listing {
  id: string;
  ownerUserId: string;
  title: string;
  description: string;
  budgetMin: string | null;
  budgetMax: string | null;
  currency: string;
  status: 'OPEN' | 'AWARDED' | 'CLOSED';
  createdAt: string;
}

export interface CreateListingRequest {
  title: string;
  description: string;
  budgetMin?: string;
  budgetMax?: string;
  currency?: string;
}

export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface Bid {
  id: string;
  listingId: string;
  bidderUserId: string;
  amount: string;
  currency: string;
  message: string;
  status: BidStatus;
}

export interface CreateBidRequest {
  amount: string;
  currency?: string;
  message: string;
}

// Award — the shape returned by POST /api/marketplace/v1/bids/:id/accept.
// NOTE: The backend returns the Award entity (marketplace/internal/domain/award.go)
// which does NOT include contractId. The contract is created asynchronously in a
// detached goroutine after the response returns (bid_service.go:248,296-314).
// Discovery must happen client-side: list workspace contracts and match by listingId.
export interface AwardResponse {
  id: string;
  listingId: string;
  bidId: string;
  ownerUserId: string;
  bidderUserId: string;
  amount: string;
  currency: string;
  createdAt: string;
}

// ===== Workspace =====
// WA-M1: backend emits 'CANCELLED' (double L) — matches SQL CHECK constraint in domain/contract.go
export type ContractStatus = 'DRAFT' | 'PENDING_SIGNATURE' | 'SIGNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Contract {
  id: string;
  listingId: string;
  clientUserId: string;
  freelancerUserId: string;
  title: string;
  terms: string;
  amount: string;
  currency: string;
  status: ContractStatus;
  createdAt: string;
  // Server-computed canonical hash of the contract content (workspace/internal/domain/contract.go:36).
  // Signers MUST use this value directly — signing sha256(terms) produces a different digest
  // and the backend will reject it (signature_handler.go:68 validates against ContentHash).
  contentHash: string;
  // Present when the contract was created from an accepted bid.
  acceptedBidId?: string;
  // Optimistic concurrency version — incremented on each state transition.
  version?: number;
}

export interface Signature {
  id: string;
  contractId: string;
  signerUserId: string;
  signedContentHash: string;
  signerIp: string;
  signedAt: string;
}

// WA-M2: backend uses 'DOING' not 'IN_PROGRESS' — matches domain/task.go (TODO, DOING, DONE)
export type TaskStatus = 'TODO' | 'DOING' | 'DONE';

export interface Task {
  id: string;
  contractId: string;
  title: string;
  status: TaskStatus;
  assigneeUserId: string | null;
  createdAt: string;
}

export interface CreateTaskRequest {
  title: string;
  assigneeUserId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  status?: TaskStatus;
  assigneeUserId?: string;
  clearAssignee?: boolean;
}

// ===== API functions =====
// WA-M3: All calls route through the gateway configured by VITE_API_BASE_URL,
// or same-origin relative paths when that env var is omitted.
//   - Auth routes are public gateway routes: POST /v1/auth/{register,login,refresh,logout}
//     The gateway forwards these directly to the user upstream (no /api/:svc wrapper).
//   - Protected routes use /api/:svc/* pattern; the gateway strips /api/:svc and forwards
//     the remainder to the upstream. E.g. /api/user/v1/me → user service receives /v1/me.
//   - JWKS lives at /jwks (gateway-level public forwarding to user upstream).

export const authApi = {
  register: (data: RegisterRequest) =>
    http.post<RegisterResponse>('/v1/auth/register', data).then((r) => r.data),

  login: (data: LoginRequest) =>
    http.post<LoginResponse>('/v1/auth/login', data).then((r) => r.data),

  logout: (refreshToken: string) =>
    http.post('/v1/auth/logout', { refreshToken }).then((r) => r.data),

  // auth Increment 1: explicit refresh so the client can mint a fresh access
  // token after verifying email (the new token carries email_verified=true).
  // /v1/auth/refresh is a public gateway route; the http client unwraps { data }.
  refresh: (refreshToken: string) =>
    http.post<Pick<LoginResponse, 'accessToken' | 'refreshToken'>>(
      '/v1/auth/refresh',
      { refreshToken }
    ).then((r) => r.data),

  // auth Increment 1: /v1/auth/verify-email is a public gateway route.
  // 200 { data: { emailVerified: true, kycTier: 1 } }; 400 INVALID_VERIFICATION_TOKEN on bad token.
  verifyEmail: (data: VerifyEmailRequest) =>
    http.post<VerifyEmailResponse>('/v1/auth/verify-email', data).then((r) => r.data),

  // auth Increment 1: /v1/auth/resend-verification — 202 with a generic message
  // (always generic, never leaks whether the email exists).
  resendVerification: (data: ResendVerificationRequest) =>
    http.post<ResendVerificationResponse>('/v1/auth/resend-verification', data).then((r) => r.data),

  // POST /v1/auth/forgot-password — always 202 with generic message; never leaks
  // whether the email exists (anti-enumeration). isAuthFlowRequest covers this path.
  forgotPassword: (data: ForgotPasswordRequest) =>
    http.post<ForgotPasswordResponse>('/v1/auth/forgot-password', data).then((r) => r.data),

  // POST /v1/auth/reset-password — 200 { reset: true } on success.
  // 400 INVALID_RESET_TOKEN when the token is expired/invalid.
  // 422 WEAK_PASSWORD when the password does not meet the policy (min 12 chars).
  // isAuthFlowRequest covers this path so a 400 never triggers the refresh loop.
  resetPassword: (data: ResetPasswordRequest) =>
    http.post<ResetPasswordResponse>('/v1/auth/reset-password', data).then((r) => r.data),

  // /api/user/v1/me → gateway strips /api/user → user service receives /v1/me
  // Accepts an optional token to use directly (bypasses store, for post-login hydration).
  me: (token?: string) =>
    http.get<AuthUser>('/api/user/v1/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }).then((r) => r.data),

  // ── OAuth ──────────────────────────────────────────────────────────────────
  // Exchange a one-time authorisation code (from the OAuth callback) for tokens.
  // isAuthFlowRequest covers /v1/auth/oauth/ so a 401 never triggers the
  // access-token refresh-retry loop.
  oauthExchange: (data: OAuthExchangeRequest) =>
    http.post<OAuthExchangeResponse>('/v1/auth/oauth/exchange', data).then((r) => r.data),

  // List social identities bound to the current user.
  // GET /api/user/v1/me/identities → { identities: [...], hasPassword: boolean }
  listIdentities: () =>
    http.get<ListIdentitiesResponse>('/api/user/v1/me/identities').then((r) => r.data),

  // Initiate OAuth bind flow for an already-authenticated user.
  // POST /api/user/v1/me/identities/:provider → { authorizeUrl }
  // FE follows the returned URL (window.location.href) so the backend can
  // attach the new identity to the already-authenticated session.
  bindIdentity: (provider: OAuthProvider) =>
    http
      .post<OAuthBindStartResponse>(`/api/user/v1/me/identities/${provider}`)
      .then((r) => {
        // Security: validate the server-supplied redirect URL before navigating
        // (CWE-601 open redirect defence). Only allow HTTPS origins from the
        // real OAuth providers — google and line are the only OAuthProvider values.
        const ALLOWED_ORIGINS: Record<OAuthProvider, string> = {
          google: 'https://accounts.google.com',
          line: 'https://access.line.me',
        };
        let parsed: URL;
        try {
          parsed = new URL(r.data.authorizeUrl);
        } catch {
          throw new Error('Invalid authorizeUrl returned by server.');
        }
        if (parsed.protocol !== 'https:' || parsed.origin !== ALLOWED_ORIGINS[provider]) {
          throw new Error('authorizeUrl origin is not an allowed OAuth provider.');
        }
        window.location.href = r.data.authorizeUrl;
      }),

  // Remove a social identity from the current user.
  // DELETE /api/user/v1/me/identities/:provider → 204
  // 409 LAST_LOGIN_METHOD when trying to remove the only remaining method.
  unbindIdentity: (provider: OAuthProvider) =>
    http.delete(`/api/user/v1/me/identities/${provider}`).then((r) => r.data),

  // Complete OAuth registration when the provider did not supply an email.
  // POST /v1/auth/oauth/register { regToken, email }
  //   201 { code } → FE calls oauthExchange({ code }) to mint session tokens.
  //   409 EMAIL_EXISTS → surface "use password login + bind in Settings" UX.
  // isAuthFlowRequest covers /v1/auth/oauth/ so a 401 here never triggers
  // the access-token refresh-retry loop.
  // FLAG: path confirmed as /v1/auth/oauth/register (gateway public route,
  //       no /api/:svc prefix) — reconcile with eng-oauth-be if it moves.
  oauthRegister: (data: OAuthRegisterRequest) =>
    http
      .post<OAuthRegisterResponse>('/v1/auth/oauth/register', data)
      .then((r) => r.data),
};

export const marketplaceApi = {
  listListings: (params?: { status?: string; mine?: boolean }) =>
    http.get<Listing[]>('/api/marketplace/v1/listings', { params }).then((r) => r.data),

  createListing: (data: CreateListingRequest) =>
    http.post<Listing>('/api/marketplace/v1/listings', data).then((r) => r.data),

  getListing: (id: string) =>
    http.get<Listing>(`/api/marketplace/v1/listings/${id}`).then((r) => r.data),

  listBidsForListing: (listingId: string) =>
    http.get<Bid[]>(`/api/marketplace/v1/listings/${listingId}/bids`).then((r) => r.data),

  createBid: (listingId: string, data: CreateBidRequest) =>
    http.post<Bid>(`/api/marketplace/v1/listings/${listingId}/bids`, data).then((r) => r.data),

  getMyBids: () =>
    http.get<Bid[]>('/api/marketplace/v1/bids').then((r) => r.data),

  acceptBid: (bidId: string) =>
    http.post<AwardResponse>(`/api/marketplace/v1/bids/${bidId}/accept`).then((r) => r.data),

  rejectBid: (bidId: string) =>
    http.post<Bid>(`/api/marketplace/v1/bids/${bidId}/reject`).then((r) => r.data),

  withdrawBid: (bidId: string) =>
    http.post<Bid>(`/api/marketplace/v1/bids/${bidId}/withdraw`).then((r) => r.data),
};

// ===== KYC (Increment 2) =====
// Routes through the gateway with the /api/:svc/* pattern: /api/kyc/v1/kyc/*
// (gateway strips /api/kyc → kyc service receives /v1/kyc/*). The user must
// already have a verified email (gateway injects X-Email-Verified); the backend
// returns 403 EMAIL_NOT_VERIFIED otherwise, and 429 when rate-limited (3/15min).

export type KycSubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface KycSubmission {
  id: string;
  accountType: AccountType;
  status: KycSubmissionStatus;
  // Present once a tier has been granted (dev auto-approves at tier 2).
  tierGranted?: number;
  submittedAt: string;
  reviewedAt?: string;
}

export interface KycStatusResponse {
  currentTier: number;
  kycType: string;
  // null when the user has never submitted a KYC application.
  submission: KycSubmission | null;
}

// Discriminated union on accountType so each variant only carries its own id
// field — PERSONAL → nationalId, COMPANY → businessId (統一編號). legalName is
// the registrant's real name for both.
interface KycSubmitBase {
  legalName: string;
}

export interface KycSubmitPersonalRequest extends KycSubmitBase {
  accountType: 'PERSONAL';
  nationalId: string;
}

export interface KycSubmitCompanyRequest extends KycSubmitBase {
  accountType: 'COMPANY';
  // 統一編號 — 8-digit Taiwan business ID.
  businessId: string;
}

export type KycSubmitRequest = KycSubmitPersonalRequest | KycSubmitCompanyRequest;

export interface KycSubmitResponse {
  submission: KycSubmission;
  currentTier: number;
  // true when this submission promoted the user to a higher tier.
  promoted: boolean;
}

export const kycApi = {
  // GET /api/kyc/v1/kyc/status → { data: { currentTier, kycType, submission } }
  getStatus: () =>
    http.get<KycStatusResponse>('/api/kyc/v1/kyc/status').then((r) => r.data),

  // POST /api/kyc/v1/kyc/submit — dev returns 201 with promoted=true, tierGranted=2.
  submit: (data: KycSubmitRequest) =>
    http.post<KycSubmitResponse>('/api/kyc/v1/kyc/submit', data).then((r) => r.data),
};

export const workspaceApi = {
  listContracts: (params?: { status?: ContractStatus }) =>
    http.get<Contract[]>('/api/workspace/v1/contracts', { params }).then((r) => r.data),

  getContract: (id: string) =>
    http.get<Contract>(`/api/workspace/v1/contracts/${id}`).then((r) => r.data),

  // DRAFT -> PENDING_SIGNATURE. Client-only on the backend; a non-client party
  // or non-party receives 404 (IDOR-safe).
  submitContractForSignature: (id: string) =>
    http.post<Contract>(`/api/workspace/v1/contracts/${id}/submit-for-signature`).then((r) => r.data),

  signContract: (id: string, signedContentHash: string) =>
    http.post<Contract>(`/api/workspace/v1/contracts/${id}/sign`, { signedContentHash }).then((r) => r.data),

  cancelContract: (id: string) =>
    http.post<Contract>(`/api/workspace/v1/contracts/${id}/cancel`).then((r) => r.data),

  getSignatures: (contractId: string) =>
    http.get<Signature[]>(`/api/workspace/v1/contracts/${contractId}/signatures`).then((r) => r.data),

  listTasks: (contractId: string) =>
    http.get<Task[]>(`/api/workspace/v1/contracts/${contractId}/tasks`).then((r) => r.data),

  createTask: (contractId: string, data: CreateTaskRequest) =>
    http.post<Task>(`/api/workspace/v1/contracts/${contractId}/tasks`, data).then((r) => r.data),

  updateTask: (contractId: string, taskId: string, data: UpdateTaskRequest) =>
    http.patch<Task>(`/api/workspace/v1/contracts/${contractId}/tasks/${taskId}`, data).then((r) => r.data),
};

// ===== Waitlist (public) =====
// POST /v1/waitlist — no auth required; gateway public route (no /api/:svc prefix).
// Duplicate email returns 202 (privacy-preserving); any 2xx is treated as success.
// isAuthFlowRequest does NOT need to cover this path because it is only called by
// useJoinWaitlist which fires before the user is authenticated, and no refresh
// interceptor logic applies to non-401 responses.

export interface WaitlistJoinRequest {
  email: string;
  company?: string;
  interestedIn?: string;
}

// Backend returns 202 with a generic envelope; we only need status (unwrapped by
// the response interceptor). Callers treat any resolved promise as success.
export interface WaitlistJoinResponse {
  message?: string;
}

export const waitlistApi = {
  // Uses publicHttp (no Authorization header) — /v1/waitlist is a public
  // endpoint and must not receive the user's Bearer token even when logged in.
  join: (data: WaitlistJoinRequest) =>
    publicHttp.post<WaitlistJoinResponse>('/v1/waitlist', data).then((r) => r.data),
};

// ===== Notifications =====
// notification service: GET /api/notification/v1/me/notifications
//                       GET /api/notification/v1/me/notifications/unread-count
//                       POST /api/notification/v1/me/notifications/:id/read
//                       POST /api/notification/v1/me/notifications/read-all
// (gateway strips /api/notification → notification service receives /v1/me/notifications)

export type NotificationType =
  | 'KYC_TIER_CHANGED'
  | 'BID_RECEIVED'
  | 'BID_ACCEPTED'
  | 'MILESTONE_REACHED'
  | 'CONTRACT_SIGNED'
  | 'ACCOUNT_SUSPENDED'
  | 'KYC_STATUS_CHANGED';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  // Raw JSON payload — structure varies per type.
  data?: Record<string, unknown>;
  sourceEventId?: string;
  // null when unread
  readAt: string | null;
  createdAt: string;
}

export interface ListNotificationsResponse {
  items: Notification[];
  // Opaque cursor for the next page; absent when no more pages.
  nextCursor?: string;
}

export interface UnreadCountResponse {
  count: number;
}

export const notificationApi = {
  // GET /api/notification/v1/me/notifications
  // Cursor-paginated list; limit defaults to 20 server-side.
  list: (params?: { cursor?: string; limit?: number }) =>
    http
      .get<ListNotificationsResponse>('/api/notification/v1/me/notifications', { params })
      .then((r) => r.data),

  // GET /api/notification/v1/me/notifications/unread-count
  unreadCount: () =>
    http
      .get<UnreadCountResponse>('/api/notification/v1/me/notifications/unread-count')
      .then((r) => r.data),

  // POST /api/notification/v1/me/notifications/:id/read → 204 No Content
  markRead: (id: string) =>
    http
      .post<void>(`/api/notification/v1/me/notifications/${id}/read`)
      .then((r) => r.data),

  // POST /api/notification/v1/me/notifications/read-all → 204 No Content
  markAllRead: () =>
    http
      .post<void>('/api/notification/v1/me/notifications/read-all')
      .then((r) => r.data),
};
