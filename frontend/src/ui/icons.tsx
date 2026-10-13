import type { ReactNode } from 'react';
import type { IconName } from '../types/icon';
import { cn } from './cn';

export type { IconName } from '../types/icon';

/*
 * Icon SVG nội tuyến trên lưới 24×24, nét tròn, theo tinh thần SF Symbols.
 * Dùng currentColor nên màu theo chữ của phần tử cha. Không tải gì từ mạng.
 * `fillable` = phần thân có thể tô đặc (prop `filled`) cho trạng thái nhấn mạnh.
 */
const PATHS: Record<IconName, { body: ReactNode; fillable?: boolean }> = {
  home: {
    fillable: true,
    body: <path d="M4 10.2 12 3.8l8 6.4V19a1.8 1.8 0 0 1-1.8 1.8H15a.8.8 0 0 1-.8-.8v-4.4a1 1 0 0 0-1-1h-2.4a1 1 0 0 0-1 1V20a.8.8 0 0 1-.8.8H5.8A1.8 1.8 0 0 1 4 19z" />,
  },
  map: {
    fillable: true,
    body: (
      <>
        <path d="M3.5 6.6c0-.5.3-.9.8-1.1l4-1.6a2 2 0 0 1 1.5 0l4.4 1.8a2 2 0 0 0 1.5 0l3.2-1.3a.8.8 0 0 1 1.1.8v12.2c0 .5-.3.9-.8 1.1l-4 1.6a2 2 0 0 1-1.5 0l-4.4-1.8a2 2 0 0 0-1.5 0l-3.2 1.3a.8.8 0 0 1-1.1-.8z" />
        <path d="M9 3.9v14.3M15 5.8v14.3" fill="none" />
      </>
    ),
  },
  chart: {
    body: <path d="M5 20V13.5M10 20V9M15 20v-6.5M20 20V5" />,
  },
  person: {
    fillable: true,
    body: (
      <>
        <circle cx="12" cy="8" r="3.8" />
        <path d="M4.5 20.2c.6-3.6 3.7-6 7.5-6s6.9 2.4 7.5 6a.7.7 0 0 1-.7.8H5.2a.7.7 0 0 1-.7-.8z" />
      </>
    ),
  },
  play: {
    fillable: true,
    body: <path d="M8 5.3v13.4a1 1 0 0 0 1.5.9l10.7-6.7a1 1 0 0 0 0-1.8L9.5 4.4a1 1 0 0 0-1.5.9z" />,
  },
  back: { body: <path d="M15 4.5 7.5 12l7.5 7.5" /> },
  close: { body: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /> },
  check: { body: <path d="M5 12.8l4.4 4.4L19 7.2" /> },
  cross: { body: <path d="M7 7l10 10M17 7 7 17" /> },
  speaker: {
    body: (
      <>
        <path d="M4.5 9.2h2.8L11.5 5v14l-4.2-4.2H4.5a1 1 0 0 1-1-1V10.2a1 1 0 0 1 1-1z" />
        <path d="M15.3 9a4.2 4.2 0 0 1 0 6M18.2 6.2a8.2 8.2 0 0 1 0 11.6" />
      </>
    ),
  },
  book: {
    body: (
      <>
        <path d="M12 6.8C10.4 5.4 8.3 4.8 5.4 4.8H4.3a.8.8 0 0 0-.8.8v11.6c0 .4.4.8.8.8h1.1c2.9 0 5 .6 6.6 2" />
        <path d="M12 6.8c1.6-1.4 3.7-2 6.6-2h1.1c.4 0 .8.4.8.8v11.6c0 .4-.4.8-.8.8h-1.1c-2.9 0-5 .6-6.6 2z" />
      </>
    ),
  },
  headphones: {
    body: (
      <>
        <path d="M4 16.5V12a8 8 0 0 1 16 0v4.5" />
        <path d="M4 14.5h2.2a1.3 1.3 0 0 1 1.3 1.3v3a1.3 1.3 0 0 1-1.3 1.3h-.9A1.3 1.3 0 0 1 4 18.8zM20 14.5h-2.2a1.3 1.3 0 0 0-1.3 1.3v3a1.3 1.3 0 0 0 1.3 1.3h.9a1.3 1.3 0 0 0 1.3-1.3z" />
      </>
    ),
  },
  mic: {
    body: (
      <>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5.8 11a6.2 6.2 0 0 0 12.4 0M12 17.2V21M9 21h6" />
      </>
    ),
  },
  text: { body: <path d="M3.5 18.5 8 6.5l4.5 12M5.2 14.2h5.6M14.5 12.2a2.8 2.8 0 0 1 2.7-1.7c1.7 0 2.8 1 2.8 2.7v5.3M20 14.8h-2.6c-1.6 0-2.9.8-2.9 2s.9 1.9 2.2 1.9c1.9 0 3.3-1.2 3.3-3" /> },
  cards: {
    body: (
      <>
        <rect x="3.5" y="7.5" width="13" height="13" rx="2.6" />
        <path d="M7.5 4.5h10.4a2.6 2.6 0 0 1 2.6 2.6v10.4" />
      </>
    ),
  },
  search: { body: <path d="M10.8 17.6a6.8 6.8 0 1 0 0-13.6 6.8 6.8 0 0 0 0 13.6zM20 20l-4.4-4.4" /> },
  plus: { body: <path d="M12 5v14M5 12h14" /> },
  flame: {
    fillable: true,
    body: <path d="M12 21c3.9 0 6.8-2.7 6.8-6.5 0-3.4-2.1-5.6-3.6-7.2-.5-.5-1.3-.2-1.3.5 0 1.1-.5 2.1-1.4 2.6C12.5 7.6 11.2 5 9 3.3c-.5-.4-1.2 0-1.2.6.1 2.6-1.4 4.4-2.6 6.2C4.5 11.3 4.2 13 4.2 14.5c0 3.8 3.4 6.5 7.8 6.5z" />,
  },
  clock: { body: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3 2" /> },
  star: {
    fillable: true,
    body: <path d="M11.1 3.9a1 1 0 0 1 1.8 0l2 4.1 4.5.7a1 1 0 0 1 .6 1.7l-3.3 3.2.8 4.5a1 1 0 0 1-1.5 1L12 16.9l-4 2.2a1 1 0 0 1-1.5-1l.8-4.5L4 10.4a1 1 0 0 1 .6-1.7l4.5-.7z" />,
  },
  lock: {
    body: (
      <>
        <rect x="5" y="10.5" width="14" height="10" rx="2.6" />
        <path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7" />
      </>
    ),
  },
  'chevron-right': { body: <path d="M9.5 5.5 16 12l-6.5 6.5" /> },
  settings: {
    body: (
      <>
        <path d="M4 7.5h9M18 7.5h2M4 16.5h2M11 16.5h9" />
        <circle cx="15.5" cy="7.5" r="2.5" />
        <circle cx="8.5" cy="16.5" r="2.5" />
      </>
    ),
  },
  download: { body: <path d="M12 4v11M7.5 10.8 12 15.3l4.5-4.5M5 19.5h14" /> },
  upload: { body: <path d="M12 15.3V4.3M7.5 8.5 12 4l4.5 4.5M5 19.5h14" /> },
  power: { body: <path d="M12 3.5v8M7 6.3a7.5 7.5 0 1 0 10 0" /> },
  sparkle: {
    fillable: true,
    body: (
      <>
        <path d="M10.5 4.5c.6 3.9 2.4 5.8 6.3 6.4a.4.4 0 0 1 0 .8c-3.9.6-5.7 2.5-6.3 6.4a.4.4 0 0 1-.8 0c-.6-3.9-2.4-5.8-6.3-6.4a.4.4 0 0 1 0-.8c3.9-.6 5.7-2.5 6.3-6.4a.4.4 0 0 1 .8 0z" />
        <path d="M18.5 3v4M16.5 5h4M18 16.5v3M16.5 18h3" fill="none" />
      </>
    ),
  },
};

export function Icon({ name, size = 22, className, filled = false, strokeWidth = 1.85 }: {
  name: IconName;
  size?: number;
  className?: string;
  /** Tô đặc phần thân (chỉ có tác dụng với icon có thân kín: home, map, person, play, flame, star, sparkle). */
  filled?: boolean;
  strokeWidth?: number;
}) {
  const def = PATHS[name];
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled && def.fillable ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0', className)}
      data-icon={name}
    >
      {def.body}
    </svg>
  );
}
