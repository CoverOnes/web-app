import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PipelineCard } from './PipelineCard';
import type { Bid } from '../../lib/api/coverones';

// ─── Fixtures ─────────────────────────────────────────────────────────────

function makeBid(overrides: Partial<Bid> = {}): Bid {
  return {
    id: 'bid-0001-0000-0000-000000000000',
    listingId: 'lst-0001-0000-0000-000000000000',
    bidderUserId: 'usr-0001',
    amount: '1200000',
    currency: 'TWD',
    message: '我們有豐富經驗',
    status: 'PENDING',
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('PipelineCard — status-specific render', () => {
  it('renders PENDING card with "評估中" label', () => {
    render(<PipelineCard bid={makeBid({ status: 'PENDING' })} />);
    expect(screen.getByText('評估中')).toBeInTheDocument();
  });

  it('renders ACCEPTED card with "✓ 中標" label', () => {
    render(<PipelineCard bid={makeBid({ status: 'ACCEPTED' })} />);
    expect(screen.getByText('✓ 中標')).toBeInTheDocument();
  });

  it('renders REJECTED card with "未中標" label', () => {
    render(<PipelineCard bid={makeBid({ status: 'REJECTED' })} />);
    expect(screen.getByText('未中標')).toBeInTheDocument();
  });

  it('renders WITHDRAWN card with "已撤回" label', () => {
    render(<PipelineCard bid={makeBid({ status: 'WITHDRAWN' })} />);
    expect(screen.getByText('已撤回')).toBeInTheDocument();
  });

  it('renders the bid amount formatted with toLocaleString', () => {
    render(<PipelineCard bid={makeBid({ amount: '1200000', currency: 'TWD' })} />);
    // Amount must appear exactly once (no duplicate rendering).
    const matches = screen.getAllByText(/TWD.*1,200,000|1,200,000.*TWD/);
    // Title line shows "TWD 1,200,000"; only that one instance should be present.
    expect(matches.length).toBeGreaterThanOrEqual(1);
    // Verify no second standalone green-meta duplicate (the old double-render bug).
    // The amount text node in the title div and the meta span were identical —
    // after the fix only the title div renders the amount.
    const amountNodes = screen.getAllByText(/1,200,000/);
    expect(amountNodes).toHaveLength(1);
  });
});

describe('PipelineCard — isSelected visual state', () => {
  it('has aria-pressed=false when not selected', () => {
    render(<PipelineCard bid={makeBid()} isSelected={false} />);
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-pressed', 'false');
  });

  it('has aria-pressed=true when selected', () => {
    render(<PipelineCard bid={makeBid()} isSelected={true} />);
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('PipelineCard — interaction', () => {
  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<PipelineCard bid={makeBid()} onClick={handleClick} />);
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when Enter key is pressed', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<PipelineCard bid={makeBid()} onClick={handleClick} />);
    screen.getByRole('button').focus();
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
