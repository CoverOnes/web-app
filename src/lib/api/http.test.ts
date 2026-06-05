import { describe, it, expect } from 'vitest';
import { isAuthFlowRequest } from './http';

// Regression guard for the 401-interceptor masking bug:
// auth-flow 401s (wrong password / expired refresh token) must bypass the
// access-token refresh retry, otherwise a stale refresh token surfaces
// "refresh token has expired" instead of the real credential error.
describe('isAuthFlowRequest', () => {
  it('matches the credential endpoints whose 401s must NOT trigger refresh-retry', () => {
    expect(isAuthFlowRequest('/v1/auth/login')).toBe(true);
    expect(isAuthFlowRequest('/v1/auth/register')).toBe(true);
    expect(isAuthFlowRequest('/v1/auth/refresh')).toBe(true);
    // also matches when a full base URL is prefixed
    expect(isAuthFlowRequest('http://localhost:8080/v1/auth/login')).toBe(true);
  });

  it('does NOT match protected/proxy routes (their 401s should still refresh)', () => {
    expect(isAuthFlowRequest('/api/user/v1/me')).toBe(false);
    expect(isAuthFlowRequest('/api/marketplace/v1/listings')).toBe(false);
    expect(isAuthFlowRequest('/v1/me')).toBe(false);
  });

  it('is safe for undefined/empty url', () => {
    expect(isAuthFlowRequest(undefined)).toBe(false);
    expect(isAuthFlowRequest('')).toBe(false);
  });
});
