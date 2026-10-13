import type { ReactNode } from 'react';

/**
 * Gợi ý phím tắt cạnh nhãn nút ("Lật thẻ Space", "Quên 1"). Chỉ hiện từ `lg` (máy có bàn phím) và ẩn với trình đọc màn hình —
 * tên nút giữ nguyên. Nền pha từ `currentColor` nên hợp với mọi tông nút.
 */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      aria-hidden="true"
      className="hidden min-w-5 items-center justify-center rounded-md bg-[color-mix(in_srgb,currentColor_14%,transparent)] px-1.5 font-sans text-xs font-semibold leading-5 lg:inline-flex"
    >
      {children}
    </kbd>
  );
}
