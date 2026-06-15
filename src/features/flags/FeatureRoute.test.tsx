import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FeatureRoute } from './FeatureRoute';
import { isFeatureEnabled } from './featureFlags';

function renderRoute(flag: Parameters<typeof FeatureRoute>[0]['flag'], feature: string) {
  return render(
    <MemoryRouter>
      <FeatureRoute flag={flag} feature={feature}>
        <div>Real Page</div>
      </FeatureRoute>
    </MemoryRouter>,
  );
}

describe('featureFlags — KEEP vs TBD defaults', () => {
  it('KEEP features are enabled', () => {
    expect(isFeatureEnabled('auth')).toBe(true);
    expect(isFeatureEnabled('jobBoard')).toBe(true);
    expect(isFeatureEnabled('bids')).toBe(true);
    expect(isFeatureEnabled('contracts')).toBe(true);
    // Enabled: Settings hosts the OAuth social-account binding section (社群帳號綁定).
    expect(isFeatureEnabled('avatarSettings')).toBe(true);
  });

  it('TBD features are disabled', () => {
    expect(isFeatureEnabled('chat')).toBe(false);
    expect(isFeatureEnabled('contacts')).toBe(false);
    expect(isFeatureEnabled('aiMatching')).toBe(false);
    expect(isFeatureEnabled('payments')).toBe(false);
    expect(isFeatureEnabled('kycOnboarding')).toBe(false);
    expect(isFeatureEnabled('admin')).toBe(false);
  });

  it('avatarSettings is enabled (enabled in P2 Settings redesign)', () => {
    expect(isFeatureEnabled('avatarSettings')).toBe(true);
  });
});

describe('FeatureRoute — gating behaviour', () => {
  it('renders ComingSoon placeholder for a disabled (TBD) feature', () => {
    renderRoute('chat', '聊天');
    expect(screen.getByText('聊天')).toBeInTheDocument();
    expect(screen.getByText(/Coming soon/i)).toBeInTheDocument();
    expect(screen.queryByText('Real Page')).not.toBeInTheDocument();
  });

  it('renders the real page for an enabled (KEEP) feature', () => {
    renderRoute('jobBoard', '案件看板');
    expect(screen.getByText('Real Page')).toBeInTheDocument();
    expect(screen.queryByText(/Coming soon/i)).not.toBeInTheDocument();
  });
});
