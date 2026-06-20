import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { __resetToasts } from '../components/notifications/useToast';

afterEach(() => {
  cleanup();
  localStorage.clear();
  // Reset module-level toast singleton so tests don't bleed into each other
  __resetToasts();
});
