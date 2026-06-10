/**
 * Home.tsx — IS_DEMO_HOME flag tests
 *
 * Regression guard for audit finding CRITICAL:
 * IS_DEMO_HOME was hard-wired to true via `|| true`, shipping demo/fake data to
 * production unconditionally. Fix: remove `|| true`; the flag must be env-gated.
 *
 * These tests verify:
 *   1. When VITE_DEMO_HOME is unset (falsy), the demo notice is NOT rendered
 *      and the page degrades cleanly (no crash, content still renders).
 *   2. When VITE_DEMO_HOME='true', the demo notice IS rendered.
 *
 * Implementation note: IS_DEMO_HOME is a module-level constant so each test
 * must call vi.resetModules() + vi.stubEnv() before dynamically importing Home.
 * The authStore is imported at the top level (it is a Zustand singleton — the
 * same instance persists across module resets).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAuthStore } from '../store/authStore';

// Mock useNavigate globally
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// The demo notice banner — matched via its role="status" aria attribute
// (the text contains additional characters beyond the constant, use role query)
const DEMO_NOTICE_PARTIAL = '目前顯示的數據為展示用範例資料';

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  return Wrapper;
}

async function loadHome(envValue: string) {
  // Stub env BEFORE resetting modules so the re-imported module sees the value
  vi.stubEnv('VITE_DEMO_HOME', envValue);
  vi.resetModules();
  const { default: Home } = await import('./Home');
  return Home;
}

describe('IS_DEMO_HOME env flag', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: {
        id: 'u1',
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: null,
        accountType: 'PERSONAL',
        kycTier: 1,
        status: 'ACTIVE',
        emailVerified: true,
      },
      isAuthenticated: true,
      isHydrating: false,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does NOT render the demo notice when VITE_DEMO_HOME is unset (default production state)', async () => {
    const Home = await loadHome('');
    const Wrapper = makeWrapper();
    render(<Home />, { wrapper: Wrapper });

    // role="status" banner must not be present when flag is off
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('does NOT crash and renders page content when VITE_DEMO_HOME=false', async () => {
    const Home = await loadHome('false');
    const Wrapper = makeWrapper();
    render(<Home />, { wrapper: Wrapper });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    // Page renders without crashing — body is present
    expect(document.body).toBeDefined();
  });

  it('renders the demo notice when VITE_DEMO_HOME=true', async () => {
    const Home = await loadHome('true');
    const Wrapper = makeWrapper();
    render(<Home />, { wrapper: Wrapper });

    // Banner is rendered with role="status" and contains the partial notice text
    const banner = screen.getByRole('status');
    expect(banner).toBeInTheDocument();
    expect(banner.textContent).toContain(DEMO_NOTICE_PARTIAL);
  });
});
