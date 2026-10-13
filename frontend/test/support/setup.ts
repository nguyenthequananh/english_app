import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { resetApiMock } from './mock-api';

// jsdom không có matchMedia (sonner, motion, useMediaQuery cần). Giả lập: không media query nào khớp
// → bố cục điện thoại, không reduced-motion. Gán thẳng (không stubGlobal) để không bị gỡ sau mỗi test.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  resetApiMock();
});
