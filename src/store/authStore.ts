import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  accountType: string;
  kycTier: number;
  status: string;
  // auth Increment 1: backend's /me + the access-token JWT now carry an
  // email_verified claim. Until the user verifies, write actions (發案/投標/
  // KYC/合約) are gated client-side and the backend returns 403 EMAIL_NOT_VERIFIED.
  emailVerified: boolean;
  companyId?: string | null;
  createdAt?: string;
}

interface AuthState {
  // WA-M6: accessToken is kept IN MEMORY ONLY (Zustand state, NOT localStorage).
  // This limits XSS exposure: a script cannot steal the short-lived access token.
  // The refreshToken stays in localStorage so sessions survive page reloads.
  // Production hardening follow-up: migrate refreshToken to httpOnly cookie
  // (requires backend Set-Cookie support) — see WA-M6 in the audit report.
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrating: boolean;

  login: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => void;
  // Clears a stale / invalid session (e.g. expired refresh token on app boot).
  // Removes the persisted refresh token, resets auth state, and — critically —
  // sets isHydrating=false so the app never gets stuck on the boot spinner.
  clearStaleSession: () => void;
  setUser: (user: AuthUser) => void;
  refreshTokens: (newAccessToken: string, newRefreshToken: string) => void;
  setHydrating: (v: boolean) => void;
  // auth Increment 1: optimistically flip emailVerified after a successful
  // /verify-email call so the unverified banner + write-action gates clear
  // immediately, even before the access token is refreshed with the new claim.
  setEmailVerified: (v: boolean) => void;
  // Email verification is Tier 1. Update the in-memory user without downgrading a
  // user who has already completed higher KYC.
  setKycTierAtLeast: (tier: number) => void;
}

// Only the refresh token is persisted; the access token lives in memory only.
const REFRESH_KEY = 'coverones_refresh_token';

export const useAuthStore = create<AuthState>((set) => ({
  // WA-M6: Access token starts null (in-memory only).
  // On app boot, AppBootstrap calls authApi.me() if refreshToken exists, which
  // triggers a /v1/auth/refresh via the 401 interceptor, repopulating accessToken.
  accessToken: null,
  refreshToken: localStorage.getItem(REFRESH_KEY),
  user: null,
  isAuthenticated: false,
  isHydrating: true,

  login: (accessToken, refreshToken, user) => {
    // WA-M6: Access token stored in memory only (NOT localStorage).
    localStorage.setItem(REFRESH_KEY, refreshToken);
    set({ accessToken, refreshToken, user, isAuthenticated: true, isHydrating: false });
  },

  logout: () => {
    localStorage.removeItem(REFRESH_KEY);
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false, isHydrating: false });
  },

  clearStaleSession: () => {
    // A stale/invalid refresh token in localStorage must NOT leave the app
    // hanging on the hydrating spinner. Clear everything and stop hydrating so
    // ProtectedRoute falls through to <Navigate to="/login" />.
    localStorage.removeItem(REFRESH_KEY);
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false, isHydrating: false });
  },

  setUser: (user) => set({ user, isAuthenticated: true }),

  refreshTokens: (newAccessToken, newRefreshToken) => {
    // WA-M6: Only refresh token goes to localStorage; access token stays in memory.
    localStorage.setItem(REFRESH_KEY, newRefreshToken);
    set({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  },

  setHydrating: (v) => set({ isHydrating: v }),

  setEmailVerified: (v) =>
    set((state) => (state.user ? { user: { ...state.user, emailVerified: v } } : {})),

  setKycTierAtLeast: (tier) =>
    set((state) => (
      state.user
        ? { user: { ...state.user, kycTier: Math.max(state.user.kycTier, tier) } }
        : {}
    )),
}));

// Register on globalThis so http.ts can access the token without a circular import.
// This executes once when the module is first imported.
(globalThis as Record<string, unknown>)['__coverones_authStore__'] = useAuthStore;

export default useAuthStore;
