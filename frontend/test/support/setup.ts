import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { resetApiMock } from './mock-api';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  resetApiMock();
});
