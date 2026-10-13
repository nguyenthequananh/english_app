import { useEffect, useState, type ReactNode } from 'react';
import { IconLink } from './icon-button';
import { cn } from './cn';

/** true khi trang đã cuộn khỏi đỉnh — để thanh trên chỉ hiện vật liệu kính khi có nội dung chạy bên dưới. */
function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return scrolled;
}

/**
 * Thanh trên của màn tập trung: nút quay lại tròn bên trái, tiêu đề + phụ đề ở giữa, slot phải.
 * Dính đỉnh, chừa safe-area; ở đỉnh trang thì trong suốt, cuộn xuống thì thành kính mờ + đường viền mảnh
 * (hiệu ứng mép cuộn kiểu iOS thay vì kẻ cứng). Đặt `data-top-bar` để FocusShell cho nó tràn hết chiều ngang.
 */
export function TopBar({ title, subtitle, back, backLabel = 'Quay lại', trailing }: {
  title: string;
  subtitle?: string;
  back: string;
  backLabel?: string;
  trailing?: ReactNode;
}) {
  const scrolled = useScrolled();
  return (
    <header
      data-top-bar=""
      data-scrolled={scrolled ? '' : undefined}
      className={cn(
        'sticky top-0 z-30 pt-safe transition-[background-color,box-shadow,backdrop-filter] duration-200',
        scrolled ? 'material shadow-[0_1px_0_var(--separator)]' : 'bg-transparent',
      )}
    >
      <div className="mx-auto grid min-h-[3.75rem] w-full max-w-[720px] grid-cols-[minmax(2.75rem,1fr)_minmax(0,auto)_minmax(2.75rem,1fr)] items-center gap-2 px-4 py-2">
        <IconLink to={back} icon="back" label={backLabel} />
        <div className="min-w-0 text-center">
          <h1 className="truncate text-[1.0625rem] font-bold leading-tight tracking-[-0.01em] text-text">{title}</h1>
          {subtitle && <p className="mt-0.5 truncate text-[0.8125rem] leading-tight text-text-3">{subtitle}</p>}
        </div>
        <div className="flex justify-end">{trailing}</div>
      </div>
    </header>
  );
}
