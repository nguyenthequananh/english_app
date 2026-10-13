import { useSyncExternalStore } from 'react';

/** Theo dõi một media query. Môi trường không có `matchMedia` (jsdom) coi như không khớp. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => undefined;
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false),
    () => false,
  );
}

/** Mốc bố cục web (sidebar thay tab bar). Khớp `lg:` của Tailwind. */
export const DESKTOP_QUERY = '(min-width: 1024px)';
