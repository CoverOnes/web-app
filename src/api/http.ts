/**
 * Thin re-export — delegates to the canonical HTTP client in src/lib/api/http.ts.
 *
 * The original implementation in this file read the Bearer token from
 * sessionStorage('auth_token'), a key that is never written by the current auth
 * system (authStore keeps the access token in-memory via Zustand). That meant
 * every API call through this client silently sent NO Authorization header.
 *
 * src/lib/api/http.ts is the authoritative client: it reads the access token
 * via the globalThis.__coverones_authStore__ accessor and handles token refresh.
 * All callers of this module now transparently use the correct client.
 */
export { http, default } from '../lib/api/http';
