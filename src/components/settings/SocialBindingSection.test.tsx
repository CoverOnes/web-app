/**
 * SocialBindingSection.test.tsx
 *
 * Covers: linked/unlinked list render, link-button starts the link flow, unlink
 * surfaces the LAST_LOGIN_METHOD guard. Query hooks are mocked (project tests do
 * not wrap a live QueryClient); the OAuth API helper is mocked per case.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SocialBindingSection } from './SocialBindingSection';
import type { Identity } from '../../lib/api/coverones';

// Mock the query hooks so we control list state + the unlink mutation.
const mockRefetch = vi.fn();
const mockUnlinkMutateAsync = vi.fn();
let identitiesState: {
  data: Identity[] | undefined;
  isLoading: boolean;
  isError: boolean;
};

vi.mock('../../lib/query', () => ({
  useIdentities: () => ({ ...identitiesState, refetch: mockRefetch }),
  useUnlinkIdentity: () => ({
    mutateAsync: mockUnlinkMutateAsync,
    isPending: false,
    variables: undefined,
  }),
}));

// Mock the OAuth API helper (linkStart) used directly by the component.
vi.mock('../../lib/api/coverones', () => ({
  identitiesApi: {
    linkStart: vi.fn(),
  },
}));

import { identitiesApi } from '../../lib/api/coverones';
const mockLinkStart = vi.mocked(identitiesApi.linkStart);

function renderSection() {
  return render(
    <MemoryRouter>
      <SocialBindingSection />
    </MemoryRouter>,
  );
}

describe('SocialBindingSection — render', () => {
  beforeEach(() => {
    mockRefetch.mockReset();
    mockUnlinkMutateAsync.mockReset();
    mockLinkStart.mockReset();
    identitiesState = { data: [], isLoading: false, isError: false };
  });

  it('renders the section title and both provider rows', () => {
    renderSection();
    expect(screen.getByRole('heading', { name: '社群帳號綁定' })).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('LINE')).toBeInTheDocument();
  });

  it('shows a 綁定 button for an unlinked provider', () => {
    renderSection();
    expect(screen.getByRole('button', { name: '綁定 Google' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '綁定 LINE' })).toBeInTheDocument();
  });

  it('shows linked state + 解除綁定 button with the masked email', () => {
    identitiesState = {
      data: [{ provider: 'GOOGLE', email: 'j***@e***.com', linkedAt: '2026-06-06T00:00:00Z' }],
      isLoading: false,
      isError: false,
    };
    renderSection();
    expect(screen.getByRole('button', { name: '解除綁定 Google' })).toBeInTheDocument();
    expect(screen.getByText(/j\*\*\*@e\*\*\*\.com/)).toBeInTheDocument();
    // LINE remains unlinked.
    expect(screen.getByRole('button', { name: '綁定 LINE' })).toBeInTheDocument();
  });

  it('renders a loading state', () => {
    identitiesState = { data: undefined, isLoading: true, isError: false };
    renderSection();
    expect(screen.getByRole('status')).toHaveTextContent('載入中…');
  });
});

describe('SocialBindingSection — interaction', () => {
  beforeEach(() => {
    mockRefetch.mockReset();
    mockUnlinkMutateAsync.mockReset();
    mockLinkStart.mockReset();
    identitiesState = { data: [], isLoading: false, isError: false };
  });

  it('starts the link flow and navigates to the authorizeUrl on 綁定 click', async () => {
    const user = userEvent.setup();
    mockLinkStart.mockResolvedValue({ authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth?x=1' });

    const originalLocation = window.location;
    const hrefSetter = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, set href(v: string) { hrefSetter(v); } },
    });

    renderSection();
    await user.click(screen.getByRole('button', { name: '綁定 Google' }));

    await waitFor(() => {
      expect(mockLinkStart).toHaveBeenCalledWith('google');
      expect(hrefSetter).toHaveBeenCalledWith('https://accounts.google.com/o/oauth2/v2/auth?x=1');
    });

    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  it('shows the LAST_LOGIN_METHOD guard message when unlink is rejected', async () => {
    const user = userEvent.setup();
    identitiesState = {
      data: [{ provider: 'LINE', email: null, linkedAt: '2026-06-06T00:00:00Z' }],
      isLoading: false,
      isError: false,
    };
    mockUnlinkMutateAsync.mockRejectedValue(
      Object.assign(new Error('conflict'), {
        isAxiosError: true,
        response: { data: { error: { code: 'LAST_LOGIN_METHOD' } } },
      }),
    );

    renderSection();
    await user.click(screen.getByRole('button', { name: '解除綁定 LINE' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('這是您唯一的登入方式');
  });
});
