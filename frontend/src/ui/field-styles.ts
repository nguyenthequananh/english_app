import { cn } from './cn';

/** Kiểu chung cho ô nhập/select: nền xám nhẹ, focus thì nổi nền trắng + vòng nhấn. */
export const fieldControl = cn(
  'block w-full min-h-12 rounded-control border border-transparent bg-surface-2 px-4 text-text',
  'placeholder:text-text-3 transition-[background-color,border-color,box-shadow] duration-(--duration-press)',
  'focus:border-accent focus:bg-surface focus:outline-none focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_22%,transparent)]',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'aria-[invalid=true]:border-danger',
);

export const fieldLabel = 'mb-1.5 block px-1 text-[0.875rem] font-semibold text-text-2';
export const fieldHint = 'mt-1.5 px-1 text-[0.8125rem] leading-snug text-text-3';
export const fieldError = 'mt-1.5 px-1 text-[0.8125rem] font-medium leading-snug text-danger-text';
