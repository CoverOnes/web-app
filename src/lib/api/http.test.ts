import { describe, it, expect } from 'vitest';
import { isAuthFlowRequest, getApiErrorCode, getApiErrorMessage } from './http';

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

// ─── getApiErrorCode ──────────────────────────────────────────────────────────
// Regression guard: backend error envelope is {error:{code,message}}.
// Multiple call sites previously read body.code / body.data.code — wrong path.

describe('getApiErrorCode', () => {
  it('reads the canonical nested envelope {error:{code}} correctly', () => {
    const err = { response: { data: { error: { code: 'EMAIL_NOT_VERIFIED', message: 'Email not verified' } } } };
    expect(getApiErrorCode(err)).toBe('EMAIL_NOT_VERIFIED');
  });

  it('falls back to flat body.code if error.code is absent', () => {
    const err = { response: { data: { code: 'SOME_FLAT_CODE' } } };
    expect(getApiErrorCode(err)).toBe('SOME_FLAT_CODE');
  });

  it('falls back to body.data.code (legacy shape) if both primary paths are absent', () => {
    const err = { response: { data: { data: { code: 'LEGACY_CODE' } } } };
    expect(getApiErrorCode(err)).toBe('LEGACY_CODE');
  });

  it('returns undefined when there is no code at any path', () => {
    expect(getApiErrorCode({ response: { data: {} } })).toBeUndefined();
    expect(getApiErrorCode({})).toBeUndefined();
    expect(getApiErrorCode(null)).toBeUndefined();
    expect(getApiErrorCode(undefined)).toBeUndefined();
  });

  it('prefers error.code over flat code (correct priority order)', () => {
    const err = {
      response: {
        data: {
          error: { code: 'NESTED_WINS' },
          code: 'FLAT_LOSES',
        },
      },
    };
    expect(getApiErrorCode(err)).toBe('NESTED_WINS');
  });
});

// ─── getApiErrorMessage ───────────────────────────────────────────────────────

describe('getApiErrorMessage', () => {
  it('reads the canonical nested envelope {error:{message}} correctly', () => {
    const err = { response: { data: { error: { code: 'X', message: 'Email is not verified' } } } };
    expect(getApiErrorMessage(err)).toBe('Email is not verified');
  });

  it('falls back to flat body.message', () => {
    const err = { response: { data: { message: 'Something went wrong' } } };
    expect(getApiErrorMessage(err)).toBe('Something went wrong');
  });

  it('returns undefined when no message exists', () => {
    expect(getApiErrorMessage({ response: { data: {} } })).toBeUndefined();
  });
});
