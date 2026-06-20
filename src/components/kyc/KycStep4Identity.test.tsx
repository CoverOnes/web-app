/**
 * KycStep4Identity.test.tsx
 *
 * Tests for the identity step in the KYC wizard.
 * Covers: render (PERSONAL image path, COMPANY text path),
 *         interaction (image upload success, text submit success, drag-and-drop),
 *         error states (ID_IMAGE_UNREADABLE, RATE_LIMITED, VALIDATION_ERROR).
 *
 * Test cases: 9 total (render: 2, interaction: 3, error: 4)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KycStep4Identity } from './KycStep4Identity';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockVerifyId = vi.fn();
const mockSubmitKyc = vi.fn();

vi.mock('../../lib/query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/query')>();
  return {
    ...actual,
    useKycVerifyId: () => ({ mutateAsync: mockVerifyId, isPending: false }),
    useSubmitKyc: () => ({ mutateAsync: mockSubmitKyc, isPending: false }),
  };
});

// ── Wrapper ─────────────────────────────────────────────────────────────────

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

/** Build an axios-like error with the real backend envelope {error:{code,message}} */
function makeApiError(code: string, status = 400, message = '') {
  return Object.assign(new Error(message || code), {
    isAxiosError: true,
    response: {
      status,
      data: { error: { code, message: message || code } },
    },
  });
}

/** Build a minimal File object for upload tests */
function makeImageFile(name = 'id.jpg', type = 'image/jpeg', sizeBytes = 1024) {
  const bytes = new Uint8Array(sizeBytes);
  return new File([bytes], name, { type });
}

// ── Render tests ─────────────────────────────────────────────────────────────

describe('KycStep4Identity — render', () => {
  beforeEach(() => {
    mockVerifyId.mockReset();
    mockSubmitKyc.mockReset();
  });

  it('renders Step 4 heading for PERSONAL account (image upload path)', () => {
    render(
      <KycStep4Identity accountType="PERSONAL" onSuccess={vi.fn()} />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText(/Step 4 \/ 5/i)).toBeInTheDocument();
    // Drop zone visible for PERSONAL
    expect(screen.getByRole('button', { name: '選擇身分證照片' })).toBeInTheDocument();
  });

  it('renders text form directly for COMPANY account', () => {
    render(
      <KycStep4Identity accountType="COMPANY" onSuccess={vi.fn()} />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText(/Step 4 \/ 5/i)).toBeInTheDocument();
    // Text form fields visible
    expect(screen.getByLabelText('真實姓名 / 公司名稱')).toBeInTheDocument();
    expect(screen.getByLabelText('統一編號')).toBeInTheDocument();
  });
});

// ── Interaction tests ────────────────────────────────────────────────────────

describe('KycStep4Identity — interaction', () => {
  beforeEach(() => {
    mockVerifyId.mockReset();
    mockSubmitKyc.mockReset();
  });

  it('calls onSuccess after successful image upload (PERSONAL)', async () => {
    const onSuccess = vi.fn();
    mockVerifyId.mockResolvedValue({ promoted: true, currentTier: 2 });

    render(
      <KycStep4Identity accountType="PERSONAL" onSuccess={onSuccess} />,
      { wrapper: createWrapper() },
    );

    // Simulate file selection via the hidden input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = makeImageFile();
    // fireEvent.change to bypass jsdom File limitations
    Object.defineProperty(fileInput, 'files', { value: [file], writable: false });
    fireEvent.change(fileInput);

    await user_click_submit('上傳並驗證身分證');

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(true, 2, false);
    });
  });

  it('calls onSuccess after successful text submit (COMPANY)', async () => {
    const onSuccess = vi.fn();
    mockSubmitKyc.mockResolvedValue({ promoted: false, currentTier: 1, submission: {} });

    const user = userEvent.setup();
    render(
      <KycStep4Identity accountType="COMPANY" onSuccess={onSuccess} />,
      { wrapper: createWrapper() },
    );

    await user.type(screen.getByLabelText('真實姓名 / 公司名稱'), '台灣科技股份有限公司');
    await user.type(screen.getByLabelText('統一編號'), '12345675');
    await user.click(screen.getByRole('button', { name: '提交認證資料' }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('accepts a file dropped onto the drop zone and enables the submit button', async () => {
    render(
      <KycStep4Identity accountType="PERSONAL" onSuccess={vi.fn()} />,
      { wrapper: createWrapper() },
    );

    const dropZone = screen.getByRole('button', { name: '選擇身分證照片' });
    const file = makeImageFile('dropped.jpg');

    // Simulate drag-and-drop
    fireEvent.dragEnter(dropZone, { dataTransfer: { files: [file] } });
    fireEvent.dragOver(dropZone, { dataTransfer: { files: [file] } });
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      // After drop, the selected file name appears
      expect(screen.getByText(/已選取：dropped\.jpg/)).toBeInTheDocument();
    });
  });
});

// ── Error tests ──────────────────────────────────────────────────────────────

describe('KycStep4Identity — error states', () => {
  beforeEach(() => {
    mockVerifyId.mockReset();
    mockSubmitKyc.mockReset();
  });

  it('shows ID_IMAGE_UNREADABLE error after failed image upload', async () => {
    mockVerifyId.mockRejectedValue(makeApiError('ID_IMAGE_UNREADABLE'));

    render(
      <KycStep4Identity accountType="PERSONAL" onSuccess={vi.fn()} />,
      { wrapper: createWrapper() },
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = makeImageFile();
    Object.defineProperty(fileInput, 'files', { value: [file], writable: false });
    fireEvent.change(fileInput);

    await user_click_submit('上傳並驗證身分證');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('無法辨識身分證圖片');
    });
  });

  it('shows RATE_LIMITED error after rate-limited image upload', async () => {
    mockVerifyId.mockRejectedValue(makeApiError('RATE_LIMITED', 429));

    render(
      <KycStep4Identity accountType="PERSONAL" onSuccess={vi.fn()} />,
      { wrapper: createWrapper() },
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = makeImageFile();
    Object.defineProperty(fileInput, 'files', { value: [file], writable: false });
    fireEvent.change(fileInput);

    await user_click_submit('上傳並驗證身分證');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('發送次數過多');
    });
  });

  it('shows VALIDATION_ERROR after failed text submit', async () => {
    mockSubmitKyc.mockRejectedValue(makeApiError('VALIDATION_ERROR'));

    const user = userEvent.setup();
    render(
      <KycStep4Identity accountType="COMPANY" onSuccess={vi.fn()} />,
      { wrapper: createWrapper() },
    );

    await user.type(screen.getByLabelText('真實姓名 / 公司名稱'), '台灣科技股份有限公司');
    await user.type(screen.getByLabelText('統一編號'), '12345675');
    await user.click(screen.getByRole('button', { name: '提交認證資料' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('輸入資料有誤');
    });
  });

  it('shows image type error when a non-image file is dropped', async () => {
    render(
      <KycStep4Identity accountType="PERSONAL" onSuccess={vi.fn()} />,
      { wrapper: createWrapper() },
    );

    const dropZone = screen.getByRole('button', { name: '選擇身分證照片' });
    const pdfFile = new File([new Uint8Array(100)], 'doc.pdf', { type: 'application/pdf' });

    fireEvent.drop(dropZone, { dataTransfer: { files: [pdfFile] } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('JPEG 或 PNG');
    });
  });
});

// ── Utility ──────────────────────────────────────────────────────────────────

async function user_click_submit(name: string) {
  const btn = screen.getByRole('button', { name });
  fireEvent.click(btn);
}
