import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MobileDrawer from './MobileDrawer';
import { useAuthStore, type AuthUser } from '../../store/authStore';

const mockUser: AuthUser = {
  id: 'u1',
  email: 'test@company.com',
  displayName: 'Drawer User',
  avatarUrl: null,
  accountType: 'PERSONAL',
  kycTier: 2,
  status: 'ACTIVE',
  emailVerified: true,
};

function renderDrawer(open: boolean, onClose = vi.fn()) {
  useAuthStore.setState({
    accessToken: 'access',
    refreshToken: 'refresh',
    user: mockUser,
    isAuthenticated: true,
    isHydrating: false,
  });
  return render(
    <MemoryRouter>
      <MobileDrawer open={open} onClose={onClose} />
    </MemoryRouter>,
  );
}

describe('MobileDrawer', () => {
  it('renders with role="dialog" when open', () => {
    renderDrawer(true);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDrawer(true, onClose);
    // Backdrop is aria-hidden, click it via direct handler test
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(backdrop).toBeTruthy();
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has translateX(0) transform when open', () => {
    renderDrawer(true);
    const dialog = screen.getByRole('dialog');
    expect(dialog.style.transform).toBe('translateX(0)');
  });

  it('has translateX(-100%) transform when closed', () => {
    renderDrawer(false);
    const dialog = screen.getByRole('dialog');
    expect(dialog.style.transform).toBe('translateX(-100%)');
  });

  it('renders the sidebar nav inside the drawer', () => {
    renderDrawer(true);
    // Sidebar renders brand
    expect(screen.getByText('CoverOnes')).toBeInTheDocument();
  });
});
