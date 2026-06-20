/**
 * MaintenancePage.test.tsx
 *
 * Tests:
 *   1. Renders the page heading
 *   2. Countdown timer elements are present (timer role)
 *   3. Progress bar has correct aria attributes
 *   4. Notify form submits and shows confirmation
 *   5. Live update log entries are rendered
 *   6. Error state: page renders without crashing (no API dependency)
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MaintenancePage from './MaintenancePage';

// Suppress console.info from the notify handler
vi.spyOn(console, 'info').mockImplementation(() => undefined);

function renderPage() {
  return render(
    <MemoryRouter>
      <MaintenancePage />
    </MemoryRouter>,
  );
}

describe('MaintenancePage', () => {
  it('renders the page heading', () => {
    renderPage();
    expect(screen.getByText(/升級平台/)).toBeInTheDocument();
    expect(screen.getByText(/讓 ChatOwl 變更好/)).toBeInTheDocument();
  });

  it('renders a countdown timer region', () => {
    renderPage();
    expect(screen.getByRole('timer', { name: /維護倒數計時/i })).toBeInTheDocument();
  });

  it('renders progress bar with correct aria attributes', () => {
    renderPage();
    const bar = screen.getByRole('progressbar', { name: /升級進度/i });
    expect(bar).toHaveAttribute('aria-valuenow', '68');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('notify form: submit shows confirmation', async () => {
    const user = userEvent.setup();
    renderPage();

    const emailInput = screen.getByRole('textbox', { name: /Email 地址/i });
    await user.type(emailInput, 'test@example.com');

    const submitBtn = screen.getByRole('button', { name: /完成時通知我/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/已登記，完成後將通知您/)).toBeInTheDocument();
    });
  });

  it('renders live update log entries', () => {
    renderPage();
    // The live update log should show specific timestamps
    expect(screen.getByText('11:42:18')).toBeInTheDocument();
    expect(screen.getByText('11:00:00')).toBeInTheDocument();
  });

  it('renders without crashing (no API calls needed)', () => {
    expect(() => renderPage()).not.toThrow();
  });
});
