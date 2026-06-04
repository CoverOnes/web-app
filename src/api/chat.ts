/**
 * Thin re-export — delegates to the canonical chat API client in src/lib/api/chat.ts.
 *
 * The previous copy in this file used src/api/http.ts which read the Bearer
 * token from sessionStorage('auth_token') — a key never written by the current
 * auth system. All calls therefore went out unauthenticated.
 *
 * src/lib/api/chat.ts is identical in interface but routes through
 * src/lib/api/http.ts, which reads the access token from the Zustand authStore
 * via globalThis.__coverones_authStore__ and handles automatic token refresh.
 */
export { chatApi, default } from '../lib/api/chat';
