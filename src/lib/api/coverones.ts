import { http } from './http';
import type { AuthUser } from '../../store/authStore';

// ===== Auth =====
export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  accountType: 'PERSONAL' | 'COMPANY';
  companyName?: string;
}

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

export interface RegisterResponse {
  user: AuthUser;
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

export interface AwardResponse {
  bidId: string;
  listingId: string;
  contractId: string;
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
  // WA-fix: backend-computed canonical hash of the contract content.
  // The sign endpoint expects this exact value as signedContentHash — clients
  // MUST NOT recompute it locally (mismatch → 409).
  contentHash: string;
  createdAt: string;
}

export interface CreateContractRequest {
  listingId: string;
  acceptedBidId: string;
  freelancerUserId: string;
  title: string;
  terms: string;
  amount: string;
  currency: string;
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
// WA-M3: All calls route through the gateway (VITE_API_BASE_URL = http://localhost:8080).
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

  // /api/user/v1/me → gateway strips /api/user → user service receives /v1/me
  // Accepts an optional token to use directly (bypasses store, for post-login hydration).
  me: (token?: string) =>
    http.get<AuthUser>('/api/user/v1/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }).then((r) => r.data),
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

export const workspaceApi = {
  listContracts: (params?: { status?: ContractStatus }) =>
    http.get<Contract[]>('/api/workspace/v1/contracts', { params }).then((r) => r.data),

  createContract: (payload: CreateContractRequest) =>
    http.post<Contract>('/api/workspace/v1/contracts', payload).then((r) => r.data),

  submitContract: (id: string) =>
    http.post<Contract>(`/api/workspace/v1/contracts/${id}/submit`).then((r) => r.data),

  getContract: (id: string) =>
    http.get<Contract>(`/api/workspace/v1/contracts/${id}`).then((r) => r.data),

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
