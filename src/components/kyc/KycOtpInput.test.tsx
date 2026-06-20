/**
 * KycOtpInput.test.tsx
 *
 * Tests: render, interaction (typing, backspace, navigation), error state.
 * Uses controlled wrapper to allow state updates.
 */

import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KycOtpInput } from './KycOtpInput';

// ── Controlled wrapper for stateful tests ─────────────────────────────────

function ControlledOtp({ onChange }: { onChange?: (v: string) => void }) {
  const [val, setVal] = useState('');
  const handleChange = (v: string) => {
    setVal(v);
    onChange?.(v);
  };
  return <KycOtpInput value={val} onChange={handleChange} />;
}

// ── Render tests ─────────────────────────────────────────────────────────────

describe('KycOtpInput — render', () => {
  it('renders a group with aria-label "6 位驗證碼"', () => {
    render(<ControlledOtp />);
    expect(screen.getByRole('group', { name: '6 位驗證碼' })).toBeInTheDocument();
  });

  it('renders 6 inputs with aria-labels for each position', () => {
    render(<ControlledOtp />);
    for (let i = 1; i <= 6; i++) {
      // inputs use aria-label (not a <label> element)
      expect(screen.getByLabelText(`第 ${i} 位驗證碼`)).toBeInTheDocument();
    }
  });

  it('pre-fills value from external prop', () => {
    const onChange = vi.fn();
    render(<KycOtpInput value="12" onChange={onChange} />);
    const input1 = screen.getByLabelText('第 1 位驗證碼') as HTMLInputElement;
    const input2 = screen.getByLabelText('第 2 位驗證碼') as HTMLInputElement;
    const input3 = screen.getByLabelText('第 3 位驗證碼') as HTMLInputElement;
    expect(input1.value).toBe('1');
    expect(input2.value).toBe('2');
    expect(input3.value).toBe('');
  });

  it('is disabled when disabled=true', () => {
    render(<KycOtpInput value="" onChange={vi.fn()} disabled={true} />);
    // Use role="textbox" to get only the input elements, not the group wrapper
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    expect(inputs.every((inp) => inp.disabled)).toBe(true);
  });
});

// ── Interaction tests ────────────────────────────────────────────────────────

describe('KycOtpInput — interaction', () => {
  it('calls onChange when a digit is typed', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ControlledOtp onChange={onChange} />);

    await user.type(screen.getByLabelText('第 1 位驗證碼'), '5');
    expect(onChange).toHaveBeenCalledWith('5');
  });

  it('does not call onChange for non-digit characters', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ControlledOtp onChange={onChange} />);

    await user.type(screen.getByLabelText('第 1 位驗證碼'), 'a');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('builds a 6-char string as user types all 6 digits', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ControlledOtp onChange={onChange} />);

    // Type into the first box — subsequent focus advances are handled internally
    const input1 = screen.getByLabelText('第 1 位驗證碼');
    await user.click(input1);
    await user.keyboard('1');
    // Focus moves to next input; type remaining digits
    await user.keyboard('2');
    await user.keyboard('3');
    await user.keyboard('4');
    await user.keyboard('5');
    await user.keyboard('6');

    // Last onChange call should have all 6 digits
    const calls = onChange.mock.calls.map((c: [string]) => c[0]);
    expect(calls[calls.length - 1]).toBe('123456');
  });
});

// ── Error/edge-case tests ────────────────────────────────────────────────────

describe('KycOtpInput — error states', () => {
  it('renders empty inputs when value is empty string', () => {
    render(<KycOtpInput value="" onChange={vi.fn()} />);
    // Use role="textbox" to get only the input elements (not the group aria-label wrapper)
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    expect(inputs).toHaveLength(6);
    expect(inputs.every((inp) => inp.value === '')).toBe(true);
  });
});
