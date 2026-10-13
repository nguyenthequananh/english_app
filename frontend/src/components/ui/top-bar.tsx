import { useState, type ReactNode } from 'react';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import { IconLink } from './icon-button';

/* Quãng cuộn (px) để lớp kính hiện đủ: vật liệu "tới" dần theo nội dung trượt vào dưới thanh, không bật phụt. */
const MATERIALIZE_DISTANCE = 24;

/**
 * Thanh trên của màn tập trung: nút quay lại tròn bên trái, tiêu đề + phụ đề ở giữa, slot phải.
 * Dính đỉnh, chừa safe-area. Ở đỉnh trang thì trong suốt; cuộn xuống thì lớp kính mờ hiện dần theo quãng cuộn
 * 0–24px (độ mờ của lớp gắn thẳng vào vị trí cuộn, không animate `backdrop-filter`), mép dưới là bóng mềm thay
 * cho đường kẻ cứng (hiệu ứng mép cuộn kiểu iOS). Đặt `data-top-bar` để FocusShell cho nó tràn hết chiều ngang;
 * `data-scrolled` có mặt khi đã rời đỉnh.
 */
export function TopBar({ title, subtitle, back, backLabel = 'Quay lại', trailing }: {
  title: string;
  subtitle?: string;
  back: string;
  backLabel?: string;
  trailing?: ReactNode;
}) {
  const { scrollY } = useScroll();
  // Motion value → style trực tiếp: cuộn không làm React render lại từng khung hình.
  const materialOpacity = useTransform(scrollY, [0, MATERIALIZE_DISTANCE], [0, 1], { clamp: true });
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 4));

  return (
    <header
      data-top-bar=""
      data-scrolled={scrolled ? '' : undefined}
      className="sticky top-0 z-30 isolate pt-safe"
    >
      <motion.div
        aria-hidden="true"
        style={{ opacity: materialOpacity }}
        className="material pointer-events-none absolute inset-0 -z-10 shadow-[var(--shadow-scroll-edge)]"
      />
      <div className="mx-auto grid min-h-[3.75rem] w-full max-w-[720px] grid-cols-[minmax(2.75rem,1fr)_minmax(0,auto)_minmax(2.75rem,1fr)] items-center gap-2 px-4 py-2">
        <IconLink to={back} icon="back" label={backLabel} />
        <div className="min-w-0 text-center">
          <h1 className="truncate text-xl font-bold leading-tight text-text">{title}</h1>
          {subtitle && <p className="mt-0.5 truncate text-sm leading-tight font-medium text-text-2">{subtitle}</p>}
        </div>
        <div className="flex justify-end">{trailing}</div>
      </div>
    </header>
  );
}
