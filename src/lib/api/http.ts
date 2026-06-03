import axios, { type AxiosInstance, AxiosError } from 'axios';
import { generateRequestId } from '../../utils/requestId';

// WA-M3: All backend calls route through the gateway. Use VITE_API_BASE_URL.
const GATEWAY_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

let isRefreshing = false;
// WA-M5: Queue holds both resolve AND reject callbacks so queued requests are
// properly drained on refresh failure (no dangling promises / hung requests).
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

// WA-M5: On success, resolve all queued requests with the new token.
const drainQueueSuccess = (token: string) => {
  refreshQueue.forEach(({ resolve }) => resolve(token));
  refreshQueue = [];
};

// WA-M5: On failure, reject all queued requests to prevent hung promises.
const drainQueueFailure = (err: unknown) => {
  refreshQueue.forEach(({ reject }) => reject(err));
  refreshQueue = [];
};

/**
 * Returns current access token from auth store without a circular import at module init time.
 * The store module is loaded lazily after all modules are evaluated.
 */
function getAccessToken(): string | null {
  try {
    // Dynamic import pattern to avoid circular dep at module evaluation time.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = (globalThis as any).__coverones_authStore__;
    if (mod) return mod.getState().accessToken as string | null;
  } catch {
    // Store not yet registered — expected during cold module load
  }
  return null;
}

/**
 * CoverOnes HTTP client — attaches Bearer token from useAuthStore;
 * on 401 attempts /v1/auth/refresh then redirects on failure.
 */
const createHttpClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: GATEWAY_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(
    (config) => {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.headers['X-Request-ID'] = generateRequestId();
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => {
      // Backend wraps every success response in { data: <payload> }.
      // Unwrap here so callers see the payload directly via r.data.
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        response.data = (response.data as { data: unknown }).data;
      }
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as typeof error.config & { _retry?: boolean };
      if (error.response?.status === 401 && !originalRequest?._retry) {
        const { useAuthStore } = await import('../../store/authStore');
        const { refreshToken, refreshTokens, clearStaleSession } = useAuthStore.getState();

        if (!refreshToken) {
          // No refresh token to retry with → clear any stale state and redirect.
          clearStaleSession();
          if (window.location.pathname !== '/login') window.location.href = '/login';
          return Promise.reject(error);
        }

        // WA-M5: Queue the request; both resolve and reject are stored so failure
        // properly rejects queued callers instead of leaving them hanging forever.
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            refreshQueue.push({
              resolve: (token: string) => {
                if (originalRequest) {
                  originalRequest.headers = originalRequest.headers ?? {};
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(client(originalRequest!));
              },
              reject,
            });
          });
        }

        isRefreshing = true;
        originalRequest._retry = true;

        try {
          // WA-M3: /v1/auth/refresh is a public gateway route (no /api/:svc prefix).
          const res = await axios.post<{ data: { accessToken: string; refreshToken: string } }>(
            `${GATEWAY_URL}/v1/auth/refresh`,
            { refreshToken }
          );
          const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data;
          refreshTokens(newAccess, newRefresh);
          // WA-M5: Resolve all queued requests with the new access token.
          drainQueueSuccess(newAccess);
          if (originalRequest) {
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          }
          return client(originalRequest!);
        } catch (refreshErr) {
          // WA-M5: Reject all queued requests so callers are not left hanging.
          drainQueueFailure(refreshErr);
          // Refresh token was stale/invalid → clear it and stop hydrating so the
          // app redirects to /login instead of hanging on the boot spinner.
          clearStaleSession();
          if (window.location.pathname !== '/login') window.location.href = '/login';
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const http = createHttpClient();
export default http;
