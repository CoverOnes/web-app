/**
 * waitlist.test.ts
 *
 * Asserts that waitlistApi.join routes through publicHttp (the unauthenticated
 * client) and NOT through the Bearer-token-injecting `http` client.
 *
 * Security requirement: a logged-in user visiting /waitlist must NOT forward
 * their access token to the public /v1/waitlist upstream (defense-in-depth).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── vi.hoisted: declare mocks before the hoisted vi.mock factory runs ─────────
const { mockHttpPost, mockPublicHttpPost } = vi.hoisted(() => ({
  mockHttpPost: vi.fn().mockResolvedValue({ data: {} }),
  mockPublicHttpPost: vi.fn().mockResolvedValue({ data: {} }),
}));

// vi.mock is hoisted to the top of the file by Vitest, so the factory runs
// before any imports. The mocks declared via vi.hoisted() are available here.
vi.mock('./http', () => ({
  http: { post: mockHttpPost },
  publicHttp: { post: mockPublicHttpPost },
}));

// Import after the mock is set up.
import { waitlistApi } from './coverones';

describe('waitlistApi — no Bearer token forwarded to public endpoint', () => {
  beforeEach(() => {
    mockHttpPost.mockClear();
    mockPublicHttpPost.mockClear();
  });

  it('calls publicHttp.post (not http.post) for /v1/waitlist', async () => {
    await waitlistApi.join({ email: 'test@example.com' });

    // publicHttp has NO Authorization interceptor → safe to use for public routes.
    expect(mockPublicHttpPost).toHaveBeenCalledTimes(1);
    expect(mockPublicHttpPost).toHaveBeenCalledWith(
      '/v1/waitlist',
      { email: 'test@example.com' }
    );

    // The auth-injecting client MUST NOT be called.
    expect(mockHttpPost).not.toHaveBeenCalled();
  });

  it('does NOT invoke the auth-injecting http client (Bearer token not sent)', async () => {
    // If http.post is never called, no Bearer token can be attached.
    await waitlistApi.join({ email: 'user@corp.com', company: 'Corp' });

    expect(mockHttpPost).not.toHaveBeenCalled();
  });

  it('passes optional company and interestedIn fields through', async () => {
    await waitlistApi.join({
      email: 'cto@acme.com',
      company: 'Acme',
      interestedIn: '媒合平台',
    });

    expect(mockPublicHttpPost).toHaveBeenCalledWith('/v1/waitlist', {
      email: 'cto@acme.com',
      company: 'Acme',
      interestedIn: '媒合平台',
    });
  });
});
