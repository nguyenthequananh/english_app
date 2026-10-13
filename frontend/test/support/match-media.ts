import { act } from '@testing-library/react';
import { vi } from 'vitest';

/**
 * `matchMedia` điều khiển được: `set(query, true)` đổi kết quả VÀ bắn sự kiện `change` cho mọi nơi đang nghe
 * (useMediaQuery, useTheme). Query không khai coi như không khớp, giống giả lập mặc định trong setup.ts.
 * Dùng spyOn nên `restoreAllMocks` sau mỗi test tự trả lại giả lập mặc định.
 */
export function controlMatchMedia(initial: Record<string, boolean> = {}) {
  const state: Record<string, boolean> = { ...initial };
  const listeners = new Map<string, Set<(e: MediaQueryListEvent) => void>>();
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
    const set = listeners.get(query) ?? new Set();
    listeners.set(query, set);
    return {
      get matches() {
        return state[query] ?? false;
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, l: (e: MediaQueryListEvent) => void) => set.add(l),
      removeEventListener: (_type: string, l: (e: MediaQueryListEvent) => void) => set.delete(l),
      addListener: (l: (e: MediaQueryListEvent) => void) => set.add(l),
      removeListener: (l: (e: MediaQueryListEvent) => void) => set.delete(l),
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  });
  return {
    set(query: string, matches: boolean) {
      state[query] = matches;
      act(() => {
        listeners.get(query)?.forEach((l) => l({ matches, media: query } as MediaQueryListEvent));
      });
    },
  };
}
