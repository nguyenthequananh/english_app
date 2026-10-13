import { useTheme } from '../../config/theme';
import { Icon } from './icons';
import { iconButtonStyles } from './icon-button';
import { cn } from './cn';

/**
 * Nút nhanh sáng/tối: chuyển sang chế độ NGƯỢC với giao diện đang hiển thị (kể cả khi đang Tự động) và lưu
 * lựa chọn đó. Icon là đích đến (đang sáng → mặt trăng), khớp với nhãn "Chuyển sang giao diện tối".
 * Muốn quay lại Tự động: Cá nhân → Giao diện.
 *
 * `round` — nút tròn 44px như IconButton (tiêu đề trang); `plain` — ô vuông bo góc không nền cho sidebar.
 */
export function ThemeToggle({ appearance = 'round', className }: { appearance?: 'round' | 'plain'; className?: string }) {
  const { resolved, setPreference } = useTheme();
  const next = resolved === 'dark' ? 'light' : 'dark';
  const label = next === 'dark' ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng';
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setPreference(next)}
      className={cn(
        appearance === 'round'
          ? iconButtonStyles
          : 'pressable focus-ring inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-text-2 hover:bg-fill hover:text-text',
        className,
      )}
    >
      <Icon name={next === 'dark' ? 'moon' : 'sun'} size={20} strokeWidth={2} />
    </button>
  );
}
